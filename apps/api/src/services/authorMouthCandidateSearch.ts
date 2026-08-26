/**
 * STATUS: CANONICAL
 * ROLE: Ask the model for viewer-facing wording for already-approved beats.
 * MUST NOT: plan, invent events, or turn state/relationship material into
 * fabricated physical behavior.
 */

import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
  ViewerStateCut,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";

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
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const META = /\b(?:qre|compiler|cognition|meaning spine|beat graph|information frontier|planner|planning|operator mix|viewer sees|audience sees|writing process)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|new chapter)\b/i;
const BAD_INTERPRETIVE_EXPLANATION = /\b(?:the viewer|this reveals|this means|which means|in this context|is now transformed into|was a cover for|reveals? that|symbolizes?|represents?|the mystery|what does .* mean|why does .* mean|the final revelation|the punchline here)\b/i;
const PLANNING_RESIDUE = /\b(?:perform the approved semantic change|maintain forward movement|anchor the realization|allow later supplied evidence|preserve the source-derived endpoint|terminate on the supplied endpoint|do not merely restate|what relationship deserves|what becomes connected|what does this relationship make newly meaningful|what is now true at the supplied ending|the supplied endpoint lands|establish supplied evidence)\b/i;
const PHYSICAL_INVENTION = /\b(?:glares?|sniffs?|stares?|smiles?|wags?|trembles?|blinks?|hides?|walks?|runs?|jumps?|grabs?|bites?|laughs?|cries?|enters?|approaches?|leaves?|returns?|turns?|steps?|swipes?|swiped|grips?|grabbed|throws?|threw|pulls?|pulled|pushes?|pushed|kicks?|kicked|touches?|touched|holds?|held|carries?|carried|opens?|opened|closes?|closed)\b/i;
const SEMANTIC_TURN_LANGUAGE = /\b(?:apparently|again|still|only|instead|absolutely|no|yes|temporary|round|ready|now|fear|control|own|agency|status|mine|master|boss|command|brave|bravery|place|belongs|belongs? to|in charge|takes over|took over|owns?|owned)\b/i;

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();
  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
};

const tokenSet = (text: string): Set<string> =>
  new Set(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3)
      .map(normalizeToken),
  );

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function phraseSupportedText(candidateText: string, label: string): boolean {
  const phrase = clean(label).toLowerCase();
  const candidate = clean(candidateText).toLowerCase();
  if (!phrase || !candidate) return false;
  return candidate.includes(phrase) || overlap(tokenSet(candidate), tokenSet(phrase)) >= 0.5;
}

function eventLabel(envelope: RealityEnvelope, id: string): string {
  return clean(envelope.events.find((event) => event.id === id)?.label);
}

/*
 * HARD PROVENANCE BOUNDARY:
 * Only event IDs resolve into source labels.
 * setsUp/paysOff are planning metadata and are never promoted into source truth.
 */
function sourceForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return unique(
    (beat.eventIds ?? [])
      .map((id) => eventLabel(envelope, id))
      .filter(Boolean),
  );
}

function supportedEventsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): Array<{ id: string; label: string }> {
  return (beat.eventIds ?? [])
    .map((id) => ({ id, label: eventLabel(envelope, id) }))
    .filter((event) => Boolean(event.label));
}

function relationPairsForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const ids = new Set(beat.eventIds ?? []);
  return unique(
    envelope.relations
      .filter((relation) => ids.has(relation.from) && ids.has(relation.to))
      .map((relation) => `${relation.from}:${relation.kind}:${relation.to}`),
  );
}

function endpointExactForBeat(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const labels = supportedEventsForBeat(beat, envelope).map((event) => event.label);
  const normalized = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => normalized === clean(label).replace(/[.!?]+$/g, "").toLowerCase());
}

