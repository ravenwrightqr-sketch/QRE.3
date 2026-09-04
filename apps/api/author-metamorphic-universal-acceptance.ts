import type {
  AuthorMetamorphicRelationSet,
  LatentMovieCandidate,
  RealityGraph,
} from "@qre/contracts";
import { buildAuthorMetamorphicRelationSet } from "./src/services/authorMetamorphicRelationSet.js";
import { deriveLatentStoryThesis } from "./src/services/authorLatentStoryThesis.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`AUTHOR METAMORPHIC UNIVERSAL ACCEPTANCE FAILED: ${message}`);
  }
}

type Fixture = {
  domain: string;
  candidate: LatentMovieCandidate;
  graph: RealityGraph;
};

function fixture(
  domain: string,
  firstLabel: string,
  secondLabel: string,
  entity: string,
  firstStructure: RealityGraph["eventStructure"][number],
  secondStructure: RealityGraph["eventStructure"][number],
  relationKind: RealityGraph["relations"][number]["kind"],
): Fixture {
  const firstEvidenceId = `${domain}-e1`;
  const secondEvidenceId = `${domain}-e2`;
  const firstEventId = `${domain}-first`;
  const secondEventId = `${domain}-second`;

  const graph: RealityGraph = {
    evidence: [
      { id: firstEvidenceId, text: firstLabel, kind: "fact" },
      { id: secondEvidenceId, text: secondLabel, kind: "fact" },
    ],
    events: [
      {
        id: firstEventId,
        label: firstLabel,
        entities: [entity],
        sourceIds: [firstEvidenceId],
        salient: true,
        provenance: "explicit",
      },
      {
        id: secondEventId,
        label: secondLabel,
        entities: [entity],
        sourceIds: [secondEvidenceId],
        salient: true,
        provenance: "explicit",
      },
    ],
    relations: [
      {
        from: firstEventId,
        to: secondEventId,
        kind: relationKind,
        strength: 0.9,
      },
    ],
    eventStructure: [firstStructure, secondStructure],
    entityContinuity: [
      {
        name: entity,
        mentionCount: 2,
        eventIds: [firstEventId, secondEventId],
        firstEventId,
        lastEventId: secondEventId,
        kind: "unknown",
        salienceScore: 0.9,
      },
    ],
    unresolvedTensions: [],
    recurringSignals: [],
    sensorySignals: [],
    patterns: [],
  };

  const candidate = {
    id: `${domain}-candidate`,
    lens: "NONE",
    anchorEventIds: [firstEventId, secondEventId],
    supportingRelationKinds: [relationKind],
    trajectory: [
      {
        order: 1,
        operation: "establish",
        eventIds: [firstEventId],
        viewerChange: "the supplied first state is established",
        nextQuestion: "What changes the reading?",
      },
      {
        order: 2,
        operation: "turn",
        eventIds: [secondEventId],
        viewerChange: "the supplied second state changes the reading",
        nextQuestion: "What does the change mean?",
      },
      {
        order: 3,
        operation: "payoff",
        eventIds: [secondEventId],
        viewerChange: "the supplied endpoint lands",
        nextQuestion: "",
      },
    ],
    payoff: secondLabel,
    unresolvedQuestion: "What does the change mean?",
    evidence: [firstLabel, secondLabel],
    hypothesis: [`${firstLabel} changes the reading of ${secondLabel}.`],
    truthRisk: 0,
    novelty: 0.8,
    specificity: 0.8,
    informationValue: 0.8,
    uncertainty: 0.2,
    attentionPotential: 0.9,
    consequencePotential: 0.8,
    callbackPotential: 0.6,
    compressionPotential: 0.8,
    repetitionRisk: 0,
    distinctiveness: 0.9,
    score: 0.8,
  } as LatentMovieCandidate;

  return { domain, candidate, graph };
}

