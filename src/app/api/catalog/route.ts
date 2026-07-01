import { Effect } from "effect";
import { runHttp } from "@/lib/http";
import { CatalogRepository } from "@/services/CatalogRepository";

export const dynamic = "force-dynamic";

/** GET /api/catalog — shared categories + products. */
export async function GET() {
  const program = Effect.gen(function* () {
    const repo = yield* CatalogRepository;
    const [categories, products] = yield* Effect.all([
      repo.listCategories(),
      repo.listProducts(),
    ]);
    return { categories, products };
  });

  return runHttp(program);
}
