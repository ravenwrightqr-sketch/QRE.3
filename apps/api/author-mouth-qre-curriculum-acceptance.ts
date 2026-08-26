/// <reference types="node" />
import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { critiqueMouthCandidates } from "./src/services/authorMouthCritic.js";
import { mouthCraftSystem } from "./src/services/authorMouthCraft.js";

process.env.QRE_AUTHOR_FAST_MODEL = "gemma3:12b";
process.env.QRE_AUTHOR_FALLBACK_MODEL = "";

const cases = [
  {
    name: "sparse_pet_memory",
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
    name: "housekeeping_lens",
    subject: "the house",
    lens: "heist / courtroom / game",
    facts: [
      "two bathrooms cleaned",
      "kitchen cleaned",
      "mess removed",
      "cleanup complete",
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
    name: "possibility_boundary",
    subject: "Coco",
    lens: "curious, playful",
    facts: [
      "Coco likes squirrels",
      "Coco loves the park",
    ],
  },
];

function extractLine(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(cleaned) as { texts?: unknown; text?: unknown };
    if (Array.isArray(value.texts)) return String(value.texts[0] ?? "").trim();
    if (typeof value.text === "string") return value.text.trim();
  } catch {}
  return cleaned;
}

for (const item of cases) {
  const system = `${mouthCraftSystem("playful")}

QRE CURRICULUM CASE.
Realize the supplied world, not a generic story.
Return exactly one short viewer-facing line.
The subject is already established.
Use the lens as framing only; never add facts from the genre.
If the evidence is a preference or possibility, a question is allowed but an event is not.
Return JSON exactly: {"texts":["..."]}.`;

  const user = JSON.stringify({
    subject: item.subject,
    lens: item.lens,
    suppliedEvidence: item.facts,
    task: "Find the sharpest truthful attention realization available right now.",
  });

  const result = await localModelGenerate(
    [{ role: "system", content: system }, { role: "user", content: user }],
    "json",
    { numPredict: 180, temperature: 0.86 },
  );

  const line = extractLine(result.text);
  const critique = await critiqueMouthCandidates({
    prompt: "Universal QRE Mouth curriculum",
    lens: item.lens,
    subject: item.subject,
    facts: item.facts,
    moments: [],
    memory: [],
    beat: { role: "realization", suppliedEvidence: item.facts, attentionTarget: "make the supplied material hit" },
    candidates: line ? [line] : [],
  });

  const score = critique.scores?.[0];
  console.log("\n" + "=".repeat(88));
  console.log(`CASE: ${item.name}`);
  console.log(`LENS: ${item.lens}`);
  console.log(`EVIDENCE: ${item.facts.join(" | ")}`);
  console.log(`GEMMA: ${line || "<empty>"}`);
  console.log(`CRITIC: ${critique.decision}`);
  console.log(`FAILURES: ${critique.failureCodes?.join(" | ") || "none"}`);
  console.log(`VIEWER_REWARD=${score?.viewerReward ?? "n/a"} ATTENTION_PULL=${score?.attentionPull ?? "n/a"} CREATIVE_FORCE=${score?.creativeForce ?? "n/a"} AFTERIMAGE=${score?.afterimage ?? "n/a"}`);
}

console.log("\nQRE MOUTH CURRICULUM COMPLETE");
