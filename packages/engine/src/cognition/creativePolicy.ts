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
const words = (value: string) => lower(value).split(/\W+/).filter((word) => word.length >= 4);

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

function evidenceCoverage(event: WorldEvent): number {
  const anchors = explicitAnchors(event);
  if (!anchors.length) return 1;
  // This is cognition metadata, not a requirement that every fact appear in the final mouth.
  // The actual author may deliberately isolate one charged detail.
  return Math.min(1, anchors.filter(Boolean).length / Math.max(1, Math.min(3, anchors.length)));
}

function novelty(operation: string, priorOperations: string[], usedPhrases: string[]): number {
  const overlap = priorOperations.some((item) => item === operation) ? 0.35 : 0.95;
  const phrasePenalty = usedPhrases.some((phrase) => lower(operation).includes(lower(phrase))) ? 0.12 : 0;
  return Math.max(0, overlap - phrasePenalty);
}

function learnedBias(operation: string, preferences: string[], accepted: string[], rejected: string[]): number {
  const body = lower(operation);
  let score = 0;
  for (const preference of preferences) if (body.includes(lower(preference))) score += 1.2;
  for (const value of accepted) if (body.includes(lower(value))) score += 0.8;
  for (const value of rejected) if (body.includes(lower(value))) score -= 2.5;
  return score;
}

function operationSet(event: WorldEvent, world: WorldModel, significance: SignificanceResult): string[] {
  const operations = new Set<string>();
  const subjectKnown = event.participants.length > 0;
  const hasObject = Boolean(event.object);
  const hasPlace = Boolean(event.place);
  const hasHistory = Boolean(event.resolvedFromMemory);
  const patterns = significance.patterns.map((value) => value.toLowerCase()).join(" ");

  if (subjectKnown) operations.add("subject-gravity");
  if (hasObject) operations.add("detail-isolation");
  if (hasPlace) operations.add("world-expansion");
  if (event.time) operations.add("temporal-contrast");
  if (event.order > 0) operations.add("continuation-pressure");
  if (event.order < world.events.length - 1) operations.add("forward-question");
  if (hasHistory || /history|return|again|callback|repeat/.test(patterns)) operations.add("callback-reframe");
  if (event.details.length >= 2) operations.add("foreground-background");
  if (/change|contrast|shift|difference|inversion/.test(patterns)) operations.add("reversal");
  if (/unusual|surprising|strange|anomaly|odd/.test(patterns)) operations.add("surprise-isolation");
  if (/causal|consequence|escalat|forward/.test(patterns)) operations.add("consequence");
  if (/memory|history|anniversary|return/.test(patterns)) operations.add("meaning-through-history");
  if (world.lens === "comedy") operations.add("comic-reframe");
  if (world.lens === "horror") operations.add("ordinary-to-ominous");
  if (world.lens === "romance") operations.add("tender-understatement");
  if (world.lens === "mysterious") operations.add("withhold-explanation");
  if (world.lens === "wild") operations.add("escalation");

  operations.add("specificity-over-generalization");
  operations.add("compression");
  return [...operations];
}

export function generateCandidates(
  world: WorldModel,
  significance: SignificanceResult,
  preferences: string[] = [],
  accepted: string[] = [],
  rejected: string[] = [],
  usedPhrases: string[] = [],
): CreativeCandidate[] {
  const result: CreativeCandidate[] = [];
  const priorOperations: string[] = [];

  for (const event of world.events) {
    const operations = operationSet(event, world, significance);
    const anchorQuality = evidenceCoverage(event);

    for (const operation of operations) {
      const candidateNovelty = novelty(operation, priorOperations, usedPhrases);
      const attention = Math.min(1.6, 0.55 + ((significance.scores.get(event.id) ?? 1) / 10));
      const creativity = Math.min(10, 5.5 + (operation.includes("reframe") ? 1.5 : 0) + (operation.includes("surprise") ? 1.4 : 0) + (operation.includes("callback") ? 1.2 : 0));
      const learned = learnedBias(operation, preferences, accepted, rejected);
      const score = anchorQuality * 35 + candidateNovelty * 24 + attention * 14 + creativity * 3 + learned;

      result.push({
        eventId: event.id,
        // Candidates are intentionally raw evidence anchors. Creative wording belongs to the universal author.
        text: clean(event.raw),
        lens: world.lens,
        creativity,
        evidenceCoverage: anchorQuality,
        novelty: candidateNovelty,
        causalFit: event.order === 0 ? 0.96 : 0.88,
        attention,
        score,
        creativeDetails: [operation],
      });
      priorOperations.push(operation);
    }
  }

  return result;
}

export function selectCreativeSequence(world: WorldModel, candidates: CreativeCandidate[]): CreativeCandidate[] {
  const chosen: CreativeCandidate[] = [];
  const usedOperations = new Set<string>();

  for (const event of world.events) {
    const options = candidates.filter((candidate) => candidate.eventId === event.id);
    const ranked = [...options].sort((a, b) => {
      const aPenalty = usedOperations.has(a.creativeDetails[0] ?? "") ? 7 : 0;
      const bPenalty = usedOperations.has(b.creativeDetails[0] ?? "") ? 7 : 0;
      return (b.score - bPenalty) - (a.score - aPenalty);
    });
    const best = ranked[0];
    if (!best) continue;
    chosen.push(best);
    for (const operation of best.creativeDetails) usedOperations.add(operation);
  }
  return chosen;
}
