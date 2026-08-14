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
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function subject(event: WorldEvent) { return event.participants.join(" and ") || event.object || event.place || "the moment"; }
function anchors(event: WorldEvent) { return unique([...event.participants, event.object ?? "", event.place ?? "", event.time ?? "", ...event.details]); }

function coverage(text: string, event: WorldEvent): number {
  const body = lower(text);
  const values = anchors(event);
  if (!values.length) return 1;
  const hits = values.filter((value) => body.includes(lower(value))).length;
  return hits / values.length;
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
  const overlaps = prior.map((item) => new Set(lower(item).split(/\W+/).filter((word) => word.length >= 4))).map((set) => [...words].filter((word) => set.has(word)).length / Math.max(1, words.size));
  return 1 - Math.max(...overlaps, 0);
}

function candidatesFor(event: WorldEvent, world: WorldModel): string[] {
  const s = subject(event);
  const first = clean(event.raw);
  const out = [first];
  if (world.lens === "comedy" && s) {
    if (event.action && /\b(?:arrived|entered|came|walked|returned)\b/i.test(event.action)) out.push(`${s} arrived as if the day had already become a story`);
    if (event.object && /\b(?:stole|chewed|broke|tore|ate|shook)\b/i.test(event.action ?? "")) out.push(`${s} took ${event.object} and appeared completely committed to the decision`);
    if (event.details.length) out.push(`${s} managed to make ${event.details[0]} feel like the important part`);
  }
  if (world.lens === "romance" && s && event.place) {
    out.push(`${s} were back at ${event.place}, where the earlier memory still had a pulse`);
  }
  if (world.lens === "horror" && event.place) {
    out.push(`At ${event.place}, the familiar details were still there. That was the unsettling part`);
  }
  if (world.lens === "mysterious" && event.place) {
    out.push(`Back at ${event.place}, one detail suddenly mattered more than it had before`);
  }
  if (world.lens === "wild" && s) {
    out.push(`${s} did not ease into the moment. They arrived in it at full speed`);
  }
  if (world.lens === "neutral" && event.details.length) {
    out.push(`${sentenceWithDetail(event, event.details[0])}`);
  }
  return unique(out);
}

function sentenceWithDetail(event: WorldEvent, detail: string) {
  const s = subject(event);
  return s && event.action ? `${s} ${event.action} while ${detail} stayed in view` : `${event.raw} — ${detail}`;
}

export function generateCandidates(world: WorldModel, significance: SignificanceResult, preferences: string[] = [], accepted: string[] = [], rejected: string[] = []): CreativeCandidate[] {
  const result: CreativeCandidate[] = [];
  const prior: string[] = [];
  for (const event of [...world.events].sort((a, b) => (significance.scores.get(b.id) ?? 0) - (significance.scores.get(a.id) ?? 0))) {
    for (const text of candidatesFor(event, world)) {
      const evidenceCoverage = coverage(text, event);
      const isProtected = evidenceCoverage >= 1;
      const candidateNovelty = novelty(text, prior);
      const causalFit = event.order === 0 ? 1 : 0.8;
      const attention = (significance.scores.get(event.id) ?? 1) / 10;
      const creativity = Math.min(10, Math.max(0, text.length / 20));
      const bias = learnedBias(text, preferences, accepted, rejected);
      const score = (isProtected ? 35 : -80) + evidenceCoverage * 35 + candidateNovelty * 12 + causalFit * 10 + attention * 8 + creativity + bias;
      result.push({ eventId: event.id, text, lens: world.lens, creativity, evidenceCoverage, novelty: candidateNovelty, causalFit, attention, score });
      prior.push(text);
    }
  }
  return result;
}

export function selectCreativeSequence(world: World, candidates: CreativeCandidate[]): CreativeCandidate[] {
  const selected: CreativeCandidate[] = [];
  const usedEvents = new Set<string>();
  const ordered = [...candidates].sort((a, b) => b.score - a.score);
  for (const candidate of ordered) {
    if (usedEvents.has(candidate.eventId)) continue;
    selected.push(candidate);
    usedEvents.add(candidate.eventId);
  }
  return world.events.map((event) => selected.find((candidate) => candidate.eventId === event.id) ?? candidates.find((candidate) => candidate.eventId === event.id)).filter(Boolean) as CreativeCandidate[];
}
