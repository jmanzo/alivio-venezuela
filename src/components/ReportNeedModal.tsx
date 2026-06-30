"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, Need, Urgency } from "@/domain/Need";
import { api, type DuplicateCandidate } from "@/lib/api";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  URGENCY_META,
  URGENCY_ORDER,
} from "@/lib/constants";
import LocationPicker, { type LatLng } from "./map/LocationPicker";

interface ReportNeedModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (need: Need) => void;
}

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export function ReportNeedModal({ open, onClose, onCreated }: ReportNeedModalProps) {
  const [category, setCategory] = useState<Category>("water");
  const [urgency, setUrgency] = useState<Urgency>("critical");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [contact, setContact] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);

  const reset = () => {
    setCategory("water");
    setUrgency("critical");
    setDescription("");
    setLabel("");
    setLocation(null);
    setContact("");
    setSubmit({ kind: "idle" });
    setDuplicates([]);
    setGeoError(null);
  };

  // Debounced soft duplicate check whenever category + location are known.
  const checkSeq = useRef(0);
  useEffect(() => {
    if (!open || !location) {
      setDuplicates([]);
      return;
    }
    const seq = ++checkSeq.current;
    const handle = setTimeout(async () => {
      try {
        const { possibleDuplicates } = await api.checkDuplicates({
          category,
          lat: location.lat,
          lng: location.lng,
        });
        if (seq === checkSeq.current) setDuplicates(possibleDuplicates);
      } catch {
        // Non-blocking: ignore duplicate-check failures.
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [open, category, location]);

  if (!open) return null;

  const canSubmit =
    description.trim().length > 0 &&
    label.trim().length > 0 &&
    location !== null &&
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
      const { need } = await api.createNeed({
        category,
        urgency,
        description: description.trim(),
        locationLabel: label.trim(),
        lat: location.lat,
        lng: location.lng,
        reporterContact: contact.trim() || null,
      });
      onCreated(need);
      reset();
      onClose();
    } catch (err) {
      setSubmit({
        kind: "error",
        message: err instanceof Error ? err.message : "Error al enviar.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-black/40">
      <button
        type="button"
        aria-label="Cerrar"
        className="flex-1"
        onClick={onClose}
      />
      <div className="max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-8 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Reportar una necesidad</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>

        <Field label="Categoría">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((c) => (
              <SelectChip
                key={c}
                active={category === c}
                onClick={() => setCategory(c)}
              >
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </SelectChip>
            ))}
          </div>
        </Field>

        <Field label="Urgencia">
          <div className="flex gap-1.5">
            {URGENCY_ORDER.map((u) => (
              <SelectChip
                key={u}
                active={urgency === u}
                onClick={() => setUrgency(u)}
              >
                {URGENCY_META[u].label}
              </SelectChip>
            ))}
          </div>
        </Field>

        <Field label="Descripción">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="¿Qué se necesita y para cuántas personas?"
            className="w-full rounded-xl border border-slate-300 p-3 text-[15px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
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

        <Field label="Nombre del lugar">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={200}
            placeholder="Ej. San Felipe, sector Centro"
            className="w-full rounded-xl border border-slate-300 p-3 text-[15px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </Field>

        <Field label="Contacto (opcional)">
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={200}
            placeholder="Nombre o teléfono"
            className="w-full rounded-xl border border-slate-300 p-3 text-[15px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </Field>

        {duplicates.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-900">
              ⚠️ Hay {duplicates.length} reporte(s) similar(es) muy cerca
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
              {duplicates.slice(0, 3).map((d) => (
                <li key={d.need.id}>
                  {d.need.locationLabel} — a {Math.round(d.distanceKm * 1000)} m
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-amber-700">
              Revisa antes de enviar para evitar duplicados. Puedes enviar igual.
            </p>
          </div>
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
          className="mt-4 min-h-12 w-full rounded-2xl bg-emerald-600 text-base font-bold text-white transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submit.kind === "submitting" ? "Enviando…" : "Publicar necesidad"}
        </button>
      </div>
    </div>
  );
}

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

function SelectChip({
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
      className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition ${
        active
          ? "bg-emerald-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
