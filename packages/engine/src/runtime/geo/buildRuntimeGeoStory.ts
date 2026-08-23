import type { GeoStory } from "@qre/contracts";
import { buildGeoStory } from "../../geo/geoStoryCompiler.js";

type RuntimeGeo = {
  lat: number;
  lng: number;
};

export function buildRuntimeGeoStory(
  assetId: string,
  geo?: RuntimeGeo,
): GeoStory {
  return buildGeoStory(
    assetId,
    geo
      ? [
          {
            lat: geo.lat,
            lng: geo.lng,
            createdAt: new Date(),
          },
        ]
      : [],
  );
}