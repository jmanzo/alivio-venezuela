"use client";

import { useEffect, useMemo, useState } from "react";
import type { StockStatus } from "@/domain/Centro";
import { STOCK_STATUS_META, STOCK_STATUS_ORDER } from "@/lib/constants";
import { isStale, STALE_AFTER_DAYS, timeAgo } from "@/lib/format";
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
  const stale = isStale(lastUpdated);

  /** Opens WhatsApp with a "qué llevar" summary + the board URL. */
  const shareViaWhatsApp = () => {
    const names = (level: StockStatus) =>
      grouped
        .find((g) => g.level === level)
        ?.sections.flatMap((s) => s.products.map((p) => p.name)) ?? [];
    const listOf = (items: string[], max = 12) =>
      items.length <= max
        ? items.join(", ")
        : `${items.slice(0, max).join(", ")} y ${items.length - max} más`;

    const critico = names("critico");
    const necesita = names("necesita_mas");
    const lines = [`*${centro.name}* — qué llevar:`];
    if (critico.length > 0) lines.push(`🚨 URGENTE: ${listOf(critico)}`);
    if (necesita.length > 0) lines.push(`⚠️ Hace falta: ${listOf(necesita)}`);
    if (critico.length === 0 && necesita.length === 0)
      lines.push("✅ Por ahora no hay artículos urgentes.");
    lines.push(`📍 ${centro.addressLabel}`);
    lines.push(`Lista completa y actualizada: ${window.location.href}`);

    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener",
    );
  };

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
            {centro.contactPhone && (
              <a
                href={`tel:${centro.contactPhone.replace(/[^\d+]/g, "")}`}
                className="font-semibold text-slate-700 underline"
              >
                {centro.contactPhone}
              </a>
            )}
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
        {stale && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            ⚠️ Este centro no actualiza su lista desde hace más de{" "}
            {STALE_AFTER_DAYS} días. Confirma antes de llevar tu donación.
          </p>
        )}
        {trackedCount > 0 && (
          <button
            type="button"
            onClick={shareViaWhatsApp}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition hover:brightness-95 sm:w-auto"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.2-.8l.4-.5c.1-.2.1-.4 0-.6l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.2 2.2-.4 3.7a12 12 0 0 0 4.6 4.5c1.8.9 2.6 1 3.5.8.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.6-.2Z" />
            </svg>
            Compartir por WhatsApp
          </button>
        )}
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
