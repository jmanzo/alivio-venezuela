import { Effect } from "effect";
import { NextResponse } from "next/server";
import { SetCentroPasswordRequest } from "@/domain/Centro";
import { getSession } from "@/lib/auth";
import { decodeJsonBody, runHttp } from "@/lib/http";
import { CentrosRepository } from "@/services/CentrosRepository";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/centros/:id/password — super admin assigns a new admin
 * password to a centro (the recovery path when a centro forgets its key).
 * Requires a super session.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "super") {
    return NextResponse.json(
      { error: "AuthError", message: "Acceso solo para el administrador." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const program = Effect.gen(function* () {
    const body = yield* decodeJsonBody(request, SetCentroPasswordRequest);
    const repo = yield* CentrosRepository;
    yield* repo.setAdminPassword(id, body.password);
    return { ok: true as const };
  });

  return runHttp(program);
}
