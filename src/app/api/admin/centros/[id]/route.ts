import { Effect } from "effect";
import { NextResponse } from "next/server";
import { SetRegistrationStatusRequest } from "@/domain/Centro";
import { getSession } from "@/lib/auth";
import { decodeJsonBody, runHttp } from "@/lib/http";
import { CentrosRepository } from "@/services/CentrosRepository";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/centros/:id — super admin approves / rejects / disables /
 * re-enables a centro. Requires a super session.
 */
export async function PATCH(
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
    const body = yield* decodeJsonBody(request, SetRegistrationStatusRequest);
    const repo = yield* CentrosRepository;
    return yield* repo.setRegistrationStatus(id, body.registrationStatus);
  });

  return runHttp(program);
}
