/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * ONE MASTER AUTHOR PATH.
 *
 * Pipeline:
 *   truth → cognition → beat discovery → magnet scoring → mouth realization → cut policy
 *
 * The author must decide what changes before it is allowed to decide how to say it.
 * Do not add domain-specific author branches here.
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
  information: "new_fact", satisfaction: "payoff", resolution: "payoff",
  reveal: "discovery", anticipation: "question", uncertainty: "question",
  escalation: "escalation", information_value: "discovery", contrast: "reframe",
  replay: "callback", sensory: "new_fact", emotional: "reframe", trait: "new_fact",
  role: "reframe", afterglow: "payoff", meaning_shift: "reframe",
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 24): string[] =>
  [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));

function parseJson<T>(raw: string): T | null {
  const text = String(raw ?? "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try { return JSON.parse(text) as T; } catch { return null; }
}

function debug(label: string, raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
}

function canonicalRole(value: unknown): ViewerAttentionRole | undefined {
  const normalized = clean(value).toLowerCase().replace(/\s+/g, "_");
  const role = ROLE_ALIASES[normalized] ?? normalized;
  return ROLES.includes(role as ViewerAttentionRole) ? role as ViewerAttentionRole : undefined;
}

function canonicalGain(value: unknown): NonNullable<SequenceCut["gainKind"]> | undefined {
  const normalized = clean(value).toLowerCase().replace(/\s+/g, "_");
  const gain = GAIN_ALIASES[normalized] ?? normalized;
  const allowed = new Set<NonNullable<SequenceCut["gainKind"]>>([
    "new_fact", "surprise", "question", "escalation", "reframe", "discovery",
    "consequence", "callback", "payoff",
  ]);
  return allowed.has(gain as NonNullable<SequenceCut["gainKind"]>)
    ? gain as NonNullable<SequenceCut["gainKind"]>
    : undefined;
}

function normalizeFacts(value: unknown): string[] {
  if (Array.isArray(value)) return uniq(value, 16);
  if (!value || typeof value !== "object") return [];
  return uniq(
    Object.entries(value as Record<string, unknown>)
      .filter(([, state]) => Boolean(state))
      .map(([fact]) => fact),
    16,
  );
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

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten"
    .split(/\s+/),
);

function wordSet(value: string): Set<string> {
  return new Set(
    clean(value).toLowerCase().split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 4 && !STOP.has(word)),
  );
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
  const uncertainty = metric(
    (nextWords.size ? 0.45 : 0.05) +
    (before.unresolved || before.curiosityGap ? 0.25 : 0) +
    (["question", "surprise"].includes(gain) ? 0.2 : 0) -
    (genericNext ? 0.45 : 0),
  );
  const informationValue = metric(
    novelty * 0.45 +
    (changeWords.size ? 0.15 : 0) +
    (nextWords.size ? 0.15 : 0) +
    (["surprise", "reframe", "discovery", "consequence", "callback", "payoff"].includes(gain) ? 0.25 : 0),
  );
  const attention = metric(novelty * 0.45 + informationValue * 0.55);
  const tension = metric(uncertainty * informationValue);
  const informationSeeking = metric(
    (nextWords.size ? 0.3 : 0) +
    (before.unresolved ? 0.25 : 0) +
    (before.forwardPull ? 0.2 : 0) +
    (before.currentWant ? 0.1 : 0),
  );
  const narrativeEngagement = metric((attention + tension + informationSeeking) / 3);
  const magnetStrength = metric(
    novelty * 0.15 + uncertainty * 0.15 + informationValue * 0.2 +
    attention * 0.15 + tension * 0.2 + informationSeeking * 0.1 + narrativeEngagement * 0.05,
  );
  return {
    novelty,
    uncertainty,
    informationValue,
    attention,
    tension,
    informationSeeking,
    narrativeEngagement,
    magnetStrength,
    unresolved: next || change || before.unresolved,
    nextNeed: next || before.forwardPull,
  };
}

function frontier(before: ViewerMomentum, change: string, next: string, magnet: MagnetCircle): InformationFrontier {
  return {
    known: before.known,
    frontier: clean(next || change || before.unresolved || ""),
    novelty: magnet.novelty,
    uncertainty: magnet.uncertainty,
    informationValue: magnet.informationValue,
    tension: magnet.tension,
    nextNeed: next || before.forwardPull,
  };
}

