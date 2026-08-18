/**
 * QRE MOUTH REALIZATION SLOT · CANONICAL BOUNDARY
 *
 * A realization slot is the smallest creative job the model is allowed to
 * solve. QRE owns the meaning, source evidence, and forbidden moves. The model
 * supplies language only.
 */
import type { MouthCandidateBeat } from "./authorMouthCandidateSearch.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import {
  meaningSpineForBeat,
  type MeaningSpine,
  type MeaningSpineKind,
} from "./authorMeaningSpine.js";

export type RealizationSlot = {
  order: number;
  kind: MeaningSpineKind;
  mode: string;
  sourceEventIds: string[];
  sourceLabels: string[];
  targetLabels: string[];
  relationKinds: string[];
  relationStrength: number;
  inheritedEventIds: string[];
  obligations: string[];
  forbiddenMoves: string[];
  candidateCount: number;
};

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function forbiddenMovesFor(
  slotKind: MeaningSpineKind,
): string[] {
  const base = [
    "new person",
    "new object",
    "new location",
    "new concrete action",
    "new body reaction",
    "new dialogue",
    "new sound",
    "new outcome",
    "new chronology",
    "planner vocabulary",
    "analytic explanation",
  ];

  if (
    slotKind === "contrast" ||
    slotKind === "recontextualize" ||
    slotKind === "callback" ||
    slotKind === "payoff"
  ) {
    base.push(
      "naming the operation instead of performing it",
      "one-sided endpoint repetition",
      "source-keyword collage",
    );
  }

  return base;
}

export function buildRealizationSlots(input: {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  spine: MeaningSpine;
  fast?: boolean;
}): RealizationSlot[] {
  const candidateCount = input.fast ? 3 : 5;

  return [...input.beats]
    .sort((a, b) => a.order - b.order)
    .slice(0, 6)
    .map((beat) => {
      const spineBeat = meaningSpineForBeat(
        input.spine,
        beat.order,
      );

      if (!spineBeat) {
        throw new Error(
          `REALIZATION SLOT INVARIANT FAILED: missing meaning-spine beat ${beat.order}`,
        );
      }

      return {
        order: beat.order,
        kind: spineBeat.kind,
        mode:
          clean(beat.realizationMode) ||
          clean(beat.attentionFunction) ||
          "direct_grounded_realization",
        sourceEventIds:
          unique(spineBeat.sourceEventIds),
        sourceLabels:
          unique(spineBeat.sourceLabels),
        targetLabels:
          unique(spineBeat.targetLabels),
        relationKinds:
          unique(spineBeat.relationKinds),
        relationStrength:
          spineBeat.relationStrength,
        inheritedEventIds:
          unique(spineBeat.inheritedEventIds),
        obligations:
          unique(spineBeat.obligations),
        forbiddenMoves:
          forbiddenMovesFor(
            spineBeat.kind,
          ),
        candidateCount,
      };
    });
}

export function realizationSlotForBeat(
  slots: readonly RealizationSlot[],
  order: number,
): RealizationSlot | undefined {
  return slots.find(
    (slot) => slot.order === order,
  );
}
