"use client";

import { useEffect, useMemo, useState } from "react";
import type { StockStatus } from "@/domain/Centro";
import { STOCK_STATUS_META, STOCK_STATUS_ORDER } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import {
  decodeProductStatusRow,
  getBrowserSupabase,
} from "@/lib/supabase-browser";
import type {
  CategoryView,
  CentroView,
  ProductStatusView,
  ProductView,
} from "@/lib/view";
import { StockBadge } from "./StockBadge";

interface SemaphoreBoardProps {
  centro: CentroView;
  categories: CategoryView[];
  products: ProductView[];
  initialStatuses: ProductStatusView[];
  realtimeEnabled: boolean;
}

type StatusEntry = { status: StockStatus; updatedAt: string };
type StatusMap = Map<string, StatusEntry>;

const toMap = (rows: ProductStatusView[]): StatusMap =>
  new Map(rows.map((r) => [r.productId, { status: r.status, updatedAt: r.updatedAt }]));

export function SemaphoreBoard({
  centro,
  categories,
  products,
  initialStatuses,
  realtimeEnabled,
}: SemaphoreBoardProps) {
  const [statusMap, setStatusMap] = useState<StatusMap>(() =>
    toMap(initialStatuses),
  );
  const [live, setLive] = useState(false);

  // Realtime: reflect a centro admin's edits without a manual refresh.
  useEffect(() => {
    if (!realtimeEnabled) return;
    const sb = getBrowserSupabase();
    if (!sb) return;

    const channel = sb
      .channel(`product_status:${centro.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_status",
          filter: `centro_id=eq.${centro.id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { product_id?: string })?.product_id;
            if (oldId)
              setStatusMap((prev) => {
                const next = new Map(prev);
                next.delete(oldId);
                return next;
              });
            return;
          }
          const row = decodeProductStatusRow(payload.new);
          if (row)
            setStatusMap((prev) => {
              const next = new Map(prev);
              next.set(row.productId, {
                status: row.status,
                updatedAt: row.updatedAt,
              });
              return next;
            });
        },
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      sb.removeChannel(channel);
    };
  }, [realtimeEnabled, centro.id]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  // Group products by status level, then by category, honoring sort order.
  const grouped = useMemo(() => {
    const sortedProducts = [...products].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    return STOCK_STATUS_ORDER.map((level) => {
      const items = sortedProducts.filter(
        (p) => statusMap.get(p.id)?.status === level,
      );
      const byCategory = new Map<string, ProductView[]>();
      for (const p of items) {
        const list = byCategory.get(p.categoryId) ?? [];
        list.push(p);
        byCategory.set(p.categoryId, list);
      }
      const sections = [...byCategory.entries()]
        .map(([categoryId, list]) => ({
          category: categoryById.get(categoryId),
          products: list,
        }))
        .sort(
          (a, b) =>
            (a.category?.sortOrder ?? 999) - (b.category?.sortOrder ?? 999),
        );
      return { level, count: items.length, sections };
    });
  }, [products, statusMap, categoryById]);

  const lastUpdated = useMemo(() => {
    let latest: string | null = null;
    for (const entry of statusMap.values())
      if (!latest || entry.updatedAt > latest) latest = entry.updatedAt;
    return latest;
  }, [statusMap]);

  const trackedCount = statusMap.size;

  return (
    <div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900">{centro.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <span aria-hidden>📍</span>
          {centro.addressLabel}
        </p>
        {(centro.contactName || centro.contactPhone) && (
          <p className="mt-0.5 text-sm text-slate-500">
            Contacto: {centro.contactName ?? ""}
            {centro.contactName && centro.contactPhone ? " · " : ""}
            {centro.contactPhone ?? ""}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
            {trackedCount} artículo(s) con estado
          </span>
          <span className="text-slate-400">
            Actualizado {timeAgo(lastUpdated)}
          </span>
          {realtimeEnabled && (
            <span className="ml-auto flex items-center gap-1.5 font-medium text-slate-500">
              <span
                className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-amber-400"}`}
              />
              {live ? "En vivo" : "Conectando"}
            </span>
          )}
        </div>
      </section>

      {trackedCount === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Este centro todavía no ha publicado su lista de artículos.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {grouped.map(({ level, count, sections }) => (
            <StatusSection
              key={level}
              level={level}
              count={count}
              sections={sections}
              defaultOpen={level === "critico" || level === "necesita_mas"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusSection({
  level,
  count,
  sections,
  defaultOpen,
}: {
  level: StockStatus;
  count: number;
  sections: { category?: CategoryView; products: ProductView[] }[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = STOCK_STATUS_META[level];

  return (
    <section className={`overflow-hidden rounded-2xl border ${meta.section}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-2xl" aria-hidden>
          {meta.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-slate-900">{meta.heading}</span>
          <span className="block text-xs text-slate-600">
            {meta.description}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-sm font-bold text-slate-700">
          {count}
        </span>
        <span className="shrink-0 text-slate-400" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && count > 0 && (
        <div className="space-y-4 border-t border-black/5 bg-white/60 px-4 py-4">
          {sections.map(({ category, products }) => (
            <div key={category?.id ?? "otros"}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {category?.name ?? "Otros"}
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-sm"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                      {p.name}
                    </span>
                    <StockBadge status={level} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
