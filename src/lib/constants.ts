import type { Category, Need, NeedStatus, Urgency } from "@/domain/Need";

/** Spanish UI metadata for each enum value. Colors are plain hex so they can be
 *  used both in Tailwind arbitrary values and in Leaflet marker markup. */

export const CATEGORY_META: Record<
  Category,
  { label: string; emoji: string }
> = {
  water: { label: "Agua", emoji: "💧" },
  medicine: { label: "Medicina", emoji: "💊" },
  shelter: { label: "Refugio", emoji: "🏠" },
  food: { label: "Comida", emoji: "🍞" },
  other: { label: "Otro", emoji: "📦" },
};

export const URGENCY_META: Record<
  Urgency,
  { label: string; color: string; dot: string; badge: string }
> = {
  critical: {
    label: "Crítica",
    color: "#dc2626",
    dot: "bg-red-600",
    badge: "bg-red-100 text-red-800 ring-red-600/20",
  },
  high: {
    label: "Alta",
    color: "#ea580c",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800 ring-orange-600/20",
  },
  medium: {
    label: "Media",
    color: "#ca8a04",
    dot: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
  },
};

export const STATUS_META: Record<
  NeedStatus,
  { label: string; badge: string }
> = {
  open: {
    label: "Abierta",
    badge: "bg-slate-100 text-slate-700 ring-slate-600/20",
  },
  in_progress: {
    label: "En proceso",
    badge: "bg-blue-100 text-blue-800 ring-blue-600/20",
  },
  covered: {
    label: "Cubierta",
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  },
};

export const CATEGORY_ORDER: Category[] = [
  "water",
  "medicine",
  "shelter",
  "food",
  "other",
];
export const URGENCY_ORDER: Urgency[] = ["critical", "high", "medium"];
export const STATUS_ORDER: NeedStatus[] = ["open", "in_progress", "covered"];

/** Map default view: centered between Yaracuy and Carabobo. */
export const MAP_DEFAULT_CENTER: [number, number] = [10.25, -68.3];
export const MAP_DEFAULT_ZOOM = 9;

const URGENCY_RANK: Record<Urgency, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

/** Sorts needs critical-first, then most-recent-first (mirrors the SQL order). */
export function sortNeeds(needs: ReadonlyArray<Need>): Need[] {
  return [...needs].sort(
    (a, b) =>
      URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}
