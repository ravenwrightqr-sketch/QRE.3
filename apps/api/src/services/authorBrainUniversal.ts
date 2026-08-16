/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * truth → cognition → latent movie → beat discovery → magnet → mouth → cut policy
 *
 * The discovered beat plan is the only source for SequencePlay.
 * Cognitive machinery is never allowed to become viewer-facing beat content.
 */
import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  InformationFrontier,
  MagnetCircle,
  SequenceCut,
  SequencePlay,
  SubjectContinuity,
  ViewerAttentionRole,
  ViewerMomentum,
} from "@qre/contracts";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { evaluateCut, type CutWorld } from "./authorCutPolicy.js";
import { localModelGenerate } from "./localModelRuntime.js";

const ROLES: readonly ViewerAttentionRole[] = [
  "arrival", "hook", "question", "pressure", "reframe", "escalation",
  "discovery", "consequence", "release", "payoff", "callback", "continuation",
];

const ROLE_ALIASES: Record<string, ViewerAttentionRole> = {
  setup: "arrival", opening: "arrival", introduction: "arrival",
  development: "pressure", hypothesis: "pressure", turn: "reframe",
  reveal: "discovery", complication: "escalation", resolution: "payoff",
  coda: "continuation", contrast: "reframe", status_inversion: "reframe",
  personification: "reframe", sensory_hook: "hook", meaning_shift: "reframe",
};

const GAIN_ALIASES: Record<string, NonNullable<SequenceCut["gainKind"]>> = {
  novelty: "new_fact", context: "new_fact", emotional_state: "new_fact",
  sensory: "new_fact", information: "new_fact", personality: "reframe",
  trait: "new_fact", humor: "surprise", comic_turn: "surprise", status: "reframe",
  emotional: "reframe", memory: "callback", private_meaning: "reframe",
  satisfaction: "payoff", resolution: "payoff", reveal: "discovery",
  anticipation: "question", uncertainty: "question", escalation: "escalation",
  information_value: "discovery", contrast: "reframe", replay: "callback",
  role: "reframe", afterglow: "payoff", meaning_shift: "reframe",
};

const BAD_FRONTIER = /\b(?:attention strategy|operator(?: mix|s)?|build from beat|round\s*\d|cognitive|cognition|preserve forward|land the chosen|find subtle tension|contradictions?:\s*none|why this beat|necessity|viewer-facing|writing process)\b/i;
const BAD_BEAT_CHANGE = /\b(?:attention strategy|operator(?: mix|s)?|build from beat|cognitive plan|cognition|preserve forward|land the chosen meaning)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 24): string[] =>
  [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));

function parseJson<T>(raw: string): T | null {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

function debug(label: string, raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
}

function normalizeRole(value: unknown): ViewerAttentionRole {
  const normalized = clean(value).toLowerCase().replace(/\s+/g, "_");
  const role = ROLE_ALIASES[normalized] ?? normalized;
  return ROLES.includes(role as ViewerAttentionRole) ? role as ViewerAttentionRole : "discovery";
}

function normalizeGain(value: unknown): NonNullable<SequenceCut["gainKind"]> {
  const normalized = clean(value).toLowerCase().replace(/\s+/g, "_");
  const gain = GAIN_ALIASES[normalized] ?? normalized;
  const allowed = new Set<NonNullable<SequenceCut["gainKind"]>>([
    "new_fact", "surprise", "question", "escalation", "reframe", "discovery",
    "consequence", "callback", "payoff",
  ]);
  return allowed.has(gain as NonNullable<SequenceCut["gainKind"]>)
    ? gain as NonNullable<SequenceCut["gainKind"]>
    : "discovery";
}

function normalizeFacts(value: unknown): string[] {
  if (Array.isArray(value)) return uniq(value, 16);
  if (!value || typeof value !== "object") return [];
  return uniq(Object.entries(value as Record<string, unknown>).filter(([, state]) => Boolean(state)).map(([fact]) => fact), 16);
}

function world(input: AuthorBrainTruth): CutWorld {
  return {
    prompt: clean(input.prompt),
    subject: clean(input.subject),
    place: clean(input.place),
    identity: input.subjectTruth?.identityFacts ?? [],
    facts: input.facts,
    moments: input.sourceMoments,
    memory: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
    presence: input.presenceSummary ?? [],
  };
}

const STOP = new Set("the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten".split(/\s+/));
function wordSet(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 4 && !STOP.has(word)));
}
function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size) return 0;
  let hits = 0;
  for (const word of a) if (b.has(word)) hits += 1;
  return hits / a.size;
}

