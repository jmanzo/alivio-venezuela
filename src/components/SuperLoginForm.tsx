"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function SuperLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (password.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await api.loginSuper(password);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clave incorrecta.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-center">
        <p className="text-3xl">🛡️</p>
        <h1 className="mt-2 text-lg font-bold text-slate-900">
          Acceso administrativo
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Panel del operador · aprobación de centros
        </p>
      </div>

      <label className="mb-1 mt-4 block text-sm font-semibold text-slate-700">
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

      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/" className="font-semibold text-slate-900 underline">
          ¿Eres ciudadano? Ver centros
        </Link>
      </p>
    </div>
  );
}
