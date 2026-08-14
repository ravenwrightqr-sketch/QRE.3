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

function strings(context: UniversalMindContext): string[] {
  return unique([
    ...(context.memorySummary ?? []),
    ...(context.memories ?? []).map((value) => typeof value === "string" ? value : JSON.stringify(value) ?? ""),
  ]);
}

function places(values: string[]): string[] {
  return unique(values.flatMap((value) => {
    const hits = [...value.matchAll(/\b(?:at|in|near|on)\s+(?:the\s+)?([^,.;]+)/gi)].map((m) => clean(m[1]));
    return hits.length ? hits : [value.match(/\b(?:restaurant|beach|hotel|house|gym|club|park|studio|groomer|school|office|convention|arena)\b/i)?.[0] ?? ""];
  }));
}

export function resolveMemory(prompt: string, context: UniversalMindContext): MemoryResolution {
  const memory = strings(context);
  if (!memory.length) return { matches: [], participants: [], relatedTerms: [], questions: [] };

  const promptWords = new Set(prompt.toLowerCase().split(/\W+/).filter((word) => word.length >= 4));
  const scored = memory.map((entry) => {
    const words = entry.toLowerCase().split(/\W+/).filter((word) => word.length >= 4);
    const overlap = words.reduce((score, word) => score + (promptWords.has(word) ? 1 : 0), 0);
    return { entry, overlap };
  }).filter((item) => item.overlap > 0).sort((a, b) => b.overlap - a.overlap);

  const top = scored.slice(0, 6).map((item) => item.entry);
  const candidates = unique(places(top));
  const returning = /\b(?:back|again|returned|returning|same place|there)\b/i.test(prompt);
  const questions = returning && candidates.length > 1 ? ["Which place did you go back to?"] : returning && candidates.length === 0 ? ["Where did you go back to?"] : [];

  const participants = unique(top.flatMap((entry) => [...entry.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)].map((m) => m[0]))).filter((name) => !/^(The|Then|At|And|My|Our|This|First|Later|Grandma|Everyone)$/i.test(name));
  return { matches: top, place: candidates.length === 1 ? candidates[0] : undefined, participants, relatedTerms: unique(top.flatMap((entry) => entry.split(/\W+/).filter((word) => word.length >= 6))).slice(0, 40), questions };
}
