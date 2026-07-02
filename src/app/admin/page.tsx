import { Effect, Exit } from "effect";
import { CatalogManager } from "@/components/CatalogManager";
import { Header } from "@/components/Header";
import { SuperAdminPanel } from "@/components/SuperAdminPanel";
import { SuperLoginForm } from "@/components/SuperLoginForm";
import { getSession } from "@/lib/auth";
import { toCategoryView, toCentroView, toProductView } from "@/lib/present";
import { AppRuntime } from "@/runtime/server";
import { CatalogRepository } from "@/services/CatalogRepository";
import { CentrosRepository } from "@/services/CentrosRepository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  if (session?.role !== "super") {
    return (
      <>
        <Header subtitle="Administrador" back />
        <main className="flex flex-1 flex-col">
          <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-8">
            <SuperLoginForm />
          </div>
        </main>
      </>
    );
  }

  const exit = await AppRuntime.runPromiseExit(
    Effect.gen(function* () {
      const centrosRepo = yield* CentrosRepository;
      const catalog = yield* CatalogRepository;
      const [centros, categories, products] = yield* Effect.all([
        centrosRepo.listAll(),
        catalog.listCategories(),
        catalog.listProducts(),
      ]);
      return { centros, categories, products };
    }),
  );
  const { centros, categories, products } = Exit.isSuccess(exit)
    ? exit.value
    : { centros: [], categories: [], products: [] };

  return (
    <>
      <Header subtitle="Administrador" back />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4">
          <SuperAdminPanel centros={centros.map(toCentroView)} />
          <CatalogManager
            categories={categories.map(toCategoryView)}
            products={products.map(toProductView)}
          />
        </div>
      </main>
    </>
  );
}
