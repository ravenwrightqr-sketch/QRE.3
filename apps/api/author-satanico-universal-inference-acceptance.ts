import type { RealityGraph } from "@qre/contracts";
import { discoverSatanicoInferenceOpportunities } from "./src/services/authorSatanicoEvidenceSearch.js";

function fail(message: string): never {
  throw new Error(`SATANICO UNIVERSAL INFERENCE ACCEPTANCE FAILED: ${message}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message);
}

function graph(
  labels: string[],
  relations: Array<[number, number, string, number]>,
  structure: Array<{
    eventId: number;
    subjects?: string[];
    actions?: string[];
    objects?: string[];
    states?: string[];
    semanticTags?: string[];
    recurrenceScore?: number;
    transitionScore?: number;
    anomalyScore?: number;
    salienceScore?: number;
  }>,
  entityContinuity: Array<{ name: string; eventIds: number[]; kind?: "person" | "animal" | "object" | "place" | "organization" | "event" | "unknown"; salienceScore?: number }>,
): RealityGraph {
  return {
    evidence: labels.map((text, index) => ({ id: `evidence-${index + 1}`, text, kind: "fact" })),
    events: labels.map((label, index) => ({
      id: `event-${index + 1}`,
      label,
      sourceIds: [`evidence-${index + 1}`],
      entities: label.split(/\s+/).slice(0, 4),
      salient: true,
      provenance: "explicit",
    })),
    relations: relations.map(([from, to, kind, strength]) => ({
      from: `event-${from + 1}`,
      to: `event-${to + 1}`,
      kind: kind as RealityGraph["relations"][number]["kind"],
      strength,
    })),
    eventStructure: structure.map((item) => ({
      eventId: `event-${item.eventId + 1}`,
      subjects: item.subjects ?? [],
      actions: item.actions ?? [],
      objects: item.objects ?? [],
      states: item.states ?? [],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: item.semanticTags ?? [],
      recurrenceScore: item.recurrenceScore ?? 0,
      transitionScore: item.transitionScore ?? 0,
      anomalyScore: item.anomalyScore ?? 0,
      salienceScore: item.salienceScore ?? 1,
    })),
    entityContinuity: entityContinuity.map((entity) => ({
      name: entity.name,
      mentionCount: entity.eventIds.length,
      eventIds: entity.eventIds.map((id) => `event-${id + 1}`),
      firstEventId: `event-${entity.eventIds[0]! + 1}`,
      lastEventId: `event-${entity.eventIds[entity.eventIds.length - 1]! + 1}`,
      kind: entity.kind ?? "unknown",
      salienceScore: entity.salienceScore ?? 0.8,
    })),
    patterns: [],
    unresolvedTensions: [],
    recurringSignals: [],
    sensorySignals: [],
  };
}

const roleGraph = graph(
  [
    "Fido watched the front door",
    "Fido followed the same leash",
    "Fido waited beside the small dogs",
    "Fido returned to the same leash after the walk",
  ],
  [
    [0, 1, "repeats", 0.82],
    [1, 2, "converges", 0.76],
    [2, 3, "recontextualizes", 0.86],
    [0, 3, "repeats", 0.8],
  ],
  [
    { eventId: 0, subjects: ["fido"], actions: ["watched"], objects: ["front door"], semanticTags: ["waiting"] },
    { eventId: 1, subjects: ["fido"], actions: ["followed"], objects: ["leash"], semanticTags: ["continuity"] },
    { eventId: 2, subjects: ["fido"], actions: ["waited"], objects: ["small dogs"], semanticTags: ["social"] },
    { eventId: 3, subjects: ["fido"], actions: ["returned"], objects: ["leash"], semanticTags: ["return"], recurrenceScore: 0.9 },
  ],
  [{ name: "Fido", eventIds: [0, 1, 2, 3], kind: "animal", salienceScore: 0.95 }],
);

const heterogeneousGraph = graph(
  [
    "the old photograph stayed in the drawer",
    "the business changed owners",
    "the same photograph was framed for the reopening",
    "the first customer returned to the new shop",
  ],
  [
    [0, 2, "recontextualizes", 0.9],
    [1, 2, "changes", 0.84],
    [2, 3, "converges", 0.79],
    [0, 3, "recontextualizes", 0.77],
  ],
  [
    { eventId: 0, objects: ["photograph", "drawer"], semanticTags: ["preservation", "memory"], salienceScore: 0.92 },
    { eventId: 1, actions: ["changed"], objects: ["owners"], semanticTags: ["transition"], transitionScore: 0.9, salienceScore: 0.9 },
    { eventId: 2, actions: ["framed"], objects: ["photograph"], semanticTags: ["return", "display"], recurrenceScore: 0.88, salienceScore: 0.95 },
    { eventId: 3, actions: ["returned"], objects: ["shop"], semanticTags: ["return", "continuity"], salienceScore: 0.86 },
  ],
  [{ name: "photograph", eventIds: [0, 2], kind: "object", salienceScore: 0.9 }],
);

const roleOpportunities = discoverSatanicoInferenceOpportunities(roleGraph, 64);
assert(roleOpportunities.some((item) => item.kind === "relational_role" && item.score >= 0.5), "relational role opportunity missing");
assert(roleOpportunities.some((item) => item.kind === "callback" || item.kind === "heterogeneous_convergence"), "role graph lacks secondary inference structure");

const heterogeneousOpportunities = discoverSatanicoInferenceOpportunities(heterogeneousGraph, 64);
assert(heterogeneousOpportunities.some((item) => item.kind === "heterogeneous_convergence" && item.ids.length >= 3), "heterogeneous convergence opportunity missing");
assert(heterogeneousOpportunities.some((item) => item.kind === "invariant" || item.kind === "callback"), "heterogeneous graph lacks relational persistence/callback structure");

console.log("SATANICO UNIVERSAL INFERENCE ACCEPTANCE · PASS");
console.log(`relationalRole=${roleOpportunities.find((item) => item.kind === "relational_role")?.score ?? 0}`);
console.log(`heterogeneousConvergence=${heterogeneousOpportunities.find((item) => item.kind === "heterogeneous_convergence")?.score ?? 0}`);
console.log(`roleOpportunityCount=${roleOpportunities.length}`);
console.log(`heterogeneousOpportunityCount=${heterogeneousOpportunities.length}`);
