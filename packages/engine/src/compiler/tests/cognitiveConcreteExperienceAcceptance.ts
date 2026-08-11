/**
 * =============================================================================
 * COGNITIVE CONCRETE EXPERIENCE ACCEPTANCE
 * =============================================================================
 *
 * GOAL
 * ----
 * Prove the final handoff from mega cognition and mega trajectory into
 * observable experience language.
 *
 * PURPOSE
 * -------
 * This suite catches the failure mode where cognition discovers rich forces,
 * trajectory preserves them, but presentation collapses back into bland prose.
 * It also protects the rule that concrete prompt evidence and semantic
 * directive actions must survive into the rendered beats.
 *
 * NO-TEMPLATE RULE
 * ----------------
 * The probes deliberately cross domains. Assertions target experiential
 * behavior and preserved evidence, never subject-specific story templates.
 */

import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { isGenericCompilerProse } from "../../experience/premiseRealizer.js";
import { composeCognitiveTrajectory } from "../../experience/cognitiveTrajectory.js";

type Probe = {
  name: string;
  prompt: string;
  mechanic: string;
  expressiveEvidence: string[];
  concreteEvidence: string[];
};

const probes: Probe[] = [
  {
    name: "Over-the-top indulgence",
    prompt: "Create an absurd luxury spa experience for a billionaire that gets increasingly over the top.",
    mechanic: "excess",
    expressiveEvidence: ["goes further", "another layer", "more elaborate", "excessive", "ordinary"],
    concreteEvidence: ["billionaire", "spa", "luxury"],
  },
  {
    name: "Suspense machine",
    prompt: "Create a genuinely terrifying haunted-house experience where every room makes the threat less certain and more dangerous.",
    mechanic: "suspense",
    expressiveEvidence: ["out of sight", "unresolved", "hidden", "withheld", "unknown", "not yet"],
    concreteEvidence: ["haunted-house", "threat", "dangerous"],
  },
  {
    name: "Living folklore",
    prompt: "Create a funny birthday memory that family members can keep adding to, with each version becoming more ridiculous.",
    mechanic: "escalation",
    expressiveEvidence: ["goes further", "another layer", "more elaborate", "more intense", "escalation"],
    concreteEvidence: ["birthday", "family", "version", "ridiculous"],
  },
  {
    name: "Agency and prestige",
    prompt: "Create an exclusive spectacular celebration where participants choose their own path, build mastery, unlock a rare surprise, and leave with a personalized artifact that becomes part of their legacy.",
    mechanic: "agency",
    expressiveEvidence: ["participant gets the move", "choice", "determines", "chosen move"],
    concreteEvidence: ["exclusive", "spectacular", "celebration", "artifact", "legacy"],
  },
];

for (const probe of probes) {
  const result = compileCognitiveExperience(probe.prompt);
  const trajectory = composeCognitiveTrajectory({
    plan: result.cognition.plan,
    prompt: probe.prompt,
  });

  const activeMechanics = trajectory.mechanics
    .filter((signal) => signal.confidence >= 0.7)
    .map((signal) => signal.mechanic);

  if (!activeMechanics.includes(probe.mechanic as never)) {
    throw new Error(
      `${probe.name}: expected mechanic ${probe.mechanic}; got ${activeMechanics.join(", ")}`,
    );
  }

  const text = result.story.beats.map((beat) => beat.text).join(" ").toLowerCase();

  if (probe.expressiveEvidence.every((cue) => !text.includes(cue))) {
    throw new Error(
      `${probe.name}: cognitive mechanic did not reach expressive presentation.\n` +
        `Expected one of: ${probe.expressiveEvidence.join(", ")}\n` +
        `Story: ${result.story.beats.map((beat) => `${beat.kind}: ${beat.text}`).join(" | ")}`,
    );
  }

  const missingConcrete = probe.concreteEvidence.filter(
    (value) => !text.includes(value.toLowerCase()),
  );

  if (missingConcrete.length >= Math.ceil(probe.concreteEvidence.length / 2)) {
    throw new Error(
      `${probe.name}: concrete evidence collapsed before presentation. Missing: ${missingConcrete.join(", ")}`,
    );
  }

  if (result.story.beats.some((beat) => isGenericCompilerProse(beat.text))) {
    throw new Error(`${probe.name}: generic compiler prose survived into final story text`);
  }

  for (const directive of result.cognition.plan.realization?.directives ?? []) {
    const beat = result.story.beats.find((candidate) => candidate.kind === directive.kind);
    if (!beat) continue;

    const action = directive.action.replace(/[.!?]+$/, "").trim().toLowerCase();
    if (action && !beat.text.toLowerCase().includes(action)) {
      throw new Error(
        `${probe.name}: directive action was lost for ${directive.kind}: ${directive.action}`,
      );
    }
  }

  console.log(`✓ ${probe.name}: ${probe.mechanic} survived into concrete experience`);
}

console.log("✓ Super Cog concrete experience acceptance passed.");