function deriveViewerStateCut(
  beat: MouthCandidateBeat,
  index: number,
  beats: readonly MouthCandidateBeat[],
  envelope: RealityEnvelope,
): ViewerStateCut {
  const currentIds = unique(beat.eventIds ?? []);
  const priorIds = new Set(beats.slice(0, index).flatMap((item) => item.eventIds ?? []).filter(Boolean));
  const newEventRatio = metric(
    currentIds.length
      ? currentIds.filter((id) => !priorIds.has(id)).length / currentIds.length
      : 0,
  );
  const currentSource = sourceForBeat(beat, envelope).join(" ");
  const priorSource = beats.slice(0, index).flatMap((item) => sourceForBeat(item, envelope)).join(" ");
  const continuity = priorSource ? metric(overlap(tokenSet(currentSource), tokenSet(priorSource))) : 0.55;
  const contrast = metric((1 - continuity) * 0.7 + newEventRatio * 0.3);
  const interruption = metric(newEventRatio * 0.62 + contrast * 0.28 + (index === 0 ? 0.1 : 0));
  const curiosityPressure = metric(beat.paysOff?.length ? 0.12 : beat.relationKinds?.length ? 0.9 : index < beats.length - 1 ? 0.72 : 0.42);
  const tempo = metric(index === 0 ? 0.45 : Math.abs(interruption - (index > 1 ? 0.55 : 0.35)) * 0.9 + 0.35);
  const payoffPressure = metric(beat.paysOff?.length ? 1 : index === beats.length - 2 ? 0.78 : Math.min(0.7, 0.25 + index * 0.08));
  const stateShift = metric(contrast * 0.45 + interruption * 0.35 + curiosityPressure * 0.2);
  const predictionError = metric(contrast * 0.55 + newEventRatio * 0.45);

  let attentionMove: ViewerStateCut["attentionMove"];
  if (beat.paysOff?.length) attentionMove = "land";
  else if (index === 0) attentionMove = "orient";
  else if (interruption >= 0.78) attentionMove = "interrupt";
  else if (contrast >= 0.72) attentionMove = "recontextualize";
  else if (curiosityPressure >= 0.78) attentionMove = "tighten";
  else if (stateShift >= 0.7) attentionMove = "escalate";
  else attentionMove = "release";

  const stateNames: Record<ViewerStateCut["attentionMove"], { before: string; after: string }> = {
    orient: { before: "uncommitted", after: "oriented" },
    interrupt: { before: "settled", after: "disrupted" },
    tighten: { before: "curious", after: "pressurized" },
    recontextualize: { before: "certain", after: "reframed" },
    escalate: { before: "engaged", after: "pressurized" },
    release: { before: "pressurized", after: "breathing" },
    land: { before: "expectant", after: "resolved" },
  };
  const names = stateNames[attentionMove];

  return {
    beforeState: names.before,
    afterState: names.after,
    attentionMove,
    curiosityPressure,
    contrast,
    interruption,
    accumulation: metric(continuity * 0.7 + (1 - newEventRatio) * 0.3),
    tempo,
    payoffPressure,
    stateShift,
    predictionError,
    evidenceEventIds: currentIds,
  };
}

