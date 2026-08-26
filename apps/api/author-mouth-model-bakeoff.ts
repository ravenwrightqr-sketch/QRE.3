/// <reference types="node" />
import { localModelGenerate } from "./src/services/localModelRuntime.js";

const rawArgs = process.argv.slice(2);

const subjectFlagIndex = rawArgs.findIndex((value) => value === "--subject");
const subject = subjectFlagIndex >= 0
  ? String(rawArgs[subjectFlagIndex + 1] ?? "").trim()
  : "";

const modelFlagIndex = rawArgs.findIndex((value) => value === "--models");
const requestedModels = modelFlagIndex >= 0
  ? String(rawArgs[modelFlagIndex + 1] ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  : ["qwen2.5vl:7b", "qwen3:8b", "gemma3:12b"];

const promptParts = rawArgs.filter(
  (_, index) =>
    index !== subjectFlagIndex &&
    index !== subjectFlagIndex + 1 &&
    index !== modelFlagIndex &&
    index !== modelFlagIndex + 1,
);

const raw = promptParts.join(" ").trim();

if (!subject || !raw) {
  throw new Error(
    'Usage: pnpm exec tsx apps/api/author-mouth-model-bakeoff.ts --subject "Coco" [--models "qwen2.5vl:7b,qwen3:8b,gemma3:12b"] "Coco is a dog, Coco is a poodle, Coco likes squirrels, Coco walks, Coco loves bacon, Coco likes some dogs, Coco loves the park"',
  );
}

const facts = raw
  .split(/[,\n.;•]+/)
  .map((value) => value.trim())
  .filter(Boolean);

const system = [
  "QRE CANONICAL MOUTH · MODEL BAKE-OFF.",
  "You are testing native realization quality. Do not plan a story and do not explain your reasoning.",
  "Reality is immutable. Use only the supplied evidence below.",
  "The subject has already been established. Do not keep repeating the subject name unless repetition is the creative hit.",
  "Do not turn a supplied preference, relationship, or topic into an invented physical event.",
  "Example: 'likes squirrels' may become 'Any squirrels around today?' but may NOT become 'chases squirrels' unless that event was supplied.",
  "Unknown stays unknown. Do not infer gender, age, ownership, relationship status, motives, reactions, locations, chronology, or outcomes.",
  "Creative freedom is allowed in compression, rhythm, attitude, implication, contrast, understatement, wordplay, questions, and open possibilities.",
  "FEEL-GOOD DOES NOT MEAN WHOLESOME. Viewer reward may be humor, tension, surprise, mischief, irony, warmth, curiosity, status, relief, beauty, menace, or a sharp turn.",
  "Do not restate the input as a checklist. Convert supplied material into a compact viewer-facing realization.",
  "The line should feel like a scrolling QRE message: short, specific, alive, and worth reading the next line after it.",
  "Prefer compression over explanation.",
  "A one-line output is required. No headings. No analysis. Return JSON exactly: {\"text\":\"...\"}.",
].join("\n");

const user = JSON.stringify({
  subject,
  suppliedEvidence: facts,
  desiredMoment: "first-scan world discovery; create interest without inventing an event",
});

console.log("=".repeat(88));
console.log("QRE MOUTH MODEL BAKE-OFF · SINGLE PASS");
console.log(`SUBJECT: ${subject}`);
console.log(`EVIDENCE: ${facts.join(" | ")}`);
console.log(`MODELS: ${requestedModels.join(" | ")}`);
console.log("=".repeat(88));

for (const model of requestedModels) {
  process.env.QRE_AUTHOR_FAST_MODEL = model;
  process.env.QRE_AUTHOR_FALLBACK_MODEL = "";

  const started = Date.now();

  try {
    const result = await localModelGenerate(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      "json",
      { numPredict: 120, temperature: 0.78 },
    );

    const elapsedMs = Date.now() - started;
    let text = "";

    try {
      const parsed = JSON.parse(result.text) as { text?: unknown };
      text = String(parsed.text ?? "").trim();
    } catch {
      text = String(result.text ?? "").trim();
    }

    console.log(`\nMODEL: ${model}`);
    console.log(`TIME_MS: ${elapsedMs}`);
    console.log(`OUTPUT: ${text || "<empty>"}`);
  } catch (error) {
    const elapsedMs = Date.now() - started;
    console.log(`\nMODEL: ${model}`);
    console.log(`TIME_MS: ${elapsedMs}`);
    console.log(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log("\n" + "=".repeat(88));
console.log("END QRE MOUTH MODEL BAKE-OFF");
console.log("=".repeat(88));
