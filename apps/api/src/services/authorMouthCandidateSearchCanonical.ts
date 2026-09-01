import type {
  AuthorDomainContext,
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens } from "./authorCharacterLensEngine.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";

/**
 * QRE CANONICAL MOUTH
 *
 * One production language-realization boundary.
 *
 * FEEL IT. DO NOT EXPLAIN IT.
 *
 * Reality freedom = low.
 * Framing freedom = high.
 *
 * Mouth does not plan the movie, invent events, or create people.
 * It finds the strongest human-facing cut for an already-approved beat.
 */

export type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: AuthorDomainContext;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).split(/\s+/).filter(Boolean);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const normalize = (value: string): string => clean(value).replace(/[.!?]+$/g, "").toLowerCase();
const tokens = (value: string): Set<string> => new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3));

const STATUS = /\b(?:fab|fabulous|dapper|fierce|cool|sharp|ready|done|cleared|approved|complete|finished|upgrade|victory|win|winner|exit|peace|temporary|temporarily|resumed|made it|level|mission|operation|case|verdict|negotiations?)\b/i;
const ABSTRACT = /\b(?:feeling|emotion|meaning|significance|transformation|consequence|connection|warmth|lightness|stillness|relief|tension|pressure|presence|absence|possibility|recognition|momentum|energy|rhythm|silence|distance|closeness|uncertainty|comfort|ease|weight|space|pull|gravity)\b/i;
const ANALYTIC = /\b(?:this means|which means|this shows|which shows|the meaning is|the point is|in other words|the viewer|the audience|the relationship|the experience was|the significance)\b/i;
const META = /\b(?:cognition|planner|planning|beat|sequence|candidate|semantic|trajectory|author|mouth|reframe|strategy|operator)\b/i;
const DETERMINER = /^(?:the|a|an|my|our|your|his|her|their)\b/i;
const EXPLICIT_PERSON = /\b(?:the man|the woman|the boy|the girl|the guy|the lady|my friend|my partner|my wife|my husband|my girlfriend|my boyfriend|he|him|his|she|her|hers|they|them|their)\b/i;
const ROLE_WORD = /\b(?:groomer|barber|mechanic|housekeeper|cleaner|waiter|waitress|server|chef|driver|photographer|planner|officiant|vendor|host|manager|employee|staff|worker|therapist|doctor|nurse|teacher|agent|lawyer|judge|witness|detective|captain|boss)\b/i;
const PHYSICAL_VERB = /\b(?:smile|smiled|laugh|laughed|walk|walked|move|moved|look|looked|touch|touched|hold|held|reach|reached|turn|turned|watch|watched|breathe|breathed|blink|blinked|stare|stared|wink|winked|nod|nodded|shrug|shrugged|stand|stood|sit|sat|run|ran|jump|jumped|wag|wagged|bark|barked|kiss|kissed|hug|hugged|point|pointed|grab|grabbed|carry|carried|open|opened|close|closed|enter|entered|leave|left|return|returned|call|called|talk|talked|speak|spoke)\b/i;
const BODY_OR_STAGE = /\b(?:eye|eyes|face|mouth|shoulder|shoulders|hand|hands|head|tail|fur|coat|room|door|window|floor|wall|table|chair|car|road|street|sky|shadow|light|sound|scent|breath|voice|water|phone|screen)\b/i;
const FRAME_VERB = /\b(?:called|resumed|approved|cleared|secured|completed|started|began|ended|won|lost|continued|returned|reopened|settled|entered|left)\b/i;
const FRAME_NOUN = /\b(?:lawyer|judge|witness|detective|agent|captain|boss|mission|operation|case|verdict|negotiation|negotiations|level|quest|upgrade|extraction|inspection|war|victory|showtime|final|champion|legend)\b/i;

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return [...new Set((beat.eventIds ?? []).map((id) => envelope.events.find((event) => event.id === id)?.label ?? "").map(clean).filter(Boolean))];
}

