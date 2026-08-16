import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { groundAuthorBeat } from "./src/services/authorBeatTruthGate.js";
import { critiqueMouthCandidates } from "./src/services/authorMouthCritic.js";

const raw = process.argv.slice(2).join(" ").trim();
if (!raw) throw new Error('Usage: pnpm exec tsx apps/api/author-mouth-probe.ts "Dog grooming service receipt | Coco, poodle, fierce, cool | returned happy, bows, balls, ties"');

const [typePart, subjectPart, evidencePart] = raw.split("|").map((x) => x.trim());
const experienceType = typePart || "short-form experience copy";
const subjectBlock = subjectPart || "the subject";
const evidenceBlock = evidencePart || "";
const subjectParts = subjectBlock.split(/[,;]+/).map((x) => x.trim()).filter(Boolean);
const subject = subjectParts[0] || "the subject";
const subjectContext = subjectParts.slice(1);
const evidenceFacts = evidenceBlock.split(/[,\n.;•]+/).map((x) => x.trim()).filter(Boolean);
const facts = [subject, ...subjectContext, ...evidenceFacts];

console.log("=== QRE FAST MOUTH PROBE ===");
console.log(`TYPE: ${experienceType}`);
console.log(`SUBJECT: ${subject}`);
console.log(`CONTEXT: ${subjectContext.join(" | ") || "none"}`);
console.log(`EVIDENCE: ${[...subjectContext, ...evidenceFacts].join(" | ")}`);

const grounded = await groundAuthorBeat({
  subject,
  facts,
  moments: [],
  memory: [],
  beat: {
    order: 1,
    role: "hook",
    gainKind: "reframe",
    change: `Find the sharpest relationship inside the supplied reality for a ${experienceType}.`,
    frontier: "What is unexpectedly interesting here?",
    nextNeed: "A fresh grounded turn.",
    necessity: "Reveal the strongest creative relationship.",
  },
});

console.log(`APPROVED: ${grounded.approvedEvidence.join(" | ")}`);
console.log(`OPPORTUNITY: ${grounded.creativeOpportunity}`);
console.log(`FORBIDDEN: ${grounded.forbiddenClaims.join(" | ") || "none"}`);

const generation = await localModelGenerate(
  [
    {
      role: "system",
      content: [
        "You are QRE's fast creative mouth probe.",
        `The output is a ${experienceType}.`,
        "Generate 6 genuinely different candidate lines, not six paraphrases.",
        "The goal is an attention-grabbing, delightful line that feels authored specifically for this subject and situation.",
        "Search the supplied CREATIVE_OPPORTUNITY first. It is a grounded direction for interpretation, not a literal event.",
        "Priority 1: character attitude — turn supplied traits + situation into a vivid comparison, stance, personification, or social framing.",
        "Priority 2: micro-interaction — if the context includes a service relationship, imagine the smallest social exchange that communicates the attitude, but write it as a playful scene/comparison rather than a claim of historical fact unless supplied.",
        "Priority 3: status inversion or negotiation framing.",
        "Priority 4: contrast and understatement.",
        "Priority 5: wordplay/double meaning. Use nouns as anchors, not as the entire joke.",
        "Example target shape: 'Walked in like her lawyer was already on retainer.' This is figurative characterization, not a literal legal event.",
        "Another target shape: 'One eyebrow went up. Negotiations began.' This is cinematic interpretation, not a claim that an actual negotiation occurred.",
        "Do NOT force bows, balls, or ties into every candidate.",
        "Use the subject name only when it makes the line hit harder; otherwise leave it implied after establishment.",
        "Do not invent a concrete event, location, object, physical placement, reaction, outcome, or second character as literal factual history.",
        "Never explain the joke. Prefer 4-10 words.",
        "Return JSON exactly: {\"texts\":[\"...\",\"...\"]}.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        EXPERIENCE_TYPE: experienceType,
        SUBJECT: subject,
        SUBJECT_CONTEXT: subjectContext,
        APPROVED_EVIDENCE: grounded.approvedEvidence,
        CREATIVE_OPPORTUNITY: grounded.creativeOpportunity,
        SOURCE_BOUNDARY: grounded.sourceBoundary,
      }),
    },
  ],
  "json",
  { numPredict: 520, temperature: 1.02 },
);

let candidates: string[] = [];
try {
  const parsed = JSON.parse(String(generation.text ?? "").trim()) as { texts?: unknown };
  if (Array.isArray(parsed.texts)) candidates = parsed.texts.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 8);
} catch {
  candidates = [];
}

console.log("CANDIDATES:");
candidates.forEach((text, index) => console.log(`[${index + 1}] ${text}`));

const critique = await critiqueMouthCandidates({
  prompt: experienceType,
  lens: "short, catchy, funny, specific, surprising, affectionate, characterful, socially observant",
  subject,
  facts,
  moments: [],
  memory: [],
  beat: grounded,
  candidates,
});

console.log(`CRITIC: ${critique.decision}`);
console.log(`WINNER: ${critique.bestIndex >= 0 ? candidates[critique.bestIndex] ?? "none" : "none"}`);
console.log(`FAILURES: ${critique.failureCodes?.join(" | ") || "none"}`);
console.log(`REPAIR: ${critique.repairDirective || critique.reason}`);
