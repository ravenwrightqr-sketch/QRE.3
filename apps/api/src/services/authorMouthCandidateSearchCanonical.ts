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
 * Cognition owns reality, the movie, semantic movement, and beat purpose.
 * Mouth owns the final expression of that approved material.
 *
 * The creative target is not "better prose". It is a cut that makes the
 * supplied reality more interesting without changing what actually exists.
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

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const tokens = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'’-]+/g)
      .filter((token) => token.length >= 3),
  );

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by",
  "through", "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are",
  "was", "were", "be", "been", "being", "as", "into", "my", "your", "our", "their", "his", "her",
  "its", "he", "she", "they", "them", "you", "we", "me", "very", "really", "just", "already",
  "apparently", "anyway", "perhaps", "maybe",
]);

const meaningful = (value: string): Set<string> =>
  new Set([...tokens(value)].filter((token) => !STOP.has(token)));

const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return [...new Set(
    (beat.eventIds ?? [])
      .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
      .map(clean)
      .filter(Boolean),
  )];
}

function wholeReality(envelope: RealityEnvelope): string[] {
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
  ].map(clean).filter(Boolean);
}

function exactSource(text: string, labels: readonly string[]): boolean {
  const value = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => clean(label).replace(/[.!?]+$/g, "").toLowerCase() === value);
}

function wordCount(text: string): number {
  return clean(text).split(/\s+/).filter(Boolean).length;
}

function sourceSpecificity(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const candidate = meaningful(text);
  const local = meaningful(sourceLabels(beat, envelope).join(" "));
  const world = meaningful(wholeReality(envelope).join(" "));
  return metric(overlap(candidate, local) * 0.65 + overlap(candidate, world) * 0.35);
}

function frameSignal(text: string): number {
  const value = clean(text);
  const frameWords = [
    "judge", "judgment", "inspection", "review", "case", "verdict", "evidence", "mission",
    "operation", "negotiation", "negotiations", "level", "boss", "round", "upgrade", "status",
    "clearance", "cleared", "peace", "war", "heist", "extraction", "trial", "champion",
    "championship", "kingdom", "official", "final", "reset", "party", "knockout", "victory",
    "winner", "audit", "showtime", "survived", "approved", "reopened", "secured", "fabulous",
  ];
  const hits = frameWords.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(value)).length;
  if (hits >= 2) return 1;
  if (hits === 1) return 0.75;
  return 0;
}

function implicationSignal(text: string): number {
  const value = clean(text);
  const count = wordCount(value);
  if (!value) return 0;
  const consequence = /\b(?:then|again|still|already|finally|apparently|anyway|until|for now|temporary|temporarily|remained|stayed|kept)\b/i.test(value);
  const contrast = /\b(?:but|yet|still|instead|only|just|however)\b/i.test(value);
  const question = /\?$/.test(value);
  const status = /\b(?:won|lost|ready|done|cleared|approved|complete|finished|peace|fabulous|fierce|sharp|official|final|temporary)\b/i.test(value);
  return metric(
    (consequence ? 0.28 : 0) +
      (contrast ? 0.24 : 0) +
      (question ? 0.2 : 0) +
      (status ? 0.18 : 0) +
      (count <= 10 ? 0.1 : 0),
  );
}

function antiLabelSignal(text: string, sourceSpecificityScore: number): number {
  const value = clean(text);
  if (!value) return 1;

  const atmospheric = /^(?:(?:a|an|the)\s+)?(?:weight|tremor|anticipation|beginning|cleansing|transformation|radiance|portrait|defiance|acquisition|joy|energy|silence|connection|tension|intensity|feeling|moment|presence|possibility|momentum|afterglow|resonance|lightness|stillness|softness)\b/i;
  const sentenceParts = value.split(/[.!?]+/).map(clean).filter(Boolean);
  const fragmentPair = sentenceParts.length >= 2 && sentenceParts.every((part) => {
    const words = part.split(/\s+/).filter(Boolean);
    return words.length <= 5 && !/\b(?:is|are|was|were|did|does|has|have|had|then|but|and)\b/i.test(part);
  });

  if (atmospheric.test(value)) return sourceSpecificityScore < 0.2 ? 1 : 0.55;
  if (fragmentPair && sourceSpecificityScore < 0.2) return 0.8;
  return 0;
}

