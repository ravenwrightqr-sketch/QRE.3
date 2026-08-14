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

function extractMemoryPlaces(entry: string): string[] {
  return buildWorldModel(entry).places;
}

function memoryCandidates(entries: string[]): Array<{ entry: string; places: string[] }> {
  return entries
    .map((entry) => ({ entry, places: extractMemoryPlaces(entry) }))
    .filter((item) => item.places.length > 0);
}

function explicitPlaceReference(prompt: string): string | undefined {
  const world = buildWorldModel(prompt);
  return world.places[0];
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

  // Returning references preserve every memory entry that could plausibly
  // contribute a place. For non-returning input we can safely narrow first.
  const relevant = returning
    ? scored.filter((item) => item.score >= 0)
    : scored.filter((item) => item.score > 0).slice(0, 6);
  const top = relevant.slice(0, 6).map((item) => item.entry);
  const spatial = memoryCandidates(top);
  const candidates = unique(spatial.flatMap((item) => item.places));
  const explicitPlace = explicitPlaceReference(prompt);

  let place: string | undefined;
  if (explicitPlace) {
    const exact = candidates.find((candidate) => candidate.toLowerCase() === explicitPlace.toLowerCase());
    place = exact ?? explicitPlace;
  } else if (candidates.length === 1) {
    place = candidates[0];
  }

  const questions = returning && candidates.length > 1 && !place
    ? ["Which place did you go back to?"]
    : returning && candidates.length === 0
      ? ["Where did you go back to?"]
      : [];

  const participants = unique(top.flatMap((entry) => [...entry.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)].map((m) => m[0])))
    .filter((name) => !STOP_NAMES.test(name));

  return {
    matches: top,
    place,
    participants,
    relatedTerms: unique(top.flatMap((entry) => entry.split(/\W+/).filter((word) => word.length >= 6))).slice(0, 40),
    questions,
  };
}
