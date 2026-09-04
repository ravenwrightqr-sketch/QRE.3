/**
 * QRE METAMORPHIC RELATION SEARCH
 *
 * Finds earned changes in meaning between supplied events. This is cognition,
 * not prose generation. It never adds a concrete event, object, actor,
 * chronology, location, action, reaction, or outcome.
 *
 * The unit searched here is not "what happened next?" but:
 *   "what can one supplied detail become because another supplied detail exists?"
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

function words(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3));
}

function shared(left: string, right: string): string[] {
  const a = words(left);
  const b = words(right);
  return [...a].filter((token) => b.has(token));
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((event) => event.id === id);
}

function relationBetween(graph: RealityGraph, left: string, right: string): RealityRelation | undefined {
  return graph.relations
    .filter((relation) =>
      (relation.from === left && relation.to === right) ||
      (relation.from === right && relation.to === left))
    .sort((a, b) => b.strength - a.strength)[0];
}

function hasAny(text: string, pattern: RegExp): boolean { return pattern.test(text); }

const PRESENTATION = /\b(clean|cleaned|groomed|bathed|bath|polished|dressed|ready|fresh|finished|beautiful|sharp|dapper|pretty|perfect|special)\b/i;
const MISCHIEF = /\b(stole|stolen|took|taken|snatched|grabbed|lost|ran|escaped|broke|broke into|rebelled|refused|chaos|trouble|mischief|wild|unexpected)\b/i;
const POSITIVE = /\b(happy|proud|calm|excited|confident|comfortable|relieved|good|glad|pleased|delighted|ready|fierce|cool|sharp)\b/i;
const NEGATIVE = /\b(nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|lost|broken)\b/i;
const EXPECTED = /\b(unexpected|surprise|surprised|unplanned|did not expect|didn't expect|instead|rather than|but|yet)\b/i;
const RETURN = /\b(again|returned|return|back|still|same|remembered|repeated|later|years?)\b/i;
const OWNERSHIP = /\b(own|owns|owned|stole|stolen|took|taken|kept|had|has|belongs|belonged|gave|received)\b/i;
const SERVICE = /\b(groomed|bath|bathed|serviced|service|cleaned|clean|tailored|fixed|repaired|washed|polished)\b/i;
const ACTION = /\b(arrived|left|went|came|met|talked|walked|ran|played|danced|called|texted|worked|bought|sold|used|gave|found|lost|stole|took|picked|returned|groomed|bathed|cleaned|finished|started|stopped|changed)\b/i;
const OBJECT = /\b(bow|tag|collar|photo|picture|gift|key|keys|ring|flower|flowers|dress|coat|shirt|shoe|shoes|ticket|receipt|book|letter|phone|screen|car|room|house|home|table|door|window|box|bag|cake|towel|towels|leash|tool|tools|food|drink|coffee|music)\b/i;

function eventFeatures(graph: RealityGraph, id: string) {
  const label = eventLabel(graph, id);
  const item = graph.events.find((event) => event.id === id);
  const shape = structure(graph, id);
  const text = `${label} ${shape?.semanticTags?.join(" ") ?? ""}`;
  const objects = unique([...(shape?.objects ?? []), ...label.match(/\b[a-z]+\b/gi)?.filter((value) => OBJECT.test(value)) ?? []]);
  return {
    label,
    action: hasAny(text, ACTION),
    presentation: hasAny(text, PRESENTATION),
    mischief: hasAny(text, MISCHIEF),
    positive: hasAny(text, POSITIVE),
    negative: hasAny(text, NEGATIVE),
    expected: hasAny(text, EXPECTED),
    returnSignal: hasAny(text, RETURN),
    ownership: hasAny(text, OWNERSHIP),
    service: hasAny(text, SERVICE),
    objects,
    salient: item?.salient === true,
  };
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
  let realizationMove = "recontextualize";
  let opportunity = `make ${before} change the reading of ${after}`;
  let felt = "A noticeable change in how the supplied pieces belong together.";
  let shift = `The reading moves from ${before} toward ${after}.`;
  let aim = "Let juxtaposition, implication, compression, or reversal carry the relationship.";

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
      shift = `The later detail changes the weight of the earlier one.`;
      break;
    case "repeats":
      type = "callback_recontextualization";
      mechanism = "recurrence";
      realizationMove = "recognize_callback";
      opportunity = "make the repeated supplied detail carry accumulated meaning instead of merely repeating it";
      felt = "A callback lands because the viewer remembers the first occurrence.";
      shift = `The repeated detail returns with a different weight.`;
      break;
    case "converges":
      type = "convergence";
      mechanism = "convergence";
      realizationMove = "converge_details";
      opportunity = "collapse supplied details into one memorable relationship";
      felt = "Separate details suddenly click together.";
      shift = "The viewer sees the supplied pieces as one pattern.";
      break;
    default:
      break;
  }

  const featureBoost =
    (a.presentation && b.mischief) || (a.service && b.ownership) || (a.negative && b.positive)
      ? 0.12
      : 0;

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
  const a = eventFeatures(graph, earlierId);
  const b = eventFeatures(graph, laterId);
  if (!a.label || !b.label) return undefined;

  const objectOverlap = a.objects.filter((object) => b.objects.includes(object));
  const distance = Math.max(1, position(graph, laterId) - position(graph, earlierId));
  const spanBoost = Math.min(0.12, distance * 0.025);

  if (a.presentation && b.mischief) {
    return {
      type: "presentation_behavior_collision",
      mechanism: "contrast",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId], afterEventIds: [laterId],
      before: a.label, after: b.label,
      realizationMove: "status_reversal",
      creativeOpportunity: "polished presentation becomes the setup for supplied mischief; make the contradiction do the work",
      feltEffect: "A grin-producing contradiction between presentation and behavior.",
      viewerShift: "The polished reading flips into an attitude reading.",
      languageAim: "Compress the presentation and behavior into one status inversion; never add a new act.",
      confidence: metric(0.92 + spanBoost), score: metric(0.9 + spanBoost),
    };
  }

  if (a.service && b.ownership) {
    return {
      type: "service_outcome_inversion",
      mechanism: "consequence",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId], afterEventIds: [laterId],
      before: a.label, after: b.label,
      realizationMove: "service_to_status",
      creativeOpportunity: "turn the supplied service into the setup for the subject's supplied possession or deviation",
      feltEffect: "The result feels satisfyingly backwards or cheeky without needing a new event.",
      viewerShift: "The viewer stops reading the service as the endpoint and starts reading it as setup.",
      languageAim: "Make the service and outcome collide rather than narrating both.",
      confidence: metric(0.93 + spanBoost), score: metric(0.91 + spanBoost),
    };
  }

  if (a.negative && b.positive) {
    return {
      type: "state_polarity_turn",
      mechanism: "state_change",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId], afterEventIds: [laterId],
      before: a.label, after: b.label,
      realizationMove: "feel_state_transition",
      creativeOpportunity: "let the polarity change become a shift in status or possibility, not an emotional explanation",
      feltEffect: "The viewer feels the turn before it is named.",
      viewerShift: `The supplied reading moves from ${a.label} toward ${b.label}.`,
      languageAim: "Use contrast or compression; do not explain the emotional thesis.",
      confidence: metric(0.91 + spanBoost), score: metric(0.89 + spanBoost),
    };
  }

  if (objectOverlap.length && (a.action || b.action) && (a.returnSignal || b.returnSignal)) {
    const object = objectOverlap[0]!;
    return {
      type: "object_recontextualization",
      mechanism: "recurrence",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId], afterEventIds: [laterId],
      before: a.label, after: b.label,
      realizationMove: "recognize_callback",
      creativeOpportunity: `make the supplied ${object} return with a changed meaning rather than as a repeated prop`,
      feltEffect: "Recognition plus a new implication for the same supplied detail.",
      viewerShift: `The later ${object} makes the earlier ${object} feel different.`,
      languageAim: "Let the callback carry the change; do not explain the callback.",
      confidence: metric(0.86 + spanBoost), score: metric(0.83 + spanBoost),
    };
  }

  if (a.expected && b.action) {
    return {
      type: "expectation_break",
      mechanism: "contrast",
      evidenceEventIds: [earlierId, laterId],
      beforeEventIds: [earlierId], afterEventIds: [laterId],
      before: a.label, after: b.label,
      realizationMove: "defeat_expectation",
      creativeOpportunity: "make the supplied outcome puncture the supplied expectation",
      feltEffect: "A compact surprise without requiring a new plot event.",
      viewerShift: "The expected reading gives way to the supplied result.",
      languageAim: "Understate the setup and let the supplied outcome supply the punch.",
      confidence: metric(0.84 + spanBoost), score: metric(0.81 + spanBoost),
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
    if (!seen.has(key)) { seen.add(key); results.push(result); }
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
