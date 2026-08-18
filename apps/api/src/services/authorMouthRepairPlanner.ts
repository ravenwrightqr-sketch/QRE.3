/**
 * QRE MOUTH REPAIR PLANNER · DETERMINISTIC EDITORIAL CONTROL
 *
 * Converts candidate failures into bounded regeneration objectives. It does not
 * rewrite prose and does not invent new facts.
 */
import type { MouthCandidate } from "./authorMouthCandidateSearch.js";
import type { RealizationSlot } from "./authorMouthRealizationSlot.js";

export type MouthRepairObjective = {
  beatOrder: number;
  priority: "critical" | "high" | "medium";
  failures: string[];
  objective: string;
  preserve: string[];
  forbid: string[];
};

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, value)).toFixed(3),
  );

type MouthRepairPriority = MouthRepairObjective["priority"];

const REPAIR_PRIORITY_WEIGHT: Readonly<
  Record<MouthRepairPriority, number>
> = {
  critical: 3,
  high: 2,
  medium: 1,
};

function objectiveFor(
  candidate: MouthCandidate,
  slot: RealizationSlot,
): string {
  if (
    candidate.reasons.includes(
      "non-exact-payoff",
    )
  ) {
    return "Use the supplied endpoint exactly and add nothing before or after it.";
  }

  if (
    candidate.reasons.includes(
      "incomplete-transition-coverage",
    ) ||
    candidate.meaningScore < 0.4
  ) {
    if (slot.kind === "contrast") {
      return "Perform the supplied contrast by preserving enough evidence from both source signals; do not name the contrast.";
    }

    if (
      slot.kind ===
      "recontextualize"
    ) {
      return "Let the later supplied signal change the reading of the earlier signal without introducing a new event.";
    }

    if (slot.kind === "callback") {
      return "Reuse an earlier supplied signal with changed significance.";
    }

    if (slot.kind === "payoff") {
      return "Make the supplied endpoint feel earned by the accumulated evidence; do not invent a new conclusion.";
    }

    return "Perform the approved meaning change rather than describing it.";
  }

  if (
    candidate.reasons.includes(
      "language-quality-gate",
    ) ||
    candidate.reasons.includes(
      "weak-natural-language",
    ) ||
    candidate.reasons.includes(
      "keyword-assembly",
    ) ||
    candidate.reasons.includes(
      "analytic-realization-language",
    )
  ) {
    return "Rewrite as one natural, grammatical viewer-facing thought; remove operation labels and keyword assembly.";
  }

  if (
    candidate.inventionRisk >
    0.45
  ) {
    return "Remove unsupported concrete language while preserving the approved interpretation and supplied anchors.";
  }

  if (
    candidate.compressionScore <
    0.45
  ) {
    return "Compress to the smallest natural line that still performs the approved meaning.";
  }

  return "Strengthen specificity and cumulative meaning without changing supplied reality.";
}

export function buildMouthRepairObjectives(input: {
  candidates: readonly MouthCandidate[];
  slots: readonly RealizationSlot[];
}): MouthRepairObjective[] {
  const slots = new Map(
    input.slots.map((slot) => [
      slot.order,
      slot,
    ]),
  );

  return input.candidates
    .filter(
      (candidate) =>
        candidate.score < 0.3 ||
        candidate.meaningScore < 0.4 ||
        candidate.groundingScore < 0.42 ||
        candidate.inventionRisk > 0.45 ||
        candidate.reasons.length > 0,
    )
    .map(
      (candidate): MouthRepairObjective => {
        const slot = slots.get(
          candidate.beatOrder,
        );

        if (!slot) {
          throw new Error(
            `MOUTH REPAIR INVARIANT FAILED: missing slot ${candidate.beatOrder}`,
          );
        }

        const failures = [
          ...candidate.reasons,
        ];

        const critical =
          candidate.inventionRisk >
            0.55 ||
          candidate.groundingScore <
            0.3 ||
          candidate.reasons.includes(
            "non-exact-payoff",
          ) ||
          candidate.reasons.includes(
            "semantic-contract-invalid",
          );

        const priority: MouthRepairPriority =
          critical
            ? "critical"
            : failures.length >= 2
              ? "high"
              : "medium";

        return {
          beatOrder:
            candidate.beatOrder,
          priority,
          failures,
          objective:
            objectiveFor(
              candidate,
              slot,
            ),
          preserve: [
            ...slot.sourceLabels,
            ...slot.targetLabels,
            ...slot.relationKinds,
          ].filter(Boolean),
          forbid: [
            ...slot.forbiddenMoves,
            ...(
              candidate.reasons.includes(
                "analytic-realization-language",
              )
                ? [
                    "operation labels",
                  ]
                : []
            ),
          ],
        };
      },
    )
    .sort((a, b) =>
      REPAIR_PRIORITY_WEIGHT[
        b.priority
      ] -
        REPAIR_PRIORITY_WEIGHT[
          a.priority
        ] ||
      a.beatOrder -
        b.beatOrder,
    );
}

export function compactRepairInstructions(
  objectives: readonly MouthRepairObjective[],
  limit = 8,
): string[] {
  return objectives
    .slice(0, limit)
    .map(
      (objective) =>
        `Beat ${objective.beatOrder}: ${objective.objective}`,
    );
}
