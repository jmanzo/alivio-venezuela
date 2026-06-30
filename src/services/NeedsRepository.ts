import { Context, Effect, Layer, Schema } from "effect";
import { DatabaseError, NeedNotFoundError } from "@/domain/errors";
import {
  Need,
  type CreateNeedRequest,
  type NeedFilters,
  type NeedStatus,
} from "@/domain/Need";
import { Supabase } from "./Supabase";

export interface NeedsRepositoryShape {
  /** All needs, sorted critical-first then most-recent-first. */
  readonly list: (
    filters?: NeedFilters,
  ) => Effect.Effect<ReadonlyArray<Need>, DatabaseError>;
  /** Open / in-progress needs of a category (used for duplicate detection). */
  readonly listActiveByCategory: (
    category: Need["category"],
  ) => Effect.Effect<ReadonlyArray<Need>, DatabaseError>;
  /** Insert a new need (always created as `open`). */
  readonly create: (
    request: CreateNeedRequest,
  ) => Effect.Effect<Need, DatabaseError>;
  /** Transition a need's status and record an audit row. */
  readonly updateStatus: (
    id: string,
    status: NeedStatus,
    changedBy?: string | null,
  ) => Effect.Effect<Need, DatabaseError | NeedNotFoundError>;
}

export class NeedsRepository extends Context.Tag("NeedsRepository")<
  NeedsRepository,
  NeedsRepositoryShape
>() {}

const decodeNeed = Schema.decodeUnknown(Need);
const decodeNeeds = Schema.decodeUnknown(Schema.Array(Need));

/** Wraps a Supabase promise, mapping rejections to a typed DatabaseError. */
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

export const NeedsRepositoryLive = Layer.effect(
  NeedsRepository,
  Effect.gen(function* () {
    const sb = yield* Supabase;

    const decodeOne = (row: unknown) =>
      decodeNeed(row).pipe(
        Effect.mapError(
          (cause) =>
            new DatabaseError({ message: "Failed to decode need row", cause }),
        ),
      );

    const decodeMany = (rows: unknown) =>
      decodeNeeds(rows).pipe(
        Effect.mapError(
          (cause) =>
            new DatabaseError({ message: "Failed to decode need rows", cause }),
        ),
      );

    return NeedsRepository.of({
      list: (filters) =>
        Effect.gen(function* () {
          let query = sb
            .from("needs")
            .select("*")
            .order("urgency", { ascending: true })
            .order("created_at", { ascending: false });

          if (filters?.category) query = query.eq("category", filters.category);
          if (filters?.status) query = query.eq("status", filters.status);

          const rows = yield* runQuery("list needs", () => query);
          return yield* decodeMany(rows);
        }),

      listActiveByCategory: (category) =>
        Effect.gen(function* () {
          const rows = yield* runQuery("list active needs", () =>
            sb
              .from("needs")
              .select("*")
              .eq("category", category)
              .in("status", ["open", "in_progress"]),
          );
          return yield* decodeMany(rows);
        }),

      create: (request) =>
        Effect.gen(function* () {
          const row = yield* runQuery("create need", () =>
            sb
              .from("needs")
              .insert({
                category: request.category,
                description: request.description,
                urgency: request.urgency,
                lat: request.lat,
                lng: request.lng,
                location_label: request.locationLabel,
                reporter_contact: request.reporterContact ?? null,
                status: "open",
              })
              .select("*")
              .single(),
          );
          return yield* decodeOne(row);
        }),

      updateStatus: (id, status, changedBy) =>
        Effect.gen(function* () {
          // Read current status first so the audit trail captures the transition.
          const current = yield* runQuery("read need", () =>
            sb.from("needs").select("status").eq("id", id).maybeSingle(),
          );
          if (!current) {
            return yield* Effect.fail(new NeedNotFoundError({ id }));
          }

          const updated = yield* runQuery("update need status", () =>
            sb
              .from("needs")
              .update({ status })
              .eq("id", id)
              .select("*")
              .single(),
          );

          // Best-effort audit row; never fail the user action over the log.
          yield* runQuery("insert status update", () =>
            sb.from("status_updates").insert({
              need_id: id,
              old_status: (current as { status: NeedStatus }).status,
              new_status: status,
              changed_by: changedBy ?? null,
            }),
          ).pipe(Effect.ignore);

          return yield* decodeOne(updated);
        }),
    });
  }),
);
