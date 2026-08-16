/**
 * QRE LATENT MOVIE SEARCH · CANONICAL HYPOTHESIS LAYER
 *
 * RealityGraph is immutable source evidence. This module searches for different
 * ways the same evidence could play as a movie without turning hypotheses into
 * facts. It is intentionally domain-neutral and deterministic for now.
 *
 * Pipeline position:
 *   REALITY GRAPH → LATENT MOVIE CANDIDATES → COGNITION → TRAJECTORY → MOUTH
 */
import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph, RealityRelation } from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));

const GENERIC_LENSES = ["comedy", "romance", "horror", "sentimental", "absurd", "neutral"] as const;
type Lens = (typeof GENERIC_LENSES)[number];

function unique<T>(values: T[]): T[] { return [...new Set(values)]; }

function eventById(graph: RealityGraph, id: string) { return graph.events.find((event) => event.id === id); }

function requestedLenses(lens?: string): Lens[] {
  const text = clean(lens).toLowerCase();
  const hits: Lens[] = [];
  for (const candidate of GENERIC_LENSES) if (text.includes(candidate)) hits.push(candidate);
  if (/funny|comic|humor|playful/.test(text)) hits.push("comedy");
  if (/romantic|love|tender/.test(text)) hits.push("romance");
  if (/dark|eerie|creepy|dread/.test(text)) hits.push("horror");
  if (/warm|heart|nostalgic|gentle/.test(text)) hits.push("sentimental");
  if (/weird|chaotic|surreal|demented/.test(text)) hits.push("absurd");
  return unique(hits.length ? hits : [...GENERIC_LENSES]);
}

function lensOperation(lens: Lens): "contrast" | "recur" | "reframe" | "escalate" | "converge" {
  switch (lens) {
    case "comedy": return "contrast";
    case "romance": return "reframe";
    case "horror": return "escalate";
    case "sentimental": return "recur";
    case "absurd": return "converge";
    default: return "reframe";
  }
}

function relationEvidence(graph: RealityGraph, ids: string[]): RealityRelation[] {
  const set = new Set(ids);
  return graph.relations.filter((relation) => set.has(relation.from) || set.has(relation.to));
}

function chooseAnchors(graph: RealityGraph, lens: Lens): string[] {
  const ranked = graph.events.map((event, index) => {
    const incident = graph.relations.filter((relation) => relation.from === event.id || relation.to === event.id);
    const sensory = graph.sensorySignals.some((signal) => signal.toLowerCase() === event.label.toLowerCase());
    const recurring = graph.recurringSignals.some((signal) => signal.toLowerCase() === event.label.toLowerCase());
    const relationWeight = incident.reduce((sum, relation) => sum + relation.strength, 0);
    const lensBonus = lens === "sentimental" && recurring ? 0.25 : lens === "comedy" && incident.some((r) => r.kind === "contrasts") ? 0.25 : lens === "horror" && incident.some((r) => r.kind === "changes" || r.kind === "recontextualizes") ? 0.2 : 0;
    return { id: event.id, score: relationWeight + (sensory ? 0.18 : 0) + (recurring ? 0.2 : 0) + lensBonus - index * 0.002 };
  });
  return ranked.sort((a, b) => b.score - a.score).slice(0, 4).map((item) => item.id);
}

function buildTrajectory(graph: RealityGraph, anchors: string[], lens: Lens): LatentMovieTrajectoryStep[] {
  const steps: LatentMovieTrajectoryStep[] = [];
  const first = anchors[0];
  const firstEvent = eventById(graph, first);
  if (!firstEvent) return steps;
  steps.push({ order: 1, operation: "establish", eventIds: [first], viewerChange: `Establish the specific reality: ${firstEvent.label}`, nextQuestion: "What about this detail matters next?" });

  const candidateRelations = relationEvidence(graph, anchors);
  const preferredKinds: RealityRelation["kind"][] = lens === "comedy"
    ? ["contrasts", "converges", "recontextualizes"]
    : lens === "horror"
      ? ["recontextualizes", "changes", "converges"]
      : lens === "romance"
        ? ["converges", "recontextualizes", "changes"]
        : lens === "sentimental"
          ? ["recontextualizes", "repeats", "converges"]
          : ["contrasts", "recontextualizes", "converges", "changes"];

  const chosenRelations = candidateRelations.filter((relation) => preferredKinds.includes(relation.kind)).sort((a, b) => b.strength - a.strength).slice(0, 3);
  for (const relation of chosenRelations) {
    const targetId = relation.from === first ? relation.to : relation.from;
    const target = eventById(graph, targetId);
    if (!target || steps.some((step) => step.eventIds.includes(targetId))) continue;
    steps.push({ order: steps.length + 1, operation: lensOperation(lens), eventIds: [first, targetId], viewerChange: `${relation.kind} changes how the supplied detail is read: ${target.label}`, nextQuestion: "What does the relationship between these details reveal?" });
  }

  const unused = anchors.find((id) => !steps.some((step) => step.eventIds.includes(id)));
  if (unused) {
    const event = eventById(graph, unused);
    if (event) steps.push({ order: steps.length + 1, operation: "converge", eventIds: [unused], viewerChange: `Bring a concrete secondary detail into the pattern: ${event.label}`, nextQuestion: "Does this detail complete or overturn the pattern?" });
  }

  const payoffIds = unique(steps.flatMap((step) => step.eventIds)).slice(-2);
  steps.push({ order: steps.length + 1, operation: "payoff", eventIds: payoffIds, viewerChange: "Pay off the discovered relationship without adding a new event.", nextQuestion: "What meaning survives after the cut?" });
  return steps.slice(0, 6);
}

