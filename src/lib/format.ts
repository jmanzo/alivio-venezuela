import type { Need } from "@/domain/Need";
import { CATEGORY_META, STATUS_META, URGENCY_META } from "./constants";

/**
 * Builds a plain-text, shareable summary of needs (for handoff to responders
 * who don't use the app). Covers all open + in-progress needs.
 */
export function buildShareText(needs: ReadonlyArray<Need>): string {
  const pending = needs.filter((n) => n.status !== "covered");
  const lines = [
    "AlivioVenezuela — Necesidades pendientes",
    `Actualizado: ${new Date().toLocaleString("es-VE")}`,
    "",
  ];
  if (pending.length === 0) {
    lines.push("No hay necesidades pendientes.");
  } else {
    for (const n of pending) {
      lines.push(
        `• [${URGENCY_META[n.urgency].label}] ${CATEGORY_META[n.category].label} — ${n.description}`,
        `  ${n.locationLabel} · ${STATUS_META[n.status].label}` +
          (n.reporterContact ? ` · ${n.reporterContact}` : ""),
      );
    }
  }
  return lines.join("\n");
}

/** Spanish "time ago" formatting for the needs feed. */
export function timeAgo(iso: string): string {
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
