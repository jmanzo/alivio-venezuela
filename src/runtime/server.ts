import { Layer, ManagedRuntime } from "effect";
import {
  CatalogRepositoryLive,
} from "@/services/CatalogRepository";
import {
  CentrosRepositoryLive,
} from "@/services/CentrosRepository";
import {
  CatalogRepositoryMock,
  CentrosRepositoryMock,
  ProductStatusRepositoryMock,
} from "@/services/MockRepositories";
import {
  ProductStatusRepositoryLive,
} from "@/services/ProductStatusRepository";
import { isSupabaseConfigured, SupabaseLive } from "@/services/Supabase";

/**
 * The application layer, assembled once. Each repository depends only on the
 * shared Supabase client (memoized by reference, so a single client is created
 * per process). When Supabase isn't configured we swap in in-memory mocks with
 * the same interfaces, so the app stays fully usable as a fallback.
 */
const AppLayer = isSupabaseConfigured()
  ? Layer.mergeAll(
      CatalogRepositoryLive,
      CentrosRepositoryLive,
      ProductStatusRepositoryLive,
    ).pipe(Layer.provide(SupabaseLive))
  : Layer.mergeAll(
      CatalogRepositoryMock,
      CentrosRepositoryMock,
      ProductStatusRepositoryMock,
    );

/**
 * A long-lived runtime reused across requests. In Next.js, module scope is
 * effectively a per-process singleton, which is exactly what we want for a
 * pooled DB client.
 */
export const AppRuntime = ManagedRuntime.make(AppLayer);
