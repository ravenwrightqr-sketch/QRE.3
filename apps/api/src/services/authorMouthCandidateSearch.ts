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
  return (
    candidate.includes(phrase) ||
    overlap(tokenSet(candidate), tokenSet(phrase)) >= 0.5
  );
}

function eventLabel(envelope: RealityEnvelope, id: string): string {
  return clean(envelope.events.find((event) => event.id === id)?.label);
}

function sourceForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  return unique([
    ...(beat.eventIds ?? []).map((id) => eventLabel(envelope, id)),
    ...(beat.setsUp ?? []).map((value) => eventLabel(envelope, value) || value),
    ...(beat.paysOff ?? []).map((value) => eventLabel(envelope, value) || value),
  ]);
}

function endpointExactForBeat(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): boolean {
  const labels = (beat.paysOff ?? [])
    .map((value) => eventLabel(envelope, value) || clean(value))
    .filter(Boolean);
  const normalized = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some(
    (label) => normalized === clean(label).replace(/[.!?]+$/g, "").toLowerCase(),
  );
}

function deriveViewerStateCut(
  beat: MouthCandidateBeat,
  index: number,
  beats: readonly MouthCandidateBeat[],
  envelope: RealityEnvelope,
): ViewerStateCut {
  const currentIds = unique(beat.eventIds ?? []);
  const priorIds = new Set(
    beats.slice(0, index).flatMap((item) => item.eventIds ?? []).filter(Boolean),
  );
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
  const curiosityPressure = metric(
    beat.paysOff?.length ? 0.12 : beat.relationKinds?.length ? 0.9 : index < beats.length - 1 ? 0.72 : 0.42,
  );
  const tempo = metric(index === 0 ? 0.45 : Math.abs(interruption - (index > 1 ? 0.55 : 0.35)) * 0.9 + 0.35);
  const payoffPressure = metric(
    beat.paysOff?.length ? 1 : index === beats.length - 2 ? 0.78 : Math.min(0.7, 0.25 + index * 0.08),
  );
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

function legal(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const value = clean(text);
  if (!value || META.test(value) || GENERIC.test(value) || PLANNING_RESIDUE.test(value)) return false;

  const sourceLabels = sourceForBeat(beat, envelope);
  const sourceText = sourceLabels.join(" ");
  const current = tokenSet(value);
  const source = tokenSet(sourceText);
  const sourceOverlap = overlap(current, source);
  const requiredIds = unique(beat.eventIds ?? []);
  const requiredEvents = envelope.events.filter((event) => requiredIds.includes(event.id));
  const eventSupported = requiredEvents.some(
    (event) => phraseSupportedText(value, event.label) || overlap(current, tokenSet(event.label)) >= 0.25,
  );
  const semanticBeat = Boolean(
    beat.relationKinds?.length ||
      /turn|reframe|discovery|escalation|reveal|consequence|payoff/i.test(`${beat.attentionFunction ?? ""} ${beat.role ?? ""}`),
  );
  const interpretation = evaluateMouthInterpretation({
    text: value,
    sourceLabels,
    envelope,
  });

  const groundedEnough =
    sourceOverlap >= 0.16 ||
    eventSupported ||
    (semanticBeat && SEMANTIC_TURN_LANGUAGE.test(value)) ||
    endpointExactForBeat(value, beat, envelope) ||
    interpretation.accepted;

  if (!groundedEnough) return false;
  if (PHYSICAL_INVENTION.test(value) && !PHYSICAL_INVENTION.test(sourceText)) return false;
  if (interpretation.unsupportedConcreteRisk >= 1) return false;
  return true;
}

function groundedFallbackTexts(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const labels = sourceForBeat(beat, envelope);
  const result: string[] = [];
  const attention = clean(beat.attentionFunction ?? beat.role).toLowerCase();
  const first = clean(labels[0] ?? envelope.subject ?? "");
  const second = clean(labels[1] ?? "");

  if (beat.paysOff?.length && /payoff|release/i.test(attention)) {
    if (first && legal(first, beat, envelope)) result.push(first);
    return result;
  }

  if (first && legal(first, beat, envelope)) result.push(first);
  if (first && second && /reframe|contrast|turn|escalation|callback|payoff|release/i.test(attention)) {
    const joined = `${first}. ${second}.`;
    if (legal(joined, beat, envelope)) result.push(joined);
  }
  if (first && /hook|arrival|establish/i.test(attention)) {
    const hook = `${first}.`;
    if (legal(hook, beat, envelope)) result.push(hook);
  }
  if (first && /reframe|turn/i.test(attention)) {
    const semantic = `${first}, apparently.`;
    if (legal(semantic, beat, envelope)) result.push(semantic);
  }

  return unique(result).slice(0, 8);
}

export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{ role: "system" | "user"; content: string }> {
  const evidence = unique([
    ...input.envelope.suppliedPhrases,
    ...input.envelope.events.map((event) => event.label),
  ])
    .filter((value) => !PLANNING_RESIDUE.test(value))
    .slice(0, 40);

  const viewerBeats = input.beats.map((beat, index) => {
    const viewerState = beat.viewerState ?? deriveViewerStateCut(beat, index, input.beats, input.envelope);
    return {
      order: beat.order,
      eventIds: beat.eventIds,
      sourceLabels: sourceForBeat(beat, input.envelope),
      viewerState,
      terminal: Boolean(beat.paysOff?.length),
    };
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

  return [
    { role: "system", content: system },
    {
      role: "user",
      content: JSON.stringify({
        task: "realize_viewer_state_cuts",
        subject: input.envelope.subject,
        lens: input.lens ?? "natural, specific, attention-forward",
        suppliedEvidence: evidence,
        priorTexts: input.priorTexts ?? [],
        beats: viewerBeats,
      }),
    },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | null {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as Partial<MouthCandidateBatch> & { texts?: unknown[] };
    if (Array.isArray(parsed.variantsByBeat)) {
      return {
        variantsByBeat: parsed.variantsByBeat
          .map((entry) => ({ order: Number(entry.order), variants: unique(entry.variants ?? []).slice(0, 8) }))
          .filter((entry) => Number.isFinite(entry.order)),
      };
    }
    if (Array.isArray(parsed.texts)) {
      return {
        variantsByBeat: parsed.texts
          .map((value, index) => ({ order: index + 1, variants: clean(value) ? [clean(value)] : [] }))
          .filter((entry) => entry.variants.length > 0),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function softCompressionScore(text: string): number {
  const words = clean(text).split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  if (words <= 7) return 1;
  if (words <= 14) return 0.96;
  if (words <= 22) return 0.88;
  if (words <= 30) return 0.76;
  if (words <= 40) return 0.62;
  return 0.48;
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  const modelText = clean(input.text);
  const candidateLegal = legal(modelText, input.beat, input.envelope);
  const fallbackTexts = groundedFallbackTexts(input.beat, input.envelope);
  const text = candidateLegal ? modelText : fallbackTexts[0] ?? modelText;
  const isFallback = !candidateLegal && text !== modelText && Boolean(text);
  const effectiveLegal = legal(text, input.beat, input.envelope);
  const sourceLabels = sourceForBeat(input.beat, input.envelope);
  const interpretation = evaluateMouthInterpretation({
    text,
    sourceLabels,
    envelope: input.envelope,
  });

  const priorTexts = input.priorTexts ?? [];
  const source = tokenSet(sourceLabels.join(" "));
  const current = tokenSet(text);
  const required = unique(input.beat.eventIds ?? []);
  const requiredEvents = input.envelope.events.filter((event) => required.includes(event.id));
  const eventSupported = (event: RealityEnvelope["events"][number]): boolean =>
    phraseSupportedText(text, event.label) || overlap(current, tokenSet(event.label)) >= 0.25;
  const supportedEventIds = requiredEvents.filter(eventSupported).map((event) => event.id);
  const requiredCoverage = requiredEvents.length ? supportedEventIds.length / requiredEvents.length : 0;
  const supportedRelationPairs = input.envelope.relations
    .filter((relation) => supportedEventIds.includes(relation.from) && supportedEventIds.includes(relation.to))
    .map((relation) => `${relation.from}->${relation.to}`);

  const sourceCoverage = overlap(current, source);
  const semanticBeat = Boolean(
    input.beat.relationKinds?.length ||
      /turn|reframe|discovery|escalation|reveal|consequence|payoff/i.test(
        `${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`,
      ),
  );
  const groundingScore = Math.max(0, Math.min(1, sourceCoverage * 0.58 + requiredCoverage * 0.42));
  const interpretationLift = interpretation.accepted ? interpretation.interpretive : 0;
  const meaningScore = Math.min(
    1,
    Math.max(
      0.38 + groundingScore * 0.35 + (SEMANTIC_TURN_LANGUAGE.test(text) ? 0.18 : 0),
      interpretationLift * 0.82,
    ),
  );
  const transitionScore = Math.min(
    1,
    0.34 + groundingScore * 0.28 + (semanticBeat ? 0.22 : 0) + (input.beat.next || input.beat.frontier ? 0.1 : 0) + interpretationLift * 0.16,
  );
  const noveltyScore = priorTexts.length
    ? Math.max(0.15, 1 - Math.max(...priorTexts.map((prior) => overlap(current, tokenSet(prior)))))
    : 1;
  const compressionScore = softCompressionScore(text);
  const repetitionRisk = 1 - noveltyScore;
  const inventionRisk = effectiveLegal ? (isFallback ? 0.18 : interpretation.unsupportedConcreteRisk > 0 ? 0.9 : 0.04) : 0.9;
  const forbiddenMoveRisk = META.test(text) || GENERIC.test(text) || PLANNING_RESIDUE.test(text) ? 1 : 0;
  const collageRisk = text.split(/[.!?]+/).filter(Boolean).length >= 5 && sourceCoverage < 0.3 ? 0.25 : 0;

  const endpointLabels = (input.beat.paysOff ?? []).map((value) => eventLabel(input.envelope, value) || clean(value)).filter(Boolean);
  const isPayoff = Boolean(endpointLabels.length && /payoff|release/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`));
  const normalizedText = text.replace(/[.!?]+$/g, "").toLowerCase();
  const endpointExactness = isPayoff && endpointLabels.some((label) => normalizedText === label.replace(/[.!?]+$/g, "").toLowerCase()) ? 1 : 0;
  const literalSourceRestatement = !isPayoff && sourceLabels.some((label) => normalizedText === label.replace(/[.!?]+$/g, "").toLowerCase());
  const restatementPenalty = semanticBeat && literalSourceRestatement ? 0.22 : 0;
  const creativeLift = semanticBeat && interpretation.accepted && !literalSourceRestatement
    ? Math.min(0.3, 0.12 + interpretationLift * 0.28)
    : 0;

  const reasons = [
    /hook|arrival|establish/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`) ? "hook-scored-as-establishment" : "",
    isFallback ? "grounded-fallback" : "",
    literalSourceRestatement ? "fact-restatement" : "",
    semanticBeat && !literalSourceRestatement ? "semantic-turn-grounded" : "",
    interpretation.accepted && !literalSourceRestatement ? "derivable-interpretation" : "",
    interpretation.frameSupport >= 0.8 ? "evidence-supported-frame" : "",
    endpointExactness === 1 ? "endpoint-exact" : "",
    !candidateLegal ? "candidate-truth-rejected" : "",
    PLANNING_RESIDUE.test(text) ? "planning-residue" : "",
  ].filter(Boolean);

  const score = effectiveLegal
    ? Math.max(
        0,
        Math.min(
          1,
          groundingScore * 0.18 +
            meaningScore * 0.18 +
            transitionScore * 0.16 +
            noveltyScore * 0.08 +
            compressionScore * 0.06 +
            creativeLift * 0.18 +
            interpretationLift * 0.08 +
            (1 - inventionRisk) * 0.08 +
            endpointExactness * 0.25 -
            restatementPenalty -
            (isFallback ? 0.12 : 0),
        ),
      )
    : 0;

  return {
    text,
    beatOrder: input.beat.order,
    supportedEventIds,
    supportedRelationPairs,
    groundingScore,
    meaningScore,
    transitionScore,
    obligationCoverage: Math.min(1, groundingScore * 0.55 + transitionScore * 0.45),
    relationContractScore: input.beat.relationKinds?.length
      ? Math.max(0.4, supportedRelationPairs.length / input.beat.relationKinds.length)
      : 0.6,
    forbiddenMoveRisk,
    cohesionScore: priorTexts.length ? noveltyScore * 0.6 + 0.4 : 0.7,
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
