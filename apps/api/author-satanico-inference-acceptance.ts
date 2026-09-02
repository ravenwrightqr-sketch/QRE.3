import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { deriveSatanicoObserverObjective, scoreSatanicoObserverInference } from "./src/services/authorSatanicoInference.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";

type Probe = {
  name: string;
  subject: string;
  facts: readonly string[];
  minInference: number;
  expectedMechanism?: string;
};

const probes: readonly Probe[] = [
  {
    name: "FIDO · PREFERENCE CONSTELLATION",
    subject: "Fido",
    facts: [
      "Fido entered",
      "Fido is a Pomeranian",
      "Fido loves walks",
      "Fido loves small dogs",
      "Fido loves Cheetos",
    ],
    minInference: 0.55,
  },
  {
    name: "HOUSE · INVARIANT / RECONTEXTUALIZATION",
    subject: "the house",
    facts: [
      "the house was empty",
      "the kitchen was painted green",
      "the old table stayed",
      "boxes filled the hallway",
      "the first dinner happened at the old table",
    ],
    minInference: 0.42,
  },
  {
    name: "BUSINESS · FIRST-DOLLAR / SUCCESS RELATIONSHIP",
    subject: "the shop",
    facts: [
      "the shop opened at 9:00 AM",
      "the first customer bought one sticker",
      "the owner kept the first dollar",
      "the sticker became the shop's best seller",
      "the shop still displays the first dollar",
    ],
    minInference: 0.42,
  },
  {
    name: "TRAVEL · LOW-INFERENCE CONTROL",
    subject: "the trip",
    facts: [
      "we missed the train",
      "we walked through the old market",
      "we found a tiny bakery",
      "we stayed for coffee",
      "we arrived at the hotel after dark",
    ],
    minInference: 0.2,
  },
];

function fail(message: string): never {
  throw new Error(`SATANICO INFERENCE ACCEPTANCE FAILED: ${message}`);
}

for (const probe of probes) {
  const graph = buildAuthorRealityGraph({
    prompt: `Discover the strongest hidden relationship in ${probe.name}.`,
    subject: probe.subject,
    place: "",
    facts: [...probe.facts],
    sourceMoments: [...probe.facts],
    memoryContext: [],
    trajectory: [],
  });

  const candidates = searchUniversalMovieCandidates({
    graph,
    subject: probe.subject,
    limit: 8,
  });
  const winner = candidates[0];
  if (!winner) fail(`${probe.name}: no movie candidate`);

  const potential = scoreSatanicoObserverInference(graph, winner);
  const objective = deriveSatanicoObserverObjective(graph, winner);

  console.log(`\n${probe.name}`);
  console.log(`winner=${winner.id}`);
  console.log(`observerInferencePotential=${potential}`);
  console.log(`winnerScore=${winner.score}`);
  console.log(`mechanism=${objective?.objective ?? "NONE"}`);

  if (potential < probe.minInference) {
    fail(`${probe.name}: inference potential ${potential} < ${probe.minInference}`);
  }

  if (winner.observerInferencePotential !== potential) {
    fail(`${probe.name}: candidate diagnostic mismatch`);
  }

  if (objective && objective.explanationForbidden !== true) {
    fail(`${probe.name}: explanation was not forbidden`);
  }

  const forbidden = /\b(?:playboy|has a type|meaning|lesson|moral|obviously)\b/i;
  if (winner.trajectory.some((step) => forbidden.test(step.viewerChange))) {
    fail(`${probe.name}: latent trajectory leaked the observer conclusion`);
  }
}

const fidoGraph = buildAuthorRealityGraph({
  prompt: "Fido dog tag: let the observer discover the character read.",
  subject: "Fido",
  place: "",
  facts: [
    "Fido entered",
    "Fido is a Pomeranian",
    "Fido loves walks",
    "Fido loves small dogs",
    "Fido loves Cheetos",
  ],
  sourceMoments: [
    "Fido entered",
    "Fido is a Pomeranian",
    "Fido loves walks",
    "Fido loves small dogs",
    "Fido loves Cheetos",
  ],
  memoryContext: [],
  trajectory: [],
});

const fidoCandidates = searchUniversalMovieCandidates({
  graph: fidoGraph,
  subject: "Fido",
  limit: 8,
});
const fidoWinner = fidoCandidates[0];
if (!fidoWinner) fail("FIDO GOLD: no winner");
if (!fidoWinner.observerInferencePotential || fidoWinner.observerInferencePotential < 0.55) {
  fail(`FIDO GOLD: expected strong observer inference, got ${fidoWinner.observerInferencePotential ?? 0}`);
}
if (fidoWinner.evidence.filter((value) => /love|loves/i.test(value)).length < 3) {
  fail("FIDO GOLD: preference constellation evidence was not preserved");
}

console.log("\n============================================================");
console.log("SATANICO OBSERVER-INFERENCE ACCEPTANCE · PASS");
console.log("GROUNDING + LATENT RELATIONSHIP + INFERENCE SPACE + NO EXPLICIT CONCLUSION");
console.log("============================================================");
