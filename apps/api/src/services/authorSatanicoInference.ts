import type {
  LatentMovieCandidate,
  ObserverExperienceObjective,
  RealityGraph,
} from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const PREFERENCE = /\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|into)\b/i;
const SUBJECT = /\b(?:dog|cat|person|couple|house|shop|business|trip|wedding|ring|car|product|place)\b/i;

function labelFor(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((item) => item.id === id)?.label);
}

function subjectName(graph: RealityGraph): string {
  return clean(
    [...(graph.entityContinuity ?? [])]
      .sort((a, b) => b.salienceScore - a.salienceScore)[0]?.name,
  );
}

function preferenceConstellation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { labels: string[]; score: number } | undefined {
  const ids = unique(candidate.trajectory.flatMap((step) => step.eventIds));
  const subject = subjectName(graph);
  const preferenceLabels = ids
    .map((id) => labelFor(graph, id))
    .filter((label) => PREFERENCE.test(label));

  if (preferenceLabels.length < 2) return undefined;

  const subjectHits = subject
    ? preferenceLabels.filter((label) => label.toLowerCase().includes(subject.toLowerCase())).length
    : 0;
  const variety = new Set(
    preferenceLabels
      .map((label) => label.toLowerCase().replace(/\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|into)\b/gi, "").trim())
      .filter(Boolean),
  ).size;

  return {
    labels: preferenceLabels,
    score: metric(
      Math.min(1, preferenceLabels.length / 4) * 0.52 +
        Math.min(1, variety / 3) * 0.3 +
        (subjectHits ? 0.18 : 0),
    ),
  };
}

export function deriveSatanicoObserverObjective(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): ObserverExperienceObjective | undefined {
  const constellation = preferenceConstellation(graph, candidate);
  if (!constellation || constellation.score < 0.58) return undefined;

  const subject = subjectName(graph) || "the subject";
  const labels = constellation.labels.map((label) => label.replace(/\s+/g, " ").trim());
  const finalDetail = labels[labels.length - 1] ?? "the final supplied preference";

  return {
    objective: `Let the observer infer that ${subject} has a very specific pattern of preference from ${labels.slice(0, 3).join("; ")}.`,
    surprise: "The pattern should become visible before the Author names it.",
    curiosity: `Do not explain why ${subject} has the pattern. Leave the observer room to complete the character read themselves.`,
    attention: [
      "establish one concrete preference",
      "add a second preference that changes the pattern",
      "withhold the abstraction",
      `use ${finalDetail} as the last piece of evidence`,
    ],
    landing: "Let the observer name the pattern internally; the final cut supplies evidence rather than the conclusion.",
    explanationForbidden: true,
  };
}
