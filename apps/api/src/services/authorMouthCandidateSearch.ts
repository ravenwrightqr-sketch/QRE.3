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

/*
 * HARD PROVENANCE BOUNDARY:
 *
 * Only event IDs resolve into source labels.
 * setsUp/paysOff are planning metadata and may contain semantic prose;
 * they are never promoted into source truth for the Mouth prompt.
 */
function sourceForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  return unique(
    (beat.eventIds ?? [])
      .map((id) => eventLabel(envelope, id))
      .filter(Boolean),
  );
}

function endpointExactForBeat(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): boolean {
  const labels = (beat.eventIds ?? [])
    .map((id) => eventLabel(envelope, id))
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

  const user = JSON.stringify({
    task: "realize_viewer_state_cuts",
    lens: clean(input.lens) || "NONE",
    suppliedEvidence: evidence,
    beats: viewerBeats,
  });

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | null {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Partial<MouthCandidateBatch> & { texts?: unknown[] };
    if (Array.isArray(parsed.variantsByBeat)) return parsed as MouthCandidateBatch;
    if (Array.isArray(parsed.texts)) {
      return {
        variantsByBeat: parsed.texts.map((value, index) => ({
          order: index + 1,
          variants: [clean(value)].filter(Boolean),
        })),
      };
    }
  } catch {
    return null;
  }
  return null;
}

function wordQuality(text: string): number {
  const words = clean(text).split(/\s+/).filter(Boolean).length;
  if (words <= 12) return 1;
  if (words <= 20) return 0.9;
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
  const text = clean(input.text);
  const labels = sourceForBeat(input.beat, input.envelope);
  const sourceTokens = tokenSet(labels.join(" "));
  const textTokens = tokenSet(text);
  const grounding = metric(overlap(textTokens, sourceTokens));
  const repeated = new Set((input.priorTexts ?? []).flatMap((value) => [...tokenSet(value)]));
  const repetition = repeated.size ? metric(overlap(textTokens, repeated)) : 0;
  const viewerLift = input.beat.viewerState
    ? metric((input.beat.viewerState.stateShift ?? 0) * 0.45 + (input.beat.viewerState.predictionError ?? 0) * 0.25 + (input.beat.viewerState.curiosityPressure ?? 0) * 0.3)
    : 0.5;
  const words = text.split(/\s+/).filter(Boolean).length;

  const reasons: string[] = [];
  if (!text) reasons.push("missing-text");
  if (META.test(text)) reasons.push("meta-language");
  if (GENERIC.test(text)) reasons.push("generic-summary");
  if (PLANNING_RESIDUE.test(text)) reasons.push("planning-residue");
  if (BAD_INTERNAL.test(text)) reasons.push("internal-language");
  if (BAD_INTERPRETIVE_EXPLANATION.test(text)) reasons.push("interpretive-explanation");
  if (words > 24) reasons.push("too-long");
  if (!labels.length) reasons.push("missing-grounding");
  if (grounding < 0.12) reasons.push("weak-grounding");
  if (repetition > 0.75) reasons.push("repetition");

  return {
    text,
    score: metric(grounding * 0.36 + viewerLift * 0.28 + wordQuality(text) * 0.2 + (1 - repetition) * 0.16),
    grounding,
    viewerLift,
    repetition,
    reasons,
  };
}
