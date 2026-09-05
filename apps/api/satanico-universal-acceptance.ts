import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";
import { discoverSatanicoInference } from "./src/services/authorSatanicoInference.js";
import type { RealityGraph } from "@qre/contracts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`SATANICO UNIVERSAL ACCEPTANCE FAILED: ${message}`);
}

function makeGraph(events: RealityGraph["events"], extras: Partial<RealityGraph> = {}): RealityGraph {
  return { evidence: [], events, relations: [], unresolvedTensions: [], recurringSignals: [], sensorySignals: [], ...extras };
}

const fido = makeGraph(
  [
    { id: "f1", label: "Fido is a Pomeranian", sourceIds: ["f1"], entities: ["Fido", "Pomeranian"], salient: true, provenance: "explicit" },
    { id: "f2", label: "Fido loves walks", sourceIds: ["f2"], entities: ["Fido"], salient: true, provenance: "explicit" },
    { id: "f3", label: "Fido loves small dogs", sourceIds: ["f3"], entities: ["Fido"], salient: true, provenance: "explicit" },
    { id: "f4", label: "Fido loves Cheetos", sourceIds: ["f4"], entities: ["Fido"], salient: true, provenance: "explicit" },
  ],
  {
    eventStructure: [
      { eventId: "f1", subjects: ["Fido"], actions: [], objects: ["Pomeranian"], states: [], temporalMarkers: [], sensoryMarkers: [], semanticTags: [], recurrenceScore: 0, transitionScore: 0, anomalyScore: 0, salienceScore: 0.8 },
      { eventId: "f2", subjects: ["Fido"], actions: ["loves"], objects: ["walks"], states: [], temporalMarkers: [], sensoryMarkers: [], semanticTags: [], recurrenceScore: 0, transitionScore: 0, anomalyScore: 0, salienceScore: 0.8 },
      { eventId: "f3", subjects: ["Fido"], actions: ["loves"], objects: ["small dogs"], states: [], temporalMarkers: [], sensoryMarkers: [], semanticTags: [], recurrenceScore: 0, transitionScore: 0, anomalyScore: 0, salienceScore: 0.8 },
      { eventId: "f4", subjects: ["Fido"], actions: ["loves"], objects: ["Cheetos"], states: [], temporalMarkers: [], sensoryMarkers: [], semanticTags: [], recurrenceScore: 0, transitionScore: 0, anomalyScore: 0, salienceScore: 0.8 },
    ],
  },
);

const house = makeGraph(
  [
    { id: "h1", label: "empty house", sourceIds: ["h1"], entities: ["house"], salient: true, provenance: "explicit" },
    { id: "h2", label: "green kitchen", sourceIds: ["h2"], entities: ["kitchen"], salient: true, provenance: "explicit" },
    { id: "h3", label: "boxes everywhere", sourceIds: ["h3"], entities: ["boxes"], salient: true, provenance: "explicit" },
    { id: "h4", label: "old table stayed", sourceIds: ["h4"], entities: ["old table"], salient: true, provenance: "explicit" },
    { id: "h5", label: "first dinner at old table", sourceIds: ["h5"], entities: ["old table"], salient: true, provenance: "explicit" },
  ],
  {
    entityContinuity: [{ name: "old table", mentionCount: 2, eventIds: ["h4", "h5"], firstEventId: "h4", lastEventId: "h5", kind: "object", salienceScore: 0.92 }],
  },
);

const relationship = makeGraph(
  [
    { id: "r1", label: "restaurant was closing", sourceIds: ["r1"], entities: ["restaurant"], salient: true, provenance: "explicit" },
    { id: "r2", label: "everyone left", sourceIds: ["r2"], entities: ["everyone"], salient: true, provenance: "explicit" },
    { id: "r3", label: "they kept talking", sourceIds: ["r3"], entities: ["they"], salient: true, provenance: "explicit" },
  ],
  { relations: [{ from: "r2", to: "r3", kind: "contrasts", strength: 0.93 }] },
);

const travel = makeGraph([
  { id: "t1", label: "flight landed", sourceIds: ["t1"], entities: ["flight"], salient: true, provenance: "explicit" },
  { id: "t2", label: "walked to hotel", sourceIds: ["t2"], entities: ["hotel"], salient: true, provenance: "explicit" },
  { id: "t3", label: "had breakfast", sourceIds: ["t3"], entities: ["breakfast"], salient: true, provenance: "explicit" },
]);

for (const [name, reality, subject, minimumInference] of [
  ["FIDO", fido, "Fido", 0.55],
  ["HOUSE", house, "", 0.35],
  ["RELATIONSHIP", relationship, "", 0.35],
  ["TRAVEL", travel, "", 0],
] as const) {
  const inference = discoverSatanicoInference(reality, subject || undefined);
  const movies = searchUniversalMovieCandidates({ graph: reality, subject: subject || undefined, limit: 6 });
  const selected = movies[0];

  console.log(`\n=== ${name} ===`);
  console.log(`INFERENCE POTENTIAL: ${inference.observerInferencePotential}`);
  console.log(`RELATIONS: ${inference.relations.relationCount}`);
  console.log(`SELECTED MOVIE: ${selected?.id ?? "none"}`);
  selected?.hypothesis.forEach((line, index) => console.log(`[${index + 1}] ${line}`));

  assert(inference.relations.evidenceClosed, "Satanico relation escaped supplied RealityGraph");
  assert(inference.observerInferencePotential >= minimumInference, `inference potential too low: ${inference.observerInferencePotential}`);
  assert(name === "TRAVEL" || selected?.id !== "movie-source", "grounded latent relationship did not beat source fallback");
  assert(!(selected?.hypothesis.join(" ").toLowerCase().includes("playboy")), "latent conclusion leaked into the movie contract");
  assert(selected?.trajectory.every((step) => step.eventIds.every((id) => reality.events.some((event) => event.id === id))), "trajectory contains invented event id");
  console.log("STATUS: PASS");
}

assert(
  discoverSatanicoInference(fido, "Fido").relations.relations.some((relation) => relation.type === "relation_preference_constellation"),
  "Fido preference constellation was not discovered",
);

console.log("\nSATANICO UNIVERSAL ACCEPTANCE PASS");