function computeMagnet(before: ViewerMomentum, change: string, next: string, gain: string): MagnetCircle {
  const known = wordSet(before.known.join(" "));
  const changeWords = wordSet(change);
  const nextWords = wordSet(next);
  const novelty = metric(1 - overlap(changeWords, known));
  const genericNext = /^(?:what happens next|what will happen next|more to come|something else|the next step)[.?]?$/i.test(next);
  const uncertainty = metric((nextWords.size ? 0.45 : 0.05) + (before.unresolved || before.curiosityGap ? 0.25 : 0) + (["question", "surprise"].includes(gain) ? 0.2 : 0) - (genericNext ? 0.45 : 0));
  const informationValue = metric(novelty * 0.45 + (changeWords.size ? 0.15 : 0) + (nextWords.size ? 0.15 : 0) + (["surprise", "reframe", "discovery", "consequence", "callback", "payoff"].includes(gain) ? 0.25 : 0));
  const attention = metric(novelty * 0.45 + informationValue * 0.55);
  const tension = metric(uncertainty * informationValue);
  const informationSeeking = metric((nextWords.size ? 0.3 : 0) + (before.unresolved ? 0.25 : 0) + (before.forwardPull ? 0.2 : 0) + (before.currentWant ? 0.1 : 0));
  const narrativeEngagement = metric((attention + tension + informationSeeking) / 3);
  const magnetStrength = metric(novelty * 0.15 + uncertainty * 0.15 + informationValue * 0.2 + attention * 0.15 + tension * 0.2 + informationSeeking * 0.1 + narrativeEngagement * 0.05);
  return { novelty, uncertainty, informationValue, attention, tension, informationSeeking, narrativeEngagement, magnetStrength, unresolved: next || change || before.unresolved, nextNeed: next || before.forwardPull };
}

function frontier(before: ViewerMomentum, change: string, next: string, magnet: MagnetCircle): InformationFrontier {
  const candidate = clean(next || change || before.unresolved || "");
  return { known: before.known, frontier: BAD_FRONTIER.test(candidate) ? "" : candidate, novelty: magnet.novelty, uncertainty: magnet.uncertainty, informationValue: magnet.informationValue, tension: magnet.tension, nextNeed: BAD_FRONTIER.test(candidate) ? undefined : candidate };
}

