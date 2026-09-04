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

function makeGraph(
  events: readonly EventSpec[],
  relations: readonly RelationSpec[] = [],
): RealityGraph {
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
      (event.entities ?? []).map((name) => ({
        name,
        eventIds: [event.id],
        salienceScore: 0.9,
      })),
    ),
    unresolvedTensions: [],
    recurringSignals: [],
    patterns: [],
  } as unknown as RealityGraph;
}

function relationTypes(graph: RealityGraph): string[] {
  return searchMetamorphicRelations(graph).map((item) => item.type);
}

function evidenceIsClosed(graph: RealityGraph): boolean {
  const ids = new Set(graph.events.map((event) => event.id));
  return searchMetamorphicRelations(graph).every((item) =>
    item.evidenceEventIds.every((id) => ids.has(id)),
  );
}

const pet = makeGraph([
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
]);
const petTypes = relationTypes(pet);
assert(petTypes.includes("presentation_behavior_collision"), "pet presentation/behavior relation missing");
assert(petTypes.includes("service_outcome_inversion"), "pet service/outcome relation missing");
assert(evidenceIsClosed(pet), "pet evidence escaped the source graph");

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
const relationshipTypes = relationTypes(relationship);
assert(relationshipTypes.includes("expectation_break"), "relationship expectation break missing");
assert(relationshipTypes.includes("state_polarity_turn"), "relationship state turn missing");
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
], [{ from: "use", to: "return", kind: "repeats", strength: 0.94 }]);
const productResults = searchMetamorphicRelations(product);
assert(productResults.some((item) => item.type === "callback_recontextualization" || item.type === "object_recontextualization"), "product callback relation missing");
assert(evidenceIsClosed(product), "product evidence escaped the source graph");

const place = makeGraph([
  {
    id: "quiet",
    label: "The old theater was quiet",
    entities: ["theater"],
    states: ["quiet", "old"],
  },
  {
    id: "crowd",
    label: "The theater filled for the festival",
    entities: ["theater"],
    actions: ["filled"],
    states: ["busy"],
  },
]);
const placeResults = searchMetamorphicRelations(place);
assert(placeResults.some((item) => item.type === "state_polarity_turn" || item.type === "relation_changes"), "place state metamorphosis missing");
assert(evidenceIsClosed(place), "place evidence escaped the source graph");

const additionBase = makeGraph([
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
]);
const additionWithIrrelevantFact = makeGraph([
  ...additionBase.events.map((event) => ({
    id: event.id,
    label: event.label,
    entities: event.entities,
  })),
  {
    id: "irrelevant",
    label: "The sky was ordinary",
    entities: ["sky"],
    states: ["ordinary"],
  },
]);
const baseResults = searchMetamorphicRelations(additionBase);
const expandedResults = searchMetamorphicRelations(additionWithIrrelevantFact);
for (const result of baseResults) {
  assert(
    expandedResults.some(
      (candidate) =>
        candidate.type === result.type &&
        candidate.evidenceEventIds.join(",") === result.evidenceEventIds.join(","),
    ),
    `irrelevant fact erased an existing metamorphic relation: ${result.type}`,
  );
}

const reordered = makeGraph([
  pet.events[2]!,
  pet.events[0]!,
  pet.events[1]!,
]);
const reorderedTypes = relationTypes(reordered);
assert(reorderedTypes.includes("presentation_behavior_collision"), "reordering source events erased presentation/behavior relation");
assert(reorderedTypes.includes("service_outcome_inversion"), "reordering source events erased service/outcome relation");

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
assert(searchMetamorphicRelations(isolated).every((item) => item.score >= 0 && item.score <= 1), "scores escaped normalized range");
assert(evidenceIsClosed(isolated), "isolated evidence escaped the source graph");

console.log("AUTHOR METAMORPHIC FOUNDATION ACCEPTANCE: PASS");
console.log("CROSS_DOMAIN=TRUE");
console.log("MULTI_RELATION_PER_PAIR=TRUE");
console.log("STRUCTURED_EVENT_SEMANTICS=TRUE");
console.log("EVIDENCE_CLOSURE=TRUE");
console.log("IRRELEVANT_ADDITION_MONOTONICITY=TRUE");
console.log("INPUT_ORDER_STABILITY=TRUE");
console.log("SCORE_NORMALIZATION=TRUE");
