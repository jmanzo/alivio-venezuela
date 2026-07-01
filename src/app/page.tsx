import { Effect, Exit } from "effect";
import Link from "next/link";
import { CentrosBrowser } from "@/components/CentrosBrowser";
import { Header } from "@/components/Header";
import { SetupBanner } from "@/components/SetupBanner";
import { toSummaryView } from "@/lib/present";
import type { CentroSummaryView } from "@/lib/view";
import { AppRuntime } from "@/runtime/server";
import { CentrosRepository } from "@/services/CentrosRepository";
import { isSupabaseConfigured } from "@/services/Supabase";

// Approvals and stock levels change often; always render fresh.
export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = isSupabaseConfigured();
  let summaries: CentroSummaryView[] = [];

  const exit = await AppRuntime.runPromiseExit(
    Effect.flatMap(CentrosRepository, (repo) => repo.listApprovedSummaries()),
  );
  if (Exit.isSuccess(exit)) {
    summaries = exit.value.map(toSummaryView);
  } else {
    console.error("Failed to load centros:", exit.cause);
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4">
          {!configured && (
            <div className="mb-4">
              <SetupBanner />
            </div>
          )}

          <section className="rounded-2xl bg-slate-900 p-5 text-white">
            <h1 className="text-xl font-extrabold leading-tight">
              ¿Qué llevar al centro de acopio?
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Consulta en tiempo real qué artículos son críticos, cuáles hacen
              falta y cuáles ya sobran en cada centro antes de donar.
            </p>
            <Link
              href="/registrar"
              className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              + Registrar un centro
            </Link>
          </section>

          <div className="mt-5">
            <CentrosBrowser summaries={summaries} />
          </div>
        </div>
      </main>
    </>
  );
}