function subjectContinuity(subject: string, established: boolean, text: string, order: number): SubjectContinuity {
  const explicit = Boolean(subject) && new RegExp(`\\b${subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i").test(text);
  const pronoun = /\b(?:he|she|they|it|him|her|them|his|their|its)\b/i.test(text);
  return { established: established || Boolean(subject), subject, referenceMode: explicit ? "name" : pronoun ? "pronoun" : "implicit", referenceCost: explicit && established ? 0.35 : pronoun && established ? 0.1 : 0, lastExplicitReference: explicit ? order : undefined };
}

type AuthorBeat = { order: number; role: string; gainKind: string; change: string; next: string; frontier: string; necessity: string };
type BeatPlan = { premise: string; baselineFacts: string[]; beats: AuthorBeat[]; closing?: string };

function normalizeBeatPlan(value: unknown): BeatPlan | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const rawBeats = Array.isArray(record.beats) ? record.beats : [];
  const beats: AuthorBeat[] = [];
  for (const [index, raw] of rawBeats.entries()) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const change = clean(item.change);
    const next = clean(item.next);
    const frontierValue = clean(item.frontier || item.informationFrontier);
    const necessity = clean(item.necessity || item.whyNext);
    if (!change || BAD_BEAT_CHANGE.test(change) || BAD_FRONTIER.test(frontierValue)) continue;
    beats.push({
      order: index + 1,
      role: clean(item.role) || "discovery",
      gainKind: clean(item.gainKind) || "discovery",
      change,
      next,
      frontier: frontierValue || next,
      necessity: necessity || "This change creates a new reason to consume the next beat.",
    });
  }
  if (!beats.length) return undefined;
  return { premise: clean(record.premise), baselineFacts: normalizeFacts(record.baselineFacts), beats: beats.slice(0, 6), closing: clean(record.closing || record.continuation) };
}

function buildViewerMomentum(subject: string, plan: BeatPlan): SequencePlay | undefined {
  if (!plan.beats.length) return undefined;
  const baselineFacts = uniq(plan.baselineFacts, 16);
  let momentum: ViewerMomentum = { known: baselineFacts, subjectContinuity: { established: false, subject, referenceMode: "implicit", referenceCost: 0 }, informationFrontier: { known: baselineFacts, frontier: "", novelty: 0, uncertainty: 0, informationValue: 0, tension: 0 } };
  const cuts: SequenceCut[] = [];
  let established = false;
  for (const beat of plan.beats) {
    const role = normalizeRole(beat.role);
    const gainKind = normalizeGain(beat.gainKind);
    const next = clean(beat.frontier || beat.next);
    const safeFrontier = BAD_FRONTIER.test(next) ? "" : next;
    const magnet = computeMagnet(momentum, beat.change, safeFrontier, gainKind);
    const state = subjectContinuity(subject, established, beat.change, beat.order);
    established = established || Boolean(subject);
    const after: ViewerMomentum = {
      known: momentum.known,
      expected: safeFrontier || undefined,
      activeQuestion: gainKind === "question" ? safeFrontier || beat.change : momentum.activeQuestion,
      curiosityGap: safeFrontier || momentum.curiosityGap,
      predictionShift: beat.change,
      currentWant: safeFrontier || undefined,
      unresolved: magnet.unresolved,
      forwardPull: safeFrontier || undefined,
      payoffDebt: momentum.payoffDebt,
      magnet,
      subjectContinuity: state,
      informationFrontier: frontier(momentum, beat.change, safeFrontier, magnet),
    };
    cuts.push({
      id: `cut-${beat.order}`,
      order: beat.order,
      role,
      gainKind,
      sourceIds: [],
      informationGain: beat.change,
      attentionDelta: safeFrontier || beat.change,
      viewerBefore: { known: momentum.known, expected: momentum.expected, unresolved: momentum.unresolved, currentWant: momentum.currentWant, recentChange: momentum.predictionShift },
      viewerAfter: { known: after.known, expected: after.expected, unresolved: after.unresolved, currentWant: after.currentWant, recentChange: after.predictionShift },
      momentum: { before: momentum, change: beat.change, after, nextPressure: safeFrontier || undefined },
      necessity: { necessary: magnet.magnetStrength >= 0.3, reason: beat.necessity, removalDamage: `Weakens the viewer frontier: ${safeFrontier || beat.change}` },
      nextPromise: safeFrontier || undefined,
      noveltyScore: magnet.novelty,
      confidence: 0.9,
    });
    momentum = after;
  }
  return { subject, premise: plan.premise, openingState: { known: baselineFacts }, baselineFacts, openingMomentum: cuts[0]?.momentum?.before, cuts, closingMomentum: momentum, closingState: { known: momentum.known, unresolved: momentum.unresolved, currentWant: momentum.currentWant }, continuity: [], antiCrutch: [], continuation: plan.closing };
}

function extractTexts(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const texts = Array.isArray(record.texts) ? record.texts : Array.isArray(record.scenes) ? record.scenes : [];
  return texts.map(clean).filter(Boolean).slice(0, 6);
}

function scenesFromSequence(sequence: SequencePlay, texts: string[], input: AuthorBrainTruth) {
  const attempted = sequence.cuts.length;
  const scenes: AuthorScene[] = [];
  const prior: string[] = [];
  const rejectionReasons: Record<string, number> = {};
  const worldValue = world(input);
  for (let i = 0; i < attempted; i += 1) {
    const cut = sequence.cuts[i];
    const text = clean(texts[i] ?? "");
    if (!text) { rejectionReasons["missing-text"] = (rejectionReasons["missing-text"] ?? 0) + 1; continue; }
    const policy = evaluateCut(text, worldValue, { role: cut.role, gainKind: cut.gainKind, change: cut.informationGain, next: cut.nextPromise, text, subjectEstablished: Boolean(cut.momentum?.before.subjectContinuity?.established), informationFrontier: cut.momentum?.after.informationFrontier?.frontier }, prior);
    if (!policy.accepted) {
      for (const reason of policy.reasons) rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1;
      continue;
    }
    scenes.push({ text, kind: cut.role === "hook" ? "hook" : cut.role === "payoff" ? "payoff" : "line" });
    prior.push(text);
  }
  return { scenes, attempted, rejected: attempted - scenes.length, rejectionReasons };
}

function brief(input: AuthorBrainTruth, strategy: string): AuthorCreativeBrief {
  return {
    angle: `attention strategy: ${strategy}`,
    engine: "latent movie discovery → beat necessity → mouth realization",
    question: "what changes the viewer's mental model next?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: "novelty → uncertainty → information value → attention → tension → information seeking → narrative engagement",
    payoff: "a character-specific consequence or reframe",
    callback: input.memoryContext?.[0] ?? input.trajectory?.[0] ?? "none yet",
    rhythm: ["hit", "standard", "hit", "short"] as AuthorCreativeBrief["rhythm"],
    avoid: ["fact parade", "identity repetition", "generic emotion arc", "invented reality", "labels in viewer prose", "literal questions", "padding", "explaining the joke"],
  };
}

function buildBeatMessages(input: AuthorBrainTruth, cognition: ReturnType<typeof buildAuthorCognitivePlan>) {
  const compactWorld = {
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    subject: clean(input.subject),
    place: clean(input.place),
    facts: uniq(input.facts, 18),
    moments: uniq(input.sourceMoments, 12),
    memory: uniq(input.memoryContext, 10),
    trajectory: uniq(input.trajectory, 10),
    returning: Boolean(input.returning),
    visitNumber: input.visitNumber,
  };
  return [
    {
      role: "system" as const,
      content: [
        "You are QRE's latent-movie planner. Do planning only; never write final prose.",
        "Find the strongest movie hidden inside the supplied reality.",
        "Truth is immutable. Do not invent people, actions, objects, locations, dates, dialogue, or outcomes.",
        "Facts are baseline world state; do not spend beats restating them.",
        "Optimize viewer movement: novelty → uncertainty → information value → attention → tension → information seeking → narrative engagement.",
        "Each beat must contain one concrete change grounded in the supplied world, one viewer-relevant frontier, and one reason the next beat is necessary.",
        "Prefer contradiction, status inversion, recurring object, transformed callback, private meaning, sensory fingerprint, service/personality collision, space-as-character, calm reality break, or memory re-entry when supported.",
        "The selected lens is a lens, not a stereotype.",
        "For return chapters, use prior material only as evidence for what is different or newly meaningful now.",
        "Return exactly 3 to 5 compact beats. Keep each field short. Never mention strategy names, operators, cognition, or instructions inside change/frontier/next.",
        "Output JSON only: {premise:string,baselineFacts:string[],beats:[{role,gainKind,change,next,frontier,necessity}],closing?:string}.",
        `strategy=${cognition.chosenAttentionStrategy}`,
        `candidateStrategies=${cognition.attentionCandidates.slice(0, 4).map((item) => item.strategy).join(", ")}`,
        `callbacks=${cognition.callbackTargets.slice(0, 4).join(" | ") || "none"}`,
        `contradictions=${cognition.contradictions.slice(0, 4).join(" | ") || "none"}`,
      ].join("\n"),
    },
    { role: "user" as const, content: JSON.stringify(compactWorld) },
  ];
}

function buildMouthMessages(input: AuthorBrainTruth, sequence: SequencePlay, plan: BeatPlan) {
  const beats = sequence.cuts.map((cut, index) => ({
    order: index + 1,
    role: cut.role,
    change: cut.informationGain,
    frontier: cut.momentum?.after.informationFrontier?.frontier ?? "",
    nextNeed: cut.nextPromise ?? "",
    necessity: plan.beats[index]?.necessity ?? "",
  }));
  return [
    {
      role: "system" as const,
      content: [
        "You are QRE's theatrical mouth. The beat plan is locked.",
        "Write exactly one viewer-facing line for each approved beat, in order.",
        "Realize the beat; do not explain it, summarize it, or redesign it.",
        "Do not invent concrete facts or events.",
        "Do not mention beat, role, strategy, operator, frontier, cognition, planning, or the writing process.",
        "Once the subject is established, avoid repeating the subject name unless the name itself creates new information.",
        "Prefer human framing, attitude, implication, specificity, compressed theatricality, and sensory detail only when supplied or safely inferable.",
        "Funny: find the absurd social meaning already latent in the facts. Horror: preserve the supplied reality and make its contradiction do the work. Romance: make supplied private significance felt. Memory: restore the actual fingerprint instead of generic category language.",
        "Never output emojis or headings. JSON only: {texts:[string,...]}.",
      ].join("\n"),
    },
    { role: "user" as const, content: JSON.stringify({ prompt: input.prompt, lens: input.lens, subjectTruth: input.subjectTruth ?? null, memory: input.memoryContext ?? [], trajectory: input.trajectory ?? [], beats }) },
  ];
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown>; diagnostics: Record<string, unknown> }> {
  const subject = clean(input.subject) || "the subject";
  const cognition = buildAuthorCognitivePlan({
    prompt: clean(input.prompt), lens: clean(input.lens), subject, place: clean(input.place),
    facts: [...input.facts], sourceMoments: [...input.sourceMoments], memoryContext: [...(input.memoryContext ?? [])],
    priorScenes: [...(input.trajectory ?? [])], priorStrategies: [...(input.creativeLearningContext ?? [])], round: Math.max(1, input.trajectory?.length ? 2 : 1),
  });

  const field: Record<string, unknown> = {
    subjectTruth: input.subjectTruth ?? null,
    facts: uniq(input.facts, 24),
    moments: uniq(input.sourceMoments, 18),
    memory: uniq(input.memoryContext, 14),
    trajectory: uniq(input.trajectory, 14),
    learning: uniq(input.creativeLearningContext, 20),
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    cognition: { mode: cognition.mode, chosenAttentionStrategy: cognition.chosenAttentionStrategy, attentionCandidates: cognition.attentionCandidates, contradictions: cognition.contradictions, operatorMix: cognition.operatorMix, callbackTargets: cognition.callbackTargets, sceneRules: cognition.sceneRules },
  };

  const beatMessages = buildBeatMessages(input, cognition);
  let beatPlanResult = await localModelGenerate(beatMessages, "json", { numPredict: 768, temperature: 0.65 });
  debug("BEAT-DISCOVERY", beatPlanResult.text);
  let beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));
  let beatPlanRetries = 0;

  if (!beatPlan) {
    beatPlanRetries = 1;
    beatPlanResult = await localModelGenerate([
      beatMessages[0],
      { role: "user", content: `${beatMessages[1].content}\nReturn ONLY compact JSON. Use exactly 3 beats. Keep every field under 16 words.` },
    ], "json", { numPredict: 512, temperature: 0.55 });
    debug("BEAT-DISCOVERY-RETRY", beatPlanResult.text);
    beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));
  }

  if (!beatPlan) {
    return {
      brief: brief(input, cognition.chosenAttentionStrategy),
      scenes: [],
      sequence: undefined,
      field,
      diagnostics: {
        cognitionMode: cognition.mode,
        chosenAttentionStrategy: cognition.chosenAttentionStrategy,
        attentionCandidates: cognition.attentionCandidates,
        contradictions: cognition.contradictions,
        operatorMix: cognition.operatorMix,
        beatCount: 0,
        beatPlan: [],
        beatPlanRetries,
        beatPlanParseFailed: true,
        sequenceCutsAttempted: 0,
        sequenceCutsRejected: 0,
        finalScenes: 0,
      },
    };
  }

  const sequence = buildViewerMomentum(subject, beatPlan);
  if (!sequence) {
    return { brief: brief(input, cognition.chosenAttentionStrategy), scenes: [], sequence: undefined, field, diagnostics: { cognitionMode: cognition.mode, chosenAttentionStrategy: cognition.chosenAttentionStrategy, beatCount: 0, beatPlanRetries, finalScenes: 0 } };
  }

  const realization = await localModelGenerate(buildMouthMessages(input, sequence, beatPlan), "json", { numPredict: 640, temperature: 0.72 });
  debug("MOUTH-REALIZATION", realization.text);
  const texts = extractTexts(parseJson<unknown>(realization.text));
  const sequenceResult = scenesFromSequence(sequence, texts, input);
  const magnetValues = sequence.cuts.map((cut) => cut.momentum?.after.magnet?.magnetStrength ?? 0).filter(Number.isFinite);
  const magnetAverage = magnetValues.length ? magnetValues.reduce((a, b) => a + b, 0) / magnetValues.length : 0;
  const magnetPeak = magnetValues.length ? Math.max(...magnetValues) : 0;
  const magnetFloor = magnetValues.length ? Math.min(...magnetValues) : 0;

  return {
    brief: brief(input, cognition.chosenAttentionStrategy),
    scenes: sequenceResult.scenes,
    sequence,
    field,
    diagnostics: {
      cognitionMode: cognition.mode,
      chosenAttentionStrategy: cognition.chosenAttentionStrategy,
      attentionCandidates: cognition.attentionCandidates,
      contradictions: cognition.contradictions,
      operatorMix: cognition.operatorMix,
      beatCount: beatPlan.beats.length,
      beatPlan: beatPlan.beats,
      beatPlanRetries,
      beatPlanParseFailed: false,
      sequenceCutsAttempted: sequenceResult.attempted,
      sequenceCutsRejected: sequenceResult.rejected,
      rejectionReasons: sequenceResult.rejectionReasons,
      realizationTexts: texts,
      realizationCountMismatch: texts.length !== sequence.cuts.length,
      finalScenes: sequenceResult.scenes.length,
      magnetAverage: metric(magnetAverage),
      magnetPeak: metric(magnetPeak),
      magnetFloor: metric(magnetFloor),
      magnetCutsMeasured: magnetValues.length,
      subjectSpaceEstablished: Boolean(sequence.closingMomentum?.subjectContinuity?.established),
      informationFrontier: sequence.closingMomentum?.informationFrontier?.frontier ?? "",
    },
  };
}
