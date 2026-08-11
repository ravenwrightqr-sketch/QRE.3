/**
 * SUPER COG CREATIVE ACCEPTANCE
 *
 * Protects the new rule:
 * preserve the premise, then invent inside it when a mundane prompt has room
 * for attention, surprise, humor, or escalation.
 */

import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const prompts = [
  "A housekeeper documents a client's home after a huge cleaning day.",
  "A repair technician documents an ordinary office after a long repair day.",
];

const results = prompts.map((prompt) => compileCognitiveExperience(prompt));

for (const [index, result] of results.entries()) {
  const prompt = prompts[index];
  const text = result.story.beats.map((beat) => beat.text).join(" ").toLowerCase();
  const subject = result.cognition.subject.value.toLowerCase();

  if (!text.includes(subject)) {
    throw new Error(`${prompt}: repaired subject was not conserved in final story text: ${subject}`);
  }

  const creativeEvidence = result.cognition.plan.realization?.directives
    .flatMap((directive) => directive.evidence)
    .filter((evidence) => evidence.source === "creative_realization") ?? [];

  if (!creativeEvidence.length) {
    throw new Error(`${prompt}: no created experiential detail was produced for a mundane prompt`);
  }

  const creativeDetail = creativeEvidence[0]?.detail ?? "";
  if (!text.includes(creativeDetail.split(": ").at(-1)?.toLowerCase() ?? "never")) {
    throw new Error(`${prompt}: created detail did not survive into final story text`);
  }
}

const firstCreative = results[0].cognition.plan.realization?.directives
  .flatMap((directive) => directive.evidence)
  .find((evidence) => evidence.source === "creative_realization")?.detail;

const secondCreative = results[1].cognition.plan.realization?.directives
  .flatMap((directive) => directive.evidence)
  .find((evidence) => evidence.source === "creative_realization")?.detail;

if (firstCreative && secondCreative && firstCreative === secondCreative) {
  throw new Error("Creative realization repeated the exact same twist across distinct prompts");
}

console.log("✓ Super Cog creative realization acceptance passed.");