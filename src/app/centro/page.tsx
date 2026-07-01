import { Effect, Exit } from "effect";
import { CentroAdminPanel } from "@/components/CentroAdminPanel";
import { CentroLoginForm } from "@/components/CentroLoginForm";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth";
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

export const dynamic = "force-dynamic";

export default async function CentroPage() {
  const session = await getSession();

  // Logged-in centro admin: load their board for editing.
  if (session?.role === "centro") {
    const program = Effect.gen(function* () {
      const centros = yield* CentrosRepository;
      const catalog = yield* CatalogRepository;
      const statuses = yield* ProductStatusRepository;

      const centro = yield* centros.getApprovedBySlug(session.slug);
      const [categories, products, productStatuses] = yield* Effect.all([
        catalog.listCategories(),
        catalog.listProducts(),
        statuses.listByCentro(centro.id),
      ]);
      return { centro, categories, products, productStatuses };
    });

    const exit = await AppRuntime.runPromiseExit(program);
    if (Exit.isSuccess(exit)) {
      const { centro, categories, products, productStatuses } = exit.value;
      return (
        <>
          <Header subtitle="Panel del centro" back />
          <main className="flex flex-1 flex-col">
            <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4">
              <CentroAdminPanel
                centro={toCentroView(centro)}
                categories={categories.map(toCategoryView)}
                products={products.map(toProductView)}
                initialStatuses={productStatuses.map(toProductStatusView)}
              />
            </div>
          </main>
        </>
      );
    }
    // Fall through to login (e.g. the centro was disabled since login).
  }

  // Otherwise show the login form with the list of approved centros.
  const exit = await AppRuntime.runPromiseExit(
    Effect.flatMap(CentrosRepository, (repo) => repo.listApproved()),
  );
  const centros = Exit.isSuccess(exit)
    ? exit.value.map((c) => ({ id: c.id, name: c.name }))
    : [];

  return (
    <>
      <Header subtitle="Acceso de centro" back />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-8">
          <CentroLoginForm centros={centros} />
        </div>
      </main>
    </>
  );
}
