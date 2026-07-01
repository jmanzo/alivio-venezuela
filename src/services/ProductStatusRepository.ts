import { Context, Effect, Layer, Schema } from "effect";
import { ProductStatus, type StockStatus } from "@/domain/Centro";
import { DatabaseError } from "@/domain/errors";
import { Supabase } from "./Supabase";

export interface ProductStatusRepositoryShape {
  /** All product statuses set by a centro. */
  readonly listByCentro: (
    centroId: string,
  ) => Effect.Effect<ReadonlyArray<ProductStatus>, DatabaseError>;
  /** Insert or update the status of one product for one centro. */
  readonly upsert: (
    centroId: string,
    productId: string,
    status: StockStatus,
    updatedBy?: string | null,
  ) => Effect.Effect<ProductStatus, DatabaseError>;
}

export class ProductStatusRepository extends Context.Tag(
  "ProductStatusRepository",
)<ProductStatusRepository, ProductStatusRepositoryShape>() {}

const decodeMany = Schema.decodeUnknown(Schema.Array(ProductStatus));
const decodeOneSchema = Schema.decodeUnknown(ProductStatus);

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

export const ProductStatusRepositoryLive = Layer.effect(
  ProductStatusRepository,
  Effect.gen(function* () {
    const sb = yield* Supabase;

    const decodeOne = (row: unknown) =>
      decodeOneSchema(row).pipe(
        Effect.mapError(
          (cause) =>
            new DatabaseError({
              message: "Failed to decode product status",
              cause,
            }),
        ),
      );

    return ProductStatusRepository.of({
      listByCentro: (centroId) =>
        Effect.gen(function* () {
          const rows = yield* runQuery("list product statuses", () =>
            sb.from("product_status").select("*").eq("centro_id", centroId),
          );
          return yield* decodeMany(rows).pipe(
            Effect.mapError(
              (cause) =>
                new DatabaseError({
                  message: "Failed to decode product statuses",
                  cause,
                }),
            ),
          );
        }),

      upsert: (centroId, productId, status, updatedBy) =>
        Effect.gen(function* () {
          const row = yield* runQuery("upsert product status", () =>
            sb
              .from("product_status")
              .upsert(
                {
                  centro_id: centroId,
                  product_id: productId,
                  status,
                  updated_by: updatedBy ?? null,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "centro_id,product_id" },
              )
              .select("*")
              .single(),
          );
          return yield* decodeOne(row);
        }),
    });
  }),
);
