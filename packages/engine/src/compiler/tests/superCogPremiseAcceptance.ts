import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { premiseValues } from "../../cognition/premiseBuilder.js";

const cases = [
  {
    prompt: "Turn this concert QR into something people will remember.",
    required: {
      event: "concert",
      medium: "qr",
    },
    output: /concert|qr|remember/i,
  },
  {
    prompt: "Create a funny birthday memory that family members can keep adding to.",
    required: {
      event: "birthday",
    },
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
    required: {
      artifact: "watch",
    },
    output: /grandmother|watch/i,
  },
];

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const premise = result.cognition.plan.premise;

  if (!premise) {
    throw new Error(`Missing conserved premise for: ${testCase.prompt}`);
  }

  for (const [role, expected] of Object.entries(testCase.required)) {
    const actual = premiseValues(premise, role as never);
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

  console.log(`✓ ${testCase.prompt}`);
}

console.log("✓ Super Cog premise conservation acceptance passed");