function worldText(envelope: RealityEnvelope): string {
  return [
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ].map(clean).filter(Boolean).join(" ");
}

function exactSource(text: string, labels: readonly string[]): boolean {
  const normalized = normalize(text);
  return labels.some((label) => normalize(label) === normalized);
}

function sourceCoverage(text: string, labels: readonly string[]): number {
  const candidate = tokens(text);
  if (!candidate.size || !labels.length) return 0;
  const source = tokens(labels.join(" "));
  let hits = 0;
  for (const token of candidate) if (source.has(token)) hits += 1;
  return metric(hits / Math.max(1, candidate.size));
}

function frameOnly(text: string, envelope: RealityEnvelope): boolean {
  const value = clean(text);
  if (!value || value.length > 48) return false;
  if (!ROLE_WORD.test(value) && !FRAME_NOUN.test(value)) return false;
  if (DETERMINER.test(value) || EXPLICIT_PERSON.test(value)) return false;
  if (!FRAME_VERB.test(value) && !STATUS.test(value)) return false;
  return !BODY_OR_STAGE.test(value);
}

function unstatedPerson(text: string, envelope: RealityEnvelope): boolean {
  const value = clean(text);
  if (!ROLE_WORD.test(value)) return false;

  const explicitRole = new RegExp(`\\b${ROLE_WORD.source.slice(2, -3)}\\b`, "i");
  const supplied = worldText(envelope);
  const roleIsSupplied = explicitRole.test(supplied);

  /* A bare framing headline such as "Lawyer already called." is allowed. */
  if (frameOnly(value, envelope)) return false;
  if (roleIsSupplied) return false;

  return DETERMINER.test(value);
}

function unsupportedConcrete(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const value = clean(text);
  if (!value) return true;

  const labels = sourceLabels(beat, envelope);
  const world = worldText(envelope);
  if (exactSource(value, labels)) return false;
  if (sourceCoverage(value, labels) >= 0.78) return false;
  if (frameOnly(value, envelope)) return false;
  if (unstatedPerson(value, envelope)) return true;

  const worldTokens = tokens(world);
  const candidateTokens = tokens(value);
  const concreteVerb = PHYSICAL_VERB.test(value);
  const concreteStage = BODY_OR_STAGE.test(value);
  const hasUnsupportedConcreteToken = [...candidateTokens].some((token) => concreteStage && !worldTokens.has(token));
  if (hasUnsupportedConcreteToken) return true;
  if (concreteVerb && !frameOnly(value, envelope)) {
    const supportedConcreteVerb = labels.some((label) => PHYSICAL_VERB.test(label));
    if (!supportedConcreteVerb) return true;
  }
  return false;
}

function explanationRisk(text: string): number {
  const value = clean(text);
  if (ANALYTIC.test(value) || META.test(value)) return 1;
  if (ABSTRACT.test(value) && words(value).length > 8) return 0.65;
  return 0;
}

function questionScore(text: string, beat: MouthCandidateBeat): number {
  const value = clean(text);
  if (!value.endsWith("?")) return 0;
  const attention = clean(beat.attentionFunction).toLowerCase();
  if (attention === "question" || attention === "hook" || clean(beat.role).toLowerCase().includes("question")) return 1;
  return 0.72;
}

function statusScore(text: string): number {
  return STATUS.test(clean(text)) ? 1 : 0;
}

function compression(text: string): number {
  const count = words(text).length;
  if (count <= 2) return 1;
  if (count <= 5) return 0.94;
  if (count <= 8) return 0.8;
  if (count <= 12) return 0.62;
  return 0.38;
}

function genericAbstractPenalty(text: string): number {
  const value = clean(text);
  const count = words(value).length;
  if (ABSTRACT.test(value) && DETERMINER.test(value) && count <= 6) return 0.38;
  if (ABSTRACT.test(value) && count <= 4) return 0.24;
  return 0;
}

