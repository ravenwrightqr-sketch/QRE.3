import type { CognitivePremiseRole, CognitiveBeatKind } from "@qre/contracts";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { premiseValues } from "../../cognition/premiseBuilder.js";

const cases: Array<{
  prompt: string;
  required: Partial<Record<CognitivePremiseRole, string>>;
  output: RegExp;
  observable?: RegExp;
  transformation?: RegExp;
  requiredKinds?: CognitiveBeatKind[];
  forbidden?: RegExp;
}> = [
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
     * THE DOG TEST
     *
     * A real experience needs an entity, context, observable action, and
     * change. "Max receives care" is not enough. The beats must actually
     * carry the grooming/spa situation and a transformation.
     */
    prompt: "Create a dog groomer story for Max the poodle about the experience.",
    required: {},
    output: /max|poodle|groomer|grooming|bath|spa|pamper|clean/i,
    observable: /groom|bath|wash|brush|dry|trim|pamper|spa|clean/i,
    transformation: /transform|change|pamper|groom|bath|clean|fresh|relax/i,
    requiredKinds: ["transformation"],
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

  if (testCase.observable && !testCase.observable.test(beatText)) {
    throw new Error(
      `Concrete action/context was not realized in beats for: ${testCase.prompt}. Realized: ${beatText}`,
    );
  }

  if (testCase.transformation) {
    const transformationBeat = result.story.beats.find((beat) => beat.kind === "transformation");
    if (!transformationBeat) {
      throw new Error(`No transformation beat was compiled for: ${testCase.prompt}`);
    }
    if (!testCase.transformation.test(transformationBeat.text)) {
      throw new Error(
        `Transformation beat did not contain concrete change for: ${testCase.prompt}. ` +
          `Realized: ${transformationBeat.text}`,
      );
    }
  }

  for (const kind of testCase.requiredKinds ?? []) {
    if (!result.story.beats.some((beat) => beat.kind === kind)) {
      throw new Error(`Missing required story beat ${kind} for: ${testCase.prompt}`);
    }
  }

  if (testCase.forbidden && testCase.forbidden.test(beatText)) {
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
