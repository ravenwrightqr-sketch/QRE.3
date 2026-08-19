/**
 * QRE AUTHOR · DIAGNOSTIC / LEGACY ACCEPTANCE
 *
 * FILE: apps/api/author-enterprise-mouth-acceptance.ts
 * ROLE: Historical Enterprise Mouth diagnostic harness.
 *
 * PRODUCTION STATUS: NOT CANONICAL
 *
 * IMPORTANT:
 * - This file exercises authorEnterpriseMouth.ts.
 * - authorEnterpriseMouth.ts is NOT production authority.
 * - Do not use this harness to judge the production Author/Mouth.
 * - Production acceptance is apps/api/author-canonical-acceptance.ts.
 *
 * RETIREMENT:
 * Keep only while legacy behavior comparisons remain useful.
 * Remove after canonical acceptance coverage replaces any remaining diagnostic use.
 */

import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { searchLatentMovieCandidates } from "./src/services/authorLatentMovieSearch.js";
import { realizeEnterpriseMouth } from "./src/services/authorEnterpriseMouth.js";

const prompt = process.argv[2] ?? "Dog grooming service receipt";
const subject = process.argv[3] ?? "Coco";
const facts = (process.argv[4] ?? "poodle|nervous|fierce|cool|came in nervous|got a bath|stole a blue bow|left looking fabulous")
  .split("|").map((value) => value.trim()).filter(Boolean);
const moments = (process.argv[5] ?? "came in nervous|got a bath|stole a blue bow|left looking fabulous")
  .split("|").map((value) => value.trim()).filter(Boolean);

const graph = buildAuthorRealityGraph({ prompt, subject, place: "", facts, sourceMoments: moments, memoryContext: [], trajectory: [] });
const movie = searchLatentMovieCandidates({ graph, subject, limit: 1 })[0];
if (!movie) throw new Error("ENTERPRISE MOUTH DIAGNOSTIC FAILED: no latent movie candidate");

const labelFor = (id: string): string => graph.events.find((event) => event.id === id)?.label ?? id;
const beats = movie.trajectory.map((step) => ({
  order: step.order,
  role: step.operation === "establish" ? "arrival" : step.operation === "payoff" ? "payoff" : step.operation === "escalate" ? "escalation" : "reframe",
  attentionFunction: step.operation === "establish" ? "hook" : step.operation === "payoff" ? "payoff" : step.operation === "escalate" ? "escalation" : step.operation === "contrast" ? "reframe" : "turn",
  creativeMove: step.operation === "contrast" ? "contrast" : step.operation === "reframe" ? "recontextualization" : step.operation === "recur" ? "callback" : "none",
  realizationMode: step.operation === "establish" ? "direct_grounded_realization" : step.operation === "payoff" ? "payoff_compression" : step.operation === "contrast" ? "semantic_contrast" : step.operation === "reframe" ? "meaning_reframe" : "meaning_turn",
  eventIds: [...step.eventIds],
  change: step.viewerChange,
  next: step.nextQuestion,
  frontier: step.nextQuestion,
  setsUp: step.eventIds.map(labelFor),
  paysOff: step.operation === "payoff" ? [movie.payoff] : [],
}));

console.log("=".repeat(80));
console.log("QRE ENTERPRISE MOUTH DIAGNOSTIC");
console.log("NOT PRODUCTION ACCEPTANCE · compare legacy Enterprise Mouth only");
console.log("=".repeat(80));

const result = await realizeEnterpriseMouth({ graph, subject, lens: movie.lens, beats });
console.log("\n--- REALITY ENVELOPE ---");
console.log(JSON.stringify(result.envelope, null, 2));
console.log("\n--- RAW CANDIDATE MODEL ---");
console.log(result.rawModelText);
console.log("\n--- SELECTED SEQUENCE ---");
result.candidates.forEach((candidate) => {
  console.log(`[${candidate.beatOrder}] ${candidate.text}`, `score=${candidate.score}`, `grounding=${candidate.groundingScore}`, `meaning=${candidate.meaningScore}`, `invention=${candidate.inventionRisk}`, `reasons=${candidate.reasons.join(",") || "none"}`);
});
console.log("\n--- BEAM ---");
console.log(JSON.stringify({ texts: result.texts, beamScore: result.beamScore }, null, 2));
