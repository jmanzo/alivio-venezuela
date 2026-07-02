"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import type { CentroSummaryView } from "@/lib/view";

/** Pin color reflects how urgently the centro needs donations. */
function pinColor(summary: CentroSummaryView): string {
  if (summary.criticoCount > 0) return "#dc2626";
  if (summary.necesitaMasCount > 0) return "#d97706";
  if (summary.trackedCount > 0) return "#16a34a";
  return "#64748b";
}

function pinIcon(summary: CentroSummaryView): L.DivIcon {
  return L.divIcon({
    className: "avz-pin-wrapper",
    html: `<span class="avz-pin" style="--avz-pin-color:${pinColor(summary)}"><span class="avz-pin__emoji">🏠</span></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

/** Keeps the Leaflet canvas correctly sized when the container appears/resizes. */
function ResizeHandler({ trigger }: { trigger: unknown }) {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(id);
  }, [map, trigger]);
  return null;
}

/** Frames every centro on open — otherwise pins outside the default viewport
 *  leave donors staring at an empty map. */
function FitToCentros({ summaries }: { summaries: CentroSummaryView[] }) {
  const map = useMap();
  useEffect(() => {
    if (summaries.length === 0) return;
    const bounds = L.latLngBounds(
      summaries.map((s) => [s.centro.lat, s.centro.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [map, summaries]);
  return null;
}

export default function CentrosMapView({
  summaries,
}: {
  summaries: CentroSummaryView[];
}) {
  return (
    <MapContainer
      center={MAP_DEFAULT_CENTER}
      zoom={MAP_DEFAULT_ZOOM}
      scrollWheelZoom
      className="avz-map"
    >
      <ResizeHandler trigger={summaries.length} />
      <FitToCentros summaries={summaries} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {summaries.map((summary) => (
        <Marker
          key={summary.centro.id}
          position={[summary.centro.lat, summary.centro.lng]}
          icon={pinIcon(summary)}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">{summary.centro.name}</p>
              <p className="text-xs text-slate-500">
                {summary.centro.addressLabel}
              </p>
              {summary.criticoCount > 0 && (
                <p className="text-xs font-semibold text-red-600">
                  🚨 {summary.criticoCount} artículo(s) crítico(s)
                </p>
              )}
              <Link
                href={`/centros/${summary.centro.slug}`}
                className="mt-1 inline-block text-sm font-semibold text-slate-900 underline"
              >
                Ver qué llevar
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
