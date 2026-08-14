import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LocationValue = {
  lat: number;
  lng: number;
  label?: string;
  city?: string;
  region?: string;
  country?: string;
};

type Props = {
  initial?: LocationValue | null;
  onSave: (location: LocationValue) => Promise<void>;
};

const DEFAULT_CENTER: L.LatLngExpression = [33.6595, -117.9988];

export default function LocationPicker({ initial, onSave }: Props) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [location, setLocation] = useState<LocationValue | null>(initial ?? null);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [saving, setSaving] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const center = initial ? [initial.lat, initial.lng] as L.LatLngExpression : DEFAULT_CENTER;
    const map = L.map(mapElement.current, { zoomControl: true }).setView(center, initial ? 15 : 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (event) => {
      const next = { lat: event.latlng.lat, lng: event.latlng.lng };
      setLocation((current) => ({ ...current, ...next }));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initial]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    const point: L.LatLngExpression = [location.lat, location.lng];
    map.setView(point, Math.max(map.getZoom(), 15));

    if (!markerRef.current) {
      markerRef.current = L.marker(point, { draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const current = markerRef.current?.getLatLng();
        if (!current) return;
        setLocation((value) => ({ ...value, lat: current.lat, lng: current.lng }));
      });
    } else {
      markerRef.current.setLatLng(point);
    }
  }, [location]);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setError("This browser does not provide GPS location.");
      return;
    }

    setGpsBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label,
        });
        setGpsBusy(false);
      },
      () => {
        setError("Unable to read your current location.");
        setGpsBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function save() {
    if (!location) {
      setError("Click the map or use your current location to place the pin.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({ ...location, label: label.trim() || undefined });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save location.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ marginTop: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", marginBottom: 14 }}>
        <div>
          <p style={{ opacity: 0.45, letterSpacing: 4, fontSize: 11, margin: 0 }}>EXACT LOCATION</p>
          <h2 style={{ margin: "6px 0 0" }}>Drop the pin</h2>
          <p style={{ opacity: 0.6, maxWidth: 620, margin: "8px 0 0" }}>
            Click anywhere on the real map, drag the pin, or use your device location. The saved coordinates become part of this experience.
          </p>
        </div>
        <button type="button" onClick={useCurrentLocation} disabled={gpsBusy || saving}>
          {gpsBusy ? "LOCATING…" : "USE MY LOCATION"}
        </button>
      </div>

      <div
        ref={mapElement}
        style={{ height: 420, width: "100%", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,.12)" }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ opacity: 0.5, fontSize: 12 }}>LABEL</span>
          <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Disneyland, Huntington Beach Pier, etc." />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ opacity: 0.5, fontSize: 12 }}>LATITUDE</span>
            <input value={location?.lat ?? ""} onChange={(event) => setLocation((current) => current ? { ...current, lat: Number(event.target.value) } : { lat: Number(event.target.value), lng: 0 })} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ opacity: 0.5, fontSize: 12 }}>LONGITUDE</span>
            <input value={location?.lng ?? ""} onChange={(event) => setLocation((current) => current ? { ...current, lng: Number(event.target.value) } : { lat: 0, lng: Number(event.target.value) })} />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 16 }}>
        <div style={{ minHeight: 22, color: "#ff7777", fontSize: 13 }}>{error}</div>
        <button type="button" onClick={save} disabled={!location || saving}>
          {saving ? "SAVING…" : "SAVE LOCATION"}
        </button>
      </div>
    </section>
  );
}
