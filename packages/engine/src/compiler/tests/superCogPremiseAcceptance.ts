import type { CognitivePremiseRole } from "@qre/contracts";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { premiseValues } from "../../cognition/premiseBuilder.js";

const cases = [
  {
    prompt: "Turn this concert QR into something people will remember.",
    required: { event: "concert", medium: "qr" },
    output: /concert|qr|remember/i,
  },
  {
    prompt: "Create a funny birthday memory that family members can keep adding to.",
    required: { event: "birthday" },
    output: /birthday|family|adding|memory/i,
  },
  {
    prompt: "Build a playful scavenger hunt where every clue changes the next clue.",
    required: {},
    output: /scavenger|clue|next|hunt/i,
  },
  {
    prompt: "Make a genuinely terrifying haunted-house experience.",
    required: {},
    output: /terrifying|haunted|house|horror/i,
  },
  {
    prompt: "My grandmother gave me this watch.",
    required: { artifact: "watch" },
    output: /grandmother|watch/i,
  },
  {
    /**
     * The dog test is intentionally concrete. A valid result must not merely
     * say that Max receives "care" or that the experience is "meaningful".
     * It must retain the subject, the grooming/spa context, and an observable
     * action or state change in the actual story beats.
     */
    prompt: "Create a dog groomer story for Max the poodle about the experience.",
    required: {},
    output: /max|poodle|groomer|grooming|bath|spa|pamper|clean/i,
    observable: /groom|bath|wash|brush|dry|trim|pamper|spa|clean/i,
    forbidden: /the operative move is|meaningful experience|deserves a closer look/i,
  },
];

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const premise = result.cognition.plan.premise;

  if (!premise) {
    throw new Error(`Missing conserved premise for: ${testCase.prompt}`);
  }

  for (const [role, expected] of Object.entries(testCase.required)) {
    const actual = premiseValues(premise, role as CognitivePremiseRole);
    if (!actual.some((value) => value.toLowerCase().includes(expected.toLowerCase()))) {
      throw new Error(
        `Premise role ${role} lost ${expected} for: ${testCase.prompt}. Actual: ${actual.join(", ")}`,
      );
    }
  }

  const beatText = result.story.beats.map((beat) => beat.text).join(" ");
  if (!testCase.output.test(beatText)) {
    throw new Error(
      `Realized story lost salient meaning for: ${testCase.prompt}. Realized: ${beatText}`,
    );
  }

  if ("observable" in testCase && testCase.observable && !testCase.observable.test(beatText)) {
    throw new Error(
      `Concrete action/context was not realized in beats for: ${testCase.prompt}. Realized: ${beatText}`,
    );
  }

  if ("forbidden" in testCase && testCase.forbidden && testCase.forbidden.test(beatText)) {
    throw new Error(
      `Generic realization leaked into subject-native beats for: ${testCase.prompt}. Realized: ${beatText}`,
    );
  }

  if (new Set(result.story.beats.map((beat) => beat.text.toLowerCase())).size < Math.min(3, result.story.beats.length)) {
    throw new Error(`Story beats collapsed into repeated prose for: ${testCase.prompt}`);
  }

  console.log(`✓ ${testCase.prompt}`);
}

console.log("✓ Super Cog premise conservation acceptance passed");
