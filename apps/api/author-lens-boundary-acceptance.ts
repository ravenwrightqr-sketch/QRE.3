import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";
import {
  hasMaterialMovieDifference,
  selectDistinctMovieCandidates,
} from "./src/services/authorMovieDifferentiation.js";

const graph: RealityGraph = {
  evidence: [],
  events: [
    { id: "event-1", label: "Milo arrived nervous", sourceIds: [], entities: ["Milo"], salient: true, provenance: "explicit" },
    { id: "event-2", label: "Milo met the small dogs", sourceIds: [], entities: ["Milo", "small dogs"], salient: true, provenance: "explicit" },
    { id: "event-3", label: "The small dogs stayed close", sourceIds: [], entities: ["small dogs"], salient: true, provenance: "explicit" },
    { id: "event-4", label: "Milo left calm", sourceIds: [], entities: ["Milo"], salient: true, provenance: "explicit" },
    { id: "event-5", label: "The same small dogs returned", sourceIds: [], entities: ["small dogs"], salient: true, provenance: "explicit" },
  ],
  relations: [
    { from: "event-2", to: "event-3", kind: "involves", strength: 0.95 },
    { from: "event-3", to: "event-5", kind: "repeats", strength: 0.94 },
    { from: "event-1", to: "event-4", kind: "changes", strength: 0.91 },
    { from: "event-2", to: "event-4", kind: "recontextualizes", strength: 0.86 },
  ],
  eventStructure: [],
  entityContinuity: [],
  patterns: [],
  unresolvedTensions: [],
  recurringSignals: [],
  sensorySignals: [],
};

const materialSignature = (candidate: LatentMovieCandidate): string =>
  JSON.stringify({
    id: candidate.id,
    anchorEventIds: candidate.anchorEventIds,
    supportingRelationKinds: candidate.supportingRelationKinds,
    trajectory: candidate.trajectory,
    payoff: candidate.payoff,
    evidence: candidate.evidence,
    unresolvedQuestion: candidate.unresolvedQuestion,
    truthRisk: candidate.truthRisk,
    novelty: candidate.novelty,
    specificity: candidate.specificity,
    informationValue: candidate.informationValue,
    uncertainty: candidate.uncertainty,
    attentionPotential: candidate.attentionPotential,
    consequencePotential: candidate.consequencePotential,
    callbackPotential: candidate.callbackPotential,
    compressionPotential: candidate.compressionPotential,
    repetitionRisk: candidate.repetitionRisk,
    score: candidate.score,
  });

const assert = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(`FAIL: ${message}`);
};

const discovered = searchUniversalMovieCandidates({
  graph,
  subject: "Milo",
  limit: 10,
});

assert(discovered.length > 0, "universal discovery produced no candidates");
assert(
  discovered.every((candidate) => candidate.lens === "NONE"),
  "universal discovery must emit lens-neutral candidates",
);

const horror = selectDistinctMovieCandidates(discovered, 6, "horror");
const comedy = selectDistinctMovieCandidates(discovered, 6, "comedy");

assert(horror.length > 0 && comedy.length > 0, "late lens selection removed all candidates");

const discoveredByMaterial = new Set(discovered.map(materialSignature));
for (const candidate of [...horror, ...comedy]) {
  assert(
    discoveredByMaterial.has(materialSignature({ ...candidate, lens: "NONE" })),
    "late lens selection changed discovered evidence or trajectory",
  );
}

const firstHorror = horror[0]!;
const firstComedy = comedy[0]!;
assert(firstHorror.lens === "horror", "selected horror candidate did not carry late lens metadata");
assert(firstComedy.lens === "comedy", "selected comedy candidate did not carry late lens metadata");

const cosmeticA: LatentMovieCandidate = { ...firstHorror, lens: "horror" };
const cosmeticB: LatentMovieCandidate = { ...firstHorror, lens: "comedy" };
assert(
  !hasMaterialMovieDifference(cosmeticA, cosmeticB),
  "lens labels alone must never create material movie diversity",
);

console.log(`PASS: lens boundary · discovered=${discovered.length} horror=${horror.length} comedy=${comedy.length}`);
console.log("PASS: universal discovery is lens-blind; lens influence is post-discovery only");
