"use client";

import type { Category, NeedStatus } from "@/domain/Need";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from "@/lib/constants";

export interface Filters {
  category: Category | null;
  status: NeedStatus | null;
}

export type ViewMode = "list" | "map";

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function FilterBar({
  filters,
  onChange,
  view,
  onViewChange,
}: FilterBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Filtrar
        </p>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <ViewTab active={view === "list"} onClick={() => onViewChange("list")}>
            Lista
          </ViewTab>
          <ViewTab active={view === "map"} onClick={() => onViewChange("map")}>
            Mapa
          </ViewTab>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip
          active={filters.category === null}
          onClick={() => onChange({ ...filters, category: null })}
        >
          Todas
        </Chip>
        {CATEGORY_ORDER.map((c) => (
          <Chip
            key={c}
            active={filters.category === c}
            onClick={() =>
              onChange({
                ...filters,
                category: filters.category === c ? null : c,
              })
            }
          >
            {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip
          active={filters.status === null}
          onClick={() => onChange({ ...filters, status: null })}
        >
          Cualquier estado
        </Chip>
        {STATUS_ORDER.map((s) => (
          <Chip
            key={s}
            active={filters.status === s}
            onClick={() =>
              onChange({ ...filters, status: filters.status === s ? null : s })
            }
          >
            {STATUS_META[s].label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-full px-3 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function ViewTab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-lg px-4 text-sm font-semibold transition ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}
