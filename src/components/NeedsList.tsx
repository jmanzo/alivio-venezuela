"use client";

import type { Need, NeedStatus } from "@/domain/Need";
import { NeedCard } from "./NeedCard";

interface NeedsListProps {
  needs: Need[];
  busyId: string | null;
  onUpdateStatus: (id: string, status: NeedStatus) => void;
}

export function NeedsList({ needs, busyId, onUpdateStatus }: NeedsListProps) {
  if (needs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-3xl">🕊️</p>
        <p className="mt-2 font-semibold text-slate-700">No hay necesidades aquí</p>
        <p className="mt-1 text-sm text-slate-500">
          Ajusta los filtros o reporta una nueva necesidad.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {needs.map((need) => (
        <li key={need.id}>
          <NeedCard
            need={need}
            busy={busyId === need.id}
            onUpdateStatus={onUpdateStatus}
          />
        </li>
      ))}
    </ul>
  );
}
