/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * ONE MASTER AUTHOR PATH.
 * The author cognition plan decides what is worth pursuing.
 * The sequence layer turns that plan into viewer-state movement.
 * The canonical cut policy decides what is allowed to reach the mouth.
 *
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
  ViewerState,
} from "@qre/contracts";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { evaluateCut, type CutWorld } from "./authorCutPolicy.js";
import { localModelGenerate } from "./localModelRuntime.js";

const ROLES: readonly ViewerAttentionRole[] = [
  "arrival", "hook", "question", "pressure", "reframe", "escalation",
  "discovery", "consequence", "release", "payoff", "callback", "continuation",
];

const ROLE_ALIASES: Record<string, ViewerAttentionRole> = {
  setup: "arrival",
  opening: "arrival",
  introduction: "arrival",
  development: "pressure",
  hypothesis: "pressure",
  turn: "reframe",
  reveal: "discovery",
  complication: "escalation",
  resolution: "payoff",
  coda: "continuation",
};

const GAIN_ALIASES: Record<string, NonNullable<SequenceCut["gainKind"]>> = {
  novelty: "new_fact",
  context: "new_fact",
  emotional_state: "new_fact",
  information: "new_fact",
  satisfaction: "payoff",
  resolution: "payoff",
  reveal: "discovery",
  surprise: "surprise",
  anticipation: "question",
  uncertainty: "question",
  escalation: "escalation",
  information_value: "discovery",
  contrast: "reframe",
  replay: "callback",
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

function canonicalRole(value: unknown): ViewerAttentionRole | undefined {
  const normalized = clean(value).toLowerCase();
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

function normalizeBaselineFacts(value: unknown): string[] {
  if (Array.isArray(value)) return uniq(value, 16);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return uniq(
    Object.entries(record)
      .filter(([, enabled]) => Boolean(enabled))
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

function words(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((word) => word.length >= 4 && !STOP.has(word));
}

function wordSet(value: string): Set<string> {
  return new Set(words(value));
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

function computeFrontier(before: ViewerMomentum, change: string, next: string, magnet: MagnetCircle): InformationFrontier {
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

function computeSubjectContinuity(subject: string, established: boolean, text: string, order: number): SubjectContinuity {
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

function recoveredTexts(raw: string): string[] {
  const out: string[] = [];
  const pattern = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of raw.matchAll(pattern)) {
    try { out.push(clean(JSON.parse(`"${match[1]}"`))); } catch { /* ignore malformed recovery */ }
  }
  return [...new Set(out.filter(Boolean))];
}

function buildSequence(subject: string, raw: unknown): SequencePlay | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as {
    premise?: unknown;
    baselineFacts?: unknown;
    cuts?: unknown;
    continuation?: unknown;
  };
  if (!Array.isArray(value.cuts)) return undefined;

  const baselineFacts = normalizeBaselineFacts(value.baselineFacts);
  let momentum: ViewerMomentum = {
    known: baselineFacts,
    subjectContinuity: {
      established: false,
      subject,
      referenceMode: "implicit",
      referenceCost: 0,
    },
    informationFrontier: {
      known: baselineFacts,
      frontier: "",
      novelty: 0,
      uncertainty: 0,
      informationValue: 0,
      tension: 0,
    },
  };
  const cuts: SequenceCut[] = [];
  let subjectEstablished = false;

  for (const [index, item] of value.cuts.entries()) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const role = canonicalRole(c.role);
    const gainKind = canonicalGain(c.gainKind);
    if (!role || !gainKind) continue;

    const text = clean(c.text);
    const change = clean(c.change);
    const next = clean(c.next);
    const magnet = computeMagnet(momentum, change, next, gainKind);
    const subjectState = computeSubjectContinuity(subject, subjectEstablished, text, index + 1);
    subjectEstablished = subjectEstablished || Boolean(subjectState.subject);
    const frontierState = computeFrontier(momentum, change, next, magnet);
    const after: ViewerMomentum = {
      known: momentum.known,
      expected: next || undefined,
      activeQuestion: gainKind === "question" ? change : momentum.activeQuestion,
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
      role,
      gainKind,
      sourceIds: [],
      informationGain: change,
      attentionDelta: next,
      viewerBefore: {
        known: momentum.known,
        expected: momentum.expected,
        unresolved: momentum.unresolved,
        currentWant: momentum.currentWant,
        recentChange: momentum.predictionShift,
      },
      viewerAfter: {
        known: after.known,
        expected: after.expected,
        unresolved: after.unresolved,
        currentWant: after.currentWant,
        recentChange: after.predictionShift,
      },
      momentum: {
        before: momentum,
        change,
        after,
        nextPressure: next || undefined,
        necessity: {
          necessary: magnet.magnetStrength >= 0.35 || Boolean(next),
          reason: next || change || "",
          removalDamage: magnet.magnetStrength >= 0.35
            ? `Weakens forward pull (${magnet.magnetStrength.toFixed(2)})`
            : "Low demonstrated forward pull",
        },
      },
      necessity: {
        necessary: magnet.magnetStrength >= 0.35 || Boolean(next),
        reason: next || change || "",
        removalDamage: magnet.magnetStrength >= 0.35 ? "Removes a meaningful attention transition" : "Little effect on the viewer frontier",
      },
      nextPromise: next || undefined,
      payoffConnection: clean(c.payoffConnection) || undefined,
      noveltyScore: magnet.novelty,
      confidence: 0.8,
      ...(text ? ({ text } as SequenceCut & { text?: string }) : {}),
    });

    momentum = after;
  }

  if (!cuts.length) return undefined;
  return {
    subject,
    premise: clean(value.premise).replace(/[.?!]$/, ""),
    openingState: { known: baselineFacts },
    baselineFacts,
    openingMomentum: cuts[0]?.momentum?.before,
    cuts,
    closingMomentum: momentum,
    closingState: { known: momentum.known, unresolved: momentum.unresolved, currentWant: momentum.currentWant },
    continuity: [],
    antiCrutch: [],
    continuation: clean(value.continuation) || undefined,
  };
}

function scenesFromSequence(
  sequence: SequencePlay | undefined,
  input: AuthorBrainTruth,
): { scenes: AuthorScene[]; attempted: number; rejected: number; rejectionReasons: Record<string, number> } {
  if (!sequence) return { scenes: [], attempted: 0, rejected: 0, rejectionReasons: {} };
  const attempted = sequence.cuts.length;
  const prior: string[] = [];
  const rejectionReasons: Record<string, number> = {};
  const scenes: AuthorScene[] = [];
  const worldValue = world(input);

  for (const cut of sequence.cuts) {
    const text = clean((cut as SequenceCut & { text?: string }).text ?? "");
    if (!text) continue;
    const policy = evaluateCut(
      text,
      worldValue,
      {
        role: cut.role,
        gainKind: cut.gainKind,
        change: cut.informationGain,
        next: cut.nextPromise,
        text,
        subjectEstablished: Boolean(cut.momentum?.before.subjectContinuity?.established),
        informationFrontier: cut.momentum?.before.informationFrontier?.frontier,
      },
      prior,
    );
    if (!policy.accepted) {
      for (const reason of policy.reasons) rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1;
      continue;
    }
    scenes.push({ text, kind: "line" });
    prior.push(text);
  }

  return { scenes, attempted, rejected: attempted - scenes.length, rejectionReasons };
}

function brief(input: AuthorBrainTruth, chosenStrategy?: string): AuthorCreativeBrief {
  return {
    angle: chosenStrategy ? `attention strategy: ${chosenStrategy}` : "the strongest unresolved information frontier in the world",
    engine: "viewer-momentum magnet discovery",
    question: "what changes the viewer's mental model next?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: "information seeking through uncertainty",
    payoff: "a character-specific consequence or reframe",
    callback: input.memoryContext?.[0] ?? input.trajectory?.[0] ?? "none yet",
    rhythm: ["hit", "hit", "hit", "hit"] as AuthorCreativeBrief["rhythm"],
    avoid: [
      "fact parade",
      "identity repetition after establishment",
      "generic emotion arc",
      "invented reality",
      "literal viewer questions",
      "service-provider protagonist",
      "padding",
      "over-explaining",
      "frontier-starved filler",
      "emoji fact cards",
      "subject-only cuts",
    ],
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
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    subject,
    place: clean(input.place),
    facts: [...input.facts],
    sourceMoments: [...input.sourceMoments],
    memoryContext: [...(input.memoryContext ?? [])],
    priorScenes: [...(input.trajectory ?? [])],
    priorStrategies: [...(input.creativeLearningContext ?? [])],
    round: Math.max(1, input.trajectory?.length ? 2 : 1),
  });

  const learning = uniq(input.creativeLearningContext, 20);
  const field = {
    identity: uniq(input.subjectTruth?.identityFacts, 12),
    facts: uniq(input.facts, 24),
    moments: uniq(input.sourceMoments, 18),
    memory: uniq(input.memoryContext, 14),
    trajectory: uniq(input.trajectory, 14),
    presence: uniq(input.presenceSummary, 12),
    learning,
    lens: clean(input.lens),
    prompt: clean(input.prompt),
    cognition: {
      mode: cognition.mode,
      chosenAttentionStrategy: cognition.chosenAttentionStrategy,
      attentionCandidates: cognition.attentionCandidates,
      contradictions: cognition.contradictions,
      operatorMix: cognition.operatorMix,
      callbackTargets: cognition.callbackTargets,
    },
  };

  const systemPrompt = [
    "You are QRE's universal creative author and sequence-discovery brain.",
    "The world supplied by the user is truth. Do not invent concrete facts, events, people, objects, locations, dates, hidden history, dialogue, or future outcomes unless supported by supplied evidence.",
    "You are given a precomputed cognitive plan. TRUST THAT PLAN. Do not replace it with a generic plot template.",
    `COGNITIVE MODE: ${cognition.mode}.`,
    `CHOSEN ATTENTION STRATEGY: ${cognition.chosenAttentionStrategy}.`,
    `OPERATOR MIX: ${cognition.operatorMix.join(", ")}.`,
    `CONTRADICTIONS: ${cognition.contradictions.join(" | ") || "none explicit; find only grounded tension"}.`,
    `CALLBACK TARGETS: ${cognition.callbackTargets.join(" | ") || "none"}.`,
    "The universal attention primitive is MAGNET CIRCLE: novelty → uncertainty → information value → attention → tension → information seeking → narrative engagement.",
    "Treat baseline facts as world memory, not required lines. Identity is established once and then held in working memory.",
    "Search relationships among facts: contradiction, recurrence, recontextualization, implication, status shift, convergence, unresolved object, callback, or specific detail with changed meaning.",
    "Do not produce a fact parade, emoji cards, labels, or one-word subject/name cuts.",
    "Do not turn 'scared at first' + 'happy after' into the default fear→treat→happiness plot unless the relationship itself is the strongest grounded magnet.",
    "Do not use physical actions as emotional placeholders unless the action is supported by the evidence.",
    "Once the subject is established, spend words on the information frontier, not repeated subject names.",
    "For living-memory work, prioritize concrete supplied sensory, social, emotional, identity, and micro-detail fingerprints over category shorthand such as 'rave', 'beautiful', 'magical', 'alive', or 'unforgettable'.",
    "For humor, seek personality, status inversion, contradiction, implication, compression, and escalation. Do not force jokes.",
    "For horror, favor grounded contradictions, calm human behavior, spatial violations, understatement, and escalating meaning rather than stock horror imagery.",
    "For romance or tenderness, use private meaning, recurrence, specificity, and changed significance rather than generic sentiment.",
    "For service experiences, keep the customer/subject as the protagonist unless the provider is itself the meaningful subject.",
    "Every cut must earn the next cut. If removing it would not materially change what the viewer wants to know or feel next, omit it.",
    "Prefer compressed, high-density realization. Fragments are allowed when they imply more than a full sentence.",
    "Do not explain the joke, feeling, or meaning after the viewer can already infer it.",
    "Output ONLY JSON. Shape: {premise:string, baselineFacts:string[], cuts:[{role:string,gainKind:string,change:string,next:string,text:string}], continuation?:string}. cuts must contain 2-6 objects. No alternate schema.",
    ...cognition.sceneRules.map((rule) => `SCENE RULE: ${rule}`),
    ...cognition.authorBrief.map((rule) => `AUTHOR BRIEF: ${rule}`),
  ].join(" ");

  const result = await localModelGenerate(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(field) },
    ],
    "json",
  );

  if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") {
    console.log(`\n--- QRE RAW MODEL OUTPUT · AUTHOR-BRAIN-UNIVERSAL ---\n${result.text}\n--- END RAW MODEL OUTPUT ---\n`);
  }

  const parsed = parseJson<{ sequence?: unknown; baselineFacts?: unknown; cuts?: unknown }>(result.text);
  const sequenceRaw = parsed?.sequence ?? parsed;
  const sequence = buildSequence(subject, sequenceRaw);
  const sequenceResult = scenesFromSequence(sequence, input);
  const recovered = recoveredTexts(result.text);
  const prior = sequenceResult.scenes.map((scene) => scene.text);
  const recoveredValid = recovered.filter((text) => evaluateCut(
    text,
    world(input),
    {
      role: "continuation",
      gainKind: "callback",
      subjectEstablished: Boolean(sequence?.closingMomentum?.subjectContinuity?.established),
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
    brief: brief(input, cognition.chosenAttentionStrategy),
    scenes,
    sequence,
    field,
    diagnostics: {
      cognitionMode: cognition.mode,
      chosenAttentionStrategy: cognition.chosenAttentionStrategy,
      attentionCandidates: cognition.attentionCandidates,
      contradictions: cognition.contradictions,
      operatorMix: cognition.operatorMix,
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
