import type { AuthorBrainTruth, SequencePlay } from "@qre/contracts";
import { polishAuthorScenes } from "./src/services/authorMouthMonster.js";
import { unsupportedIdentityClaims } from "./src/services/authorUnknownBoundary.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR MOUTH SEQUENCE FAILURE: ${message}`);
}

const input = {
  prompt: "Turn supplied grooming facts into a sharp, playful sequence with forward pull.",
  lens: "specific, compressed, mischievous, earned",
  subject: "Coco",
  subjectTruth: { name: "Coco", species: "dog" },
  facts: [
    "Coco arrived.",
    "Coco was nervous on arrival.",
    "Coco had blue bows.",
    "Coco was happy after the bath.",
    "Coco jumped when picked up.",
  ],
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
} as AuthorBrainTruth;

const sequence = {
  cuts: [
    {
      order: 1,
      role: "arrival",
      gainKind: "new_fact",
      informationGain: "Coco arrived.",
      nextPromise: "Something about the visit changes.",
      necessity: { reason: "Establish the subject once." },
    },
    {
      order: 2,
      role: "reframe",
      gainKind: "reframe",
      informationGain: "Coco was nervous on arrival.",
      nextPromise: "The state does not stay there.",
      necessity: { reason: "Create a state contrast." },
    },
    {
      order: 3,
      role: "reframe",
      gainKind: "reframe",
      informationGain: "Blue bows were present.",
      nextPromise: "The detail can acquire attitude.",
      necessity: { reason: "Use a concrete supplied detail." },
    },
    {
      order: 4,
      role: "payoff",
      gainKind: "payoff",
      informationGain: "Coco was happy after the bath.",
      nextPromise: "End on the supplied state change.",
      necessity: { reason: "Land the supplied transition." },
    },
  ],
} as unknown as SequencePlay;

const result = await polishAuthorScenes(input, sequence, "playful");

assert(result.scenes.length === 4, `expected 4 scenes, got ${result.scenes.length}`);

const texts = result.texts.map((text) => String(text).trim()).filter(Boolean);
const subjectMentions = texts.reduce(
  (count, text) => count + (text.match(/\bCoco\b/gi) ?? []).length,
  0,
);

const unsupportedIdentity = texts.flatMap((text) =>
  unsupportedIdentityClaims(text, {
    subject: input.subject,
    subjectTruth: input.subjectTruth,
    facts: input.facts,
    moments: input.sourceMoments ?? [],
    memory: input.memoryContext ?? [],
  }),
);

console.log("AUTHOR MOUTH SEQUENCE ACCEPTANCE");
console.log(`SCENES=${texts.length}`);
texts.forEach((text, index) => console.log(`${index + 1}. ${text}`));
console.log(`SUBJECT_MENTIONS=${subjectMentions}`);
console.log(`UNSUPPORTED_IDENTITY=${[...new Set(unsupportedIdentity)].join(" | ") || "none"}`);
console.log(`RETRIES=${result.retries}`);
console.log(`FALLBACKS=${result.fallbacks}`);

assert(unsupportedIdentity.length === 0, "Mouth produced an identity claim not established by supplied reality");
assert(subjectMentions <= 1, "subject was repeatedly re-announced instead of becoming active context");

console.log("AUTHOR MOUTH SEQUENCE ACCEPTANCE: PASS");
