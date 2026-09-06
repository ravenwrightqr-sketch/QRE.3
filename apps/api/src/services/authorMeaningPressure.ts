/*
 * QRE UNIVERSAL MEANING PRESSURE
 *
 * The Artist Device says HOW language may move.
 * Meaning Pressure says WHY the selected reality is worth moving.
 *
 * This module never creates a fact. It derives an artistic pressure from an
 * already-grounded Movie relationship and supplied events.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";

export type MeaningPressure = {
  core: string;
  poles: string[];
  viewerChange: string;
  interpretiveDirections: string[];
  concreteBoundary: string;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const relationOf = (movie: LatentMovieCandidate): string => clean(movie.supportingRelationKinds[0]) || "observation";
const labels = (graph: RealityGraph, ids: readonly string[]): string[] => ids
  .map((id) => graph.events.find((event) => event.id === id)?.label)
  .filter((value): value is string => Boolean(value))
  .map(clean)
  .filter(Boolean);

function relationPressure(relation: string): MeaningPressure {
  switch (relation) {
    case "recontextualizes":
      return { core: "The later truth changes the charge of the earlier truth.", poles: ["expectation", "intrusion", "appearance", "behavior"], viewerChange: "What first looked ordinary acquires a different charge when the second fact arrives.", interpretiveDirections: ["reframe", "irony", "status inversion", "understatement", "callback", "compression"], concreteBoundary: "Do not invent the bridge; make the supplied bridge felt." };
    case "contrasts":
      return { core: "Two true details refuse the same expected reading.", poles: ["order", "disruption", "surface", "behavior"], viewerChange: "The viewer notices the mismatch before being told what it means.", interpretiveDirections: ["juxtaposition", "asymmetry", "irony", "understatement", "reversal", "silence"], concreteBoundary: "Do not add a new event to explain the contrast." };
    case "changes":
    case "state_change":
      return { core: "The world is true in two different states.", poles: ["before", "after", "stability", "instability"], viewerChange: "The difference between states becomes the experience.", interpretiveDirections: ["before-after", "compression", "repetition with mutation", "status flip", "inversion", "ellipsis"], concreteBoundary: "Do not invent the transition between supplied states." };
    case "repeats":
      return { core: "A real detail returns with a changed charge.", poles: ["return", "difference", "habit", "recognition"], viewerChange: "The second occurrence makes the first occurrence mean differently.", interpretiveDirections: ["callback", "rhythm", "repetition with mutation", "omission", "accumulation"], concreteBoundary: "Repeat only what the supplied world actually repeats." };
    case "causes":
      return { core: "An outcome carries the weight of its supplied cause.", poles: ["cause", "consequence", "intention", "result"], viewerChange: "The consequence is allowed to imply the cause instead of explaining it.", interpretiveDirections: ["aftermath", "compression", "causal cut", "understatement", "status flip"], concreteBoundary: "Do not fabricate an intermediate action." };
    case "converges":
      return { core: "Separate supplied details arrive at one felt point.", poles: ["separate", "together", "accumulation", "collision"], viewerChange: "The viewer sees the relationship only after the pieces have accumulated.", interpretiveDirections: ["accumulation", "collision", "fragmentation", "compression", "repetition"], concreteBoundary: "The convergence must be carried by supplied details, not an invented event." };
    case "before":
    case "after":
      return { core: "The supplied world continues beyond the cut.", poles: ["departure", "continuation", "absence", "return"], viewerChange: "What is omitted leaves more life around what is shown.", interpretiveDirections: ["ellipsis", "open end", "callback", "compression", "silence"], concreteBoundary: "Do not invent what happens outside the supplied evidence." };
    default:
      return { core: "A specific supplied detail becomes newly charged when isolated.", poles: ["ordinary", "specific", "stillness", "attention"], viewerChange: "The viewer notices more than the literal fact because the framing of language changed.", interpretiveDirections: ["unexpected selection", "nominalization", "fragmentation", "understatement", "silence", "compression"], concreteBoundary: "Novel interpretation is welcome; novel concrete reality is not." };
  }
}

export function deriveMeaningPressure(input: { graph: RealityGraph; movie: LatentMovieCandidate }): MeaningPressure {
  const pressure = relationPressure(relationOf(input.movie));
  const evidence = labels(input.graph, input.movie.anchorEventIds).slice(0, 3);
  const evidenceHint = evidence.length ? ` Ground it in these actual details: ${evidence.join(" / ")}.` : "";
  return {
    ...pressure,
    core: `${pressure.core}${evidenceHint}`,
  };
}
