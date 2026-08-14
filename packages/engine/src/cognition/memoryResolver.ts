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
  return entries.map((entry, index) => ({ entry, index, world: buildWorldModel(entry) }));
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

  const relevant = returning ? scored : scored.filter((item) => item.score > 0).slice(0, 6);
  const episodes = memoryEpisodes(relevant.slice(0, 12).map((item) => item.entry));
  const placeEvidence = episodes.flatMap((episode) => episode.world.places.map((place) => ({ place, episode: episode.entry })));
  const distinctPlaces = unique(placeEvidence.map((item) => item.place));
  const placeBearingEpisodes = episodes.filter((episode) => episode.world.places.length > 0);
  const explicitPlace = explicitPlaceFromPrompt(prompt);

  const topEntries = episodes.map((episode) => episode.entry);
  const participants = unique(topEntries.flatMap((entry) => [...entry.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)].map((m) => m[0])))
    .filter((name) => !STOP_NAMES.test(name));
  const relatedTerms = unique(topEntries.flatMap((entry) => entry.split(/\W+/).filter((word) => word.length >= 6))).slice(0, 40);

  if (explicitPlace) {
    return { matches: topEntries, place: explicitPlace, participants, relatedTerms, questions: [] };
  }

  // Implicit returning references are resolved from remembered episodes. Two
  // place-bearing episodes are competing hypotheses even if their normalized
  // strings collide; one place-bearing episode is uniquely resolvable.
  if (returning) {
    if (placeBearingEpisodes.length >= 2) {
      return { matches: topEntries, participants, relatedTerms, questions: ["Which place did you go back to?"] };
    }
    if (placeBearingEpisodes.length === 1) {
      return { matches: topEntries, place: placeBearingEpisodes[0]!.world.places[0], participants, relatedTerms, questions: [] };
    }
    return { matches: topEntries, participants, relatedTerms, questions: ["Where did you go back to?"] };
  }

  if (distinctPlaces.length === 1) {
    return { matches: topEntries, place: distinctPlaces[0], participants, relatedTerms, questions: [] };
  }

  return { matches: topEntries, participants, relatedTerms, questions: [] };
}
