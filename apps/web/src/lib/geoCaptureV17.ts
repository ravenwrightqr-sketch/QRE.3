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
  if (!("permissions" in navigator)) return "unknown";
  return "unknown";
}

function normalizeHeading(value: number | null): number | null {
  if (!Number.isFinite(value ?? NaN)) return null;
  return ((value! % 360) + 360) % 360;
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

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeoutMs ?? 10_000,
      maximumAge: options.maximumAgeMs ?? 0,
    });
  }).catch((error: GeolocationPositionError) => error);

  if (position instanceof GeolocationPositionError) {
    const reason = position.code === position.PERMISSION_DENIED
      ? "permission_denied"
      : position.code === position.TIMEOUT
        ? "timeout"
        : position.code === position.POSITION_UNAVAILABLE
          ? "position_unavailable"
          : "unknown";
    return { ok: false, reason, message: position.message || "Unable to determine current location." };
  }

  const coords = position.coords;
  const observation: GeoObservationV17 = {
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

  return { ok: true, observation };
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
    (position) => {
      const coords = position.coords;
      onObservation({
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
      });
    },
    (error) => {
      const reason = error.code === error.PERMISSION_DENIED
        ? "permission_denied"
        : error.code === error.TIMEOUT
          ? "timeout"
          : error.code === error.POSITION_UNAVAILABLE
            ? "position_unavailable"
            : "unknown";
      onError({ ok: false, reason, message: error.message || "Location watch failed." });
    },
    {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeoutMs ?? 15_000,
      maximumAge: options.maximumAgeMs ?? 5_000,
    },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
