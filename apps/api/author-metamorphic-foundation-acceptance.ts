import type { RealityGraph } from "@qre/contracts";
import { searchMetamorphicRelations } from "./src/services/authorMetamorphicRelationSearch.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR METAMORPHIC FOUNDATION FAILED: ${message}`);
}

type EventSpec = {
  id: string;
  label: string;
  entities?: string[];
  actions?: string[];
  objects?: string[];
  states?: string[];
  semanticTags?: string[];
};

type RelationSpec = {
  from: string;
  to: string;
  kind: string;
  strength: number;
};

function makeGraph(events: readonly EventSpec[], relations: readonly RelationSpec[] = []): RealityGraph {
  return {
    events: events.map((event) => ({
      id: event.id,
      label: event.label,
      entities: event.entities ?? [],
      sourceIds: [],
      salient: true,
    })),
    relations: [...relations],
    eventStructure: events.map((event) => ({
      eventId: event.id,
      subjects: event.entities ?? [],
      actions: event.actions ?? [],
      objects: event.objects ?? [],
      states: event.states ?? [],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: event.semanticTags ?? [],
      recurrenceScore: 0,
      transitionScore: 0,
      anomalyScore: 0,
      salienceScore: 0.9,
    })),
    entityContinuity: events.flatMap((event) =>
      (event.entities ?? []).map((name) => ({ name, eventIds: [event.id], salienceScore: 0.9 })),
    ),
    unresolvedTensions: [],
    recurringSignals: [],
    patterns: [],
  } as unknown as RealityGraph;
}

function results(graph: RealityGraph) {
  return searchMetamorphicRelations(graph);
}

function hasType(graph: RealityGraph, type: string): boolean {
  return results(graph).some((item) => item.type === type);
}

function evidenceIsClosed(graph: RealityGraph): boolean {
  const ids = new Set(graph.events.map((event) => event.id));
  return results(graph).every((item) => item.evidenceEventIds.every((id) => ids.has(id)));
}

function relationKey(item: ReturnType<typeof searchMetamorphicRelations>[number]): string {
  return `${item.type}|${item.evidenceEventIds.join(",")}`;
}

const petEvents: EventSpec[] = [
  {
    id: "groom",
    label: "Coco was groomed at Elm Street Grooming",
    entities: ["Coco"],
    actions: ["groomed"],
    states: ["clean", "polished"],
  },
  {
    id: "bath",
    label: "Coco got a bath",
    entities: ["Coco"],
    actions: ["bathed"],
  },
  {
    id: "bow",
    label: "Coco stole the red bow",
    entities: ["Coco"],
    actions: ["stole"],
    objects: ["red bow"],
  },
];
const pet = makeGraph(petEvents);
assert(hasType(pet, "presentation_behavior_collision"), "pet presentation/behavior relation missing");
assert(hasType(pet, "service_outcome_inversion"), "pet service/outcome relation missing");
assert(evidenceIsClosed(pet), "pet evidence escaped the source graph");

const petRelations = results(pet);
assert(
  petRelations.some(
    (item) =>
      item.type === "presentation_behavior_collision" &&
      item.evidenceEventIds.length === 2,
  ),
  "presentation/behavior relation lost pair evidence",
);
assert(
  petRelations.some(
    (item) =>
      item.type === "service_outcome_inversion" &&
      item.evidenceEventIds.length === 2,
  ),
  "service/outcome relation lost pair evidence",
);

const relationship = makeGraph([
  {
    id: "expectation",
    label: "Alex and Jordan did not expect to meet",
    entities: ["Alex", "Jordan"],
    states: ["nervous", "unexpected"],
  },
  {
    id: "meeting",
    label: "Alex met Jordan at Raven Coffee",
    entities: ["Alex", "Jordan"],
    actions: ["met"],
    objects: ["coffee"],
  },
  {
    id: "comfort",
    label: "They felt comfortable talking again",
    entities: ["Alex", "Jordan"],
    actions: ["talked"],
    states: ["comfortable"],
  },
]);
assert(hasType(relationship, "expectation_break"), "relationship expectation break missing");
assert(hasType(relationship, "state_polarity_turn"), "relationship state turn missing");
assert(evidenceIsClosed(relationship), "relationship evidence escaped the source graph");

