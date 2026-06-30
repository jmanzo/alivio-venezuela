import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Schema } from "effect";
import { Need } from "@/domain/Need";

let cached: SupabaseClient | null | undefined;

/**
 * Browser Supabase client used ONLY for reads + realtime subscriptions (anon
 * key, RLS-protected). Returns null when the public env vars are absent so the
 * UI can degrade gracefully instead of crashing.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached =
    url && anon
      ? createClient(url, anon, { auth: { persistSession: false } })
      : null;
  return cached;
}

const decode = Schema.decodeUnknownSync(Need);

/** Decodes a raw realtime row into a domain Need, or null if malformed. */
export function decodeNeedRow(row: unknown): Need | null {
  try {
    return decode(row);
  } catch {
    return null;
  }
}
