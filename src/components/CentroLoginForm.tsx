"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function CentroLoginForm({
  centros,
}: {
  centros: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [centroId, setCentroId] = useState(centros[0]?.id ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!centroId || password.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await api.loginCentro(centroId, password);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-center">
        <p className="text-3xl">🔑</p>
        <h1 className="mt-2 text-lg font-bold text-slate-900">Acceso de centro</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inicia sesión para actualizar qué artículos necesitas.
        </p>
      </div>

      {centros.length === 0 ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Aún no hay centros aprobados. Si ya te registraste, espera la
          aprobación del administrador.
        </p>
      ) : (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Centro
          </label>
          <select
            value={centroId}
            onChange={(e) => setCentroId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-[15px] outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {centros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="mb-1 mt-3 block text-sm font-semibold text-slate-700">
            Clave de acceso
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-xl border border-slate-300 p-3 text-[15px] outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="mt-4 min-h-12 w-full rounded-2xl bg-slate-900 text-base font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? "Ingresando…" : "Ingresar"}
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/registrar" className="font-semibold text-slate-900 underline">
          Registrar un nuevo centro
        </Link>
      </p>
    </div>
  );
}
