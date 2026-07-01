import { Context, Effect, Layer, Schema } from "effect";
import {
  CentroAcopio,
  type CentroSummary,
  type RegisterCentroRequest,
  type RegistrationStatus,
} from "@/domain/Centro";
import { AuthError, DatabaseError, NotFoundError } from "@/domain/errors";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { Supabase } from "./Supabase";

export interface CentrosRepositoryShape {
  /** Approved (publicly visible) centros with a small board summary each. */
  readonly listApprovedSummaries: () => Effect.Effect<
    ReadonlyArray<CentroSummary>,
    DatabaseError
  >;
  /** Approved centros only (for the login picker). */
  readonly listApproved: () => Effect.Effect<
    ReadonlyArray<CentroAcopio>,
    DatabaseError
  >;
  /** Every centro regardless of status (super-admin view). */
  readonly listAll: () => Effect.Effect<
    ReadonlyArray<CentroAcopio>,
    DatabaseError
  >;
  /** A single approved centro by its public slug. */
  readonly getApprovedBySlug: (
    slug: string,
  ) => Effect.Effect<CentroAcopio, DatabaseError | NotFoundError>;
  /** Create a pending centro; hashes the chosen admin password. */
  readonly register: (
    request: RegisterCentroRequest,
  ) => Effect.Effect<CentroAcopio, DatabaseError>;
  /** Super-admin transition of a centro's registration status. */
  readonly setRegistrationStatus: (
    id: string,
    status: RegistrationStatus,
  ) => Effect.Effect<CentroAcopio, DatabaseError | NotFoundError>;
  /** Verify centro-admin credentials; only approved centros can log in. */
  readonly authenticate: (
    id: string,
    password: string,
  ) => Effect.Effect<CentroAcopio, DatabaseError | AuthError>;
}

export class CentrosRepository extends Context.Tag("CentrosRepository")<
  CentrosRepository,
  CentrosRepositoryShape
>() {}

const decodeCentro = Schema.decodeUnknown(CentroAcopio);
const decodeCentros = Schema.decodeUnknown(Schema.Array(CentroAcopio));

// Columns exposed to the app: the password hash is deliberately excluded.
const PUBLIC_COLUMNS =
  "id,name,slug,address_label,lat,lng,contact_name,contact_phone,registration_status,created_at,approved_at";

