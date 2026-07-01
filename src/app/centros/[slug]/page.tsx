import { Effect, Exit } from "effect";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { SemaphoreBoard } from "@/components/SemaphoreBoard";
import {
  toCategoryView,
  toCentroView,
  toProductStatusView,
  toProductView,
} from "@/lib/present";
import { AppRuntime } from "@/runtime/server";
import { CatalogRepository } from "@/services/CatalogRepository";
import { CentrosRepository } from "@/services/CentrosRepository";
import { ProductStatusRepository } from "@/services/ProductStatusRepository";
import { isSupabaseConfigured } from "@/services/Supabase";

export const dynamic = "force-dynamic";

export default async function CentroBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const program = Effect.gen(function* () {
    const centros = yield* CentrosRepository;
    const catalog = yield* CatalogRepository;
    const statuses = yield* ProductStatusRepository;

    const centro = yield* centros.getApprovedBySlug(slug);
    const [categories, products, productStatuses] = yield* Effect.all([
      catalog.listCategories(),
      catalog.listProducts(),
      statuses.listByCentro(centro.id),
    ]);
    return { centro, categories, products, productStatuses };
  });

  const exit = await AppRuntime.runPromiseExit(program);
  if (Exit.isFailure(exit)) {
    notFound();
  }

  const { centro, categories, products, productStatuses } = exit.value;

  return (
    <>
      <Header subtitle="Guía de donaciones" back />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4">
          <SemaphoreBoard
            centro={toCentroView(centro)}
            categories={categories.map(toCategoryView)}
            products={products.map(toProductView)}
            initialStatuses={productStatuses.map(toProductStatusView)}
            realtimeEnabled={isSupabaseConfigured()}
          />
        </div>
      </main>
    </>
  );
}
