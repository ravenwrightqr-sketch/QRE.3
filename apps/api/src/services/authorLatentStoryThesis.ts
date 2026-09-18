
import type {
  LatentMovieCandidate,
  LatentSemanticRealization,
  LatentStoryThesis,
  ObserverExperienceObjective,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import {
  deriveSequenceBackedCreativeInterpretations,
  type CreativeInterpretation,
} from "./authorCreativeInterpretation.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function endpointId(candidate: LatentMovieCandidate): string {
  const step = candidate.trajectory[candidate.trajectory.length - 1];
  return step?.eventIds?.[step.eventIds.length - 1] ?? "";
}

function orderedIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function relationBetween(
  graph: RealityGraph,
  left: string,
  right: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === left && relation.to === right) ||
        (relation.from === right && relation.to === left),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function mechanismPriority(kind: CreativeInterpretation["mechanism"]): number {
  switch (kind) {
    case "recurrence":
      return 1;
    case "state_change":
      return 0.99;
    case "contrast":
      return 0.98;
    case "expectation_shift":
      return 0.96;
    case "consequence":
      return 0.9;
    case "convergence":
      return 0.82;
    case "continuation":
      return 0.68;
    default:
      return 0.4;
  }
}

function interpretationEvidenceSpecificity(
  graph: RealityGraph,
  evidenceEventIds: readonly string[],
): number {
  const structures = evidenceEventIds.flatMap((id) => {
    const structure =
      graph.eventStructure?.find((item) => item.eventId === id);

    return structure ? [structure] : [];
  });

  if (!structures.length) {
    return 0;
  }

  const structureScores = structures.map((structure) => {
    const structuralSignals = Math.min(
      1,
      (structure.actions?.length ?? 0) * 0.22 +
        (structure.objects?.length ?? 0) * 0.2 +
        (structure.states?.length ?? 0) * 0.18 +
        (structure.semanticTags?.length ?? 0) * 0.08,
    );

    return Math.min(
      1,
      structuralSignals * 0.58 +
        Number(structure.salienceScore ?? 0) * 0.42,
    );
  });

  return (
    structureScores.reduce((sum, value) => sum + value, 0) /
    Math.max(1, structureScores.length)
  );
}

/**
 * Preserve every meaningful non-structural relationship available inside the
 * selected movie. This is deliberately broader than adjacency: a later fact
 * may become meaningful because it connects back to an earlier fact.
 */
function rankedRelations(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): Array<{ relation: RealityRelation; from: string; to: string }> {
  const ids = orderedIds(candidate);

  const ranked: Array<{
    relation: RealityRelation;
    from: string;
    to: string;
  }> = [];

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      if (!relation) continue;

      if (
        ["before", "after", "involves", "belongs_to"].includes(
          relation.kind,
        )
      ) {
        continue;
      }

      ranked.push({
        relation,
        from: ids[i]!,
        to: ids[j]!,
      });
    }
  }

  const priority = (kind: RealityRelation["kind"]): number => {
    switch (kind) {
      case "recontextualizes":
        return 1;
      case "repeats":
        return 0.98;
      case "contrasts":
        return 0.97;
      case "changes":
        return 0.96;
      case "causes":
        return 0.94;
      case "converges":
        return 0.75;
      default:
        return 0.5;
    }
  };

  return ranked.sort(
    (left, right) =>
      right.relation.strength * 0.72 +
      priority(right.relation.kind) * 0.28 -
      (left.relation.strength * 0.72 +
        priority(left.relation.kind) * 0.28),
  );
}

