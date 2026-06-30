import { Schema } from "effect";

/**
 * Domain enums. The Postgres enums are declared in the migration using the
 * SAME ordering, so `ORDER BY urgency` returns critical-first without extra
 * mapping logic.
 */
export const Category = Schema.Literal(
  "water",
  "medicine",
  "shelter",
  "food",
  "other",
);
export type Category = typeof Category.Type;

export const Urgency = Schema.Literal("critical", "high", "medium");
export type Urgency = typeof Urgency.Type;

export const NeedStatus = Schema.Literal("open", "in_progress", "covered");
export type NeedStatus = typeof NeedStatus.Type;

/**
 * A `Need` as exposed to the application. The schema decodes directly from the
 * snake_case Postgres row (via `fromKey`) into a camelCase domain object, so the
 * rest of the codebase never touches database-shaped data.
 */
export class Need extends Schema.Class<Need>("Need")({
  id: Schema.UUID,
  category: Category,
  description: Schema.String,
  urgency: Urgency,
  lat: Schema.Number,
  lng: Schema.Number,
  locationLabel: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("location_label"),
  ),
  status: NeedStatus,
  createdAt: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("created_at"),
  ),
  reporterContact: Schema.propertySignature(
    Schema.NullOr(Schema.String),
  ).pipe(Schema.fromKey("reporter_contact")),
}) {}

/** Payload accepted by the "report a need" endpoint. */
export const CreateNeedRequest = Schema.Struct({
  category: Category,
  description: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500)),
  urgency: Urgency,
  lat: Schema.Number.pipe(Schema.between(-90, 90)),
  lng: Schema.Number.pipe(Schema.between(-180, 180)),
  locationLabel: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  reporterContact: Schema.optional(
    Schema.NullOr(Schema.String.pipe(Schema.maxLength(200))),
  ),
});
export type CreateNeedRequest = typeof CreateNeedRequest.Type;

/** Payload accepted by the "update status" endpoint. */
export const UpdateStatusRequest = Schema.Struct({
  status: NeedStatus,
  changedBy: Schema.optional(Schema.NullOr(Schema.String.pipe(Schema.maxLength(200)))),
});
export type UpdateStatusRequest = typeof UpdateStatusRequest.Type;

/** Optional filters used when listing needs. */
export const NeedFilters = Schema.Struct({
  category: Schema.optional(Category),
  status: Schema.optional(NeedStatus),
});
export type NeedFilters = typeof NeedFilters.Type;
