import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  LatentSemanticCreativeOpportunity,
  LatentSemanticMechanism,
  LatentSemanticRealization,
  LatentSemanticRealizationMove,
  ObserverExperienceObjective,
  RealityGraph,
  RealityPattern,
} from "@qre/contracts";


const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const SUBJECTIVE_ACTIONS = new Set(["like", "likes", "love", "loves", "prefer", "prefers", "enjoy", "enjoys", "favor", "favors"]);

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function structure(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}

function relation(graph: RealityGraph, left: string, right: string) {
  return graph.relations
    .filter((item) => (item.from === left && item.to === right) || (item.from === right && item.to === left))
    .sort((a, b) => b.strength - a.strength)[0];
}

function entityKey(value: string): string {
  return clean(value).toLowerCase().replace(/\b(?:the|a|an|same)\b/g, "").replace(/\s+/g, " ").trim();
}

function eventObjects(graph: RealityGraph, id: string): string[] {
  const item = structure(graph, id);
  return unique([...(item?.objects ?? []), ...graph.events.find((event) => event.id === id)?.entities.slice(0, 6) ?? []]);
}

function semanticMechanism(
  type: AuthorMetamorphicRelation["type"],
): LatentSemanticRealization["mechanism"] {
  if (type === "relation_preference_constellation") return "convergence";
  if (type === "relation_invariant") return "recurrence";
  if (type === "relation_origin") return "consequence";
  if (type === "relation_role") return "convergence";
  if (type === "relation_accumulation") return "convergence";
  if (type === "relation_contrast") return "contrast";
  return "expectation_shift";
}
function creativeOpportunity(
  type: AuthorMetamorphicRelation["type"],
): NonNullable<LatentSemanticRealization["creativeOpportunity"]> {
  switch (type) {
    case "relation_preference_constellation":
      return "recognition";
    case "relation_invariant":
      return "callback_recontextualization";
    case "relation_origin":
      return "consequence";
    case "relation_role":
      return "recognition";
    case "relation_accumulation":
      return "recognition";
    case "relation_contrast":
      return "contrast_reframe";
    default:
      return "callback_recontextualization";
  }
}
function observerObjective(statement: string, type: AuthorMetamorphicRelation["type"]): ObserverExperienceObjective {
  const mechanism = clean(type.replace(/^relation_/, ""));
  return {
    objective: statement,
    surprise: "Reveal only enough supplied evidence for the observer to update a live hypothesis.",
    curiosity: `Let the observer notice the ${mechanism} without naming its conclusion.`,
    attention: ["establish concrete evidence", "preserve the pattern", "delay the explanation", "let the observer complete the read"],
    landing: "Let the evidence close the gap; do not state the final interpretation.",
    explanationForbidden: true,
    feltEffect: "recognition",
    viewerShift: "the observer forms or updates a grounded hypothesis",
    realizationDirection: "show evidence; preserve inference space",
  };
}

function makeRelation(
  id: string,
  type: AuthorMetamorphicRelation["type"],
  evidenceEventIds: string[],
  beforeEventIds: string[],
  afterEventIds: string[],
  before: string,
  after: string,
  confidence: number,
  feltEffect: string,
  viewerShift: string,
  languageAim: string,
  relation?: AuthorMetamorphicRelation["relation"],
): AuthorMetamorphicRelation {
  const realizationMove: LatentSemanticRealization["realizationMove"] =
    type === "relation_invariant" || type === "relation_callback" ? "recontextualize_callback" :
    type === "relation_contrast" ? "hold_contrast" :
    type === "relation_origin" ? "land_consequence" :
    "recognize";
  const score = metric(
    confidence * 0.28 +
    Math.min(1, evidenceEventIds.length / 4) * 0.18 +
    Math.min(1, afterEventIds.length / 3) * 0.12 +
    Math.min(1, beforeEventIds.length / 3) * 0.1 +
    (type.startsWith("relation_") ? 0.15 : 0) +
    (afterEventIds.length > 1 ? 0.08 : 0) +
    (beforeEventIds.length > 1 ? 0.09 : 0),
  );
  return {
    id,
    type,
    mechanism: semanticMechanism(type),
    evidenceEventIds: unique(evidenceEventIds),
    beforeEventIds: unique(beforeEventIds),
    afterEventIds: unique(afterEventIds),
    before: clean(before),
    after: clean(after),
    relation,
    realizationMove,
    creativeOpportunity: creativeOpportunity(type),
    feltEffect,
    viewerShift,
    languageAim,
    confidence: metric(confidence),
    score,
  };
}

