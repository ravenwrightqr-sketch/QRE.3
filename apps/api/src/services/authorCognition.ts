/* QRE CANONICAL COGNITION ENTRYPOINT
 *
 * One universal cognition path. Model cognition may propose hypotheses while
 * grounded relation discovery supplies evidence-backed alternatives.
 * Lenses never manufacture semantic meaning.
 */
import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph, RealityRelation } from "@qre/contracts";
import { buildAuthorCognitivePlan as buildModelCognitivePlan } from "./authorCognitionUniversal.js";
import { searchSatanicoRelations, type SatanicoMechanism } from "./authorSatanicoRelationSearch.js";
import type { AuthorCognitionInput, AuthorCognitionPlan } from "./authorCognitionUniversal.js";
export type { AuthorCognitionInput, AuthorCreativeInterpretation, AuthorAdaptiveQuestion, AuthorCognitionPlan } from "./authorCognitionUniversal.js";

function clean(value: unknown): string { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function clamp(value: number): number { return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3)); }
function operationForRelation(kind: RealityRelation["kind"]): LatentMovieTrajectoryStep["operation"] | undefined {
  switch (kind) {
    case "contrasts": return "contrast";
    case "changes": return "consequence";
    case "converges": return "converge";
    case "recontextualizes": return "reframe";
    case "repeats": return "recur";
    case "involves": return "reframe";
    default: return undefined;
  }
}
function relationKindForMechanism(mechanism: SatanicoMechanism): RealityRelation["kind"] {
  switch (mechanism) {
    case "contrast": return "contrasts";
    case "recurrence": return "repeats";
    case "transformation": return "changes";
    case "convergence": return "converges";
    case "identity-echo": return "involves";
    case "recontextualization": return "recontextualizes";
  }
}
function cleanSubject(value: unknown): string { return clean(value) || "the subject"; }
function discoveredScore(relationScore: number, evidenceCount: number, mechanism: SatanicoMechanism): number {
  const evidence = Math.min(1, evidenceCount / 4);
  const structuralBonus = mechanism === "contrast" || mechanism === "recontextualization" || mechanism === "convergence" ? 0.06 : 0;
  return clamp(relationScore * 0.72 + evidence * 0.22 + structuralBonus);
}
function relationCandidates(graph: RealityGraph, subject: string, returning: boolean): LatentMovieCandidate[] {
  const discovered = searchSatanicoRelations({ graph, subject, limit: 10 });
  const out: LatentMovieCandidate[] = [];
  for (const relation of discovered) {
    const kind = relationKindForMechanism(relation.mechanism);
    const [firstId, secondId] = relation.eventIds;
    const first = graph.events.find((event) => event.id === firstId);
    const second = graph.events.find((event) => event.id === secondId);
    if (!first || !second) continue;
    if (!graph.relations.some((item) => item.from === firstId && item.to === secondId && item.kind === kind)) {
      graph.relations.push({ from: firstId, to: secondId, kind, strength: clamp(relation.score) });
    }
    const operation = operationForRelation(kind);
    if (!operation) continue;
    const question = relation.mechanism === "contrast"
      ? "What expectation changes when these details meet?"
      : relation.mechanism === "transformation"
        ? "What becomes newly noticeable after the change?"
        : relation.mechanism === "recurrence"
          ? "What gains meaning because it returns?"
          : "What becomes newly noticeable when these details are seen together?";
    const core: LatentMovieTrajectoryStep[] = [
      { order: 1, operation: "establish", eventIds: [firstId], viewerChange: first.label, nextQuestion: question },
      { order: 2, operation, eventIds: [firstId, secondId], viewerChange: relation.reason, nextQuestion: question },
    ];
    const trajectory = relation.mechanism === "convergence"
      ? [
          { order: 1, operation: "establish", eventIds: [firstId], viewerChange: first.label, nextQuestion: "What belongs beside it?" },
          { order: 2, operation: "reveal", eventIds: [secondId], viewerChange: second.label, nextQuestion: "What changes when both are present?" },
          { order: 3, operation, eventIds: [firstId, secondId], viewerChange: relation.reason, nextQuestion: "What remains after the convergence?" },
          { order: 4, operation: "payoff", eventIds: [firstId, secondId], viewerChange: returning ? "Land the changed reading." : "Let the changed reading land.", nextQuestion: returning ? "What will feel different next time?" : "What remains after the relationship is noticed?" },
        ] satisfies LatentMovieTrajectoryStep[]
      : relation.mechanism === "transformation"
        ? [
            ...core,
            { order: 3, operation: "reveal", eventIds: [secondId], viewerChange: second.label, nextQuestion: "What does the changed state make visible?" },
            { order: 4, operation: "payoff", eventIds: [secondId], viewerChange: returning ? "Land the changed reading." : "Let the changed reading land.", nextQuestion: returning ? "What will feel different next time?" : "What remains after the relationship is noticed?" },
          ] satisfies LatentMovieTrajectoryStep[]
        : [
            ...core,
            { order: 3, operation: "payoff", eventIds: [secondId, firstId], viewerChange: returning ? "Land the changed reading." : second.label, nextQuestion: returning ? "What will feel different next time?" : "What remains after the relationship is noticed?" },
          ] satisfies LatentMovieTrajectoryStep[];
    const score = discoveredScore(relation.score, relation.evidence.length, relation.mechanism);
    out.push({
      id: `satanico-movie-${out.length + 1}`,
      lens: "NONE",
      anchorEventIds: [firstId, secondId],
      supportingRelationKinds: [kind],
      trajectory,
      payoff: returning ? "Land the changed reading." : "Let the changed reading land.",
      unresolvedQuestion: question,
      evidence: [first.label, second.label, ...relation.evidence],
      hypothesis: [relation.reason, `Interpretation grounded in the supplied relationship between ${first.label} and ${second.label}; no new event is asserted.`],
      truthRisk: 0,
      novelty: clamp(0.45 + relation.score * 0.45),
      specificity: clamp(0.7 + relation.score * 0.28),
      informationValue: clamp(0.5 + relation.score * 0.4),
      uncertainty: clamp(0.5 - relation.score * 0.25),
      attentionPotential: clamp(0.55 + relation.score * 0.4),
      consequencePotential: relation.mechanism === "transformation" || relation.mechanism === "contrast" ? 0.8 : 0.68,
      callbackPotential: relation.mechanism === "recurrence" || returning ? 0.75 : 0.15,
      compressionPotential: clamp(0.6 + relation.score * 0.35),
      repetitionRisk: 0.05,
      distinctiveness: clamp(0.55 + relation.score * 0.4),
      score,
    } satisfies LatentMovieCandidate);
  }
  return out;
}
function groundedCandidate(graph: RealityGraph, candidate: LatentMovieCandidate): boolean {
  const validIds = new Set(graph.events.map((event) => event.id));
  return candidate.trajectory.every((step) => {
    if (!step.eventIds.length || step.eventIds.some((id) => !validIds.has(id))) return false;
    if (step.eventIds.length < 2) return true;
    for (let i = 0; i < step.eventIds.length; i += 1) for (let j = i + 1; j < step.eventIds.length; j += 1) {
      const relation = graph.relations.find((item) => (item.from === step.eventIds[i] && item.to === step.eventIds[j]) || (item.from === step.eventIds[j] && item.to === step.eventIds[i]));
      if (!relation || operationForRelation(relation.kind) !== step.operation) return false;
    }
    return true;
  });
}
function dedupeCandidates(candidates: LatentMovieCandidate[], limit = 12): LatentMovieCandidate[] {
  const out: LatentMovieCandidate[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates.slice().sort((a, b) => b.score - a.score)) {
    const signature = `${candidate.trajectory.map((step) => step.operation).join(">")}|${candidate.trajectory.map((step) => step.eventIds.slice().sort().join("+")).join("|")}`;
    if (seen.has(signature)) continue;
    seen.add(signature); out.push(candidate); if (out.length >= limit) break;
  }
  return out;
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  // Relation discovery happens before model cognition so the model can actually
  // see the grounded semantic structure it is being asked to compete on.
  const derived = relationCandidates(input.realityGraph, cleanSubject(input.subject), returning);
  const modelPlan = await buildModelCognitivePlan(input);
  const modelGrounded = modelPlan.latentMovieCandidates.filter((candidate) => groundedCandidate(input.realityGraph, candidate));
  const candidates = dedupeCandidates([...modelGrounded, ...derived], 12);
  const requestedMovieId = clean((input as AuthorCognitionInput & { selectedMovieId?: string }).selectedMovieId);
  const modelSelectedId = modelPlan.selectedMovie?.id ?? requestedMovieId;
  const selectedMovie = modelGrounded.find((candidate) => candidate.id === modelSelectedId)
    ?? modelGrounded[0]
    ?? candidates[0];
  return {
    ...modelPlan,
    latentMovieCandidates: candidates,
    selectedMovie,
    interpretations: modelPlan.interpretations.length
      ? modelPlan.interpretations
      : selectedMovie
        ? [{ id: "interpretation-grounded", thesis: selectedMovie.hypothesis[0] ?? "", creativeOpportunity: "fact → relationship → changed notice → payoff", rationale: "derived from supplied evidence", evidenceEventIds: selectedMovie.anchorEventIds, confidence: selectedMovie.score }]
        : [],
  };
}