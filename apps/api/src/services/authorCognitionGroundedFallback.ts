import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = (value: unknown): string => clean(value).toLowerCase();
const clamp = (value: number): number => Math.max(0, Math.min(1, Number(value.toFixed(3))));
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const PREFERENCE = /\b(?:likes?|loves?|hates?|prefers?|wants?|needs?|enjoys?|usually|often|always|never|can|cannot|favorite|favourite)\b/i;
const IDENTITY = /^(?:[A-Z][A-Za-z0-9'’-]*\s+)?(?:is|was|a|an|the)\b/i;
const ACTION = /\b(?:arrived?|came|went|walked?|ran|drove|ate|drank|called?|met|talked?|spoke|said|made|gave|got|found|lost|cleaned?|finished?|started?|opened?|closed?|played?|worked?|visited?|bought|sold|built|fixed|painted?|wore|used|stayed?|waited?|laughed?|cried?|looked?|felt|became|changed|repaired?|tested?|selected?|cut|shaped|polished|delivered|welcomed|checked|booked|reserved|approved|groomed?|dyed|tailored|installed|stole|returned?|rescued|adopted|remembered?|watched?|heard|sang|danced?|picked up)\b/i;

function isConcreteOccurrence(label: string): boolean {
  return Boolean(clean(label)) && ACTION.test(label) && !PREFERENCE.test(label);
}

function candidate(
  graph: RealityGraph,
  subject: string,
  ids: string[],
  returning: boolean,
): LatentMovieCandidate {
  const events = ids.map((id) => graph.events.find((event) => event.id === id)).filter(Boolean);
  const first = events[0]!.label;
  const last = events.at(-1)!.label;
  const trajectory: LatentMovieTrajectoryStep[] = [];

  trajectory.push({
    order: 1,
    operation: "establish",
    eventIds: [ids[0]!],
    viewerChange: first,
    nextQuestion: ids.length > 1 ? "What becomes more noticeable when the other supplied detail arrives?" : "What is most worth noticing here?",
  });

  if (ids.length > 2) {
    trajectory.push({
      order: 2,
      operation: "recontextualize" as LatentMovieTrajectoryStep["operation"],
      eventIds: ids.slice(0, 2),
      viewerChange: "the supplied details are considered together",
      nextQuestion: "What does the combination sharpen?",
    });
    trajectory.push({
      order: 3,
      operation: "reveal",
      eventIds: ids.slice(-2),
      viewerChange: "the later supplied detail changes what stays in view",
      nextQuestion: returning ? "What carries forward?" : "What lingers?",
    });
  } else if (ids.length === 2) {
    trajectory.push({
      order: 2,
      operation: "converge",
      eventIds: ids,
      viewerChange: "two supplied details are held in the same frame",
      nextQuestion: returning ? "What carries forward?" : "What becomes newly noticeable?",
    });
  }

  trajectory.push({
    order: trajectory.length + 1,
    operation: "payoff",
    eventIds: [ids.at(-1)!],
    viewerChange: returning ? "land the return" : "let the selected reality land",
    nextQuestion: returning ? "What will feel different next time?" : "What lingers?",
  });

  return {
    id: `sparse-reality-movie-${ids.join("-")}`,
    lens: "NONE",
    anchorEventIds: unique(ids),
    supportingRelationKinds: [],
    trajectory,
    payoff: last,
    unresolvedQuestion: returning ? "What carries forward?" : "What becomes newly noticeable?",
    evidence: events.map((event) => event!.label),
    hypothesis: [
      ids.length > 1
        ? "The supplied details may become more interesting when their combination is allowed to carry the experience."
        : "This single supplied detail may be enough when realized with precision.",
    ],
    truthRisk: 0,
    novelty: ids.length > 1 ? 0.72 : 0.55,
    specificity: 0.92,
    informationValue: ids.length > 1 ? 0.78 : 0.62,
    uncertainty: ids.length > 1 ? 0.28 : 0.38,
    attentionPotential: ids.length > 1 ? 0.74 : 0.6,
    consequencePotential: ids.length > 2 ? 0.7 : 0.46,
    callbackPotential: returning ? 0.74 : 0.18,
    compressionPotential: 0.9,
    repetitionRisk: 0.04,
    distinctiveness: ids.length > 1 ? 0.8 : 0.68,
    score: 0,
  };
}

export function buildSparseGroundedMovies(
  graph: RealityGraph,
  subject: string,
  returning: boolean,
): LatentMovieCandidate[] {
  if (!graph.events.length) return [];

  const usable = graph.events.filter((event) => isConcreteOccurrence(event.label));
  const pool = usable.length ? usable : graph.events.filter((event) => {
    const text = lower(event.label);
    return !PREFERENCE.test(text) && !IDENTITY.test(event.label);
  });
  const source = pool.length ? pool : graph.events;

  const indexes: number[][] = [];
  if (source.length === 1) {
    indexes.push([0]);
  } else {
    indexes.push([0, source.length - 1]);
    if (source.length >= 3) indexes.push([0, Math.floor(source.length / 2), source.length - 1]);
    if (source.length >= 4) indexes.push([0, 1, source.length - 1]);
  }

  const out: LatentMovieCandidate[] = [];
  for (const indexSet of indexes) {
    const ids = unique(indexSet.map((index) => source[index]?.id).filter((id): id is string => Boolean(id)));
    if (!ids.length) continue;
    const item = candidate(graph, subject, ids, returning);
    item.score = clamp(item.compressionPotential * 0.2 + item.attentionPotential * 0.18 + item.specificity * 0.16 + item.novelty * 0.14 + item.distinctiveness * 0.14 + item.informationValue * 0.08 + item.consequencePotential * 0.06 + (1 - item.truthRisk) * 0.04);
    out.push(item);
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 6);
}
