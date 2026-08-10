import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

/**
 * Cognitive story compilation acceptance suite.
 *
 * Cross-domain on purpose: this tests that cognition survives into story
 * realization without turning the compiler into an industry template map.
 */

const cases = [
  {
    name: "absurd luxury dog spa",
    prompt: "Create an absurd luxury spa experience for Max the suspicious little dog where every treatment makes him more pampered until he becomes a celebrity.",
    required: /max|dog|spa|pamper|celebrity/i,
    forbidden: /the experience puts into focus|evidence-aware experience|the subject now means more|what the experience has revealed/i,
  },
  {
    name: "terrifying haunted house",
    prompt: "Create a genuinely terrifying haunted house where every room makes the threat less certain and more dangerous.",
    required: /haunt|terror|threat|danger|room/i,
    forbidden: /the experience puts into focus|meaningful point has been reached|the next layer/i,
  },
  {
    name: "changing scavenger hunt",
    prompt: "Build a playful scavenger hunt where every clue changes the next clue and participants discover something unexpected.",
    required: /scavenger|clue|participant|discover|next/i,
    forbidden: /the experience puts into focus|evidence-aware experience|what the experience has revealed/i,
  },
  {
    name: "family birthday folklore",
    prompt: "Make a funny birthday memory where every family member adds a more ridiculous version until one birthday becomes family folklore.",
    required: /birthday|family|memory|ridiculous|folklore|add/i,
    forbidden: /the experience puts into focus|meaningful point has been reached|the next layer/i,
  },
  {
    name: "useful repair guidance",
    prompt: "Help me diagnose a bicycle that keeps losing air and give me a practical next step based on what I find.",
    required: /bicycle|air|diagnos|repair|next|find/i,
    forbidden: /the experience puts into focus|the subject now means more|evidence-aware experience/i,
  },
  {
    name: "memory artifact",
    prompt: "My grandmother gave me this watch. Turn it into a memory experience that brings her story into the present without inventing facts.",
    required: /grandmother|watch|memory|story|present/i,
    forbidden: /the experience puts into focus|the subject now means more|what the experience has revealed/i,
  },
  {
    name: "arbitrary concrete detail",
    prompt: "A housekeeper documents a client's home after a huge cleaning day.",
    required: /housekeeper|client|home|cleaning/i,
    premiseDetail: /cleaning/i,
    forbidden: /the experience puts into focus|the subject now means more|what the experience has revealed/i,
  },
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const beatText = result.story.beats.map((beat) => beat.text).join(" ");
  const premiseDetails = result.cognition.plan.premise?.slots
    .filter((slot) => slot.role === "detail")
    .flatMap((slot) => slot.values)
    .join(" ") ?? "";

  assert(result.cognition.plan, `${testCase.name}: missing cognitive plan`);
  assert(result.cognition.plan.premise, `${testCase.name}: missing conserved premise`);
  assert(result.story.beats.length >= 3, `${testCase.name}: story collapsed to fewer than 3 beats`);
  assert(testCase.required.test(beatText), `${testCase.name}: salient prompt material was lost. Got: ${beatText}`);
  assert(!testCase.forbidden.test(beatText), `${testCase.name}: compiler leaked meta-language. Got: ${beatText}`);

  if ("premiseDetail" in testCase && testCase.premiseDetail) {
    assert(
      testCase.premiseDetail.test(premiseDetails),
      `${testCase.name}: arbitrary prompt detail was lost at the premise boundary. Got: ${premiseDetails}`,
    );
  }

  const beatIds = new Set(result.story.beats.map((beat) => beat.id));
  assert(
    result.moments.every((moment) => beatIds.has(String(moment.meta?.beatId ?? ""))),
    `${testCase.name}: moment/beat identity drifted`,
  );
  assert(
    result.scenePlan.every((scene) => beatIds.has(scene.beatId)),
    `${testCase.name}: scene/beat identity drifted`,
  );
  assert(
    result.blueprint.moments.every((moment) => {
      const beatId = String((moment.payload as { beatId?: unknown } | undefined)?.beatId ?? "");
      return beatIds.has(beatId);
    }),
    `${testCase.name}: blueprint/beat identity drifted`,
  );

  console.log(`✓ ${testCase.name}: ${result.cognition.plan.direction} / ${result.story.beats.length} beats`);
}

console.log("✓ Cognitive story compilation acceptance passed");
