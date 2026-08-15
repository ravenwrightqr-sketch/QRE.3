/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * LIVING INTELLIGENCE CORE.
 * General laws belong here; benchmark hacks and domain-specific author
 * branches do not.
 *
 * Core sequence primitive:
 * MAGNET CIRCLE + SUBJECT CONTINUITY + INFORMATION FRONTIER.
 * The world is truth. The sequence is viewer-state movement. The mouth is
 * downstream realization.
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
  ViewerState,
} from "@qre/contracts";
import { evaluateCut, type CutWorld } from "./authorCutPolicy.js";
import { localModelGenerate } from "./localModelRuntime.js";

const ROLES: readonly ViewerAttentionRole[] = [
  "arrival", "hook", "question", "pressure", "reframe", "escalation",
  "discovery", "consequence", "release", "payoff", "callback", "continuation",
];
const ROLE_ALIASES: Record<string, ViewerAttentionRole> = {
  setup: "arrival",
  hypothesis: "pressure",
  turn: "reframe",
  reveal: "discovery",
};
const GAINS = new Set([
  "new_fact", "surprise", "question", "escalation", "reframe",
  "discovery", "consequence", "callback", "payoff",
]);
const GAIN_ALIASES: Record<string, SequenceCut["gainKind"]> = {
  resolution: "payoff",
  reveal: "discovery",
  unrevealed_information: "discovery",
  hidden_information: "discovery",
  turn: "reframe",
  reversal: "reframe",
  emotional_state: "new_fact",
  anticipation: "question",
  information: "new_fact",
  emotion: "reframe",
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 20): string[] =>
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

function debug(raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · AUTHOR-BRAIN-UNIVERSAL ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
}

function canonicalRole(value: unknown): string {
  const normalized = clean(value).toLowerCase();
  return ROLE_ALIASES[normalized] ?? normalized;
}

function canonicalGain(value: unknown): string {
  const normalized = clean(value).toLowerCase();
  return GAIN_ALIASES[normalized] ?? normalized;
}

function normalizeBaselineFacts(value: unknown): string[] {
  if (Array.isArray(value)) return uniq(value, 12);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return uniq(Object.entries(record).filter(([, state]) => Boolean(state)).map(([fact]) => fact), 12);
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

function meaningfulWords(value: string): Set<string> {
  return new Set(
    clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 4 && !STOP.has(word)),
  );
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (!a.size) return 0;
  let hits = 0;
  for (const word of a) if (b.has(word)) hits += 1;
  return hits / a.size;
}

function magnetCircle(before: ViewerMomentum, change: string, next: string, gain: string): MagnetCircle {
  const known = meaningfulWords(before.known.join(" "));
  const changeWords = meaningfulWords(change);
  const nextWords = meaningfulWords(next);
  const novelty = metric(1 - overlapRatio(changeWords, known));
  const genericNext = /^(?:what happens next|what will happen next|something else|the next step|more to come)[.?]?$/.test(next.toLowerCase());
  const uncertainty = metric(
    (nextWords.size ? 0.55 : 0.15) +
    (before.unresolved || before.curiosityGap ? 0.2 : 0) +
    (["question", "surprise"].includes(gain) ? 0.2 : 0) -
    (genericNext ? 0.45 : 0),
  );
  const informationValue = metric(
    novelty * 0.45 +
    (changeWords.size ? 0.2 : 0) +
    (nextWords.size ? 0.15 : 0) +
    (["surprise", "discovery", "reframe", "consequence", "payoff", "callback"].includes(gain) ? 0.2 : 0),
  );
  const attention = metric(novelty * 0.4 + informationValue * 0.6);
  const tension = metric(uncertainty * informationValue);
  const informationSeeking = metric(
    (nextWords.size ? 0.3 : 0) +
    (next ? 0.25 : 0) +
    (before.unresolved ? 0.2 : 0) +
    (before.forwardPull ? 0.15 : 0),
  );
  const narrativeEngagement = metric((attention + tension + informationSeeking) / 3);
  const magnetStrength = metric(
    novelty * 0.15 + uncertainty * 0.15 + informationValue * 0.2 +
    attention * 0.15 + tension * 0.2 + informationSeeking * 0.1 +
    narrativeEngagement * 0.05,
  );
  return { novelty, uncertainty, informationValue, attention, tension, informationSeeking, narrativeEngagement, magnetStrength, unresolved: next || change || before.unresolved, nextNeed: next || before.forwardPull };
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

function subjectContinuity(subject: string, established: boolean, text: string, cutOrder: number): SubjectContinuity {
  const escaped = subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const explicit = Boolean(subject) && new RegExp(`\\b${escaped}\\b`, "i").test(text);
  const pronoun = /\b(?:he|she|they|it|him|her|them|his|their|its)\b/i.test(text);
  const referenceMode = explicit ? "name" : pronoun ? "pronoun" : "implicit";
  return {
    established: established || Boolean(subject),
    subject,
    referenceMode,
    referenceCost: explicit && established ? 0.35 : pronoun && established ? 0.1 : 0,
    lastExplicitReference: explicit ? cutOrder : undefined,
  };
}

function recoveredTexts(raw: string): string[] {
  const out: string[] = [];
  const pattern = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of raw.matchAll(pattern)) {
    try { out.push(clean(JSON.parse(`"${match[1]}"`))); } catch { /* ignore */ }
  }
  return out;
}

