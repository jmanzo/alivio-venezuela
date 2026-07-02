import { Context, Effect, Layer, Schema } from "effect";
import { Category, type CreateProductRequest, Product } from "@/domain/Catalog";
import { DatabaseError } from "@/domain/errors";
import { Supabase } from "./Supabase";

export interface CatalogRepositoryShape {
  /** All categories, ordered by `sortOrder`. */
  readonly listCategories: () => Effect.Effect<
    ReadonlyArray<Category>,
    DatabaseError
  >;
  /** All products, ordered by `sortOrder`. */
  readonly listProducts: () => Effect.Effect<
    ReadonlyArray<Product>,
    DatabaseError
  >;
  /** Add a product to the shared catalog (appended after the last one). */
  readonly createProduct: (
    request: CreateProductRequest,
  ) => Effect.Effect<Product, DatabaseError>;
}

export class CatalogRepository extends Context.Tag("CatalogRepository")<
  CatalogRepository,
  CatalogRepositoryShape
>() {}

const decodeCategories = Schema.decodeUnknown(Schema.Array(Category));
const decodeProducts = Schema.decodeUnknown(Schema.Array(Product));
const decodeProduct = Schema.decodeUnknown(Product);

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

export const CatalogRepositoryLive = Layer.effect(
  CatalogRepository,
  Effect.gen(function* () {
    const sb = yield* Supabase;

    const decodeMany = <A>(
      decode: (rows: unknown) => Effect.Effect<A, unknown>,
    ) =>
    (rows: unknown) =>
      decode(rows).pipe(
        Effect.mapError(
          (cause) =>
            new DatabaseError({ message: "Failed to decode catalog", cause }),
        ),
      );

    return CatalogRepository.of({
      listCategories: () =>
        Effect.gen(function* () {
          const rows = yield* runQuery("list categories", () =>
            sb.from("categories").select("*").order("sort_order"),
          );
          return yield* decodeMany(decodeCategories)(rows);
        }),

      listProducts: () =>
        Effect.gen(function* () {
          const rows = yield* runQuery("list products", () =>
            sb.from("products").select("*").order("sort_order"),
          );
          return yield* decodeMany(decodeProducts)(rows);
        }),

      createProduct: (request) =>
        Effect.gen(function* () {
          const last = yield* runQuery("read last product sort order", () =>
            sb
              .from("products")
              .select("sort_order")
              .order("sort_order", { ascending: false })
              .limit(1)
              .maybeSingle(),
          );
          const nextSortOrder =
            ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1;

          const row = yield* runQuery("create product", () =>
            sb
              .from("products")
              .insert({
                category_id: request.categoryId,
                name: request.name,
                sort_order: nextSortOrder,
              })
              .select("*")
              .single(),
          );
          return yield* decodeMany(decodeProduct)(row);
        }),
    });
  }),
);
