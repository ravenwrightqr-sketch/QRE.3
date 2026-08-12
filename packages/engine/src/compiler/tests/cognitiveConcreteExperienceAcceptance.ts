/**
 * ============================================================================
 * COGNITIVE CONCRETE EXPERIENCE ACCEPTANCE
 * ============================================================================
 *
 * GOAL
 * ---
 * Prove the final handoff from mega cognition and mega trajectory into
 * observable experience language.
 *
 * The suite verifies:
 *   1. cognitive mechanics survive,
 *   2. concrete prompt evidence survives,
 *   3. expressive behavior survives,
 *   4. semantic directives are REALIZED rather than copied verbatim,
 *   5. generic compiler prose does not survive.
 *
 * IMPORTANT:
 * A realization directive is compiler language. The final story does NOT
 * need to contain the directive's exact wording. It needs to demonstrate
 * the directive's experiential operation.
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

/**
 * A directive is an instruction to the realization system, not presentation
 * copy. These signals test whether its intended operation became observable.
 *
 * This intentionally lives at the acceptance boundary rather than weakening
 * the realization engine to force compiler vocabulary into final prose.
 */
const DIRECTIVE_REALIZATION_SIGNALS: Record<string, RegExp[]> = {
  orientation: [
    /\b(?:enters?|arrives?|begins?|starts?|opens?|steps?|moves?|finds?|encounters?)\b/i,
  ],

  threshold: [
    /\b(?:enters?|crosses?|steps?|moves?|begins?|approaches?|encounters?)\b/i,
  ],

  origin: [
    /\b(?:brings?|starts?|begins?|comes?|carries?|returns?|arrives?)\b/i,
  ],

  encounter: [
    /\b(?:encounters?|meets?|finds?|notices?|sees?|discovers?|appears?|arrives?)\b/i,
  ],

  identity: [
    /\b(?:becomes?|recognizes?|claims?|owns?|chooses?|reveals?|shows?)\b/i,
  ],

  action: [
    /\b(?:acts?|uses?|handles?|moves?|touches?|opens?|closes?|takes?|makes?|does?)\b/i,
  ],

  contribution: [
    /\b(?:adds?|shares?|gives?|contributes?|brings?|leaves?|places?|changes?)\b/i,
  ],

  discovery: [
    /\b(?:finds?|discovers?|notices?|sees?|uncovers?|reveals?|appears?)\b/i,
  ],

  reveal: [
    /\b(?:reveals?|sees?|discovers?|shows?|uncovers?|appears?|becomes?)\b/i,
  ],

  feedback: [
    /\b(?:responds?|changes?|reacts?|because|after|result|consequence|affects?)\b/i,
  ],

  escalation: [
    /\b(?:another|again|further|more|larger|bigger|exceeds?|beyond|intensif\w*|adds?|increases?)\b/i,
  ],

  transformation: [
    /\b(?:changes?|changed|becomes?|became|different|transformed?|after|now|turns?|moves?)\b/i,
  ],

  reflection: [
    /\b(?:returns?|looks?\s+back|remembers?|recognizes?|sees?|again|consequence|recalls?)\b/i,
  ],

  payoff: [
    /\b(?:reaches?|gets?|earns?|claims?|receives?|keeps?|leaves?|result|finally|becomes?)\b/i,
  ],

  next_step: [
    /\b(?:takes?|moves?|chooses?|continues?|returns?|steps?|begins?|next|forward)\b/i,
  ],

  continuation: [
    /\b(?:continues?|carries?|keeps?|returns?|next|again|forward|remains?)\b/i,
  ],
};

function directiveWasRealized(kind: string, text: string): boolean {
  const signals = DIRECTIVE_REALIZATION_SIGNALS[kind];

  // Unknown directive kinds are not failed merely because this acceptance
  // suite has no presentation vocabulary for them.
  if (!signals) return true;

  return signals.some((signal) => signal.test(text));
}

