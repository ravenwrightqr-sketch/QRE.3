import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

/**
 * SUPER STORY LAB
 *
 * This is the product test. It prints the actual customer-facing story and
 * scores the properties that determine whether the compiler is useful in the
 * real business: evidence retention, narrative motion, transformation,
 * sentence variety, creative specificity, and zero internal-language leakage.
 *
 * Run with:
 * pnpm --filter @qre/engine exec tsx src/compiler/tests/superStoryLab.ts
 */

type Probe = {
  name: string;
  prompt: string;
  evidence: RegExp[];
  tone?: RegExp;
  creative?: RegExp;
};

const probes: Probe[] = [
  {
    name: "Coco / grooming",
    prompt:
      "Make a funny dog groomer story about Coco to send to the client. Show Coco arriving, getting groomed, looking great, and being ready to go home.",
    evidence: [/coco/i, /groom/i, /home/i],
    tone: /funny|suspicious|interesting|attitude|drama/i,
    creative: /bubbles|foot rubs|bows|celebrity|paint the town red/i,
  },
  {
    name: "Housekeeper / completion",
    prompt:
      "Make a playful story for Maria after the housekeeper cleaned the kitchen and living room. The home is ready for the client.",
    evidence: [/kitchen/i, /living room/i, /clean/i],
    tone: /playful|stubborn|finish|spot|crumb|mood|interesting/i,
    creative: /crumb|spot|surrender|life together|mood/i,
  },
  {
    name: "Mechanic / recovery",
    prompt:
      "Make a confident customer story for Mike. His brakes were repaired and the car is ready to drive again.",
    evidence: [/brake/i, /car/i, /drive/i],
    tone: /ready|test|result|changed|road|drive/i,
  },
  {
    name: "Wedding / memory",
    prompt:
      "Create a beautiful wedding story from the ceremony to the reception and leave the couple with a memory they can keep.",
    evidence: [/wedding|ceremony|reception/i, /memory/i],
    tone: /beautiful|moment|remember|story|celebrat|keeping/i,
  },
  {
    name: "Bicycle / continuation",
    prompt:
      "Turn my old red bicycle into a funny story that people can keep adding to.",
    evidence: [/bicycle/i, /red/i],
    tone: /funny|story|old|interesting|memory|chapter/i,
    creative: /ordinary|interesting|surprise|second life|story/i,
  },
  {
    name: "Restaurant / ordinary becomes memorable",
    prompt:
      "Write a fun story about a small restaurant where a tired cook somehow turns a chaotic dinner into the best meal of the night.",
    evidence: [/restaurant/i, /cook/i, /dinner|meal/i],
    tone: /fun|chaos|best|night|moment|story|changed/i,
    creative: /plot|interesting|questionable|best|ordinary/i,
  },
  {
    name: "Travel / detour",
    prompt:
      "Tell a playful story about our road trip to the coast. We missed a turn, found a strange little town, ate pie, and arrived at sunset.",
    evidence: [/road trip|trip/i, /coast/i, /sunset/i, /pie/i],
    tone: /turn|detour|sunset|pie|town|story|interesting/i,
    creative: /route|detour|plot twist|landing/i,
  },
  {
    name: "Serious / no forced comedy",
    prompt:
      "Create a respectful memorial story for Elena that remembers her family, her garden, and the kindness people will carry forward.",
    evidence: [/Elena/i, /family/i, /garden/i, /kindness/i],
    tone: /remember|garden|family|kindness|carry|memory/i,
  },
];

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|progression|meaning context|beat|receipt|customer-facing)\b/i;
const ROBOTIC = /\b(?:acts:|adds to what is happening|becomes identifiable|goes further by|reaches the payoff by|takes the next step:|carries the result forward by|another visible detail is|the difference is visible in|the payoff remains tied to|what happens next depends on|the subject and situation are established)\b/i;

function countSubject(text: string, subject: string): number {
  const normalized = subject.trim();
  if (!normalized) return 0;
  return (text.match(new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "gi")) ?? []).length;
}