function evaluateCandidate(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  priorTexts: readonly string[] = [],
): MouthCandidate {
  const value = clean(text);
  const sourceLabels = sourceForBeat(beat, envelope);
  const sourceText = sourceLabels.join(" ");
  const currentTokens = tokenSet(value);
  const sourceTokens = tokenSet(sourceText);
  const groundingScore = metric(overlap(currentTokens, sourceTokens));
  const supportedEvents = supportedEventsForBeat(beat, envelope);
  const supportedEventIds = supportedEvents
    .filter((event) => phraseSupportedText(value, event.label) || overlap(currentTokens, tokenSet(event.label)) >= 0.25)
    .map((event) => event.id);
  const supportedRelationPairs = relationPairsForBeat(beat, envelope);
  const endpointExactness = endpointExactForBeat(value, beat, envelope) ? 1 : 0;
  const semanticBeat = Boolean(beat.relationKinds?.length || beat.attentionFunction || beat.role);
  const interpretation = evaluateMouthInterpretation({ text: value, sourceLabels, envelope });

  const reasons: string[] = [];
  const repetitionSet = new Set(priorTexts.flatMap((item) => [...tokenSet(item)]));
  const repetitionRisk = priorTexts.length ? metric(overlap(currentTokens, repetitionSet)) : 0;
  const noveltyScore = metric(1 - Math.min(1, repetitionRisk * 1.25));
  const wordCount = value.split(/\s+/).filter(Boolean).length;
  const compressionScore = wordCount <= 12 ? 1 : wordCount <= 20 ? 0.9 : wordCount <= 30 ? 0.76 : wordCount <= 40 ? 0.62 : 0.48;
  const viewerState = beat.viewerState ?? deriveViewerStateCut(beat, 0, [beat], envelope);
  const meaningScore = metric((viewerState.stateShift ?? 0.5) * 0.35 + (viewerState.curiosityPressure ?? 0.5) * 0.25 + (viewerState.contrast ?? 0.5) * 0.2 + (semanticBeat ? 0.2 : 0.1));
  const transitionScore = metric((viewerState.predictionError ?? 0.4) * 0.5 + (viewerState.interruption ?? 0.4) * 0.25 + (viewerState.accumulation ?? 0.5) * 0.25);
  const obligationCoverage = metric(supportedEventIds.length ? 0.55 + Math.min(0.35, supportedEventIds.length * 0.15) : groundingScore * 0.5);
  const relationContractScore = metric(supportedRelationPairs.length ? 0.8 : semanticBeat ? 0.35 : 0.2);
  const forbiddenMoveRisk = metric(
    interpretation.unsupportedConcreteRisk >= 1 || (PHYSICAL_INVENTION.test(value) && !PHYSICAL_INVENTION.test(sourceText)) ? 1 : 0,
  );
  const cohesionScore = metric(0.55 + (1 - repetitionRisk) * 0.25 + groundingScore * 0.2);
  const inventionRisk = forbiddenMoveRisk > 0 ? 0.95 : metric(Math.max(0, 0.22 - groundingScore * 0.18));
  const collageRisk = value.split(/[.!?]+/).filter(Boolean).length > 2 && wordCount > 22 ? 0.35 : 0;

  if (!value) reasons.push("missing-text");
  if (META.test(value)) reasons.push("meta-language");
  if (GENERIC.test(value)) reasons.push("generic-summary");
  if (PLANNING_RESIDUE.test(value)) reasons.push("planning-residue");
  if (BAD_INTERPRETIVE_EXPLANATION.test(value)) reasons.push("interpretive-explanation");
  if (wordCount > 24) reasons.push("too-long");
  if (!sourceLabels.length) reasons.push("missing-grounding");
  if (groundingScore < 0.12 && !endpointExactness) reasons.push("weak-grounding");
  if (repetitionRisk > 0.75) reasons.push("repetition");
  if (forbiddenMoveRisk >= 0.9) reasons.push("invention-risk");
  if (supportedEventIds.length) reasons.push("event-grounded");
  if (supportedRelationPairs.length) reasons.push("relation-grounded");
  if (semanticBeat && !supportedEventIds.length && groundingScore >= 0.16) reasons.push("semantic-turn-grounded");

  const score = metric(
    groundingScore * 0.24 + meaningScore * 0.18 + transitionScore * 0.15 + obligationCoverage * 0.1 + relationContractScore * 0.05 + cohesionScore * 0.08 + noveltyScore * 0.08 + compressionScore * 0.07 + (1 - inventionRisk) * 0.05 - collageRisk * 0.03,
  );

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds,
    supportedRelationPairs,
    groundingScore,
    meaningScore,
    transitionScore,
    obligationCoverage,
    relationContractScore,
    forbiddenMoveRisk,
    cohesionScore,
    noveltyScore,
    compressionScore,
    inventionRisk,
    repetitionRisk,
    collageRisk,
    endpointExactness,
    score,
    reasons,
  };
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const evidence = unique([
    ...input.envelope.suppliedPhrases,
    ...input.envelope.events.map((event) => event.label),
  ]).filter((value) => !PLANNING_RESIDUE.test(value)).slice(0, 40);

  const viewerBeats = input.beats.map((beat, index) => {
    const viewerState = beat.viewerState ?? deriveViewerStateCut(beat, index, input.beats, input.envelope);
    return { order: beat.order, eventIds: beat.eventIds, sourceLabels: sourceForBeat(beat, input.envelope), viewerState, terminal: Boolean(beat.paysOff?.length) };
  });

  const system = [
    "QRE CANONICAL MOUTH · VIEWER-FACING CUT REALIZATION.",
    "The upstream Author already chose the reality, movie, beats, and semantic trajectory. Your job is language realization only.",
    "Write for the viewer's felt experience, not for the planner. The line should make the supplied beat land.",
    "VIEWER REWARD IS THE CREATIVE TARGET. Feel-good does not mean wholesome or positive. Reward can be humor, tension, surprise, mischief, attitude, status, recognition, relief, beauty, dread, shock, irony, warmth, curiosity, or a sharp 'oh shit' moment.",
    "Ask: what does this line give the viewer? A grin, a wince, a reveal, a satisfying turn, a laugh, a pause, a jolt, a recognition, or simply the desire to experience the next cut.",
    "Never manufacture a cliffhanger. Forward pull may come from contrast, implication, rhythm, attitude, accumulation, callback, unresolved pressure, or an earned payoff.",
    "The viewer should feel the semantic move rather than receive an explanation of it.",
    "A source fact is material, not the destination. Prefer fact → semantic move → attitude → compressed realization.",
    "Once a subject has been established, treat it as active context. Do not repeatedly re-announce the subject. Spend the next line on what changed, collided, mattered, or became interesting.",
    "A good sequence breathes: some cuts are blunt facts, some are sharp turns, some are quiet, some are wicked, and some land hard. Do not make every line perform the same trick.",
    "Prefer collisions between supplied details, status reversals, callbacks, double meanings, understatement, grounded metaphor, specific verbs, and surprising compression.",
    "Do not summarize happy, sad, special, memorable, emotional, meaningful, magical, beautiful, or dramatic. Make the viewer feel it through the supplied material.",
    "Do not add stock atmosphere, trailer narration, poetic filler, film-direction language, or abstract explanation.",
    "Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, wardrobe, body position, dialogue, or outcomes.",
    "Unknown stays unknown. Do not infer missing identity, gender, age, relationship, ownership, preference, history, or location.",
    "A creative interpretation may change the attitude or meaning of supplied facts, but it cannot create a new concrete event.",
    "Use the viewerState fields as steering signals. Never repeat their labels or planning language in the output.",
    "Use the whole beat set to create a connected experience. Avoid restating the same source phrase in consecutive cuts unless repetition itself is the meaningful callback.",
    "Choose language that would make a real viewer want to keep going, not language that merely sounds literary.",
    "There is no fixed word count. A one-word hit can beat a sentence. A longer line is acceptable only when the rhythm or realization itself earns it.",
    "Return JSON only: {\"variantsByBeat\":[{\"order\":1,\"variants\":[\"...\"]}]}",
  ].join("\n");

  const user = JSON.stringify({
    task: "realize_viewer_state_cuts",
    subject: input.envelope.subject,
    lens: clean(input.lens),
    suppliedEvidence: evidence,
    priorTexts: input.priorTexts ?? [],
    beats: viewerBeats,
  });

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw)) as MouthCandidateBatch;
    if (!parsed || !Array.isArray(parsed.variantsByBeat)) return undefined;
    return {
      variantsByBeat: parsed.variantsByBeat
        .map((item) => ({
          order: Number(item.order),
          variants: Array.isArray(item.variants) ? item.variants.map(String).filter(Boolean).slice(0, 8) : [],
        }))
        .filter((item) => Number.isFinite(item.order)),
    };
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
  return evaluateCandidate(input.text, input.beat, input.envelope, input.priorTexts ?? []);
}