function preferenceConstellations(graph: RealityGraph, subject?: string): AuthorMetamorphicRelation[] {
  const candidates = graph.events
    .map((event) => ({ event, shape: structure(graph, event.id) }))
    .filter(({ shape }) => (shape?.actions ?? []).some((action) => SUBJECTIVE_ACTIONS.has(clean(action).toLowerCase())));
  const groups = new Map<string, { ids: string[]; objects: string[] }>();
  for (const { event } of candidates) {
    if (subject && event.entities.length && !event.entities.some((entity) => entityKey(entity) === entityKey(subject))) continue;
    const objects = eventObjects(graph, event.id).filter(Boolean);
    if (!objects.length) continue;
    const key = subject ? entityKey(subject) : "world";
    const group = groups.get(key) ?? { ids: [], objects: [] };
    group.ids.push(event.id);
    group.objects.push(...objects);
    groups.set(key, group);
  }
  const out: AuthorMetamorphicRelation[] = [];
  for (const [key, group] of groups) {
    const objects = unique(group.objects);
    if (objects.length < 3) continue;
    const name = key === "world" ? "the subject" : clean(subject);
    out.push(makeRelation(
      `satanico-preference-${out.length + 1}`,
      "relation_preference_constellation",
      group.ids,
      group.ids.slice(0, 1),
      group.ids.slice(1),
      objects.slice(0, 2).join(" + "),
      objects.slice(2, 6).join(" + "),
      metric(Math.min(0.98, 0.62 + objects.length * 0.08)),
      "recognition",
      "a set of ordinary preferences becomes a recognizable behavioral pattern",
      `${name} can be shown as a pattern of preference without asserting a new event`,
    ));
  }
  return out;
}

function invariantRelations(graph: RealityGraph): AuthorMetamorphicRelation[] {
  const out: AuthorMetamorphicRelation[] = [];
  for (const continuity of graph.entityContinuity ?? []) {
    if (continuity.eventIds.length < 2) continue;
    const ids = unique(continuity.eventIds);
    const first = ids[0]!;
    const last = ids[ids.length - 1]!;
    const firstLabel = eventLabel(graph, first);
    const lastLabel = eventLabel(graph, last);
    const sharedTokens = new Set(eventLabel(graph, first).toLowerCase().split(/\W+/).filter((token) => token.length >= 4));
    const lastTokens = new Set(lastLabel.toLowerCase().split(/\W+/).filter((token) => token.length >= 4));
    const shared = [...sharedTokens].filter((token) => lastTokens.has(token));
    if (!shared.length && continuity.kind === "unknown") continue;
    out.push(makeRelation(
      `satanico-invariant-${out.length + 1}`,
      "relation_invariant",
      ids,
      ids.slice(0, -1),
      [last],
      firstLabel,
      lastLabel,
      metric(Math.min(0.97, 0.58 + continuity.salienceScore * 0.3 + continuity.mentionCount * 0.03)),
      "recognition",
      `${continuity.name} persists while surrounding evidence changes or accumulates`,
      "show recurrence with enough contrast that the persistent element can acquire meaning",
    ));
  }
  return out;
}

function relationBased(graph: RealityGraph): AuthorMetamorphicRelation[] {
  const out: AuthorMetamorphicRelation[] = [];
  for (const item of graph.relations) {
    if (item.strength < 0.62) continue;
    if (!["contrasts", "recontextualizes", "repeats", "changes", "causes", "converges"].includes(item.kind)) continue;
    const from = eventLabel(graph, item.from);
    const to = eventLabel(graph, item.to);
    const type: AuthorMetamorphicRelation["type"] = item.kind === "contrasts" ? "relation_contrast" : item.kind === "repeats" ? "relation_callback" : item.kind === "converges" ? "relation_convergence" : item.kind === "causes" ? "relation_consequence" : item.kind === "changes" ? "relation_change" : "relation_recontextualization";
    out.push(makeRelation(
      `satanico-relation-${out.length + 1}`,
      type,
      [item.from, item.to],
      [item.from],
      [item.to],
      from,
      to,
      item.strength,
      "recontextualization",
      `the supplied ${item.kind} relationship changes what the observer expects`,
      `preserve the relation without explaining what it means`,
      { kind: item.kind, fromEventId: item.from, toEventId: item.to },
    ));
  }
  return out;
}

function patternRelations(graph: RealityGraph): AuthorMetamorphicRelation[] {
  return (graph.patterns ?? []).map((pattern, index) => makeRelation(
    `satanico-pattern-${index + 1}`,
    pattern.kind === "recurrence" ? "relation_invariant" : pattern.kind === "transition" ? "relation_change" : pattern.kind === "anomaly" ? "relation_contrast" : "relation_accumulation",
    pattern.eventIds,
    pattern.eventIds.slice(0, Math.max(1, pattern.eventIds.length - 1)),
    pattern.eventIds.slice(-1),
    pattern.label,
    pattern.label,
    pattern.strength,
    pattern.kind,
    `the supplied ${pattern.kind} pattern becomes more meaningful as the observer sees it accumulate`,
    "compress the pattern rather than narrating it",
  ));
}

