"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Need } from "@/domain/Need";
import {
  CATEGORY_META,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  STATUS_META,
  URGENCY_META,
} from "@/lib/constants";

function pinIcon(need: Need): L.DivIcon {
  const color = URGENCY_META[need.urgency].color;
  const covered = need.status === "covered";
  return L.divIcon({
    className: "avz-pin-wrapper",
    html: `<span class="avz-pin ${covered ? "avz-pin--covered" : ""}" style="--avz-pin-color:${color}"><span class="avz-pin__emoji">${CATEGORY_META[need.category].emoji}</span></span>`,
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

export default function NeedsMapView({
  needs,
  onSelect,
}: {
  needs: Need[];
  onSelect?: (need: Need) => void;
}) {
  return (
    <MapContainer
      center={MAP_DEFAULT_CENTER}
      zoom={MAP_DEFAULT_ZOOM}
      scrollWheelZoom
      className="avz-map"
    >
      <ResizeHandler trigger={needs.length} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {needs.map((need) => (
        <Marker key={need.id} position={[need.lat, need.lng]} icon={pinIcon(need)}>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">
                {CATEGORY_META[need.category].emoji}{" "}
                {CATEGORY_META[need.category].label} · {URGENCY_META[need.urgency].label}
              </p>
              <p className="text-sm">{need.description}</p>
              <p className="text-xs text-slate-500">
                {need.locationLabel} — {STATUS_META[need.status].label}
              </p>
              {onSelect && (
                <button
                  type="button"
                  onClick={() => onSelect(need)}
                  className="mt-1 text-sm font-semibold text-emerald-700 underline"
                >
                  Gestionar
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
