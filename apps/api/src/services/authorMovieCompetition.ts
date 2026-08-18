import type {
  AuthorLensKind,
  AuthorMovieAlternative,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type MovieHypothesis = {
  id: string;
  lens: AuthorLensKind;
  hypothesis: string;
  eventIds: readonly string[];
  relationKinds: readonly string[];
  grounding: number;
  tension: number;
  surprise: number;
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function dominanceScore(candidate: MovieHypothesis): number {
  return metric(
    candidate.grounding * 0.34 +
      candidate.tension * 0.24 +
      candidate.surprise * 0.22 +
      Math.min(1, candidate.eventIds.length / 6) * 0.12 +
      Math.min(1, candidate.relationKinds.length / 5) * 0.08,
  );
}

export function rankMovieHypotheses(
  hypotheses: readonly MovieHypothesis[],
): AuthorMovieAlternative[] {
  const ranked = hypotheses
    .map((candidate) => ({
      id: candidate.id,
      lens: candidate.lens,
      hypothesis: clean(candidate.hypothesis),
      score: dominanceScore(candidate),
      strengths: [
        candidate.grounding >= 0.75 ? "grounded" : "partially-grounded",
        candidate.tension >= 0.6 ? "tension-rich" : "low-tension",
        candidate.surprise >= 0.65 ? "surprising" : "predictable",
      ],
      weaknesses: [],
      eventIds: [...candidate.eventIds],
      dominated: false,
    }));

  for (const candidate of ranked) {
    candidate.dominated = ranked.some(
      (other) =>
        other.id !== candidate.id &&
        other.score >= candidate.score + 0.1 &&
        other.eventIds.length >= candidate.eventIds.length,
    );
    if (candidate.dominated) candidate.weaknesses.push("dominated-by-stronger-hypothesis");
  }

  return ranked.sort((a, b) => b.score - a.score);
}

export function generateDeterministicMovieHypotheses(
  envelope: RealityEnvelope,
  lenses: readonly AuthorLensKind[],
): MovieHypothesis[] {
  const eventIds = envelope.events.map((event) => event.id);
  const relationKinds = [...new Set(envelope.relations.map((relation) => relation.kind))];
  const tensions = envelope.unresolvedTensions.length;
  const surpriseSignals = envelope.sensorySignals.length + envelope.recurringSignals.length;

  return lenses.map((lens, index) => ({
    id: `movie-${index + 1}-${lens}`,
    lens,
    hypothesis: `${lens}: supplied evidence organized around its strongest relationship`,
    eventIds: eventIds.slice(0, Math.min(6, eventIds.length)),
    relationKinds,
    grounding: metric(Math.min(1, eventIds.length / 5) * 0.55 + 0.45),
    tension: metric(Math.min(1, tensions / 4)),
    surprise: metric(Math.min(1, surpriseSignals / 4)),
  }));
}
