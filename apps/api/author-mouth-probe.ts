import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { groundAuthorBeat } from "./src/services/authorBeatTruthGate.js";
import { critiqueMouthCandidates } from "./src/services/authorMouthCritic.js";

const raw = process.argv.slice(2).join(" ").trim();
if (!raw) throw new Error('Usage: pnpm exec tsx apps/api/author-mouth-probe.ts "anything you want QRE to turn into a short cinematic sequence"');

const parts = raw.split("|").map((x) => x.trim()).filter(Boolean);
const explicitType = parts.length >= 3 ? parts[0] : "";
const subjectBlock = parts.length >= 3 ? parts[1] : "";
const seedBlocks = parts.length >= 3 ? parts.slice(2) : [raw];
const experienceType = explicitType || "universal QRE experience";
const subjectParts = subjectBlock.split(/[,;]+/).map((x) => x.trim()).filter(Boolean);
const subject = subjectParts[0] || "the subject";
const subjectContext = subjectParts.slice(1);
const evidenceBlock = seedBlocks.join(" | ");
const evidenceFacts = evidenceBlock.split(/[,\n.;•|]+/).map((x) => x.trim()).filter(Boolean);
const facts = [subject, ...subjectContext, ...evidenceFacts];
const explicitOverride = /\b(?:paragraph|essay|formal|report|list|bullet|caption|keep (?:this|it) (?:exactly|as written)|do not rewrite|plain facts)\b/i.test(raw);
const visionLike = /\b(?:vision|dream|want to|goal|aspir|three[- ]year|next three years|someday|life i want|bucket list|mission|adventure)\b/i.test(raw);

console.log("=== QRE UNIVERSAL MICRO-CINEMATIC MOUTH PROBE ===");
console.log(`TYPE: ${experienceType}`);
console.log(`SUBJECT: ${subject}`);
console.log(`CONTEXT: ${subjectContext.join(" | ") || "none"}`);
console.log(`SEED: ${raw}`);
console.log(`MODE: ${explicitOverride ? "USER-OVERRIDE" : "MICRO-CINEMATIC-DEFAULT"}`);

const grounded = await groundAuthorBeat({
  subject,
  facts,
  moments: [],
  memory: [],
  beat: {
    order: 1,
    role: "hook",
    gainKind: visionLike ? "discovery" : "reframe",
    change: visionLike
      ? "Find the larger life direction and the strongest sequence hidden inside the user's stated ambitions."
      : `Find the strongest latent relationship in the supplied reality for a ${experienceType}.`,
    frontier: visionLike ? "What life is being imagined here?" : "What makes this worth the next cut?",
    nextNeed: "A sharp characterful turn.",
    necessity: "Establish the strongest creative direction without inventing facts.",
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
        "You are QRE's universal micro-cinematic author.",
        "Unless the user explicitly asks for another format, turn any supplied seed into a short sequence of viewer-facing sentence cuts.",
        "Default product behavior: tiny movie, full-screen scene by scene, one short sentence at a time.",
        "Return exactly 5 beats when the seed supports it; return 3-5 when it is sparse.",
        "Each beat is 2-8 words whenever possible. One idea. One turn. Keep moving.",
        "Do not write a paragraph, recap, checklist, or fact dump.",
        "GLOBAL QUALITY: attention-grabbing, confident, specific, characterful, surprising, memorable, and playable.",
        "Search the hidden character before the obvious nouns: attitude, social stance, status, friction, reaction, implication, personification, absurdity, tenderness, menace, or a tiny negotiation.",
        "For visions, dreams, goals, missions, bucket lists, and future-life seeds: DO NOT reduce the idea to a comparison between two nouns. Find the larger arc, identity, escalation, recurring ritual, ambition, or future-world feeling. Treat each ambition as a possible beat in a life montage.",
        "For visions, preserve the user's actual ambitions as anchors: rave, sushi, coffee, relationships, travel, etc. Turn them into vivid future scenes rather than generic motivational language.",
        "Character-attitude is the preferred default. Example: 'Lawyer already called.' can frame a fierce dog entering a groomer without claiming a real lawyer exists.",
        "Micro-interaction is allowed as cinematic interpretation. Do not present invented concrete events as sourced history.",
        "Use supplied facts as anchors. Creative framing may exaggerate attitude or implication but may not invent literal people, objects, places, actions, dialogue, outcomes, or events.",
        "Do not force conspicuous nouns into jokes. Bows, balls, ties, sushi, coffee, raves, weddings, houses, etc. are ingredients, not mandatory punchlines.",
        "Repeat the quality, never the trick. Do not reuse a successful joke structure unless this seed independently earns it.",
        "After the subject is established, omit the name unless bringing it back makes the line hit harder.",
        "Sequence rhythm: hook → turn → escalation/reframe → sharper turn → payoff/afterimage.",
        "For future vision seeds, the rhythm can instead be: declaration → first obsession → accumulation → life expansion → unforgettable horizon.",
        "Each line should make the next line more desirable.",
        explicitOverride
          ? "The user explicitly requested a different format. Obey that requested format instead of forcing the cinematic default. Preserve user-authored wording where applicable."
          : "No alternate format was requested. Use the micro-cinematic default.",
        "Return JSON exactly: {\"texts\":[\"line 1\",\"line 2\",\"line 3\",\"line 4\",\"line 5\"]}.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        EXPERIENCE_TYPE: experienceType,
        SUBJECT: subject,
        SUBJECT_CONTEXT: subjectContext,
        USER_SEED: raw,
        VISION_LIKE: visionLike,
        SUPPLIED_EVIDENCE: grounded.approvedEvidence,
        CREATIVE_OPPORTUNITY: grounded.creativeOpportunity,
        FORBIDDEN_CLAIMS: grounded.forbiddenClaims,
      }),
    },
  ],
  "json",
  { numPredict: 560, temperature: explicitOverride ? 0.55 : 0.9 },
);

let sequence: string[] = [];
try {
  const parsed = JSON.parse(String(generation.text ?? "").trim()) as { texts?: unknown };
  if (Array.isArray(parsed.texts)) sequence = parsed.texts.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 5);
} catch {
  sequence = [];
}

console.log("SEQUENCE:");
sequence.forEach((text, index) => console.log(`[${index + 1}] ${text}`));

const judgments = await Promise.all(
  sequence.map((text, index) => critiqueMouthCandidates({
    prompt: experienceType,
    lens: "micro-cinematic, short, catchy, characterful, attention-grabbing, surprising, memorable",
    subject,
    facts,
    moments: [],
    memory: [],
    beat: {
      order: index + 1,
      role: index === 0 ? "hook" : index === sequence.length - 1 ? "payoff" : "reframe",
      gainKind: index === 0 ? "new_fact" : index === sequence.length - 1 ? "payoff" : "surprise",
      change: text,
      frontier: sequence[index + 1] ?? "",
      nextNeed: sequence[index + 1] ?? "",
      necessity: "This line earns its place by changing the feel or meaning of the sequence.",
      approvedEvidence: grounded.approvedEvidence,
      creativeOpportunity: grounded.creativeOpportunity,
      forbiddenClaims: grounded.forbiddenClaims,
    },
    candidates: [text],
  })),
);

console.log("JUDGMENT:");
judgments.forEach((critique, index) => {
  console.log(`[${index + 1}] ${critique.decision.toUpperCase()} · ${sequence[index]}`);
  if (critique.failureCodes?.length) console.log(`    FAIL: ${critique.failureCodes.join(" | ")}`);
});
const accepted = judgments.filter((critique) => critique.decision === "accept").length;
console.log(`ACCEPTED: ${accepted}/${sequence.length}`);
