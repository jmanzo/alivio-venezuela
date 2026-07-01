import type { RegistrationStatus, StockStatus } from "@/domain/Centro";

/**
 * Spanish UI metadata for the stock semaphore. Colors are plain hex so they can
 * be used both in Tailwind arbitrary values and in Leaflet marker markup.
 */

export const STOCK_STATUS_META: Record<
  StockStatus,
  {
    /** Short label for badges. */
    label: string;
    /** Section heading on the public board. */
    heading: string;
    /** Longer citizen-facing guidance. */
    description: string;
    emoji: string;
    color: string;
    /** Tailwind classes for a badge (bg + text + ring). */
    badge: string;
    /** Tailwind classes tinting a section card. */
    section: string;
  }
> = {
  critico: {
    label: "CRÍTICO",
    heading: "Urgente — Necesitamos esto YA",
    description: "Sin stock. Por favor trae estos artículos con prioridad.",
    emoji: "🚨",
    color: "#dc2626",
    badge: "bg-red-600 text-white ring-red-700/20",
    section: "border-red-200 bg-red-50",
  },
  necesita_mas: {
    label: "NECESITAMOS MÁS",
    heading: "Necesitamos más",
    description: "Quedan pocas unidades. Tu donación ayudaría mucho.",
    emoji: "⚠️",
    color: "#d97706",
    badge: "bg-amber-400 text-amber-950 ring-amber-600/30",
    section: "border-amber-200 bg-amber-50",
  },
  suficiente: {
    label: "SUFICIENTE",
    heading: "Tenemos suficiente",
    description: "Inventario adecuado por ahora. Puedes donar si deseas.",
    emoji: "✅",
    color: "#16a34a",
    badge: "bg-green-600 text-white ring-green-700/20",
    section: "border-green-200 bg-green-50",
  },
  abundante: {
    label: "ABUNDANTE",
    heading: "No traer — Estamos bien abastecidos",
    description:
      "Tenemos en abundancia estos artículos. Por favor dona lo que falta arriba.",
    emoji: "📦",
    color: "#2563eb",
    badge: "bg-blue-600 text-white ring-blue-700/20",
    section: "border-blue-200 bg-blue-50",
  },
};

/** Board sections render in this order (most urgent first). */
export const STOCK_STATUS_ORDER: StockStatus[] = [
  "critico",
  "necesita_mas",
  "suficiente",
  "abundante",
];

export const REGISTRATION_STATUS_META: Record<
  RegistrationStatus,
  { label: string; badge: string }
> = {
  pending: {
    label: "Pendiente",
    badge: "bg-amber-100 text-amber-800 ring-amber-600/20",
  },
  approved: {
    label: "Aprobado",
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  },
  rejected: {
    label: "Rechazado",
    badge: "bg-red-100 text-red-800 ring-red-600/20",
  },
  disabled: {
    label: "Deshabilitado",
    badge: "bg-slate-200 text-slate-700 ring-slate-500/20",
  },
};

/** Map default view: centered between Yaracuy and Carabobo. */
export const MAP_DEFAULT_CENTER: [number, number] = [10.25, -68.3];
export const MAP_DEFAULT_ZOOM = 9;
