import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Schema } from "effect";
import { ProductStatus } from "@/domain/Centro";

let cached: SupabaseClient | null | undefined;

/**
 * Browser Supabase client used ONLY for realtime subscriptions on the public
 * `product_status` table (anon key, RLS-protected: reads limited to approved
 * centros). Returns null when the public env vars are absent so the UI can
 * degrade gracefully instead of crashing.
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

const decode = Schema.decodeUnknownSync(ProductStatus);

/** Decodes a raw realtime row into a domain ProductStatus, or null if malformed. */
export function decodeProductStatusRow(row: unknown): ProductStatus | null {
  try {
    return decode(row);
  } catch {
    return null;
  }
}
