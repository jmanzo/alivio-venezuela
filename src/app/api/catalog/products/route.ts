import { Effect } from "effect";
import { NextResponse } from "next/server";
import { CreateProductRequest } from "@/domain/Catalog";
import { getSession } from "@/lib/auth";
import { decodeJsonBody, runHttp } from "@/lib/http";
import { CatalogRepository } from "@/services/CatalogRepository";

export const dynamic = "force-dynamic";

/**
 * POST /api/catalog/products — a logged-in centro admin (or the super admin)
 * adds a missing item to the shared catalog so it becomes reusable by every
 * centro. Requires a centro or super session.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "AuthError", message: "No autorizado." },
      { status: 401 },
    );
  }

  const program = Effect.gen(function* () {
    const body = yield* decodeJsonBody(request, CreateProductRequest);
    const catalog = yield* CatalogRepository;
    return yield* catalog.createProduct(body);
  });

  return runHttp(program, 201);
}
