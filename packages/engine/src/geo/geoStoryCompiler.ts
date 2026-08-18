import type {
  GeoStory,
  GeoStoryScene,
} from "@qre/contracts";
import { haversineDistanceMetersV17 } from "./geoIntelligenceV17.js";

export type GeoPoint = {
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
  createdAt: Date;
  label?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

export function buildGeoStory(assetId: string, points: GeoPoint[]): GeoStory {
  if (!points.length) return { assetId, scenes: [], summary: "No movement recorded." };

  const ordered = points.slice().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const scenes: GeoStoryScene[] = [];
  const first = ordered[0];

  scenes.push({
    id: "intro",
    type: "intro",
    title: "Journey Begins",
    description: "A presence is detected entering the experience.",
    location: locationFor(first),
    intensity: 0.2,
    timestamp: first.createdAt.toISOString(),
  });

  for (const group of groupByLocation(ordered)) {
    scenes.push({
      id: `presence-${group.key}`,
      type: "presence",
      title: group.label ?? "Observed Location",
      description: `Observed ${group.points.length} time${group.points.length === 1 ? "" : "s"}.`,
      location: locationFor(group.points[0]),
      intensity: Math.min(1, group.points.length / 5),
      timestamp: group.points[0].createdAt.toISOString(),
    });
  }

  const last = ordered[ordered.length - 1];
  scenes.push({
    id: "exit",
    type: "exit",
    title: "Journey Ends",
    description: "The last recorded location closes the observed journey.",
    location: locationFor(last),
    intensity: 0.3,
    timestamp: last.createdAt.toISOString(),
  });

  return {
    assetId,
    scenes,
    startedAt: first.createdAt.toISOString(),
    endedAt: last.createdAt.toISOString(),
    summary: generateSummary(ordered),
  };
}

function locationFor(point: GeoPoint) {
  return {
    lat: point.lat,
    lng: point.lng,
    label: point.label ?? undefined,
    city: point.city ?? undefined,
    region: point.region ?? undefined,
    country: point.country ?? undefined,
  };
}

function groupByLocation(points: GeoPoint[]) {
  const groups: Array<{ key: string; points: GeoPoint[]; label: string | null }> = [];

  for (const point of points) {
    const configuredRadius = 75;
    let group = groups.find((candidate) => {
      const representative = candidate.points[0];
      const radius = Math.min(
        250,
        Math.max(
          configuredRadius,
          representative.accuracyMeters ?? configuredRadius,
          point.accuracyMeters ?? configuredRadius,
        ),
      );
      return haversineDistanceMetersV17(
        { latitude: point.lat, longitude: point.lng },
        { latitude: representative.lat, longitude: representative.lng },
      ) <= radius;
    });

    if (!group) {
      group = {
        key: `geo-${groups.length + 1}`,
        points: [],
        label: point.label ?? null,
      };
      groups.push(group);
    }

    group.points.push(point);
    if (!group.label && point.label) group.label = point.label;
  }

  return groups;
}

function generateSummary(points: GeoPoint[]): string {
  const places = new Set(
    points.map((point) => point.city ?? point.region ?? point.country ?? "unknown"),
  );
  const distance = points.slice(1).reduce((sum, point, index) =>
    sum + haversineDistanceMetersV17(
      { latitude: points[index].lat, longitude: points[index].lng },
      { latitude: point.lat, longitude: point.lng },
    ), 0,
  );

  return `Observed ${points.length} location point${points.length === 1 ? "" : "s"} across ${places.size} named area${places.size === 1 ? "" : "s"}, covering approximately ${Math.round(distance)} meters of recorded movement.`;
}
