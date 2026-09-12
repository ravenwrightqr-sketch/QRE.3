import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const api = resolve(root, "apps/api/src/services");
const contracts = resolve(root, "packages/contracts/src");

const required = [
  "authorRealityGraph.ts",
  "authorMetamorphicSearch.ts",
  "authorCognition.ts",
  "authorTreatment.ts",
  "authorArtist.ts",
  "authorMouth.ts",
  "authorJudge.ts",
  "authorBrainCanonical.ts",
  "experienceMemory.ts",
  "experienceState.ts",
  "experienceTempo.ts",
  "experienceBehavior.ts",
  "memoryProjection.ts",
  "creativeLearning.ts",
];

const obsolete = [
  "authorCognitionUniversal.ts",
  "authorCognitionIntelligence.ts",
  "authorArtistChoice.ts",
  "authorCreativeRealizer.ts",
  "authorCreativeSpine.ts",
  "authorCreativeLens.ts",
  "authorRealizedFilmJudge.ts",
  "authorExperienceJudge.ts",
  "authorSatanicoRelationSearch.ts",
  "authorAdaptiveTempo.ts",
  "authorBehaviorProfile.ts",
  "authorExperienceMemory.ts",
  "authorExperienceState.ts",
];

const acceptanceFiles = [
  "author-acceptance.ts",
  "author-anti-collapse-acceptance.ts",
  "author-artist-realizer-handoff-acceptance.ts",
  "author-authority-alignment-acceptance.ts",
  "author-business-context-acceptance.ts",
  "author-cognition-intelligence-acceptance.ts",
  "author-composition-metadata-acceptance.ts",
  "author-creative-spine-acceptance.ts",
  "author-lens-acceptance.ts",
  "author-lens-maria-acceptance.ts",
  "author-memory-acceptance.ts",
  "author-readout-acceptance.ts",
  "author-realized-film-acceptance.ts",
  "author-semantic-gate-acceptance.ts",
  "author-superintelligence-lab.ts",
  "author-system-discovery-acceptance.ts",
  "author-universal-cognition-acceptance.ts",
  "author-universal-film-acceptance.ts",
  "author-war-readiness-acceptance.ts",
];

for (const file of required) {
  if (!existsSync(resolve(api, file))) throw new Error(`Missing canonical Author file: ${file}`);
}

for (const file of obsolete) {
  if (existsSync(resolve(api, file))) throw new Error(`Obsolete Author path remains: ${file}`);
}

const contractsToCheck = [
  resolve(contracts, "author/authorBrain.ts"),
  resolve(contracts, "author/treatment.ts"),
  resolve(contracts, "cognition/metamorphic.ts"),
  resolve(contracts, "sequence/sequenceCandidate.ts"),
  resolve(contracts, "sequence/sequencePlay.ts"),
  resolve(contracts, "sequence/viewerMomentum.ts"),
  resolve(contracts, "reality/realityGraph.ts"),
];

const banned = /\b(movie|film|cinematic|screenplay|shot\s+list|soundtrack|camera)\b/i;
for (const file of contractsToCheck) {
  const text = readFileSync(file, "utf8");
  if (banned.test(text)) throw new Error(`Forbidden presentation terminology remains in ${file}`);
}

const canonical = readFileSync(resolve(api, "authorBrainCanonical.ts"), "utf8");
if (/authorCognitionUniversal|authorCognitionIntelligence|authorArtistChoice|authorCreativeRealizer|authorCreativeSpine|authorCreativeLens|authorRealizedFilmJudge|authorExperienceJudge|authorSatanicoRelationSearch/.test(canonical)) {
  throw new Error("Canonical Author depends on an obsolete authority path");
}

for (const file of acceptanceFiles) {
  if (existsSync(resolve(root, "apps/api", file))) throw new Error(`Legacy Author acceptance remains: ${file}`);
}

console.log("AUTHOR FINAL ARCHITECTURE: PASS");
console.log("Reality -> Metamorphic -> Cognition -> Treatment -> Artist -> Mouth -> Judge -> SequencePlay -> Memory");
