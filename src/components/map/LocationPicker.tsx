"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="avz-picker-map flex items-center justify-center bg-slate-100 text-sm text-slate-500">
      Cargando mapa…
    </div>
  ),
});

export default LocationPicker;
export type { LatLng } from "./LocationPickerMap";
