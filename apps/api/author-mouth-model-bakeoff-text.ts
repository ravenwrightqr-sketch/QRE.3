/// <reference types="node" />
import { localModelGenerate } from "./src/services/localModelRuntime.js";

const rawArgs = process.argv.slice(2);
const subjectFlagIndex = rawArgs.findIndex((value) => value === "--subject");
const subject = subjectFlagIndex >= 0 ? String(rawArgs[subjectFlagIndex + 1] ?? "").trim() : "";
const modelFlagIndex = rawArgs.findIndex((value) => value === "--models");
const models = modelFlagIndex >= 0
  ? String(rawArgs[modelFlagIndex + 1] ?? "").split(",").map((value) => value.trim()).filter(Boolean)
  : ["qwen2.5vl:7b", "qwen3:8b", "gemma3:12b"];
const promptParts = rawArgs.filter((_, index) => index !== subjectFlagIndex && index !== subjectFlagIndex + 1 && index !== modelFlagIndex && index !== modelFlagIndex + 1);
const raw = promptParts.join(" ").trim();
if (!subject || !raw) throw new Error('Usage: pnpm exec tsx apps/api/author-mouth-model-bakeoff-text.ts --subject "Coco" --models "qwen2.5vl:7b,qwen3:8b,gemma3:12b" "facts"');
const facts = raw.split(/[,\n.;•]+/).map((value) => value.trim()).filter(Boolean);
const system = [
  "QRE MOUTH MODEL LAB · PLAIN TEXT.",
  "Generate one short viewer-facing QRE scrolling line from the supplied reality.",
  "Reality is immutable. Do not invent events, actions, reactions, objects, people, locations, chronology, outcomes, or identity attributes.",
  "A supplied preference or topic may become a question or open possibility, but not a fabricated event. Example: 'likes squirrels' may become 'Any squirrels around today?' but not 'chases squirrels.'",
  "The subject is established. Do not repeat the subject name unless the repetition is the creative hit.",
  "Do not output a fact checklist. Use compression, attitude, implication, contrast, understatement, wordplay, or possibility.",
  "Feel-good does not mean wholesome; reward may be funny, sharp, tense, mischievous, warm, ironic, curious, or surprising.",
  "The line should feel alive when shown alone as a scrolling message and create desire for another line.",
  "Return plain text only. No JSON. No headings. No explanation.",
].join("\n");
const user = JSON.stringify({ subject, suppliedEvidence: facts });
console.log("=".repeat(88));
console.log("QRE MOUTH MODEL BAKE-OFF · PLAIN TEXT SINGLE PASS");
console.log(`SUBJECT: ${subject}`);
console.log(`EVIDENCE: ${facts.join(" | ")}`);
console.log(`MODELS: ${models.join(" | ")}`);
console.log("=".repeat(88));
for (const model of models) {
  process.env.QRE_AUTHOR_FAST_MODEL = model;
  process.env.QRE_AUTHOR_FALLBACK_MODEL = "";
  const started = Date.now();
  try {
    const result = await localModelGenerate(
      [{ role: "system", content: system }, { role: "user", content: user }],
      undefined,
      { numPredict: 80, temperature: 0.78 },
    );
    console.log(`\nMODEL: ${model}`);
    console.log(`TIME_MS: ${Date.now() - started}`);
    console.log(`OUTPUT: ${result.text.trim() || "<empty>"}`);
  } catch (error) {
    console.log(`\nMODEL: ${model}`);
    console.log(`TIME_MS: ${Date.now() - started}`);
    console.log(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log("\n" + "=".repeat(88));
console.log("END QRE MOUTH MODEL BAKE-OFF");
console.log("=".repeat(88));
