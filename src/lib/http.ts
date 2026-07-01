import { Cause, Effect, Exit, ParseResult, Schema } from "effect";
import { NextResponse } from "next/server";
import { ValidationError, type AppError } from "@/domain/errors";
import { AppRuntime } from "@/runtime/server";
import type { CatalogRepository } from "@/services/CatalogRepository";
import type { CentrosRepository } from "@/services/CentrosRepository";
import type { ProductStatusRepository } from "@/services/ProductStatusRepository";

/** Services available to any Effect run from an API route. The Supabase client
 *  is an internal dependency of the repositories, not used directly by routes. */
export type ApiServices =
  | CatalogRepository
  | CentrosRepository
  | ProductStatusRepository;

const STATUS_BY_TAG: Record<AppError["_tag"], number> = {
  ValidationError: 400,
  AuthError: 401,
  NotFoundError: 404,
  DatabaseError: 500,
  ConfigurationError: 500,
};

function messageOf(error: AppError): string {
  if (error._tag === "NotFoundError")
    return `${error.entity} ${error.id} not found`;
  return error.message;
}

/**
 * Runs an Effect through the application runtime and converts its `Exit` into a
 * JSON `NextResponse`. Expected (tagged) failures become 4xx/5xx with a stable
 * body; unexpected defects become a generic 500.
 */
export async function runHttp<A>(
  effect: Effect.Effect<A, AppError, ApiServices>,
  successStatus = 200,
): Promise<NextResponse> {
  const exit = await AppRuntime.runPromiseExit(effect);

  return Exit.match(exit, {
    onSuccess: (value) => NextResponse.json(value, { status: successStatus }),
    onFailure: (cause) => {
      const failure = Cause.failureOption(cause);
      if (failure._tag === "Some") {
        const error = failure.value;
        return NextResponse.json(
          {
            error: error._tag,
            message: messageOf(error),
            ...("issues" in error && error.issues ? { issues: error.issues } : {}),
          },
          { status: STATUS_BY_TAG[error._tag] },
        );
      }
      console.error("Unexpected failure:", Cause.pretty(cause));
      return NextResponse.json(
        { error: "InternalError", message: "Unexpected server error" },
        { status: 500 },
      );
    },
  });
}

/** Reads + validates a JSON request body against a schema (typed ValidationError). */
export const decodeJsonBody = <A, I>(
  request: Request,
  schema: Schema.Schema<A, I>,
): Effect.Effect<A, ValidationError> =>
  Effect.tryPromise({
    try: () => request.json(),
    catch: () => new ValidationError({ message: "Invalid JSON body" }),
  }).pipe(Effect.flatMap((body) => decodeWith(schema)(body)));

/** Validates an already-parsed value (e.g. query params) against a schema. */
export const decodeWith =
  <A, I>(schema: Schema.Schema<A, I>) =>
  (input: unknown): Effect.Effect<A, ValidationError> =>
    Schema.decodeUnknown(schema)(input).pipe(
      Effect.mapError(
        (parseError) =>
          new ValidationError({
            message: "Validation failed",
            issues: ParseResult.ArrayFormatter.formatErrorSync(parseError).map(
              (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
            ),
          }),
      ),
    );
