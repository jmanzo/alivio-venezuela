"use client";

import type { Need, NeedStatus } from "@/domain/Need";
import { timeAgo } from "@/lib/format";
import { CategoryTag, StatusBadge, UrgencyBadge } from "./Badges";

interface NeedCardProps {
  need: Need;
  busy: boolean;
  onUpdateStatus: (id: string, status: NeedStatus) => void;
}

export function NeedCard({ need, busy, onUpdateStatus }: NeedCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryTag category={need.category} />
          <UrgencyBadge urgency={need.urgency} />
          <StatusBadge status={need.status} />
        </div>
        <time
          className="shrink-0 text-xs text-slate-400"
          dateTime={need.createdAt}
          suppressHydrationWarning
        >
          {timeAgo(need.createdAt)}
        </time>
      </header>

      <p className="mt-2 text-[15px] leading-snug text-slate-800">
        {need.description}
      </p>

      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
        <span aria-hidden>📍</span>
        {need.locationLabel}
      </p>

      {need.reporterContact && (
        <p className="mt-0.5 text-xs text-slate-400">
          Contacto: {need.reporterContact}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {need.status === "open" && (
          <ActionButton
            busy={busy}
            variant="primary"
            onClick={() => onUpdateStatus(need.id, "in_progress")}
          >
            Voy a cubrir esto
          </ActionButton>
        )}

        {need.status === "in_progress" && (
          <>
            <ActionButton
              busy={busy}
              variant="success"
              onClick={() => onUpdateStatus(need.id, "covered")}
            >
              Marcar como cubierta
            </ActionButton>
            <ActionButton
              busy={busy}
              variant="ghost"
              onClick={() => onUpdateStatus(need.id, "open")}
            >
              Liberar
            </ActionButton>
          </>
        )}

        {need.status === "covered" && (
          <ActionButton
            busy={busy}
            variant="ghost"
            onClick={() => onUpdateStatus(need.id, "open")}
          >
            Reabrir
          </ActionButton>
        )}
      </div>
    </article>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  variant: "primary" | "success" | "ghost";
}) {
  const styles: Record<typeof variant, string> = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
    success: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {busy ? "…" : children}
    </button>
  );
}
