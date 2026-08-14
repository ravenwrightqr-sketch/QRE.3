import { nanoid } from "nanoid";
import type { ExperienceMoment, GeoStoryScene, CinematicScene, MemorySnapshot } from "@qre/contracts";

type SnapshotInput = {
  assetId: string;
  moments: ExperienceMoment[];
  geoStory: { scenes: GeoStoryScene[]; summary?: string } | null;
  cinematicScenes: CinematicScene[];
};

function hasMomentType(moments: ExperienceMoment[], types: string[]) {
  return moments.some((m) => types.includes(String(m.type)));
}

export function buildMemorySnapshot(input: SnapshotInput): MemorySnapshot {
  const id = nanoid(12);
  const { moments, geoStory, cinematicScenes } = input;

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
      const label = m.location?.label ?? m.meta?.label;
      return typeof label === "string" ? label : "Unknown";
    });

  const timeline = moments.map((m, index) => {
    const raw = m.text ?? m.description ?? m.meta?.text ?? m.location?.label ?? m.type;
    return {
      label: typeof raw === "string" ? raw : String(m.type),
      timestamp: new Date(Date.now() + index * 1000).toISOString(),
    };
  });

  let emotionalTone: MemorySnapshot["emotionalTone"] = "neutral";
  if (type === "memorial") emotionalTone = "intense";
  else if (cinematicScenes.length > 0) emotionalTone = "mixed";
  else if (hasMedia) emotionalTone = "positive";

  const highlights = moments.slice(0, 5).map((m) => {
    const raw = m.text ?? m.description ?? m.meta?.text ?? m.location?.label ?? m.type;
    return typeof raw === "string" ? raw : String(m.type);
  });

  let title = "Memory Capsule";
  if (type === "memorial") title = "A Life Remembered";
  else if (type === "service") title = "Experience Record";
  else if (type === "event") title = "Shared Experience";
  if (geoStory?.summary) title = geoStory.summary.slice(0, 40);

  return {
    id,
    type,
    title,
    summary: geoStory?.summary ?? `Captured ${moments.length} moments across experience.`,
    emotionalTone,
    highlights,
    locationTags,
    timeline,
  };
}
