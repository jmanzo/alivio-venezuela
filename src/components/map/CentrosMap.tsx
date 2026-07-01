"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window`, so the map is loaded client-side only. */
const CentrosMap = dynamic(() => import("./CentrosMapView"), {
  ssr: false,
  loading: () => (
    <div className="avz-map flex items-center justify-center bg-slate-100 text-sm text-slate-500">
      Cargando mapa…
    </div>
  ),
});

export default CentrosMap;
