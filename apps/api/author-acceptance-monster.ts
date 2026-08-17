import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

type AuthorTestInput = {
  prompt: string;
  subject: string;
  facts: string[];
  sourceMoments: string[];
  lens: string;
  memoryContext: string[];
  trajectory: string[];
  creativeLearningContext: string[];
};

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitFacts(value: string): string[] {
  return value
    .split(/[,.;\n•]+/)
    .map(clean)
    .filter(Boolean);
}

function parseInput(raw: string): AuthorTestInput {
  const sections = raw
    .split("|")
    .map(clean)
    .filter(Boolean);

  const prompt =
    sections[0] ||
    "Make a living memory from this supplied reality.";

  const subjectBlock =
    sections[1] || "the subject";

  const realityBlock =
    sections.slice(2).join(" | ");

  const subjectParts = splitFacts(subjectBlock);

  const subject =
    subjectParts.shift() ||
    clean(subjectBlock) ||
    "the subject";

  const attributes = subjectParts;

  const realityFacts = splitFacts(realityBlock);

  return {
    prompt,
    subject,
    facts: [
      ...attributes,
      ...realityFacts,
    ],
    sourceMoments: [
      ...realityFacts,
    ],
    lens:
      process.env.QRE_AUTHOR_LENS ||
      "funny, specific, affectionate, slightly fierce",
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  };
}

const raw =
  process.argv.slice(2).join(" ").trim();

if (!raw) {
  throw new Error(
    'Usage: pnpm exec tsx apps/api/author-acceptance-monster.ts "TITLE | SUBJECT, ATTRIBUTES | REALITY"',
  );
}

const input = parseInput(raw);

console.log("=".repeat(80));
console.log(
  "QRE MONSTER AUTHOR ACCEPTANCE · CANONICAL AUTHOR PATH",
);
console.log(
  "REALITY → MOVIE → COGNITION → CHARACTER READ → MOMENTUM → MOUTH",
);
console.log("=".repeat(80));
console.log(`PROMPT: ${input.prompt}`);
console.log(`SUBJECT: ${input.subject}`);
console.log(
  `FACTS: ${input.facts.join(" | ")}`,
);
console.log(
  `SOURCE MOMENTS: ${input.sourceMoments.join(
    " | ",
  )}`,
);
console.log("=".repeat(80));

const result =
  await authorBrainUniversal(input);

if (!result.sequence) {
  throw new Error(
    "No usable SequencePlay produced by canonical author path",
  );
}

console.log("\n--- CHARACTER / COGNITION ---");

const cognition =
  result.field.cognition as
    | Record<string, unknown>
    | undefined;

console.log(
  `MODE: ${String(cognition?.mode ?? "unknown")}`,
);

console.log(
  `STRATEGY: ${String(
    cognition?.chosenAttentionStrategy ??
      "unknown",
  )}`,
);

console.log(
  `CONTRADICTIONS: ${JSON.stringify(
    cognition?.contradictions ?? [],
  )}`,
);

console.log(
  `CHARACTER READ: ${JSON.stringify(
    cognition?.characterRead ?? {},
    null,
    2,
  )}`,
);

console.log("\n--- SEQUENCE ---");

console.log(
  `PREMISE: ${result.sequence.premise}`,
);

result.sequence.cuts.forEach((cut) => {
  console.log(
    `[${cut.order}] ${cut.role} · ${cut.gainKind ?? "discovery"}`,
  );
  console.log(
    `    CHANGE: ${cut.informationGain}`,
  );
  console.log(
    `    NEXT: ${cut.nextPromise ?? ""}`,
  );
  console.log(
    `    MAGNET: ${cut.momentum?.after.magnet?.magnetStrength ?? 0}`,
  );
});

console.log("\n--- MONSTER MOUTH ---");

result.scenes.forEach((scene, index) => {
  console.log(
    `[${index + 1}] ${scene.text}`,
  );
});

console.log("--- END MONSTER MOUTH ---");

console.log("\n--- DIAGNOSTICS ---");

console.log(
  `BEATS: ${result.sequence.cuts.length}`,
);

console.log(
  `SCENES: ${result.scenes.length}`,
);

console.log(
  `REALIZATION COUNT: ${String(
    result.diagnostics.realizationCountMismatch ??
      false,
  )}`,
);

console.log(
  `BEAT PLAN RETRIES: ${String(
    result.diagnostics.beatPlanRetries ??
      0,
  )}`,
);

console.log(
  `SEQUENCE CUTS REJECTED: ${String(
    result.diagnostics.sequenceCutsRejected ??
      0,
  )}`,
);

console.log(
  `ATTENTION ACCEPTED: ${String(
    (result.diagnostics.attentionEditor as { accepted?: boolean } | undefined)?.accepted ??
      false,
  )}`,
);

console.log(
  `ATTENTION SCORE: ${String(
    (result.diagnostics.attentionEditor as { sequenceScore?: number } | undefined)?.sequenceScore ??
      0,
  )}`,
);

console.log(
  `ATTENTION WEAK BEATS: ${JSON.stringify(
    (result.diagnostics.attentionEditor as { weakBeats?: number[] } | undefined)?.weakBeats ??
      [],
  )}`,
);

console.log(
  `COMPLETE: ${String(result.diagnostics.complete ?? false)}`,
);

console.log(
  `MAGNET AVG: ${String(
    result.diagnostics.magnetAverage ??
      0,
  )}`,
);

console.log(
  `MAGNET PEAK: ${String(
    result.diagnostics.magnetPeak ??
      0,
  )}`,
);

console.log("=".repeat(80));

if (!result.diagnostics.complete) {
  throw new Error(
    "MONSTER INVARIANT FAILED: canonical author path did not complete all gates",
  );
}

if (
  result.scenes.length !==
  result.sequence.cuts.length
) {
  throw new Error(
    `MONSTER INVARIANT FAILED: ${result.sequence.cuts.length} approved beats produced ${result.scenes.length} scenes`,
  );
}

if (
  Number(
    result.diagnostics.sequenceCutsRejected ??
      0,
  ) !== 0
) {
  throw new Error(
    `MONSTER INVARIANT FAILED: sequenceCutsRejected=${String(
      result.diagnostics.sequenceCutsRejected,
    )}`,
  );
}

const attention =
  result.diagnostics.attentionEditor as
    | {
        accepted?: boolean;
        sequenceScore?: number;
        weakBeats?: number[];
      }
    | undefined;

if (!attention?.accepted) {
  throw new Error(
    `MONSTER INVARIANT FAILED: attention editor rejected sequence score=${String(
      attention?.sequenceScore ?? 0,
    )} weakBeats=${JSON.stringify(
      attention?.weakBeats ?? [],
    )}`,
  );
}

if (
  Number(attention.sequenceScore ?? 0) <
  0.6
) {
  throw new Error(
    `MONSTER INVARIANT FAILED: attention score below production floor: ${String(
      attention.sequenceScore,
    )}`,
  );
}
