import type { Category, NeedStatus, Urgency } from "@/domain/Need";
import { CATEGORY_META, STATUS_META, URGENCY_META } from "@/lib/constants";

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const meta = URGENCY_META[urgency];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: NeedStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

export function CategoryTag({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
