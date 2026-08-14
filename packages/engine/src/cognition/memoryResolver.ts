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

function memoryWorlds(entries: string[]) {
  return entries.map((entry) => ({ entry, world: buildWorldModel(entry) }));
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
  const top = relevant.slice(0, 12).map((item) => item.entry);
  const worlds = memoryWorlds(top);

  const candidateByEntry = worlds
    .filter((item) => item.world.places.length > 0)
    .map((item) => ({ entry: item.entry, places: item.world.places }));

  const candidates = unique(candidateByEntry.flatMap((item) => item.places));
  const explicitPlace = explicitPlaceFromPrompt(prompt);

  const place = explicitPlace
    ? explicitPlace
    : candidates.length === 1
      ? candidates[0]
      : undefined;

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
