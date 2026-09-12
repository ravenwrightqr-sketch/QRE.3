import type { AuthorBrainTruth } from "@qre/contracts";
import type { RealityEvidence, RealityEvent, RealityEventStructure, RealityGraph } from "@qre/contracts";

const clean = (v: unknown) => typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
const unique = (xs: string[]) => [...new Set(xs.map(clean).filter(Boolean))];

export function buildAuthorRealityGraph(input: AuthorBrainTruth): RealityGraph {
  const evidence: RealityEvidence[] = [];
  const events: RealityEvent[] = [];
  const add = (text: string, kind: RealityEvidence["kind"], provenance: RealityEvent["provenance"], index: number) => {
    const value = clean(text); if (!value) return;
    const id = `${kind}-${index + 1}`;
    evidence.push({ id, text: value, kind });
    events.push({ id: `event-${id}`, label: value, sourceIds: [id], entities: clean(input.subject) ? [clean(input.subject)] : [], place: clean(input.place) || undefined, salient: true, provenance });
  };
  input.facts.forEach((v, i) => add(v, "fact", "explicit", i));
  input.sourceMoments.forEach((v, i) => add(v, "moment", "explicit", i));
  (input.memoryContext ?? []).forEach((v, i) => add(v, "memory", "memory", i));
  (input.trajectory ?? []).forEach((v, i) => add(v, "trajectory", "explicit", i));
  if (input.prompt) add(input.prompt, "prompt", "prompt", 0);
  const uniqueEvents = events.filter((event, i, arr) => arr.findIndex((e) => e.label.toLowerCase() === event.label.toLowerCase()) === i);
  const structures: RealityEventStructure[] = uniqueEvents.map((event, index) => ({
    eventId: event.id, subjects: event.entities, actions: [], objects: [], states: [], temporalMarkers: [], sensoryMarkers: [], semanticTags: [], recurrenceScore: 0, transitionScore: index ? 0.35 : 0.2, anomalyScore: 0, salienceScore: 1,
  }));
  return { evidence, events: uniqueEvents, relations: [], eventStructure: structures, unresolvedTensions: [], recurringSignals: unique(input.creativeLearningContext ?? []).slice(0, 8), sensorySignals: [] };
}
