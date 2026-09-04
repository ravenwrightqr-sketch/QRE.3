import type { RealityGraph } from "@qre/contracts";
import { searchMetamorphicRelations } from "./src/services/authorMetamorphicRelationSearch.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`AUTHOR METAMORPHIC RELATION ACCEPTANCE FAILED: ${message}`);
  }
}

type EventSpec = {
  id: string;
  label: string;
  entities: string[];
  actions?: string[];
  objects?: string[];
  states?: string[];
  semanticTags?: string[];
  temporalMarkers?: string[];
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
  const eventIds = new Set(events.map((event) => event.id));

  return {
    evidence: events.map((event) => ({
      id: `evidence-${event.id}`,
      text: event.label,
      kind: "fact",
    })),
    events: events.map((event) => ({
      id: event.id,
      label: event.label,
      entities: event.entities,
      sourceIds: [`evidence-${event.id}`],
      salient: true,
      provenance: "explicit",
    })),
    relations: relations
      .filter((relation) => eventIds.has(relation.from) && eventIds.has(relation.to))
      .map((relation) => ({
        from: relation.from,
        to: relation.to,
        kind: relation.kind,
        strength: relation.strength,
      })) as RealityGraph["relations"],
    eventStructure: events.map((event) => ({
      eventId: event.id,
      subjects: event.entities,
      actions: event.actions ?? [],
      objects: event.objects ?? [],
      states: event.states ?? [],
      temporalMarkers: event.temporalMarkers ?? [],
      sensoryMarkers: [],
      semanticTags: event.semanticTags ?? [],
      recurrenceScore: 0,
      transitionScore: event.states?.length ? 0.8 : 0.2,
      anomalyScore: 0.2,
      salienceScore: 0.9,
    })),
    entityContinuity: [...new Set(events.flatMap((event) => event.entities))].map(
      (name) => {
        const eventIdsForEntity = events
          .filter((event) => event.entities.includes(name))
          .map((event) => event.id);
        return {
          name,
          mentionCount: eventIdsForEntity.length,
          eventIds: eventIdsForEntity,
          firstEventId: eventIdsForEntity[0],
          lastEventId: eventIdsForEntity[eventIdsForEntity.length - 1],
          kind: "unknown" as const,
          salienceScore: 0.9,
        };
      },
    ),
    unresolvedTensions: [],
    recurringSignals: [],
    sensorySignals: [],
    patterns: [],
  };
}

function relationTypes(graph: RealityGraph): Set<string> {
  return new Set(searchMetamorphicRelations(graph).map((item) => item.type));
}

function relationEvidenceIsClosed(graph: RealityGraph): boolean {
  const ids = new Set(graph.events.map((event) => event.id));
  return searchMetamorphicRelations(graph).every((relation) =>
    relation.evidenceEventIds.every((id) => ids.has(id)),
  );
}

const coco = makeGraph([
  {
    id: "groom",
    label: "Coco was groomed at Elm Street Grooming",
    entities: ["Coco"],
    actions: ["groomed"],
    states: ["clean", "polished"],
    semanticTags: ["service"],
  },
  {
    id: "bath",
    label: "Coco got a bath",
    entities: ["Coco"],
    actions: ["bathed"],
    states: ["clean"],
    semanticTags: ["service"],
  },
  {
    id: "bow",
    label: "Coco stole the red bow",
    entities: ["Coco"],
    actions: ["stole"],
    objects: ["red bow"],
    semanticTags: ["ownership", "outcome"],
  },
]);

const cocoTypes = relationTypes(coco);
assert(
  cocoTypes.has("presentation_behavior_collision"),
  "presentation → behavior collision missing",
);
assert(
  cocoTypes.has("service_outcome_inversion"),
  "service → outcome inversion missing",
);
assert(
  relationEvidenceIsClosed(coco),
  "Coco relation evidence escaped the source graph",
);

const expectation = makeGraph([
  {
    id: "expect",
    label: "Alex and Jordan did not expect to meet",
    entities: ["Alex", "Jordan"],
    states: ["nervous", "unexpected"],
    semanticTags: ["expectation"],
  },
  {
    id: "met",
    label: "Alex met Jordan at Raven Coffee",
    entities: ["Alex", "Jordan"],
    actions: ["met"],
    objects: ["coffee"],
  },
  {
    id: "happy",
    label: "Alex and Jordan were happy",
    entities: ["Alex", "Jordan"],
    states: ["happy", "comfortable"],
  },
]);

