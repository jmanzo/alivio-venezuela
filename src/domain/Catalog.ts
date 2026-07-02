import { Schema } from "effect";

/**
 * Shared relief catalog. Categories and products are global (the same for every
 * centro de acopio) so that stock levels are comparable across centers. Only the
 * super admin edits the catalog; centros only set a status per product.
 */

/** A product category (e.g. "Alimentos", "Higiene Personal"). */
export class Category extends Schema.Class<Category>("Category")({
  id: Schema.String,
  name: Schema.String,
  sortOrder: Schema.propertySignature(Schema.Number).pipe(
    Schema.fromKey("sort_order"),
  ),
}) {}

/** A concrete donatable item (e.g. "Agua potable", "Guantes"). */
export class Product extends Schema.Class<Product>("Product")({
  id: Schema.UUID,
  categoryId: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("category_id"),
  ),
  name: Schema.String,
  sortOrder: Schema.propertySignature(Schema.Number).pipe(
    Schema.fromKey("sort_order"),
  ),
}) {}

/**
 * Payload accepted by the "create a product" endpoint. A centro admin can add a
 * missing item to the shared catalog so it becomes reusable by every centro.
 */
export const CreateProductRequest = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(80)),
  categoryId: Schema.String.pipe(Schema.minLength(1)),
});
export type CreateProductRequest = typeof CreateProductRequest.Type;