function subjectContinuity(subject: string, established: boolean, text: string, order: number): SubjectContinuity {
  const escaped = subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const explicit = Boolean(subject) && new RegExp(`\\b${escaped}\\b`, "i").test(text);
  const pronoun = /\b(?:he|she|they|it|him|her|them|his|their|its)\b/i.test(text);
  const referenceMode = explicit ? "name" : pronoun ? "pronoun" : "implicit";
  return {
    established: established || Boolean(subject),
    subject,
    referenceMode,
    referenceCost: explicit && established ? 0.35 : pronoun && established ? 0.1 : 0,
    lastExplicitReference: explicit ? order : undefined,
  };
}

type AuthorBeat = {
  order: number;
  role: string;
  gainKind: string;
  change: string;
  next: string;
  frontier: string;
  necessity: string;
};

type BeatPlan = {
  premise: string;
  baselineFacts: string[];
  beats: AuthorBeat[];
  closing?: string;
};

function normalizeBeatPlan(value: unknown): BeatPlan | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const rawBeats = Array.isArray(record.beats) ? record.beats : Array.isArray(record.cuts) ? record.cuts : [];
  const beats: AuthorBeat[] = [];
  for (const [index, raw] of rawBeats.entries()) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const role = clean(item.role) || "discovery";
    const gainKind = clean(item.gainKind) || "discovery";
    const change = clean(item.change);
    const next = clean(item.next);
    const frontierValue = clean(item.frontier || item.informationFrontier);
    const necessity = clean(item.necessity || item.whyNext);
    if (!change && !frontierValue && !next) continue;
    beats.push({
      order: index + 1,
      role,
      gainKind,
      change,
      next,
      frontier: frontierValue || next || change,
      necessity: necessity || `This beat changes what the viewer is seeking next: ${next || frontierValue || change}`,
    });
  }
  if (!beats.length) return undefined;
  return {
    premise: clean(record.premise),
    baselineFacts: normalizeFacts(record.baselineFacts),
    beats: beats.slice(0, 6),
    closing: clean(record.closing || record.continuation),
  };
}

function buildViewerMomentum(subject: string, plan: BeatPlan): SequencePlay | undefined {
  if (!plan.beats.length) return undefined;
  const baselineFacts = uniq(plan.baselineFacts, 16);
  let momentum: ViewerMomentum = {
    known: baselineFacts,
    subjectContinuity: { established: false, subject, referenceMode: "implicit", referenceCost: 0 },
    informationFrontier: { known: baselineFacts, frontier: "", novelty: 0, uncertainty: 0, informationValue: 0, tension: 0 },
  };
  const cuts: SequenceCut[] = [];
  let subjectEstablished = false;

  for (const beat of plan.beats) {
    const role = canonicalRole(beat.role) ?? "discovery";
    const gainKind = canonicalGain(beat.gainKind) ?? "discovery";
    const magnet = computeMagnet(momentum, beat.change, beat.frontier || beat.next, gainKind);
    const state = subjectContinuity(subject, subjectEstablished, beat.change, beat.order);
    subjectEstablished = subjectEstablished || Boolean(subject);
    const after: ViewerMomentum = {
      known: momentum.known,
      expected: beat.next || undefined,
      activeQuestion: gainKind === "question" ? beat.change : momentum.activeQuestion,
      curiosityGap: beat.frontier || beat.next || momentum.curiosityGap,
      predictionShift: beat.change || undefined,
      currentWant: beat.next || beat.frontier || undefined,
      unresolved: magnet.unresolved,
      forwardPull: magnet.nextNeed,
      payoffDebt: momentum.payoffDebt,
      magnet,
      subjectContinuity: state,
      informationFrontier: frontier(momentum, beat.change, beat.frontier || beat.next, magnet),
    };

    cuts.push({
      id: `cut-${beat.order}`,
      order: beat.order,
      role,
      gainKind,
      sourceIds: [],
      informationGain: beat.change,
      attentionDelta: beat.next || beat.frontier,
      viewerBefore: { known: momentum.known, expected: momentum.expected, unresolved: momentum.unresolved, currentWant: momentum.currentWant, recentChange: momentum.predictionShift },
      viewerAfter: { known: after.known, expected: after.expected, unresolved: after.unresolved, currentWant: after.currentWant, recentChange: after.predictionShift },
      momentum: { before: momentum, change: beat.change, after, nextPressure: beat.next || beat.frontier },
      necessity: { necessary: magnet.magnetStrength >= 0.3, reason: beat.necessity, removalDamage: `Would weaken the information frontier: ${beat.frontier || beat.next || beat.change}` },
      nextPromise: beat.next || beat.frontier,
      noveltyScore: magnet.novelty,
      confidence: 0.9,
    });
    momentum = after;
  }

  return {
    subject,
    premise: plan.premise,
    openingState: { known: baselineFacts },
    baselineFacts,
    openingMomentum: cuts[0]?.momentum?.before,
    cuts,
    closingMomentum: momentum,
    closingState: { known: momentum.known, unresolved: momentum.unresolved, currentWant: momentum.currentWant },
    continuity: [],
    antiCrutch: [],
    continuation: plan.closing,
  };
}

