import { Effect, Exit } from "effect";
import { Header } from "@/components/Header";
import { SuperAdminPanel } from "@/components/SuperAdminPanel";
import { SuperLoginForm } from "@/components/SuperLoginForm";
import { getSession } from "@/lib/auth";
import { toCentroView } from "@/lib/present";
import { AppRuntime } from "@/runtime/server";
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
    Effect.flatMap(CentrosRepository, (repo) => repo.listAll()),
  );
  const centros = Exit.isSuccess(exit) ? exit.value.map(toCentroView) : [];

  return (
    <>
      <Header subtitle="Administrador" back />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4">
          <SuperAdminPanel centros={centros} />
        </div>
      </main>
    </>
  );
}
