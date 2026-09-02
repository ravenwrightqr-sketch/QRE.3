import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { scoreSatanicoObserverInference } from "./src/services/authorSatanicoInference.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";

function fail(message: string): never {
  throw new Error(`SATANICO INFERENCE-SPACE ACCEPTANCE FAILED: ${message}`);
}

const probes = [
  {
    name: "FIDO PREFERENCE",
    subject: "Fido",
    facts: [
      "Fido entered",
      "Fido is a Pomeranian",
      "Fido loves walks",
      "Fido loves small dogs",
      "Fido loves Cheetos",
    ],
    requiredPreferenceCount: 3,
  },
  {
    name: "HOUSE PERSISTENCE",
    subject: "the house",
    facts: [
      "the house was empty",
      "everything changed during the move",
      "the old table remained",
      "boxes filled the hallway",
      "the first dinner happened at the old table",
    ],
    requiredPreferenceCount: 0,
  },
  {
    name: "BUSINESS ORIGIN",
    subject: "the shop",
    facts: [
      "the shop opened at 9:00 AM",
      "the first customer bought one sticker",
      "the owner kept the first dollar",
      "the sticker became the shop's best seller",
      "the shop still displays the first dollar",
    ],
    requiredPreferenceCount: 0,
  },
] as const;

for (const probe of probes) {
  const graph = buildAuthorRealityGraph({
    prompt: `Find the strongest observer inference opportunity in ${probe.name}.`,
    subject: probe.subject,
    place: "",
    facts: [...probe.facts],
    sourceMoments: [...probe.facts],
    memoryContext: [],
    trajectory: [],
  });

  const candidates = searchUniversalMovieCandidates({ graph, subject: probe.subject, limit: 8 });
  const winner = candidates[0];
  if (!winner) fail(`${probe.name}: no winner`);

  const potential = scoreSatanicoObserverInference(graph, winner);
  const satanicoCandidates = candidates.filter((candidate) => candidate.id.startsWith("movie-satanico-"));
  const strongestSatanico = satanicoCandidates[0];
  const preferenceCount = winner.evidence.filter((value) => /\bloves?\b/i.test(value)).length;
  const leak = winner.trajectory.some((step) => /\b(?:playboy|has a type|obviously|lesson|moral|therefore)\b/i.test(step.viewerChange));

  console.log(`\n${probe.name}`);
  console.log(`winner=${winner.id}`);
  console.log(`score=${winner.score}`);
  console.log(`observerInferencePotential=${potential}`);
  console.log(`satanicoCandidateCount=${satanicoCandidates.length}`);
  console.log(`strongestSatanico=${strongestSatanico?.id ?? "none"}`);
  console.log(`strongestSatanicoInferencePotential=${strongestSatanico?.observerInferencePotential ?? 0}`);
  console.log(`evidence=${winner.evidence.join(" → ")}`);

  if (potential <= 0.5) fail(`${probe.name}: winner inference potential too weak (${potential})`);
  if (!satanicoCandidates.length) fail(`${probe.name}: Satanico produced no evidence candidate`);
  if ((strongestSatanico?.observerInferencePotential ?? 0) <= 0.5) {
    fail(`${probe.name}: Satanico evidence candidate has weak inference potential`);
  }
  if (leak) fail(`${probe.name}: observer conclusion leaked into latent trajectory`);

  if (probe.requiredPreferenceCount > 0 && preferenceCount < probe.requiredPreferenceCount) {
    fail(`${probe.name}: winning movie did not preserve the preference constellation`);
  }
}

console.log("\n============================================================");
console.log("SATANICO INFERENCE-SPACE ACCEPTANCE · PASS");
console.log("PREFERENCE + PERSISTENCE + ORIGIN + BEHAVIORAL OBSERVER INFERENCE");
console.log("============================================================");
