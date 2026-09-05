import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type Case = {
  name: string;
  subject: string;
  facts: string[];
  prompt: string;
  minimumCuts: number;
  requiredRealityAnchors: string[];
};

const cases: Case[] = [
  {
    name: "MILO · DOG TAG",
    subject: "Milo",
    facts: ["likes small dogs", "bacon", "apples"],
    prompt: [
      "Create a living dog-tag style video for Milo.",
      "Use the supplied facts as the complete reality.",
      "Make Milo feel like a real character through selection, pacing, and reveal.",
      "Do not invent events, dialogue, places, people, objects, actions, or relationships.",
      "Do not turn the result into a fact list or a retrospective report.",
    ].join(" "),
    minimumCuts: 2,
    requiredRealityAnchors: ["small dogs", "bacon", "apples"],
  },
  {
    name: "COCO · DOG GROOMER VIDEO",
    subject: "Coco",
    facts: [
      "walked in like a lawyer called",
      "eyebrow up",
      "water?",
      "bows",
      "bows",
      "peace is temporary",
    ],
    prompt: [
      "Create a short dog-groomer video for Coco.",
      "Treat the supplied lines as the complete reality and creative evidence.",
      "Find the interesting dramatic thread inside them and make the viewer want the next cut.",
      "Do not invent a new event, person, place, object, action, dialogue, or backstory.",
      "Do not narrate the visit like an after-the-fact service report.",
      "Do not repeat Coco as the subject at the start of every cut.",
    ].join(" "),
    minimumCuts: 3,
    requiredRealityAnchors: ["lawyer", "eyebrow", "water", "bow", "peace is temporary"],
  },
];

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalized(value: string): string {
  return clean(value).toLowerCase().replace(/[’']/g, "'");
}

function firstWords(cut: string): string {
  return normalized(cut).split(/\s+/).slice(0, 3).join(" ");
}

function meaningfulWords(value: string): string[] {
  return normalized(value)
    .replace(/[^a-z0-9'’-]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .filter(
      (word) =>
        !new Set([
          "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "through", "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are", "was", "were", "be", "been", "being", "as", "into", "my", "your", "our", "their", "his", "her", "its", "he", "she", "they", "them", "you", "we", "me",
        ]).has(word),
    );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR ACCEPTANCE FAILED: ${message}`);
}

for (const testCase of cases) {
  const result = await authorBrainCanonical({
    prompt: testCase.prompt,
    subject: testCase.subject,
    facts: testCase.facts,
    sourceMoments: testCase.facts,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });

  const output = result.scenes.map((scene) => clean(scene.text)).filter(Boolean);
  const outputText = output.join(" ");
  const evidenceText = [
    ...(result.movie?.evidence ?? []),
    ...(result.movie?.trajectory.flatMap((step) => step.viewerChange ? [step.viewerChange] : []) ?? []),
  ].join(" ");

  console.log(`\n=== ${testCase.name} ===`);
  console.log(`MODEL: ${result.diagnostics.model}`);
  console.log(`MODE: ${result.realizationMode}`);
  console.log(`CALLS: ${result.diagnostics.modelCalls}`);
  console.log(`CUTS: ${output.length}`);
  output.forEach((line, index) => console.log(`[${index + 1}] ${line}`));

  assert(result.diagnostics.qualityStatus === "ACCEPTED", "canonical Author did not accept the grounded sequence");
  assert(result.diagnostics.renderable === true, "canonical Author result is not renderable");
  assert(result.diagnostics.complete === true, "canonical Author result is incomplete");
  assert(output.length >= testCase.minimumCuts, `expected at least ${testCase.minimumCuts} cuts, got ${output.length}`);
  assert(result.sequence.cuts.length === output.length, "scene/cut counts diverged");
  assert(
  result.sequence.cuts.length > 0
    ? result.diagnostics.modelCalls === 1
    : result.diagnostics.modelCalls === 0,
  "canonical Mouth must use exactly one model realization request when a sequence exists",
);
  assert(result.sequence.cuts.every((cut) => cut.sourceIds.length > 0), "a cut lost source provenance");

  const expectedRealityUnits = new Set(testCase.facts.map(normalized)).size;
  const sourceIds = new Set(result.sequence.cuts.flatMap((cut) => cut.sourceIds));
  assert(sourceIds.size >= expectedRealityUnits, "supplied reality was lost before authored provenance");

  for (const anchor of testCase.requiredRealityAnchors) {
    assert(
      normalized(evidenceText).includes(normalized(anchor)),
      `required supplied reality was lost before Movie/Mouth: ${anchor}`,
    );
  }

  /*
   * Mouth is allowed to paraphrase. We therefore test semantic density rather
   * than literal source wording. A multi-token source fact may become a short
   * human line, but it cannot collapse into a bare category label such as
   * "A preference." and discard the participant that gives the fact meaning.
   */
  for (let index = 0; index < result.movie!.trajectory.length; index += 1) {
    const source = clean(result.movie!.trajectory[index]?.viewerChange);
    const cut = clean(output[index]);
    if (!source || !cut) continue;

    const sourceWordCount = meaningfulWords(source).length;
    const cutWordCount = meaningfulWords(cut).length;

    assert(
      !(sourceWordCount >= 3 && cutWordCount <= 2),
      `Mouth collapsed multi-part supplied meaning into a category label: ${cut}`,
    );
  }

  const subject = normalized(testCase.subject);
  assert(
    output.every((cut) => !new RegExp(`^${subject}\\s+(?:is|was|did|does|has|had)\\b`, "i").test(cut)),
    "subject-name identity narration leaked into the opening of a cut",
  );

  assert(
    !output.some((cut) => /^(?:here(?:'s| is)|this video|in this visit|today we|we can see)\b/i.test(cut)),
    "retrospective or presentation-meta narration leaked into the visible sequence",
  );

  assert(output.some((cut) => /[.!?]/.test(cut)), "authored sequence has no actual language realization");

  const repeatedOpenings = output.map(firstWords);
  assert(
    new Set(repeatedOpenings).size >= Math.max(1, repeatedOpenings.length - 1),
    "cuts are mechanically repeating the same opening",
  );

  console.log("STATUS: GREEN");
}

console.log("\nAUTHOR PRODUCTION ACCEPTANCE GREEN");
