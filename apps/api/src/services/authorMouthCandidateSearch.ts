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
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

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
const PHYSICAL_INVENTION = /\b(?:glares?|sniffs?|stares?|smiles?|wags?|trembles?|blinks?|hides?|walks?|runs?|jumps?|grabs?|bites?|laughs?|cries?|enters?|approaches?|leaves?|returns?|turns?|steps?|swipes?|swiped|grips?|grabbed|throws?|threw|pulls?|pulled|pushes?|pushed|kicks?|kicked|touches?|touched|holds?|held|carries?|carried|opens?|opened|closes?|closed)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|new chapter)\b/i;
const SEMANTIC_TURN_LANGUAGE = /\b(?:apparently|again|still|only|instead|absolutely|no|yes|temporary|round|ready|now|fear|control|own|agency|status|mine|master|boss|command|brave|bravery|place|belongs|belongs? to|in charge|takes over|took over|owns?|owned)\b/i;
const PLANNING_RESIDUE = /\b(?:perform the approved semantic change|maintain forward movement|anchor the realization|allow later supplied evidence|preserve the source-derived endpoint|terminate on the supplied endpoint|do not merely restate|what relationship deserves|what becomes connected|what does this relationship make newly meaningful|what is now true at the supplied ending|the supplied endpoint lands|establish supplied evidence)\b/i;

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();
  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
};

const tokens = (text: string): string[] =>
  clean(text)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((token) => token.length >= 3)
    .map(normalizeToken);

const tokenSet = (text: string): Set<string> => new Set(tokens(text));

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
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

function sourceForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return unique([
    ...(beat.eventIds ?? []).map((id) => eventLabel(envelope, id)),
    ...(beat.setsUp ?? []).map((id) => eventLabel(envelope, id) || id),
    ...(beat.paysOff ?? []).map((id) => eventLabel(envelope, id) || id),
  ]);
}

function safeSemanticSignals(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return unique([
    ...sourceForBeat(beat, envelope),
  ].filter((value) => !PLANNING_RESIDUE.test(value)));
}

function fallback(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const labels = sourceForBeat(beat, envelope);
  const first = clean(labels[0] ?? envelope.subject ?? "");
  const second = clean(labels[1] ?? "");
  const attention = clean(beat.attentionFunction ?? beat.role).toLowerCase();
  const out: string[] = [];

  if (beat.paysOff?.length && /payoff|release/i.test(attention)) {
    if (first) out.push(first);
    return out;
  }

  if (first) out.push(first);
  if (first && second && /reframe|contrast|turn|escalation|callback|payoff|release/i.test(attention)) {
    out.push(`${first}. ${second}.`);
  }
  if (first && /hook|arrival|establish/i.test(attention)) out.push(`${first}.`);
  if (first && /reframe|turn/i.test(attention)) out.push(`${first}, apparently.`);
  if (first && /escalation/i.test(attention)) out.push(`${first}. Still not settled.`);
  if (beat.next && /continuation/i.test(attention)) out.push("More to come.");

  return unique(out).slice(0, 8);
}

function endpointExactForBeat(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const labels = beat.paysOff?.length
    ? beat.paysOff.map((value) => eventLabel(envelope, value) || clean(value)).filter(Boolean)
    : [];
  const normalized = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => normalized === clean(label).replace(/[.!?]+$/g, "").toLowerCase());
}

