/// <reference types="node" />
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { mouthCraftSystem, mouthCraftUser } from "./src/services/authorMouthCraft.js";
import { critiqueMouthSequence } from "./src/services/authorMouthSequenceCritic.js";

process.env.QRE_AUTHOR_FAST_MODEL = "gemma3:12b";
process.env.QRE_AUTHOR_FALLBACK_MODEL = "";

const cases = [
  {
    name: "sparse_pet_first_memory",
    subject: "Coco",
    lens: "funny, compressed, slightly fierce",
    facts: [
      "Coco is a dog",
      "Coco is a poodle",
      "Coco likes squirrels",
      "Coco walks",
      "Coco loves bacon",
      "Coco likes some dogs",
      "Coco loves the park",
      "Coco likes summer",
      "Coco rolls in grass",
      "Coco likes apples",
    ],
  },
  {
    name: "relationship_seed",
    subject: "the relationship",
    lens: "cinematic, compressed, intimate",
    facts: [
      "met at the rave",
      "Friday December 1",
      "locked eyes",
      "felt like we knew each other forever",
      "talked all night",
      "now we are talking every day",
    ],
  },
  {
    name: "groomer_receipt",
    subject: "Coco",
    lens: "playful, sharp, stylish",
    facts: [
      "Coco came in a little nervous",
      "pink bow",
      "happy at pickup",
      "dancing around",
    ],
  },
  {
    name: "walker_receipt",
    subject: "Coco",
    lens: "spy, dry, playful",
    facts: [
      "walk started at 10:14 AM",
      "New York",
      "2.3 miles",
      "met a bulldog",
      "only drinks my PH water",
      "Coco is happily relaxing now at home",
    ],
  },
  {
    name: "housekeeping_game",
    subject: "the house",
    lens: "game",
    facts: [
      "Knoll Lane",
      "kitchen cleaned",
      "two bathrooms cleaned",
      "mess removed",
      "cleanup complete",
      "geo location logged",
    ],
  },
  {
    name: "wedding_memory",
    subject: "the wedding",
    lens: "cinematic, restrained, emotional",
    facts: [
      "they were nervous",
      "the doors opened",
      "nobody stayed composed",
      "the vows landed",
      "everything changed",
    ],
  },
  {
    name: "restaurant_memory",
    subject: "the table",
    lens: "slick, funny, understated",
    facts: [
      "dinner started quietly",
      "the special arrived",
      "someone ordered another",
      "the table changed sides",
      "nobody was leaving",
    ],
  },
  {
    name: "native_material_beats_lens",
    subject: "the moment",
    lens: "",
    facts: [
      "she had to dodge the bulldog of the house watching her around every corner",
      "the kitchen was cleaned",
      "the work was finished",
    ],
  },
];

function parseTexts(raw: string): string[] {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(cleaned) as { texts?: unknown };
    if (Array.isArray(value.texts)) return value.texts.map((text) => String(text ?? "").trim()).filter(Boolean);
  } catch {
    // Fallback is diagnostics only; malformed model JSON is not a pass.
  }
  return cleaned.split(/\r?\n+/).map((line) => line.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
}

function validCutShape(cuts: string[]): boolean {
  return cuts.length >= 3 && cuts.every((cut) => cut.split(/\s+/).filter(Boolean).length <= 12);
}

function summarizePlan(plan: ReturnType<typeof buildAuthorCognitivePlan>): string {
  const movie = plan.selectedMovie;
  return JSON.stringify({
    selectedFrame: plan.selectedFrame,
    chosenAttentionStrategy: plan.chosenAttentionStrategy,
    movie: movie
      ? {
          lens: movie.lens,
          thesis: movie.storyThesis,
          trajectory: movie.trajectory,
          evidence: movie.evidence,
          payoff: movie.payoff,
        }
      : null,
    operatorMix: plan.operatorMix,
    callbackTargets: plan.callbackTargets,
    antiRepetitionRules: plan.antiRepetitionRules,
    currentEvidence: plan.currentEvidence,
  });
}

