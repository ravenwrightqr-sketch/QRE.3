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
const ROBOT_RE = /\b(?:the story became|the moment became|this was memorable|it was a meaningful|the experience was|everything changed|the detail gave the moment)\b/i;
const TEMPLATE_RE = /\b(?:common sense quietly left|the plan was still technically intact|nothing announced danger|it looked ordinary while it was happening|the sensible version|the day changed lanes|nobody had scheduled the ridiculous part)\b/i;

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
  ].filter(Boolean);
  const coverageRatio = required.length === 0 ? 1 : 1 - missingEvidence.length / Math.max(1, required.length);
  const leadPenalty = leadRepetitionPenalty(candidate, prior);
  const repetitionPenalty = leadPenalty + Math.max(0, wordOverlap(candidate.text, prior.at(-1)?.text ?? "") - 0.72) * 16;
  const score = candidate.score + coverageRatio * 20 - violations.length * 50 - repetitionPenalty;
  return {
    accepted: missingEvidence.length === 0 && violations.length === 0,
    score,
    missingEvidence,
    violations,
    reasons: [
      missingEvidence.length ? `missing evidence: ${missingEvidence.join(", ")}` : "explicit evidence conserved",
      violations.length ? violations.join(", ") : "no generic realization leak",
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
