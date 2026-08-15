import { generateAiExperienceDraft } from "./src/services/aiProvider.js";
import { CREATIVE_LEARNING_PROMPTS } from "../../packages/engine/src/compiler/tests/creativeLearningPromptPack.ts";

const selected = CREATIVE_LEARNING_PROMPTS.filter((p) =>
  [1, 11, 21].includes(p.id)
);

for (const p of selected) {
  console.log("\n" + "=".repeat(100));
  console.log(`[${p.id}] ${p.category.toUpperCase()}`);
  console.log("PROMPT:", p.prompt);

  const draft = await generateAiExperienceDraft({
    prompt: p.prompt,
    lens: p.category,
    sourceMoments: [p.prompt],
    facts: [p.prompt],
    memoryContext: p.memory ? [`Memory instruction: ${p.memory}`] : [],
    audience: "customer",
  });

  console.log("\nPROSE:\n" + (draft ?? "[NO DRAFT]"));
}

console.log("\n" + "=".repeat(100));
console.log("10-PROMPT READOUT COMPLETE");
