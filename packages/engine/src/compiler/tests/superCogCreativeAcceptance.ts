/**
 * SUPER COG CREATIVE ACCEPTANCE
 *
 * The creative layer must derive attention from the actual premise. Fixed
 * mundane motifs are forbidden because QRE must discover what is interesting
 * about the user's world rather than decorate it with a canned surprise.
 */

import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const prompts = [
  "A housekeeper documents a client's home after a huge cleaning day. The kitchen is immaculate and the client asked for the work to be remembered.",
  "A repair technician documents an ordinary office after a long repair day. The server room was finally restored before the team returned.",
  "A wedding begins at a beach venue tonight and the couple wants the night to feel like a movie their family can keep.",
  "Take me through a rave from arriving at the warehouse to sunrise, with the crowd and the changing energy carrying the story.",
];

const forbiddenMotifs = [
  "stray feather",
  "one glove",
  "trail of glitter",
  "one object appears twice",
  "note with no obvious explanation",
  "specific mess",
  "line of crumbs",
];

const results = prompts.map((prompt) => compileCognitiveExperience(prompt));

for (const [index, result] of results.entries()) {
  const prompt = prompts[index];
  const text = result.story.beats.map((beat) => beat.text).join(" ").toLowerCase();
  const subject = result.cognition.subject.value.toLowerCase();

  if (!text.includes(subject)) {
    throw new Error(`${prompt}: repaired subject was not conserved in final story text: ${subject}`);
  }

  if (forbiddenMotifs.some((motif) => text.includes(motif))) {
    throw new Error(`${prompt}: fixed mundane creative motif leaked into final story text`);
  }

  const attentionEvidence = result.cognition.plan.realization?.directives
    .flatMap((directive) => directive.evidence)
    .filter((evidence) => evidence.detail.includes("evidence-driven attention pressure")) ?? [];

  if (!attentionEvidence.length) {
    throw new Error(`${prompt}: no evidence-driven attention pressure was produced`);
  }

  const attentionDetail = attentionEvidence[0]?.detail ?? "";
  const anchors = attentionDetail.split(": ").at(-1)?.split(" + ").map((value) => value.split(": ").at(-1)?.toLowerCase() ?? "").filter(Boolean) ?? [];
  if (!anchors.some((anchor) => text.includes(anchor))) {
    throw new Error(`${prompt}: attention anchor did not survive into final story text`);
  }
}

const firstAttention = results[0].cognition.plan.realization?.directives
  .flatMap((directive) => directive.evidence)
  .find((evidence) => evidence.detail.includes("evidence-driven attention pressure"))?.detail;

const secondAttention = results[1].cognition.plan.realization?.directives
  .flatMap((directive) => directive.evidence)
  .find((evidence) => evidence.detail.includes("evidence-driven attention pressure"))?.detail;

if (firstAttention && secondAttention && firstAttention === secondAttention) {
  throw new Error("Evidence-driven attention repeated the exact same pressure across distinct prompts");
}

console.log("✓ Super Cog evidence-driven attention acceptance passed.");
