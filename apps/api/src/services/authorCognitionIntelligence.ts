import type { RealityGraph } from "@qre/contracts";

export type AuthorCognitionIntelligence = {
  evidence: {
    eventCount: number;
    relationCount: number;
    mediaCount: number;
    geoCount: number;
    timeCount: number;
    sensoryCount: number;
    entityCount: number;
  };
  semanticSignals: string[];
  candidateMoves: Array<{
    move: "contrast" | "change" | "recurrence" | "convergence" | "consequence" | "recontextualization" | "continuation" | "observation";
    eventIds: string[];
    strength: number;
    reason: string;
  }>;
  compositionRules: string[];
  attention: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function relationMove(kind: string): AuthorCognitionIntelligence["candidateMoves"][number]["move"] {
  switch (kind) {
    case "changes":
    case "state_change": return "change";
    case "repeats": return "recurrence";
    case "contrasts": return "contrast";
    case "converges": return "convergence";
    case "causes": return "consequence";
    case "recontextualizes": return "recontextualization";
    case "before":
    case "after": return "continuation";
    default: return "observation";
  }
}

export function buildAuthorCognitionIntelligence(graph: RealityGraph, returning = false): AuthorCognitionIntelligence {
  const mediaCount = graph.evidence.filter((evidence) => Boolean((evidence as unknown as Record<string, unknown>).mediaId || (evidence as unknown as Record<string, unknown>).media)).length;
  const geoCount = graph.events.filter((event) => Boolean(event.place || (event as unknown as Record<string, unknown>).geo)).length;
  const timeCount = graph.events.filter((event) => Boolean(event.time)).length;
  const sensoryCount = graph.sensorySignals.length;
  const entityCount = unique(graph.events.flatMap((event) => event.entities)).length;

  const candidateMoves = graph.relations
    .map((relation) => ({
      move: relationMove(relation.kind),
      eventIds: unique([relation.from, relation.to]),
      strength: Math.max(0, Math.min(1, relation.strength)),
      reason: clean(relation.label || relation.kind),
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10);

  const semanticSignals = unique([
    graph.relations.length ? `${graph.relations.length} grounded relationship(s) are available for semantic composition.` : "No strong pair relation is required; inspect event-level distinctiveness instead.",
    graph.patterns.length ? `${graph.patterns.length} recurring or structural pattern signal(s) are present.` : "No recurring pattern is established.",
    graph.unresolvedTensions.length ? `${graph.unresolvedTensions.length} unresolved tension signal(s) are present.` : "No explicit unresolved tension is established.",
    sensoryCount ? `${sensoryCount} sensory signal(s) can enrich realization without becoming separate story beats.` : "No sensory signal is available.",
    mediaCount ? `${mediaCount} media evidence item(s) exist and should be treated as additive experience material.` : "No media evidence is present.",
    geoCount ? `${geoCount} event(s) carry place/geo context; place can frame the experience without consuming semantic story capacity.` : "Place/geo is absent from event semantics.",
    timeCount ? `${timeCount} event(s) carry time; chronology is supporting context unless time itself is meaningful.` : "Time is supporting metadata unless explicitly meaningful.",
    returning ? "This is a return: prefer changed meaning, callback, continuation, or contrast over replaying the prior structure." : "This is a first encounter: establish the subject economically, then move toward the strongest unusual or consequential relationship.",
  ]);

  const compositionRules = [
    "The story earns its own length from semantic value. Do not shorten it to accommodate media, geo, timestamps, receipts, or attachments.",
    "Time, geo, and media are additive experience material. They may surround, attach to, or sit between story beats without becoming story beats automatically.",
    "Do not spend a story beat merely stating a timestamp or location unless the supplied reality makes that datum itself meaningful.",
    "Do not convert every event into one sentence. Prefer cross-event meaning, recontextualization, contrast, consequence, recurrence, or another grounded viewer-state change when available.",
    "When relations are sparse, prefer a distinctive observation over a fabricated plot. Sparse reality is allowed to remain sparse.",
    "A lens may intensify a grounded semantic move but may not create the move.",
    returning ? "Use prior experience only to create a new reading, not to repeat the same movie with different adjectives." : "Avoid defaulting to a generic routine, recap, or chronological montage.",
  ];

  const attention = unique([
    "Maximize information density, not minimum word count.",
    "Prefer the supplied detail that changes how an earlier detail is understood.",
    "Preserve strong nouns, distinctive objects, concrete actions, and real relationships as anchors for the Mouth.",
    "Use the end for the strongest landing available in the evidence, not a generic 'done' statement.",
    ...(returning ? ["A return should make the remembered world feel updated, not merely revisited."] : []),
  ]);

  return {
    evidence: { eventCount: graph.events.length, relationCount: graph.relations.length, mediaCount, geoCount, timeCount, sensoryCount, entityCount },
    semanticSignals,
    candidateMoves,
    compositionRules,
    attention,
  };
}
