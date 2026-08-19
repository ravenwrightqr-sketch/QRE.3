/**
 * QRE AUTHOR · CANONICAL END-TO-END ACCEPTANCE
 *
 * FILE: apps/api/author-canonical-acceptance.ts
 * ROLE: Production-path acceptance harness.
 *
 * PRODUCTION STATUS: CANONICAL TEST
 *
 * THIS TEST MUST EXERCISE:
 *   authorBrainUniversal()
 *
 * CANONICAL PATH:
 *   Reality → Cognition → Movie → Meaning → Realization → Mouth
 *   → Truth/Attention → Beam → Exact Endpoint → Final Scenes
 *
 * DOES NOT TEST:
 *   authorEnterpriseMouth.ts as a production author.
 *
 * PURPOSE:
 *   Verify that the same end-to-end machine QRE will ship can:
 *   - preserve supplied reality;
 *   - produce non-empty candidate pools;
 *   - produce a complete sequence;
 *   - preserve the exact endpoint;
 *   - pass the sequence arc / cut gates;
 *   - expose enough diagnostics to identify the failing layer.
 */
import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";
import type { AuthorBrainTruth } from "@qre/contracts";

const prompt = process.argv[2] ?? "Dog grooming service receipt";
const subject = process.argv[3] ?? "Coco";
const facts = (process.argv[4] ?? "poodle|nervous|fierce|cool|came in nervous|got a bath|stole a blue bow|left looking fabulous")
  .split("|").map((value) => value.trim()).filter(Boolean);
const sourceMoments = (process.argv[5] ?? "came in nervous|got a bath|stole a blue bow|left looking fabulous")
  .split("|").map((value) => value.trim()).filter(Boolean);
const lens = process.argv[6] ?? "";

const input: AuthorBrainTruth = {
  prompt,
  subject,
  place: "",
  lens,
  facts,
  sourceMoments,
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
};

console.log("=".repeat(88));
console.log("QRE CANONICAL AUTHOR ACCEPTANCE");
console.log("REALITY → COGNITION → MOVIE → MEANING → MOUTH → BEAM → ATTENTION → PAYOFF");
console.log("=".repeat(88));
console.log(`PROMPT: ${prompt}`);
console.log(`SUBJECT: ${subject}`);
console.log(`FACTS: ${facts.join(" | ")}`);
console.log(`MOMENTS: ${sourceMoments.join(" | ")}`);
console.log(`LENS: ${lens || "default"}`);
console.log("=".repeat(88));

const result = await authorBrainUniversal(input);
const diagnostics = result.diagnostics as Record<string, unknown>;
const sequence = result.sequence;
const realizationTexts = Array.isArray(diagnostics.realizationTexts)
  ? diagnostics.realizationTexts.map((value) => String(value ?? ""))
  : [];
const candidatePools = Array.isArray(diagnostics.candidatePools)
  ? diagnostics.candidatePools as Array<Record<string, unknown>>
  : [];
const endpoint = String(diagnostics.endpoint ?? "");
const endpointExact = diagnostics.endpointExact === true;
const beamScore = Number(diagnostics.beamScore ?? 0);
const sequenceArc = diagnostics.sequenceArc as Record<string, unknown> | undefined;
const sequenceArcAccepted = sequenceArc?.accepted === true;
const rejectedCuts = Number(diagnostics.sequenceCutsRejected ?? 0);
const finalScenes = Array.isArray(result.scenes) ? result.scenes : [];
const expectedCutCount = sequence?.cuts?.length ?? 0;

console.log("\n--- PRODUCTION DIAGNOSTICS ---");
console.log(`COGNITION MODE: ${String(diagnostics.cognitionMode ?? "")}`);
console.log(`ATTENTION STRATEGY: ${String(diagnostics.chosenAttentionStrategy ?? "")}`);
console.log(`REALITY EVENTS: ${String(diagnostics.realityGraphEvents ?? 0)}`);
console.log(`REALITY RELATIONS: ${String(diagnostics.realityGraphRelations ?? 0)}`);
console.log(`BEATS: ${String(diagnostics.beatCount ?? 0)}`);
console.log(`CANDIDATE POOLS: ${candidatePools.length}`);
console.log(`BEAM SCORE: ${beamScore}`);
console.log(`SEQUENCE CUTS: ${expectedCutCount}`);
console.log(`SEQUENCE REJECTED: ${rejectedCuts}`);
console.log(`SEQUENCE ARC: ${sequenceArcAccepted ? "ACCEPTED" : "REJECTED"}`);
console.log(`ENDPOINT: ${endpoint}`);
console.log(`ENDPOINT EXACT: ${endpointExact}`);
console.log(`FINAL SCENES: ${finalScenes.length}`);

console.log("\n--- REALIZATION TEXTS ---");
realizationTexts.forEach((text, index) => {
  console.log(`[${index + 1}] ${text}`);
});

console.log("\n--- CANDIDATE POOL COUNTS ---");
for (const pool of candidatePools) {
  const order = Number(pool.order ?? 0);
  const candidates = Array.isArray(pool.candidates) ? pool.candidates : [];
  console.log(`[${order}] ${candidates.length} candidates`);
}

const failures: string[] = [];
const MIN_BEAM = 0.32;

if (!sequence) failures.push("canonical Author returned no SequencePlay");
if (!expectedCutCount) failures.push("canonical Author produced zero sequence cuts");
if (!candidatePools.length) failures.push("canonical Mouth produced zero candidate pools");
if (candidatePools.some((pool) => !Array.isArray(pool.candidates) || pool.candidates.length === 0)) {
  failures.push("one or more Mouth candidate pools are empty");
}
if (realizationTexts.length !== expectedCutCount) {
  failures.push(`realization count ${realizationTexts.length} does not match sequence cuts ${expectedCutCount}`);
}
if (rejectedCuts > 0) failures.push(`final cut policy rejected ${rejectedCuts} cut(s)`);
if (!sequenceArcAccepted) failures.push("sequence arc did not pass");
if (!endpointExact) failures.push(`exact endpoint failed for supplied endpoint: ${endpoint}`);
if (beamScore < MIN_BEAM) failures.push(`beam ${beamScore} < ${MIN_BEAM}`);
if (finalScenes.length !== expectedCutCount) {
  failures.push(`final scenes ${finalScenes.length} does not match sequence cuts ${expectedCutCount}`);
}

if (failures.length) {
  console.log("\n--- CANONICAL AUTHOR FAILURES ---");
  for (const failure of failures) console.log(`- ${failure}`);
  throw new Error("CANONICAL AUTHOR ACCEPTANCE FAILED");
}

console.log("\nCANONICAL AUTHOR ACCEPTANCE: PASS");