const runQuery = <A>(
  label: string,
  thunk: () => PromiseLike<{ data: A; error: { message: string } | null }>,
) =>
  Effect.tryPromise({
    try: async () => {
      const { data, error } = await thunk();
      if (error) throw new Error(error.message);
      return data;
    },
    catch: (cause) =>
      new DatabaseError({
        message: `${label} failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        cause,
      }),
  });

export const CentrosRepositoryLive = Layer.effect(
  CentrosRepository,
  Effect.gen(function* () {
    const sb = yield* Supabase;

    const decodeOne = (row: unknown) =>
      decodeCentro(row).pipe(
        Effect.mapError(
          (cause) =>
            new DatabaseError({ message: "Failed to decode centro", cause }),
        ),
      );
    const decodeMany = (rows: unknown) =>
      decodeCentros(rows).pipe(
        Effect.mapError(
          (cause) =>
            new DatabaseError({ message: "Failed to decode centros", cause }),
        ),
      );

    const listApproved = () =>
      Effect.gen(function* () {
        const rows = yield* runQuery("list approved centros", () =>
          sb
            .from("centros_acopio")
            .select(PUBLIC_COLUMNS)
            .eq("registration_status", "approved")
            .order("name"),
        );
        return yield* decodeMany(rows);
      });

    return CentrosRepository.of({
      listApproved,

      listAll: () =>
        Effect.gen(function* () {
          const rows = yield* runQuery("list all centros", () =>
            sb
              .from("centros_acopio")
              .select(PUBLIC_COLUMNS)
              .order("created_at", { ascending: false }),
          );
          return yield* decodeMany(rows);
        }),

      getApprovedBySlug: (slug) =>
        Effect.gen(function* () {
          const row = yield* runQuery("get centro by slug", () =>
            sb
              .from("centros_acopio")
              .select(PUBLIC_COLUMNS)
              .eq("slug", slug)
              .eq("registration_status", "approved")
              .maybeSingle(),
          );
          if (!row) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "centro", id: slug }),
            );
          }
          return yield* decodeOne(row);
        }),

      listApprovedSummaries: () =>
        Effect.gen(function* () {
          const centros = yield* listApproved();
          if (centros.length === 0) return [];

          const ids = centros.map((c) => c.id);
          const rows = yield* runQuery("list statuses for summaries", () =>
            sb
              .from("product_status")
              .select("centro_id,status,updated_at")
              .in("centro_id", ids),
          );

          const stats = new Map<
            string,
            {
              critico: number;
              necesita_mas: number;
              tracked: number;
              lastUpdated: string | null;
            }
          >();
          for (const raw of (rows ?? []) as ReadonlyArray<{
            centro_id: string;
            status: string;
            updated_at: string;
          }>) {
            const s = stats.get(raw.centro_id) ?? {
              critico: 0,
              necesita_mas: 0,
              tracked: 0,
              lastUpdated: null,
            };
            s.tracked += 1;
            if (raw.status === "critico") s.critico += 1;
            if (raw.status === "necesita_mas") s.necesita_mas += 1;
            if (!s.lastUpdated || raw.updated_at > s.lastUpdated)
              s.lastUpdated = raw.updated_at;
            stats.set(raw.centro_id, s);
          }

          return centros.map((centro) => {
            const s = stats.get(centro.id);
            return {
              centro,
              criticoCount: s?.critico ?? 0,
              necesitaMasCount: s?.necesita_mas ?? 0,
              trackedCount: s?.tracked ?? 0,
              lastUpdated: s?.lastUpdated ?? null,
            } satisfies CentroSummary;
          });
        }),

      register: (request) =>
        Effect.gen(function* () {
          const slug = `${slugify(request.name)}-${Math.random().toString(36).slice(2, 6)}`;
          const row = yield* runQuery("register centro", () =>
            sb
              .from("centros_acopio")
              .insert({
                name: request.name,
                slug,
                address_label: request.addressLabel,
                lat: request.lat,
                lng: request.lng,
                contact_name: request.contactName ?? null,
                contact_phone: request.contactPhone ?? null,
                admin_password_hash: hashPassword(request.password),
                registration_status: "pending",
              })
              .select(PUBLIC_COLUMNS)
              .single(),
          );
          return yield* decodeOne(row);
        }),

      setRegistrationStatus: (id, status) =>
        Effect.gen(function* () {
          const row = yield* runQuery("set registration status", () =>
            sb
              .from("centros_acopio")
              .update({
                registration_status: status,
                approved_at: status === "approved" ? new Date().toISOString() : null,
              })
              .eq("id", id)
              .select(PUBLIC_COLUMNS)
              .maybeSingle(),
          );
          if (!row) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "centro", id }),
            );
          }
          return yield* decodeOne(row);
        }),

      authenticate: (id, password) =>
        Effect.gen(function* () {
          const row = yield* runQuery("read centro credentials", () =>
            sb
              .from("centros_acopio")
              .select(`${PUBLIC_COLUMNS},admin_password_hash`)
              .eq("id", id)
              .maybeSingle(),
          );
          const record = row as
            | (Record<string, unknown> & { admin_password_hash: string })
            | null;
          if (!record) {
            return yield* Effect.fail(
              new AuthError({ message: "Centro o clave inválida." }),
            );
          }
          if (record.registration_status !== "approved") {
            return yield* Effect.fail(
              new AuthError({
                message: "Este centro aún no ha sido aprobado.",
              }),
            );
          }
          if (!verifyPassword(password, record.admin_password_hash)) {
            return yield* Effect.fail(
              new AuthError({ message: "Centro o clave inválida." }),
            );
          }
          const { admin_password_hash: _hash, ...publicRow } = record;
          return yield* decodeOne(publicRow);
        }),
    });
  }),
);
