import { Context, Effect, Layer, Schema } from "effect";
import {
  Category,
  type CreateProductRequest,
  Product,
  type UpdateProductRequest,
} from "@/domain/Catalog";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import { normalizeText } from "@/lib/format";
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
  /** A single product by id (used to validate status writes). */
  readonly getProductById: (
    id: string,
  ) => Effect.Effect<Product, DatabaseError | NotFoundError>;
  /**
   * Add a product to the shared catalog (appended after the last one). Fails
   * with ValidationError when an accent/case-insensitive duplicate exists in
   * the same category, so centros can't litter the shared list.
   */
  readonly createProduct: (
    request: CreateProductRequest,
  ) => Effect.Effect<Product, DatabaseError | ValidationError>;
  /** Super admin: rename a product and/or move it to another category. */
  readonly updateProduct: (
    id: string,
    request: UpdateProductRequest,
  ) => Effect.Effect<
    Product,
    DatabaseError | NotFoundError | ValidationError
  >;
  /** Super admin: remove a product (its statuses cascade away). */
  readonly deleteProduct: (
    id: string,
  ) => Effect.Effect<void, DatabaseError | NotFoundError>;
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

const duplicateProductError = (name: string) =>
  new ValidationError({
    message: `Ya existe un insumo llamado «${name}» en esa categoría.`,
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

    const listProducts = () =>
      Effect.gen(function* () {
        const rows = yield* runQuery("list products", () =>
          sb.from("products").select("*").order("sort_order"),
        );
        return yield* decodeMany(decodeProducts)(rows);
      });

    /** Accent/case-insensitive duplicate lookup within a category. */
    const findDuplicate = (
      categoryId: string,
      name: string,
      excludeId?: string,
    ) =>
      Effect.map(listProducts(), (products) => {
        const target = normalizeText(name);
        return products.find(
          (p) =>
            p.id !== excludeId &&
            p.categoryId === categoryId &&
            normalizeText(p.name) === target,
        );
      });

    return CatalogRepository.of({
      listCategories: () =>
        Effect.gen(function* () {
          const rows = yield* runQuery("list categories", () =>
            sb.from("categories").select("*").order("sort_order"),
          );
          return yield* decodeMany(decodeCategories)(rows);
        }),

      listProducts,

      getProductById: (id) =>
        Effect.gen(function* () {
          const row = yield* runQuery("get product", () =>
            sb.from("products").select("*").eq("id", id).maybeSingle(),
          );
          if (!row) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "product", id }),
            );
          }
          return yield* decodeMany(decodeProduct)(row);
        }),

      createProduct: (request) =>
        Effect.gen(function* () {
          const duplicate = yield* findDuplicate(
            request.categoryId,
            request.name,
          );
          if (duplicate) {
            return yield* Effect.fail(duplicateProductError(duplicate.name));
          }

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
          ).pipe(
            // The DB unique index is the safety net for concurrent creates.
            Effect.mapError((error) =>
              error.message.includes("products_category_name_unique")
                ? duplicateProductError(request.name)
                : error,
            ),
          );
          return yield* decodeMany(decodeProduct)(row);
        }),

      updateProduct: (id, request) =>
        Effect.gen(function* () {
          const patch: Record<string, string> = {};
          if (request.name !== undefined) patch.name = request.name;
          if (request.categoryId !== undefined)
            patch.category_id = request.categoryId;
          if (Object.keys(patch).length === 0) {
            return yield* Effect.fail(
              new ValidationError({ message: "Nada que actualizar." }),
            );
          }

          if (request.name !== undefined) {
            const current = yield* runQuery("read product for update", () =>
              sb.from("products").select("category_id").eq("id", id).maybeSingle(),
            );
            if (!current) {
              return yield* Effect.fail(
                new NotFoundError({ entity: "product", id }),
              );
            }
            const categoryId =
              request.categoryId ??
              (current as { category_id: string }).category_id;
            const duplicate = yield* findDuplicate(
              categoryId,
              request.name,
              id,
            );
            if (duplicate) {
              return yield* Effect.fail(duplicateProductError(duplicate.name));
            }
          }

          const row = yield* runQuery("update product", () =>
            sb
              .from("products")
              .update(patch)
              .eq("id", id)
              .select("*")
              .maybeSingle(),
          ).pipe(
            Effect.mapError((error) =>
              error.message.includes("products_category_name_unique")
                ? duplicateProductError(request.name ?? "")
                : error,
            ),
          );
          if (!row) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "product", id }),
            );
          }
          return yield* decodeMany(decodeProduct)(row);
        }),

      deleteProduct: (id) =>
        Effect.gen(function* () {
          const rows = yield* runQuery("delete product", () =>
            sb.from("products").delete().eq("id", id).select("id"),
          );
          if (!rows || (rows as unknown[]).length === 0) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "product", id }),
            );
          }
        }),
    });
  }),
);
