/// <reference types="node" />
import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { groundAuthorBeat } from "./src/services/authorBeatTruthGate.js";
import { critiqueMouthCandidates } from "./src/services/authorMouthCritic.js";

const raw = process.argv.slice(2).join(" ").trim();
if (!raw) throw new Error('Usage: pnpm exec tsx apps/api/author-mouth-probe.ts "Coco returned happy with bows, balls, ties"');

const facts = raw.split(/[,\n.;â€¢]+/).map((x) => x.trim()).filter(Boolean);
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
    change: "Find the sharpest relationship inside the supplied reality.",
    frontier: "What is unexpectedly interesting here?",
    nextNeed: "A fresh grounded turn.",
    necessity: "Reveal the strongest creative relationship.",
  },
});

console.log(`APPROVED: ${grounded.approvedEvidence.join(" | ")}`);
console.log(`OPPORTUNITY: ${grounded.creativeOpportunity}`);
console.log(`FORBIDDEN: ${grounded.forbiddenClaims.join(" | ") || "none"}`);

const operators = [
  "DIRECT: state the sharpest concrete relationship plainly, with no flourish.",
  "CONTRAST: place two supplied details against each other so the collision carries the line.",
  "WORDPLAY: exploit a genuine double meaning, homonym, or semantic collision already present in the supplied words.",
  "UNDERSTATEMENT: say less than the obvious interpretation and let the reader finish the thought.",
  "REVERSAL: invert the expected framing without inventing an event or physical action.",
  "CHARACTER: give the subject an attitude or comic voice that is clearly expressive framing, not a new factual event.",
] as const;

const candidateResults = await Promise.all(operators.map(async (operator) => {
  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE's fast creative mouth probe.",
          "Generate exactly ONE candidate line.",
          operator,
          "Use only APPROVED_EVIDENCE as factual material.",
          "Do not invent a concrete event, location, object, physical placement, reaction, outcome, second character, chronology, or wardrobe state.",
          "Identity metadata is context, not a plot device unless explicitly made relevant.",
          "Prefer 3-10 words. Never explain the joke.",
          "Return JSON exactly: {\"text\":\"...\"}.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({ SUBJECT: subject, APPROVED_EVIDENCE: grounded.approvedEvidence, CREATIVE_OPPORTUNITY: grounded.creativeOpportunity }),
      },
    ],
    "json",
    { numPredict: 120, temperature: 0.88 },
  );
  try {
    const parsed = JSON.parse(String(result.text ?? "").trim()) as { text?: unknown };
    return String(parsed.text ?? "").trim();
  } catch {
    return "";
  }
}));

const candidates = candidateResults.filter(Boolean);
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

