"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import LocationPicker, { type LatLng } from "./map/LocationPicker";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "done" };

export function RegisterCentroForm() {
  const [name, setName] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });

  const passwordsMatch = password.length >= 6 && password === confirm;
  const canSubmit =
    name.trim().length >= 2 &&
    addressLabel.trim().length >= 2 &&
    location !== null &&
    passwordsMatch &&
    submit.kind !== "submitting";

  const useMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Tu dispositivo no permite geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError("No se pudo obtener tu ubicación. Toca el mapa."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSubmit = async () => {
    if (!location) return;
    setSubmit({ kind: "submitting" });
    try {
      await api.registerCentro({
        name: name.trim(),
        addressLabel: addressLabel.trim(),
        lat: location.lat,
        lng: location.lng,
        contactName: contactName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        password,
      });
      setSubmit({ kind: "done" });
    } catch (err) {
      setSubmit({
        kind: "error",
        message: err instanceof Error ? err.message : "Error al registrar.",
      });
    }
  };

  if (submit.kind === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-4xl">✅</p>
        <h2 className="mt-2 text-lg font-bold text-emerald-900">
          Registro enviado
        </h2>
        <p className="mt-1 text-sm text-emerald-800">
          Tu centro quedó pendiente de aprobación. Cuando el administrador lo
          apruebe, podrás iniciar sesión con tu clave para publicar qué
          artículos necesitas.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Field label="Nombre del centro">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Ej. Centro de Acopio Los Salias"
          className={inputClass}
        />
      </Field>

      <Field label="Dirección (texto)">
        <input
          value={addressLabel}
          onChange={(e) => setAddressLabel(e.target.value)}
          maxLength={200}
          placeholder="Ej. Av. principal, San Antonio de los Altos"
          className={inputClass}
        />
      </Field>

      <Field label="Ubicación (toca el mapa o usa tu ubicación)">
        <div className="overflow-hidden rounded-xl border border-slate-300">
          <LocationPicker value={location} onChange={setLocation} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            className="min-h-10 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            📍 Usar mi ubicación
          </button>
          {location && (
            <span className="text-xs text-slate-400">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
        </div>
        {geoError && <p className="mt-1 text-xs text-red-600">{geoError}</p>}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Contacto (opcional)">
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            maxLength={120}
            placeholder="Nombre del responsable"
            className={inputClass}
          />
        </Field>
        <Field label="Teléfono (opcional)">
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            maxLength={60}
            placeholder="0212-000-0000"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Clave de acceso del centro">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={200}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
          />
        </Field>
        <Field label="Confirmar clave">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            maxLength={200}
            placeholder="Repite la clave"
            className={inputClass}
          />
        </Field>
      </div>
      {password.length > 0 && !passwordsMatch && (
        <p className="text-xs text-amber-700">
          Las claves deben coincidir y tener al menos 6 caracteres.
        </p>
      )}

      {submit.kind === "error" && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {submit.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-4 min-h-12 w-full rounded-2xl bg-slate-900 text-base font-bold text-white transition hover:bg-slate-700 active:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submit.kind === "submitting" ? "Enviando…" : "Registrar centro"}
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">
        Tu centro será revisado por el administrador antes de aparecer
        públicamente.
      </p>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 p-3 text-[15px] outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
