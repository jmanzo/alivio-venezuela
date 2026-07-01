import type { StockStatus } from "@/domain/Centro";
import { STOCK_STATUS_META } from "@/lib/constants";

/** Small pill showing a product's stock level (the semaphore chip). */
export function StockBadge({ status }: { status: StockStatus }) {
  const meta = STOCK_STATUS_META[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${meta.badge}`}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