const expectationTypes = relationTypes(expectation);
assert(
  expectationTypes.has("expectation_break"),
  "expectation break missing",
);
assert(
  expectationTypes.has("state_polarity_turn"),
  "relationship/state turn missing",
);
assert(
  relationEvidenceIsClosed(expectation),
  "expectation relation evidence escaped the source graph",
);

const callback = makeGraph(
  [
    {
      id: "tag",
      label: "Milo wore the dog tag",
      entities: ["Milo"],
      actions: ["wore"],
      objects: ["dog tag"],
    },
    {
      id: "walk",
      label: "Milo went on a walk",
      entities: ["Milo"],
      actions: ["walked"],
    },
    {
      id: "return",
      label: "The same dog tag was still there when Milo returned",
      entities: ["Milo"],
      actions: ["returned"],
      objects: ["dog tag"],
      semanticTags: ["return", "recurrence"],
      temporalMarkers: ["later"],
    },
  ],
  [
    {
      from: "tag",
      to: "return",
      kind: "repeats",
      strength: 0.94,
    },
  ],
);

const callbackResults = searchMetamorphicRelations(callback);
assert(
  callbackResults.some(
    (item) =>
      item.type === "callback_recontextualization" ||
      item.type === "object_recontextualization" ||
      item.type === "relation_repeats",
  ),
  "callback recontextualization missing",
);
assert(
  relationEvidenceIsClosed(callback),
  "callback relation evidence escaped the source graph",
);

const orderedA = makeGraph([
  {
    id: "a",
    label: "Coco was groomed and polished",
    entities: ["Coco"],
    actions: ["groomed"],
    states: ["polished"],
    semanticTags: ["service"],
  },
  {
    id: "b",
    label: "Coco stole the red bow",
    entities: ["Coco"],
    actions: ["stole"],
    objects: ["red bow"],
    semanticTags: ["ownership", "outcome"],
  },
  {
    id: "c",
    label: "Coco was ready again",
    entities: ["Coco"],
    states: ["ready"],
    semanticTags: ["again"],
  },
]);

const orderedB = makeGraph([
  {
    id: "c",
    label: "Coco was ready again",
    entities: ["Coco"],
    states: ["ready"],
    semanticTags: ["again"],
  },
  {
    id: "a",
    label: "Coco was groomed and polished",
    entities: ["Coco"],
    actions: ["groomed"],
    states: ["polished"],
    semanticTags: ["service"],
  },
  {
    id: "b",
    label: "Coco stole the red bow",
    entities: ["Coco"],
    actions: ["stole"],
    objects: ["red bow"],
    semanticTags: ["ownership", "outcome"],
  },
]);

const key = (item: ReturnType<typeof searchMetamorphicRelations>[number]): string =>
  `${item.type}|${[...item.evidenceEventIds].sort().join(",")}`;

const keysA = new Set(searchMetamorphicRelations(orderedA).map(key));
const keysB = new Set(searchMetamorphicRelations(orderedB).map(key));

assert(
  keysA.size === keysB.size && [...keysA].every((value) => keysB.has(value)),
  "relation discovery changed when event order changed",
);

const scores = searchMetamorphicRelations(coco).map((item) => item.score);
assert(
  scores.every((score) => score >= 0 && score <= 1),
  "metamorphic score escaped normalization",
);
assert(
  scores.every((score) => Number.isFinite(score)),
  "metamorphic score is not finite",
);

console.log("AUTHOR METAMORPHIC RELATION ACCEPTANCE: PASS");
console.log("PRESENTATION_BEHAVIOR_COLLISION=TRUE");
console.log("SERVICE_OUTCOME_INVERSION=TRUE");
console.log("EXPECTATION_BREAK=TRUE");
console.log("STATE_POLARITY_TURN=TRUE");
console.log("CALLBACK_RECONTEXTUALIZATION=TRUE");
console.log("EVIDENCE_LOCK=TRUE");
console.log("ORDER_INDEPENDENT=TRUE");