function extractTexts(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const texts = Array.isArray(record.texts) ? record.texts : Array.isArray(record.scenes) ? record.scenes : [];
  return texts.map(clean).filter(Boolean).slice(0, 6);
}

function scenesFromSequence(sequence: SequencePlay | undefined, texts: string[], input: AuthorBrainTruth) {
  if (!sequence) return { scenes: [] as AuthorScene[], rejected: 0, attempted: 0, rejectionReasons: {} as Record<string, number> };
  const attempted = Math.min(sequence.cuts.length, texts.length);
  const scenes: AuthorScene[] = [];
  const prior: string[] = [];
  const rejectionReasons: Record<string, number> = {};
  const worldValue = world(input);
  for (let i = 0; i < attempted; i += 1) {
    const cut = sequence.cuts[i];
    const text = clean(texts[i]);
    if (!text) continue;
    const policy = evaluateCut(text, worldValue, {
      role: cut.role,
      gainKind: cut.gainKind,
      change: cut.informationGain,
      next: cut.nextPromise,
      text,
      subjectEstablished: Boolean(cut.momentum?.before.subjectContinuity?.established),
      informationFrontier: cut.momentum?.before.informationFrontier?.frontier,
    }, prior);
    if (!policy.accepted) {
      for (const reason of policy.reasons) rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1;
      continue;
    }
    scenes.push({ text, kind: "line" });
    prior.push(text);
  }
  return { scenes, rejected: attempted - scenes.length, attempted, rejectionReasons };
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
    rhythm: ["hit", "variable", "hit", "payoff"] as AuthorCreativeBrief["rhythm"],
    avoid: ["fact parade", "identity repetition", "generic emotion arc", "invented reality", "labels in viewer prose", "literal questions", "padding", "explaining the joke"],
  };
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<{
  brief: AuthorCreativeBrief;
  scenes: AuthorScene[];
  sequence?: SequencePlay;
  field: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
}> {
  const subject = clean(input.subject) || "the subject";
  const cognition = buildAuthorCognitivePlan({
    prompt: clean(input.prompt), lens: clean(input.lens), subject, place: clean(input.place),
    facts: [...input.facts], sourceMoments: [...input.sourceMoments],
    memoryContext: [...(input.memoryContext ?? [])], priorScenes: [...(input.trajectory ?? [])],
    priorStrategies: [...(input.creativeLearningContext ?? [])], round: Math.max(1, input.trajectory?.length ? 2 : 1),
  });

  const field = {
    subjectTruth: input.subjectTruth ?? null,
    facts: uniq(input.facts, 24),
    moments: uniq(input.sourceMoments, 18),
    memory: uniq(input.memoryContext, 14),
    trajectory: uniq(input.trajectory, 14),
    presence: uniq(input.presenceSummary, 12),
    learning: uniq(input.creativeLearningContext, 20),
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    cognition: {
      mode: cognition.mode,
      chosenAttentionStrategy: cognition.chosenAttentionStrategy,
      attentionCandidates: cognition.attentionCandidates,
      contradictions: cognition.contradictions,
      operatorMix: cognition.operatorMix,
      callbackTargets: cognition.callbackTargets,
      sceneRules: cognition.sceneRules,
      authorBrief: cognition.authorBrief,
    },
  };

  const beatPlanResult = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal latent-movie discovery brain.",
        "Do NOT write the final prose yet.",
        "Find the movie hidden inside the supplied reality.",
        "Truth is immutable. Never invent concrete facts, people, actions, objects, locations, dates, dialogue, or outcomes.",
        "Facts are world memory. Do not spend beats merely restating identity or baseline facts.",
        "The objective is to create viewer movement: NOVELTY → UNCERTAINTY → INFORMATION VALUE → ATTENTION → TENSION → INFORMATION SEEKING → NARRATIVE ENGAGEMENT.",
        "For every beat identify exactly what CHANGES, what becomes the INFORMATION FRONTIER, and why the next beat is NECESSARY.",
        "A good beat changes the viewer's mental model or changes what the viewer wants to know.",
        "Prefer latent relationships: contradiction, status inversion, recurring object, callback with changed meaning, private meaning, service/personality collision, space as character, calm reality break, sensory fingerprint, or memory re-entry.",
        "Do not make the chosen vibe a stereotype. Funny means find what is actually funny here; horror means find what is actually unsettling here; romance means find what is actually intimate here.",
        "For a return chapter, the old material is evidence. The point is what is newly different or newly meaningful now.",
        "Produce 3 to 6 beats. No final prose. No scene text. No operator labels in viewer language.",
        "Output JSON only: {premise:string,baselineFacts:string[],beats:[{role:string,gainKind:string,change:string,next:string,frontier:string,necessity:string}],closing?:string}.",
        `SELECTED STRATEGY: ${cognition.chosenAttentionStrategy}.`,
        `OPERATOR GUIDANCE: ${cognition.operatorMix.join(", ")}.`,
        `CONTRADICTIONS: ${cognition.contradictions.join(" | ") || "find a subtle grounded tension"}.`,
        `CALLBACK TARGETS: ${cognition.callbackTargets.join(" | ") || "none"}.`,
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(field) },
  ], "json");
  debug("BEAT-DISCOVERY", beatPlanResult.text);

  let beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));
  if (!beatPlan) {
    beatPlan = {
      premise: clean(input.prompt),
      baselineFacts: uniq(input.facts, 12),
      beats: cognition.authorBrief.slice(0, 4).map((briefLine, index) => ({
        order: index + 1,
        role: index === 0 ? "hook" : index === 3 ? "payoff" : "discovery",
        gainKind: index === 0 ? "surprise" : index === 3 ? "payoff" : "discovery",
        change: briefLine,
        next: index < 3 ? `Build from beat ${index + 1} without repeating it` : "land the chosen meaning",
        frontier: briefLine,
        necessity: "Preserve forward information seeking.",
      })),
    };
  }

  const sequence = buildViewerMomentum(subject, beatPlan);
  if (!sequence) {
    return {
      brief: brief(input, cognition.chosenAttentionStrategy), scenes: [], sequence: undefined, field,
      diagnostics: { cognitionMode: cognition.mode, chosenAttentionStrategy: cognition.chosenAttentionStrategy, beatPlan: beatPlan.beats, beatCount: beatPlan.beats.length, sequenceCutsAttempted: 0, sequenceCutsRejected: 0, finalScenes: 0 },
    };
  }

  const realizationInput = {
    premise: beatPlan.premise,
    baselineFacts: beatPlan.baselineFacts,
    subjectTruth: input.subjectTruth ?? null,
    beats: sequence.cuts.map((cut, index) => ({
      order: index + 1,
      role: cut.role,
      change: cut.informationGain,
      frontier: cut.momentum?.after.informationFrontier?.frontier ?? cut.nextPromise,
      nextNeed: cut.nextPromise,
      whyNecessary: beatPlan.beats[index]?.necessity,
    })),
    memory: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
    prompt: input.prompt,
    lens: input.lens,
  };

  const realizationResult = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's theatrical mouth. The brain has already decided what each beat must accomplish.",
        "Do not invent new facts or events. Do not redesign the sequence.",
        "Write exactly one viewer-facing line per beat, in order.",
        "Each line must REALIZE the corresponding beat, not describe the beat.",
        "Do not mention roles, strategies, beats, information frontier, cognition, or the writing process.",
        "Do not ask literal questions unless a question is genuinely the intended artistic line.",
        "Do not explain the joke, feeling, or meaning.",
        "Once the subject is established, stop repeating the subject name unless the name itself has new dramatic value.",
        "Prefer implication, attitude, compressed human framing, specificity, and theatricality.",
        "For memories, restore the felt fingerprint rather than listing category facts.",
        "For service experiences, make the client/subject the center, not the provider's procedure.",
        "For funny material, exaggerate social meaning or status without inventing facts.",
        "For horror, preserve calm behavior against strange reality; do not add generic monsters or gore.",
        "For romance, use the supplied private detail and let significance carry the feeling.",
        "Output JSON only: {texts:string[]}. No labels. No emojis. No commentary.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(realizationInput) },
  ], "json");
  debug("MOUTH-REALIZATION", realizationResult.text);

  const texts = extractTexts(parseJson<unknown>(realizationResult.text));
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
      sequenceCutsAttempted: sequenceResult.attempted,
      sequenceCutsRejected: sequenceResult.rejected,
      rejectionReasons: sequenceResult.rejectionReasons,
      realizationTexts: texts,
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
