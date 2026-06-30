"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Need, NeedStatus } from "@/domain/Need";
import { api } from "@/lib/api";
import { sortNeeds, STATUS_META } from "@/lib/constants";
import { buildShareText } from "@/lib/format";
import { decodeNeedRow, getBrowserSupabase } from "@/lib/supabase-browser";
import { FilterBar, type Filters, type ViewMode } from "./FilterBar";
import NeedsMap from "./map/NeedsMap";
import { NeedsList } from "./NeedsList";
import { ReportNeedModal } from "./ReportNeedModal";

type RealtimeStatus = "connecting" | "live" | "off";

interface NeedsDashboardProps {
  initialNeeds: Need[];
  realtimeEnabled: boolean;
}

export function NeedsDashboard({
  initialNeeds,
  realtimeEnabled,
}: NeedsDashboardProps) {
  const [needs, setNeeds] = useState<Need[]>(() => sortNeeds(initialNeeds));
  const [filters, setFilters] = useState<Filters>({
    category: null,
    status: null,
  });
  const [view, setView] = useState<ViewMode>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState<RealtimeStatus>(
    realtimeEnabled ? "connecting" : "off",
  );
  const [exported, setExported] = useState(false);

  const handleExport = useCallback(async () => {
    const text = buildShareText(needs);
    try {
      if (navigator.share) {
        await navigator.share({ title: "AlivioVenezuela", text });
        return;
      }
    } catch {
      /* user cancelled share; fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(text);
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [needs]);

  const upsertNeed = useCallback((need: Need) => {
    setNeeds((prev) =>
      sortNeeds([need, ...prev.filter((n) => n.id !== need.id)]),
    );
  }, []);

  const removeNeed = useCallback((id: string) => {
    setNeeds((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Realtime: keep every connected client in sync without manual refresh.
  useEffect(() => {
    if (!realtimeEnabled) return;
    const sb = getBrowserSupabase();
    if (!sb) {
      setRealtime("off");
      return;
    }

    const channel = sb
      .channel("public:needs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "needs" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string })?.id;
            if (oldId) removeNeed(oldId);
            return;
          }
          const need = decodeNeedRow(payload.new);
          if (need) upsertNeed(need);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtime("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setRealtime("off");
      });

    return () => {
      sb.removeChannel(channel);
    };
  }, [realtimeEnabled, upsertNeed, removeNeed]);

  const handleUpdateStatus = useCallback(
    async (id: string, status: NeedStatus) => {
      setBusyId(id);
      setActionError(null);
      // Optimistic update; realtime/echo will reconcile.
      setNeeds((prev) =>
        sortNeeds(prev.map((n) => (n.id === id ? { ...n, status } : n))),
      );
      try {
        const updated = await api.updateStatus(id, status);
        upsertNeed(updated);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "No se pudo actualizar el estado.",
        );
        // Re-fetch authoritative state on failure.
        try {
          const fresh = await api.listNeeds();
          setNeeds(sortNeeds(fresh));
        } catch {
          /* keep optimistic state if refetch also fails */
        }
      } finally {
        setBusyId(null);
      }
    },
    [upsertNeed],
  );

  const filtered = useMemo(
    () =>
      needs.filter(
        (n) =>
          (filters.category === null || n.category === filters.category) &&
          (filters.status === null || n.status === filters.status),
      ),
    [needs, filters],
  );

  const counts = useMemo(
    () => ({
      open: needs.filter((n) => n.status === "open").length,
      in_progress: needs.filter((n) => n.status === "in_progress").length,
      covered: needs.filter((n) => n.status === "covered").length,
    }),
    [needs],
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-3">
        <StatsRow
          counts={counts}
          realtime={realtime}
          exported={exported}
          onExport={handleExport}
        />

        <div className="mt-3">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            view={view}
            onViewChange={setView}
          />
        </div>

        {actionError && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </p>
        )}

        <div className="mt-4">
          {view === "list" ? (
            <NeedsList
              needs={filtered}
              busyId={busyId}
              onUpdateStatus={handleUpdateStatus}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <NeedsMap needs={filtered} />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl px-4 pb-4"
      >
        <span className="flex min-h-13 items-center justify-center rounded-2xl bg-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 active:bg-emerald-800">
          + Reportar necesidad
        </span>
      </button>

      <ReportNeedModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={upsertNeed}
      />
    </div>
  );
}

function StatsRow({
  counts,
  realtime,
  exported,
  onExport,
}: {
  counts: { open: number; in_progress: number; covered: number };
  realtime: RealtimeStatus;
  exported: boolean;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Stat label={STATUS_META.open.label} value={counts.open} tone="slate" />
      <Stat
        label={STATUS_META.in_progress.label}
        value={counts.in_progress}
        tone="blue"
      />
      <Stat
        label={STATUS_META.covered.label}
        value={counts.covered}
        tone="emerald"
      />
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
        >
          {exported ? "¡Copiado!" : "Exportar"}
        </button>
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span
            className={`h-2 w-2 rounded-full ${
              realtime === "live"
                ? "animate-pulse bg-emerald-500"
                : realtime === "connecting"
                  ? "bg-amber-400"
                  : "bg-slate-300"
            }`}
          />
          {realtime === "live"
            ? "En vivo"
            : realtime === "connecting"
              ? "Conectando"
              : "Sin conexión"}
        </span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "blue" | "emerald";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-800",
    emerald: "bg-emerald-100 text-emerald-800",
  };
  return (
    <div className={`rounded-xl px-2.5 py-1.5 ${tones[tone]}`}>
      <span className="text-base font-bold">{value}</span>{" "}
      <span className="text-xs">{label}</span>
    </div>
  );
}
