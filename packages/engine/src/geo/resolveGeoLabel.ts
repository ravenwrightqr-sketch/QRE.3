/**
 * GEO RESOLVER (PRODUCTION SAFE)
 * OpenStreetMap reverse geocoding (Nominatim)
 */

export type GeoLabel = {
  label: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

export async function resolveGeoLabel(
  lat: number,
  lng: number
): Promise<GeoLabel> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "QRE.GeoEngine/1.0",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Geo lookup failed: ${res.status}`);
    }

    const data: any = await res.json();

    const address = data?.address ?? {};

    return {
      label: data?.display_name ?? null,
      city:
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        null,
      region: address.state ?? null,
      country: address.country ?? null,
    };
  } catch (err) {
    console.warn("[GEO][RESOLVE FAILED]", err);

    return {
      label: null,
      city: null,
      region: null,
      country: null,
    };
  }
}