function quality(text: string, subject: string, prompt: Probe) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const starts = sentences.map((value) => value.split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
  const uniqueStarts = new Set(starts).size;
  const subjectCount = countSubject(text, subject);
  const metaLeaks = text.match(META)?.length ?? 0;
  const roboticLeaks = text.match(ROBOTIC)?.length ?? 0;
  const evidenceHits = prompt.evidence.filter((pattern) => pattern.test(text)).length;

  const evidenceScore = evidenceHits / prompt.evidence.length;
  const varietyScore = sentences.length ? Math.min(1, uniqueStarts / Math.max(3, sentences.length * 0.65)) : 0;
  const repetitionScore = Math.max(0, 1 - Math.max(0, subjectCount - 3) / 8);
  const proseScore = metaLeaks === 0 && roboticLeaks === 0 ? 1 : 0;
  const transformationScore = /\b(?:different|changed|came out|left|walked out|by the end|result|ready|remember|became)\b/i.test(text) ? 1 : 0.45;
  const toneScore = prompt.tone?.test(text) ? 1 : 0.5;
  const creativeScore = prompt.creative ? (prompt.creative.test(text) ? 1 : 0) : 1;
  const subjectStartRatio = sentences.length
    ? starts.filter((value) => value === subject.toLowerCase()).length / sentences.length
    : 0;

  const score = Math.round(
    100 * (
      evidenceScore * 0.25 +
      varietyScore * 0.15 +
      repetitionScore * 0.10 +
      proseScore * 0.20 +
      transformationScore * 0.10 +
      toneScore * 0.10 +
      creativeScore * 0.10
    ),
  );

  return {
    score,
    sentences: sentences.length,
    uniqueStarts,
    subjectCount,
    subjectStartRatio,
    metaLeaks,
    roboticLeaks,
    evidenceScore,
    varietyScore,
    transformationScore,
    toneScore,
    creativeScore,
  };
}

for (const probe of probes) {
  const compiled = compileCognitiveExperience(probe.prompt);
  const beats = compiled.story.beats.filter((beat) => beat.text.trim());
  const text = beats.map((beat) => beat.text.trim()).join(" ");
  const subject = compiled.cognition.subject.value || compiled.observation.subject || "subject";
  const metrics = quality(text, subject, probe);

  console.log("\n" + "=".repeat(72));
  console.log(`SUPER STORY LAB — ${probe.name}`);
  console.log("=".repeat(72));
  console.log(`PROMPT\n${probe.prompt}\n`);
  console.log("CUSTOMER-FACING STORY\n");
  for (const beat of beats) console.log(`• ${beat.text}`);
  console.log("\nQUALITY READ");
  console.log(JSON.stringify({ subject, ...metrics }, null, 2));

  assert.ok(beats.length >= 5, `${probe.name}: too few realized beats`);
  assert.ok(metrics.evidenceScore >= 0.66, `${probe.name}: concrete evidence was lost`);
  assert.equal(metrics.metaLeaks, 0, `${probe.name}: internal/customer-label vocabulary leaked into prose`);
  assert.equal(metrics.roboticLeaks, 0, `${probe.name}: robotic beat template leaked into customer prose`);
  assert.ok(metrics.subjectStartRatio <= 0.40, `${probe.name}: subject repetition is too high at sentence starts`);
  assert.ok(metrics.varietyScore >= 0.60, `${probe.name}: sentence openings are too repetitive`);
  assert.ok(metrics.transformationScore >= 0.8, `${probe.name}: transformation/payoff signal is weak`);
  if (probe.creative) assert.equal(metrics.creativeScore, 1, `${probe.name}: creative specificity was lost`);
  if (probe.name.startsWith("Serious")) {
    assert.equal(/\b(?:ridiculous|nonsense|formal complaint|international importance|final boss|bows|paint the town red)\b/i.test(text), false, `${probe.name}: serious prompt was forced into comedy`);
  }

  console.log(`\n✓ ${probe.name}: ${metrics.score}/100`);
}

console.log("\n" + "=".repeat(72));
console.log("SUPER STORY LAB PASSED");
console.log("The compiler is now being judged on the thing customers actually see.");
console.log("=".repeat(72));
