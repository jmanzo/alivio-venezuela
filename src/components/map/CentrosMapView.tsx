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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {summaries.map(({ centro, criticoCount, necesitaMasCount }) => (
        <Marker
          key={centro.id}
          position={[centro.lat, centro.lng]}
          icon={pinIcon({
            centro,
            criticoCount,
            necesitaMasCount,
            trackedCount: criticoCount + necesitaMasCount,
            lastUpdated: null,
          })}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">{centro.name}</p>
              <p className="text-xs text-slate-500">{centro.addressLabel}</p>
              {criticoCount > 0 && (
                <p className="text-xs font-semibold text-red-600">
                  🚨 {criticoCount} artículo(s) crítico(s)
                </p>
              )}
              <Link
                href={`/centros/${centro.slug}`}
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