function specificity(text: string, labels: readonly string[], envelope: RealityEnvelope): number {
  const value = clean(text);
  const local = sourceCoverage(value, labels);
  const global = sourceCoverage(value, [worldText(envelope)]);
  const frame = frameOnly(value, envelope) ? 0.18 : 0;
  const status = statusScore(value) * 0.12;
  return metric(local * 0.38 + global * 0.18 + compression(value) * 0.18 + frame + status + (value.length > 8 ? 0.14 : 0));
}

function semanticFit(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const labels = sourceLabels(beat, envelope);
  const interpretation = evaluateMouthInterpretation({ text: clean(text), sourceLabels: labels, envelope, beat });
  return metric(
    (interpretation.accepted ? 0.46 : 0) +
    (interpretation.creativeFraming ?? 0) * 0.22 +
    sourceCoverage(text, labels) * 0.18 +
    statusScore(text) * 0.06 +
    questionScore(text, beat) * 0.08,
  );
}

function finalCutReward(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  const count = words(value).length;
  const payoff = ["payoff", "release"].includes(clean(beat.attentionFunction).toLowerCase()) || clean(beat.role).toLowerCase() === "payoff";
  if (!payoff) return 0;

  const compressed = count <= 2 ? 1 : count <= 5 ? 0.92 : count <= 8 ? 0.7 : 0.4;
  const status = statusScore(value) * 0.34;
  const sendoff = /\b(?:for now|peace|exit|goodbye|done|made it|fab|fabulous|dapper|sharp|clear|cleared)\b/i.test(value) ? 0.34 : 0;
  const distanceFromEndpoint = sourceLabels(beat, envelope).some((label) => normalize(label) === normalize(value)) ? 0 : 0.18;
  return metric(compressed * 0.46 + status + sendoff + distanceFromEndpoint);
}

function expressiveQuality(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[]): number {
  const value = clean(text);
  const count = words(value).length;
  const local = sourceCoverage(value, sourceLabels(beat, envelope));
  const state = semanticFit(value, beat, envelope);
  const short = compression(value);
  const status = statusScore(value);
  const question = questionScore(value, beat);
  const payoff = finalCutReward(value, beat, envelope);
  const priorTokenSet = tokens(priorTexts.join(" "));
  const novelty = priorTokenSet.size ? metric(1 - overlapTokens(tokens(value), priorTokenSet)) : 1;
  const articlePenalty = genericAbstractPenalty(value);
  const explanation = explanationRisk(value);
  const frame = frameOnly(value, envelope) ? 0.18 : 0;
  const firstPerson = /^\b(?:I|we|my|our)\b/i.test(value) ? 0.04 : 0;

  return metric(
    state * 0.24 +
    short * 0.18 +
    novelty * 0.12 +
    local * 0.08 +
    status * 0.1 +
    question * 0.08 +
    payoff * 0.16 +
    frame +
    firstPerson -
    articlePenalty -
    explanation * 0.5,
  );
}