function interpretationRelationPower(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretation: CreativeInterpretation,
): {
  strongest: number;
  nonAdjacent: number;
  count: number;
} {
  const authority = interpretation.relation;
  if (!authority) {
    return {
      strongest: 0,
      nonAdjacent: 0,
      count: 0,
    };
  }

  const ids = orderedIds(candidate);

  for (const entry of rankedRelations(graph, candidate)) {
    if (
      entry.relation.kind !== authority.kind ||
      entry.relation.from !== authority.fromEventId ||
      entry.relation.to !== authority.toEventId
    ) {
      continue;
    }

    const fromIndex = ids.indexOf(entry.relation.from);
    const toIndex = ids.indexOf(entry.relation.to);

    return {
      strongest: entry.relation.strength,
      nonAdjacent:
        fromIndex >= 0 &&
        toIndex >= 0 &&
        Math.abs(fromIndex - toIndex) > 1
          ? entry.relation.strength
          : 0,
      count: 1,
    };
  }

  return {
    strongest: 0,
    nonAdjacent: 0,
    count: 0,
  };
}

function interpretationScore(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretation: CreativeInterpretation,
): number {
  const ids = orderedIds(candidate);

  const evidence = interpretation.evidenceEventIds.filter((id) =>
    ids.includes(id),
  );

  const coverage = interpretation.evidenceEventIds.length
    ? evidence.length / interpretation.evidenceEventIds.length
    : 0;

  const positions = evidence
    .map((id) => ids.indexOf(id))
    .filter((index) => index >= 0);

  const spread =
    positions.length >= 2
      ? (Math.max(...positions) - Math.min(...positions)) /
        Math.max(1, ids.length - 1)
      : 0;

  const endpoint = endpointId(candidate);
  const endpointSupport =
    endpoint && evidence.includes(endpoint) ? 1 : 0;

  const wholeRealityCoverage = Math.min(
    1,
    evidence.length / Math.max(1, ids.length),
  );

  const relationPower = interpretationRelationPower(
    graph,
    candidate,
    interpretation,
  );

  const mechanism = mechanismPriority(interpretation.mechanism);
  const evidenceSpecificity =
    interpretationEvidenceSpecificity(
      graph,
      evidence,
    );

  /*
   * Rank the grounded semantic structure, not the prose used to describe the
   * candidate internally.
   *
   * A compact two-event idea may still beat a broad interpretation when its
   * confidence, relation power, state shift, contrast, recurrence, or other
   * evidence is genuinely stronger. But an arbitrary pair no longer wins just
   * because its diagnostic sentence contains a familiar concrete noun.
   *
   * Whole-reality coverage matters because many mundane sequences (service
   * work, receipts, routines, profiles, ordinary memories) become interesting
   * only when several supplied details are perceived together.
   */
  return (
    interpretation.confidence * 0.22 +
    mechanism * 0.14 +
    evidenceSpecificity * 0.12 +
    coverage * 0.08 +
    spread * 0.08 +
    endpointSupport * 0.06 +
    wholeRealityCoverage * 0.18 +
    relationPower.strongest * 0.05 +
    relationPower.nonAdjacent * 0.04 +
    Math.min(0.03, evidence.length * 0.006) +
    Math.min(0.02, relationPower.count * 0.005)
  );
}

