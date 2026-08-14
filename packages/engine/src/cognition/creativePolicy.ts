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
  creativeDetails: string[];
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
const lower = (value: string) => clean(value).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];

function subject(event: WorldEvent) {
  return event.participants.join(" and ") || event.object || event.place || "the moment";
}

function anchors(event: WorldEvent) {
  return unique([...event.participants, event.object ?? "", event.place ?? "", event.time ?? "", ...event.details]);
}

function coverage(text: string, event: WorldEvent): number {
  const body = lower(text);
  const values = anchors(event);
  if (!values.length) return 1;
  return values.filter((value) => body.includes(lower(value))).length / values.length;
}

function learnedBias(text: string, preferences: string[], accepted: string[], rejected: string[]): number {
  const body = lower(text);
  let score = 0;
  for (const preference of preferences) if (body.includes(lower(preference))) score += 1.25;
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

function rhythm(event: WorldEvent): string {
  const parts = [event.time, subject(event), event.action, event.object, event.place]
    .filter(Boolean)
    .join(" ");
  return clean(parts);
}

function creativeFrame(lens: CognitiveLens, event: WorldEvent): { text: string; detail: string } | undefined {
  const s = subject(event);
  const thing = event.object ?? event.place ?? event.details[0];
  if (!s) return undefined;

  if (lens === "comedy") {
    const frames = [
      `${s} ${event.action ?? "showed up"}${thing ? ` with ${thing}` : ""}, carrying the energy of someone already preparing a defense`,
      `${s} ${event.action ?? "showed up"}${thing ? ` with ${thing}` : ""}, as though the ordinary version of this plan had already been rejected`,
      `${s} ${event.action ?? "showed up"}${thing ? ` with ${thing}` : ""}, and somehow the situation already felt bigger than it needed to be`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "comedic personification/contrast" };
  }

  if (lens === "horror") {
    const frames = [
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, and the familiar suddenly felt slightly wrong`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}; nothing had to announce the danger for the atmosphere to change`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, while the ordinary details started behaving like clues`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "horror atmosphere framing" };
  }

  if (lens === "romance") {
    const frames = [
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, and the detail carried more history than it first appeared to`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, giving the moment a little more weight than the clock could explain`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}; some moments feel ordinary until you know what they will mean later`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "romantic significance framing" };
  }

  if (lens === "mysterious") {
    const frames = [
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, leaving one detail that refused to explain itself`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}; the facts were ordinary enough, which made the strange part worse`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, and suddenly the smallest detail had the loudest voice`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "mystery emphasis framing" };
  }

  if (lens === "wild") {
    const frames = [
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, and the whole thing picked up momentum fast`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}; the plan survived, but it did not stay quiet`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, with the kind of momentum that makes a normal day difficult to recover`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "high-energy escalation framing" };
  }

  return undefined;
}

function candidatesFor(event: WorldEvent, world: WorldModel, previous?: WorldEvent, next?: WorldEvent): Array<{ text: string; creativeDetails: string[] }> {
  const s = subject(event);
  const out: Array<{ text: string; creativeDetails: string[] }> = [];
  const direct = clean(event.raw);
  out.push({ text: direct, creativeDetails: [] });

  const compact = rhythm(event);
  if (compact && compact.toLowerCase() !== direct.toLowerCase()) {
    out.push({ text: compact, creativeDetails: [] });
  }

  if (s && event.action && event.object) {
    const suffix = [event.place ? `at ${event.place}` : "", event.time ? `at ${event.time}` : ""].filter(Boolean).join(" ");
    out.push({
      text: `${s} ${event.action} ${event.object}${suffix ? ` ${suffix}` : ""}`,
      creativeDetails: [],
    });
  }

  if (previous && event.order > 0) {
    const previousAnchor = previous.object ?? previous.place ?? previous.action ?? previous.raw;
    out.push({
      text: `After ${clean(previousAnchor)}, ${direct.toLowerCase()}`,
      creativeDetails: ["causal transition from adjacent event"],
    });
  }

  if (next && event.order < world.events.length - 1 && event.action) {
    const nextAnchor = next.object ?? next.place ?? next.action ?? next.raw;
    out.push({
      text: `${direct}; then ${lower(nextAnchor)} was still to come`,
      creativeDetails: ["anticipatory transition from adjacent event"],
    });
  }

  const frame = creativeFrame(world.lens, event);
  if (frame) out.push(frame);

  if (event.details.length > 1 && s) {
    const detailLine = event.details.slice(0, 3).join(", ");
    out.push({
      text: `${s} ${event.action ?? "carried on"}; ${detailLine} stayed in the frame`,
      creativeDetails: ["detail spotlight"],
    });
  }

  return out.filter((item, index, values) => index === values.findIndex((candidate) => lower(candidate.text) === lower(item.text)));
}

export function generateCandidates(
  world: WorldModel,
  significance: SignificanceResult,
  preferences: string[] = [],
  accepted: string[] = [],
  rejected: string[] = [],
): CreativeCandidate[] {
  const result: CreativeCandidate[] = [];
  const prior: string[] = [];

  for (const event of world.events) {
    const previous = world.events[event.order - 1];
    const next = world.events[event.order + 1];
    for (const candidate of candidatesFor(event, world, previous, next)) {
      const evidenceCoverage = coverage(candidate.text, event);
      const candidateNovelty = novelty(candidate.text, prior);
      const causalFit = previous && candidate.text.toLowerCase().includes(lower(previous.object ?? previous.place ?? previous.action ?? previous.raw)) ? 1 : event.order === 0 ? 0.95 : 0.82;
      const attention = Math.min(1.5, (significance.scores.get(event.id) ?? 1) / 10);
      const creativity = Math.min(10, Math.max(0, candidate.creativeDetails.length * 2 + candidate.text.length / 28));
      const bias = learnedBias(candidate.text, preferences, accepted, rejected);
      const rawPenalty = lower(candidate.text) === lower(event.raw) ? -6 : 0;
      const protectedScore = evidenceCoverage >= 1 ? 42 : -90;
      const score = protectedScore + evidenceCoverage * 38 + candidateNovelty * 16 + causalFit * 11 + attention * 9 + creativity + bias + rawPenalty;
      result.push({
        eventId: event.id,
        text: candidate.text,
        lens: world.lens,
        creativity,
        evidenceCoverage,
        novelty: candidateNovelty,
        causalFit,
        attention,
        score,
        creativeDetails: candidate.creativeDetails,
      });
      prior.push(candidate.text);
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