function overlapTokens(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function scoreCandidate(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  priorTexts: readonly string[],
): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const unsafe = unsupportedConcrete(value, beat, envelope);
  const explanation = explanationRisk(value);
  const semantic = semanticFit(value, beat, envelope);
  const creative = expressiveQuality(value, beat, envelope, priorTexts);
  const exact = exactSource(value, labels);
  const coverage = sourceCoverage(value, labels);
  const novelty = priorTexts.length ? metric(1 - overlapTokens(tokens(value), tokens(priorTexts.join(" ")))) : 1;
  const endpoint = exact ? 1 : 0;
  const payoff = finalCutReward(value, beat, envelope);
  const frame = frameOnly(value, envelope);
  const repetition = priorTexts.length ? metric(1 - novelty) : 0;

  if (unsafe || explanation >= 0.95) {
    return {
      text: value,
      beatOrder: beat.order,
      supportedEventIds: [],
      supportedRelationPairs: [],
      groundingScore: 0,
      meaningScore: 0,
      transitionScore: 0,
      obligationCoverage: 0,
      relationContractScore: 0,
      forbiddenMoveRisk: 1,
      cohesionScore: 0,
      noveltyScore: novelty,
      compressionScore: compression(value),
      inventionRisk: 1,
      repetitionRisk: repetition,
      collageRisk: 0,
      endpointExactness: endpoint,
      score: 0,
      reasons: ["unsafe-realization"],
    };
  }

  const supportedEventIds = beat.eventIds?.length ? [...beat.eventIds] : [];
  const supportedRelationPairs = beat.relationKinds?.map((kind) => `${kind}`).filter(Boolean) ?? [];
  const grounding = metric(coverage * 0.55 + semantic * 0.25 + (frame ? 0.2 : 0));
  const meaning = metric(semantic * 0.62 + creative * 0.28 + payoff * 0.1);
  const transition = metric(
    semantic * 0.34 +
    creative * 0.28 +
    (beat.viewerState?.stateShift ?? 0) * 0.2 +
    (beat.viewerState?.predictionError ?? 0) * 0.1 +
    (beat.viewerState?.curiosityPressure ?? 0) * 0.08,
  );
  const obligation = metric(coverage * 0.58 + semantic * 0.32 + (endpoint ? 0.1 : 0));
  const relationContract = beat.relationKinds?.length ? 0.8 : semantic > 0.55 ? 0.5 : 0.2;
  const cohesion = metric(0.42 + novelty * 0.25 + grounding * 0.18 + transition * 0.15);
  const distinctive = metric(creative * 0.56 + statusScore(value) * 0.14 + questionScore(value, beat) * 0.1 + payoff * 0.2);

  const score = metric(
    meaning * 0.26 +
    transition * 0.2 +
    creative * 0.2 +
    grounding * 0.1 +
    obligation * 0.06 +
    cohesion * 0.04 +
    distinctive * 0.1 +
    novelty * 0.02 +
    payoff * 0.12 -
    genericAbstractPenalty(value) * 0.16,
  );

  const reasons = [
    "approved-semantic-realization",
    "semantic-turn-grounded",
    ...(coverage > 0.12 ? ["event-grounded"] : []),
    ...(frame ? ["interpretive-frame"] : []),
    ...(creative >= 0.68 ? ["distinctive-realization"] : []),
    ...(payoff >= 0.62 ? ["viewer-reward"] : []),
    ...(questionScore(value, beat) >= 0.8 ? ["grounded-open-question"] : []),
    ...(repetition > 0.75 ? ["repetition"] : []),
  ];

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds,
    supportedRelationPairs,
    groundingScore: grounding,
    meaningScore: meaning,
    transitionScore: transition,
    obligationCoverage: obligation,
    relationContractScore: relationContract,
    forbiddenMoveRisk: 0,
    cohesionScore: cohesion,
    noveltyScore: novelty,
    compressionScore: compression(value),
    inventionRisk: 0,
    repetitionRisk: repetition,
    collageRisk: 0,
    endpointExactness: endpoint,
    score,
    reasons,
  };
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const lens = classifyLens(input.lens);
  const evidence = [
    input.envelope.subject,
    ...input.envelope.events.map((event) => event.label),
    ...input.envelope.suppliedPhrases,
    ...input.envelope.suppliedEntities,
    ...input.envelope.suppliedActions,
    ...input.envelope.suppliedStates,
    ...input.envelope.recurringSignals,
    ...input.envelope.sensorySignals,
  ].map(clean).filter(Boolean);

  const beats = input.beats.map((beat) => ({
    order: beat.order,
    role: beat.role,
    attention: beat.attentionFunction,
    source: sourceLabels(beat, input.envelope),
    change: clean(beat.change),
    next: clean(beat.next || beat.frontier),
    payoff: Boolean(beat.paysOff?.length),
    viewerState: beat.viewerState ? {
      before: beat.viewerState.beforeState,
      after: beat.viewerState.afterState,
      move: beat.viewerState.attentionMove,
      curiosity: beat.viewerState.curiosityPressure,
      predictionError: beat.viewerState.predictionError,
      stateShift: beat.viewerState.stateShift,
    } : undefined,
  }));

  const system = [
    "QRE MOUTH. ONE JOB: make the strongest viewer-facing cut from the already-approved beat.",
    "FEEL IT. DO NOT EXPLAIN IT.",
    "The movie is already chosen upstream. Do not summarize it, re-plan it, or narrate its machinery.",
    "Reality is locked. Language is not.",
    "Find the live possibility already latent in the supplied material: status, irony, contradiction, relationship pressure, implication, humor, tenderness, menace, absurdity, recognition, callback, or an earned send-off.",
    "Prefer a short, specific cut that changes the viewer's state and makes the next cut desirable.",
    "Do not explain emotions. Make them felt.",
    "Do not automatically introduce a service provider as a character. 'groomer cleaned him up' is an event; it does not authorize 'the groomer'.",
    "Do not invent physical reactions or staging. Happy does not mean smiled. Proud does not mean lifted his shoulders. Watched does not authorize a walk-over.",
    "New wording is allowed. New framing is allowed. New status/implication is allowed when supported. New concrete reality is forbidden.",
    "A bare role used as a compact frame can be valid when it reads as interpretation rather than a literal new participant. Example behavior only: 'Lawyer already called.'",
    "Framing universes are allowed: spy, noir, heist, courtroom, game, military, romance, horror, comedy, documentary, royal, cyberpunk, western, and stranger variants. The frame never adds facts.",
    "Do not default to 'a/an/the + abstract noun'. That is a search failure, not sophistication.",
    "Fragments are good. Questions are good. Status lines are good. Verdicts are good. Send-offs are good. One cut per message.",
    "The last cut is sacred: preserve the supplied endpoint as meaning, but search for the best earned status, punchline, callback, verdict, or exit rather than mechanically repeating it.",
    "Creative examples are behavioral references, not templates: 'Lawyer already called.' 'Eyebrow up.' 'Negotiations resumed.' 'Peace was temporary.' 'Fierce anyway.' 'Made it. Fab. Exit.'",
    "Never copy the examples unless the supplied reality independently earns the same wording.",
    `ACTIVE LENS: ${lens.label || "NONE"}. BIASES: ${lens.framingBias.join(", ")}. PREFERENCES: ${lens.realizationPreferences.join(", ")}.`,
    "Return exactly three materially different variants per beat: not three synonyms. Prefer different rhetorical shapes across the three.",
    "For each beat, at least one variant should attempt a direct, status, verb-led, question, or compressed-hit form rather than an article-led abstract noun phrase.",
    "Return JSON only with variantsByBeat.",
  ].join("\n");

  const user = JSON.stringify({
    objective: "maximize viewer-state change and forward pull while preserving reality exactly",
    subject: input.envelope.subject,
    suppliedEvidence: evidence,
    priorTexts: input.priorTexts ?? [],
    beats,
    domainContext: input.domainContext ?? null,
  });

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw)) as { variantsByBeat?: Array<{ order?: unknown; variants?: unknown }> };
    if (!parsed || !Array.isArray(parsed.variantsByBeat) || !parsed.variantsByBeat.length) return undefined;
    const normalized = parsed.variantsByBeat.map((entry) => ({
      order: Number(entry?.order),
      variants: Array.isArray(entry?.variants) ? entry.variants.map(String).map(clean).filter(Boolean) : [],
    }));
    if (normalized.some((entry) => !Number.isInteger(entry.order) || entry.order < 1 || entry.variants.length !== 3)) return undefined;
    normalized.sort((a, b) => a.order - b.order);
    if (normalized.some((entry, index) => entry.order !== index + 1)) return undefined;
    if (normalized.some((entry) => new Set(entry.variants.map(normalize)).size !== 3)) return undefined;
    return { variantsByBeat: normalized };
  } catch {
    return undefined;
  }
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  return scoreCandidate(input.text, input.beat, input.envelope, input.priorTexts ?? []);
}
