/** Spanish "time ago" formatting for "última actualización" labels. */
export function timeAgo(iso: string | null): string {
  if (!iso) return "sin actualizar";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < 60) return "hace instantes";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

/** Days without updates after which a board is flagged as possibly outdated. */
export const STALE_AFTER_DAYS = 3;

/** True when the given timestamp is older than `days` (default STALE_AFTER_DAYS). */
export function isStale(
  iso: string | null,
  days: number = STALE_AFTER_DAYS,
): boolean {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then > days * 24 * 60 * 60 * 1000;
}

/** Accent- and case-insensitive normalization for search/duplicate matching. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Turns a centro name into a URL-safe base slug (accent-folded, dashed). A short
 * random suffix is appended by the repository to guarantee uniqueness.
 */
export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "centro";
}