const product = makeGraph([
  {
    id: "purchase",
    label: "Mara bought the silver camera",
    entities: ["Mara"],
    actions: ["bought"],
    objects: ["silver camera"],
  },
  {
    id: "use",
    label: "Mara used the silver camera at the wedding",
    entities: ["Mara"],
    actions: ["used"],
    objects: ["silver camera"],
  },
  {
    id: "return",
    label: "Mara returned to the silver camera years later",
    entities: ["Mara"],
    actions: ["returned"],
    objects: ["silver camera"],
    semanticTags: ["return", "later"],
  },
]);
const productRelations = results(product);
assert(
  productRelations.some(
    (item) =>
      item.type === "object_recontextualization" ||
      item.type === "callback_recontextualization",
  ),
  "product callback/recontextualization relation missing",
);
assert(evidenceIsClosed(product), "product evidence escaped the source graph");

const place = makeGraph([
  {
    id: "quiet",
    label: "The old theater was quiet",
    entities: ["old theater"],
    states: ["quiet"],
  },
  {
    id: "festival",
    label: "The old theater filled for the festival",
    entities: ["old theater"],
    actions: ["filled"],
    states: ["excited"],
  },
]);
assert(
  hasType(place, "state_polarity_turn") ||
    hasType(place, "relation_changes"),
  "place state/meaning change missing",
);
assert(evidenceIsClosed(place), "place evidence escaped the source graph");

const irrelevant = makeGraph([
  {
    id: "subject",
    label: "Mara bought the silver camera",
    entities: ["Mara"],
    actions: ["bought"],
    objects: ["silver camera"],
  },
  {
    id: "noise",
    label: "Rain fell outside",
    actions: ["fell"],
    objects: ["rain"],
  },
]);
const irrelevantResults = results(irrelevant);
assert(
  irrelevantResults.every((item) =>
    item.evidenceEventIds.every((id) => irrelevant.events.some((event) => event.id === id)),
  ),
  "irrelevant fact introduced foreign evidence",
);

const orderedA = makeGraph([
  { id: "a", label: "Coco was groomed and polished", entities: ["Coco"], actions: ["groomed"], states: ["polished"] },
  { id: "b", label: "Coco stole the red bow", entities: ["Coco"], actions: ["stole"], objects: ["red bow"] },
  { id: "c", label: "Coco was ready again", entities: ["Coco"], states: ["ready"], semanticTags: ["again"] },
]);
const orderedB = makeGraph([
  { id: "c", label: "Coco was ready again", entities: ["Coco"], states: ["ready"], semanticTags: ["again"] },
  { id: "a", label: "Coco was groomed and polished", entities: ["Coco"], actions: ["groomed"], states: ["polished"] },
  { id: "b", label: "Coco stole the red bow", entities: ["Coco"], actions: ["stole"], objects: ["red bow"] },
]);
const keysA = new Set(results(orderedA).map(relationKey));
const keysB = new Set(results(orderedB).map(relationKey));
assert(keysA.size === keysB.size && [...keysA].every((key) => keysB.has(key)), "relation discovery changed when event order changed");

const scores = results(pet).map((item) => item.score);
assert(scores.every((score) => score >= 0 && score <= 1), "metamorphic score escaped normalization");
assert(scores.every((score) => Number.isFinite(score)), "metamorphic score is not finite");

console.log("AUTHOR METAMORPHIC FOUNDATION ACCEPTANCE: PASS");
console.log("RELATION_CLASSES_COVERED=TRUE");
console.log("EVIDENCE_CLOSED=TRUE");
console.log("ORDER_INDEPENDENT=TRUE");
console.log("SCORES_NORMALIZED=TRUE");
