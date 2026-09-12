import type {
  AuthorCreativeProposition,
  AuthorJudgeResult,
  RealityGraph,
  SequencePlay,
  SequenceCandidate,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const words = (value: string): Set<string> =>
  new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));

const overlap = (left: string, right: string): number => {
  const a = words(left);
  const b = words(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((word) => {
    if (b.has(word)) shared += 1;
  });
  return shared / Math.max(1, Math.min(a.size, b.size));
};

const hasBannedLanguage = (value: string): boolean =>
  /\b(?:camera|shot|montage|soundtrack|screenplay|voice[- ]?over|slogan|caption|genre|movie|cinematic)\b/i.test(value);

function sourceCoverage(graph: RealityGraph, text: string): number {
  const labels = graph.events.map((event) => event.label).filter(Boolean);
  return Math.max(0, ...labels.map((label) => overlap(text, label)));
}

function relationCoverage(
  graph: RealityGraph,
  proposition: AuthorCreativeProposition,
  candidate: SequenceCandidate,
  text: string,
): number {
  const relationWords = [
    ...graph.relations.map((relation) => relation.kind),
    ...graph.patterns?.map((pattern) => pattern.kind) ?? [],
    ...candidate.supportingRelationKinds,
    proposition.pattern,
  ].join(" ");
  return overlap(text, relationWords);
}

function treatmentCoverage(proposition: AuthorCreativeProposition, text: string): number {
  const signals: Record<string, string> = {
    "horror-romance": "danger vulnerability intimacy normalization relationship threat tenderness",
    "heist-comedy": "objective dependency clever operation consequence asymmetry misdirection",
    "game-fierce": "priority competition repeated behavior escalation constraint contest dominance",
    "noir-tenderness": "ambiguity memory relationship withheld identity tenderness uncertainty",
    "documentary-chaos": "system contradiction accumulation anomaly precision consequence disorder",
  };
  return overlap(text, signals[proposition.treatment.id] ?? `${proposition.treatment.primary} ${proposition.treatment.secondary}`);
}

function meaningfulMovement(sequence: SequencePlay): number {
  if (sequence.cuts.length <= 1) return 0;
  let moving = 0;
  for (let index = 1; index < sequence.cuts.length; index += 1) {
    const before = sequence.cuts[index - 1];
    const current = sequence.cuts[index];
    const stateChanged =
      before.viewerAfter.unresolved !== current.viewerAfter.unresolved ||
      before.viewerAfter.currentWant !== current.viewerAfter.currentWant ||
      before.viewerAfter.expected !== current.viewerAfter.expected ||
      clean(before.momentum?.change) !== clean(current.momentum?.change) ||
      before.viewerAfter.recentChange !== current.viewerAfter.recentChange;
    const lexicalChange = overlap(before.informationGain, current.informationGain) < 0.72;
    if (stateChanged && lexicalChange) moving += 1;
  }
  return moving / (sequence.cuts.length - 1);
}

function necessityScore(sequence: SequencePlay): number {
  if (!sequence.cuts.length) return 0;
  let valid = 0;
  for (const cut of sequence.cuts) {
    if (cut.necessity?.necessary && clean(cut.necessity.reason)) valid += 1;
  }
  return valid / sequence.cuts.length;
}

function informationPerCut(
  graph: RealityGraph,
  proposition: AuthorCreativeProposition,
  candidate: SequenceCandidate,
  sequence: SequencePlay,
): number {
  if (!sequence.cuts.length) return 0;
  let score = 0;
  for (const cut of sequence.cuts) {
    const novelty = cut.noveltyScore ?? 0;
    const grounding = cut.sourceIds.length && cut.sourceIds.every((id) => graph.events.some((event) => event.id === id)) ? 1 : 0;
    const relation = relationCoverage(graph, proposition, candidate, cut.informationGain);
    score += grounding * 0.35 + novelty * 0.35 + relation * 0.3;
  }
  return score / sequence.cuts.length;
}

export function judgeAuthorSequence(input: {
  graph: RealityGraph;
  candidate: SequenceCandidate;
  proposition: AuthorCreativeProposition;
  sequence: SequencePlay;
}): AuthorJudgeResult {
  const { graph, candidate, proposition, sequence } = input;
  const eventIds = new Set(graph.events.map((event) => event.id));
  const allText = sequence.cuts.map((cut) => cut.informationGain).join(" ");
  const groundedCuts = sequence.cuts.filter((cut) =>
    cut.sourceIds.length > 0 && cut.sourceIds.every((id) => eventIds.has(id)),
  );
  const grounding = sequence.cuts.length ? groundedCuts.length / sequence.cuts.length : 0;
  const movement = meaningfulMovement(sequence);
  const sourceSpecificity = sequence.cuts.length
    ? sequence.cuts.reduce((sum, cut) => sum + sourceCoverage(graph, cut.informationGain), 0) / sequence.cuts.length
    : 0;
  const relationFidelity = sequence.cuts.length
    ? sequence.cuts.reduce((sum, cut) => sum + relationCoverage(graph, proposition, candidate, cut.informationGain), 0) / sequence.cuts.length
    : 0;
  const treatmentFidelity = sequence.cuts.length
    ? sequence.cuts.reduce((sum, cut) => sum + treatmentCoverage(proposition, cut.informationGain), 0) / sequence.cuts.length
    : 0;
  const information = informationPerCut(graph, proposition, candidate, sequence);
  const necessity = necessityScore(sequence);
  const propositionTerms = `${proposition.text} ${proposition.pattern} ${candidate.hypothesis.join(" ")}`;
  const propositionFidelity = sequence.cuts.length
    ? sequence.cuts.reduce((sum, cut) => sum + overlap(cut.informationGain, propositionTerms), 0) / sequence.cuts.length
    : 0;
  const transformation = Math.min(1, movement * 0.5 + relationFidelity * 0.25 + information * 0.25);
  const specificity = Math.min(1, grounding * 0.45 + sourceSpecificity * 0.25 + relationFidelity * 0.2 + candidate.specificity * 0.1);
  const propositionSourcesGrounded = proposition.sourceEventIds.every((id) => eventIds.has(id));
  const inventionRisk = Math.max(
    0,
    Math.min(
      1,
      1 - grounding * 0.55 - specificity * 0.2 - (propositionSourcesGrounded ? 0.1 : 0),
    ),
  );
  const genericity = Math.max(
    0,
    Math.min(1, 1 - (sourceSpecificity * 0.45 + relationFidelity * 0.3 + treatmentFidelity * 0.25)),
  );
  const continuationPressure = sequence.cuts.length
    ? sequence.cuts.slice(0, -1).reduce((sum, cut) => sum + (clean(cut.nextPromise) ? 1 : 0), 0) / Math.max(1, sequence.cuts.length - 1)
    : 0;
  const reasons: string[] = [];

  if (sequence.cuts.length < 4) reasons.push("too-short");
  if (grounding < 1) reasons.push("unsupported-source");
  if (!propositionSourcesGrounded) reasons.push("unsupported-proposition-source");
  if (movement < 0.67) reasons.push("repeated-read");
  if (propositionFidelity < 0.45) reasons.push("weak-proposition");
  if (relationFidelity < 0.32) reasons.push("weak-relationship");
  if (treatmentFidelity < 0.18) reasons.push("weak-treatment");
  if (information < 0.55) reasons.push("low-information-per-cut");
  if (necessity < 0.75) reasons.push("weak-cut-necessity");
  if (continuationPressure < 0.75 && sequence.cuts.length > 2) reasons.push("weak-continuation-pressure");
  if (genericity > 0.62) reasons.push("generic-realization");
  if (inventionRisk > 0.35) reasons.push("invention-risk");
  if (hasBannedLanguage(allText)) reasons.push("invalid-author-language");

  return {
    status: reasons.length ? "REJECT" : "ACCEPT",
    grounding,
    movement,
    propositionFidelity,
    specificity,
    transformation,
    inventionRisk,
    genericity,
    relationFidelity,
    treatmentFidelity,
    informationPerCut: information,
    continuationPressure,
    necessity,
    reasons: [...new Set(reasons)],
  };
}
