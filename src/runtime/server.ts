import { Layer, ManagedRuntime } from "effect";
import { DuplicateDetectorLive } from "@/services/DuplicateDetector";
import { NeedsRepositoryMock } from "@/services/MockNeedsRepository";
import { NeedsRepositoryLive } from "@/services/NeedsRepository";
import { isSupabaseConfigured, SupabaseLive } from "@/services/Supabase";

/**
 * The application layer, assembled once. Dependencies flow bottom-up:
 *   Supabase  ->  NeedsRepository  ->  DuplicateDetector
 * `provideMerge` both satisfies each layer's requirements and re-exports the
 * services, so the final runtime exposes all of them (Effect memoizes layers by
 * reference, so the Supabase client is created at most once).
 *
 * When Supabase isn't configured we swap in an in-memory repository — same
 * interface, no other code changes — so the app stays usable as a fallback.
 */
const RepositoryLayer = isSupabaseConfigured()
  ? NeedsRepositoryLive.pipe(Layer.provideMerge(SupabaseLive))
  : NeedsRepositoryMock;

const AppLayer = DuplicateDetectorLive.pipe(
  Layer.provideMerge(RepositoryLayer),
);

/**
 * A long-lived runtime reused across requests. In Next.js, module scope is
 * effectively a per-process singleton, which is exactly what we want for a
 * pooled DB client.
 */
export const AppRuntime = ManagedRuntime.make(AppLayer);
