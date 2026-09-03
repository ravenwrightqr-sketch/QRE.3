import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { deriveLatentStoryThesis } from "./src/services/authorLatentStoryThesis.js";

function assert(name: string, condition: boolean): void {
  if (!condition) throw new Error(`UNIVERSAL DISCOVERY ACCEPTANCE FAILED: ${name}`);
  console.log(`PASS: ${name}`);
}

function candidate(ids: string[], relationKind: string): LatentMovieCandidate {
  return {
    id: "universal-role-test",
    lens: "NONE",
    anchorEventIds: [ids[0]!, ids[ids.length - 1]!],
    supportingRelationKinds: [relationKind],
    trajectory: ids.map((id, index) => ({
      order: index + 1,
      operation:
        index === 0
          ? "establish"
          : index === ids.length - 1
            ? "payoff"
            : "reveal",
      eventIds: [id],
      viewerChange: `supplied event ${index + 1}`,
      nextQuestion: index === ids.length - 1 ? "" : "What becomes newly meaningful?",
    })),
    payoff: `event ${ids.length}`,
    unresolvedQuestion: "What becomes newly meaningful?",
    evidence: ids.map((id) => `label ${id}`),
    hypothesis: [],
    truthRisk: 0,
    novelty: 1,
    specificity: 1,
    informationValue: 1,
    uncertainty: 0.6,
    attentionPotential: 0.8,
    consequencePotential: 0.8,
    callbackPotential: 0.8,
    compressionPotential: 0.8,
    repetitionRisk: 0,
    distinctiveness: 1,
    score: 1,
  };
}

function graphFor(labels: string[]): RealityGraph {
  const events = labels.map((label, index) => ({
    id: `event-${index + 1}`,
    label,
    sourceIds: [`evidence-${index + 1}`],
    entities: ["Subject"],
    salient: true,
    provenance: "explicit" as const,
  }));

  return {
    evidence: labels.map((text, index) => ({
      id: `evidence-${index + 1}`,
      text,
      kind: "fact" as const,
    })),
    events,
    relations: [
      {
        from: "event-1",
        to: "event-4",
        kind: "recontextualizes",
        strength: 0.94,
      },
    ],
    unresolvedTensions: [],
    recurringSignals: [],
    sensorySignals: [],
  };
}

const domains = [
  ["Subject entered quietly", "A red ticket appeared", "Someone noticed the ticket", "Subject left laughing"],
  ["A shop opened slowly", "One strange receipt remained", "The receipt was set aside", "The shop closed packed"],
  ["The dog arrived wary", "A blue ribbon was found", "The ribbon stayed nearby", "The dog left triumphant"],
  ["Two people met awkwardly", "A coin changed hands", "The coin returned", "They parted smiling"],
];

for (const labels of domains) {
  const graph = graphFor(labels);
  const movie = candidate(graph.events.map((event) => event.id), "recontextualizes");
  const thesis = deriveLatentStoryThesis(graph, movie);
  const semantic = thesis.semanticRealization;

  assert("before role stays isolated from payoff", thesis.beforeEventIds[0] === "event-1");
  assert("after role stays isolated at endpoint", thesis.afterEventIds[0] === "event-4");
  assert(
    "carrier contains only intermediate evidence",
    thesis.carrierEventIds.length === 2 &&
      thesis.carrierEventIds.includes("event-2") &&
      thesis.carrierEventIds.includes("event-3"),
  );
  assert(
    "semantic evidence is disjoint from endpoint",
    Boolean(semantic) &&
      !semantic!.evidenceEventIds.includes("event-4") &&
      semantic!.evidenceEventIds.includes("event-2") &&
      semantic!.evidenceEventIds.includes("event-3"),
  );
  assert(
    "callback carrier is disjoint from before and payoff",
    Boolean(semantic?.callback) &&
      semantic!.callback!.eventIds.every(
        (id) => id !== "event-1" && id !== "event-4",
      ),
  );
}

console.log("UNIVERSAL DISCOVERY ACCEPTANCE GREEN · ROLE-SEALED BEFORE/CARRIER/PAYOFF · DOMAIN-VARIANT INPUTS");
