import { Schema } from "effect";

/**
 * Domain model for collection centers ("centros de acopio") and their per-product
 * stock semaphore. The admin password hash is intentionally NOT part of the
 * domain model: it never leaves the repository, so no domain object can leak it.
 */

/** Four-level stock semaphore, ordered most-urgent first (matches the SQL enum). */
export const StockStatus = Schema.Literal(
  "critico",
  "necesita_mas",
  "suficiente",
  "abundante",
);
export type StockStatus = typeof StockStatus.Type;

/** Lifecycle of a centro registration. Only `approved` is publicly visible. */
export const RegistrationStatus = Schema.Literal(
  "pending",
  "approved",
  "rejected",
  "disabled",
);
export type RegistrationStatus = typeof RegistrationStatus.Type;

/** A centro de acopio as exposed to the app (no password hash). */
export class CentroAcopio extends Schema.Class<CentroAcopio>("CentroAcopio")({
  id: Schema.UUID,
  name: Schema.String,
  slug: Schema.String,
  addressLabel: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("address_label"),
  ),
  lat: Schema.Number,
  lng: Schema.Number,
  contactName: Schema.propertySignature(Schema.NullOr(Schema.String)).pipe(
    Schema.fromKey("contact_name"),
  ),
  contactPhone: Schema.propertySignature(Schema.NullOr(Schema.String)).pipe(
    Schema.fromKey("contact_phone"),
  ),
  registrationStatus: Schema.propertySignature(RegistrationStatus).pipe(
    Schema.fromKey("registration_status"),
  ),
  createdAt: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("created_at"),
  ),
  approvedAt: Schema.propertySignature(Schema.NullOr(Schema.String)).pipe(
    Schema.fromKey("approved_at"),
  ),
}) {}

/** Stock status of a single product at a single centro. */
export class ProductStatus extends Schema.Class<ProductStatus>("ProductStatus")({
  id: Schema.UUID,
  centroId: Schema.propertySignature(Schema.UUID).pipe(
    Schema.fromKey("centro_id"),
  ),
  productId: Schema.propertySignature(Schema.UUID).pipe(
    Schema.fromKey("product_id"),
  ),
  status: StockStatus,
  updatedAt: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("updated_at"),
  ),
  updatedBy: Schema.propertySignature(Schema.NullOr(Schema.String)).pipe(
    Schema.fromKey("updated_by"),
  ),
}) {}

/**
 * A centro plus a small summary of its board, used on the public browse page /
 * map so we can color each pin without fetching every status row per centro.
 */
export interface CentroSummary {
  readonly centro: CentroAcopio;
  readonly criticoCount: number;
  readonly necesitaMasCount: number;
  readonly trackedCount: number;
  readonly lastUpdated: string | null;
}

/** Payload accepted by the public "register a centro" endpoint. */
export const RegisterCentroRequest = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(120)),
  addressLabel: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(200)),
  lat: Schema.Number.pipe(Schema.between(-90, 90)),
  lng: Schema.Number.pipe(Schema.between(-180, 180)),
  contactName: Schema.optional(
    Schema.NullOr(Schema.String.pipe(Schema.maxLength(120))),
  ),
  contactPhone: Schema.optional(
    Schema.NullOr(Schema.String.pipe(Schema.maxLength(60))),
  ),
  password: Schema.String.pipe(Schema.minLength(6), Schema.maxLength(200)),
});
export type RegisterCentroRequest = typeof RegisterCentroRequest.Type;

/** Payload accepted by the centro-admin "set product status" endpoint. */
export const SetProductStatusRequest = Schema.Struct({
  productId: Schema.UUID,
  status: StockStatus,
});
export type SetProductStatusRequest = typeof SetProductStatusRequest.Type;

/** Payload accepted by the super-admin "change registration status" endpoint. */
export const SetRegistrationStatusRequest = Schema.Struct({
  registrationStatus: RegistrationStatus,
});
export type SetRegistrationStatusRequest =
  typeof SetRegistrationStatusRequest.Type;

/**
 * Payload accepted by the super-admin "reset a centro's password" endpoint —
 * the recovery path when a centro forgets its access key.
 */
export const SetCentroPasswordRequest = Schema.Struct({
  password: Schema.String.pipe(Schema.minLength(6), Schema.maxLength(200)),
});
export type SetCentroPasswordRequest = typeof SetCentroPasswordRequest.Type;
