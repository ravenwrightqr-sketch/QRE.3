import type { RealityGraph, RealityRelation } from "@qre/contracts";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";

function graph(
  labels: string[],
  relations: Array<[number, number, RealityRelation["kind"], number]>,
): RealityGraph {
  return {
    evidence: labels.map((text, index) => ({
      id: `evidence-${index + 1}`,
      text,
      kind: "fact",
    })),
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
      kind,
      strength,
    })),
    unresolvedTensions: [],
    recurringSignals: [],
    sensorySignals: [],
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateCandidates(
  name: string,
  reality: RealityGraph,
  candidates: ReturnType<typeof searchUniversalMovieCandidates>,
): void {
  assert(
    candidates.length >= 2,
    `${name}: expected multiple movie hypotheses`,
  );

  const eventIds = new Set(reality.events.map((event) => event.id));
  const keys = new Set<string>();

  for (const candidate of candidates) {
    assert(
      candidate.truthRisk < 0.8,
      `${name}: excessive truth risk`,
    );

    assert(
      candidate.trajectory.length >= 2,
      `${name}: trajectory too shallow`,
    );

    assert(
      candidate.payoff.length > 0,
      `${name}: missing payoff`,
    );

    for (const step of candidate.trajectory) {
      for (const id of step.eventIds) {
        assert(
          eventIds.has(id),
          `${name}: invented event id ${id}`,
        );
      }
    }

    const key = candidate.trajectory
      .flatMap((step) => step.eventIds)
      .join(">");

    keys.add(key);

    assert(
      candidate.lens === "NONE",
      `${name}: universal discovery must remain lens-blind`,
    );
  }

  assert(
    keys.size >= 2,
    `${name}: candidates are not materially distinct`,
  );
}

const coco = graph(
  [
    "hates bows",
    "loves treats",
    "scared at first",
    "happy after",
    "grooming visit",
    "pink bow",
  ],
  [
    [0, 3, "recontextualizes", 0.82],
    [1, 3, "recontextualizes", 0.82],
    [2, 3, "recontextualizes", 0.82],
    [2, 4, "changes", 0.55],
    [4, 3, "recontextualizes", 0.82],
    [3, 5, "recontextualizes", 0.82],
    [0, 5, "contrasts", 0.9],
  ],
);

const mikeJoe = graph(
  [
    "Mike met Joe",
    "they talked",
    "restaurant closing",
    "they kept talking",
    "something began",
  ],
  [
    [0, 1, "converges", 0.78],
    [1, 2, "before", 0.9],
    [2, 3, "contrasts", 0.72],
    [1, 3, "recontextualizes", 0.8],
    [3, 4, "changes", 0.86],
    [0, 4, "recontextualizes", 0.8],
  ],
);

const house = graph(
  [
    "red door",
    "family gathered",
    "quiet street",
    "ordinary Friday",
    "what came next",
  ],
  [
    [0, 1, "converges", 0.76],
    [1, 2, "recontextualizes", 0.71],
    [2, 3, "contrasts", 0.82],
    [3, 4, "changes", 0.88],
    [0, 4, "recontextualizes", 0.84],
  ],
);

const cases = [
  ["Coco", coco],
  ["Mike-Joe", mikeJoe],
  ["House", house],
] as const;

for (const [name, reality] of cases) {
  const candidates = searchUniversalMovieCandidates({
    graph: reality,
    limit: 8,
  });

  validateCandidates(name, reality, candidates);
}

const mikeJoeCandidates = searchUniversalMovieCandidates({
  graph: mikeJoe,
  limit: 8,
});

assert(
  mikeJoeCandidates.length >= 2,
  "same-reality discovery failed to produce multiple hypotheses",
);

const trajectoryKeys = mikeJoeCandidates.map((candidate) =>
  candidate.trajectory
    .map((step) => `${step.operation}:${step.eventIds.join(",")}`)
    .join("|"),
);

assert(
  new Set(trajectoryKeys).size >= 2,
  "same reality did not yield materially distinct movie hypotheses",
);

const relationSignatures = mikeJoeCandidates.map((candidate) =>
  candidate.supportingRelationKinds.join("|"),
);

assert(
  new Set(relationSignatures).size >= 2 ||
    new Set(trajectoryKeys).size >= 3,
  "same reality did not yield structurally diverse movie hypotheses",
);

assert(
  mikeJoeCandidates.every((candidate) => candidate.lens === "NONE"),
  "universal movie discovery leaked lens state into candidate generation",
);

console.log("AUTHOR UNIVERSAL MOVIE SEARCH ACCEPTANCE: PASS");
console.log(`Cases=${cases.length}`);
console.log(`MikeJoeCandidates=${mikeJoeCandidates.length}`);
console.log(
  `DistinctTrajectories=${new Set(trajectoryKeys).size}`,
);
console.log(
  `DistinctRelationSignatures=${new Set(relationSignatures).size}`,
);
console.log("DISCOVERY_IS_LENS_BLIND=TRUE");
console.log("MULTIPLE_MOVIE_HYPOTHESES=TRUE");
console.log("REALITY_TO_MOVIE_ONLY=TRUE");