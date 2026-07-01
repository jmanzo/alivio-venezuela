"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RegistrationStatus } from "@/domain/Centro";
import { api } from "@/lib/api";
import { REGISTRATION_STATUS_META } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { CentroView } from "@/lib/view";

export function SuperAdminPanel({ centros }: { centros: CentroView[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (id: string, status: RegistrationStatus) => {
    setBusyId(id);
    setError(null);
    try {
      await api.setRegistration(id, status);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusyId(null);
    }
  };

  const logout = async () => {
    await api.logout();
    router.refresh();
  };

  const pending = centros.filter((c) => c.registrationStatus === "pending");
  const others = centros.filter((c) => c.registrationStatus !== "pending");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Panel del administrador
          </h1>
          <p className="text-sm text-slate-500">
            {centros.length} centro(s) · {pending.length} pendiente(s)
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
        >
          Salir
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mt-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Pendientes de aprobación
        </h2>
        {pending.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No hay solicitudes pendientes.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {pending.map((c) => (
              <li key={c.id}>
                <CentroRow centro={c} busy={busyId === c.id} onAct={act} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Todos los centros
        </h2>
        {others.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            Aún no hay centros aprobados.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {others.map((c) => (
              <li key={c.id}>
                <CentroRow centro={c} busy={busyId === c.id} onAct={act} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CentroRow({
  centro,
  busy,
  onAct,
}: {
  centro: CentroView;
  busy: boolean;
  onAct: (id: string, status: RegistrationStatus) => void;
}) {
  const meta = REGISTRATION_STATUS_META[centro.registrationStatus];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{centro.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">📍 {centro.addressLabel}</p>
          {(centro.contactName || centro.contactPhone) && (
            <p className="text-xs text-slate-400">
              {centro.contactName ?? ""}
              {centro.contactName && centro.contactPhone ? " · " : ""}
              {centro.contactPhone ?? ""}
            </p>
          )}
          <p className="mt-0.5 text-xs text-slate-400">
            Registrado {timeAgo(centro.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {centro.registrationStatus === "pending" && (
          <>
            <Action busy={busy} tone="primary" onClick={() => onAct(centro.id, "approved")}>
              Aprobar
            </Action>
            <Action busy={busy} tone="danger" onClick={() => onAct(centro.id, "rejected")}>
              Rechazar
            </Action>
          </>
        )}
        {centro.registrationStatus === "approved" && (
          <Action busy={busy} tone="danger" onClick={() => onAct(centro.id, "disabled")}>
            Deshabilitar
          </Action>
        )}
        {centro.registrationStatus === "disabled" && (
          <Action busy={busy} tone="primary" onClick={() => onAct(centro.id, "approved")}>
            Reactivar
          </Action>
        )}
        {centro.registrationStatus === "rejected" && (
          <Action busy={busy} tone="primary" onClick={() => onAct(centro.id, "approved")}>
            Aprobar de todos modos
          </Action>
        )}
      </div>
    </div>
  );
}

function Action({
  children,
  onClick,
  busy,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone: "primary" | "danger";
}) {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`min-h-10 flex-1 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 ${styles[tone]}`}
    >
      {busy ? "…" : children}
    </button>
  );
}
