/**
 * QRE CREATIVE INTERPRETATION DISCOVERY
 *
 * Discovers the smallest unexpected meaning that supplied reality supports.
 * Cognition only. Mouth performs the final language realization.
 *
 * LAW:
 *   FEEL THE CHANGE. DO NOT EXPLAIN THE CHANGE.
 *
 * The interpretation layer may discover transformation, consequence,
 * recurrence, convergence, or recontextualization, but it may never create
 * an unstated person, event, object, place, action, or chronology.
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
const ACTION = /\b(?:arrived|dropped|cleaned|groomed|finished|started|picked|left|visited|met|called|talked|worked|played|danced|went|came|returned|bought|sold|built|fixed|washed|served|stayed|made|walked|ran|cooked)\b/i;
const CONTINUATION = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|wanted|want|needed|need)\b/i;
const EXPECTATION = /\b(?:unexpected|surpris(?:e|ed|ing)|unplanned|didn'?t expect|did not expect|never thought|never planned)\b/i;
const CONTRAST_WORD = /\b(?:but|yet|although|instead|rather|except|while|however)\b/i;

function labelFor(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function positionMap(candidate: LatentMovieCandidate): Map<string, number> {
  return new Map(unique(candidate.trajectory.flatMap((step) => step.eventIds)).map((id, index) => [id, index]));
}

function ids(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function statePolarity(text: string): -1 | 0 | 1 {
  if (NEGATIVE.test(text)) return -1;
  if (POSITIVE.test(text)) return 1;
  return 0;
}

function directionalStateChange(graph: RealityGraph, orderedIds: readonly string[]): CreativeInterpretation | undefined {
  let best: CreativeInterpretation | undefined;
  for (let i = 0; i < orderedIds.length; i += 1) {
    const from = labelFor(graph, orderedIds[i]!);
    if (!STATE.test(from)) continue;
    const fromPolarity = statePolarity(from);
    for (let j = i + 1; j < orderedIds.length; j += 1) {
      const to = labelFor(graph, orderedIds[j]!);
      if (!STATE.test(to)) continue;
      const toPolarity = statePolarity(to);
      if (!fromPolarity || !toPolarity || fromPolarity === toPolarity) continue;
      const confidence = metric((fromPolarity < 0 && toPolarity > 0 ? 0.99 : 0.9) + Math.min(0.08, (j - i) * 0.02));
      const candidate: CreativeInterpretation = {
        statement: `${from} gives way to ${to}`,
        mechanism: "state_change",
        evidenceEventIds: [orderedIds[i]!, orderedIds[j]!],
        confidence,
      };
      if (!best || candidate.confidence > best.confidence) best = candidate;
    }
  }
  return best;
}

function actionThenState(graph: RealityGraph, orderedIds: readonly string[]): CreativeInterpretation | undefined {
  let best: CreativeInterpretation | undefined;
  for (let i = 0; i < orderedIds.length; i += 1) {
    const action = labelFor(graph, orderedIds[i]!);
    if (!ACTION.test(action)) continue;
    for (let j = i + 1; j < orderedIds.length; j += 1) {
      const state = labelFor(graph, orderedIds[j]!);
      if (!STATE.test(state)) continue;
      const confidence = metric(0.76 + (j - i <= 2 ? 0.12 : 0) + (POSITIVE.test(state) ? 0.07 : 0));
      const candidate: CreativeInterpretation = {
        statement: `${action} -> ${state}`,
        mechanism: "consequence",
        evidenceEventIds: [orderedIds[i]!, orderedIds[j]!],
        confidence,
      };
      if (!best || candidate.confidence > best.confidence) best = candidate;
    }
  }
  return best;
}

function relationInterpretations(graph: RealityGraph, candidate: LatentMovieCandidate): CreativeInterpretation[] {
  const positions = positionMap(candidate);
  const out: CreativeInterpretation[] = [];
  for (const relation of graph.relations) {
    const fromPosition = positions.get(relation.from);
    const toPosition = positions.get(relation.to);
    if (fromPosition === undefined || toPosition === undefined || fromPosition >= toPosition) continue;
    if (["before", "after", "involves", "belongs_to"].includes(relation.kind)) continue;
    const from = labelFor(graph, relation.from);
    const to = labelFor(graph, relation.to);
    if (!from || !to) continue;

    const mechanism: CreativeInterpretationMechanism =
      relation.kind === "contrasts" ? "contrast" :
      relation.kind === "recontextualizes" ? "expectation_shift" :
      relation.kind === "repeats" ? "recurrence" :
      relation.kind === "converges" ? "convergence" :
      relation.kind === "changes" ? "state_change" :
      "consequence";

    const confidence = metric(
      0.58 +
      relation.strength * 0.28 +
      (relation.kind === "changes" ? 0.08 : 0) -
      (relation.kind === "converges" ? 0.1 : 0) -
      (relation.kind === "contrasts" ? 0.04 : 0),
    );

    out.push({
      statement: `${from} -> ${to}`,
      mechanism,
      evidenceEventIds: [relation.from, relation.to],
      confidence,
    });
  }
  return out;
}

export function deriveSequenceBackedCreativeInterpretations(graph: RealityGraph, candidate: LatentMovieCandidate): CreativeInterpretation[] {
  const orderedIds = ids(candidate);
  if (orderedIds.length < 2) return [];

  const out: CreativeInterpretation[] = [];
  const stateChange = directionalStateChange(graph, orderedIds);
  if (stateChange) out.push(stateChange);

  const consequence = actionThenState(graph, orderedIds);
  if (consequence) out.push(consequence);

  out.push(...relationInterpretations(graph, candidate));

  if (orderedIds.some((id) => CONTINUATION.test(labelFor(graph, id)))) {
    const id = orderedIds.find((item) => CONTINUATION.test(labelFor(graph, item)))!;
    out.push({ statement: `${labelFor(graph, id)} remains an open thread`, mechanism: "continuation", evidenceEventIds: [id], confidence: 0.78 });
  }

  if (orderedIds.some((id) => EXPECTATION.test(labelFor(graph, id)))) {
    const id = orderedIds.find((item) => EXPECTATION.test(labelFor(graph, item)))!;
    out.push({ statement: `${labelFor(graph, id)} changes the expected reading`, mechanism: "expectation_shift", evidenceEventIds: [id], confidence: 0.76 });
  }

  const explicitContrast = orderedIds.find((id) => CONTRAST_WORD.test(labelFor(graph, id)));
  if (explicitContrast) {
    out.push({ statement: `${labelFor(graph, explicitContrast)} contains an explicit contrast`, mechanism: "contrast", evidenceEventIds: [explicitContrast], confidence: 0.74 });
  }

  return out
    .filter((item, index, all) => all.findIndex((other) => other.statement === item.statement && other.mechanism === item.mechanism) === index)
    .sort((a, b) => b.confidence - a.confidence);
}

export function deriveSequenceBackedCreativeInterpretation(graph: RealityGraph, candidate: LatentMovieCandidate): CreativeInterpretation | undefined {
  return deriveSequenceBackedCreativeInterpretations(graph, candidate)[0];
}
