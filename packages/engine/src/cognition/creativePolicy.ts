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
  const body = lower(text); const values = anchors(event);
  if (!values.length) return 1;
  return values.filter((value) => body.includes(lower(value))).length / values.length;
}
function learnedBias(text: string, preferences: string[], accepted: string[], rejected: string[]): number {
  const body = lower(text); let score = 0;
  for (const preference of preferences) if (body.includes(lower(preference))) score += 1.25;
  for (const value of accepted) if (body.includes(lower(value))) score += 1.5;
  for (const value of rejected) if (body.includes(lower(value))) score -= 3;
  return score;
}
function novelty(text: string, prior: string[]): number {
  const body = lower(text); if (!prior.length) return 1;
  const words = new Set(body.split(/\W+/).filter((word) => word.length >= 4));
  const overlaps = prior.map((item) => { const set = new Set(lower(item).split(/\W+/).filter((word) => word.length >= 4)); return [...words].filter((word) => set.has(word)).length / Math.max(1, words.size); });
  return 1 - Math.max(...overlaps, 0);
}
function rhythm(event: WorldEvent): string {
  return clean([event.time, subject(event), event.action, event.object, event.place].filter(Boolean).join(" "));
}
function directPerformance(event: WorldEvent, lens: CognitiveLens): { text: string; detail: string } {
  const direct = clean(event.raw);
  if (lens === "comedy") {
    const frames = [
      `${direct}. Somewhere along the way, common sense quietly left the room.`,
      `${direct}. Reasonable was apparently not on the guest list.`,
      `${direct}. This was the moment the perfectly normal version of the day lost control of the narrative.`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "evidence-preserving comedic performance" };
  }
  if (lens === "horror") {
    const frames = [
      `${direct}. The familiar details were still there. That was the problem.`,
      `${direct}. Nothing had to announce the danger for the room to feel different.`,
      `${direct}. The facts stayed ordinary; the atmosphere did not.`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "evidence-preserving horror performance" };
  }
  if (lens === "romance") {
    const frames = [
      `${direct}. Small in the moment, larger in the memory.`,
      `${direct}. It was the sort of detail time knows how to keep.`,
      `${direct}. Some moments ask for nothing and still become precious later.`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "evidence-preserving romantic performance" };
  }
  if (lens === "mysterious") {
    const frames = [
      `${direct}. Nothing was obviously wrong. That made it worse.`,
      `${direct}. The explanation was missing from the room.`,
      `${direct}. Every fact remained ordinary except for the feeling they created together.`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "evidence-preserving mystery performance" };
  }
  if (lens === "wild") {
    const frames = [
      `${direct}. That would have been enough, if the day had any interest in behaving.`,
      `${direct}. From there, the sensible version of events was clearly outnumbered.`,
      `${direct}. The plan survived. Its dignity did not.`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "evidence-preserving wild performance" };
  }
  const frames = [
    `${direct}. It sounds simple until you notice what the detail is doing.`,
    `${direct}. On paper, that is the whole event. In memory, it rarely is.`,
    `${direct}. The facts are enough; the interesting part is what they leave behind.`,
  ];
  return { text: frames[event.order % frames.length]!, detail: "evidence-preserving narrative performance" };
}

function freshNeutral(event: WorldEvent): { text: string; detail: string } | undefined {
  const s = subject(event); const thing = event.object ?? event.details[0] ?? event.place; const detail = event.details.find((value) => lower(value) !== lower(thing ?? ""));
  if (!s || !event.action) return undefined;
  const frames = [
    `${s} ${event.action}${thing ? ` ${thing}` : ""}. On paper, that was the whole story. ${detail ? `It was ${detail} that gave the moment its edge.` : "The moment had more texture than the facts suggested."}`,
    `${s} ${event.action}${thing ? ` ${thing}` : ""}. Nothing dramatic had to happen; ${detail ? `${detail} was enough to change the feel.` : "the detail was enough to make it stick."}`,
    `${s} ${event.action}${thing ? ` ${thing}` : ""}. Then the small detail arrived and made the ordinary sequence feel less ordinary.`,
  ];
  return { text: frames[event.order % frames.length]!, detail: "narrative framing" };
}