function roleRelations(graph: RealityGraph): AuthorMetamorphicRelation[] {
  const out: AuthorMetamorphicRelation[] = [];
  for (const continuity of graph.entityContinuity ?? []) {
    if (continuity.eventIds.length < 3 || continuity.kind === "unknown") continue;
    const ids = unique(continuity.eventIds);
    const labels = ids.map((id) => eventLabel(graph, id)).filter(Boolean);
    const contexts = unique(labels.flatMap((label, index) => {
      const shape = structure(graph, ids[index]!);
      return [...(shape?.semanticTags ?? []), ...(shape?.states ?? []), ...(shape?.objects ?? [])];
    }));
    if (contexts.length < 2) continue;
    out.push(makeRelation(
      `satanico-role-${out.length + 1}`,
      "relation_role",
      ids,
      ids.slice(0, -1),
      ids.slice(-2),
      contexts.slice(0, 3).join(" / "),
      contexts.slice(-3).join(" / "),
      metric(Math.min(0.94, 0.52 + continuity.salienceScore * 0.3 + contexts.length * 0.03)),
      "recognition",
      `${continuity.name} occupies a persistent role across different supplied contexts`,
      "let repeated participation reveal the role without naming it",
    ));
  }
  return out;
}

function normalizeRelations(relations: AuthorMetamorphicRelation[], limit: number): AuthorMetamorphicRelation[] {
  return [...relations]
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.id.localeCompare(b.id))
    .filter((candidate, index, all) => {
      const sameEvidence = all.slice(0, index).some((prior) => {
        const left = new Set(prior.evidenceEventIds);
        return candidate.evidenceEventIds.every((id) => left.has(id)) && prior.evidenceEventIds.every((id) => new Set(candidate.evidenceEventIds).has(id));
      });
      return !sameEvidence;
    })
    .slice(0, limit);
}

export type SatanicoInferenceResult = {
  relations: AuthorMetamorphicRelationSet;
  strongest: AuthorMetamorphicRelation | undefined;
  observerInferencePotential: number;
  explanationPenalty: number;
  inventionPenalty: number;
  hypothesisSpace: number;
};

export function discoverSatanicoInference(graph: RealityGraph, subject?: string, limit = 12): SatanicoInferenceResult {
  const candidates = normalizeRelations([
    ...preferenceConstellations(graph, subject),
    ...invariantRelations(graph),
    ...roleRelations(graph),
    ...patternRelations(graph),
    ...relationBased(graph),
  ], limit);
  const strongest = candidates[0];
  const relationStrength = candidates.length ? candidates.reduce((sum, item) => sum + item.confidence, 0) / candidates.length : 0;
  const unresolved = strongest ? Math.max(0.45, 1 - strongest.score * 0.45) : 0;
  const inferencePotential = metric(relationStrength * 0.3 + (strongest?.score ?? 0) * 0.34 + unresolved * 0.2 + Math.min(1, candidates.length / 6) * 0.16);
  const relationSet: AuthorMetamorphicRelationSet = {
    version: 1,
    sourceEventIds: unique(graph.events.map((event) => event.id)),
    relations: candidates,
    strongestRelationId: strongest?.id,
    relationCount: candidates.length,
    evidenceClosed: candidates.every((item) => item.evidenceEventIds.every((id) => graph.events.some((event) => event.id === id))),
  };
  return {
    relations: relationSet,
    strongest,
    observerInferencePotential: inferencePotential,
    explanationPenalty: strongest ? metric(0.22 + strongest.score * 0.18) : 0,
    inventionPenalty: relationSet.evidenceClosed ? 0 : 1,
    hypothesisSpace: metric(unresolved + Math.min(0.4, candidates.length * 0.05)),
  };
}

export function satanicoObserverObjective(result: SatanicoInferenceResult): ObserverExperienceObjective | undefined {
  if (!result.strongest) return undefined;
  return observerObjective(result.strongest.after || result.strongest.before, result.strongest.type);
}

export function scoreSatanicoCandidate(
  candidateEvidenceEventIds: readonly string[],
  result: SatanicoInferenceResult,
): number {
  if (!result.relations.relations.length || !candidateEvidenceEventIds.length) return 0;
  const candidate = new Set(candidateEvidenceEventIds);
  const best = Math.max(...result.relations.relations.map((item) => {
    const overlap = item.evidenceEventIds.filter((id) => candidate.has(id)).length / Math.max(1, item.evidenceEventIds.length);
    return overlap * item.score;
  }));
  return metric(best * 0.62 + result.observerInferencePotential * 0.38);
}