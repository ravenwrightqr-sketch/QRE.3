/*
 * QRE UNIVERSAL SEMANTIC QUALITY GATE
 *
 * Evaluates Cognition/Movie structure independently of customer-facing prose.
 * It does not decide the Movie and it never writes scenes.
 *
 * A renderable result is not necessarily a meaningful result.
 * This gate rejects summary-shaped cognition, repeated confirmation loops,
 * unsupported thesis language, and trajectories without semantic movement.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";

export type SemanticGateResult = {
  accepted: boolean;
  score: number;
  reasons: string[];
  signals: {
    evidenceCoverage: number;
    semanticMovement: number;
    progressionVariety: number;
    thesisGrounding: number;
    summaryRisk: number;
    unsupportedInferenceRisk: number;
  };
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const tokens = (value: string): Set<string> => new Set(
  clean(value).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2),
);

function overlap(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
}

const MOVEMENT = new Set([
  "contrast", "reframe", "escalate", "converge", "reveal", "consequence", "payoff", "recur",
]);
const WEAK = new Set(["establish", "confirm"]);
const SUMMARY_RE = /^(?:[a-z][^.!?]{0,100}\b(?:is|are|likes?|loves?|has|had|was|were|enjoys?|contains?|includes?)\b[^.!?]{0,100})[.!?]?$/i;
const UNSUPPORTED_INFERENCE = /\b(?:lack of negative|consistently joyful|emotionally fulfilled|happy life|deeply|truly|definitely|obviously|clearly|always|never|perfectly)\b/i;

export function evaluateLatentMovie(movie: LatentMovieCandidate, graph: RealityGraph): SemanticGateResult {
  const reasons: string[] = [];
  const allIds = movie.trajectory.flatMap((step) => step.eventIds);
  const validEventIds = new Set(graph.events.map((event) => event.id));
  const cited = new Set(allIds.filter((id) => validEventIds.has(id)));
  const evidenceCoverage = graph.events.length === 0
    ? 1
    : metric(cited.size / Math.max(1, Math.min(graph.events.length, 6)));

  const operations = movie.trajectory.map((step) => step.operation);
  const meaningful = operations.filter((operation) => MOVEMENT.has(operation));
  const uniqueMeaningful = new Set(meaningful);
  const weakOnly = operations.length > 0 && operations.every((operation) => WEAK.has(operation));
  const semanticMovement = metric(
    meaningful.length === 0 ? 0 : Math.min(1, 0.45 + meaningful.length * 0.12 + uniqueMeaningful.size * 0.08),
  );
  const progressionVariety = metric(uniqueMeaningful.size / 3);

  const realityCorpus = graph.events.map((event) => event.label).join(" ");
  const thesisCorpus = [movie.hypothesis.join(" "), movie.payoff, movie.unresolvedQuestion].join(" ");
  const thesisGrounding = metric(overlap(thesisCorpus, realityCorpus));

  const summaryRisk = SUMMARY_RE.test(clean(movie.hypothesis[0] ?? "")) || weakOnly ? 0.95 :
    movie.hypothesis.length === 0 ? 0.8 : 0.2;
  const unsupportedInferenceRisk = UNSUPPORTED_INFERENCE.test(thesisCorpus) ? 0.9 : 0.05;

  if (weakOnly) reasons.push("trajectory is establish/confirm-only; no semantic movement");
  if (!meaningful.length) reasons.push("Movie contains no contrast, recurrence, reframe, escalation, reveal, consequence, convergence, or payoff");
  if (evidenceCoverage < 0.34 && graph.events.length > 0) reasons.push("Movie is weakly anchored to supplied reality");
  if (thesisGrounding < 0.2 && graph.events.length > 0) reasons.push("Movie thesis is not grounded in supplied event language");
  if (summaryRisk >= 0.9) reasons.push("Movie hypothesis reads as a factual summary rather than a semantic discovery");
  if (unsupportedInferenceRisk >= 0.9) reasons.push("Movie contains unsupported psychological/generalized inference");

  const score = metric(
    evidenceCoverage * 0.25 +
    semanticMovement * 0.3 +
    progressionVariety * 0.15 +
    thesisGrounding * 0.15 +
    (1 - summaryRisk) * 0.1 +
    (1 - unsupportedInferenceRisk) * 0.05,
  );

  return {
    accepted: reasons.length === 0 && score >= 0.62,
    score,
    reasons,
    signals: {
      evidenceCoverage,
      semanticMovement,
      progressionVariety,
      thesisGrounding,
      summaryRisk: metric(summaryRisk),
      unsupportedInferenceRisk: metric(unsupportedInferenceRisk),
    },
  };
}
