import type { UniversalMindContext } from "./universalMindContext.js";

export type MemoryResolution = {
  matches: string[];
  place?: string;
  participants: string[];
  relatedTerms: string[];
  questions: string[];
};

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];
const PRONOUN_RE = /^(?:I|we|you|he|she|they|it|this|that|these|those|someone|something|everyone|guests)$/i;

function strings(context: UniversalMindContext): string[] {
  return unique([
    ...(context.memorySummary ?? []),
    ...(context.memories ?? []).map((value) => typeof value === "string" ? value : JSON.stringify(value) ?? ""),
  ]);
}

function placeMentions(values: string[]): string[] {
  const prep = "at|in|inside|near|on|onto|under|underneath|behind|beside|between|across|through|within|from|to|toward|towards";
  const stop = "at|in|on|from|to|near|around|outside|under|underneath|behind|beside|between|across|through|within|toward|towards";
  const result: string[] = [];
  for (const value of values) {
    const pattern = new RegExp(`\\b(?:${prep})\\s+(?:(?:the|a|an|my|our|your|his|her|their|this|that)\\s+)?([A-Za-z0-9][A-Za-z0-9'’&.-]*(?:\\s+[A-Za-z0-9][A-Za-z0-9'’&.-]*){0,8}?)(?=\\s+(?:${stop})\\b|[,;.]|$)`, "gi");
    for (const match of value.matchAll(pattern)) {
      const candidate = clean(match[1]);
      if (candidate && !PRONOUN_RE.test(candidate)) result.push(candidate);
    }
  }
  return unique(result);
}

function referencedPlaces(prompt: string): string[] {
  const result: string[] = [];
  const pattern = /\b(?:the same place|that place|there|here|the place|the pier|the house|the hotel|the restaurant|the beach|the park|the studio|the venue)\b/gi;
  for (const match of prompt.matchAll(pattern)) result.push(clean(match[0]));
  return unique(result);
}

export function resolveMemory(prompt: string, context: UniversalMindContext): MemoryResolution {
  const memory = strings(context);
  if (!memory.length) return { matches: [], participants: [], relatedTerms: [], questions: [] };

  const promptWords = new Set(prompt.toLowerCase().split(/\W+/).filter((word) => word.length >= 4));
  const scored = memory.map((entry) => {
    const words = entry.toLowerCase().split(/\W+/).filter((word) => word.length >= 4);
    const overlap = words.reduce((score, word) => score + (promptWords.has(word) ? 1 : 0), 0);
    const recencyBonus = /\b(?:back|again|returned|returning|same place|there|here)\b/i.test(prompt) ? 0.5 : 0;
    return { entry, score: overlap + recencyBonus };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 6).map((item) => item.entry);
  const candidates = placeMentions(top);
  const references = referencedPlaces(prompt);
  const returning = references.length > 0 || /\b(?:back|again|returned|returning)\b/i.test(prompt);
  const uniqueCandidates = candidates.length === 1 ? candidates : unique(candidates);
  const place = uniqueCandidates.length === 1 ? uniqueCandidates[0] : undefined;
  const questions = returning && uniqueCandidates.length > 1
    ? ["Which place did you go back to?"]
    : returning && uniqueCandidates.length === 0
      ? ["Where did you go back to?"]
      : [];

  const participants = unique(top.flatMap((entry) => [...entry.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)].map((m) => m[0]))).filter((name) => !/^(The|Then|At|And|My|Our|This|First|Later|Everyone|Grandma)$/i.test(name));
  return {
    matches: top,
    place,
    participants,
    relatedTerms: unique(top.flatMap((entry) => entry.split(/\W+/).filter((word) => word.length >= 6))).slice(0, 40),
    questions,
  };
}
