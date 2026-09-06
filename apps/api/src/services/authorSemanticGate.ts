/*
 * QRE UNIVERSAL SEMANTIC QUALITY GATE
 *
 * Cognition is accepted only when the latent Movie carries grounded semantic
 * movement. Creative interpretation is allowed; invented events are not.
 *
 * Reality remains immutable. A candidate is a hypothesis. Rich thesis data
 * strengthens the gate, but an older/simple model response must not be rejected
 * merely because it omitted optional rich-thesis fields.
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
    thesisStructure: number;
    observerContract: number;
    summaryRisk: number;
    unsupportedInferenceRisk: number;
    captionReelRisk: number;
  };
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const tokens = (value: string): Set<string> => new Set(clean(value).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
function overlap(left: string, right: string): number {
  const a = tokens(left); const b = tokens(right); if (!a.size || !b.size) return 0;
  let hits = 0; for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}
function metric(value: number): number { return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3)); }

const MOVEMENT = new Set(["contrast", "reframe", "escalate", "converge", "reveal", "consequence", "payoff", "recur"]);
const WEAK = new Set(["establish", "confirm"]);
const SUMMARY_RE = /^(?:[a-z][^.!?]{0,100}\b(?:is|are|likes?|loves?|has|had|was|were|enjoys?|contains?|includes?)\b[^.!?]{0,100})[.!?]?$/i;
const UNSUPPORTED_INFERENCE = /\b(?:lack of negative|consistently joyful|emotionally fulfilled|happy life|deeply|truly|definitely|obviously|clearly|always|never|perfectly|contentment|contented|happiness|happy|anxiety|anxious|joyful|purity|sheltered|fulfilling|fulfilled|simple pleasures|separation anxiety|emotional landscape|emotional journey|perfect scenario|vulnerability|bond|baseline of contentment)\b/i;
const EXPLANATORY_TURN = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|because this|therefore)\b/i;
const REALIZATION_MOVES = new Set(["feel_state_transition", "recognize_callback", "recontextualize_callback", "hold_contrast", "return_with_new_status", "land_consequence", "recognize"]);
const MECHANISMS = new Set(["expectation_shift", "continuation", "state_change", "recurrence", "convergence", "contrast", "consequence"]);

function inferenceUnsupported(thesisCorpus: string, realityCorpus: string): boolean {
  const match = thesisCorpus.match(UNSUPPORTED_INFERENCE);
  if (!match) return false;
  const phrase = clean(match[0]).toLowerCase();
  const reality = clean(realityCorpus).toLowerCase();
  if (!reality) return true;
  const phraseTokens = [...tokens(phrase)];
  if (!phraseTokens.length) return true;
  const realityTokens = tokens(reality);
  const hits = phraseTokens.filter((token) => realityTokens.has(token)).length;
  return hits / phraseTokens.length < 0.5;
}

function captionReelRisk(movie: LatentMovieCandidate, graph: RealityGraph): number {
  if (graph.events.length < 3 || movie.trajectory.length < 3) return 0;
  const eventIds = new Set(graph.events.map((event) => event.id));
  const usableSteps = movie.trajectory.filter((step) => step.eventIds.some((id) => eventIds.has(id)));
  if (usableSteps.length < 3) return 0;

  const oneEventSteps = usableSteps.filter((step) => new Set(step.eventIds.filter((id) => eventIds.has(id))).size === 1).length;
  const oneToOne = oneEventSteps / usableSteps.length;
  const distinctEvents = new Set(usableSteps.flatMap((step) => step.eventIds.filter((id) => eventIds.has(id)))).size;
  const eventCoverage = distinctEvents / Math.max(1, Math.min(graph.events.length, usableSteps.length));
  const bridgeSteps = usableSteps.filter((step) => new Set(step.eventIds.filter((id) => eventIds.has(id))).size >= 2).length;
  const bridging = bridgeSteps / usableSteps.length;

  let directParaphrases = 0;
  for (const step of usableSteps) {
    const ids = step.eventIds.filter((id) => eventIds.has(id));
    if (ids.length !== 1) continue;
    const source = graph.events.find((event) => event.id === ids[0]);
    if (source && overlap(clean(step.viewerChange), source.label) >= 0.55) directParaphrases += 1;
  }
  const directParaphraseRatio = directParaphrases / Math.max(1, usableSteps.length);

  const noMeaningfulShift = usableSteps.filter((step) => !MOVEMENT.has(step.operation)).length / usableSteps.length;
  return metric(
    oneToOne * 0.4 +
    directParaphraseRatio * 0.35 +
    Math.min(1, eventCoverage) * 0.1 +
    (1 - bridging) * 0.1 +
    noMeaningfulShift * 0.05,
  );
}

export function evaluateLatentMovie(movie: LatentMovieCandidate, graph: RealityGraph): SemanticGateResult {
  const reasons: string[] = [];
  const allIds = movie.trajectory.flatMap((step) => step.eventIds);
  const validIds = new Set(graph.events.map((event) => event.id));
  const cited = new Set(allIds.filter((id) => validIds.has(id)));
  const evidenceCoverage = graph.events.length === 0 ? 1 : metric(cited.size / Math.max(1, Math.min(graph.events.length, 6)));

  const operations = movie.trajectory.map((step) => step.operation);
  const meaningful = operations.filter((operation) => MOVEMENT.has(operation));
  const uniqueMeaningful = new Set(meaningful);
  const weakOnly = operations.length > 0 && operations.every((operation) => WEAK.has(operation));
  const semanticMovement = metric(meaningful.length === 0 ? 0 : Math.min(1, 0.42 + meaningful.length * 0.11 + uniqueMeaningful.size * 0.09));
  const progressionVariety = metric(uniqueMeaningful.size / 3);

  const realityCorpus = graph.events.map((event) => [event.label, ...event.entities].join(" ")).join(" ");
  const thesis = movie.storyThesis;
  const thesisCorpus = [movie.hypothesis.join(" "), movie.payoff, movie.unresolvedQuestion, thesis?.initialReading, thesis?.semanticTurn, ...(thesis?.beforeMeaning ?? []), ...(thesis?.afterMeaning ?? [])].map(clean).filter(Boolean).join(" ");
  const lexicalGrounding = overlap(thesisCorpus, realityCorpus);
  const thesisEventIds = [
    ...(thesis?.beforeEventIds ?? []),
    ...(thesis?.afterEventIds ?? []),
    ...(thesis?.carrierEventIds ?? []),
    ...(thesis?.sealingEventIds ?? []),
    ...(thesis?.semanticRealization?.evidenceEventIds ?? []),
    ...(thesis?.semanticRealization?.beforeEventIds ?? []),
    ...(thesis?.semanticRealization?.afterEventIds ?? []),
  ];
  const groundedThesisEventIds = new Set(thesisEventIds.filter((id) => validIds.has(id)));
  const structuralGrounding = thesisEventIds.length === 0 ? 0 : metric(groundedThesisEventIds.size / new Set(thesisEventIds).size);
  const thesisGrounding = metric(Math.max(lexicalGrounding, structuralGrounding, evidenceCoverage * 0.7));

  const meaningfulSteps = movie.trajectory.filter((step) => MOVEMENT.has(step.operation));
  const derivedTurn = clean(meaningfulSteps[0]?.viewerChange) || clean(movie.payoff);
  const derivedCarrier = meaningfulSteps[0]?.eventIds.find((id) => validIds.has(id));
  const derivedSealing = meaningfulSteps.at(-1)?.eventIds.find((id) => validIds.has(id));
  const hasSemanticTurn = Boolean(clean(thesis?.semanticTurn) || derivedTurn);
  const hasCarrierEvidence = Boolean(thesis?.carrierEventIds?.some((id) => validIds.has(id)) || derivedCarrier);
  const hasSealingEvidence = Boolean(thesis?.sealingEventIds?.some((id) => validIds.has(id)) || derivedSealing);
  const realization = thesis?.semanticRealization;
  const hasRealization = Boolean(realization && MECHANISMS.has(realization.mechanism) && REALIZATION_MOVES.has(realization.realizationMove));
  const hasRealizationEvidence = Boolean(realization?.evidenceEventIds?.some((id) => validIds.has(id)) || meaningfulSteps.some((step) => step.eventIds.some((id) => validIds.has(id))));
  const observer = thesis?.observerExperience;
  const observerContract = observer
    ? metric((Number(Boolean(clean(observer.objective))) * 0.25) + (Number(Boolean(clean(observer.surprise))) * 0.15) + (Number(Boolean(clean(observer.curiosity))) * 0.15) + (Number(Array.isArray(observer.attention) && observer.attention.length > 0) * 0.15) + (Number(Boolean(clean(observer.landing))) * 0.15) + (Number(observer.explanationForbidden !== false) * 0.15))
    : meaningful.length > 0
      ? metric(0.25 + 0.2 + 0.15 + (Number(Boolean(clean(movie.unresolvedQuestion))) * 0.15) + 0.15)
      : 0;
  const thesisStructure = metric(
    (Number(hasSemanticTurn) * 0.3) +
    (Number(hasCarrierEvidence) * 0.15) +
    (Number(hasSealingEvidence) * 0.15) +
    (Number(hasRealization) * 0.2) +
    (Number(hasRealizationEvidence) * 0.1) +
    (Number(Boolean(thesis?.beforeMeaning?.length)) * 0.05) +
    (Number(Boolean(thesis?.afterMeaning?.length)) * 0.05),
  );

  const hasRichThesis = Boolean(thesis && thesisStructure >= 0.7 && observerContract >= 0.6);
  const compatibilityStructure = metric(
    (Number(meaningful.length > 0) * 0.34) +
    (Number(hasCarrierEvidence) * 0.2) +
    (Number(hasSealingEvidence) * 0.16) +
    (Number(hasRealizationEvidence) * 0.16) +
    (Number(Boolean(clean(movie.unresolvedQuestion))) * 0.14),
  );
  const semanticContractScore = hasRichThesis ? thesisStructure : compatibilityStructure;
  const summaryShaped = SUMMARY_RE.test(clean(movie.hypothesis[0] ?? ""));
  const summaryRisk = weakOnly
    ? 0.95
    : summaryShaped && !hasRichThesis && meaningful.length === 0
      ? 0.95
      : movie.hypothesis.length === 0
        ? 0.8
        : summaryShaped
          ? 0.2
          : 0.15;
  const unsupportedInferenceRisk = inferenceUnsupported(thesisCorpus, realityCorpus) ? 0.55 : 0.05;
  const explanatoryRisk = EXPLANATORY_TURN.test(clean(thesis?.semanticTurn)) ? 0.85 : 0;
  const reelRisk = captionReelRisk(movie, graph);

  if (weakOnly) reasons.push("trajectory is establish/confirm-only; no semantic movement");
  if (!meaningful.length) reasons.push("Movie contains no semantic movement");
  if (evidenceCoverage < 0.34 && graph.events.length > 0) reasons.push("Movie is weakly anchored to supplied reality");
  if (thesisGrounding < 0.2 && graph.events.length > 0 && meaningful.length === 0) reasons.push("Movie thesis is not grounded in supplied event language or event evidence");
  if (summaryRisk >= 0.9) reasons.push("Movie hypothesis reads as a factual summary rather than a semantic discovery");
  if (unsupportedInferenceRisk >= 0.9) reasons.push("Movie contains unsupported psychological/generalized inference");
  if (reelRisk >= 0.82) reasons.push("Movie collapses into one-event-per-step caption coverage instead of semantic movement");
  if (graph.events.length > 0 && !thesis && meaningful.length === 0) reasons.push("rich LatentStoryThesis is missing on a Movie with no semantic movement");
  if (graph.events.length > 0 && !hasSemanticTurn) reasons.push("semantic turn is missing");
  if (graph.events.length > 0 && !hasRealization && meaningful.length === 0) reasons.push("semanticRealization mechanism/move is missing on a Movie with no semantic movement");
  if (graph.events.length > 0 && !hasRealizationEvidence) reasons.push("Movie semantic movement is not grounded to supplied event IDs");
  if (graph.events.length > 0 && !hasCarrierEvidence) reasons.push("Movie has no grounded carrier event");
  if (graph.events.length > 0 && !hasSealingEvidence) reasons.push("Movie has no grounded sealing event");
  if (observer && observer.explanationForbidden === false) reasons.push("observer contract permits explanation");
  if (explanatoryRisk >= 0.8) reasons.push("semantic turn is written as explanation instead of a turn");

  const score = metric(
    evidenceCoverage * 0.18 +
    semanticMovement * 0.2 +
    progressionVariety * 0.09 +
    thesisGrounding * 0.12 +
    semanticContractScore * 0.19 +
    observerContract * 0.1 +
    (1 - summaryRisk) * 0.03 +
    (1 - unsupportedInferenceRisk) * 0.02 +
    (1 - reelRisk) * 0.07,
  );
  const compatibilityScore = metric(
    evidenceCoverage * 0.22 +
    semanticMovement * 0.27 +
    progressionVariety * 0.09 +
    thesisGrounding * 0.15 +
    semanticContractScore * 0.14 +
    (1 - summaryRisk) * 0.03 +
    (1 - unsupportedInferenceRisk) * 0.02 +
    (1 - reelRisk) * 0.08,
  );

  return {
    accepted: reasons.length === 0 && (score >= 0.68 || (!hasRichThesis && compatibilityScore >= 0.58)),
    score: Math.max(score, !hasRichThesis ? compatibilityScore : score),
    reasons,
    signals: {
      evidenceCoverage,
      semanticMovement,
      progressionVariety,
      thesisGrounding,
      thesisStructure,
      observerContract,
      summaryRisk: metric(summaryRisk),
      unsupportedInferenceRisk: metric(Math.max(unsupportedInferenceRisk, explanatoryRisk)),
      captionReelRisk: reelRisk,
    },
  };
}
