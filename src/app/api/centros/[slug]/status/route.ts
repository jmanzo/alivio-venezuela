import { Effect } from "effect";
import { NextResponse } from "next/server";
import { SetProductStatusRequest } from "@/domain/Centro";
import { AuthError } from "@/domain/errors";
import { getSession } from "@/lib/auth";
import { decodeJsonBody, runHttp } from "@/lib/http";
import { CentrosRepository } from "@/services/CentrosRepository";
import { ProductStatusRepository } from "@/services/ProductStatusRepository";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/centros/:slug/status — a centro admin sets one product's stock
 * status. Requires a centro session whose centroId matches this slug.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await getSession();
  if (!session || session.role !== "centro" || session.slug !== slug) {
    return NextResponse.json(
      { error: "AuthError", message: "No autorizado para este centro." },
      { status: 401 },
    );
  }

  const program = Effect.gen(function* () {
    const body = yield* decodeJsonBody(request, SetProductStatusRequest);
    const centros = yield* CentrosRepository;
    const statuses = yield* ProductStatusRepository;

    // Re-resolve the centro to guard against a stale/spoofed session slug.
    const centro = yield* centros.getApprovedBySlug(slug);
    if (centro.id !== session.centroId) {
      return yield* Effect.fail(
        new AuthError({ message: "No autorizado para este centro." }),
      );
    }
    return yield* statuses.upsert(
      centro.id,
      body.productId,
      body.status,
      session.name,
    );
  });

  return runHttp(program);
}
