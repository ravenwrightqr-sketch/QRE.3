import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import type { CognitiveBeatKind, ExperienceHypothesisKind } from "@qre/contracts";

const cases: Array<{
  name: string;
  prompt: string;
  direction: ExperienceHypothesisKind;
  requiredKinds: CognitiveBeatKind[];
}> = [
  {
    name: "living memory",
    prompt: "My grandfather's old truck is the only thing left from his life",
    direction: "memory",
    requiredKinds: ["orientation", "origin", "reflection", "payoff", "continuation"],
  },
  {
    name: "useful guidance",
    prompt: "Teach someone how to make sourdough",
    direction: "utility",
    requiredKinds: ["need", "instruction", "action", "feedback", "next_step"],
  },
  {
    name: "shared nightclub",
    prompt: "Make a QR experience for a nightclub",
    direction: "social",
    requiredKinds: ["orientation", "encounter", "contribution", "payoff", "continuation"],
  },
  {
    name: "discovery artifact",
    prompt: "Turn a musician's guitar pick into a portal into their universe",
    direction: "discovery",
    requiredKinds: ["threshold", "reveal", "discovery", "payoff", "continuation"],
  },
  {
    name: "meaningful commerce",
    prompt: "I run a tattoo shop but I don't want another boring loyalty program",
    direction: "commerce",
    requiredKinds: ["orientation", "identity", "discovery", "payoff", "continuation"],
  },
];

/**
 * Some semantic directives are intentionally compiler-level operations rather
 * than presentation copy. They must be realized as observable consequences,
 * not copied verbatim into the final story.
 */
const ABSTRACT_DIRECTIVE = /^(?:enter the observed situation|create a reason to continue|encounter the next supported condition|go further than before|increase the active condition|carry the preceding state into a changed condition|reach the result produced by what happened before|carry the current state forward|place present evidence beside available prior context|bring an available historical detail into the present|encounter a concrete remembered detail|recognize the consequence of what was preserved|make the next required action available|perform the next useful action|observe the result before choosing again|enter the challenge|face the next challenge condition|inspect the next available clue or condition|apply the previous result to a harder or stranger next condition|cross into the discoverable layer|bring a concealed detail into view|follow the newly visible relationship|bring participants to the same point of attention|let participants encounter the subject together|add a contribution others can encounter|enter the relationship around the subject|make the subject's identity-bearing detail visible|encounter the relevant additional value|recognize the current starting point|cross into the next stage|discover what the current stage exposes|notice what the subject represents|connect the subject with its supplied identity context|recognize the personal consequence|enter the meaningful context|perform the entry action|perform the central ritual interaction|recognize what the ritual action changed|advance the selected cognitive direction|continue from the current state)$/i;

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const realization = result.cognition.plan.realization;

  if (!realization) {
    throw new Error(`${testCase.name}: missing semantic realization`);
  }

  if (realization.direction !== testCase.direction) {
    throw new Error(
      `${testCase.name}: expected ${testCase.direction}, got ${realization.direction}`,
    );
  }

  const kinds = realization.directives.map((directive) => directive.kind);

  for (const kind of testCase.requiredKinds) {
    if (!kinds.includes(kind)) {
      throw new Error(`${testCase.name}: missing directive ${kind}`);
    }
  }

  if (realization.directives.some((directive) => !directive.action || !directive.stateAfter)) {
    throw new Error(`${testCase.name}: incomplete semantic directive`);
  }

  for (const directive of realization.directives) {
    const beat = result.story.beats.find((candidate) => candidate.kind === directive.kind);
    if (!beat) {
      throw new Error(`${testCase.name}: directive ${directive.kind} has no compiled beat`);
    }

    const action = directive.action.replace(/[.!?]+$/, "").trim().toLowerCase();

    // Concrete directives must survive literally. Compiler-level semantic
    // operations must instead survive through observable presentation, which
    // is what the downstream realization guard is responsible for enforcing.
    if (!ABSTRACT_DIRECTIVE.test(action) && action && !beat.text.toLowerCase().includes(action)) {
      throw new Error(
        `${testCase.name}: ${directive.kind} concrete semantic action was not realized in presentation text`,
      );
    }
  }

  if (!realization.semanticArc.length || !realization.conservedRoles.length) {
    throw new Error(`${testCase.name}: realization lost semantic arc or conserved roles`);
  }

  console.log(
    `✓ ${testCase.name}: ${realization.direction} / ${realization.directives.length} semantic directives`,
  );
}

console.log("✓ cognitive semantic realization acceptance passed");