const fixtures: Fixture[] = [
  fixture(
    "pet",
    "Coco arrived nervous",
    "Coco left excited",
    "Coco",
    {
      eventId: "pet-first",
      subjects: ["Coco"],
      actions: ["arrived"],
      objects: [],
      states: ["nervous"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["arrival"],
      recurrenceScore: 0,
      transitionScore: 0.7,
      anomalyScore: 0.2,
      salienceScore: 0.9,
    },
    {
      eventId: "pet-second",
      subjects: ["Coco"],
      actions: ["left"],
      objects: [],
      states: ["excited"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["departure"],
      recurrenceScore: 0,
      transitionScore: 0.9,
      anomalyScore: 0.3,
      salienceScore: 0.95,
    },
    "changes",
  ),
  fixture(
    "person",
    "Maria entered uncertain",
    "Maria left confident",
    "Maria",
    {
      eventId: "person-first",
      subjects: ["Maria"],
      actions: ["entered"],
      objects: [],
      states: ["uncertain"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["arrival"],
      recurrenceScore: 0,
      transitionScore: 0.75,
      anomalyScore: 0.15,
      salienceScore: 0.9,
    },
    {
      eventId: "person-second",
      subjects: ["Maria"],
      actions: ["left"],
      objects: [],
      states: ["confident"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["departure"],
      recurrenceScore: 0,
      transitionScore: 0.9,
      anomalyScore: 0.25,
      salienceScore: 0.95,
    },
    "changes",
  ),
  fixture(
    "relationship",
    "Alex avoided the conversation",
    "Alex and Sam talked openly",
    "Alex",
    {
      eventId: "relationship-first",
      subjects: ["Alex"],
      actions: ["avoided"],
      objects: ["conversation"],
      states: ["uneasy"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["relationship"],
      recurrenceScore: 0,
      transitionScore: 0.8,
      anomalyScore: 0.2,
      salienceScore: 0.9,
    },
    {
      eventId: "relationship-second",
      subjects: ["Alex", "Sam"],
      actions: ["talked"],
      objects: ["conversation"],
      states: ["comfortable"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["relationship"],
      recurrenceScore: 0,
      transitionScore: 0.9,
      anomalyScore: 0.35,
      salienceScore: 0.95,
    },
    "changes",
  ),
  fixture(
    "restaurant",
    "The restaurant was quiet",
    "The restaurant filled with guests",
    "restaurant",
    {
      eventId: "restaurant-first",
      subjects: ["restaurant"],
      actions: [],
      objects: ["dining room"],
      states: ["quiet"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["service", "place"],
      recurrenceScore: 0,
      transitionScore: 0.7,
      anomalyScore: 0.15,
      salienceScore: 0.88,
    },
    {
      eventId: "restaurant-second",
      subjects: ["restaurant"],
      actions: ["filled"],
      objects: ["dining room", "guests"],
      states: ["busy"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["service", "place"],
      recurrenceScore: 0,
      transitionScore: 0.92,
      anomalyScore: 0.3,
      salienceScore: 0.94,
    },
    "changes",
  ),
  fixture(
    "event",
    "The venue expected a calm opening",
    "The opening became chaotic",
    "venue",
    {
      eventId: "event-first",
      subjects: ["venue"],
      actions: ["expected"],
      objects: ["opening"],
      states: ["calm"],
      temporalMarkers: ["opening"],
      sensoryMarkers: [],
      semanticTags: ["expectation"],
      recurrenceScore: 0,
      transitionScore: 0.7,
      anomalyScore: 0.3,
      salienceScore: 0.9,
    },
    {
      eventId: "event-second",
      subjects: ["venue"],
      actions: ["became"],
      objects: ["opening"],
      states: ["chaotic"],
      temporalMarkers: ["opening"],
      sensoryMarkers: [],
      semanticTags: ["outcome", "expectation_break"],
      recurrenceScore: 0,
      transitionScore: 0.9,
      anomalyScore: 0.85,
      salienceScore: 0.95,
    },
    "changes",
  ),
  fixture(
    "place",
    "The room was empty",
    "The room was occupied",
    "room",
    {
      eventId: "place-first",
      subjects: ["room"],
      actions: [],
      objects: [],
      states: ["empty"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["place"],
      recurrenceScore: 0,
      transitionScore: 0.68,
      anomalyScore: 0.15,
      salienceScore: 0.88,
    },
    {
      eventId: "place-second",
      subjects: ["room"],
      actions: [],
      objects: ["people"],
      states: ["occupied"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["place", "status"],
      recurrenceScore: 0,
      transitionScore: 0.9,
      anomalyScore: 0.2,
      salienceScore: 0.94,
    },
    "changes",
  ),
  fixture(
    "travel",
    "The trip began uncertain",
    "The trip ended settled",
    "trip",
    {
      eventId: "travel-first",
      subjects: ["trip"],
      actions: ["began"],
      objects: [],
      states: ["uncertain"],
      temporalMarkers: ["begin"],
      sensoryMarkers: [],
      semanticTags: ["travel"],
      recurrenceScore: 0,
      transitionScore: 0.72,
      anomalyScore: 0.15,
      salienceScore: 0.9,
    },
    {
      eventId: "travel-second",
      subjects: ["trip"],
      actions: ["ended"],
      objects: [],
      states: ["settled"],
      temporalMarkers: ["end"],
      sensoryMarkers: [],
      semanticTags: ["travel", "resolution"],
      recurrenceScore: 0,
      transitionScore: 0.9,
      anomalyScore: 0.3,
      salienceScore: 0.95,
    },
    "changes",
  ),
  fixture(
    "product",
    "The package was unopened",
    "The package became a gift someone kept",
    "package",
    {
      eventId: "product-first",
      subjects: ["package"],
      actions: [],
      objects: ["package"],
      states: ["unopened"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["product"],
      recurrenceScore: 0,
      transitionScore: 0.7,
      anomalyScore: 0.2,
      salienceScore: 0.9,
    },
    {
      eventId: "product-second",
      subjects: ["package"],
      actions: ["kept"],
      objects: ["gift"],
      states: ["valued"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["product", "ownership"],
      recurrenceScore: 0,
      transitionScore: 0.88,
      anomalyScore: 0.4,
      salienceScore: 0.95,
    },
    "recontextualizes",
  ),
  fixture(
    "business",
    "The shop prepared for service",
    "The shop earned a return visit",
    "shop",
    {
      eventId: "business-first",
      subjects: ["shop"],
      actions: ["prepared"],
      objects: ["service"],
      states: ["ready"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["business", "service"],
      recurrenceScore: 0,
      transitionScore: 0.7,
      anomalyScore: 0.15,
      salienceScore: 0.9,
    },
    {
      eventId: "business-second",
      subjects: ["shop"],
      actions: ["earned"],
      objects: ["return visit"],
      states: ["trusted"],
      temporalMarkers: ["later"],
      sensoryMarkers: [],
      semanticTags: ["business", "recurrence"],
      recurrenceScore: 0.75,
      transitionScore: 0.84,
      anomalyScore: 0.25,
      salienceScore: 0.95,
    },
    "recontextualizes",
  ),
];

const results: Array<{
  domain: string;
  relationSet: AuthorMetamorphicRelationSet;
  thesis: ReturnType<typeof deriveLatentStoryThesis>;
}> = [];

for (const item of fixtures) {
  const relationSet = buildAuthorMetamorphicRelationSet(
    item.graph,
    item.candidate.anchorEventIds,
  );

  assert(
    relationSet.version === 1,
    `${item.domain}: relation set version invalid`,
  );

  assert(
    relationSet.evidenceClosed,
    `${item.domain}: relation set not evidence-closed`,
  );

  assert(
    relationSet.relationCount > 0,
    `${item.domain}: no metamorphic relation discovered`,
  );

  const thesis = deriveLatentStoryThesis(
    item.graph,
    item.candidate,
    relationSet,
  );

  assert(
    thesis.metamorphicRelationSet === relationSet,
    `${item.domain}: thesis replaced relation set`,
  );

  results.push({ domain: item.domain, relationSet, thesis });
}

const distinctRelationTypes = new Set(
  results.flatMap((item) => item.relationSet.relations.map((relation) => relation.type)),
);

assert(
  distinctRelationTypes.size >= 4,
  `universal suite discovered only ${distinctRelationTypes.size} distinct metamorphic relation types`,
);

console.log("AUTHOR METAMORPHIC UNIVERSAL ACCEPTANCE: PASS");
console.log(`DOMAINS_TESTED=${results.length}`);
console.log(`DISTINCT_RELATION_TYPES=${distinctRelationTypes.size}`);
for (const result of results) {
  console.log(
    `${result.domain.toUpperCase()}=PASS:${result.relationSet.relations
      .map((relation) => relation.type)
      .slice(0, 4)
      .join("|")}`,
  );
}
