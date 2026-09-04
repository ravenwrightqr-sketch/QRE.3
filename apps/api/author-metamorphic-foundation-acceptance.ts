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
    states: ["unexpected"],
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

const product = makeGraph(
  [
    {
      id: "purchase",
      label: "Mara bought the silver camera",
      entities: ["Mara"],
      actions: ["bought"],
      objects: ["silver camera"],
    },
    {
      id: "use",
      label: "Mara used the camera for the first time",
      entities: ["Mara"],
      actions: ["used"],
      objects: ["camera"],
      states: ["new"],
    },
    {
      id: "return",
      label: "Mara returned to the camera years later",
      entities: ["Mara"],
      actions: ["returned"],
      objects: ["camera"],
      states: ["same"],
    },
  ],
  [{ from: "use", to: "return", kind: "repeats", strength: 0.94 }],
);
assert(
  results(product).some(
    (item) => item.type === "callback_recontextualization" || item.type === "object_recontextualization",
  ),
  "product callback relation missing",
);
assert(evidenceIsClosed(product), "product evidence escaped the source graph");

const place = makeGraph(
  [
    {
      id: "quiet",
      label: "The old theater was quiet",
      entities: ["theater"],
      states: ["quiet"],
    },
    {
      id: "crowd",
      label: "The theater filled for the festival",
      entities: ["theater"],
      actions: ["filled"],
      states: ["busy"],
    },
  ],
  [{ from: "quiet", to: "crowd", kind: "changes", strength: 0.91 }],
);
assert(hasType(place, "state_to_status"), "place state metamorphosis missing");
assert(evidenceIsClosed(place), "place evidence escaped the source graph");

const additionBaseEvents: EventSpec[] = [
  {
    id: "clean",
    label: "Nico left the workshop polished",
    entities: ["Nico"],
    states: ["polished"],
    actions: ["left"],
  },
  {
    id: "mess",
    label: "Nico carried the finished mess home",
    entities: ["Nico"],
    states: ["finished"],
    actions: ["carried"],
    objects: ["mess"],
  },
];
const additionBase = makeGraph(additionBaseEvents);
const additionWithIrrelevantFact = makeGraph([
  ...additionBaseEvents,
  {
    id: "irrelevant",
    label: "The sky was ordinary",
    entities: ["sky"],
    states: ["ordinary"],
  },
]);
const baseResults = results(additionBase);
const expandedResults = results(additionWithIrrelevantFact);
for (const baseResult of baseResults) {
  assert(
    expandedResults.some((candidate) => relationKey(candidate) === relationKey(baseResult)),
    `irrelevant fact erased an existing metamorphic relation: ${baseResult.type}`,
  );
}

const reordered = makeGraph([petEvents[2]!, petEvents[0]!, petEvents[1]!]);
assert(hasType(reordered, "presentation_behavior_collision"), "input order erased presentation/behavior relation");
assert(hasType(reordered, "service_outcome_inversion"), "input order erased service/outcome relation");
assert(evidenceIsClosed(reordered), "reordered evidence escaped the source graph");

const isolated = makeGraph([
  {
    id: "one",
    label: "A red umbrella was on the table",
    entities: ["umbrella"],
    objects: ["red umbrella", "table"],
  },
  {
    id: "two",
    label: "The meeting happened on Tuesday",
    entities: ["meeting"],
    states: ["ordinary"],
  },
]);
assert(results(isolated).every((item) => item.score >= 0 && item.score <= 1), "scores escaped normalized range");
assert(evidenceIsClosed(isolated), "isolated evidence escaped the source graph");

for (const graph of [pet, relationship, product, place, additionBase, isolated]) {
  const sourceIds = new Set(graph.events.map((event) => event.id));
  for (const item of results(graph)) {
    assert(item.evidenceEventIds.every((id) => sourceIds.has(id)), `foreign evidence in ${item.type}`);
    assert(Number.isFinite(item.score) && Number.isFinite(item.confidence), `non-finite score in ${item.type}`);
    assert(item.score >= 0 && item.score <= 1, `score out of range in ${item.type}`);
    assert(item.confidence >= 0 && item.confidence <= 1, `confidence out of range in ${item.type}`);
  }
}

console.log("AUTHOR METAMORPHIC FOUNDATION ACCEPTANCE: PASS");
console.log("CROSS_DOMAIN=TRUE");
console.log("MULTI_RELATION_PER_PAIR=TRUE");
console.log("STRUCTURED_EVENT_SEMANTICS=TRUE");
console.log("EVIDENCE_CLOSURE=TRUE");
console.log("IRRELEVANT_ADDITION_MONOTONICITY=TRUE");
console.log("INPUT_ORDER_STABILITY=TRUE");
console.log("SCORE_NORMALIZATION=TRUE");
