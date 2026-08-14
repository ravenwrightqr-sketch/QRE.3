import type { CognitiveLens, WorldEvent, WorldModel } from "./worldModel.js";
import type { SignificanceResult } from "./significanceEngine.js";

export type CreativeCandidate = {
  eventId: string;
  text: string;
  lens: CognitiveLens;
  creativity: number;
  evidenceCoverage: number;
  novelty: number;
  causalFit: number;
  attention: number;
  score: number;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
const lower = (value: string) => clean(value).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];

function subject(event: WorldEvent) { return event.participants.join(" and ") || event.object || event.place || "the moment"; }
function anchors(event: WorldEvent) { return unique([...event.participants, event.object ?? "", event.place ?? "", event.time ?? "", ...event.details]); }

function coverage(text: string, event: WorldEvent): number {
  const body = lower(text);
  const values = anchors(event);
  if (!values.length) return 1;
  return values.filter((value) => body.includes(lower(value))).length / values.length;
}

function learnedBias(text: string, preferences: string[], accepted: string[], rejected: string[]): number {
  const body = lower(text);
  let score = 0;
  for (const preference of preferences) if (body.includes(lower(preference))) score += 1;
  for (const value of accepted) if (body.includes(lower(value))) score += 1.5;
  for (const value of rejected) if (body.includes(lower(value))) score -= 3;
  return score;
}

function novelty(text: string, prior: string[]): number {
  const body = lower(text);
  if (!prior.length) return 1;
  const words = new Set(body.split(/\W+/).filter((word) => word.length >= 4));
  const overlaps = prior.map((item) => {
    const set = new Set(lower(item).split(/\W+/).filter((word) => word.length >= 4));
    return [...words].filter((word) => set.has(word)).length / Math.max(1, words.size);
  });
  return 1 - Math.max(...overlaps, 0);
}

/**
 * Deterministic bootstrap policy only. It deliberately has no domain vocabulary
 * or subject-specific branches. A learned/LLM-backed policy can replace this
 * candidate generator without changing the world model, critic, planner, or
 * ExperienceMoment boundary.
 */
function candidatesFor(event: WorldEvent, world: WorldModel): string[] {
  const s = subject(event);
  const out = [clean(event.raw)];
  const relation = event.place ? ` at ${event.place}` : "";
  const temporal = event.time ? ` at ${event.time}` : "";
  const detail = event.details[0];

  if (s && event.action) out.push(`${s} ${event.action}${relation}${temporal}`);
  if (s && detail) out.push(`${s} ${event.action ?? "was present"}; ${detail}`);
  if (world.lens !== "neutral" && s && event.action) {
    const lens = world.lens === "comedy"
      ? "with a little more chaos than expected"
      : world.lens === "horror"
        ? "while the familiar suddenly felt wrong"
        : world.lens === "romance"
          ? "and the moment carried more meaning than it first appeared to"
          : world.lens === "mysterious"
            ? "with one detail refusing to explain itself"
            : "with the energy turned all the way up";
    out.push(`${s} ${event.action}${relation}${temporal}, ${lens}`);
  }

  return unique(out);
}

export function generateCandidates(world: WorldModel, significance: SignificanceResult, preferences: string[] = [], accepted: string[] = [], rejected: string[] = []): CreativeCandidate[] {
  const result: CreativeCandidate[] = [];
  const prior: string[] = [];
  for (const event of [...world.events].sort((a, b) => (significance.scores.get(b.id) ?? 0) - (significance.scores.get(a.id) ?? 0))) {
    for (const text of candidatesFor(event, world)) {
      const evidenceCoverage = coverage(text, event);
      const candidateNovelty = novelty(text, prior);
      const causalFit = event.order === 0 ? 1 : 0.8;
      const attention = (significance.scores.get(event.id) ?? 1) / 10;
      const creativity = Math.min(10, Math.max(0, text.length / 20));
      const bias = learnedBias(text, preferences, accepted, rejected);
      const protectedScore = evidenceCoverage >= 1 ? 35 : -80;
      const score = protectedScore + evidenceCoverage * 35 + candidateNovelty * 12 + causalFit * 10 + attention * 8 + creativity + bias;
      result.push({ eventId: event.id, text, lens: world.lens, creativity, evidenceCoverage, novelty: candidateNovelty, causalFit, attention, score });
      prior.push(text);
    }
  }
  return result;
}

export function selectCreativeSequence(world: WorldModel, candidates: CreativeCandidate[]): CreativeCandidate[] {
  const selected: CreativeCandidate[] = [];
  const usedEvents = new Set<string>();
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score)) {
    if (usedEvents.has(candidate.eventId)) continue;
    selected.push(candidate);
    usedEvents.add(candidate.eventId);
  }
  return world.events
    .map((event) => selected.find((candidate) => candidate.eventId === event.id) ?? candidates.find((candidate) => candidate.eventId === event.id))
    .filter(Boolean) as CreativeCandidate[];
}
