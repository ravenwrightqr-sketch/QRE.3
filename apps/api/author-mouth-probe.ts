import { localModelGenerate } from "./src/services/localModelRuntime.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
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

const realityGraph = buildAuthorRealityGraph({
  prompt: raw,
  subject,
  place: "",
  facts,
  sourceMoments: evidenceFacts,
  memoryContext: [],
  trajectory: [],
});
const cognition = buildAuthorCognitivePlan({
  prompt: raw,
  lens: explicitType,
  subject,
  place: "",
  facts,
  sourceMoments: evidenceFacts,
  memoryContext: [],
  priorScenes: [],
  priorStrategies: [],
  round: 1,
  realityGraph,
});

console.log("=== QRE UNIVERSAL MICRO-CINEMATIC MOUTH PROBE ===");
console.log(`TYPE: ${experienceType}`);
console.log(`SUBJECT: ${subject}`);
console.log(`CONTEXT: ${subjectContext.join(" | ") || "none"}`);
console.log(`SEED: ${raw}`);
console.log(`MODE: ${explicitOverride ? "USER-OVERRIDE" : "MICRO-CINEMATIC-DEFAULT"}`);
console.log(`COGNITIVE MODE: ${cognition.mode}`);
console.log(`STRATEGY: ${cognition.chosenAttentionStrategy}`);
console.log(`OPERATORS: ${cognition.operatorMix.join(" | ")}`);
console.log(`MOVIES: ${cognition.latentMovieCandidates.slice(0, 3).map((movie) => movie.lens).join(" | ") || "none"}`);

const grounded = await groundAuthorBeat({
  subject,
  facts,
  moments: evidenceFacts,
  memory: [],
  beat: {
    order: 1,
    role: "hook",
    gainKind: visionLike ? "discovery" : "reframe",
    change: visionLike
      ? "Find the larger life direction and strongest sequence hidden inside the user's stated ambitions."
      : `Find the strongest latent relationship inside this ${experienceType}.`,
    frontier: visionLike ? "What life is being imagined here?" : "What makes this worth the next cut?",
    nextNeed: "A sharp characterful turn.",
    necessity: "Establish the strongest creative direction without inventing facts.",
  },
});

console.log(`APPROVED: ${grounded.approvedEvidence.join(" | ")}`);
console.log(`OPPORTUNITY: ${grounded.creativeOpportunity}`);
console.log(`FORBIDDEN: ${grounded.forbiddenClaims.join(" | ") || "none"}`);

const serviceLike = cognition.mode === "service" || /\b(?:service|receipt|groom|grooming|cleaning|repair|salon|barber|appointment|client)\b/i.test(`${experienceType} ${raw}`);
const generation = await localModelGenerate(
  [
    {
      role: "system",
      content: [
        "You are QRE's universal micro-cinematic author.",
        "Unless the user explicitly asks for another format, turn the seed into a short sequence of viewer-facing sentence cuts.",
        "Default product behavior: tiny movie, full-screen scene by scene, one short sentence at a time.",
        "Return exactly 5 beats when the seed supports it; return 3-5 when it is sparse.",
        "Each beat is 2-8 words whenever possible. One idea. One turn. Keep moving.",
        "Do not write a paragraph, recap, checklist, or fact dump.",
        "GLOBAL QUALITY: attention-grabbing, confident, specific, characterful, surprising, memorable, and playable.",
        "Use the COGNITIVE PLAN as private direction. It tells you what kind of creative search to perform; never expose strategy or operator names in viewer text.",
        `CHOSEN STRATEGY: ${cognition.chosenAttentionStrategy}`,
        `OPERATORS: ${cognition.operatorMix.join(" | ")}`,
        `COGNITIVE BRIEF: ${cognition.authorBrief.join(" | ")}`,
        "Search the hidden character and situation before obvious nouns: attitude, social stance, status, friction, reaction, implication, personification, absurdity, tenderness, menace, ritual, or a tiny negotiation.",
        serviceLike
          ? "SERVICE AUTHORING MODE: Never turn the service facts into a report. Find the tiny human movie inside the work. Time stamps can create rhythm or mission pressure. A task sequence can become a sense of conquest, craft, ritual, precision, speed, ownership, or controlled chaos. The final line should leave the customer with a feeling about the work, not a recap of every task. Never invent a customer reaction, tool, room detail, dialogue, or physical event not supplied."
          : "NON-SERVICE MODE: Find the strongest latent relationship, then build the smallest sequence that makes that relationship feel alive.",
        "For visions, dreams, goals, missions, bucket lists, and future-life seeds: do not collapse the prompt into a comparison between two nouns. Preserve the whole ambition and stage it as a future-facing montage: declaration → obsession → accumulation → life expansion → horizon. Do not pretend future events already happened.",
        "For memory prompts: use recurrence, private meaning, changed context, and callbacks. For house/space prompts: let the space participate only when evidence supports it.",
        "Character-attitude is preferred over adjective echoing. Do not simply repeat 'meticulous', 'fast', 'happy', 'fierce', 'cool', etc. Show what those traits mean in the situation.",
        "A micro-interaction or social framing may be used as cinematic interpretation, but do not present invented concrete events as sourced history.",
        "Do not force conspicuous nouns into jokes. Bows, balls, ties, sushi, coffee, raves, weddings, houses, kitchens, bathrooms, timestamps, etc. are ingredients, not mandatory punchlines.",
        "Repeat the quality, never the trick. Do not reuse a successful joke structure unless this seed independently earns it.",
        "After the subject is established, omit the name unless bringing it back makes the line hit harder.",
        "SEQUENCE RHYTHM: establish → turn → deepen → sharper turn → payoff/afterimage. Vary sentence shape and do not repeat the same grammatical opening.",
        "Every line must do one new thing. Do not restate the same evidence with different adjectives.",
        "Prefer a small clever implication over an explanatory sentence.",
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
        SERVICE_LIKE: serviceLike,
        SUPPLIED_EVIDENCE: grounded.approvedEvidence,
        CREATIVE_OPPORTUNITY: grounded.creativeOpportunity,
        FORBIDDEN_CLAIMS: grounded.forbiddenClaims,
        REALITY_GRAPH: realityGraph,
        COGNITIVE_PLAN: {
          mode: cognition.mode,
          strategy: cognition.chosenAttentionStrategy,
          operators: cognition.operatorMix,
          contradictions: cognition.contradictions,
          sceneRules: cognition.sceneRules,
          antiRepetitionRules: cognition.antiRepetitionRules,
          latentMovies: cognition.latentMovieCandidates.slice(0, 4),
        },
      }),
    },
  ],
  "json",
  { numPredict: 600, temperature: explicitOverride ? 0.55 : 0.9 },
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
    lens: `micro-cinematic, short, catchy, characterful, attention-grabbing, surprising, memorable; strategy=${cognition.chosenAttentionStrategy}; operators=${cognition.operatorMix.join(",")}`,
    subject,
    facts,
    moments: evidenceFacts,
    memory: [],
    moviePremise: cognition.latentMovieCandidates[0]?.hypothesis?.join(" ") ?? "",
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
