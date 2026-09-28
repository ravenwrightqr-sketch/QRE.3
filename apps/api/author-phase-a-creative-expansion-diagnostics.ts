import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { discoverAuthorCreativeDirection } from "./src/services/authorCreativeDiscovery.js";

type DiagnosticCase = {
  name: string;
  subject: string;
  facts: string[];
  domainContext?: Record<string, unknown>;
};

const cases: DiagnosticCase[] = [
  {
    name: "RELATIONSHIP",
    subject: "Alex",
    facts: [
      "felt nervous before meeting Alex",
      "talked for two hours",
      "felt lighter afterward",
      "met Alex again the next week",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "RELATIONSHIP MEMORY",
      subjectType: "PERSON",
    },
  },
  {
    name: "COCO_SERVICE",
    subject: "Coco",
    facts: [
      "Coco was nervous",
      "Coco got a bath",
      "a bow was added",
      "Coco tried to remove the bow",
      "Coco left happy",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "PET GROOMING",
      subjectType: "DOG",
      serviceType: "PET GROOMING",
    },
  },
  {
    name: "TINY_IDENTITY",
    subject: "Milo",
    facts: [
      "Milo loves walks",
      "Milo loves bacon",
      "Milo loves small dogs",
    ],
    domainContext: {
      experienceMode: "IDENTITY",
      category: "DOG TAG",
      subjectType: "DOG",
      outputType: "LIVING DOG TAG",
    },
  },
  {
    name: "BORING_SERVICE",
    subject: "housekeeping service",
    facts: [
      "arrived",
      "cleaned kitchen",
      "cleaned two bathrooms",
      "left",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "HOUSEKEEPING",
    },
  },
];

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

for (const test of cases) {
  const graph = buildAuthorRealityGraph({
    prompt: "Diagnose Phase A Creative Discovery only.",
    subject: test.subject,
    facts: test.facts,
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
  });

  const events = graph.events
    .map((event) => ({
      id: event.id,
      text: clean(event.label),
    }))
    .filter((event) => event.text);

  const discovery = await discoverAuthorCreativeDirection({
    events,
    relations: graph.relations.map((relation) => ({
      from: relation.from,
      to: relation.to,
      kind: relation.kind,
      strength: relation.strength,
    })),
    requestedLens: "NONE",
    memory: [],
    domainContext: test.domainContext,
  });

  console.log(`\n=== PHASE A DIAGNOSTIC: ${test.name} ===`);
  console.log("MODEL:", discovery.model);
  console.log("MODEL CALLS:", discovery.modelCalls);

  console.log("\nSUPPLIED MATERIAL EVENTS:");
  for (const event of events) {
    console.log(`- ${event.id}: ${event.text}`);
  }

  console.log("\nSELECTED:");
  console.log(JSON.stringify(discovery.discovery.selected, null, 2));

  console.log("\nCANDIDATES:");
  console.log(JSON.stringify(
    discovery.discovery.candidates.map((candidate) => ({
      id: candidate.id,
      mode: candidate.mode,
      perception: candidate.perception,
      relationship: candidate.relationship,
      evidenceEventIds: candidate.evidenceEventIds,
    })),
    null,
    2,
  ));

  console.log("\nHANDOFF:");
  console.log(JSON.stringify({
    playableEventIds: discovery.discovery.playableEventIds,
    backgroundEventIds: discovery.discovery.backgroundEventIds,
    experienceShape: discovery.discovery.experienceShape,
    selectionReason: discovery.discovery.selectionReason,
    risk: discovery.discovery.risk,
  }, null, 2));
}

console.log("\nPHASE A CREATIVE EXPANSION DIAGNOSTICS: COMPLETE");
