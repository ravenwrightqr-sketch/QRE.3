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

export type { MouthCandidate, MouthCandidateBatch, MouthCandidateBeat, MouthCandidateSelection } from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const bounded = (value: string): string => clean(value).split(/\s+/).filter(Boolean).slice(0, 7).join(" ");

const META = /\b(?:qre|compiler|cognition|meaning spine|beat graph|information frontier|planner|planning|operator mix|viewer sees|audience sees|writing process)\b/i;
const PHYSICAL_INVENTION = /\b(?:glares?|sniffs?|stares?|smiles?|wags?|trembles?|blinks?|hides?|walks?|runs?|jumps?|grabs?|bites?|laughs?|cries?|enters?|approaches?|leaves?|returns?|turns?|steps?)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|new chapter)\b/i;

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();
  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
};

const tokens = (text: string): string[] => clean(text).toLowerCase().split(/[^a-z0-9'-]+/i).filter((token) => token.length >= 3).map(normalizeToken);
const tokenSet = (text: string): Set<string> => new Set(tokens(text));

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / a.size;
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

function semanticSourceForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return unique([
    beat.change,
    beat.next,
    beat.frontier,
    ...(beat.setsUp ?? []).map((id) => eventLabel(envelope, id) || id),
    ...(beat.paysOff ?? []).map((id) => eventLabel(envelope, id) || id),
    ...sourceForBeat(beat, envelope),
  ]);
}

function fallback(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const labels = sourceForBeat(beat, envelope);
  const first = bounded(labels[0] ?? envelope.subject ?? "");
  const second = bounded(labels[1] ?? "");
  const attention = clean(beat.attentionFunction ?? beat.role).toLowerCase();
  const out: string[] = [];

  if (beat.paysOff?.length && (attention.includes("payoff") || attention.includes("release") || clean(beat.role).toLowerCase() === "payoff")) {
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

  return unique(out).slice(0, 5).map(bounded).filter(Boolean);
}

function legal(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const value = clean(text);
  if (!value || value.split(/\s+/).length > 7) return false;
  if (META.test(value) || GENERIC.test(value)) return false;
  if (PHYSICAL_INVENTION.test(value) && !sourceForBeat(beat, envelope).join(" ").toLowerCase().match(PHYSICAL_INVENTION)) return false;
  return true;
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const beats = input.beats.length ? input.beats : [];
  const evidence = unique([
    ...input.envelope.suppliedPhrases,
    ...input.envelope.events.map((event) => event.label),
  ]).slice(0, 40);

  const system = [
    "QRE CANONICAL MOUTH · VIEWER-FACING FILM MOMENTS.",
    "The upstream Author already chose the reality, sequence, frame, and attention movement.",
    "Your job is language realization only.",
    "Each beat becomes one short film moment. Keep the beats in order.",
    "2-7 words preferred. One thought. Make the next moment desirable.",
    "For non-terminal relationship/change beats, do NOT merely restate the supplied fact. Express the approved semantic turn as attitude, status, implication, contrast, or comic consequence when the evidence supports it.",
    "Example: a supplied state transition like 'scared at first -> grooming visit' may become 'Fear first. Now I own the place.' The second sentence is framing, not a new event.",
    "State/relationship beats may use attitude, implication, contrast, status, rhythm, or rhetorical punctuation without inventing a physical event.",
    "A rhetorical question such as 'Bows? Absolutely not.' is legal; it is not a request for user information.",
    "Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",
    "Do not output planner language, labels, diagnostics, or explanations.",
    "Return JSON only: {\"variantsByBeat\":[{\"order\":1,\"variants\":[\"...\"]}]}",
  ].join("\n");

  const user = {
    task: "realize_approved_beats",
    subject: input.envelope.subject,
    lens: input.lens ?? "natural, specific, cinematic",
    suppliedEvidence: evidence,
    priorTexts: input.priorTexts ?? [],
    beats,
  };

  return [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(user) },
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
          .map((entry) => ({
            order: Number(entry.order),
            variants: unique(entry.variants ?? []).slice(0, 8),
          }))
          .filter((entry) => Number.isFinite(entry.order)),
      };
    }

    if (Array.isArray(parsed.texts)) {
      return {
        variantsByBeat: parsed.texts
          .map((value, index) => ({
            order: index + 1,
            variants: clean(value) ? [clean(value)] : [],
          }))
          .filter((entry) => entry.variants.length > 0),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  let text = bounded(input.text);
  const fallbackTexts = fallback(input.beat, input.envelope);
  const priorTexts = input.priorTexts ?? [];

  if (!legal(text, input.beat, input.envelope)) {
    text = fallbackTexts[0] ?? "";
  }

  const source = tokenSet(sourceForBeat(input.beat, input.envelope).join(" "));
  const semanticSource = tokenSet(semanticSourceForBeat(input.beat, input.envelope).join(" "));
  const current = tokenSet(text);
  const required = unique(input.beat.eventIds ?? []);
  const requiredEvents = input.envelope.events.filter((event) => required.includes(event.id));
  const supportedEventIds = input.envelope.events
    .filter((event) => current.size && overlap(current, tokenSet(event.label)) >= 0.25)
    .map((event) => event.id)
    .filter((id) => required.length === 0 || required.includes(id));

  const phraseSupported = (candidateText: string, label: string): boolean => {
    const phrase = clean(label).toLowerCase();
    const candidate = clean(candidateText).toLowerCase();
    if (!phrase || !candidate) return false;
    return candidate.includes(phrase) || overlap(tokenSet(candidate), tokenSet(phrase)) >= 0.5;
  };

  const eventSupported = (event: RealityEnvelope["events"][number]): boolean =>
    phraseSupported(text, event.label) ||
    overlap(current, tokenSet(event.label)) >= 0.25;

  const requiredCoverage = requiredEvents.length
    ? requiredEvents.filter(eventSupported).length / requiredEvents.length
    : 0;

  const supportedRequiredIds = requiredEvents
    .filter(eventSupported)
    .map((event) => event.id);

  for (const id of supportedRequiredIds) {
    if (!supportedEventIds.includes(id)) supportedEventIds.push(id);
  }

  const supportedRelationPairs = input.envelope.relations
    .filter((relation) => supportedEventIds.includes(relation.from) && supportedEventIds.includes(relation.to))
    .map((relation) => `${relation.from}->${relation.to}`);

  const groundingScore = Math.max(
    0.35,
    Math.min(1, overlap(current, source) * 0.45 + requiredCoverage * 0.45 + overlap(current, semanticSource) * 0.1),
  );

  const semanticCoverage = overlap(current, semanticSource);
  const interpretive = /\b(?:apparently|again|still|only|instead|absolutely|no|yes|temporary|round|ready|now|fear|control|own|agency|status|mine|master|boss|command)\b/i.test(text) ? 0.22 : 0;
  const meaningScore = Math.min(1, 0.45 + groundingScore * 0.3 + interpretive + semanticCoverage * 0.18);
  const transitionScore = Math.min(1, 0.38 + semanticCoverage * 0.32 + (input.beat.next || input.beat.frontier ? 0.1 : 0) + (input.beat.relationKinds?.length ? 0.2 : 0));
  const noveltyScore = priorTexts.length ? Math.max(0.15, 1 - Math.max(...priorTexts.map((prior) => overlap(current, tokenSet(prior))))) : 1;
  const compressionScore = text.split(/\s+/).length <= 7 ? 1 : 0;
  const repetitionRisk = 1 - noveltyScore;
  const inventionRisk = legal(text, input.beat, input.envelope) ? 0.05 : 0.9;
  const forbiddenMoveRisk = META.test(text) || GENERIC.test(text) ? 1 : 0;

  const payoffLabels = unique(
    (input.beat.paysOff ?? [])
      .map((id) => eventLabel(input.envelope, id))
      .filter(Boolean),
  );
  const isPayoff = Boolean(
    payoffLabels.length &&
    /payoff|release/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`),
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
    ? Math.min(0.18, 0.08 + semanticCoverage * 0.1)
    : 0;

  const reasons = [
    /hook|arrival|establish/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`) ? "hook-scored-as-establishment" : "",
    fallbackTexts.includes(text) ? "grounded-fallback" : "",
    literalSourceRestatement ? "fact-restatement" : "",
    semanticCoverage >= 0.2 ? "semantic-turn-grounded" : "",
    endpointExactness === 1 ? "endpoint-exact" : "",
  ].filter(Boolean);

  const score = Math.min(1,
    groundingScore * 0.24 +
    meaningScore * 0.18 +
    transitionScore * 0.2 +
    noveltyScore * 0.08 +
    compressionScore * 0.1 +
    creativeLift * 0.1 +
    (1 - inventionRisk) * 0.1 +
    endpointExactness * 0.25 -
    restatementPenalty,
  );

  return {
    text,
    beatOrder: input.beat.order,
    supportedEventIds,
    supportedRelationPairs,
    groundingScore,
    meaningScore,
    transitionScore,
    obligationCoverage: Math.min(1, groundingScore * 0.55 + transitionScore * 0.45),
    relationContractScore: input.beat.relationKinds?.length ? Math.max(0.4, supportedRelationPairs.length / input.beat.relationKinds.length) : 0.6,
    forbiddenMoveRisk,
    cohesionScore: priorTexts.length ? noveltyScore * 0.6 + 0.4 : 0.7,
    noveltyScore,
    compressionScore,
    inventionRisk,
    repetitionRisk,
    collageRisk: 0,
    endpointExactness,
    score,
    reasons,
  };
}
