import type {
  AuthorCreativeProposition,
  AuthorJudgeResult,
  RealityGraph,
  SequencePlay,
  SequenceCandidate,
} from "@qre/contracts";

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const words = (value: string): Set<string> => new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));

function overlap(left: string, right: string): number {
  const a = words(left); const b = words(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

const hasBannedLanguage = (value: string): boolean => /\b(?:camera|shot|montage|soundtrack|screenplay|voice[- ]?over|slogan|caption|genre|cinematic)\b/i.test(value);

function sourceCoverage(graph: RealityGraph, text: string): number {
  const labels = graph.events.map((event) => event.label).filter(Boolean);
  return Math.max(0, ...labels.map((label) => overlap(text, label)));
}

function relationCoverage(graph: RealityGraph, proposition: AuthorCreativeProposition, candidate: SequenceCandidate, text: string): number {
  const relationWords = [
    ...graph.relations.map((relation) => `${relation.kind} ${relation.type} ${relation.mechanism ?? ""}`),
    ...graph.patterns?.map((pattern) => `${pattern.kind} ${pattern.label}`) ?? [],
    ...candidate.supportingRelationKinds,
    proposition.pattern,
  ].join(" ");
  return overlap(text, relationWords);
}

function topSignalCoverage(values: readonly number[]): number {
  if (!values.length) return 0;
  const ranked = [...values].sort((a, b) => b - a);
  const support = ranked.slice(0, Math.min(3, ranked.length));
  const average = support.reduce((sum, value) => sum + value, 0) / support.length;
  return ranked[0]! * 0.6 + average * 0.4;
}

function cutNovelty(sequence: SequencePlay, index: number): number {
  const current = sequence.cuts[index];
  if (!current) return 0;
  const previous = index > 0 ? sequence.cuts[index - 1] : undefined;
  if (!previous) return 1;
  return 1 - overlap(previous.informationGain, current.informationGain);
}

function semanticMovement(sequence: SequencePlay): number {
  if (sequence.cuts.length <= 1) return 0;
  let moving = 0;
  for (let index = 1; index < sequence.cuts.length; index += 1) {
    const current = sequence.cuts[index]!;
    const previous = sequence.cuts[index - 1]!;
    const sourceChanged = current.sourceIds.some((id) => !previous.sourceIds.includes(id));
    const stateChanged = current.viewerAfter.recentChange !== previous.viewerAfter.recentChange ||
      current.viewerAfter.expected !== previous.viewerAfter.expected ||
      current.viewerAfter.unresolved !== previous.viewerAfter.unresolved;
    const novel = cutNovelty(sequence, index) >= 0.28;
    if (sourceChanged && novel && stateChanged) moving += 1;
  }
  return moving / (sequence.cuts.length - 1);
}

function treatmentFidelity(proposition: AuthorCreativeProposition, sequence: SequencePlay): number {
  if (!proposition.treatment?.id || !sequence.cuts.length) return 0;
  const roles = new Set(sequence.cuts.map((cut) => cut.role));
  const gains = new Set(sequence.cuts.map((cut) => cut.gainKind));
  let structural = 0.55;
  if (roles.has("reframe") || roles.has("discovery")) structural += 0.15;
  if (roles.has("consequence") || gains.has("escalation")) structural += 0.15;
  if (gains.has("payoff") && sequence.cuts.length >= 4) structural += 0.1;
  return Math.min(1, structural);
}

function informationPerCut(graph: RealityGraph, proposition: AuthorCreativeProposition, candidate: SequenceCandidate, sequence: SequencePlay): number {
  if (!sequence.cuts.length) return 0;
  return sequence.cuts.reduce((sum, cut, index) => {
    const grounded = cut.sourceIds.length > 0 && cut.sourceIds.every((id) => graph.events.some((event) => event.id === id)) ? 1 : 0;
    const novelty = cutNovelty(sequence, index);
    const relation = relationCoverage(graph, proposition, candidate, cut.informationGain);
    const source = sourceCoverage(graph, cut.informationGain);
    return sum + grounded * 0.3 + novelty * 0.3 + relation * 0.25 + source * 0.15;
  }, 0) / sequence.cuts.length;
}

function necessityScore(sequence: SequencePlay): number {
  if (!sequence.cuts.length) return 0;
  const valid = sequence.cuts.filter((cut) => cut.necessity?.necessary && clean(cut.necessity.reason)).length;
  return valid / sequence.cuts.length;
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
  const groundedCuts = sequence.cuts.filter((cut) => cut.sourceIds.length > 0 && cut.sourceIds.every((id) => eventIds.has(id)));
  const grounding = sequence.cuts.length ? groundedCuts.length / sequence.cuts.length : 0;
  const movement = semanticMovement(sequence);
  const sourceSpecificity = sequence.cuts.length ? sequence.cuts.reduce((sum, cut) => sum + sourceCoverage(graph, cut.informationGain), 0) / sequence.cuts.length : 0;
  const relationValues = sequence.cuts.map((cut) => relationCoverage(graph, proposition, candidate, cut.informationGain));
  const relationFidelity = topSignalCoverage(relationValues);
  const treatment = treatmentFidelity(proposition, sequence);
  const information = informationPerCut(graph, proposition, candidate, sequence);
  const necessity = necessityScore(sequence);
  const propositionTerms = `${proposition.text} ${proposition.pattern} ${proposition.orderingRule} ${candidate.hypothesis.join(" ")}`;
  const propositionFidelity = topSignalCoverage(sequence.cuts.map((cut) => overlap(cut.informationGain, propositionTerms)));
  const transformation = Math.min(1, movement * 0.55 + relationFidelity * 0.25 + information * 0.2);
  const specificity = Math.min(1, grounding * 0.4 + sourceSpecificity * 0.3 + relationFidelity * 0.2 + candidate.specificity * 0.1);
  const propositionSourcesGrounded = proposition.sourceEventIds.length > 0 && proposition.sourceEventIds.every((id) => eventIds.has(id));
  const orderingRulePresent = clean(proposition.orderingRule).length >= 12;
  const uniqueSourceSets = new Set(sequence.cuts.map((cut) => cut.sourceIds.join(",")));
  const inventionRisk = Math.max(0, Math.min(1, 1 - grounding * 0.65 - specificity * 0.15 - (propositionSourcesGrounded ? 0.1 : 0) - (orderingRulePresent ? 0.05 : 0)));
  const genericity = Math.max(0, Math.min(1, 1 - (sourceSpecificity * 0.5 + relationFidelity * 0.3 + specificity * 0.2)));
  const continuationPressure = sequence.cuts.length ? sequence.cuts.slice(0, -1).reduce((sum, cut) => sum + (clean(cut.nextPromise) ? 1 : 0), 0) / Math.max(1, sequence.cuts.length - 1) : 0;
  const reasons: string[] = [];

  if (sequence.cuts.length < 4) reasons.push("too-short");
  if (grounding < 1) reasons.push("unsupported-source");
  if (!propositionSourcesGrounded) reasons.push("unsupported-proposition-source");
  if (!orderingRulePresent) reasons.push("missing-ordering-rule");
  if (uniqueSourceSets.size < Math.min(3, sequence.cuts.length)) reasons.push("source-collapse");
  if (movement < 0.67) reasons.push("repeated-read");
  if (propositionFidelity < 0.32) reasons.push("weak-proposition");
  if (relationFidelity < 0.2) reasons.push("weak-relationship");
  if (treatment < 0.68) reasons.push("weak-treatment");
  if (information < 0.52) reasons.push("low-information-per-cut");
  if (necessity < 0.75) reasons.push("weak-cut-necessity");
  if (continuationPressure < 0.75 && sequence.cuts.length > 2) reasons.push("weak-continuation-pressure");
  if (genericity > 0.7) reasons.push("generic-realization");
  if (inventionRisk > 0.35) reasons.push("invention-risk");
  if (hasBannedLanguage(allText)) reasons.push("invalid-author-language");

  return {
    status: reasons.length ? "REJECT" : "ACCEPT",
    grounding, movement, propositionFidelity, specificity, transformation,
    inventionRisk, genericity, relationFidelity, treatmentFidelity: treatment,
    informationPerCut: information, continuationPressure, necessity,
    reasons: [...new Set(reasons)],
  };
}