function buildCandidate(graph: RealityGraph, lens: Lens, rank: number): LatentMovieCandidate {
  const anchors = chooseAnchors(graph, lens);
  const trajectory = buildTrajectory(graph, anchors, lens);
  const relations = relationEvidence(graph, anchors);
  const evidence = unique(anchors.map((id) => eventById(graph, id)?.label).filter(Boolean) as string[]).slice(0, 8);
  const relationKinds = unique(relations.map((relation) => relation.kind));
  const groundedRelations = relations.filter((relation) => relation.strength >= 0.5).length;
  const contrastCount = relations.filter((relation) => relation.kind === "contrasts").length;
  const recurrenceCount = relations.filter((relation) => relation.kind === "recontextualizes" || relation.kind === "repeats").length;
  const concreteCount = anchors.filter((id) => graph.sensorySignals.includes(eventById(graph, id)?.label ?? "")).length;
  const unresolved = graph.unresolvedTensions[0] ?? (lens === "neutral" ? "Which supplied detail deserves attention next?" : "What does this relationship mean?");

  const specificity = metric((concreteCount * 0.2) + (evidence.length / 8) * 0.55 + groundedRelations * 0.06);
  const novelty = metric(0.32 + contrastCount * 0.16 + recurrenceCount * 0.08 + Math.min(anchors.length, 4) * 0.04);
  const informationValue = metric(0.28 + relationKinds.length * 0.09 + specificity * 0.32);
  const uncertainty = metric(0.2 + (unresolved ? 0.22 : 0) + Math.min(trajectory.length, 5) * 0.05);
  const attentionPotential = metric(novelty * 0.3 + uncertainty * 0.25 + informationValue * 0.35 + (contrastCount ? 0.1 : 0));
  const consequencePotential = metric((trajectory.length >= 3 ? 0.3 : 0.12) + recurrenceCount * 0.1 + contrastCount * 0.08);
  const callbackPotential = metric((graph.recurringSignals.length ? 0.35 : 0.08) + recurrenceCount * 0.12);
  const compressionPotential = metric(0.35 + specificity * 0.25 + Math.min(relationKinds.length, 4) * 0.08);
  const repetitionRisk = metric(Math.max(0, (anchors.length - 3) * 0.1) + (graph.recurringSignals.length > 3 ? 0.12 : 0));
  const truthRisk = metric(0.04 + relations.filter((relation) => relation.strength < 0.5).length * 0.06);
  const lensFit = lens === "neutral" ? 0.5 : 0.1 + (contrastCount ? 0.2 : 0) + (recurrenceCount ? 0.12 : 0) + (graph.sensorySignals.length ? 0.08 : 0);
  const score = metric(novelty * 0.14 + uncertainty * 0.1 + informationValue * 0.16 + attentionPotential * 0.18 + consequencePotential * 0.12 + callbackPotential * 0.08 + compressionPotential * 0.1 + specificity * 0.08 + lensFit * 0.08 - repetitionRisk * 0.08 - truthRisk * 0.12);

  const payoff = lens === "comedy"
    ? "Let the strongest supplied contrast become the final reframe."
    : lens === "horror"
      ? "End on the ordinary detail carrying a newly unsettling meaning."
      : lens === "romance"
        ? "End on the supplied detail that feels more meaningful after the relationship is seen."
        : lens === "sentimental"
          ? "End on the returning detail with its meaning changed by context."
          : lens === "absurd"
            ? "End by compressing the concrete pattern into an unexpected but grounded reframe."
            : "End when the strongest relationship has been understood.";

  return {
    id: `movie-${rank}-${lens}`,
    lens,
    anchorEventIds: anchors,
    supportingRelationKinds: relationKinds,
    trajectory,
    payoff,
    unresolvedQuestion: unresolved,
    evidence,
    hypothesis: [`The supplied relationships may support a ${lens} reading.`, "This is a creative hypothesis, not a new fact."],
    truthRisk,
    novelty,
    specificity,
    informationValue,
    uncertainty,
    attentionPotential,
    consequencePotential,
    callbackPotential,
    compressionPotential,
    repetitionRisk,
    score,
  };
}

/** Generate competing movies from one immutable reality graph. */
export function searchLatentMovieCandidates(input: { graph: RealityGraph; subject?: string; lens?: string; limit?: number }): LatentMovieCandidate[] {
  if (!input.graph.events.length) return [];
  const lenses = requestedLenses(input.lens);
  const candidates = lenses.map((lens, index) => buildCandidate(input.graph, lens, index + 1));
  return candidates.sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.min(input.limit ?? 6, 8)));
}
