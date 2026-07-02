/**
 * Minimal in-memory, per-IP sliding-window rate limiter for the public
 * registration endpoint. State is per server instance, so on serverless this is
 * best-effort (each warm instance keeps its own window) — enough to blunt
 * casual spam without adding infrastructure, per PRD-pre-launch-fixes 4.1.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

/** Extracts the caller IP from proxy headers (Vercel sets x-forwarded-for). */
export function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Records a hit for `key` and returns true when it exceeded the window quota. */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  // Opportunistically drop stale entries so the map cannot grow unbounded.
  if (hits.size > 1000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}
