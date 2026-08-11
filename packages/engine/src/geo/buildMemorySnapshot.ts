import { nanoid } from "nanoid";
import type { CinematicScene, GeoStory, MemorySnapshot, Moment } from "@qre/contracts";

type SnapshotInput = {
  assetId?: string;
  sessionId?: string;
  prompt?: string;
  moments: Moment[];
  geoStory?: GeoStory | null;
  cinematicScenes: CinematicScene[];
  entities?: string[];
  themes?: string[];
  source?: "prompt" | "event" | "scan" | "memory" | "system";
  observedAt?: string;
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

function momentText(moment: Moment): string {
  const raw = moment.meta?.text ?? moment.meta?.label ?? moment.type;
  return clean(raw) || String(moment.type);
}

function inferType(prompt: string, geoStory: GeoStory | null | undefined): MemorySnapshot["type"] {
  const text = prompt.toLowerCase();
  if (/\b(memorial|funeral|death|died|grief)\b/.test(text)) return "memorial";
  if (/\b(wedding|birthday|anniversary|rave|concert|festival|party|ceremony|event)\b/.test(text)) return "event";
  if (/\b(business|company|brand|restaurant|shop|studio|salon|groomer|customer|client)\b/.test(text)) return "business";
  if (/\b(cleaning|cleaner|housekeeper|repair|service|appointment|treatment|grooming)\b/.test(text)) return "service";
  if (/\b(wife|husband|partner|girlfriend|boyfriend|family|friend|relationship)\b/.test(text)) return "relationship";
  if (geoStory?.mode === "physical" || geoStory?.mode === "semantic") return "location";
  if (/\b(my|our|i|me|family|personal)\b/.test(text)) return "personal";
  return "experience";
}

function inferTone(prompt: string, moments: Moment[], type: MemorySnapshot["type"]): MemorySnapshot["emotionalTone"] {
  const text = `${prompt} ${moments.map(momentText).join(" ")}`.toLowerCase();
  if (/\b(luxury|lavish|opulent|billionaire|vip|exclusive)\b/.test(text)) return "luxury";
  if (/\b(terrifying|terror|horror|danger|grief|funeral|death|crisis)\b/.test(text)) return "intense";
  if (/\b(rave|energetic|wild|party|dance|epic)\b/.test(text)) return "energetic";
  if (/\b(friendly|warm|family|welcome|care|service)\b/.test(text)) return "friendly";
  if (type === "business" || /\b(client|customer|professional)\b/.test(text)) return "professional";
  if (/\b(fun|funny|joy|celebrate|wedding|birthday|delight)\b/.test(text)) return "positive";
  return moments.length > 2 ? "mixed" : "neutral";
}

function titleFor(prompt: string, geoStory: GeoStory | null | undefined, entities: string[]): string {
  if (geoStory?.title) return geoStory.title;
  const subject = entities.find(Boolean);
  if (subject) return `${subject} — Memory`; 
  const words = clean(prompt).replace(/[.!?]+$/, "");
  return words ? words.slice(0, 72) : "Experience Memory";
}

export function buildMemorySnapshot(input: SnapshotInput): MemorySnapshot {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const geoStory = input.geoStory ?? null;
  const texts = input.moments.map(momentText).filter(Boolean);
  const type = inferType(input.prompt ?? "", geoStory);
  const entities = [...new Set((input.entities ?? []).map(clean).filter(Boolean))];
  const themes = [...new Set((input.themes ?? []).map(clean).filter(Boolean))];
  const highlights = texts.slice(0, 8);
  const locationTags = [...new Set([
    ...(geoStory?.placeTags ?? []),
    ...geoStory?.scenes.map((scene) => scene.location?.label ?? "").filter(Boolean) ?? [],
  ])];
  const timeline = input.moments.map((moment, index) => ({
    label: momentText(moment),
    timestamp:
      typeof moment.meta?.timestamp === "string"
        ? moment.meta.timestamp
        : observedAt,
    kind: String(moment.type),
    source: input.source ?? "system",
    confidence: 0.9,
  }));

  const summary = geoStory?.summary
    ? `${geoStory.summary}${highlights.length ? ` ${highlights[0]}` : ""}`.trim()
    : input.prompt
      ? `Preserved experience from: ${clean(input.prompt).slice(0, 700)}`
      : `Captured ${input.moments.length} moments.`;

  return {
    id: nanoid(12),
    assetId: input.assetId,
    sessionId: input.sessionId,
    type,
    title: titleFor(input.prompt ?? "", geoStory, entities),
    summary,
    emotionalTone: inferTone(input.prompt ?? "", input.moments, type),
    highlights,
    locationTags,
    timeline,
    confidence: 0.9,
    themes,
    entities,
    geoSceneIds: geoStory?.scenes.map((scene) => scene.id) ?? [],
    geoMode: geoStory?.mode ?? "none",
    provenance: {
      source: input.source ?? "system",
      observedAt,
      evidenceCount: highlights.length + entities.length + locationTags.length,
    },
    meta: {
      prompt: input.prompt,
      momentCount: input.moments.length,
      cinematicSceneCount: input.cinematicScenes.length,
      geoSceneCount: geoStory?.scenes.length ?? 0,
    },
  };
}