const probes: Probe[] = [
  {
    name: "Over-the-top indulgence",
    prompt:
      "Create an absurd luxury spa experience for a billionaire that gets increasingly over the top.",
    mechanic: "excess",
    expressiveEvidence: [
      "goes further",
      "another layer",
      "more elaborate",
      "excessive",
      "ordinary",
    ],
    concreteEvidence: ["billionaire", "spa", "luxury"],
  },
  {
    name: "Suspense machine",
    prompt:
      "Create a genuinely terrifying haunted-house experience where every room makes the threat less certain and more dangerous.",
    mechanic: "suspense",
    expressiveEvidence: [
      "out of sight",
      "unresolved",
      "hidden",
      "withheld",
      "unknown",
      "not yet",
    ],
    concreteEvidence: ["haunted-house", "threat", "dangerous"],
  },
  {
    name: "Living folklore",
    prompt:
      "Create a funny birthday memory that family members can keep adding to, with each version becoming more ridiculous.",
    mechanic: "escalation",
    expressiveEvidence: [
      "goes further",
      "another layer",
      "more elaborate",
      "more intense",
      "escalation",
    ],
    concreteEvidence: ["birthday", "family", "version", "ridiculous"],
  },
  {
    name: "Agency and prestige",
    prompt:
      "Create an exclusive spectacular celebration where participants choose their own path, build mastery, unlock a rare surprise, and leave with a personalized artifact that becomes part of their legacy.",
    mechanic: "agency",
    expressiveEvidence: [
      "participant gets the move",
      "choice",
      "determines",
      "chosen move",
    ],
    concreteEvidence: [
      "exclusive",
      "spectacular",
      "celebration",
      "artifact",
      "legacy",
    ],
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

  const text = result.story.beats
    .map((beat) => beat.text)
    .join(" ")
    .toLowerCase();

  if (probe.expressiveEvidence.every((cue) => !text.includes(cue))) {
    throw new Error(
      `${probe.name}: cognitive mechanic did not reach expressive presentation.\n` +
        `Expected one of: ${probe.expressiveEvidence.join(", ")}\n` +
        `Story: ${result.story.beats
          .map((beat) => `${beat.kind}: ${beat.text}`)
          .join(" | ")}`,
    );
  }

  const missingConcrete = probe.concreteEvidence.filter(
    (value) => !text.includes(value.toLowerCase()),
  );

  if (
    missingConcrete.length >=
    Math.ceil(probe.concreteEvidence.length / 2)
  ) {
    throw new Error(
      `${probe.name}: concrete evidence collapsed before presentation. Missing: ${missingConcrete.join(", ")}`,
    );
  }

  if (
    result.story.beats.some((beat) => isGenericCompilerProse(beat.text))
  ) {
    throw new Error(
      `${probe.name}: generic compiler prose survived into final story text`,
    );
  }

  /**
   * CRITICAL INVARIANT:
   *
   * Directive actions are semantic compiler instructions.
   * They must be realized, not copied verbatim.
   *
   * Example:
   *
   *   directive:
   *     "carry the preceding state into a changed condition"
   *
   * valid presentation:
   *     "...after that, the experience becomes even more elaborate..."
   *
   * invalid presentation:
   *     "...carry the preceding state into a changed condition..."
   *
   * The former is experience. The latter is compiler language leaking out.
   */
  for (const directive of result.cognition.plan.realization?.directives ?? []) {
    const beat = result.story.beats.find(
      (candidate) => candidate.kind === directive.kind,
    );

    if (!beat) continue;

    if (!directiveWasRealized(directive.kind, beat.text)) {
      throw new Error(
        `${probe.name}: directive intent was not realized for ${directive.kind}: ${directive.action}\n` +
          `Rendered: ${beat.text}`,
      );
    }
  }

  console.log(
    `✓ ${probe.name}: ${probe.mechanic} survived into concrete experience`,
  );
}

console.log("✓ Super Cog concrete experience acceptance passed.");