import type { AuthorLensKind, AuthorMovieAlternative } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type CounterfactualMovie = AuthorMovieAlternative & {
  counterfactualQuestion: string;
  preservedEvidence: string[];
  alteredCenterEventId?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

export function buildGroundedCounterfactuals(
  envelope: RealityEnvelope,
  lenses: readonly AuthorLensKind[],
): CounterfactualMovie[] {
  if (!envelope.events.length) return [];

  const centers = envelope.events
    .filter((event) =>
      envelope.relations.some(
        (relation) =>
          relation.from === event.id ||
          relation.to === event.id,
      ),
    )
    .slice(0, 4);

  return centers.flatMap((center, centerIndex) =>
    lenses.slice(0, 4).map((lens, lensIndex) => ({
      id: `counterfactual-${centerIndex + 1}-${lensIndex + 1}`,
      lens,
      hypothesis: `${lens}: what if ${center.label} were the emotional center?`,
      score: metric(
        0.42 +
          Math.min(0.25, centerIndex * 0.04) +
          Math.min(0.18, lensIndex * 0.03),
      ),
      strengths: ["preserves supplied evidence", "changes interpretive center"],
      weaknesses: [],
      eventIds: [center.id],
      dominated: false,
      counterfactualQuestion: `What changes if "${center.label}" carries the movie?`,
      preservedEvidence: envelope.events
        .slice(0, 6)
        .map((event) => event.label),
      alteredCenterEventId: center.id,
    })),
  );
}
