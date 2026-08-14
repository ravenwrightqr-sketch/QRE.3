import type { UniversalMindContext } from "./universalMindContext.js";
import { buildWorldModel } from "./worldModel.js";

export type MemoryResolution = {
  matches: string[];
  place?: string;
  participants: string[];
  relatedTerms: string[];
  questions: string[];
};

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "") : "";
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];
const STOP_NAMES = /^(The|Then|At|And|My|Our|This|First|Later|Everyone|Grandma)$/i;

function strings(context: UniversalMindContext): string[] {
  return unique([
    ...(context.memorySummary ?? []),
    ...(context.memories ?? []).map((value) => typeof value === "string" ? value : JSON.stringify(value) ?? ""),
  ]);
}

function memoryEpisodes(entries: string[]) {
  return entries
    .map((entry, index) => ({ entry, index, world: buildWorldModel(entry) }))
    .filter((episode) => episode.world.places.length > 0 || episode.world.events.length > 0);
}

function explicitPlaceFromPrompt(prompt: string): string | undefined {
  const world = buildWorldModel(prompt);
  return world.places.length === 1 ? world.places[0] : undefined;
}

export function resolveMemory(prompt: string, context: UniversalMindContext): MemoryResolution {
  const memory = strings(context);
  if (!memory.length) return { matches: [], participants: [], relatedTerms: [], questions: [] };

  const promptWords = new Set(prompt.toLowerCase().split(/\W+/).filter((word) => word.length >= 4));
  const returning = /\b(?:back|again|returned|returning|same place|there|here)\b/i.test(prompt);

  const scored = memory.map((entry, index) => {
    const words = entry.toLowerCase().split(/\W+/).filter((word) => word.length >= 4);
    const overlap = words.reduce((score, word) => score + (promptWords.has(word) ? 1 : 0), 0);
    return { entry, score: overlap, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const relevant = returning
    ? scored
    : scored.filter((item) => item.score > 0).slice(0, 6);
  const episodes = memoryEpisodes(relevant.slice(0, 12).map((item) => item.entry));
  const rememberedPlaces = unique(episodes.flatMap((episode) => episode.world.places));
  const explicitPlace = explicitPlaceFromPrompt(prompt);

  // Explicit current-world place wins: "returned to Disneyland" is resolvable
  // even when memory contains several other places.
  if (explicitPlace) {
    const topEntries = episodes.map((episode) => episode.entry);
    return {
      matches: topEntries,
      place: explicitPlace,
      participants: unique(topEntries.flatMap((entry) => [...entry.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)].map((m) => m[0]))).filter((name) => !STOP_NAMES.test(name)),
      relatedTerms: unique(topEntries.flatMap((entry) => entry.split(/\W+/).filter((word) => word.length >= 6))).slice(0, 40),
      questions: [],
    };
  }

  // For implicit returning references, memory owns ambiguity. A single
  // remembered place resolves; two or more distinct remembered places require
  // a targeted question. Do not let the current prompt's lack of a place erase
  // remembered spatial candidates.
  const place = returning && rememberedPlaces.length === 1 ? rememberedPlaces[0] : !returning && rememberedPlaces.length === 1 ? rememberedPlaces[0] : undefined;
  const questions = returning && rememberedPlaces.length > 1
    ? ["Which place did you go back to?"]
    : returning && rememberedPlaces.length === 0
      ? ["Where did you go back to?"]
      : [];

  const topEntries = episodes.map((episode) => episode.entry);
  const participants = unique(topEntries.flatMap((entry) => [...entry.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)].map((m) => m[0])))
    .filter((name) => !STOP_NAMES.test(name));

  return {
    matches: topEntries,
    place,
    participants,
    relatedTerms: unique(topEntries.flatMap((entry) => entry.split(/\W+/).filter((word) => word.length >= 6))).slice(0, 40),
    questions,
  };
}
