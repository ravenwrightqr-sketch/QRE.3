#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];

const files = {
  brain: "apps/api/src/services/authorBrainCanonical.ts",
  discovery: "apps/api/src/services/authorCreativeDiscovery.ts",
  creative: "apps/api/src/services/authorCreative.ts",
  grounding: "apps/api/src/services/authorCreativeGroundingVerifier.ts",
  coreAcceptance: "apps/api/author-universal-core-acceptance.ts",
};

const read = (path) => readFileSync(join(root, path), "utf8");
const exists = (path) => existsSync(join(root, path));
const fail = (message) => failures.push(message);

for (const path of Object.values(files)) {
  if (!exists(path)) fail(`missing required Author file: ${path}`);
}

function indexOf(body, marker, label = marker) {
  const index = body.indexOf(marker);
  if (index < 0) fail(`missing marker: ${label}`);
  return index;
}

function assertContains(body, pattern, message) {
  if (typeof pattern === "string") {
    if (!body.includes(pattern)) fail(message);
    return;
  }
  if (!pattern.test(body)) fail(message);
}

function assertNotContains(body, pattern, message) {
  if (typeof pattern === "string") {
    if (body.includes(pattern)) fail(message);
    return;
  }
  if (pattern.test(body)) fail(message);
}

if (!failures.length) {
  const brain = read(files.brain);
  const discovery = read(files.discovery);
  const creative = read(files.creative);
  const grounding = read(files.grounding);
  const coreAcceptance = read(files.coreAcceptance);

  const structurePrompt = indexOf(creative, "You are QRE Author Structure Planner.");
  const structureDecision = indexOf(creative, 'debug("BARE-AUTHOR-PLAN"', "BARE-AUTHOR-PLAN debug");
  const lensCall = indexOf(
    creative,
    "const lensSearch = directCreativeAuthorExperiment",
    "Lens call after structure",
  );
  const mouthPrompt = indexOf(creative, "You are QRE Mouth.");
  const winnerSelection = creative.indexOf("selectedMemoryProduction = selection.evaluation.selectedProduction", mouthPrompt);
  if (winnerSelection < 0) fail("missing marker: whole-production winner selection after Mouth");

  if (!(structurePrompt < structureDecision && structureDecision < lensCall && lensCall < mouthPrompt)) {
    fail("stage order must be Structure -> finalized plan debug -> Lens -> Mouth");
  }
  if (!(mouthPrompt < winnerSelection)) {
    fail("winner selection must happen after Mouth whole-production realization");
  }

  const structureSlice = creative.slice(structurePrompt, lensCall);
  assertNotContains(
    structureSlice,
    "CREATIVE_TREATMENTS",
    "Structure must be treatment-neutral and must not see CREATIVE_TREATMENTS",
  );
  assertNotContains(
    structureSlice,
    "perceptualTreatmentId",
    "Structure must not choose perceptualTreatmentId",
  );
  assertNotContains(
    structureSlice,
    "perceptionDelta",
    "Structure must not see Lens perceptionDelta",
  );
  assertNotContains(
    structureSlice,
    "expressiveBehaviors",
    "Structure must not see Lens expressiveBehaviors",
  );
  assertNotContains(
    structureSlice,
    "creativePressure",
    "Structure must not see Lens creativePressure",
  );

  assertNotContains(
    creative,
    "selectedTreatmentForMouth",
    "Mouth must not receive one preselected treatment",
  );
  assertNotContains(
    creative,
    "perceptualTreatmentId",
    "Author must not restore early perceptualTreatmentId commitment",
  );

  assertContains(
    creative,
    "Return exactly three independent notices.",
    "Lens must create exactly three competing expressive conceptions",
  );
  assertContains(
    creative,
    "const deterministicBareTreatment",
    "Lens path must append deterministic Bare D truth control",
  );
  assertContains(
    creative,
    /const treatmentAssignmentsForMouth:[\s\S]*treatmentsForMouth\.map/s,
    "Mouth must receive all accepted treatments, not a single selected treatment",
  );
  assertContains(
    creative,
    "CREATIVE_TREATMENTS assigns production identities.",
    "Mouth prompt must bind treatments to production identities",
  );
  assertContains(
    creative,
    "Return candidate productions in PRODUCTION-MAJOR form for the listed CREATIVE_TREATMENTS only.",
    "Mouth must realize complete candidate productions for listed treatments",
  );
  assertContains(
    creative,
    'production: { type: "string", enum: lensSearchEnabled ? ["A", "B", "C"] : ["A", "B", "C", "D"] }',
    "Expressive Mouth schema must request A/B/C while retaining D in the non-Lens contract",
  );
  assertContains(creative, "const bareProduction = scoreMemorySequence(",
    "Runtime must independently preserve the deterministic D control");
  assertContains(
    creative,
    'const variantIndex = ["A", "B", "C", "D"].indexOf(production);',
    "Mouth parser must map returned production letters mechanically",
  );
  assertContains(
    creative,
    "variants[3] = safeFallbackText",
    "Bare D must be rebuilt deterministically from supplied evidence",
  );
  assertContains(
    creative,
    "scoreMemorySequence",
    "Whole productions must be locally scored before final selection",
  );
  assertContains(
    creative,
    "assignedTreatment: treatmentByVariantIndex.get(repairTarget.variantIndex)",
    "Repair must preserve the assigned treatment identity",
  );
  assertContains(
    creative,
    "acceptedExpressiveProductions",
    "Selection must build an accepted expressive production set",
  );
  assertContains(
    creative,
    "Bare Reality D preserves supplied facts as the control. Use D as the fallback when the accepted expressive set is empty.",
    "Bare D must remain fallback only",
  );
  assertContains(
    creative,
    /const winner =\s*nominatedNearTop \?\?\s*topScoringExpressiveProduction \?\?\s*nominatedExpressiveProduction \?\?\s*bareFallbackProduction/s,
    "Final commitment must prefer complete expressive productions before Bare D",
  );

  assertContains(
    discovery,
    "selectedCandidateId",
    "Creative Discovery must expose selectedCandidateId",
  );
  assertContains(
    discovery,
    "evidenceEventIds",
    "Creative Discovery must carry evidenceEventIds",
  );
  assertContains(
    discovery,
    "playableEventIds",
    "Creative Discovery must carry playableEventIds into Structure",
  );
  assertContains(
    discovery,
    "backgroundEventIds",
    "Creative Discovery must preserve selected background evidence",
  );
  assertContains(
    discovery,
    "A downstream Creative Lens stage owns",
    "Discovery must hand creative treatment ownership downstream to Lens",
  );

  for (const specifier of [
    "authorRealityExtractor.js",
    "authorRealityGraph.js",
    "authorCreativeDiscovery.js",
    "authorCreative.js",
    "authorCreativeGroundingVerifier.js",
  ]) {
    assertContains(brain, specifier, `Canonical brain must include ${specifier}`);
  }
  assertNotContains(
    brain,
    /localModelGenerate\s*\(/,
    "Canonical brain must orchestrate stages, not call model directly",
  );
  assertContains(
    brain,
    "verifyAuthorCreativeGrounding",
    "Canonical brain must run final grounding verification",
  );
  assertContains(
    grounding,
    "Atomic Semantic Grounding",
    "Grounding verifier must remain the atomic semantic truth boundary",
  );
  assertContains(
    grounding,
    "unsupportedClaims",
    "Grounding verifier must report unsupported claims",
  );

  assertContains(coreAcceptance, 'name: "COCO"', "Core acceptance must include Coco");
  assertContains(coreAcceptance, "Coco was nervous", "Coco acceptance must preserve nervous starting state");
  assertContains(coreAcceptance, "Coco got a bath", "Coco acceptance must preserve bath event");
  assertContains(coreAcceptance, "Coco tried to remove the bow", "Coco acceptance must preserve bow resistance");
  assertContains(coreAcceptance, "Coco left happy", "Coco acceptance must preserve final positive state");
}

console.log("=== QRE AUTHOR WOW ARCHITECTURE GUARD ===");
for (const failure of failures) console.error("FAIL:", failure);
if (failures.length) {
  console.error(`AUTHOR WOW ARCHITECTURE GUARD FAILED - ${failures.length}`);
  process.exit(1);
}
console.log("GREEN - DISCOVERY -> NEUTRAL STRUCTURE -> LENS A/B/C(+D) -> MOUTH WHOLE PRODUCTIONS -> REPAIR -> WHOLE-PRODUCTION SELECTION -> GROUNDING");
