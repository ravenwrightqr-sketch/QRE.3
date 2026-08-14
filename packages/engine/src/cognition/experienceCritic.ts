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

const LEAK_RE = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|trajectory|mechanic|latent movie|internal state|generated output)\b/i;
const ROBOT_RE = /\b(?:the story became|the moment became|this was memorable|it was a meaningful|the experience was|everything changed)\b/i;

export function critiqueCandidate(candidate: CreativeCandidate, event: WorldEvent): Critique {
  const text = lower(candidate.text);
  const missingEvidence = unique([
    ...event.participants,
    event.object ?? "",
    event.place ?? "",
    event.time ?? "",
    ...event.details,
  ].filter((anchor) => anchor && !text.includes(lower(anchor))));
  const violations = [
    LEAK_RE.test(candidate.text) ? "cognitive-language-leak" : "",
    ROBOT_RE.test(candidate.text) ? "generic-realization" : "",
  ].filter(Boolean);
  const coverageRatio = (missingEvidence.length === 0 ? 1 : 1 - missingEvidence.length / Math.max(1, event.participants.length + (event.object ? 1 : 0) + (event.place ? 1 : 0) + (event.time ? 1 : 0) + event.details.length));
  const score = candidate.score + coverageRatio * 20 - violations.length * 50;
  return {
    accepted: missingEvidence.length === 0 && violations.length === 0,
    score,
    missingEvidence,
    violations,
    reasons: [
      missingEvidence.length ? `missing evidence: ${missingEvidence.join(", ")}` : "evidence conserved",
      violations.length ? violations.join(", ") : "no cognitive leakage",
    ],
  };
}

export function selectCritically(world: WorldModel, candidates: CreativeCandidate[]): CreativeCandidate[] {
  const selected: CreativeCandidate[] = [];
  for (const event of world.events) {
    const viable = candidates
      .filter((candidate) => candidate.eventId === event.id)
      .map((candidate) => ({ candidate, critique: critiqueCandidate(candidate, event) }))
      .sort((a, b) => Number(b.critique.accepted) - Number(a.critique.accepted) || b.critique.score - a.critique.score);
    if (viable[0]) selected.push(viable[0].candidate);
  }
  return selected;
}
