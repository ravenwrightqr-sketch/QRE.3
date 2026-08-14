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

/**
 * Only explicit evidence is mandatory for realization.
 *
 * Participants can be inherited from prior events/memory when grammar omits
 * them from the current clause. Treating those inherited identities as
 * mandatory textual anchors forces unnatural repetition and can cause the
 * critic to reject a truthful raw realization. Context is preserved in the
 * WorldEvent; realization is only required to conserve evidence actually
 * expressed by this event.
 */
function requiredEvidence(event: WorldEvent): string[] {
  const raw = lower(event.raw);
  const explicitParticipants = event.participants.filter((participant) => raw.includes(lower(participant)));
  return unique([
    ...explicitParticipants,
    event.object ?? "",
    event.place ?? "",
    event.time ?? "",
    ...event.details,
  ]);
}

export function critiqueCandidate(candidate: CreativeCandidate, event: WorldEvent): Critique {
  const text = lower(candidate.text);
  const required = requiredEvidence(event);
  const missingEvidence = required.filter((anchor) => !text.includes(lower(anchor)));
  const violations = [
    LEAK_RE.test(candidate.text) ? "cognitive-language-leak" : "",
    ROBOT_RE.test(candidate.text) ? "generic-realization" : "",
  ].filter(Boolean);
  const coverageRatio = required.length === 0
    ? 1
    : 1 - missingEvidence.length / Math.max(1, required.length);
  const score = candidate.score + coverageRatio * 20 - violations.length * 50;
  return {
    accepted: missingEvidence.length === 0 && violations.length === 0,
    score,
    missingEvidence,
    violations,
    reasons: [
      missingEvidence.length ? `missing evidence: ${missingEvidence.join(", ")}` : "explicit evidence conserved",
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
