/**
 * COGNITIVE CONCRETE EXPERIENCE ACCEPTANCE
 *
 * The acceptance boundary is behavioral: mechanics must survive into
 * observable events, concrete evidence must survive, compiler prose must not,
 * and executable directives must not disappear.
 *
 * The service-story probes are intentionally evidence-rich. They test the
 * behavior QRE needs in production: a mundane job can become entertaining
 * without turning invented details into claimed facts.
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
  forbiddenInventedEvidence?: string[];
};

const probes: Probe[] = [
  {
    name: "Over-the-top indulgence",
    prompt: "Create an absurd luxury spa experience for a billionaire that gets increasingly over the top.",
    mechanic: "excess",
    expressiveEvidence: ["goes further", "over the top", "absurd", "increasing"],
    concreteEvidence: ["billionaire", "spa", "luxury"],
  },
  {
    name: "Suspense machine",
    prompt: "Create a genuinely terrifying haunted-house experience where every room makes the threat less certain and more dangerous.",
    mechanic: "suspense",
    expressiveEvidence: ["out of sight", "unknown", "unresolved", "hidden"],
    concreteEvidence: ["haunted-house", "threat", "dangerous"],
  },
  {
    name: "Living folklore",
    prompt: "Create a funny birthday memory that family members can keep adding to, with each version becoming more ridiculous.",
    mechanic: "escalation",
    expressiveEvidence: ["goes further", "ridiculous", "funny", "unexpected"],
    concreteEvidence: ["birthday", "family", "version", "ridiculous"],
  },
  {
    name: "Agency and prestige",
    prompt: "Create an exclusive spectacular celebration where participants choose their own path, build mastery, unlock a rare surprise, and leave with a personalized artifact that becomes part of their legacy.",
    mechanic: "agency",
    expressiveEvidence: ["acts", "choice", "unlock", "surprise", "next step"],
    concreteEvidence: ["exclusive", "spectacular", "celebration", "artifact", "legacy"],
  },
  {
    name: "Housekeeping attention test",
    prompt: "I'm a housekeeper. After cleaning a client's house, tell a funny actual story: I arrived at 9:12 AM at the client's Riverside home, finished the kitchen and bathrooms, then found feathers on a stick in the living room and was glad I had two boxes of extra gloves in the van. The house was locked up when I left. Encourage tips without making it sound like a tip request.",
    mechanic: "delight",
    expressiveEvidence: ["funny", "ordinary", "unexpected", "turn"],
    concreteEvidence: ["housekeeper", "cleaning", "9:12 AM", "Riverside", "kitchen", "bathrooms", "feathers on a stick", "extra gloves", "van", "locked up"],
    forbiddenInventedEvidence: ["haunted", "monster", "fire", "flood"],
  },
  {
    name: "Dog groomer attention test",
    prompt: "I'm a dog groomer. Tell the client a funny actual story about Max arriving ready to call his lawyer, getting pampered, eating one bow, and leaving like a rockstar.",
    mechanic: "transformation",
    expressiveEvidence: ["unexpected", "turn", "different", "changes"],
    concreteEvidence: ["dog groomer", "Max", "lawyer", "bow", "pampered", "rockstar"],
    forbiddenInventedEvidence: ["bit the groomer", "ran away", "police"],
  },
];

const ABSTRACT_DIRECTIVE = /^(?:make|create|surface|adapt|allow|recognize|provide|resolve|advance|increase)\b.*\b(?:meaning|significance|context|identity|evidence|experience|direction|purpose|state|condition|result)\b/i;

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
    throw new Error(`${probe.name}: expected mechanic ${probe.mechanic}; got ${activeMechanics.join(", ")}`);
  }

  const text = result.story.beats.map((beat) => beat.text).join(" ").toLowerCase();

  if (probe.expressiveEvidence.every((cue) => !text.includes(cue))) {
    throw new Error(
      `${probe.name}: mechanic did not reach expressive presentation.\n` +
      `Expected one of: ${probe.expressiveEvidence.join(", ")}\n` +
      `Story: ${result.story.beats.map((beat) => `${beat.kind}: ${beat.text}`).join(" | ")}`,
    );
  }

  const missingConcrete = probe.concreteEvidence.filter((value) => !text.includes(value.toLowerCase()));
  if (missingConcrete.length >= Math.ceil(probe.concreteEvidence.length / 2)) {
    throw new Error(`${probe.name}: concrete evidence collapsed. Missing: ${missingConcrete.join(", ")}`);
  }

  for (const forbidden of probe.forbiddenInventedEvidence ?? []) {
    if (text.includes(forbidden.toLowerCase())) {
      throw new Error(`${probe.name}: invented evidence leaked into canonical story: ${forbidden}`);
    }
  }

  if (result.story.beats.some((beat) => isGenericCompilerProse(beat.text))) {
    throw new Error(`${probe.name}: generic compiler prose survived into final story text`);
  }

  for (const directive of result.cognition.plan.realization?.directives ?? []) {
    const action = directive.action.replace(/[.!?]+$/, "").trim();
    if (!action || ABSTRACT_DIRECTIVE.test(action)) continue;

    const beat = result.story.beats.find((candidate) => candidate.kind === directive.kind);
    if (!beat) continue;

    // Creative-realization directives are pressure, not observed facts. They
    // are intentionally not required to survive as literal action text.
    if (directive.evidence.some((item) => item.source === "creative_realization")) continue;

    if (!beat.text.toLowerCase().includes(action.toLowerCase())) {
      throw new Error(`${probe.name}: executable directive was lost for ${directive.kind}: ${directive.action}`);
    }
  }

  console.log(`✓ ${probe.name}: ${probe.mechanic} survived into concrete experience`);
}

console.log("✓ Super Cog concrete experience acceptance passed.");
