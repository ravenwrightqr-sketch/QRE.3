import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

/**
 * SUPER STORY LAB
 *
 * This is the product test. It judges the final customer-facing language,
 * not whether internal modules returned a successful object.
 *
 * The probes are intentionally cross-domain. No probe selects a story mode.
 * The compiler must discover subject, evidence, movement, change and payoff
 * from the prompt itself.
 */

type Probe = {
  name: string;
  prompt: string;
  evidence: RegExp[];
  subject: RegExp;
  tone?: RegExp;
};

const probes: Probe[] = [
  {
    name: "Coco / grooming",
    prompt:
      "Make a funny dog groomer story about Coco to send to the client. Show Coco arriving, getting groomed, looking great, and being ready to go home.",
    evidence: [/coco/i, /groom/i, /home/i],
    subject: /coco/i,
    tone: /funny|suspicious|questions|ordinary|memorable|attitude/i,
  },
  {
    name: "Housekeeper / completion",
    prompt:
      "Make a playful story for Maria after the housekeeper cleaned the kitchen and living room. The home is ready for the client.",
    evidence: [/kitchen/i, /living room/i, /clean/i, /home/i],
    subject: /maria|house|home/i,
    tone: /playful|interesting|mood|memorable|changed/i,
  },
  {
    name: "Mechanic / recovery",
    prompt:
      "Make a confident customer story for Mike. His brakes were repaired and the car is ready to drive again.",
    evidence: [/brake/i, /car/i, /drive/i],
    subject: /mike|car|brake/i,
    tone: /ready|result|road|drive|changed/i,
  },
  {
    name: "Wedding / memory",
    prompt:
      "Create a beautiful wedding story from the ceremony to the reception and leave the couple with a memory they can keep.",
    evidence: [/wedding|ceremony/i, /reception/i, /memory/i],
    subject: /wedding|couple|ceremony/i,
    tone: /beautiful|moment|remember|keep|change/i,
  },
  {
    name: "Rave / night to sunrise",
    prompt:
      "Turn our rave night into a cinematic story: getting ready, arriving, the crowd, the peak of the night, and the walk out at sunrise.",
    evidence: [/rave/i, /crowd/i, /sunrise/i],
    subject: /rave|night|crowd/i,
    tone: /night|sunrise|moment|peak|change/i,
  },
  {
    name: "Travel / detour",
    prompt:
      "Tell a playful story about our road trip to the coast. We missed a turn, found a strange little town, ate pie, and arrived at sunset.",
    evidence: [/road trip|trip/i, /coast/i, /turn/i, /town/i, /pie/i, /sunset/i],
    subject: /trip|coast|town/i,
    tone: /playful|detour|interesting|sunset|memorable|plot/i,
  },
  {
    name: "Surfboard / journey",
    prompt:
      "Make a story about my old red surfboard traveling from the garage to the beach and becoming part of every surf trip we take.",
    evidence: [/red/i, /surfboard/i, /garage/i, /beach/i, /surf trip/i],
    subject: /surfboard/i,
    tone: /journey|beach|trip|part|remember|story/i,
  },
  {
    name: "Real estate / house",
    prompt:
      "Create a warm story for a house listing that takes someone from arriving at the front door through the rooms and ends with the feeling of finding a home.",
    evidence: [/house/i, /front door/i, /rooms?/i, /home/i],
    subject: /house|home/i,
    tone: /arriv|room|home|feeling|finding|end/i,
  },
  {
    name: "Birthday / celebration",
    prompt:
      "Make a funny birthday story from everyone arriving, the cake coming out, the surprise, the laughter, and the end of the night.",
    evidence: [/birthday/i, /cake/i, /surprise/i, /laughter/i, /night/i],
    subject: /birthday|cake|night/i,
    tone: /funny|surprise|laughter|night|memorable|changed/i,
  },
  {
    name: "Dog tag / continuing memory",
    prompt:
      "Create a story for a dog tag that can keep adding new adventures, places, and memories every time someone scans it.",
    evidence: [/dog tag/i, /adventures?/i, /places?/i, /memories?/i],
    subject: /dog tag/i,
    tone: /adventure|place|memory|next|continue|story/i,
  },
  {
    name: "Memorial / dignity",
    prompt:
      "Create a respectful memorial story for Elena that remembers her family, her garden, and the kindness people will carry forward.",
    evidence: [/elena/i, /family/i, /garden/i, /kindness/i],
    subject: /elena|garden|family/i,
    tone: /remember|family|garden|kindness|carry|memory/i,
  },
  {
    name: "Arbitrary object / red bicycle",
    prompt:
      "Turn my old red bicycle into a funny story that people can keep adding to over the years.",
    evidence: [/red/i, /bicycle/i, /old/i],
    subject: /bicycle/i,
    tone: /funny|old|red|story|years|continue|memorable/i,
  },
];

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|progression|meaning context|beat|receipt|customer-facing|internal)\b/i;
const ROBOTIC = /\b(?:acts:|adds to what is happening|becomes identifiable|goes further by|reaches the payoff by|takes the next step:|carries the result forward by|another visible detail is|the difference is visible in|the payoff remains tied to|what happens next depends on|the subject and situation are established)\b/i;
const GENERIC_SENTENCE = /^(?:the moment kept moving|the moment got underway|the result was clear|things began to move|that changed the rhythm of what followed)\.?$/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countSubject(text: string, subject: string): number {
  return (text.match(new RegExp(`\\b${escapeRegExp(subject)}\\b`, "gi")) ?? []).length;
}

