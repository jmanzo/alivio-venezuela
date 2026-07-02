import { Effect } from "effect";
import { NextResponse } from "next/server";
import { UpdateProductRequest } from "@/domain/Catalog";
import { getSession } from "@/lib/auth";
import { decodeJsonBody, runHttp } from "@/lib/http";
import { CatalogRepository } from "@/services/CatalogRepository";

export const dynamic = "force-dynamic";

const unauthorized = () =>
  NextResponse.json(
    { error: "AuthError", message: "Acceso solo para el administrador." },
    { status: 401 },
  );

/**
 * PATCH /api/admin/products/:id — super admin renames a product and/or moves
 * it to another category. Requires a super session.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "super") return unauthorized();

  const { id } = await params;
  const program = Effect.gen(function* () {
    const body = yield* decodeJsonBody(request, UpdateProductRequest);
    const catalog = yield* CatalogRepository;
    return yield* catalog.updateProduct(id, body);
  });

  return runHttp(program);
}

/**
 * DELETE /api/admin/products/:id — super admin removes a product from the
 * shared catalog (per-centro statuses cascade away). Requires a super session.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "super") return unauthorized();

  const { id } = await params;
  const program = Effect.gen(function* () {
    const catalog = yield* CatalogRepository;
    yield* catalog.deleteProduct(id);
    return { ok: true as const };
  });

  return runHttp(program);
}
