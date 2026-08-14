import { nanoid } from "nanoid";
import type { ExperienceMoment, GeoStoryScene, CinematicScene, MemorySnapshot } from "@qre/contracts";
import { evolveRuntimeMemory } from "../cognition/serviceMemoryState.js";

type SnapshotInput = {
  assetId: string;
  moments: ExperienceMoment[];
  geoStory: { scenes: GeoStoryScene[]; summary?: string } | null;
  cinematicScenes: CinematicScene[];
  prior?: MemorySnapshot | null;
};

function hasMomentType(moments: ExperienceMoment[], types: string[]) {
  return moments.some((m) => types.includes(String(m.type)));
}

export function buildMemorySnapshot(input: SnapshotInput): MemorySnapshot {
  const { moments, geoStory, cinematicScenes, prior } = input;
  const hasLocation = hasMomentType(moments, ["location", "arrival"]);
  const hasMedia = hasMomentType(moments, ["photos", "video", "soundtrack", "replay", "media"]);
  const hasStory = hasMomentType(moments, ["story", "memory", "timeline"]);

  let type: MemorySnapshot["type"] = "generic";
  if (hasLocation && hasMedia) type = "event";
  else if (hasLocation) type = "service";
  else if (hasStory) type = "generic";
  if ((geoStory?.scenes.length ?? 0) > 3) type = "memorial";

  const locationTags = moments
    .filter((m) => ["location", "arrival"].includes(String(m.type)))
    .map((m) => {
      const label = m.location?.label ?? m.meta?.label ?? m.payload?.place;
      return typeof label === "string" ? label : "Unknown";
    });

  const timeline = moments.map((m, index) => {
    const raw = m.text ?? m.description ?? m.meta?.text ?? m.location?.label ?? m.type;
    return {
      label: typeof raw === "string" ? raw : String(m.type),
      timestamp: typeof m.meta?.time === "string" ? m.meta.time : new Date(Date.now() + index * 1000).toISOString(),
    };
  });

  const evolved = evolveRuntimeMemory(moments, prior);
  const evolvedType: MemorySnapshot["type"] = type === "generic" && hasStory ? "experience" : type;
  const emotionalTone = type === "memorial" ? "intense" : evolved.emotionalTone;

  let title = evolved.title || "Memory Capsule";
  if (type === "memorial") title = "A Life Remembered";
  else if (type === "service") title = "Experience Record";
  else if (type === "event") title = "Shared Experience";
  if (geoStory?.summary) title = geoStory.summary.slice(0, 80);

  return {
    ...evolved,
    id: prior?.id ?? nanoid(12),
    type: prior?.type ?? evolvedType,
    title,
    summary: geoStory?.summary ?? evolved.summary ?? `Captured ${moments.length} moments across experience.`,
    emotionalTone,
    highlights: [...new Set([...evolved.highlights, ...timeline.map((item) => item.label)])].slice(-8),
    locationTags: [...new Set([...evolved.locationTags, ...locationTags])],
    timeline,
    meta: {
      ...(evolved.meta ?? {}),
      assetId: input.assetId,
      cinematicSceneCount: cinematicScenes.length,
      geoSceneCount: geoStory?.scenes.length ?? 0,
      hasMedia,
      hasLocation,
      hasStory,
    },
  };
}
