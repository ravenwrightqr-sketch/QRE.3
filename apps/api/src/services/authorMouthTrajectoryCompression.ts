import type { SequencePlay, SequenceCut } from "@qre/contracts";
import type { MouthSequencePath } from "./authorMouthSequenceBeamSearch.js";

export type CompressedMouthTrajectory = {
  sequence: SequencePlay;
  originalCutCount: number;
  effectiveCutCount: number;
  retainedBeatOrders: number[];
  compressed: boolean;
  compressionReason?: string;
};

/**
 * Project the selected Mouth path back onto the canonical SequencePlay.
 *
 * The Beam owns realization viability. This helper makes that decision visible
 * to the rest of the Author pipeline without creating a second trajectory.
 *
 * The original cut order is preserved so downstream Meaning/Attention logic
 * can map compressed cuts back to the original semantic beat contracts.
 */
export function projectMouthPathToSequence(
  sequence: SequencePlay,
  path: MouthSequencePath,
): CompressedMouthTrajectory {
  const originalCuts = [...sequence.cuts];
  const retainedBeatOrders = path.candidates
    .map((candidate) => candidate.beatOrder)
    .filter((order, index, values) =>
      Number.isFinite(order) && values.indexOf(order) === index,
    )
    .sort((a, b) => a - b);

  if (!retainedBeatOrders.length ||
      retainedBeatOrders.length >= originalCuts.length) {
    return {
      sequence,
      originalCutCount: originalCuts.length,
      effectiveCutCount: originalCuts.length,
      retainedBeatOrders: originalCuts.map((cut) => cut.order),
      compressed: false,
    };
  }

  const keep = new Set(retainedBeatOrders);
  const effectiveCuts = originalCuts.filter((cut) => keep.has(cut.order));

  // Mutate the existing canonical SequencePlay object so every downstream
  // stage keeps the same source-of-truth reference.
  sequence.cuts.splice(
    0,
    sequence.cuts.length,
    ...effectiveCuts,
  );

  return {
    sequence,
    originalCutCount: originalCuts.length,
    effectiveCutCount: effectiveCuts.length,
    retainedBeatOrders,
    compressed: effectiveCuts.length < originalCuts.length,
    compressionReason:
      effectiveCuts.length < originalCuts.length
        ? "one or more planned beats lacked a distinct legal Mouth realization"
        : undefined,
  };
}

/**
 * Resolve the original BeatPlan contract for a compressed SequenceCut.
 * Never use array index as semantic identity after compression.
 */
export function beatForSequenceCut<T extends { order: number }>(
  beats: readonly T[],
  cut: SequenceCut,
): T | undefined {
  return beats.find((beat) => beat.order === cut.order);
}
