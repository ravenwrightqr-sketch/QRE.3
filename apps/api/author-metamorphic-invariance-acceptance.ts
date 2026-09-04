import type { AuthorMetamorphicRelationSet, RealityGraph } from "@qre/contracts";
import { buildAuthorMetamorphicRelationSet } from "./src/services/authorMetamorphicRelationSet.js";
import { searchMetamorphicRelations } from "./src/services/authorMetamorphicRelationSearch.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`AUTHOR METAMORPHIC INVARIANCE FAILED: ${message}`);
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
  const evidence = events.map((event) => ({
    id: `evidence-${event.id}`,
    text: event.label,
    kind: "fact" as const,
  }));

  return {
    evidence,
    events: events.map((event) => ({
      id: event.id,
      label: event.label,
      entities: event.entities,
      sourceIds: [`evidence-${event.id}`],
      salient: true,
      provenance: "explicit" as const,
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
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: event.semanticTags ?? [],
      recurrenceScore: 0,
      transitionScore: event.states?.length ? 0.85 : 0.2,
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

function relationKeys(graph: RealityGraph) {
  return new Set(
    searchMetamorphicRelations(graph).map(
      (relation) => `${relation.type}|${[...relation.evidenceEventIds].sort().join(",")}`,
    ),
  );
}

function relationTypes(graph: RealityGraph) {
  return new Set(searchMetamorphicRelations(graph).map((relation) => relation.type));
}

function sealed(
  graph: RealityGraph,
  sourceEventIds: readonly string[],
): AuthorMetamorphicRelationSet {
  const relationSet = buildAuthorMetamorphicRelationSet(graph, sourceEventIds);
  assert(relationSet.version === 1, "relation set version changed");
  assert(relationSet.evidenceClosed, "relation set is not evidence-closed");
  assert(
    relationSet.sourceEventIds.every((id) => sourceEventIds.includes(id)),
    "relation set escaped requested source scope",
  );
  return relationSet;
}

const base = makeGraph([
  {
    id: "groom",
    label: "Coco was groomed and polished",
    entities: ["Coco"],
    actions: ["groomed"],
    states: ["polished"],
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

const paraphrase = makeGraph([
  {
    id: "groom",
    label: "Coco arrived freshly groomed and polished",
    entities: ["Coco"],
    actions: ["groomed"],
    states: ["polished"],
    semanticTags: ["service"],
  },
  {
    id: "bow",
    label: "Coco took the red bow",
    entities: ["Coco"],
    actions: ["stole"],
    objects: ["red bow"],
    semanticTags: ["ownership", "outcome"],
  },
]);

const baseKeys = relationKeys(base);
const paraphraseKeys = relationKeys(paraphrase);
assert(baseKeys.size > 0, "base produced no metamorphic relations");
assert(
  baseKeys.size === paraphraseKeys.size && [...baseKeys].every((key) => paraphraseKeys.has(key)),
  "semantic-equivalent paraphrase changed metamorphic relation identity",
);

const withIrrelevant = makeGraph([
  ...baseEvents(base),
  {
    id: "rain",
    label: "Rain fell outside",
    entities: ["weather"],
    actions: ["fell"],
    objects: ["rain"],
  },
]);
const irrelevantKeys = relationKeys(withIrrelevant);
assert(
  baseKeys.size === irrelevantKeys.size && [...baseKeys].every((key) => irrelevantKeys.has(key)),
  "irrelevant fact changed scoped metamorphic relation identity",
);

const reordered = makeGraph([
  {
    id: "bow",
    label: "Coco stole the red bow",
    entities: ["Coco"],
    actions: ["stole"],
    objects: ["red bow"],
    semanticTags: ["ownership", "outcome"],
  },
  {
    id: "groom",
    label: "Coco was groomed and polished",
    entities: ["Coco"],
    actions: ["groomed"],
    states: ["polished"],
    semanticTags: ["service"],
  },
]);
const reorderedKeys = relationKeys(reordered);
assert(
  baseKeys.size === reorderedKeys.size && [...baseKeys].every((key) => reorderedKeys.has(key)),
  "event serialization order changed metamorphic relation identity",
);

const outOfScope = makeGraph([
  ...baseEvents(base),
  {
    id: "later",
    label: "Coco was comfortable again",
    entities: ["Coco"],
    states: ["comfortable"],
    semanticTags: ["again"],
  },
]);
const scoped = sealed(outOfScope, ["groom", "bow"]);
assert(
  scoped.sourceEventIds.length === 2 &&
    scoped.sourceEventIds.includes("groom") &&
    scoped.sourceEventIds.includes("bow"),
  "out-of-scope event contaminated sealed relation source ids",
);
assert(
  scoped.relations.every((relation) =>
    relation.evidenceEventIds.every((id) => scoped.sourceEventIds.includes(id)),
  ),
  "out-of-scope event contaminated relation evidence",
);

const baselineState = makeGraph([
  {
    id: "start",
    label: "Mara entered the room",
    entities: ["Mara"],
    actions: ["entered"],
    states: ["calm"],
  },
  {
    id: "end",
    label: "Mara left the room",
    entities: ["Mara"],
    actions: ["left"],
    states: ["calm"],
  },
]);

const changedState = makeGraph([
  {
    id: "start",
    label: "Mara entered the room",
    entities: ["Mara"],
    actions: ["entered"],
    states: ["nervous"],
  },
  {
    id: "end",
    label: "Mara left the room",
    entities: ["Mara"],
    actions: ["left"],
    states: ["excited"],
  },
]);

assert(
  !relationTypes(baselineState).has("state_polarity_turn"),
  "baseline neutral state fixture unexpectedly produced polarity turn",
);
assert(
  relationTypes(changedState).has("state_polarity_turn"),
  "meaningful state transformation did not produce a metamorphic state turn",
);

const baselineSet = sealed(base, ["groom", "bow"]);
const paraphraseSet = sealed(paraphrase, ["groom", "bow"]);
assert(
  baselineSet.relationCount === paraphraseSet.relationCount &&
    baselineSet.relations.map((relation) => relation.type).sort().join("|") ===
      paraphraseSet.relations.map((relation) => relation.type).sort().join("|"),
  "paraphrase changed sealed metamorphic relation class",
);

function baseEvents(graph: RealityGraph): EventSpec[] {
  return graph.events.map((event) => {
    const shape = graph.eventStructure?.find((item) => item.eventId === event.id);
    return {
      id: event.id,
      label: event.label,
      entities: [...event.entities],
      actions: [...(shape?.actions ?? [])],
      objects: [...(shape?.objects ?? [])],
      states: [...(shape?.states ?? [])],
      semanticTags: [...(shape?.semanticTags ?? [])],
    };
  });
}

console.log("AUTHOR METAMORPHIC INVARIANCE ACCEPTANCE: PASS");
console.log("PARAPHRASE_INVARIANT=TRUE");
console.log("IRRELEVANT_FACT_INVARIANT=TRUE");
console.log("EVENT_ORDER_INVARIANT=TRUE");
console.log("OUT_OF_SCOPE_EVENT_ISOLATED=TRUE");
console.log("MEANINGFUL_STATE_CHANGE_DETECTED=TRUE");
console.log("SEALED_RELATION_CLASS_INVARIANT=TRUE");