function candidateScore(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[]): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const evaluation = evaluateMouthInterpretation({
    text: value,
    sourceLabels: labels,
    envelope,
    beat,
  });

  const forbidden = metric(evaluation.unsupportedConcreteRisk);
  const literal = exactSource(value, labels);
  const localSpecificity = sourceSpecificity(value, beat, envelope);
  const framing = frameSignal(value);
  const implication = implicationSignal(value);
  const novelty = priorTexts.length
    ? metric(1 - Math.max(
        ...priorTexts.map((prior) => overlap(meaningful(value), meaningful(prior))),
        0,
      ))
    : 1;

  const semanticAuthority = beat.semanticRealization;
  const approvedMeaning = semanticAuthority
    ? metric(0.55 + semanticAuthority.confidence * 0.45)
    : metric(beat.eventIds?.length ? 0.64 : 0.45);

  const discovery = metric(
    (evaluation.creativeFraming ?? 0) * 0.24 +
      localSpecificity * 0.25 +
      implication * 0.2 +
      framing * 0.1 +
      approvedMeaning * 0.13 +
      novelty * 0.08,
  );

  const humanShape =
    wordCount(value) >= 3 && wordCount(value) <= 11
      ? 0.95
      : wordCount(value) <= 16
        ? 0.75
        : 0.45;

  const labelRisk = antiLabelSignal(value, localSpecificity);

  const score = metric(
    (1 - forbidden) * 0.2 +
      discovery * 0.31 +
      localSpecificity * 0.14 +
      evaluation.interpretive * 0.09 +
      novelty * 0.07 +
      humanShape * 0.06 +
      implication * 0.08 +
      framing * 0.05 -
      labelRisk * 0.22 -
      (literal ? 0.13 : 0),
  );

  const supportedEventIds = labels.length && localSpecificity >= 0.24 && forbidden < 0.9
    ? [...(beat.eventIds ?? [])]
    : [];

  const reasons: string[] = [];
  if (supportedEventIds.length) reasons.push("event-grounded");
  if (evaluation.accepted) reasons.push("meaning-authorized");
  if (framing >= 0.7) reasons.push("interpretive-frame");
  if (implication >= 0.45) reasons.push("viewer-discovery");
  if (discovery >= 0.6) reasons.push("creative-discovery");
  if (literal) reasons.push("literal-source-restatement");
  if (labelRisk > 0.45) reasons.push("poetic-label");
  if (wordCount(value) >= 3 && wordCount(value) <= 11) reasons.push("human-sized-cut");

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds,
    supportedRelationPairs: (beat.relationKinds ?? []).map(String).filter(Boolean),
    groundingScore: metric(localSpecificity),
    meaningScore: metric(discovery),
    observerDiscoveryScore: metric(discovery),
    transitionScore: metric(Number(beat.viewerState?.stateShift) || 0.45),
    obligationCoverage: metric(approvedMeaning * 0.65 + localSpecificity * 0.35),
    relationContractScore: metric(beat.relationKinds?.length ? 0.8 : 0.45),
    forbiddenMoveRisk: forbidden,
    cohesionScore: metric(0.55 + discovery * 0.3 + novelty * 0.15),
    noveltyScore: novelty,
    compressionScore: humanShape,
    inventionRisk: forbidden,
    repetitionRisk: 1 - novelty,
    collageRisk: labelRisk,
    endpointExactness: literal ? 1 : 0,
    score,
    reasons,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are QRE's ONE MOUTH: the final language performer for a reality-grounded short film.",
    "Cognition already found the movie. Do NOT re-plan it. Your job is to PLAY each approved beat as the next cut of the film.",
    "A cut is not a caption for the event. It is the strongest human-facing realization of what became interesting because this beat exists.",
    "Core sequence: REALITY -> ATTENTION -> FEELING -> INTERPRETATION -> CUT.",
    "Preserve supplied reality absolutely. Reality freedom is LOW. Framing freedom is HIGH.",
    "You may use implication, status, irony, understatement, personification, juxtaposition, absurdity, genre framing, callbacks, reversals, and wordplay when they remain legible as interpretation.",
    "Never invent a new concrete person, object, location, physical action, physical relation, dialogue, reaction, event, or chronology.",
    "A frame may be theatrical: 'the cat was the judge' can frame supplied watching. Do not continue it into an invented event such as 'the cat approved the bathroom' unless that event is supplied.",
    "Do not confuse cinematic vocabulary with creativity. Do not write poetry, trailer narration, atmospheric filler, or emotional labels.",
    "BAD: 'A tremor. The before.' BAD: 'The weight of anticipation.' BAD: 'Radiance. The final portrait.' These name an atmosphere instead of discovering the relationship.",
    "Do not merely rename the source event: bath -> cleansing, steal -> acquisition, fabulous -> radiance.",
    "Mine the supplied pieces. Ask what changed, what now means something different, what creates a question, what creates status, what becomes funny, ominous, intimate, absurd, or consequential.",
    "Let one cut alter how the viewer reads the previous cut. Let the next cut become desirable because of what just happened.",
    "Shortness is subordinate to impact. A sharp 2-word cut is allowed. A 8-word cut is allowed. Use the length the moment earns.",
    "Generate exactly three materially different candidates for every beat. They should differ in the creative move, not merely use synonyms.",
    "Search especially for: concrete collision, status turn, contrast, reversal, sly understatement, callback, consequence, unresolved micro-question, and payoff.",
    "A strong final line should make earlier details snap into focus.",
    "Use the entire supplied sequence when choosing a realization. Earlier cuts establish expectations; later cuts may cash them in.",
    "Never explain the discovery. Make the viewer discover it.",
    "Return JSON only.",
  ].join("\n");
}

