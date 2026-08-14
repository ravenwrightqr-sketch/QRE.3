import type { WorldModel, WorldEvent } from "./worldModel.js";

export type SignificanceResult = {
  attention: string[];
  changes: string[];
  patterns: string[];
  continuations: string[];
  scores: Map<string, number>;
};

const lower = (value: string) => value.toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];

export function analyzeSignificance(world: WorldModel): SignificanceResult {
  const scores = new Map<string, number>();
  const attention: string[] = [];
  const changes: string[] = [];
  const patterns: string[] = [];
  const continuations: string[] = [];

  for (const event of world.events) {
    let score = 1;
    if (event.participants.length > 1) score += 3;
    if (event.object) score += 2;
    if (event.place) score += 2;
    if (event.time) score += 2;
    if (event.state) score += 2;
    if (event.details.length) score += Math.min(3, event.details.length);
    if (event.resolvedFromMemory) score += 2;
    scores.set(event.id, score);

    const subject = event.participants.join(" and ") || event.object || event.place || "the moment";
    if (event.state || event.action) changes.push(`${subject}: ${event.state ?? event.action ?? "changed"}`);
    if (score >= 5) attention.push(event.id);
  }

  const participantCounts = new Map<string, number>();
  for (const event of world.events) for (const participant of event.participants) participantCounts.set(participant, (participantCounts.get(participant) ?? 0) + 1);
  participantCounts.forEach((count, participant) => { if (count > 1) patterns.push(`${participant} recurs across events`); });

  const placeCounts = new Map<string, number>();
  for (const event of world.events) if (event.place) placeCounts.set(event.place, (placeCounts.get(event.place) ?? 0) + 1);
  placeCounts.forEach((count, place) => { if (count > 1) patterns.push(`${place} recurs across events`); });

  if (world.events.length) continuations.push("new events can extend the existing world");
  if (world.participants.length > 1) continuations.push("shared relationships can accumulate history");
  if (world.places.length) continuations.push("places can acquire recurring memories");
  if (world.entities.length) continuations.push("entities can persist beyond this experience");

  if (/\b(?:back|again|returned|returning)\b/i.test(world.prompt)) changes.push("a return connects the present event to prior history");
  if (world.events.some((event) => /\b(?:until|after|before|later|two weeks|years|every)\b/i.test(event.raw))) changes.push("time changes the meaning or sequence of events");

  return { attention: unique(attention), changes: unique(changes), patterns: unique(patterns), continuations: unique(continuations), scores };
}

export function eventScore(world: WorldModel, event: WorldEvent, significance: SignificanceResult): number {
  return significance.scores.get(event.id) ?? 1 + (world.lens === "neutral" ? 0 : 1);
}
