import "dotenv/config";

/**
 * One-shot Author development bench.
 *
 * This intentionally does not start the API, touch Prisma, persist anything,
 * or create a second Author implementation. It exercises the same canonical
 * Author orchestrator used by production.
 *
 * Usage:
 *   pnpm exec tsx apps/api/author-play.ts
 *   pnpm exec tsx apps/api/author-play.ts "make a dog tag" "Coco" "Pomeranian|loves walks|squirrels|bacon|apples"
 *
 * Facts are pipe-delimited. The bench sends the same supplied facts as
 * source moments for a starter experience and starts with empty personal
 * memory. Add --memory "..." values only when testing returning users.
 */

type PlayInput = {
  prompt: string;
  subject: string;
  facts: string[];
  memoryContext: string[];
  returning: boolean;
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function splitFacts(value: string): string[] {
  return value
    .split("|")
    .map(clean)
    .filter(Boolean);
}

function parseArgs(argv: string[]): PlayInput {
  const positional: string[] = [];
  const memoryContext: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--memory") {
      const memory = clean(argv[index + 1]);
      if (memory) memoryContext.push(memory);
      index += 1;
      continue;
    }

    if (value === "--returning") continue;

    positional.push(value);
  }

  const prompt =
    clean(positional[0]) ||
    "Make a fun living dog tag from the supplied reality.";

  const subject = clean(positional[1]) || "Coco";

  const facts =
    positional[2]
      ? splitFacts(positional[2])
      : [
          "Pomeranian",
          "loves walks",
          "squirrels",
          "bacon",
          "apples",
        ];

  return {
    prompt,
    subject,
    facts,
    memoryContext,
    returning:
      argv.includes("--returning") || memoryContext.length > 0,
  };
}

const input = parseArgs(process.argv.slice(2));

// Keep this development path deliberately local and single-shot.
process.env.QRE_AUTHOR_DEBUG_RAW = "false";

const { authorBrainCanonical } = await import(
  "./src/services/authorBrainCanonical.js"
);

const started = Date.now();

console.log("=".repeat(72));
console.log("QRE AUTHOR PLAY");
console.log("CANONICAL AUTHOR · ONE CASE · NO DATABASE");
console.log("=".repeat(72));
console.log(`PROMPT: ${input.prompt}`);
console.log(`SUBJECT: ${input.subject}`);
console.log(`FACTS: ${input.facts.join(" | ")}`);
console.log(
  `MEMORY: ${input.memoryContext.length ? input.memoryContext.join(" | ") : "none"}`,
);

try {
  const result = await authorBrainCanonical({
    prompt: input.prompt,
    subject: input.subject,
    facts: input.facts,
    sourceMoments: input.facts,
    memoryContext: input.memoryContext,
    trajectory: input.memoryContext,
    creativeLearningContext: [],
    returning: input.returning,
  });

  const scenes = result.scenes
    .map((scene) => clean(scene.text))
    .filter(Boolean);

  console.log(`\nTIME: ${((Date.now() - started) / 1000).toFixed(2)}s`);
  console.log(`MODEL: ${result.diagnostics.model}`);
  console.log(`MODEL CALLS: ${result.diagnostics.modelCalls}`);
  console.log(`STATUS: ${result.diagnostics.qualityStatus}`);
  console.log(`RENDERABLE: ${result.diagnostics.renderable}`);
  console.log(`COMPLETE: ${result.diagnostics.complete}`);
  console.log(`FRAME: ${result.brief.angle}`);
  console.log(`MOVIE: ${result.movie?.id ?? "none"}`);
  console.log("\n--- MOVING TEXT ---");

  scenes.forEach((line, index) => {
    console.log(`[${index + 1}] ${line}`);
  });

  console.log("--- END MOVING TEXT ---");

  console.log("\n--- PROVENANCE ---");
  result.sequence.cuts.forEach((cut) => {
    console.log(
      `[${cut.order}] ${cut.sourceIds.join(", ") || "<none>"}`,
    );
  });
  console.log("--- END PROVENANCE ---");

  if (!result.diagnostics.complete || !result.diagnostics.renderable) {
    throw new Error(
      "Canonical Author returned an incomplete or non-renderable experience",
    );
  }

  if (scenes.length !== result.sequence.cuts.length) {
    throw new Error("Canonical Author scene/sequence count mismatch");
  }
} catch (error) {
  console.error(
    "\nAUTHOR PLAY FAILED:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
