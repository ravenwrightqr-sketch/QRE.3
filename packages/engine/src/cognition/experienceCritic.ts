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
const ROBOT_RE = /\b(?:the story became|the moment became|this was memorable|it was a meaningful|the experience was|everything changed|the detail gave the moment|the facts were simple|nothing in the moment asked for a speech|it would have been easy to summarize this|the day had a plan|at the time, it looked small|nobody had to name the feeling yet|every detail had a plausible explanation)\b/i;
const TEMPLATE_RE = /\b(?:common sense quietly left|the plan was still technically intact|nothing announced danger|it looked ordinary while it was happening|the sensible version|the day changed lanes|nobody had scheduled the ridiculous part|starting to mean second meaning|looked like the obvious detail|now it reads like setup|earlier, .* seemed like the beginning)\b/i;
const FRAGMENT_RE = /^(?:in|at|on|to|from|with|by|and|but|then)\s+[a-z]+\b/i;

function requiredEvidence(event: WorldEvent): string[] {
  const raw = lower(event.raw);
  const explicitParticipants = event.participants.filter((participant) => raw.includes(lower(participant)));
  return unique([...explicitParticipants, event.object ?? "", event.place ?? "", event.time ?? "", ...event.details]);
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
  const text = lower(candidate.text);
  const required = requiredEvidence(event);
  const missingEvidence = required.filter((anchor) => !text.includes(lower(anchor)));
  const violations = [
    ROBOT_RE.test(candidate.text) ? "generic-realization" : "",
    TEMPLATE_RE.test(candidate.text) ? "template-repetition-risk" : "",
    FRAGMENT_RE.test(candidate.text.trim()) ? "fragment-opening" : "",
    duplicateSentencePenalty(candidate.text) > 0 ? "duplicate-sentence" : "",
  ].filter(Boolean);
  const coverageRatio = required.length === 0 ? 1 : 1 - missingEvidence.length / Math.max(1, required.length);
  const leadPenalty = leadRepetitionPenalty(candidate, prior);
  const sourceEcho = sourceEchoPenalty(candidate, event);
  const repetitionPenalty = leadPenalty + Math.max(0, wordOverlap(candidate.text, prior.at(-1)?.text ?? "") - 0.72) * 16 + duplicateSentencePenalty(candidate.text) + sourceEcho;
  const score = candidate.score + coverageRatio * 20 - violations.length * 65 - repetitionPenalty;
  return {
    accepted: missingEvidence.length === 0 && violations.length === 0,
    score,
    missingEvidence,
    violations,
    reasons: [
      missingEvidence.length ? `missing evidence: ${missingEvidence.join(", ")}` : "explicit evidence conserved",
      violations.length ? violations.join(", ") : "no generic realization leak",
      sourceEcho ? "source sentence echoed instead of transformed" : "source phrasing is transformed",
      leadPenalty ? "repeated sentence lead penalized heavily" : "sentence lead remains distinct",
      repetitionPenalty ? "sequence repetition penalized" : "sequence voice remains distinct",
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