function buildSequence(subject: string, raw: unknown): SequencePlay | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as { premise?: unknown; baselineFacts?: unknown; cuts?: unknown; continuation?: unknown };
  if (!Array.isArray(value.cuts)) return undefined;

  const baselineFacts = normalizeBaselineFacts(value.baselineFacts);
  let momentum: ViewerMomentum = {
    known: baselineFacts,
    subjectContinuity: { established: false, subject, referenceMode: "implicit", referenceCost: 0 },
    informationFrontier: { known: baselineFacts, frontier: "", novelty: 0, uncertainty: 0, informationValue: 0, tension: 0 },
  };
  const cuts: SequenceCut[] = [];
  let subjectEstablished = false;

  for (const [index, item] of value.cuts.entries()) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const role = canonicalRole(c.role);
    const gain = canonicalGain(c.gainKind);
    if (!ROLES.includes(role as ViewerAttentionRole) || !GAINS.has(gain)) continue;

    const text = clean(c.text);
    const change = clean(c.change);
    const next = clean(c.next);
    const magnet = magnetCircle(momentum, change, next, gain);
    const subjectState = subjectContinuity(subject, subjectEstablished, text, index + 1);
    subjectEstablished = subjectEstablished || Boolean(subjectState.subject);
    const frontierState = frontier(momentum, change, next, magnet);

    const after: ViewerMomentum = {
      known: momentum.known,
      expected: next || undefined,
      activeQuestion: gain === "question" ? change : momentum.activeQuestion,
      curiosityGap: next || momentum.curiosityGap,
      predictionShift: change || undefined,
      currentWant: next || undefined,
      unresolved: magnet.unresolved,
      forwardPull: magnet.nextNeed,
      payoffDebt: momentum.payoffDebt,
      magnet,
      subjectContinuity: subjectState,
      informationFrontier: frontierState,
    };

    cuts.push({
      id: `cut-${index + 1}`,
      order: index + 1,
      role: role as ViewerAttentionRole,
      gainKind: gain as SequenceCut["gainKind"],
      sourceIds: [],
      informationGain: change,
      attentionDelta: next,
      viewerBefore: { known: momentum.known, expected: momentum.expected, unresolved: momentum.unresolved, currentWant: momentum.currentWant, recentChange: momentum.predictionShift },
      viewerAfter: { known: after.known, expected: after.expected, unresolved: after.unresolved, currentWant: after.currentWant, recentChange: after.predictionShift },
      momentum: { before: momentum, change, after, nextPressure: next },
      necessity: {
        necessary: magnet.magnetStrength >= 0.35 || Boolean(next),
        reason: next || change,
        removalDamage: magnet.magnetStrength >= 0.35 ? `Weakens the information-seeking magnet (${magnet.magnetStrength.toFixed(2)})` : "Cut does not yet carry enough forward pull",
      },
      nextPromise: next || undefined,
      noveltyScore: magnet.novelty,
      confidence: 0.8,
      ...(text ? { text } : {}),
    } as SequenceCut & { text?: string });

    momentum = after;
  }

  if (!cuts.length) return undefined;
  return {
    subject,
    premise: clean(value.premise).replace(/[.?!]$/, ""),
    openingState: { known: baselineFacts },
    baselineFacts,
    openingMomentum: momentum,
    cuts,
    closingMomentum: momentum,
    continuity: [],
    antiCrutch: [],
    continuation: clean(value.continuation) || undefined,
  };
}

