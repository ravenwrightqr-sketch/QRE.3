/**
 * QRE LATENT STORY THESIS · UNIVERSAL DISCOVERY EXTRACTOR
 *
 * Converts an already-selected LatentMovieCandidate into a compact semantic
 * thesis that downstream layers can preserve without inventing a second movie.
 *
 * The thesis is structural cognition, not prose generation.
 *
 * Rules:
 *   - payoff is not a semantic turn
 *   - the carrier must participate in the selected turn
 *   - sealing evidence should occur after the turn when possible
 *   - counterfactual dependency measures path dependence, not graph density
 *   - when graph edges are too sparse, supplied sequence language may still
 *     establish a semantic interpretation; that interpretation is not a fact
 *     and never becomes reality merely because cognition derives it
 *   - observer experience is an instruction for realization, never viewer prose
 *
 * This module is domain-neutral. No example, industry, object, or entity type
 * is special-cased here.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
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

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function eventLabel(graph: RealityGraph, id: string): string {
  return graph.events.find((event) => event.id === id)?.label ?? "";
}

function endpointId(candidate: LatentMovieCandidate): string {
  const lastStep = candidate.trajectory[candidate.trajectory.length - 1];
  const ids = lastStep?.eventIds ?? [];
  return ids[ids.length - 1] ?? "";
}

function relationBetween(
  graph: RealityGraph,
  from: string,
  to: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === from && relation.to === to) ||
        (relation.from === to && relation.to === from),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function relationPriority(kind: RealityRelation["kind"]): number {
  switch (kind) {
    case "contrasts":
      return 1;
    case "recontextualizes":
      return 0.95;
    case "changes":
      return 0.85;
    case "repeats":
      return 0.8;
    case "converges":
      return 0.7;
    case "before":
    case "after":
      return 0.65;
    case "involves":
      return 0.5;
    default:
      return 0.4;
  }
}

type StructuralTurn = {
  step: LatentMovieTrajectoryStep;
  index: number;
  relation?: RealityRelation;
  interpretation?: string;
};

function meaningfulTurnSteps(
  candidate: LatentMovieCandidate,
): Array<{ step: LatentMovieTrajectoryStep; index: number }> {
  return candidate.trajectory
    .map((step, index) => ({ step, index }))
    .filter(
      ({ step }) =>
        step.operation !== "establish" &&
        step.operation !== "payoff" &&
        step.eventIds.length >= 2,
    );
}

function interpretationScore(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretation: CreativeInterpretation,
): number {
  const trajectoryIds = unique(
    candidate.trajectory.flatMap((step) => step.eventIds),
  );
  const trajectoryIndex = new Map(
    trajectoryIds.map((id, index) => [id, index]),
  );

  const supported = interpretation.evidenceEventIds.filter((id) =>
    trajectoryIndex.has(id),
  ).length;
  const coverage =
    interpretation.evidenceEventIds.length > 0
      ? supported / interpretation.evidenceEventIds.length
      : 0;

  const positions = interpretation.evidenceEventIds
    .map((id) => trajectoryIndex.get(id))
    .filter((value): value is number => value !== undefined);
  const spread =
    positions.length >= 2 && trajectoryIds.length >= 2
      ? (Math.max(...positions) - Math.min(...positions)) /
        Math.max(1, trajectoryIds.length - 1)
      : 0;

  const endpoint = endpointId(candidate);
  const endpointSupport = endpoint &&
    interpretation.evidenceEventIds.includes(endpoint)
    ? 1
    : 0;

  const firstLabel = interpretation.evidenceEventIds[0]
    ? eventLabel(graph, interpretation.evidenceEventIds[0])
    : "";
  const lastLabel = interpretation.evidenceEventIds[
    interpretation.evidenceEventIds.length - 1
  ]
    ? eventLabel(
        graph,
        interpretation.evidenceEventIds[
          interpretation.evidenceEventIds.length - 1
        ],
      )
    : "";
  const sequenceCarry = firstLabel && lastLabel
    ? metric(1 - Math.min(1, Math.abs(
        trajectoryIds.indexOf(interpretation.evidenceEventIds[0] ?? "") -
        trajectoryIds.indexOf(
          interpretation.evidenceEventIds[
            interpretation.evidenceEventIds.length - 1
          ] ?? "",
        ),
      ) / Math.max(1, trajectoryIds.length)))
    : 0;

  const mechanismPriority: Record<CreativeInterpretation["mechanism"], number> = {
    contrast: 1,
    expectation_shift: 0.96,
    convergence: 0.92,
    consequence: 0.9,
    recurrence: 0.88,
    state_change: 0.84,
    continuation: 0.8,
  };

  return metric(
    interpretation.confidence * 0.35 +
      coverage * 0.2 +
      spread * 0.18 +
      endpointSupport * 0.12 +
      sequenceCarry * 0.05 +
      mechanismPriority[interpretation.mechanism] * 0.1,
  );
}

function selectCreativeInterpretation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretations: readonly CreativeInterpretation[],
): CreativeInterpretation | undefined {
  return interpretations
    .map((interpretation, index) => ({
      interpretation,
      index,
      score: interpretationScore(graph, candidate, interpretation),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.interpretation.confidence - left.interpretation.confidence ||
        right.interpretation.evidenceEventIds.length -
          left.interpretation.evidenceEventIds.length ||
        left.index - right.index,
    )[0]?.interpretation;
}

function strongestStructuralTurn(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): StructuralTurn | undefined {
  const sequenceInterpretations =
    deriveSequenceBackedCreativeInterpretations(
      graph,
      candidate,
    );

  const sequenceInterpretation = selectCreativeInterpretation(
    graph,
    candidate,
    sequenceInterpretations,
  );

  const sequenceInterpretationScore =
    sequenceInterpretation
      ? interpretationScore(graph, candidate, sequenceInterpretation)
      : 0;

  const explicit = meaningfulTurnSteps(candidate)
    .map(({ step, index }) => {
      const relation = relationBetween(
        graph,
        step.eventIds[0] ?? "",
        step.eventIds[1] ?? "",
      );
      return relation
        ? {
            step,
            index,
            relation,
            score:
              relation.strength * 0.75 +
              relationPriority(relation.kind) * 0.25,
          }
        : undefined;
    })
    .filter(
      (
        value,
      ): value is {
        step: LatentMovieTrajectoryStep;
        index: number;
        relation: RealityRelation;
        score: number;
      } => Boolean(value),
    )
    .sort((a, b) => b.score - a.score);

  const bestExplicit = explicit[0];

  if (
    sequenceInterpretation &&
    (
      !bestExplicit ||
      sequenceInterpretationScore >= bestExplicit.score + 0.08
    )
  ) {
    return {
      step: {
        order: 2,
        operation:
          sequenceInterpretation.mechanism === "contrast"
            ? "contrast"
            : sequenceInterpretation.mechanism === "recurrence"
              ? "recur"
              : sequenceInterpretation.mechanism === "convergence"
                ? "converge"
                : sequenceInterpretation.mechanism === "expectation_shift"
                  ? "reframe"
                  : sequenceInterpretation.mechanism === "state_change"
                    ? "reveal"
                    : "consequence",
        eventIds: sequenceInterpretation.evidenceEventIds,
        viewerChange: sequenceInterpretation.statement,
        nextQuestion: "What does this newly meaningful relationship make possible next?",
      },
      index: 1,
      interpretation: sequenceInterpretation.statement,
    };
  }

  if (bestExplicit) {
    return bestExplicit;
  }

  const endpoint = endpointId(candidate);
  const support = unique(
    candidate.trajectory.flatMap((step) => step.eventIds),
  ).filter((id) => id !== endpoint);

  const fallback: Array<{
    from: string;
    to: string;
    relation: RealityRelation;
  }> = [];

  for (let index = 0; index < support.length; index += 1) {
    for (let next = index + 1; next < support.length; next += 1) {
      const relation = relationBetween(
        graph,
        support[index],
        support[next],
      );
      if (relation) {
        fallback.push({
          from: support[index],
          to: support[next],
          relation,
        });
      }
    }
  }

  const best = fallback.sort((a, b) => {
    const aScore =
      a.relation.strength * 0.75 +
      relationPriority(a.relation.kind) * 0.25;
    const bScore =
      b.relation.strength * 0.75 +
      relationPriority(b.relation.kind) * 0.25;
    return bScore - aScore;
  })[0];

  if (best) {
    const synthetic: LatentMovieTrajectoryStep = {
      order: 2,
      operation:
        best.relation.kind === "contrasts"
          ? "contrast"
          : best.relation.kind === "recontextualizes"
            ? "reframe"
            : best.relation.kind === "repeats"
              ? "recur"
              : best.relation.kind === "converges"
                ? "converge"
                : best.relation.kind === "changes"
                  ? "reveal"
                  : "consequence",
      eventIds: [best.from, best.to],
      viewerChange: `${best.relation.kind}: ${eventLabel(graph, best.from)} -> ${eventLabel(graph, best.to)}.`,
      nextQuestion: "What later supplied evidence makes this change matter?",
    };

    return {
      step: synthetic,
      index: 1,
      relation: best.relation,
    };
  }

  return undefined;
}

function buildInitialReading(
  candidate: LatentMovieCandidate,
): string {
  const first = candidate.trajectory.find(
    (step) => step.operation === "establish",
  );

  return clean(
    first?.viewerChange ||
      candidate.evidence[0] ||
      "The supplied evidence establishes an initial state.",
  );
}

function buildSemanticTurn(
  graph: RealityGraph,
  turn: StructuralTurn | undefined,
): string {
  if (!turn) return "";

  if (turn.interpretation) {
    return clean(turn.interpretation);
  }

  if (!turn.relation) return "";

  const from = eventLabel(
    graph,
    turn.step.eventIds[0] ?? "",
  );
  const to = eventLabel(
    graph,
    turn.step.eventIds[1] ?? "",
  );

  if (!from || !to) return "";

  return clean(
    `The reading changes through ${turn.relation.kind}: ${from} -> ${to}.`,
  );
}

function buildObserverExperienceObjective(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  turn: StructuralTurn | undefined,
): ObserverExperienceObjective | undefined {
  if (!turn?.interpretation) return undefined;

  const endpoint = endpointId(candidate);
  const mechanism = turn.step.operation;
  const semanticTurn = clean(turn.interpretation);
  const endpointLabel = endpoint ? eventLabel(graph, endpoint) : "the supplied ending";

  switch (mechanism) {
    case "reframe":
      return {
        objective: `Let the observer first accept the supplied reality, then discover that ${semanticTurn.toLowerCase()}`,
        surprise: "The meaningful change should arrive as a reinterpretation, not as a new event.",
        curiosity: "What changed even though the world itself did not?"," +
        attention: ["establish the ordinary", "introduce a small discrepancy", "withhold the explanation", "let supplied evidence recontextualize what came before", "land on the supplied endpoint"],
        landing: `Make the supplied ending ${endpointLabel} feel newly meaningful without explaining why it matters.`,
        explanationForbidden: true,
      };
    case "recur":
      return {
        objective: `Make the observer notice that repetition has become meaning in ${semanticTurn.toLowerCase()}`,
        surprise: "The second occurrence should feel more significant than the first without inventing anything new.",
        curiosity: "Why does this return matter now when it did not before?",
        attention: ["establish the first occurrence", "create distance", "reintroduce the supplied recurring detail", "let recognition arrive", "land"],
        landing: `Let the supplied endpoint ${endpointLabel} carry the accumulated recognition.`,
        explanationForbidden: true,
      };
    case "contrast":
      return {
        objective: `Let the observer hold the supplied material in tension until ${semanticTurn.toLowerCase()} becomes felt rather than stated`,
        surprise: "Reveal the difference between two supplied readings without announcing the contrast.",
        curiosity: "Which reading is the observer supposed to trust now?",
        attention: ["establish one reading", "introduce the conflicting supplied detail", "delay resolution", "recontextualize", "land"],
        landing: `Let the endpoint ${endpointLabel} resolve the tension through experience, not explanation.`,
        explanationForbidden: true,
      };
    case "converge":
      return {
        objective: `Let separate supplied details accumulate until ${semanticTurn.toLowerCase()} becomes obvious in retrospect`,
        surprise: "The realization should emerge from accumulation rather than a narrated conclusion.",
        curiosity: "What are these details quietly pointing toward?",
        attention: ["plant independent details", "leave their relationship unstated", "repeat or deepen the pattern", "allow recognition", "land"],
        landing: `Make ${endpointLabel} feel like the natural consequence of what the observer has already noticed.`,
        explanationForbidden: true,
      };
    case "reveal":
      return {
        objective: `Let the observer experience the shift from supplied action into its newly meaningful state: ${semanticTurn.toLowerCase()}`,
        surprise: "The state should feel discovered through the action rather than announced afterward.",
        curiosity: "What did that action change?",
        attention: ["show the supplied action", "stay with its immediate consequence", "delay naming the state", "let the observer recognize the shift", "land"],
        landing: `Let ${endpointLabel} carry the realized state without a summary sentence.`,
        explanationForbidden: true,
      };
    case "consequence":
      return {
        objective: `Let the observer recognize the consequence of the supplied path: ${semanticTurn.toLowerCase()}`,
        surprise: "The payoff should feel earned by what came before rather than explained by it.",
        curiosity: "What did the earlier moment set in motion?",
        attention: ["establish cause", "move through supplied consequences", "delay interpretation", "let the endpoint answer the question", "land"],
        landing: `Make ${endpointLabel} feel earned by the accumulated path.`,
        explanationForbidden: true,
      };
    default:
      return {
        objective: `Let the observer discover the supplied semantic movement: ${semanticTurn.toLowerCase()}`,
        surprise: "Prefer a small perceptual discovery over a stated explanation.",
        curiosity: "What is becoming newly meaningful here?",
        attention: ["establish", "accumulate", "interrupt expectation", "recontextualize", "land"],
        landing: `Let ${endpointLabel} complete the discovery without stating the thesis.`,
        explanationForbidden: true,
      };
  }
}

export function deriveLatentStoryThesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): LatentStoryThesis {
  const turn = strongestStructuralTurn(
    graph,
    candidate,
  );

  const carrierEventIds = chooseCarrierIds(
    graph,
    turn,
    candidate,
  );

  const sealingEventIds = chooseSealingIds(
    graph,
    turn,
    carrierEventIds,
    candidate,
  ).filter(
    (id) => !carrierEventIds.includes(id),
  );

  const turnFromId = turn?.step.eventIds[0] ?? "";
  const turnToId = turn?.step.eventIds[1] ?? "";

  const beforeMeaning = turnFromId
    ? [eventLabel(graph, turnFromId)].filter(Boolean)
    : [];

  const afterMeaning = turnToId
    ? [eventLabel(graph, turnToId)].filter(Boolean)
    : [];

  return {
    initialReading: buildInitialReading(candidate),
    semanticTurn: buildSemanticTurn(graph, turn),
    beforeMeaning,
    afterMeaning,
    beforeEventIds: turnFromId ? [turnFromId] : [],
    afterEventIds: turnToId ? [turnToId] : [],
    relationKind: turn?.relation?.kind,
    carrierEventIds,
    sealingEventIds,
    payoffDependency: buildPayoffDependency(
      graph,
      candidate,
      carrierEventIds,
    ),
    counterfactualDependency: counterfactualDependency(
      graph,
      candidate,
      turn,
      carrierEventIds,
    ),
    observerExperience: buildObserverExperienceObjective(
      graph,
      candidate,
      turn,
    ),
  };
}
