import fs from "node:fs";

const files = {
  planner: "apps/api/src/services/authorSequencePlanner.ts",
  brain: "apps/api/src/services/authorBrainUniversal.ts",
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, text) {
  fs.writeFileSync(path, text, "utf8");
}

function once(text, search, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!text.includes(search)) {
    throw new Error(`PATCH FAILED: ${label}`);
  }
  return text.replace(search, replacement);
}

let planner = read(files.planner);

planner = once(
  planner,
  'graph.events.at(-1)?.id',
  'graph.events[graph.events.length - 1]?.id',
  'planner endpoint array access',
);

planner = once(
  planner,
  'ids.at(-2) ?? ""',
  'ids[ids.length - 2] ?? ""',
  'planner payoff array access',
);

const oldOpening = `function openingCandidates(graph: RealityGraph, envelope: RealityEnvelope): string[] {\n  const preferred = envelope.openingEventIds.filter((id) => eventById(graph, id));\n  const ranked = graph.events\n    .map((event, index) => ({\n      id: event.id,\n      score:\n        (preferred.includes(event.id) ? 0.5 : 0) +\n        stateScore(event.label) * 0.28 +\n        actionScore(event.label) * 0.15 +\n        objectScore(event.label) * 0.07 -\n        index * 0.001,\n    }))\n    .sort((a, b) => b.score - a.score)\n    .map((item) => item.id);\n\n  return uniq([...preferred, ...ranked], 5);\n}`;

const newOpening = `function openingCandidates(graph: RealityGraph, envelope: RealityEnvelope): string[] {\n  const endpoint = endpointId(graph, envelope);\n  const preferred = envelope.openingEventIds\n    .filter((id) => eventById(graph, id) && id !== endpoint);\n\n  const ranked = graph.events\n    .filter((event) => event.id !== endpoint)\n    .map((event, index) => ({\n      id: event.id,\n      score:\n        (preferred.includes(event.id) ? 0.5 : 0) +\n        stateScore(event.label) * 0.28 +\n        actionScore(event.label) * 0.15 +\n        objectScore(event.label) * 0.07 -\n        index * 0.001,\n    }))\n    .sort((a, b) => b.score - a.score)\n    .map((item) => item.id);\n\n  return uniq([...preferred, ...ranked], 5);\n}`;

planner = once(planner, oldOpening, newOpening, "planner endpoint cannot be opening");
write(files.planner, planner);

let brain = read(files.brain);

brain = once(
  brain,
  `import {\n  recoverBeatPlanFromLatentMovie,\n} from "./authorBeatPlanRecovery.js";`,
  `import {\n  buildGroundedAuthorSequence,\n} from "./authorSequencePlanner.js";`,
  "brain canonical planner import",
);

const oldFallback = `function buildFallbackBeatPlan(\n  cognition: ReturnType<\n    typeof buildAuthorCognitivePlan\n  >,\n  realityGraph: ReturnType<\n    typeof buildAuthorRealityGraph\n  >,\n): BeatPlan | undefined {\n  const selected =\n    cognition.latentMovieCandidates?.[0];\n\n  if (!selected) {\n    return undefined;\n  }\n\n  const recovered =\n    recoverBeatPlanFromLatentMovie(\n      selected,\n      realityGraph,\n    );\n\n  return normalizeBeatPlan(\n    recovered,\n  );\n}`;

const newFallback = `function buildCanonicalGroundedBeatPlan(\n  input: AuthorBrainTruth,\n  realityGraph: ReturnType<typeof buildAuthorRealityGraph>,\n  realityEnvelope: ReturnType<typeof buildAuthorRealityEnvelope>,\n): BeatPlan | undefined {\n  const grounded = buildGroundedAuthorSequence({\n    graph: realityGraph,\n    envelope: realityEnvelope,\n    subject: clean(input.subject),\n    lens: clean(input.lens),\n    presenceSummary: input.presenceSummary,\n  });\n\n  if (!grounded) {\n    return undefined;\n  }\n\n  return normalizeBeatPlan({\n    premise: grounded.premise,\n    baselineFacts: grounded.baselineFacts,\n    attentionArc: grounded.attentionArc,\n    beats: grounded.beats,\n    closing: grounded.closing,\n  });\n}`;

brain = once(
  brain,
  oldFallback,
  newFallback,
  "brain replace latent recovery with canonical grounded planner",
);

brain = once(
  brain,
  `buildFallbackBeatPlan(\n      cognition,\n      realityGraph,\n    );`,
  `buildCanonicalGroundedBeatPlan(\n      { ...input, realityGraph },\n      realityGraph,\n      realityEnvelope,\n    );`,
  "brain use canonical grounded plan",
);

write(files.brain, brain);

console.log("CANONICAL MOVIE DISCOVERY V2 COMPLETE");
console.log("- endpoint cannot be selected as opening");
console.log("- planner uses ES-compatible array access");
console.log("- Universal Author now consumes grounded movie discovery directly");
console.log("- latent BeatPlan recovery is no longer authoritative");