function scenesFromSequence(sequence: SequencePlay | undefined, input: AuthorBrainTruth): { scenes: AuthorScene[]; attempted: number; rejected: number; rejectionReasons: Record<string, number> } {
  if (!sequence) return { scenes: [], attempted: 0, rejected: 0, rejectionReasons: {} };
  const attempted = sequence.cuts.length;
  const prior: string[] = [];
  const rejectionReasons: Record<string, number> = {};
  const scenes: AuthorScene[] = [];

  for (const cut of sequence.cuts) {
    const text = clean((cut as SequenceCut & { text?: string }).text ?? "");
    if (!text) continue;
    const policy = evaluateCut(
      text,
      world(input),
      {
        role: cut.role,
        gainKind: cut.gainKind,
        change: cut.informationGain,
        next: cut.nextPromise,
        text,
        subjectEstablished: Boolean(cut.order > 1),
        informationFrontier: cut.viewerBefore.recentChange,
      },
      prior,
    );
    if (!policy.accepted) {
      for (const reason of policy.reasons) rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1;
      continue;
    }
    scenes.push({ text, kind: "line" as const });
    prior.push(text);
  }

  return { scenes, attempted, rejected: attempted - scenes.length, rejectionReasons };
}

function brief(input: AuthorBrainTruth): AuthorCreativeBrief {
  return {
    angle: "the strongest unresolved information frontier in the world",
    engine: "viewer-momentum magnet discovery",
    question: "what changes the viewer's mental model next?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: "information seeking through uncertainty",
    payoff: "a character-specific consequence or reframe",
    callback: input.memoryContext?.[0] ?? input.trajectory?.[0] ?? "none yet",
    rhythm: ["hit", "variable", "hit", "payoff"],
    avoid: ["fact parade", "identity repetition after establishment", "generic emotion arc", "invented reality", "literal viewer questions", "service-provider protagonist", "padding", "over-explaining", "frontier-starved filler"],
  };
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown>; diagnostics: Record<string, unknown> }> {
  const learning = uniq(input.creativeLearningContext, 20);
  const field = {
    identity: uniq(input.subjectTruth?.identityFacts, 10),
    facts: uniq(input.facts, 20),
    moments: uniq(input.sourceMoments, 16),
    memory: uniq(input.memoryContext, 12),
    trajectory: uniq(input.trajectory, 12),
    presence: uniq(input.presenceSummary, 10),
    learning,
    lens: clean(input.lens),
    prompt: clean(input.prompt),
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal creative author and sequence-discovery brain.",
        "Your job is not to write a conventional story, summarize facts, or produce a generic emotional arc. Your job is to discover the strongest information-seeking movie hidden in the supplied world.",
        "The universal attention primitive is the MAGNET CIRCLE: novelty → uncertainty → information value → attention → tension → information seeking → narrative engagement → discovery/reframe/payoff → new uncertainty.",
        "Treat every supplied fact as world memory, not as a required sentence or beat.",
        "Build a mental FACT GRAPH first: which known facts contradict, recur, recontextualize, imply, constrain, or collide with one another? The strongest relationship is usually more valuable than any single fact.",
        "Prefer a surprising relationship among known facts over a predictable event chain.",
        "Never turn 'scared at first' + 'happy after' into the default fear→treat→happiness plot unless the relationship itself is genuinely the highest-value magnet.",
        "Never invent a physical event merely to dramatize an emotional state. Do not turn scared into trembling, hiding, crying, jumping, staring, etc. Do not turn happy into wagging, smiling, licking, leaping, cheering, etc.",
        "Do not invent tag text, hidden history, new objects, new participants, owners, groomers, dialogue, locations, or future outcomes unless supplied evidence supports them.",
        "The provider or service is usually stage context. The supplied subject owns the temporary stage unless the provider is itself the significant relationship.",
        "Once the subject is established, hold the subject in working memory. Repeating the name is a cost. Spend the next cut on the INFORMATION FRONTIER instead.",
        "Information frontier means the highest-value thing that is newly uncertain, newly meaningful, newly connected, newly contrasted, newly consequential, or newly recontextualized.",
        "A cut should create or advance a valuable unresolved state. If removing the cut would barely change what the viewer seeks next, do not spend a cut on it.",
        "Favor compressed implication, attitude, status shift, contradiction, recurrence, callback, juxtaposition, withheld explanation, escalation, reframe, and theatrical framing.",
        "Do not explain the feeling, the joke, or the lesson. Let the viewer infer it.",
        "Creative style is downstream of cognition. Choose whatever lens best realizes the magnet; do not force wholesome, sentimental, or generic feel-good behavior.",
        "Two-word or fragment cuts are allowed when they carry more information than a sentence. Compression is cognitive density, not mere brevity.",
        "Output ONLY this exact JSON shape. baselineFacts MUST be an array of strings. cuts MUST be 2 to 6 objects. role MUST be one of: arrival, hook, question, pressure, reframe, escalation, discovery, consequence, release, payoff, callback, continuation. gainKind MUST be one of: new_fact, surprise, question, escalation, reframe, discovery, consequence, callback, payoff. Every cut MUST contain role, gainKind, change, next, text.",
        "Do not output booleans, alternate schemas, commentary, or an optional continuation object. continuation, when used, must be a string.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(field) },
  ], "json");

  debug(result.text);
  const parsed = parseJson<{ sequence?: unknown; baselineFacts?: unknown; cuts?: unknown }>(result.text);
  const sequenceRaw = parsed?.sequence ?? parsed;
  const sequence = buildSequence(input.subject, sequenceRaw);
  const sequenceResult = scenesFromSequence(sequence, input);
  const worldValue = world(input);
  const recovered = recoveredTexts(result.text);
  const prior = [...sequenceResult.scenes.map((scene) => scene.text)];
  const recoveredValid = recovered.filter((text) => evaluateCut(
    text,
    worldValue,
    {
      role: "continuation",
      gainKind: "callback",
      subjectEstablished: Boolean(input.subject),
      informationFrontier: sequence?.closingMomentum?.informationFrontier?.frontier,
      text,
    },
    prior,
  ).accepted);
  const scenes = [...sequenceResult.scenes, ...recoveredValid.map((text) => ({ text, kind: "line" as const }))]
    .filter((scene, index, all) => all.findIndex((candidate) => candidate.text.toLowerCase() === scene.text.toLowerCase()) === index)
    .slice(0, 6);

  const magnetValues = sequence?.cuts.map((cut) => cut.momentum?.after.magnet?.magnetStrength ?? 0).filter(Number.isFinite) ?? [];
  const magnetAverage = magnetValues.length ? magnetValues.reduce((sum, value) => sum + value, 0) / magnetValues.length : 0;
  const magnetPeak = magnetValues.length ? Math.max(...magnetValues) : 0;
  const magnetFloor = magnetValues.length ? Math.min(...magnetValues) : 0;

  return {
    brief: brief(input),
    scenes,
    sequence,
    field,
    diagnostics: {
      sequenceCutsAttempted: sequenceResult.attempted,
      sequenceCutsRejected: sequenceResult.rejected,
      rejectionReasons: sequenceResult.rejectionReasons,
      recoveredTextsAttempted: recovered.length,
      recoveredTextsRejected: recovered.length - recoveredValid.length,
      finalScenes: scenes.length,
      magnetAverage: metric(magnetAverage),
      magnetPeak: metric(magnetPeak),
      magnetFloor: metric(magnetFloor),
      magnetCutsMeasured: magnetValues.length,
      subjectSpaceEstablished: Boolean(sequence?.closingMomentum?.subjectContinuity?.established),
      informationFrontier: sequence?.closingMomentum?.informationFrontier?.frontier ?? "",
    },
  };
}
