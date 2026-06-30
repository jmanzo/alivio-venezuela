"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";

export interface LatLng {
  lat: number;
  lng: number;
}

const pickerIcon = L.divIcon({
  className: "avz-pin-wrapper",
  html: `<span class="avz-pin" style="--avz-pin-color:#0f766e"><span class="avz-pin__emoji">📍</span></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function ClickCapture({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

/** Recenters the map when the value is set programmatically (e.g. geolocation). */
function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 13));
    setTimeout(() => map.invalidateSize(), 120);
  }, [map, value]);
  return null;
}

export default function LocationPickerMap({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
}) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : MAP_DEFAULT_CENTER}
      zoom={value ? 13 : MAP_DEFAULT_ZOOM}
      scrollWheelZoom
      className="avz-picker-map"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onChange={onChange} />
      <Recenter value={value} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pickerIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onChange({ lat, lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
