"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StockStatus } from "@/domain/Centro";
import { api } from "@/lib/api";
import { STOCK_STATUS_META, STOCK_STATUS_ORDER } from "@/lib/constants";
import { normalizeText } from "@/lib/format";
import type { CategoryView, CentroView, ProductStatusView, ProductView } from "@/lib/view";

interface CentroAdminPanelProps {
  centro: CentroView;
  categories: CategoryView[];
  products: ProductView[];
  initialStatuses: ProductStatusView[];
}

const PAGE_SIZE = 12;

interface FlatProduct {
  id: string;
  name: string;
  categoryName: string;
  search: string;
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

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const flatProducts = useMemo<FlatProduct[]>(() => {
    const categoryName = new Map(categories.map((c) => [c.id, c.name]));
    return [...products]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        name: p.name,
        categoryName: categoryName.get(p.categoryId) ?? "Sin categoría",
        search: normalizeText(p.name),
      }));
  }, [categories, products]);

  const normalizedQuery = normalizeText(query);
  const filtered = useMemo(() => {
    if (normalizedQuery.length === 0) return flatProducts;
    return flatProducts.filter((p) => p.search.includes(normalizedQuery));
  }, [flatProducts, normalizedQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const onQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

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

  const createProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    const categoryId = newCategoryId || sortedCategories[0]?.id;
    if (name.length < 2 || !categoryId) {
      setCreateError("Escribe un nombre y elige una categoría.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await api.createProduct(name, categoryId);
      setNewName("");
      setShowCreate(false);
      onQueryChange(name);
      router.refresh();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "No se pudo crear el insumo.",
      );
    } finally {
      setCreating(false);
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

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          >
            🔎
          </span>
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar insumo…"
            aria-label="Buscar insumo"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            setCreateError(null);
            if (!newCategoryId) setNewCategoryId(sortedCategories[0]?.id ?? "");
          }}
          className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          aria-expanded={showCreate}
        >
          {showCreate ? "Cerrar" : "+ Insumo"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createProduct}
          className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <p className="mb-2 text-xs text-slate-500">
            Crea un insumo que falte en la lista. Quedará disponible para todos
            los centros.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del insumo (ej. Cavas)"
              aria-label="Nombre del insumo"
              maxLength={80}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              aria-label="Categoría del insumo"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              {sortedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {creating ? "Creando…" : "Crear"}
            </button>
          </div>
          {createError && (
            <p className="mt-2 text-sm text-red-700">{createError}</p>
          )}
        </form>
      )}

      <div className="mt-4">
        {pageItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No se encontraron insumos para «{query}».
          </p>
        ) : (
          <ul className="space-y-2">
            {pageItems.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800">
                      {p.name}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {p.categoryName}
                    </span>
                  </span>
                  {!statusMap.has(p.id) && (
                    <span className="shrink-0 text-xs text-slate-400">
                      Sin definir
                    </span>
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
        )}
      </div>

      {pageCount > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-slate-500">
            Página {safePage} de {pageCount} · {filtered.length} insumo(s)
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={safePage >= pageCount}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 disabled:opacity-40"
          >
            Siguiente →
          </button>
        </nav>
      )}
    </div>
  );
}
