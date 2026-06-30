import { Effect, Exit } from "effect";
import type { Need } from "@/domain/Need";
import { Header } from "@/components/Header";
import { NeedsDashboard } from "@/components/NeedsDashboard";
import { SetupBanner } from "@/components/SetupBanner";
import { AppRuntime } from "@/runtime/server";
import { NeedsRepository } from "@/services/NeedsRepository";
import { isSupabaseConfigured } from "@/services/Supabase";

// Always render fresh data; the feed is inherently real-time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = isSupabaseConfigured();
  let initialNeeds: Need[] = [];

  const exit = await AppRuntime.runPromiseExit(
    Effect.flatMap(NeedsRepository, (repo) => repo.list()),
  );
  if (Exit.isSuccess(exit)) {
    // Schema.Class instances aren't "plain" objects; serialize before they
    // cross the Server -> Client Component boundary.
    initialNeeds = exit.value.map((need) => ({ ...need }));
  } else {
    console.error("Failed to load initial needs:", exit.cause);
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        {!configured && (
          <div className="mx-auto w-full max-w-2xl px-4 pt-4">
            <SetupBanner />
          </div>
        )}
        <NeedsDashboard initialNeeds={initialNeeds} realtimeEnabled={configured} />
      </main>
    </>
  );
}