for (const item of cases) {
  const graph = buildAuthorRealityGraph({
    prompt: `Create a QRE sequence from supplied reality for ${item.subject}.`,
    subject: item.subject,
    facts: item.facts,
    sourceMoments: [],
  });

  const plan = buildAuthorCognitivePlan({
    prompt: `Create a QRE sequence from supplied reality for ${item.subject}.`,
    lens: item.lens,
    subject: item.subject,
    facts: item.facts,
    sourceMoments: [],
    realityGraph: graph,
    movieMode: true,
  });

  const approvedBeats = plan.selectedMovie?.trajectory ?? [];
  if (!approvedBeats.length) {
    console.log(`\nCASE: ${item.name}\nCOGNITION: no approved trajectory\nDECISION: RETRY`);
    continue;
  }

  const system = [
    mouthCraftSystem("playful"),
    "QRE SEQUENCE ACCEPTANCE MODE.",
    "The approved trajectory is the complete sequence skeleton.",
    "Realize EVERY approved beat as exactly one cut, in order.",
    "Do not collapse the trajectory into one sentence.",
    "A cut may be 1-12 words, a fragment, a question, a single-word hit, or a short sentence.",
    "Read the complete trajectory before writing any cut.",
    "The sequence should move attention from cut to cut; omission is preferred over repetition.",
    "A preference can become an open question; never turn it into an invented event.",
    "If the supplied evidence is already strong and distinctive, preserve that native material instead of forcing a genre.",
    "Return JSON exactly: {\"texts\":[\"cut 1\",\"cut 2\",...]}.",
  ].join("\n");

  const user = mouthCraftUser({
    prompt: `Create the QRE sequence for ${item.name}.`,
    lens: plan.selectedFrame,
    subject: item.subject,
    facts: item.facts,
    moments: [],
    memory: [],
    trajectory: approvedBeats.map((beat) => JSON.stringify(beat)),
    beats: approvedBeats,
    subjectTruth: item.subject,
  });

  const result = await localModelGenerate(
    [{ role: "system", content: system }, { role: "user", content: user }],
    "json",
    { numPredict: 700, temperature: 0.86 },
  );

  const cuts = parseTexts(result.text);
  const shapeOk = validCutShape(cuts);
  const sequence = await critiqueMouthSequence({
    subject: item.subject,
    lens: plan.selectedFrame,
    facts: item.facts,
    approvedBeats,
    cuts,
  });

  const accepted = shapeOk && sequence.decision === "accept";

  console.log("\n" + "=".repeat(100));
  console.log(`CASE: ${item.name}`);
  console.log(`REQUESTED LENS: ${item.lens || "NONE"}`);
  console.log(`SELECTED FRAME: ${plan.selectedFrame}`);
  console.log(`ATTENTION: ${plan.chosenAttentionStrategy}`);
  console.log(`APPROVED CUT COUNT: ${approvedBeats.length}`);
  console.log(`REALIZED CUT COUNT: ${cuts.length}`);
  console.log(`CUT SHAPE: ${shapeOk ? "PASS" : "FAIL (need >=3 cuts; each <=12 words)"}`);
  console.log("QRE SEQUENCE:");
  cuts.forEach((cut, index) => console.log(`  [${index + 1}] ${cut}`));
  console.log(`SEQUENCE CRITIC: ${sequence.decision}`);
  console.log(`FINAL DECISION: ${accepted ? "ACCEPT" : "RETRY"}`);
  console.log(`FAILURES: ${sequence.failureCodes.join(" | ") || (shapeOk ? "none" : "multi_cut_shape_failure")}`);
  console.log(`SCORES: truth=${sequence.scores.truth.toFixed(2)} distinct=${sequence.scores.cutDistinctness.toFixed(2)} progression=${sequence.scores.progression.toFixed(2)} attention=${sequence.scores.attentionPull.toFixed(2)} specificity=${sequence.scores.specificity.toFixed(2)} creative=${sequence.scores.creativeForce.toFixed(2)} lens=${sequence.scores.lensFit.toFixed(2)} payoff=${sequence.scores.payoff.toFixed(2)} overall=${sequence.scores.overall.toFixed(2)}`);
  console.log(`PLAN DEBUG: ${summarizePlan(plan)}`);
}

console.log("\nQRE CANONICAL MULTI-CUT ACCEPTANCE COMPLETE");