function legal(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const value = clean(text);
  if (!value || META.test(value) || GENERIC.test(value) || PLANNING_RESIDUE.test(value)) return false;

  const sourceText = sourceForBeat(beat, envelope).join(" ");
  const semanticText = safeSemanticSignals(beat, envelope).join(" ");
  const current = tokenSet(value);
  const source = tokenSet(sourceText);
  const semantic = tokenSet(semanticText);
  const sourceOverlap = overlap(current, source);
  const semanticOverlap = overlap(current, semantic);
  const requiredIds = unique(beat.eventIds ?? []);
  const requiredEvents = envelope.events.filter((event) => requiredIds.includes(event.id));
  const eventSupported = requiredEvents.some(
    (event) => phraseSupportedText(value, event.label) || overlap(current, tokenSet(event.label)) >= 0.25,
  );
  const semanticBeat = Boolean(
    beat.relationKinds?.length ||
      /turn|reframe|discovery|escalation|reveal|consequence|payoff/i.test(
        `${beat.attentionFunction ?? ""} ${beat.role ?? ""}`,
      ),
  );
  const groundedEnough =
    sourceOverlap >= 0.16 ||
    semanticOverlap >= 0.16 ||
    eventSupported ||
    (semanticBeat && SEMANTIC_TURN_LANGUAGE.test(value)) ||
    endpointExactForBeat(value, beat, envelope);

  if (!groundedEnough) return false;
  if (PHYSICAL_INVENTION.test(value) && !PHYSICAL_INVENTION.test(sourceText)) return false;
  return true;
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const evidence = unique([
    ...input.envelope.suppliedPhrases,
    ...input.envelope.events.map((event) => event.label),
  ]).filter((value) => !PLANNING_RESIDUE.test(value)).slice(0, 40);

  const system = [
    "QRE CANONICAL MOUTH · VIEWER-FACING CUT REALIZATION.",
    "The upstream Author already chose the reality, sequence, frame, and viewer-state movement.",
    "Your job is language realization only.",
    "A cut can be one word, one sentence, several short sentences, or longer when the wording itself is the hit.",
    "Use the minimum language required for the cut to land. There is no fixed word count.",
    "Do not expand merely to sound cinematic. Do not shorten merely to sound punchy.",
    "Optimize for attention, curiosity, contrast, interruption, accumulation, attitude, tempo, and payoff.",
    "Tempo is variation in viewer state, not constant speed. A quiet cut can make the next interruption hit harder.",
    "For non-terminal relationship/change beats, do NOT merely restate the supplied fact. Express the approved semantic movement as attitude, status, implication, contrast, comic consequence, or another grounded interpretive move.",
    "A rhetorical question is allowed as a viewer-facing device; it is not a request for user information.",
    "Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",
    "Do not output planner language, labels, diagnostics, or explanations.",
    "Return JSON only: {\"variantsByBeat\":[{\"order\":1,\"variants\":[\"...\"]}]}",
  ].join("\n");

  return [
    { role: "system", content: system },
    {
      role: "user",
      content: JSON.stringify({
        task: "realize_approved_beats",
        subject: input.envelope.subject,
        lens: input.lens ?? "natural, specific, attention-forward",
        suppliedEvidence: evidence,
        priorTexts: input.priorTexts ?? [],
        beats: input.beats.map((beat) => ({
          ...beat,
          change: PLANNING_RESIDUE.test(clean(beat.change)) ? "" : beat.change,
          next: PLANNING_RESIDUE.test(clean(beat.next)) ? "" : beat.next,
          frontier: PLANNING_RESIDUE.test(clean(beat.frontier)) ? "" : beat.frontier,
        })),
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
  const text = clean(input.text);
  const fallbackTexts = fallback(input.beat, input.envelope);
  const priorTexts = input.priorTexts ?? [];
  const candidateLegal = legal(text, input.beat, input.envelope);

  const source = tokenSet(sourceForBeat(input.beat, input.envelope).join(" "));
  const semanticSource = tokenSet(safeSemanticSignals(input.beat, input.envelope).join(" "));
  const current = tokenSet(text);
  const required = unique(input.beat.eventIds ?? []);
  const requiredEvents = input.envelope.events.filter((event) => required.includes(event.id));

  const supportedEventIds = input.envelope.events
    .filter((event) => current.size && overlap(current, tokenSet(event.label)) >= 0.25)
    .map((event) => event.id)
    .filter((id) => required.length === 0 || required.includes(id));

  const eventSupported = (event: RealityEnvelope["events"][number]): boolean =>
    phraseSupportedText(text, event.label) || overlap(current, tokenSet(event.label)) >= 0.25;
  const requiredCoverage = requiredEvents.length
    ? requiredEvents.filter(eventSupported).length / requiredEvents.length
    : 0;

  for (const id of requiredEvents.filter(eventSupported).map((event) => event.id)) {
    if (!supportedEventIds.includes(id)) supportedEventIds.push(id);
  }

  const supportedRelationPairs = input.envelope.relations
    .filter((relation) => supportedEventIds.includes(relation.from) && supportedEventIds.includes(relation.to))
    .map((relation) => `${relation.from}->${relation.to}`);

  const sourceCoverage = overlap(current, source);
  const semanticCoverage = overlap(current, semanticSource);
  const groundingScore = Math.max(0.35, Math.min(1, sourceCoverage * 0.45 + requiredCoverage * 0.4 + semanticCoverage * 0.15));
  const meaningScore = Math.min(1, 0.42 + groundingScore * 0.3 + (SEMANTIC_TURN_LANGUAGE.test(text) ? 0.2 : 0) + semanticCoverage * 0.18);
  const transitionScore = Math.min(1, 0.36 + semanticCoverage * 0.32 + (input.beat.next || input.beat.frontier ? 0.1 : 0) + (input.beat.relationKinds?.length ? 0.2 : 0));
  const noveltyScore = priorTexts.length
    ? Math.max(0.15, 1 - Math.max(...priorTexts.map((prior) => overlap(current, tokenSet(prior)))))
    : 1;
  const compressionScore = softCompressionScore(text);
  const repetitionRisk = 1 - noveltyScore;
  const inventionRisk = candidateLegal ? 0.04 : 0.9;
  const forbiddenMoveRisk = META.test(text) || GENERIC.test(text) || PLANNING_RESIDUE.test(text) ? 1 : 0;
  const collageRisk = text.split(/[.!?]+/).filter(Boolean).length >= 5 && sourceCoverage < 0.3 ? 0.25 : 0;

  const payoffLabels = unique(
    (input.beat.paysOff ?? [])
      .map((value) => eventLabel(input.envelope, value) || clean(value))
      .filter(Boolean),
  );
  const isPayoff = Boolean(
    payoffLabels.length && /payoff|release/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`),
  );
  const normalizedText = text.replace(/[.!?]+$/g, "").toLowerCase();
  const endpointExactness = isPayoff && payoffLabels.some(
    (label) => normalizedText === label.replace(/[.!?]+$/g, "").toLowerCase(),
  ) ? 1 : 0;

  const sourceLabels = sourceForBeat(input.beat, input.envelope);
  const literalSourceRestatement = !isPayoff && sourceLabels.some(
    (label) => normalizedText === label.replace(/[.!?]+$/g, "").toLowerCase(),
  );
  const semanticBeat = Boolean(
    input.beat.relationKinds?.length ||
      /turn|reframe|discovery|escalation|reveal|consequence/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`),
  );
  const restatementPenalty = semanticBeat && literalSourceRestatement ? 0.25 : 0;
  const creativeLift = semanticBeat && !literalSourceRestatement
    ? Math.min(0.22, 0.09 + semanticCoverage * 0.13)
    : 0;

  const reasons = [
    /hook|arrival|establish/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`) ? "hook-scored-as-establishment" : "",
    fallbackTexts.includes(text) ? "grounded-fallback" : "",
    literalSourceRestatement ? "fact-restatement" : "",
    semanticCoverage >= 0.2 || SEMANTIC_TURN_LANGUAGE.test(text) ? "semantic-turn-grounded" : "",
    endpointExactness === 1 ? "endpoint-exact" : "",
    !candidateLegal ? "candidate-truth-rejected" : "",
    PLANNING_RESIDUE.test(text) ? "planning-residue" : "",
  ].filter(Boolean);

  const score = candidateLegal
    ? Math.min(
        1,
        groundingScore * 0.23 +
          meaningScore * 0.18 +
          transitionScore * 0.2 +
          noveltyScore * 0.08 +
          compressionScore * 0.08 +
          creativeLift * 0.13 +
          (1 - inventionRisk) * 0.1 +
          endpointExactness * 0.25 -
          restatementPenalty,
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
