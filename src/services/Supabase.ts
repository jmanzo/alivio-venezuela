import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Context, Effect, Layer, Redacted } from "effect";
import { ConfigurationError } from "@/domain/errors";

/**
 * Effect service wrapping the server-side Supabase client. It uses the service
 * role key so the no-auth coordination flow can write rows; RLS still protects
 * the anon (browser) client, which is read + realtime only.
 */
export class Supabase extends Context.Tag("Supabase")<
  Supabase,
  SupabaseClient
>() {}

/** Reads required env vars or fails with a typed ConfigurationError. */
const readEnv = (name: string): Effect.Effect<string, ConfigurationError> =>
  Effect.suspend(() => {
    const value = process.env[name];
    return value
      ? Effect.succeed(value)
      : Effect.fail(
          new ConfigurationError({ message: `Missing environment variable: ${name}` }),
        );
  });

export const SupabaseLive = Layer.effect(
  Supabase,
  Effect.gen(function* () {
    const url = yield* readEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = Redacted.make(yield* readEnv("SUPABASE_SERVICE_ROLE_KEY"));
    return createClient(url, Redacted.value(serviceKey), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }),
);

/** True when the server has enough configuration to talk to Supabase. */
export const isSupabaseConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
