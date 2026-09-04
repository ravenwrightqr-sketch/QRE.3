/**
 * QRE METAMORPHIC RELATION SEARCH
 *
 * Finds earned changes in meaning between supplied events. This is cognition,
 * not prose generation. It never adds a concrete event, object, actor,
 * chronology, location, action, reaction, or outcome.
 */
import type { LatentSemanticMechanism, RealityGraph, RealityRelation } from "@qre/contracts";

export type MetamorphicRelation = {
  type: string;
  mechanism: LatentSemanticMechanism;
  evidenceEventIds: string[];
  beforeEventIds: string[];
  afterEventIds: string[];
  before: string;
  after: string;
  relation?: { kind: string; fromEventId: string; toEventId: string };
  realizationMove: string;
  creativeOpportunity: string;
  feltEffect: string;
  viewerShift: string;
  languageAim: string;
  confidence: number;
  score: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function structure(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((event) => event.id === id);
}

function hasAny(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

const PRESENTATION = /\b(clean|cleaned|groomed|bathed|bath|polished|dressed|ready|fresh|finished|beautiful|sharp|dapper|pretty|perfect|special)\b/i;
const MISCHIEF = /\b(stole|stolen|took|taken|snatched|grabbed|lost|ran|escaped|broke|broke into|rebelled|refused|chaos|trouble|mischief|wild|unexpected)\b/i;
const POSITIVE = /\b(happy|proud|calm|excited|confident|comfortable|relieved|good|glad|pleased|delighted|ready|fierce|cool|sharp)\b/i;
const NEGATIVE = /\b(nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|lost|broken)\b/i;
const EXPECTED = /\b(unexpected|surprise|surprised|unplanned|did not expect|didn't expect|instead|rather than|but|yet)\b/i;
const RETURN = /\b(again|returned|return|back|still|same|remembered|repeated|later|years?)\b/i;
const OWNERSHIP = /\b(own|owns|owned|stole|stolen|took|taken|kept|had|has|belongs|belonged|gave|received)\b/i;
const SERVICE = /\b(groomed|grooming|bath|bathed|serviced|service|cleaned|clean|tailored|fixed|repaired|washed|polished)\b/i;
const ACTION = /\b(arrived|left|went|came|met|talked|walked|ran|played|danced|called|texted|worked|bought|sold|used|gave|found|lost|stole|took|picked|returned|groomed|grooming|bath|bathed|cleaned|finished|started|stopped|changed|wear|wore|wearing)\b/i;
const OUTCOME = /\b(stole|stolen|took|taken|snatched|grabbed|kept|owned|owns|had|has|belongs|belonged|received|won|finished|left|returned|found|lost|escaped|broke|rebelled|refused|chaos|trouble|mischief|happy|proud|calm|excited|confident|comfortable|relieved|good|glad|pleased|delighted|fierce|cool|sharp|ready|same|still|again|later|wear|wore|wearing|result|outcome|payoff)\b/i;
const OBJECT = /\b(bow|tag|collar|photo|picture|gift|key|keys|ring|flower|flowers|dress|coat|shirt|shoe|shoes|ticket|receipt|book|letter|phone|screen|car|room|house|home|table|door|window|box|bag|cake|towel|towels|leash|tool|tools|food|drink|coffee|music)\b/i;

function eventFeatures(graph: RealityGraph, id: string) {
  const label = eventLabel(graph, id);
  const item = graph.events.find((event) => event.id === id);
  const shape = structure(graph, id);
  const actionText = shape?.actions ?? [];
  const objectText = shape?.objects ?? [];
  const stateText = shape?.states ?? [];
  const semanticText = shape?.semanticTags ?? [];
  const text = [label, ...actionText, ...objectText, ...stateText, ...semanticText].join(" ");
  const objects = unique([
    ...objectText,
    ...label.match(/\b[a-z]+\b/gi)?.filter((value) => OBJECT.test(value)) ?? [],
  ]);
  return {
    label,
    entities: item?.entities ?? shape?.subjects ?? [],
    action: actionText.length > 0 || hasAny(text, ACTION),
    presentation: hasAny(text, PRESENTATION),
    mischief: hasAny(text, MISCHIEF),
    positive: hasAny(text, POSITIVE),
    negative: hasAny(text, NEGATIVE),
    expected: hasAny(text, EXPECTED),
    returnSignal: hasAny(text, RETURN),
    ownership: hasAny(text, OWNERSHIP),
    service: hasAny(text, SERVICE),
    outcome: hasAny(text, OUTCOME),
    objects,
    salient: item?.salient === true,
  };
}

function sameSubject(a: ReturnType<typeof eventFeatures>, b: ReturnType<typeof eventFeatures>): boolean {
  if (!a.entities.length || !b.entities.length) return true;
  const left = new Set(a.entities.map((value) => clean(value).toLowerCase()));
  return b.entities.some((value) => left.has(clean(value).toLowerCase()));
}

function relationCandidate(graph: RealityGraph, relation: RealityRelation): MetamorphicRelation | undefined {
  const from = eventLabel(graph, relation.from);
  const to = eventLabel(graph, relation.to);
  if (!from || !to) return undefined;
  const a = eventFeatures(graph, relation.from);
  const b = eventFeatures(graph, relation.to);
  const ordered = position(graph, relation.from) <= position(graph, relation.to);
  const beforeId = ordered ? relation.from : relation.to;
  const afterId = ordered ? relation.to : relation.from;
  const before = ordered ? from : to;
  const after = ordered ? to : from;

  let type = `relation_${relation.kind}`;
  let mechanism: LatentSemanticMechanism = "continuation";
  let realizationMove = "recognize";
  let opportunity = `make ${before} change the reading of ${after}`;
  let felt = "A noticeable change in how the supplied pieces belong together.";
  let shift = `The reading moves from ${before} toward ${after}.`;
  const aim = "Let juxtaposition, implication, compression, or reversal carry the relationship.";

  switch (relation.kind) {
    case "contrasts":
      type = "contrast_reversal";
      mechanism = "contrast";
      realizationMove = "hold_contrast";
      opportunity = "turn the supplied contrast into a status, attitude, or expectation reversal";
      felt = "A clean jolt between two supplied readings.";
      shift = `The viewer notices the collision between ${before} and ${after}.`;
      break;
    case "causes":
      type = "consequence_reframe";
      mechanism = "consequence";
      realizationMove = "land_consequence";
      opportunity = "let the supplied consequence retroactively define the earlier detail";
      felt = "The endpoint suddenly feels earned, ironic, or inevitable.";
      shift = `The viewer reads ${before} differently because ${after} exists.`;
      break;
    case "changes":
      type = "state_to_status";
      mechanism = "state_change";
      realizationMove = "feel_state_transition";
      opportunity = "convert a supplied state transition into a change in status, possibility, or attitude";
      felt = "A felt turn: the same subject no longer lands the same way.";
      shift = `The viewer experiences the movement from ${before} to ${after}.`;
      break;
    case "recontextualizes":
      type = "recontextualization";
      mechanism = "recurrence";
      realizationMove = "recontextualize_callback";
      opportunity = "make a supplied detail become more significant beside the later detail";
      felt = "Recognition: the earlier detail now means more than it did.";
      shift = "The later detail changes the weight of the earlier one.";
      break;
    case "repeats":
      type = "callback_recontextualization";
      mechanism = "recurrence";
      realizationMove = "recognize_callback";
      opportunity = "make the repeated supplied detail carry accumulated meaning instead of merely repeating it";
      felt = "A callback lands because the viewer remembers the first occurrence.";
      shift = "The repeated detail returns with a different weight.";
      break;
    case "converges":
      type = "convergence";
      mechanism = "convergence";
      realizationMove = "recognize";
      opportunity = "collapse supplied details into one memorable relationship";
      felt = "Separate details suddenly click together.";
      shift = "The viewer sees the supplied pieces as one pattern.";
      break;
    default:
      break;
  }

  const subjectBoost = sameSubject(a, b) ? 0.06 : 0;
  const featureBoost =
    (a.presentation && b.mischief) ||
    (a.service && b.outcome) ||
    (a.negative && b.positive)
      ? 0.12
      : subjectBoost;

  return {
    type,
    mechanism,
    evidenceEventIds: unique([relation.from, relation.to]),
    beforeEventIds: [beforeId],
    afterEventIds: [afterId],
    before,
    after,
    relation: { kind: relation.kind, fromEventId: beforeId, toEventId: afterId },
    realizationMove,
    creativeOpportunity: opportunity,
    feltEffect: felt,
    viewerShift: shift,
    languageAim: aim,
    confidence: metric(Math.max(0.72, relation.strength + featureBoost)),
    score: metric(relation.strength + featureBoost),
  };
}

function collisionCandidate(graph: RealityGraph, earlierId: string, laterId: string): MetamorphicRelation | undefined {
  const earlier = eventFeatures(graph, earlierId);
  const later = eventFeatures(graph, laterId);
  if (!earlier.label || !later.label) return undefined;

  const objectOverlap = earlier.objects.filter((object) => later.objects.includes(object));
  const distance = Math.max(1, Math.abs(position(graph, laterId) - position(graph, earlierId)));
  const spanBoost = Math.min(0.12, distance * 0.025);
  const subjectContinuity = sameSubject(earlier, later);

  if (earlier.presentation && later.mischief && subjectContinuity) {
    return {
      type: "presentation_behavior_collision",
      mechanism: "contrast",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId],
      afterEventIds: [laterId],
      before: earlier.label,
      after: later.label,
      realizationMove: "status_reversal",
      creativeOpportunity: "polished presentation becomes the setup for supplied mischief; make the contradiction do the work",
      feltEffect: "A grin-producing contradiction between presentation and behavior.",
      viewerShift: "The polished reading flips into an attitude reading.",
      languageAim: "Compress the presentation and behavior into one status inversion; never add a new act.",
      confidence: metric(0.92 + spanBoost),
      score: metric(0.9 + spanBoost),
    };
  }

  if (earlier.service && later.outcome && !later.service) {
    const continuityBoost = subjectContinuity ? 0.05 : 0;
    const evidenceBoost = (later.mischief || later.ownership || later.action || later.objects.length > 0) ? 0.04 : 0;
    return {
      type: "service_outcome_inversion",
      mechanism: "consequence",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId],
      afterEventIds: [laterId],
      before: earlier.label,
      after: later.label,
      realizationMove: "service_to_status",
      creativeOpportunity: "turn the supplied service into the setup for the supplied result, possession, deviation, state, or return",
      feltEffect: "The service stops feeling like the endpoint and becomes the setup for what the subject actually carries forward.",
      viewerShift: "The viewer reinterprets the service through the supplied outcome.",
      languageAim: "Make service and outcome collide; do not invent a bridge event or explain the thesis.",
      confidence: metric(0.94 + spanBoost + continuityBoost),
      score: metric(0.92 + spanBoost + continuityBoost + evidenceBoost),
    };
  }

  if (earlier.negative && later.positive && subjectContinuity) {
    return {
      type: "state_polarity_turn",
      mechanism: "state_change",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId],
      afterEventIds: [laterId],
      before: earlier.label,
      after: later.label,
      realizationMove: "feel_state_transition",
      creativeOpportunity: "let the polarity change become a shift in status or possibility, not an emotional explanation",
      feltEffect: "The viewer feels the turn before it is named.",
      viewerShift: `The supplied reading moves from ${earlier.label} toward ${later.label}.`,
      languageAim: "Use contrast or compression; do not explain the emotional thesis.",
      confidence: metric(0.91 + spanBoost),
      score: metric(0.89 + spanBoost),
    };
  }

  if (objectOverlap.length && (earlier.action || later.action) && (earlier.returnSignal || later.returnSignal) && subjectContinuity) {
    const object = objectOverlap[0]!;
    return {
      type: "object_recontextualization",
      mechanism: "recurrence",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId],
      afterEventIds: [laterId],
      before: earlier.label,
      after: later.label,
      realizationMove: "recognize_callback",
      creativeOpportunity: `make the supplied ${object} return with a changed meaning rather than as a repeated prop`,
      feltEffect: "Recognition plus a new implication for the same supplied detail.",
      viewerShift: `The later ${object} makes the earlier ${object} feel different.`,
      languageAim: "Let the callback carry the change; do not explain the callback.",
      confidence: metric(0.86 + spanBoost),
      score: metric(0.83 + spanBoost),
    };
  }

  if (earlier.expected && later.action && subjectContinuity) {
    return {
      type: "expectation_break",
      mechanism: "contrast",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId],
      afterEventIds: [laterId],
      before: earlier.label,
      after: later.label,
      realizationMove: "hold_contrast",
      creativeOpportunity: "make the supplied outcome puncture the supplied expectation",
      feltEffect: "A compact surprise without requiring a new plot event.",
      viewerShift: "The expected reading gives way to the supplied result.",
      languageAim: "Understate the setup and let the supplied outcome supply the punch.",
      confidence: metric(0.84 + spanBoost),
      score: metric(0.81 + spanBoost),
    };
  }

  return undefined;
}

export function searchMetamorphicRelations(
  graph: RealityGraph,
  candidateEventIds?: readonly string[],
): MetamorphicRelation[] {
  const ids = unique(candidateEventIds ?? graph.events.map((event) => event.id)).filter((id) => Boolean(eventLabel(graph, id)));
  if (ids.length < 2) return [];

  const results: MetamorphicRelation[] = [];
  const seen = new Set<string>();

  for (const relation of graph.relations) {
    if (["before", "after", "involves", "belongs_to"].includes(relation.kind)) continue;
    if (!ids.includes(relation.from) || !ids.includes(relation.to)) continue;
    const result = relationCandidate(graph, relation);
    if (!result) continue;
    const key = `${result.type}|${result.evidenceEventIds.join(",")}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(result);
    }
  }

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const earlierId = ids[i]!;
      const laterId = ids[j]!;
      const result = collisionCandidate(graph, earlierId, laterId);
      if (!result) continue;
      const key = `${result.type}|${result.evidenceEventIds.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(result);
    }
  }

  return results
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence)
    .slice(0, 12);
}