function quality(text: string, probe: Probe) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const starts = sentences
    .map((value) => value.split(/\s+/)[0]?.toLowerCase())
    .filter(Boolean);
  const uniqueStarts = new Set(starts).size;
  const subjectMatch = text.match(probe.subject);
  const subject = subjectMatch?.[0] ?? "";
  const subjectCount = subject ? countSubject(text, subject) : 0;
  const metaLeaks = text.match(META)?.length ?? 0;
  const roboticLeaks = text.match(ROBOTIC)?.length ?? 0;
  const evidenceHits = probe.evidence.filter((pattern) => pattern.test(text)).length;
  const genericSentences = sentences.filter((value) => GENERIC_SENTENCE.test(value)).length;

  const evidenceScore = evidenceHits / probe.evidence.length;
  const varietyScore = sentences.length
    ? Math.min(1, uniqueStarts / Math.max(3, sentences.length * 0.60))
    : 0;
  const repetitionScore = Math.max(0, 1 - Math.max(0, subjectCount - 3) / 8);
  const proseScore = metaLeaks === 0 && roboticLeaks === 0 ? 1 : 0;
  const transformationScore = /\b(?:different|changed|change|became|from|to|result|ready|left|ended|end|carry|remember|keep|sunrise|home)\b/i.test(text)
    ? 1
    : 0.45;
  const toneScore = probe.tone?.test(text) ? 1 : 0.5;
  const specificityScore = Math.max(0, 1 - genericSentences / Math.max(1, sentences.length));
  const subjectStartRatio = sentences.length
    ? starts.filter((value) => value === subject.toLowerCase()).length / sentences.length
    : 0;

  const score = Math.round(
    100 * (
      evidenceScore * 0.28 +
      varietyScore * 0.16 +
      repetitionScore * 0.10 +
      proseScore * 0.20 +
      transformationScore * 0.12 +
      toneScore * 0.07 +
      specificityScore * 0.07
    ),
  );

  return {
    score,
    sentences: sentences.length,
    uniqueStarts,
    subject,
    subjectCount,
    subjectStartRatio,
    metaLeaks,
    roboticLeaks,
    evidenceScore,
    varietyScore,
    repetitionScore,
    transformationScore,
    toneScore,
    specificityScore,
  };
}

for (const probe of probes) {
  const compiled = compileCognitiveExperience(probe.prompt);
  const beats = compiled.story.beats.filter((beat) => beat.text.trim());
  const text = beats.map((beat) => beat.text.trim()).join(" ");
  const metrics = quality(text, probe);
  const lastKind = beats.at(-1)?.kind;

  console.log("\n" + "=".repeat(76));
  console.log(`SUPER STORY LAB — ${probe.name}`);
  console.log("=".repeat(76));
  console.log(`PROMPT\n${probe.prompt}\n`);
  console.log("FINAL CUSTOMER EXPERIENCE\n");
  for (const beat of beats) console.log(`• ${beat.text}`);
  console.log("\nQUALITY READ");
  console.log(JSON.stringify(metrics, null, 2));

  assert.ok(beats.length >= 8, `${probe.name}: too few realized beats`);
  assert.ok(metrics.evidenceScore >= 0.66, `${probe.name}: concrete evidence was lost`);
  assert.equal(metrics.metaLeaks, 0, `${probe.name}: internal language leaked into customer prose`);
  assert.equal(metrics.roboticLeaks, 0, `${probe.name}: robotic compiler prose leaked into customer prose`);
  assert.ok(metrics.subjectStartRatio <= 0.40, `${probe.name}: subject repetition is too high at sentence starts`);
  assert.ok(metrics.varietyScore >= 0.55, `${probe.name}: sentence openings are too repetitive`);
  assert.ok(metrics.transformationScore >= 0.8, `${probe.name}: transformation/payoff signal is weak`);
  assert.ok(metrics.specificityScore >= 0.75, `${probe.name}: prose is too generic`);
  assert.ok(lastKind === "payoff" || lastKind === "continuation" || lastKind === "next_step", `${probe.name}: story does not reach a real ending/continuation`);

  if (probe.name.startsWith("Memorial")) {
    assert.equal(
      /\b(?:ridiculous|nonsense|formal complaint|final boss|paint the town red|bows)\b/i.test(text),
      false,
      `${probe.name}: serious prompt was forced into comedy`,
    );
  }

  console.log(`\n✓ ${probe.name}: ${metrics.score}/100`);
}

console.log("\n" + "=".repeat(76));
console.log("SUPER STORY LAB PASSED");
console.log("The compiler is now judged on the rendered customer experience across arbitrary prompt shapes.");
console.log("=".repeat(76));
