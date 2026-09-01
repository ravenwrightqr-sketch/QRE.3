/**
 * QRE CREATIVE INTERPRETATION DISCOVERY
 *
 * Discovers the smallest unexpected meaning that supplied reality supports.
 * It is cognition, not viewer prose. Mouth performs the final realization.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";

export type CreativeInterpretationMechanism =
  | "expectation_shift"
  | "continuation"
  | "state_change"
  | "recurrence"
  | "convergence"
  | "contrast"
  | "consequence";

export type CreativeInterpretation = {
  statement: string;
  mechanism: CreativeInterpretationMechanism;
  evidenceEventIds: string[];
  confidence: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content)\b/i;
const STATE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|different|changed|ready|quiet|loud|wild|sweet|gentle|fierce|strange|weird|new|old)\b/i;
const ACTION = /\b(?:arrived|dropped|cleaned|groomed|finished|started|picked|left|visited|met|called|talked|worked|played|danced|went|came|returned|bought|sold|built|fixed|washed|served|stayed|made)\b/i;
const CONTINUATION = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|wanted|want|needed|need)\b/i;
const EXPECTATION = /\b(?:unexpected|surpris(?:e|ed|ing)|unplanned|didn'?t expect|did not expect|never thought|never planned)\b/i;
const CONTRAST_WORD = /\b(?:but|yet|although|instead|rather|except|while|however)\b/i;

function labelFor(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function tokens(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3));
}

function overlap(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, Math.min(a.size, b.size));
}

function ids(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function hasDirectionalStateChange(graph: RealityGraph, orderedIds: readonly string[]): { from: string; to: string; score: number } | undefined {
  let best: { from: string; to: string; score: number } | undefined;
  for (let i = 0; i < orderedIds.length; i += 1) {
    const left = labelFor(graph, orderedIds[i]!);
    if (!STATE.test(left)) continue;
    for (let j = i + 1; j < orderedIds.length; j += 1) {
      const right = labelFor(graph, orderedIds[j]!);
      if (!STATE.test(right)) continue;
      const leftNegative = NEGATIVE.test(left);
      const rightNegative = NEGATIVE.test(right);
      const leftPositive = POSITIVE.test(left);
      const rightPositive = POSITIVE.test(right);
      const polarityFlip = leftNegative !== rightNegative && (leftNegative || rightNegative);
      const positiveOutcome = leftNegative && rightPositive;
      const score = positiveOutcome ? 0.99 : polarityFlip ? 0.88 : leftPositive !== rightPositive ? 0.82 : 0.58;
      const distanceBonus = Math.min(0.08, (j - i) * 0.02);
      const candidateScore = score + distanceBonus;
      if (!best || candidateScore > best.score) best = { from: orderedIds[i]!, to: orderedIds[j]!, score: candidateScore };
    }
  }
  return best;
}

function explicitRelationshipTurns(graph: RealityGraph, orderedIds: readonly string[]): CreativeInterpretation[] {
  const positions = new Map(orderedIds.map((id, index) => [id, index]));
  const output: CreativeInterpretation[] = [];
  for (const relation of graph.relations) {
    const fromIndex = positions.get(relation.from);
    const toIndex = positions.get(relation.to);
    if (fromIndex === undefined || toIndex === undefined || fromIndex >= toIndex) continue;
    if (["before", "after", "involves", "belongs_to"].includes(relation.kind)) continue;
    const from = labelFor(graph, relation.from);
    const to = labelFor(graph, relation.to);
    if (!from || !to) continue;
    const mechanism: CreativeInterpretationMechanism =
      relation.kind === "contrasts" ? "contrast" :
      relation.kind === "recontextualizes" ? "expectation_shift" :
      relation.kind === "repeats" ? "recurrence" :
      relation.kind === "converges" ? "convergence" :
      relation.kind === "changes" ? "state_change" : "consequence";
    output.push({
      statement: `${from} -> ${to}`,
      mechanism,
      evidenceEventIds: [relation.from, relation.to],
      confidence: metric(0.68 + relation.strength * 0.27),
    });
  }
  return output;
}

export function deriveSequenceBackedCreativeInterpretations(graph: RealityGraph, candidate: LatentMovieCandidate): CreativeInterpretation[] {
  const orderedIds = ids(candidate);
  if (orderedIds.length < 2) return [];
  const labels = orderedIds.map((id) => labelFor(graph, id)).filter(Boolean);
  if (labels.length < 2) return [];

  const out: CreativeInterpretation[] = [];
  out.push(...explicitRelationshipTurns(graph, orderedIds));

  const stateChange = hasDirectionalStateChange(graph, orderedIds);
  if (stateChange) {
    out.push({
      statement: `${labelFor(graph, stateChange.from)} gives way to ${labelFor(graph, stateChange.to)}`,
      mechanism: "state_change",
      evidenceEventIds: [stateChange.from, stateChange.to],
      confidence: metric(stateChange.score),
    });
  }

  const actionThenState: Array<{ action: string; state: string; score: number }> = [];
  for (let i = 0; i < orderedIds.length; i += 1) {
    const action = labelFor(graph, orderedIds[i]!);
    if (!ACTION.test(action)) continue;
    for (let j = i + 1; j < orderedIds.length; j += 1) {
      const state = labelFor(graph, orderedIds[j]!);
      if (!STATE.test(state)) continue;
      const score = 0.66 + (j - i <= 2 ? 0.16 : 0.05) + (POSITIVE.test(state) ? 0.09 : 0);
      actionThenState.push({ action: orderedIds[i]!, state: orderedIds[j]!, score });
    }
  }
  const consequence = actionThenState.sort((a, b) => b.score - a.score)[0];
  if (consequence) {
    out.push({
      statement: `${labelFor(graph, consequence.action)} -> ${labelFor(graph, consequence.state)}`,
      mechanism: "consequence",
      evidenceEventIds: [consequence.action, consequence.state],
      confidence: metric(consequence.score),
    });
  }

  if (orderedIds.some((id) => CONTINUATION.test(labelFor(graph, id)))) {
    const id = orderedIds.find((item) => CONTINUATION.test(labelFor(graph, item)))!;
    out.push({
      statement: `${labelFor(graph, id)} remains an open thread`,
      mechanism: "continuation",
      evidenceEventIds: [id],
      confidence: 0.78,
    });
  }

  if (orderedIds.some((id) => EXPECTATION.test(labelFor(graph, id)))) {
    const id = orderedIds.find((item) => EXPECTATION.test(labelFor(graph, item)))!;
    out.push({
      statement: `${labelFor(graph, id)} changes the expected reading`,
      mechanism: "expectation_shift",
      evidenceEventIds: [id],
      confidence: 0.76,
    });
  }

  const contrastCarrier = orderedIds.find((id) => CONTRAST_WORD.test(labelFor(graph, id)));
  if (contrastCarrier) {
    out.push({
      statement: `${labelFor(graph, contrastCarrier)} contains an explicit contrast`,
      mechanism: "contrast",
      evidenceEventIds: [contrastCarrier],
      confidence: 0.74,
    });
  }

  return out
    .filter((item, index, all) => all.findIndex((other) => other.statement === item.statement && other.mechanism === item.mechanism) === index)
    .sort((a, b) => b.confidence - a.confidence);
}

export function deriveSequenceBackedCreativeInterpretation(graph: RealityGraph, candidate: LatentMovieCandidate): CreativeInterpretation | undefined {
  return deriveSequenceBackedCreativeInterpretations(graph, candidate)[0];
}