function strongestInterpretation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretations: readonly CreativeInterpretation[],
): CreativeInterpretation | undefined {
  return [...interpretations]
    .map((interpretation, index) => ({
      interpretation,
      score: interpretationScore(
        graph,
        candidate,
        interpretation,
      ),
      index,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.interpretation.confidence -
          a.interpretation.confidence ||
        b.interpretation.evidenceEventIds.length -
          a.interpretation.evidenceEventIds.length ||
        a.index - b.index,
    )[0]?.interpretation;
}

function strongestRelation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { relation: RealityRelation; from: string; to: string } | undefined {
  return rankedRelations(graph, candidate)[0];
}

function buildInitialReading(candidate: LatentMovieCandidate): string {
  const first = candidate.trajectory.find(
    (step) => step.operation === "establish",
  );

  return clean(first?.viewerChange || candidate.evidence[0]);
}

function buildObserverExperienceObjective(
  interpretation: CreativeInterpretation | undefined,
): ObserverExperienceObjective | undefined {
  if (!interpretation) return undefined;

  const byMechanism: Record<
    string,
    ObserverExperienceObjective
  > = {
    recurrence: {
      objective: interpretation.statement,
      surprise:
        "Let the observer notice that an earlier concrete detail has returned with new importance.",
      curiosity:
        "Make the observer hold the earlier detail in mind without explaining why it matters.",
      attention: [
        "notice the detail",
        "let other supplied material pass",
        "return to the detail",
        "recognize the continuity",
      ],
      landing:
        "Let the recurrence itself create the realization.",
      explanationForbidden: true,
    },

    state_change: {
      objective: interpretation.statement,
      surprise:
        "Let the observer feel the supplied before-and-after difference rather than hear a summary of it.",
      curiosity:
        "Make the observer notice that the subject is no longer where the story began.",
      attention: [
        "establish the starting state",
        "watch the supplied change accumulate",
        "delay the label",
        "recognize the new state",
      ],
      landing:
        "Let the supplied later state answer the earlier state.",
      explanationForbidden: true,
    },

    contrast: {
      objective: interpretation.statement,
      surprise:
        "Hold two supplied readings together until the tension becomes visible.",
      curiosity:
        "Do not resolve the contrast before the supplied evidence earns it.",
      attention: [
        "establish one reading",
        "introduce the contrast",
        "hold both",
        "let recognition resolve it",
      ],
      landing:
        "Let the supplied evidence determine which reading survives.",
      explanationForbidden: true,
    },
  };

  return (
    byMechanism[interpretation.mechanism] ?? {
      objective: interpretation.statement,
      surprise:
        "Let the observer discover the supplied relationship without being told what it means.",
      curiosity:
        "Delay explanation while the supplied evidence accumulates.",
      attention: [
        "establish",
        "accumulate",
        "withhold",
        "recognize",
      ],
      landing:
        "Let the supplied endpoint complete the realization.",
      explanationForbidden: true,
    }
  );
}

function buildSemanticRealization(
  graph: RealityGraph,
  interpretation: CreativeInterpretation | undefined,
  fallbackRelation:
    | {
        relation: RealityRelation;
        from: string;
        to: string;
      }
    | undefined,
): LatentSemanticRealization | undefined {
  if (interpretation) {
    return {
      mechanism: interpretation.mechanism,
      evidenceEventIds: unique(
        interpretation.evidenceEventIds,
      ),
      beforeEventIds: unique(
        interpretation.beforeEventIds,
      ),
      afterEventIds: unique(
        interpretation.afterEventIds,
      ),
      before: clean(interpretation.before),
      after: clean(interpretation.after),
      subject: clean(interpretation.subject),
      callback: interpretation.callback
        ? {
            detail: clean(interpretation.callback.detail),
            eventIds: unique(
              interpretation.callback.eventIds,
            ),
            role: interpretation.callback.role,
          }
        : undefined,
      relation:
        interpretation.relation ??
        (fallbackRelation &&
        interpretation.evidenceEventIds.includes(
          fallbackRelation.from,
        ) &&
        interpretation.evidenceEventIds.includes(
          fallbackRelation.to,
        )
          ? {
              kind: fallbackRelation.relation.kind,
              fromEventId: fallbackRelation.from,
              toEventId: fallbackRelation.to,
            }
          : undefined),
      realizationMove: interpretation.realizationMove,
      creativeOpportunity:
        interpretation.creativeOpportunity,
      feltEffect: interpretation.feltEffect,
      viewerShift: interpretation.viewerShift,
      languageAim: interpretation.languageAim,
      confidence: interpretation.confidence,
    };
  }

  if (!fallbackRelation) return undefined;

  return {
    mechanism:
      fallbackRelation.relation.kind === "repeats"
        ? "recurrence"
        : fallbackRelation.relation.kind === "contrasts"
          ? "contrast"
          : fallbackRelation.relation.kind === "changes"
            ? "state_change"
            : fallbackRelation.relation.kind === "causes"
              ? "consequence"
              : fallbackRelation.relation.kind === "converges"
                ? "convergence"
                : "continuation",

    evidenceEventIds: unique([
      fallbackRelation.from,
      fallbackRelation.to,
    ]),

    beforeEventIds: [fallbackRelation.from],
    afterEventIds: [fallbackRelation.to],

    before: eventLabel(
      graph,
      fallbackRelation.from,
    ),

    after: eventLabel(
      graph,
      fallbackRelation.to,
    ),

    relation: {
      kind: fallbackRelation.relation.kind,
      fromEventId: fallbackRelation.from,
      toEventId: fallbackRelation.to,
    },

    realizationMove:
      fallbackRelation.relation.kind ===
      "recontextualizes"
        ? "recontextualize_callback"
        : fallbackRelation.relation.kind ===
            "contrasts"
          ? "hold_contrast"
          : fallbackRelation.relation.kind ===
              "changes"
            ? "feel_state_transition"
            : "recognize",

    creativeOpportunity:
      fallbackRelation.relation.kind ===
      "recontextualizes"
        ? "callback_recontextualization"
        : fallbackRelation.relation.kind ===
            "contrasts"
          ? "contrast_reframe"
          : fallbackRelation.relation.kind ===
              "changes"
            ? "status_turn"
            : "recognition",

    confidence: Math.min(
      1,
      fallbackRelation.relation.strength,
    ),
  };
}

export function deriveLatentStoryThesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): LatentStoryThesis {
  const interpretations =
    deriveSequenceBackedCreativeInterpretations(
      graph,
      candidate,
    );

  const interpretation = strongestInterpretation(
    graph,
    candidate,
    interpretations,
  );

  const relationCandidates = rankedRelations(
    graph,
    candidate,
  );

  const fallbackRelation =
    relationCandidates[0] ??
    strongestRelation(graph, candidate);

  const endpoint = endpointId(candidate);

  const beforeId =
    interpretation?.beforeEventIds[0] ??
    fallbackRelation?.from ??
    "";

  const afterId =
    interpretation?.afterEventIds[0] ??
    fallbackRelation?.to ??
    endpoint;
    const semanticTurn = "";

  const carrierEventIds = unique([
    ...(interpretation?.evidenceEventIds ?? []),
  ])
    .filter((id) => id !== endpoint)
    .slice(0, 2);

  const sealingEventIds =
    endpoint &&
    endpoint !== beforeId &&
    endpoint !== afterId
      ? [endpoint]
      : afterId && afterId !== beforeId
        ? [afterId]
        : [];

  const payoffDependency = endpoint
    ? interpretation?.statement
      ? `The supplied ending is earned by the grounded relationship expressed in the selected realization, culminating in ${eventLabel(
          graph,
          endpoint,
        )}.`
      : afterId
        ? `The supplied ending depends on the earlier supplied relationship culminating in ${eventLabel(
            graph,
            endpoint,
          )}.`
        : `The supplied ending is ${eventLabel(
            graph,
            endpoint,
          )}.`
    : "";

  return {
    initialReading: buildInitialReading(candidate),

    semanticTurn,

    semanticRealization:
      buildSemanticRealization(
        graph,
        interpretation,
        fallbackRelation,
      ),

    beforeMeaning: beforeId
      ? [eventLabel(graph, beforeId)].filter(Boolean)
      : [],

    afterMeaning: afterId
      ? [eventLabel(graph, afterId)].filter(Boolean)
      : [],

    beforeEventIds: beforeId
      ? [beforeId]
      : [],

    afterEventIds: afterId
      ? [afterId]
      : [],

    relationKind:
      interpretation?.mechanism ??
      (
        fallbackRelation?.relation.kind ===
        "recontextualizes"
          ? "recurrence"
          : fallbackRelation?.relation.kind ===
              "contrasts"
            ? "contrast"
            : fallbackRelation?.relation.kind ===
                "changes"
              ? "state_change"
              : fallbackRelation?.relation.kind ===
                  "causes"
                ? "consequence"
                : fallbackRelation
                  ? "continuation"
                  : undefined
      ),

    carrierEventIds,

    sealingEventIds,

    payoffDependency,

    counterfactualDependency:
      interpretation
        ? Math.min(
            1,
            interpretation.evidenceEventIds
              .length /
              Math.max(
                2,
                orderedIds(candidate).length,
              ),
          )
        : 0,

    observerExperience:
      buildObserverExperienceObjective(
        interpretation,
      ),
  };
}