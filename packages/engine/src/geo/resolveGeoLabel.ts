/**
 * QRE REVERSE GEO LABEL SERVICE
 *
 * Default provider is Nominatim, but the endpoint is switchable so production
 * can move to a managed provider or a self-hosted geocoder without changing
 * authoring/runtime contracts.
 *
 * The public Nominatim service is intentionally throttled and cached. QRE must
 * not treat a community endpoint as an enterprise-scale bulk geocoder.
 */

export type GeoLabel = {
  label: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

const cache = new Map<string, { value: GeoLabel; expiresAt: number }>();
const inFlight = new Map<string, Promise<GeoLabel>>();
let lastRequestAt = 0;

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 1100;
const REQUEST_TIMEOUT_MS = 5000;

function endpoint(): string {
  return (process.env.QRE_GEO_REVERSE_URL || "https://nominatim.openstreetmap.org/reverse").replace(/\/$/, "");
}

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(6)}:${lng.toFixed(6)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (now - lastRequestAt));
  if (wait) await sleep(wait);
  lastRequestAt = Date.now();
}

function nullLabel(): GeoLabel {
  return { label: null, city: null, region: null, country: null };
}

export async function resolveGeoLabel(lat: number, lng: number): Promise<GeoLabel> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return nullLabel();
  }

  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) cache.delete(key);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const requestPromise = (async (): Promise<GeoLabel> => {
    try {
      const url = new URL(endpoint());
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lng));
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");

      await throttle();

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const userAgent = process.env.QRE_GEO_USER_AGENT || "QRE.GeoEngine/2.0";
        const contact = process.env.QRE_GEO_CONTACT;
        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            "User-Agent": contact ? `${userAgent} (contact: ${contact})` : userAgent,
            Accept: "application/json",
            ...(process.env.QRE_GEO_LANGUAGE ? { "Accept-Language": process.env.QRE_GEO_LANGUAGE } : {}),
          },
        });

        if (!res.ok) throw new Error(`Geo lookup failed: ${res.status}`);

        const data = (await res.json()) as Record<string, any>;
        const address = data?.address ?? {};
        const value: GeoLabel = {
          label: typeof data?.display_name === "string" ? data.display_name : null,
          city: address.city || address.town || address.village || address.hamlet || address.municipality || null,
          region: address.state || address.province || address.region || null,
          country: address.country || null,
        };

        cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
        return value;
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      console.warn("[GEO][RESOLVE FAILED]", error);
      return nullLabel();
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, requestPromise);
  return requestPromise;
}

export function clearGeoLabelCache(): void {
  cache.clear();
  inFlight.clear();
}
