import type {
  AuthorCreativeCritique,
  AuthorLensKind,
  AuthorMovieAlternative,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type CreativeSearchOption = {
  id: string;
  lens: AuthorLensKind;
  hypothesis: string;
  eventIds: readonly string[];
  relationKinds: readonly string[];
  localScore: number;
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function noveltyAgainst(
  candidate: CreativeSearchOption,
  alternatives: readonly CreativeSearchOption[],
): number {
  if (!alternatives.length) return 1;
  const tokens = new Set(
    clean(candidate.hypothesis).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 3),
  );
  let overlap = 0;
  for (const other of alternatives) {
    const otherTokens = new Set(
      clean(other.hypothesis).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 3),
    );
    let hits = 0;
    for (const token of tokens) if (otherTokens.has(token)) hits += 1;
    overlap += hits / Math.max(1, tokens.size);
  }
  return metric(1 - Math.min(1, overlap / alternatives.length));
}

export function buildMovieAlternatives(
  options: readonly CreativeSearchOption[],
  envelope: RealityEnvelope,
): AuthorMovieAlternative[] {
  const ordered = options.map((option, index) => {
    const novelty = noveltyAgainst(option, options.filter((candidate) => candidate.id !== option.id));
    const grounding = option.eventIds.length
      ? Math.min(1, option.eventIds.filter((id) => envelope.events.some((event) => event.id === id)).length / option.eventIds.length)
      : 0;
    const relationDensity = Math.min(1, option.relationKinds.length / 3);
    const score = metric(option.localScore * 0.5 + grounding * 0.25 + relationDensity * 0.12 + novelty * 0.13);
    return {
      id: option.id,
      lens: option.lens,
      hypothesis: clean(option.hypothesis),
      score,
      strengths: [
        grounding >= 0.8 ? "strong-evidence-grounding" : "partial-evidence-grounding",
        relationDensity >= 0.66 ? "relationship-rich" : "relationship-light",
      ],
      weaknesses: [
        novelty < 0.35 ? "too-similar-to-alternatives" : "",
        relationDensity < 0.33 ? "weak-relational-density" : "",
      ].filter(Boolean),
      eventIds: [...option.eventIds],
      dominated: false,
    };
  });

  for (const alternative of ordered) {
    const stronger = ordered.some(
      (other) =>
        other.id !== alternative.id &&
        other.score >= alternative.score + 0.12 &&
        other.eventIds.length >= alternative.eventIds.length,
    );
    alternative.dominated = stronger;
  }

  return ordered.sort((a, b) => b.score - a.score);
}

export function critiqueCreativeSelection(
  text: string,
  alternatives: readonly AuthorMovieAlternative[],
): AuthorCreativeCritique {
  const value = clean(text).toLowerCase();
  const words = value.split(/\s+/).filter(Boolean);
  const generic = /\b(?:beautiful|magical|special|meaningful|journey|cinematic|unforgettable|incredible)\b/i.test(value);
  const obvious = words.length <= 3 || /\b(?:then|finally|and then)\b/.test(value);
  const stronger = alternatives.filter((candidate) => !candidate.dominated && candidate.score > 0.65);
  const groundedSurprise = metric(
    (generic ? 0.15 : 0.55) +
      Math.min(0.35, stronger.length * 0.07) +
      (words.length >= 4 && words.length <= 8 ? 0.1 : 0),
  );

  return {
    obviousness: metric(obvious ? 0.78 : 0.34),
    genericness: metric(generic ? 0.9 : 0.18),
    safety: metric(generic ? 0.6 : 0.9),
    groundedSurprise,
    strongerAlternativeAvailable: stronger.length > 1,
    strongerAlternativeIds: stronger.slice(0, 4).map((candidate) => candidate.id),
    notes: [
      generic ? "generic-filler" : "specific-language",
      obvious ? "low-information-compression" : "adequate-information-density",
      stronger.length > 1 ? "multiple-strong-movies-remain" : "selection-dominates-nearby-alternatives",
    ],
  };
}

export function surpriseScore(
  text: string,
  envelope: RealityEnvelope,
): number {
  const words = clean(text)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/)
    .filter((word) => word.length >= 3);
  const source = new Set(envelope.suppliedTerms.map((term) => term.toLowerCase()));
  if (!words.length) return 0;
  let grounded = 0;
  for (const word of words) if (source.has(word)) grounded += 1;
  const grounding = grounded / words.length;
  const specificity = Math.min(1, new Set(words).size / 7);
  const unexpected = words.some((word) => /\b(?:blue|strange|only|still|already|again|even|yet|just)\b/.test(word)) ? 0.15 : 0;
  return metric(grounding * 0.48 + specificity * 0.27 + unexpected * 0.25);
}
