import { Cause, Effect, Exit, Schema } from "effect";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { AppRuntime } from "@/runtime/server";
import { CentrosRepository } from "@/services/CentrosRepository";

export const dynamic = "force-dynamic";

const LoginRequest = Schema.Struct({
  centroId: Schema.UUID,
  password: Schema.String.pipe(Schema.minLength(1)),
});

/** POST /api/auth/centro — centro-admin login; sets a signed session cookie. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Schema.decodeUnknownEither(LoginRequest)(body);
  if (parsed._tag === "Left") {
    return NextResponse.json(
      { error: "ValidationError", message: "Datos de acceso inválidos." },
      { status: 400 },
    );
  }

  const exit = await AppRuntime.runPromiseExit(
    Effect.flatMap(CentrosRepository, (repo) =>
      repo.authenticate(parsed.right.centroId, parsed.right.password),
    ),
  );

  if (Exit.isFailure(exit)) {
    const failure = Cause.failureOption(exit.cause);
    const message =
      failure._tag === "Some" && "message" in failure.value
        ? (failure.value as { message: string }).message
        : "No se pudo iniciar sesión.";
    const status =
      failure._tag === "Some" && failure.value._tag === "AuthError" ? 401 : 500;
    return NextResponse.json({ error: "AuthError", message }, { status });
  }

  const centro = exit.value;
  await setSessionCookie({
    role: "centro",
    centroId: centro.id,
    slug: centro.slug,
    name: centro.name,
  });

  return NextResponse.json({ centro });
}
