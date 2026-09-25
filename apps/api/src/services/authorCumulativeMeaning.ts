import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import type { MouthCandidateBeat } from "./authorMouthCandidateSearch.js";

export type CumulativeMeaningState = {
  knownEventIds: string[];
  activeEventIds: string[];
  unresolvedEventIds: string[];
  inheritedMeaning: string[];
  transitionQuality: number;
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

export function buildCumulativeMeaningState(
  beats: readonly MouthCandidateBeat[],
  envelope: RealityEnvelope,
): CumulativeMeaningState[] {
  const known: string[] = [];
  const states: CumulativeMeaningState[] = [];

  beats.forEach((beat, index) => {
    const eventIds = [...new Set(beat.eventIds ?? [])];
    const relations = envelope.relations.filter(
      (relation) =>
        eventIds.includes(relation.from) ||
        eventIds.includes(relation.to),
    );
    const inherited = index === 0
      ? []
      : beats
          .slice(0, index)
          .flatMap((previous) => [...(previous.eventIds ?? []), ...(previous.setsUp ?? [])])
          .filter(Boolean);

    const transitionQuality = metric(
      (eventIds.length ? 0.35 : 0) +
        Math.min(0.3, relations.length * 0.05) +
        Math.min(0.2, inherited.length * 0.02) +
        (clean(beat.next || beat.frontier) ? 0.15 : 0),
    );

    known.push(...eventIds);
    states.push({
      knownEventIds: [...new Set(known)],
      activeEventIds: eventIds,
      unresolvedEventIds: relations
        .filter((relation) => relation.kind === "changes" || relation.kind === "contrasts" || relation.kind === "recontextualizes")
        .map((relation) => relation.to),
      inheritedMeaning: [...new Set(inherited)],
      transitionQuality,
    });
  });

  return states;
}

export function evaluateCumulativeMeaning(
  states: readonly CumulativeMeaningState[],
): number {
  if (!states.length) return 0;
  const depth = Math.min(1, states.length / 4);
  const continuity = states.reduce((sum, state) => sum + state.transitionQuality, 0) / states.length;
  const inherited = states.filter((state, index) => index === 0 || state.inheritedMeaning.length > 0).length / states.length;
  return metric(depth * 0.25 + continuity * 0.5 + inherited * 0.25);
}