function controlData(beat: MouthCandidateBeat): Record<string, unknown> | undefined {
  const semantic = beat.semanticRealization;
  if (!semantic) return undefined;
  return {
    mechanism: semantic.mechanism,
    realizationMove: semantic.realizationMove,
    creativeOpportunity: semantic.creativeOpportunity,
    evidenceEventIds: semantic.evidenceEventIds,
    beforeEventIds: semantic.beforeEventIds,
    afterEventIds: semantic.afterEventIds,
    callbackEventIds: semantic.callback?.eventIds,
    callbackRole: semantic.callback?.role,
    relation: semantic.relation,
    confidence: semantic.confidence,
  };
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const lens = classifyLens(input.lens);
  const reality = wholeReality(input.envelope);
  const beats = input.beats.map((beat) => ({
    order: beat.order,
    supplied: sourceLabels(beat, input.envelope),
    role: clean(beat.role),
    creativeMove: clean(beat.creativeMove),
    realizationMode: clean(beat.realizationMode),
    semanticControl: controlData(beat),
    viewerState: beat.viewerState,
    observerExperience: beat.observerExperience,
    change: clean(beat.change),
    next: clean(beat.next),
    frontier: clean(beat.frontier),
    relationKinds: beat.relationKinds ?? [],
    paysOff: beat.paysOff ?? [],
  }));

  return [
    { role: "system", content: buildSystemPrompt() },
    {
      role: "user",
      content: JSON.stringify({
        subject: clean(input.envelope.subject),
        lens: clean(input.lens) || "NONE",
        lensFrame: lens.label,
        domainContext: input.domainContext ?? null,
        suppliedReality: reality,
        priorCuts: input.priorTexts ?? [],
        beats,
        requiredOutput: "For every beat, return exactly 3 materially different viewer-facing candidate cuts in order. Do not return analysis.",
      }),
    },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw)) as { variantsByBeat?: unknown };
    if (!Array.isArray(parsed.variantsByBeat) || parsed.variantsByBeat.length === 0) return undefined;
    const variantsByBeat = parsed.variantsByBeat
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        order: Number(item.order),
        variants: Array.isArray(item.variants)
          ? item.variants.map(String).map(clean).filter(Boolean)
          : [],
      }));
    if (variantsByBeat.some((item) => !Number.isInteger(item.order) || item.variants.length !== 3)) return undefined;
    const orders = variantsByBeat.map((item) => item.order).sort((a, b) => a - b);
    if (orders.some((order, index) => order !== index + 1)) return undefined;
    if (variantsByBeat.some((item) => new Set(item.variants.map((value) => value.toLowerCase())).size !== 3)) return undefined;
    return { variantsByBeat: variantsByBeat.sort((a, b) => a.order - b.order) };
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
  return candidateScore(input.text, input.beat, input.envelope, input.priorTexts ?? []);
}
