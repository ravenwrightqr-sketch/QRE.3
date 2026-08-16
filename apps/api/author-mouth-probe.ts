import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { groundAuthorBeat } from "./src/services/authorBeatTruthGate.js";
import { critiqueMouthCandidates } from "./src/services/authorMouthCritic.js";

const raw = process.argv.slice(2).join(" ").trim();
if (!raw) throw new Error('Usage: pnpm exec tsx apps/api/author-mouth-probe.ts "Coco returned happy with bows, balls, ties"');

const facts = raw.split(/[,\n.;•]+/).map((x) => x.trim()).filter(Boolean);
const subject = facts[0] ?? "the subject";
const evidence = facts.slice(1);

console.log("=== QRE FAST MOUTH PROBE ===");
console.log(`SUBJECT: ${subject}`);
console.log(`EVIDENCE: ${evidence.join(" | ")}`);

const grounded = await groundAuthorBeat({
  subject,
  facts,
  moments: [],
  memory: [],
  beat: {
    order: 1,
    role: "hook",
    gainKind: "reframe",
    change: `Find the sharpest relationship inside the supplied reality.`,
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
        "Generate 6 radically different candidate lines from the supplied evidence and creative opportunity.",
        "Search different operators: direct, contrast, wordplay, understatement, reversal, character.",
        "Do not invent a concrete event, location, object, physical placement, reaction, outcome, or second character.",
        "Identity metadata is context, not a plot device unless explicitly made relevant.",
        "Never explain the joke. Prefer 3-9 words per candidate.",
        "Return JSON exactly: {\"texts\":[\"...\",\"...\"]}.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({ SUBJECT: subject, APPROVED_EVIDENCE: grounded.approvedEvidence, CREATIVE_OPPORTUNITY: grounded.creativeOpportunity }),
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
  prompt: "Fast creative probe",
  lens: "funny, specific, surprising, affectionate",
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
