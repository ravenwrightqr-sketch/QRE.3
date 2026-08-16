import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { groundAuthorBeat } from "./src/services/authorBeatTruthGate.js";
import { critiqueMouthCandidates } from "./src/services/authorMouthCritic.js";

const raw = process.argv.slice(2).join(" ").trim();
if (!raw) throw new Error('Usage: pnpm exec tsx apps/api/author-mouth-probe.ts "Dog grooming service receipt | Coco, poodle, fierce, cool | returned happy, bows, balls, ties"');

const [typePart, subjectPart, evidencePart] = raw.split("|").map((x) => x.trim());
const experienceType = typePart || "short-form experience copy";
const subjectBlock = subjectPart || "the subject";
const evidenceBlock = evidencePart || subjectPart || "";
const subjectParts = subjectBlock.split(/[,;]+/).map((x) => x.trim()).filter(Boolean);
const subject = subjectParts[0] || "the subject";
const subjectContext = subjectParts.slice(1);
const facts = [subject, ...evidenceBlock.split(/[,\n.;•]+/).map((x) => x.trim()).filter(Boolean)];

console.log("=== QRE FAST MOUTH PROBE ===");
console.log(`TYPE: ${experienceType}`);
console.log(`SUBJECT: ${subject}`);
console.log(`CONTEXT: ${subjectContext.join(" | ") || "none"}`);
console.log(`EVIDENCE: ${facts.slice(1).join(" | ")}`);

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
        "Search these operators in order: direct, contrast, wordplay, understatement, reversal, character.",
        "One strong relationship is enough. Do not force every fact into the line.",
        "Use the subject name only when it makes the line hit harder; otherwise leave it implied after establishment.",
        "Do not invent a concrete event, location, object, physical placement, reaction, outcome, or second character.",
        "Idioms, metaphor, personification, double meaning, and wordplay are encouraged when grounded in supplied language and clearly nonliteral.",
        "Never explain the joke. Prefer 3-9 words.",
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
      }),
    },
  ],
  "json",
  { numPredict: 420, temperature: 0.95 },
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
  lens: "short, catchy, funny, specific, surprising, affectionate",
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
