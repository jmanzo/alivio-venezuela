"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StockStatus } from "@/domain/Centro";
import { api } from "@/lib/api";
import { STOCK_STATUS_META, STOCK_STATUS_ORDER } from "@/lib/constants";
import type { CategoryView, CentroView, ProductStatusView, ProductView } from "@/lib/view";

interface CentroAdminPanelProps {
  centro: CentroView;
  categories: CategoryView[];
  products: ProductView[];
  initialStatuses: ProductStatusView[];
}

export function CentroAdminPanel({
  centro,
  categories,
  products,
  initialStatuses,
}: CentroAdminPanelProps) {
  const router = useRouter();
  const [statusMap, setStatusMap] = useState<Map<string, StockStatus>>(
    () => new Map(initialStatuses.map((s) => [s.productId, s.status])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, ProductView[]>();
    for (const p of [...products].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const list = byCategory.get(p.categoryId) ?? [];
      list.push(p);
      byCategory.set(p.categoryId, list);
    }
    return [...categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        category,
        products: byCategory.get(category.id) ?? [],
      }))
      .filter((g) => g.products.length > 0);
  }, [categories, products]);

  const setStatus = async (productId: string, status: StockStatus) => {
    setBusyId(productId);
    setError(null);
    const previous = statusMap.get(productId);
    setStatusMap((prev) => new Map(prev).set(productId, status));
    try {
      await api.setProductStatus(centro.slug, productId, status);
    } catch (err) {
      setStatusMap((prev) => {
        const next = new Map(prev);
        if (previous) next.set(productId, previous);
        else next.delete(productId);
        return next;
      });
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusyId(null);
    }
  };

  const logout = async () => {
    await api.logout();
    router.refresh();
  };

  const definedCount = statusMap.size;

  return (
    <div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold text-slate-900">
              {centro.name}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Panel del centro · {definedCount} artículo(s) con estado
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
          >
            Salir
          </button>
        </div>
        <Link
          href={`/centros/${centro.slug}`}
          className="mt-2 inline-block text-sm font-semibold text-slate-900 underline"
        >
          Ver mi página pública →
        </Link>
      </section>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-4 text-sm text-slate-500">
        Toca el estado de cada artículo. Los cambios se publican al instante.
      </p>

      <div className="mt-3 space-y-5">
        {grouped.map(({ category, products }) => (
          <section key={category.id}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              {category.name}
            </h2>
            <ul className="space-y-2">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {p.name}
                    </span>
                    {!statusMap.has(p.id) && (
                      <span className="text-xs text-slate-400">Sin definir</span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {STOCK_STATUS_ORDER.map((level) => {
                      const active = statusMap.get(p.id) === level;
                      const meta = STOCK_STATUS_META[level];
                      return (
                        <button
                          key={level}
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => setStatus(p.id, level)}
                          className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition disabled:opacity-50 ${
                            active
                              ? `${meta.badge} ring-1 ring-inset`
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {meta.emoji} {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
