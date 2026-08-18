import type { GeoObservationV17, GeoPermissionV17 } from "@qre/contracts";

export type GeoCaptureOptionsV17 = {
  enableHighAccuracy?: boolean;
  timeoutMs?: number;
  maximumAgeMs?: number;
  outputVisibility?: GeoObservationV17["outputVisibility"];
  sourceRef?: string;
  entityIds?: string[];
  sessionId?: string;
};

export type GeoCaptureResultV17 =
  | { ok: true; observation: GeoObservationV17 }
  | { ok: false; reason: "unsupported" | "permission_denied" | "timeout" | "position_unavailable" | "unknown"; message: string };

function permissionState(): GeoPermissionV17 {
  return "unknown";
}

function normalizeHeading(value: number | null): number | null {
  if (!Number.isFinite(value ?? NaN)) return null;
  return ((value! % 360) + 360) % 360;
}

function permissionError(error: GeolocationPositionError): GeoCaptureResultV17 {
  const reason = error.code === error.PERMISSION_DENIED
    ? "permission_denied"
    : error.code === error.TIMEOUT
      ? "timeout"
      : error.code === error.POSITION_UNAVAILABLE
        ? "position_unavailable"
        : "unknown";
  return { ok: false, reason, message: error.message || "Unable to determine current location." };
}

function observationFromPosition(
  position: GeolocationPosition,
  options: GeoCaptureOptionsV17,
): GeoObservationV17 {
  const coords = position.coords;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracyMeters: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
    altitudeMeters: Number.isFinite(coords.altitude ?? NaN) ? coords.altitude : null,
    altitudeAccuracyMeters: Number.isFinite(coords.altitudeAccuracy ?? NaN) ? coords.altitudeAccuracy : null,
    headingDegrees: normalizeHeading(coords.heading),
    speedMps: Number.isFinite(coords.speed ?? NaN) && (coords.speed ?? -1) >= 0 ? coords.speed : null,
    capturedAt: new Date(position.timestamp).toISOString(),
    source: "runtime",
    permission: permissionState(),
    confidence: 1,
    quality: coords.accuracy <= 10 ? "excellent" : coords.accuracy <= 50 ? "good" : coords.accuracy <= 200 ? "usable" : "poor",
    visibility: "private",
    outputVisibility: options.outputVisibility ?? "precise",
    entityIds: options.entityIds ?? [],
    sessionId: options.sessionId ?? null,
    sourceRef: options.sourceRef ?? null,
  };
}

export async function captureCurrentLocationV17(
  options: GeoCaptureOptionsV17 = {},
): Promise<GeoCaptureResultV17> {
  if (!("geolocation" in navigator)) {
    return { ok: false, reason: "unsupported", message: "This browser does not provide geolocation." };
  }
  if (!window.isSecureContext) {
    return { ok: false, reason: "unknown", message: "Location requires a secure HTTPS context." };
  }

  const result = await new Promise<{ position?: GeolocationPosition; error?: GeolocationPositionError }>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ position }),
      (error) => resolve({ error }),
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeoutMs ?? 10_000,
        maximumAge: options.maximumAgeMs ?? 0,
      },
    );
  });

  if (result.error) return permissionError(result.error);
  if (!result.position) return { ok: false, reason: "unknown", message: "Location capture returned no position." };
  return { ok: true, observation: observationFromPosition(result.position, options) };
}

export function watchLocationV17(
  onObservation: (observation: GeoObservationV17) => void,
  onError: (result: GeoCaptureResultV17) => void,
  options: GeoCaptureOptionsV17 = {},
): () => void {
  if (!("geolocation" in navigator) || !window.isSecureContext) {
    onError({ ok: false, reason: "unsupported", message: "Secure browser geolocation is unavailable." });
    return () => undefined;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => onObservation(observationFromPosition(position, options)),
    (error) => onError(permissionError(error)),
    {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeoutMs ?? 15_000,
      maximumAge: options.maximumAgeMs ?? 5_000,
    },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
