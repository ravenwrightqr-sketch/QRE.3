import type { WorldEvent, WorldModel } from "./worldModel.js";
import type { CreativeCandidate } from "./creativePolicy.js";

export type Critique = {
  accepted: boolean;
  score: number;
  missingEvidence: string[];
  violations: string[];
  reasons: string[];
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];
const META_RE = /\b(?:ai|qre|prompt|compiler|cognition|metadata|model|instruction|writing process)\b/i;
const CAMERA_RE = /\b(?:camera|zoom|close-up|cut to|final shot|scene opens|we see)\b/i;
const MULTI_CUT_PUNCT_RE = /[,;]/;
const PRONOUN_RE = /\b(he|him|his|she|her|hers|they|them|their|themself|themselves)\b/i;

function explicitAnchors(event: WorldEvent): string[] {
  const raw = lower(event.raw);
  return unique([
    ...event.participants.filter((participant) => raw.includes(lower(participant))),
    event.object ?? "",
    event.place ?? "",
    event.time ?? "",
    ...event.details,
  ]);
}

function preservedAnchorCount(text: string, event: WorldEvent): number {
  const body = lower(text);
  return explicitAnchors(event).filter((anchor) => body.includes(lower(anchor))).length;
}

function hasAnyGrounding(text: string, event: WorldEvent): boolean {
  const anchors = explicitAnchors(event);
  return anchors.length === 0 || anchors.some((anchor) => lower(text).includes(lower(anchor)));
}

function wordOverlap(left: string, right: string): number {
  const a = new Set(lower(left).split(/\W+/).filter((word) => word.length >= 4));
  const b = new Set(lower(right).split(/\W+/).filter((word) => word.length >= 4));
  if (!a.size || !b.size) return 0;
  return [...a].filter((word) => b.has(word)).length / Math.max(1, Math.min(a.size, b.size));
}

function lead(value: string, count = 3): string {
  return lower(value).split(/\s+/).filter(Boolean).slice(0, count).join(" ");
}

function duplicateSentencePenalty(text: string): number {
  const sentences = text.split(/(?<=[.!?])\s+/).map(lower).filter(Boolean);
  const counts = new Map<string, number>();
  for (const item of sentences) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.values()].filter((count) => count > 1).reduce((sum, count) => sum + (count - 1) * 24, 0);
}

function sourceEchoPenalty(candidate: CreativeCandidate, event: WorldEvent): number {
  const raw = lower(event.raw);
  if (!raw || raw.length < 12 || lower(candidate.text) === raw) return 0;
  const body = lower(candidate.text);
  if (body.indexOf(raw) === 0) return 12;
  if (body.includes(raw)) return 7;
  return 0;
}

function leadRepetitionPenalty(candidate: CreativeCandidate, prior: CreativeCandidate[]): number {
  if (!prior.length) return 0;
  const three = lead(candidate.text, 3);
  const two = lead(candidate.text, 2);
  const one = lead(candidate.text, 1);
  let penalty = 0;
  for (const item of prior) {
    if (three && three === lead(item.text, 3)) penalty += 26;
    else if (two && two === lead(item.text, 2)) penalty += 13;
    else if (one && one === lead(item.text, 1)) penalty += 4;
  }
  return penalty;
}

export function critiqueCandidate(candidate: CreativeCandidate, event: WorldEvent, prior: CreativeCandidate[] = []): Critique {
  const text = clean(candidate.text);
  const preserved = preservedAnchorCount(text, event);
  const missingEvidence = hasAnyGrounding(text, event) ? [] : ["no explicit grounding anchor preserved"];
  const violations = [
    META_RE.test(text) ? "meta-language" : "",
    CAMERA_RE.test(text) ? "camera-direction" : "",
    MULTI_CUT_PUNCT_RE.test(text) ? "multiple-cuts-in-one-line" : "",
    PRONOUN_RE.test(text) && event.participants.length === 0 ? "unverified-pronoun-risk" : "",
    duplicateSentencePenalty(text) > 0 ? "duplicate-sentence" : "",
  ].filter(Boolean);

  const coverageBonus = Math.min(12, preserved * 3);
  const leadPenalty = leadRepetitionPenalty(candidate, prior);
  const sourceEcho = sourceEchoPenalty(candidate, event);
  const repetitionPenalty = leadPenalty + Math.max(0, wordOverlap(text, prior.at(-1)?.text ?? "") - 0.72) * 16 + duplicateSentencePenalty(text) + sourceEcho;
  const score = candidate.score + coverageBonus - violations.length * 45 - repetitionPenalty;

  return {
    accepted: missingEvidence.length === 0 && violations.length === 0,
    score,
    missingEvidence,
    violations,
    reasons: [
      preserved ? `${preserved} explicit anchor(s) preserved` : "no anchor preserved",
      missingEvidence.length ? missingEvidence.join(", ") : "grounded enough for creative isolation",
      violations.length ? violations.join(", ") : "no structural realization violation",
      sourceEcho ? "source phrasing echoed instead of transformed" : "source phrasing not over-penalized",
      leadPenalty ? "repeated lead penalized" : "lead remains distinct",
    ],
  };
}

export function selectCritically(world: WorldModel, candidates: CreativeCandidate[]): CreativeCandidate[] {
  const selected: CreativeCandidate[] = [];
  for (const event of world.events) {
    const viable = candidates
      .filter((candidate) => candidate.eventId === event.id)
      .map((candidate) => ({ candidate, critique: critiqueCandidate(candidate, event, selected) }))
      .sort((a, b) => Number(b.critique.accepted) - Number(a.critique.accepted) || b.critique.score - a.critique.score);
    if (viable[0]) selected.push(viable[0].candidate);
  }
  return selected;
}