function creativeFrame(lens: CognitiveLens, event: WorldEvent): { text: string; detail: string } | undefined {
  const s = subject(event); const thing = event.object ?? event.place ?? event.details[0];
  if (!s) return undefined;
  if (lens === "comedy") {
    const frames = [
      `${s} ${event.action ?? "showed up"}${thing ? ` with ${thing}` : ""}, carrying the energy of someone already preparing a defense`,
      `${s} ${event.action ?? "showed up"}${thing ? ` with ${thing}` : ""}. Somewhere, common sense quietly left the building.`,
      `${s} ${event.action ?? "showed up"}${thing ? ` with ${thing}` : ""}, apparently unconcerned that this was becoming the part everyone would remember`,
      `${s} ${event.action ?? "showed up"}${thing ? ` with ${thing}` : ""}. A perfectly normal plan had just developed a personality problem.`,
      `${s} ${event.action ?? "showed up"}${thing ? ` with ${thing}` : ""}; the situation had officially become more ambitious than necessary`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "comedic personification/contrast" };
  }
  if (lens === "horror") {
    const frames = [
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. The familiar suddenly felt slightly wrong.`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. Nothing announced the danger; the atmosphere did it quietly.`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, while the ordinary details started behaving like clues`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. The silence after it did more work than the event itself.`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}; the room still looked ordinary, which was precisely the problem`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "horror atmosphere framing" };
  }
  if (lens === "romance") {
    const frames = [
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, and the detail carried more history than it first appeared to`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. Small on the clock, larger in the memory.`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}; the kind of detail time knows how to make precious`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, giving the moment a little more weight than the clock could explain`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. Some moments become important only after you have lived past them.`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "romantic significance framing" };
  }
  if (lens === "mysterious") {
    const frames = [
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, leaving one detail that refused to explain itself`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. Nothing was obviously wrong; that was what made it feel wrong.`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}; the facts were ordinary enough, which made the strange part worse`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, and suddenly the smallest detail had the loudest voice`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. The explanation stayed one step behind the evidence.`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "mystery emphasis framing" };
  }
  if (lens === "wild") {
    const frames = [
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, and the whole thing picked up momentum fast`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. That would have been the end of it, if the day had any interest in behaving.`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}; the plan survived, but it did not stay quiet`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}, with the kind of momentum that makes a normal day difficult to recover`,
      `${s} ${event.action ?? "was there"}${thing ? ` with ${thing}` : ""}. Somewhere between sensible and ridiculous, the day changed lanes.`,
    ];
    return { text: frames[event.order % frames.length]!, detail: "high-energy escalation framing" };
  }
  return freshNeutral(event);
}

function universalMoves(event: WorldEvent, world: WorldModel, previous?: WorldEvent, next?: WorldEvent): Array<{ text: string; detail: string }> {
  const s = subject(event); const thing = event.object ?? event.details[0] ?? event.place; const priorThing = previous?.object ?? previous?.details[0] ?? previous?.place; const nextThing = next?.object ?? next?.details[0] ?? next?.place;
  const moves: Array<{ text: string; detail: string }> = [];
  if (thing && event.action) moves.push({ text: `${s} ${event.action} ${thing}, and that detail gave the moment its texture`, detail: "specificity spotlight" });
  if (previous && thing && event.action) moves.push({ text: `After ${priorThing ?? "that"}, ${s} ${event.action} ${thing}; the story had a new direction`, detail: "causal consequence" });
  if (nextThing && event.action) moves.push({ text: `${s} ${event.action}${thing ? ` ${thing}` : ""}, with ${nextThing} still waiting on the other side of the moment`, detail: "anticipatory tension" });
  if (event.details.length >= 2) moves.push({ text: `${s} ${event.action ?? "carried on"}; ${event.details[0]} was the detail you could miss, while ${event.details[1]} was the one that changed the feel`, detail: "contrast between details" });
  if (world.events.length >= 3 && event.order === Math.floor(world.events.length / 2)) moves.push({ text: `${s} ${event.action ?? "was there"}${thing ? ` ${thing}` : ""}; this was the point where the ordinary sequence started to feel like a story`, detail: "midpoint escalation" });
  return moves;
}

function candidatesFor(event: WorldEvent, world: WorldModel, previous?: WorldEvent, next?: WorldEvent): Array<{ text: string; creativeDetails: string[] }> {
  const s = subject(event); const out: Array<{ text: string; creativeDetails: string[] }> = []; const direct = clean(event.raw);
  out.push({ text: direct, creativeDetails: [] });
  const compact = rhythm(event); if (compact && lower(compact) !== lower(direct)) out.push({ text: compact, creativeDetails: [] });
  if (s && event.action && event.object) out.push({ text: `${s} ${event.action} ${event.object}${[event.place ? `at ${event.place}` : "", event.time ? `at ${event.time}` : ""].filter(Boolean).join(" ") ? ` ${[event.place ? `at ${event.place}` : "", event.time ? `at ${event.time}` : ""].filter(Boolean).join(" ")}` : ""}`, creativeDetails: [] });
  const performance = directPerformance(event, world.lens);
  out.push({ text: performance.text, creativeDetails: [performance.detail] });
  for (const move of universalMoves(event, world, previous, next)) out.push({ text: move.text, creativeDetails: [move.detail] });
  if (previous && event.order > 0) out.push({ text: `After ${clean(previous.object ?? previous.place ?? previous.action ?? previous.raw)}, ${direct.toLowerCase()}`, creativeDetails: ["causal transition from adjacent event"] });
  if (next && event.order < world.events.length - 1 && event.action) out.push({ text: `${direct}; then ${lower(next.object ?? next.place ?? next.action ?? next.raw)} was still to come`, creativeDetails: ["anticipatory transition from adjacent event"] });
  const frame = creativeFrame(world.lens, event); if (frame) out.push({ text: frame.text, creativeDetails: [frame.detail] });
  return out.filter((item, index, values) => index === values.findIndex((candidate) => lower(candidate.text) === lower(item.text)));
}

export function generateCandidates(world: WorldModel, significance: SignificanceResult, preferences: string[] = [], accepted: string[] = [], rejected: string[] = []): CreativeCandidate[] {
  const result: CreativeCandidate[] = []; const prior: string[] = [];
  for (const event of world.events) {
    const previous = world.events[event.order - 1]; const next = world.events[event.order + 1];
    for (const candidate of candidatesFor(event, world, previous, next)) {
      const evidenceCoverage = coverage(candidate.text, event); const candidateNovelty = novelty(candidate.text, prior);
      const causalFit = previous && candidate.text.toLowerCase().includes(lower(previous.object ?? previous.place ?? previous.action ?? previous.raw)) ? 1 : event.order === 0 ? 0.95 : 0.82;
      const attention = Math.min(1.5, (significance.scores.get(event.id) ?? 1) / 10);
      const creativity = Math.min(10, Math.max(0, candidate.creativeDetails.length * 2.5 + candidate.text.length / 30));
      const bias = learnedBias(candidate.text, preferences, accepted, rejected); const rawPenalty = lower(candidate.text) === lower(event.raw) ? -10 : 0;
      const protectedScore = evidenceCoverage >= 1 ? 42 : -90;
      const score = protectedScore + evidenceCoverage * 38 + candidateNovelty * 18 + causalFit * 12 + attention * 10 + creativity * 2 + bias + rawPenalty;
      result.push({ eventId: event.id, text: candidate.text, lens: world.lens, creativity, evidenceCoverage, novelty: candidateNovelty, causalFit, attention, score, creativeDetails: candidate.creativeDetails });
      prior.push(candidate.text);
    }
  }
  return result;
}

export function selectCreativeSequence(world: WorldModel, candidates: CreativeCandidate[]): CreativeCandidate[] {
  const selected: CreativeCandidate[] = []; const usedEvents = new Set<string>();
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score)) { if (usedEvents.has(candidate.eventId)) continue; selected.push(candidate); usedEvents.add(candidate.eventId); }
  return world.events.map((event) => selected.find((candidate) => candidate.eventId === event.id) ?? candidates.find((candidate) => candidate.eventId === event.id)).filter(Boolean) as CreativeCandidate[];
}
