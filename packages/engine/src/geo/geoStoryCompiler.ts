import type { GeoStory, GeoStoryScene } from "@qre/contracts";

export type GeoPoint = {
  lat: number;
  lng: number;
  createdAt: Date;
  label?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

export type SemanticGeoPlace = {
  label: string;
  kind?: string;
  timestamp?: string;
  evidence?: string[];
  intensity?: number;
  meta?: Record<string, unknown>;
};

export function buildGeoStory(
  assetId: string,
  points: GeoPoint[] = [],
  options: {
    sessionId?: string;
    semanticPlaces?: SemanticGeoPlace[];
    title?: string;
    summary?: string;
  } = {},
): GeoStory {
  const semanticPlaces = options.semanticPlaces ?? [];
  const physicalScenes = buildPhysicalScenes(points);
  const semanticScenes = buildSemanticScenes(semanticPlaces);
  const scenes = [...physicalScenes, ...semanticScenes];
  const mode = physicalScenes.length && semanticScenes.length
    ? "mixed"
    : physicalScenes.length
      ? "physical"
      : semanticScenes.length
        ? "semantic"
        : "none";

  if (!scenes.length) {
    return {
      assetId,
      sessionId: options.sessionId,
      title: options.title,
      scenes: [],
      summary: options.summary ?? "No geographic or place context recorded.",
      mode: "none",
      placeTags: [],
    };
  }

  const placeTags = [...new Set(
    scenes.map((scene) => scene.location?.label ?? scene.title).filter(Boolean),
  )];

  return {
    assetId,
    sessionId: options.sessionId,
    title: options.title ?? placeTags[0],
    scenes,
    summary: options.summary ?? generateSummary(points, semanticPlaces),
    startedAt: scenes[0]?.timestamp,
    endedAt: scenes.at(-1)?.timestamp,
    mode,
    placeTags,
    meta: {
      physicalPointCount: points.length,
      semanticPlaceCount: semanticPlaces.length,
    },
  };
}

function buildPhysicalScenes(points: GeoPoint[]): GeoStoryScene[] {
  if (!points.length) return [];
  const scenes: GeoStoryScene[] = [];
  const first = points[0]!;

  scenes.push({
    id: "intro",
    type: "intro",
    title: "Journey Begins",
    description: "A physical presence is detected entering the experience.",
    location: {
      lat: first.lat,
      lng: first.lng,
      label: first.label ?? undefined,
      city: first.city ?? undefined,
      region: first.region ?? undefined,
      country: first.country ?? undefined,
    },
    timestamp: first.createdAt.toISOString(),
    intensity: 0.2,
    evidenceMode: "physical",
    evidence: ["scan location"],
  });

  for (const group of groupByLocation(points)) {
    scenes.push({
      id: `presence-${group.key}`,
      type: "presence",
      title: group.label ?? "Unknown Location",
      description: `Visited ${group.points.length} time${group.points.length === 1 ? "" : "s"}.`,
      location: {
        lat: group.location.lat,
        lng: group.location.lng,
        label: group.label ?? undefined,
        city: group.points[0]?.city ?? undefined,
        region: group.points[0]?.region ?? undefined,
        country: group.points[0]?.country ?? undefined,
      },
      timestamp: group.points[0]!.createdAt.toISOString(),
      intensity: Math.min(1, group.points.length / 5),
      evidenceMode: "physical",
      evidence: [group.label ?? "physical presence"],
    });
  }

  const last = points.at(-1)!;
  scenes.push({
    id: "exit",
    type: "exit",
    title: "Session Ends",
    description: "The physical session closes at the latest recorded position.",
    location: {
      lat: last.lat,
      lng: last.lng,
      label: last.label ?? undefined,
      city: last.city ?? undefined,
      region: last.region ?? undefined,
      country: last.country ?? undefined,
    },
    timestamp: last.createdAt.toISOString(),
    intensity: 0.3,
    evidenceMode: "physical",
    evidence: ["scan location"],
  });

  return scenes;
}

function buildSemanticScenes(places: SemanticGeoPlace[]): GeoStoryScene[] {
  return places.map((place, index) => ({
    id: `semantic-place-${index + 1}`,
    type: index === 0 ? "memory_place" : "semantic_place",
    title: place.label,
    description: place.kind === "route"
      ? `Route context: ${place.label}.`
      : place.kind === "distance"
        ? `Travel distance: ${place.label}.`
        : `Place context: ${place.label}${place.kind ? ` (${place.kind})` : ""}.`,
    timestamp: place.timestamp ?? new Date().toISOString(),
    intensity: Math.max(0, Math.min(1, place.intensity ?? 0.65)),
    evidenceMode: "semantic",
    evidence: place.evidence ?? [place.label],
    meta: { kind: place.kind, semanticOnly: true, ...place.meta },
  }));
}

function groupByLocation(points: GeoPoint[]) {
  const map = new Map<string, GeoPoint[]>();
  for (const point of points) {
    const key = `${point.lat.toFixed(3)}:${point.lng.toFixed(3)}`;
    const existing = map.get(key) ?? [];
    existing.push(point);
    map.set(key, existing);
  }
  return [...map.entries()].map(([key, grouped]) => ({
    key,
    points: grouped,
    label: grouped[0]?.label ?? null,
    location: { lat: grouped[0]!.lat, lng: grouped[0]!.lng },
  }));
}

function generateSummary(points: GeoPoint[], places: SemanticGeoPlace[]) {
  if (points.length && places.length) {
    return `This experience connects ${points.length} physical presence signal${points.length === 1 ? "" : "s"} with ${places.length} named place context${places.length === 1 ? "" : "s"}.`;
  }
  if (points.length) {
    const locationCount = new Set(points.map((point) => point.city ?? point.label ?? "unknown")).size;
    return `Tracked ${points.length} physical interaction${points.length === 1 ? "" : "s"} across ${locationCount} location${locationCount === 1 ? "" : "s"}.`;
  }
  return `This experience is anchored to ${places.length} named place context${places.length === 1 ? "" : "s"}.`;
}
