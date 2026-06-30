import { Data } from "effect";

/**
 * Typed, tagged errors for the whole application. Every fallible Effect declares
 * which of these it can fail with, and the API layer matches on the `_tag` to
 * pick an HTTP status code.
 */

/** Input failed schema validation (maps to HTTP 400). */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly issues?: ReadonlyArray<string>;
}> {}

/** Any failure originating from Supabase / Postgres (maps to HTTP 500). */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** A need with the requested id does not exist (maps to HTTP 404). */
export class NeedNotFoundError extends Data.TaggedError("NeedNotFoundError")<{
  readonly id: string;
}> {}

/** Required configuration (env vars) is missing (maps to HTTP 500). */
export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly message: string;
}> {}

export type AppError =
  | ValidationError
  | DatabaseError
  | NeedNotFoundError
  | ConfigurationError;
