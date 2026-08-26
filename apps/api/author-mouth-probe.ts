/// <reference types="node" />
import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { groundAuthorBeat } from "./src/services/authorBeatTruthGate.js";
import { critiqueMouthCandidates } from "./src/services/authorMouthCritic.js";

const rawArgs = process.argv.slice(2);
const subjectFlagIndex = rawArgs.findIndex((value) => value === "--subject");
const subject = subjectFlagIndex >= 0 ? String(rawArgs[subjectFlagIndex + 1] ?? "").trim() : "";
const promptParts = rawArgs.filter((_, index) => index !== subjectFlagIndex && index !== subjectFlagIndex + 1);
const raw = promptParts.join(" ").trim();

if (!subject || !raw) {
  throw new Error(
    'Usage: pnpm exec tsx apps/api/author-mouth-probe.ts --subject "Coco" "Coco was nervous, Coco had blue bows, Coco was happy after the bath, Coco jumped when picked up"',
  );
}

const facts = raw.split(/[,\n.;•]+/).map((x) => x.trim()).filter(Boolean);
const evidence = facts;

console.log("=== QRE FAST MOUTH PROBE ===");
console.log(`SUBJECT: ${subject}`);
console.log(`IDENTITY AUTHORITY: explicit probe subject only; no gender inferred`);
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
  "CHARACTER: give the established subject an attitude or comic voice that is clearly expressive framing, not a new factual event.",
  "STATUS: make the supplied change feel like a status move, without inventing a new action or outcome.",
  "IMPLICATION: leave one earned meaning unstated so the reader completes it.",
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
          "The subject identity is exactly the explicit SUBJECT field. Do not infer gender, age, species, relationship status, or personality beyond supplied evidence.",
          "Do not invent a concrete event, location, object, physical placement, reaction, outcome, second character, chronology, or wardrobe state.",
          "Do not use she/he/her/his unless that identity is explicitly supported by supplied evidence.",
          "FEEL-GOOD DOES NOT MEAN WHOLESOME: the line should create an earned viewer reward appropriate to the supplied beat.",
          "Viewer reward may be humor, tension, surprise, attitude, menace, irony, mischief, warmth, recognition, relief, curiosity, status, beauty, shock, or a sharp emotional turn.",
          "After the subject is established, omit the subject name unless repeating it improves emphasis, rhythm, or the punch.",
          "Prefer 3-10 words, but do not flatten a stronger phrase just to hit a word count.",
          "Never explain the joke.",
          "Return JSON exactly: {\"text\":\"...\"}.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({ SUBJECT: subject, APPROVED_EVIDENCE: grounded.approvedEvidence, CREATIVE_OPPORTUNITY: grounded.creativeOpportunity }),
      },
    ],
    "json",
    { numPredict: 140, temperature: 0.88 },
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
  lens: "specific, surprising, earned, attitude-forward",
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
if (critique.scores?.[critique.bestIndex]) {
  const score = critique.scores[critique.bestIndex];
  console.log(`VIEWER_REWARD=${score.viewerReward ?? "n/a"}`);
  console.log(`ATTENTION_PULL=${score.attentionPull ?? "n/a"}`);
  console.log(`CREATIVE_FORCE=${score.creativeForce ?? "n/a"}`);
  console.log(`AFTERIMAGE=${score.afterimage ?? "n/a"}`);
}
