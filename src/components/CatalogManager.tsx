"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { normalizeText } from "@/lib/format";
import type { CategoryView, ProductView } from "@/lib/view";

interface CatalogManagerProps {
  categories: CategoryView[];
  products: ProductView[];
}

/**
 * Super-admin view of the shared catalog: create, rename, recategorize and
 * delete products. Kept deliberately small — the catalog is shared by every
 * centro, so this is the cleanup tool for duplicates and typos.
 */
export function CatalogManager({ categories, products }: CatalogManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [creating, setCreating] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );
  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const normalizedQuery = normalizeText(query);
  const filtered = useMemo(() => {
    const sorted = [...products].sort((a, b) => a.sortOrder - b.sortOrder);
    if (normalizedQuery.length === 0) return sorted;
    return sorted.filter((p) =>
      normalizeText(p.name).includes(normalizedQuery),
    );
  }, [products, normalizedQuery]);

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusyId(null);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    const categoryId = newCategoryId || sortedCategories[0]?.id;
    if (name.length < 2 || !categoryId) return;
    setCreating(true);
    setError(null);
    try {
      await api.createProduct(name, categoryId);
      setNewName("");
      setQuery(name);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
      >
        <span>
          <span className="block text-sm font-bold text-slate-900">
            Catálogo de insumos
          </span>
          <span className="block text-xs text-slate-500">
            {products.length} insumo(s) compartidos por todos los centros
          </span>
        </span>
        <span className="text-slate-400" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo insumo…"
              aria-label="Nombre del nuevo insumo"
              maxLength={80}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
            <select
              value={newCategoryId || sortedCategories[0]?.id || ""}
              onChange={(e) => setNewCategoryId(e.target.value)}
              aria-label="Categoría del nuevo insumo"
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
              disabled={creating || newName.trim().length < 2}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {creating ? "Creando…" : "Agregar"}
            </button>
          </form>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar insumo…"
            aria-label="Buscar insumo en el catálogo"
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />

          <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto">
            {filtered.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                categories={sortedCategories}
                categoryLabel={categoryName.get(p.categoryId) ?? "Sin categoría"}
                busy={busyId === p.id}
                onRename={(name) => run(p.id, () => api.updateProduct(p.id, { name }))}
                onRecategorize={(categoryId) =>
                  run(p.id, () => api.updateProduct(p.id, { categoryId }))
                }
                onDelete={() => run(p.id, () => api.deleteProduct(p.id))}
              />
            ))}
            {filtered.length === 0 && (
              <li className="p-3 text-center text-sm text-slate-500">
                No se encontraron insumos.
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}

function ProductRow({
  product,
  categories,
  categoryLabel,
  busy,
  onRename,
  onRecategorize,
  onDelete,
}: {
  product: ProductView;
  categories: CategoryView[];
  categoryLabel: string;
  busy: boolean;
  onRename: (name: string) => void;
  onRecategorize: (categoryId: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(product.name);

  const commitRename = () => {
    const name = draft.trim();
    setEditing(false);
    if (name.length >= 2 && name !== product.name) onRename(name);
    else setDraft(product.name);
  };

  return (
    <li className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            type="text"
            value={draft}
            autoFocus
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setDraft(product.name);
                setEditing(false);
              }
            }}
            aria-label={`Renombrar ${product.name}`}
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Toca para renombrar"
            className="block max-w-full truncate text-left text-sm font-medium text-slate-800"
          >
            {product.name}
          </button>
        )}
        <span className="block text-xs text-slate-400">{categoryLabel}</span>
      </div>
      <select
        value={product.categoryId}
        onChange={(e) => onRecategorize(e.target.value)}
        disabled={busy}
        aria-label={`Categoría de ${product.name}`}
        className="max-w-28 shrink-0 rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600 outline-none disabled:opacity-50"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (
            window.confirm(
              `¿Eliminar «${product.name}» del catálogo? Se borrará el estado que cualquier centro le haya puesto.`,
            )
          )
            onDelete();
        }}
        aria-label={`Eliminar ${product.name}`}
        className="shrink-0 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "…" : "🗑"}
      </button>
    </li>
  );
}
