"use client";

import { useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/format";
import type { CentroSummaryView } from "@/lib/view";
import CentrosMap from "./map/CentrosMap";

type ViewMode = "list" | "map";

export function CentrosBrowser({
  summaries,
}: {
  summaries: CentroSummaryView[];
}) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {summaries.length} centro(s) activo(s)
        </p>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <ViewTab active={view === "list"} onClick={() => setView("list")}>
            Lista
          </ViewTab>
          <ViewTab active={view === "map"} onClick={() => setView("map")}>
            Mapa
          </ViewTab>
        </div>
      </div>

      <div className="mt-3">
        {summaries.length === 0 ? (
          <EmptyState />
        ) : view === "list" ? (
          <ul className="space-y-3">
            {summaries.map((summary) => (
              <li key={summary.centro.id}>
                <CentroCard summary={summary} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <CentrosMap summaries={summaries} />
          </div>
        )}
      </div>
    </div>
  );
}

function CentroCard({ summary }: { summary: CentroSummaryView }) {
  const { centro, criticoCount, necesitaMasCount, trackedCount, lastUpdated } =
    summary;
  return (
    <Link
      href={`/centros/${centro.slug}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-slate-900">
            {centro.name}
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            <span aria-hidden>📍</span>
            <span className="truncate">{centro.addressLabel}</span>
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate-400">→</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
        {criticoCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
            🚨 {criticoCount} crítico(s)
          </span>
        )}
        {necesitaMasCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
            ⚠️ {necesitaMasCount} por reponer
          </span>
        )}
        {trackedCount === 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
            Sin información aún
          </span>
        )}
        <span className="ml-auto font-normal text-slate-400">
          {timeAgo(lastUpdated)}
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-3xl">🏚️</p>
      <p className="mt-2 font-semibold text-slate-700">
        Aún no hay centros activos
      </p>
      <p className="mt-1 text-sm text-slate-500">
        ¿Coordinas un centro de acopio?{" "}
        <Link href="/registrar" className="font-semibold text-slate-900 underline">
          Regístralo aquí
        </Link>
        .
      </p>
    </div>
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
