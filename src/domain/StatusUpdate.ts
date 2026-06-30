import { Schema } from "effect";
import { NeedStatus } from "./Need";

/**
 * Audit-trail row recorded every time a need changes status. Kept intentionally
 * thin: there is no auth, so `changedBy` is free text.
 */
export class StatusUpdate extends Schema.Class<StatusUpdate>("StatusUpdate")({
  id: Schema.UUID,
  needId: Schema.propertySignature(Schema.UUID).pipe(Schema.fromKey("need_id")),
  oldStatus: Schema.propertySignature(Schema.NullOr(NeedStatus)).pipe(
    Schema.fromKey("old_status"),
  ),
  newStatus: Schema.propertySignature(NeedStatus).pipe(
    Schema.fromKey("new_status"),
  ),
  changedAt: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("changed_at"),
  ),
  changedBy: Schema.propertySignature(Schema.NullOr(Schema.String)).pipe(
    Schema.fromKey("changed_by"),
  ),
}) {}
