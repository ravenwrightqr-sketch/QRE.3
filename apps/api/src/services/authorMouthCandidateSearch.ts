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
const PHYSICAL_INVENTION = /\b(?:glares?|sniffs?|stares?|smiles?|wags?|trembles?|blinks?|hides?|walks?|runs?|jumps?|grabs?|bites?|laughs?|cries?)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|new chapter)\b/i;
const INTERPRETIVE_WORDS = new Set(["apparently", "already", "again", "still", "only", "instead", "somehow", "perhaps", "maybe", "finally", "temporary", "temporarily", "absolutely", "just", "now", "then", "no", "yes", "round"]);

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
  ], 40);

  const system = [
    "QRE CANONICAL MOUTH · VIEWER-FACING FILM MOMENTS.",
    "The upstream Author already chose the reality, sequence, frame, and attention movement.",
    "Your job is language realization only.",
    "Each beat becomes one short film moment. Keep the beats in order.",
    "2-7 words preferred. One thought. Make the next moment desirable.",
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
    const parsed = JSON.parse(text) as Partial<MouthCandidateBatch>;
    if (!Array.isArray(parsed.variantsByBeat)) return null;
    return {
      variantsByBeat: parsed.variantsByBeat
        .map((entry) => ({
          order: Number(entry.order),
          variants: unique(entry.variants ?? []).slice(0, 8),
        }))
        .filter((entry) => Number.isFinite(entry.order)),
    };
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
  const current = tokenSet(text);
  const required = unique(input.beat.eventIds ?? []);
  const supportedEventIds = input.envelope.events
    .filter((event) => current.size && overlap(current, tokenSet(event.label)) >= 0.25)
    .map((event) => event.id)
    .filter((id) => required.length === 0 || required.includes(id));

  const supportedRelationPairs = input.envelope.relations
    .filter((relation) => supportedEventIds.includes(relation.from) && supportedEventIds.includes(relation.to))
    .map((relation) => `${relation.from}->${relation.to}`);

  const groundingScore = Math.max(0.35, overlap(current, source) * 0.7 + (supportedEventIds.length ? 0.3 : 0));
  const interpretive = /\b(?:apparently|again|still|only|instead|absolutely|no|yes|temporary|round|ready)\b/i.test(text) ? 0.2 : 0;
  const meaningScore = Math.min(1, 0.45 + groundingScore * 0.35 + interpretive);
  const transitionScore = Math.min(1, 0.4 + (input.beat.next || input.beat.frontier ? 0.15 : 0) + (input.beat.relationKinds?.length ? 0.25 : 0));
  const noveltyScore = priorTexts.length ? Math.max(0.15, 1 - Math.max(...priorTexts.map((prior) => overlap(current, tokenSet(prior))))) : 1;
  const compressionScore = text.split(/\s+/).length <= 7 ? 1 : 0;
  const repetitionRisk = 1 - noveltyScore;
  const inventionRisk = legal(text, input.beat, input.envelope) ? 0.05 : 0.9;
  const forbiddenMoveRisk = META.test(text) || GENERIC.test(text) ? 1 : 0;
  const endpointExactness = input.beat.paysOff?.length && /payoff|release/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`)
    ? (text.replace(/[.!?]+$/g, "").toLowerCase() === clean(sourceForBeat(input.beat, input.envelope)[0]).replace(/[.!?]+$/g, "").toLowerCase() ? 1 : 0)
    : 0;

  const reasons = [
    /hook|arrival|establish/i.test(`${input.beat.attentionFunction ?? ""} ${input.beat.role ?? ""}`) ? "hook-scored-as-establishment" : "",
    fallbackTexts.includes(text) ? "grounded-fallback" : "",
    text && text.toLowerCase() === sourceForBeat(input.beat, input.envelope)[0]?.toLowerCase() ? "fact-restatement" : "",
  ].filter(Boolean);

  const score = Math.min(1,
    groundingScore * 0.3 +
    meaningScore * 0.2 +
    transitionScore * 0.15 +
    noveltyScore * 0.1 +
    compressionScore * 0.15 +
    (1 - inventionRisk) * 0.1,
  );

  return {
    text,
    beatOrder: input.beat.order,
    supportedEventIds,
    supportedRelationPairs,
    groundingScore,
    meaningScore,
    transitionScore,
    obligationCoverage: Math.min(1, groundingScore * 0.6 + transitionScore * 0.4),
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
