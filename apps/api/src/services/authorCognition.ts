/* QRE CANONICAL COGNITION ENTRYPOINT
 *
 * One universal cognition path. Model cognition may propose hypotheses, while
 * grounded relation discovery supplies evidence-backed alternatives. Lenses
 * never manufacture semantic meaning.
 */
import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph, RealityRelation } from "@qre/contracts";
import { buildAuthorCognitivePlan as buildModelCognitivePlan } from "./authorCognitionUniversal.js";
import { searchSatanicoRelations, type SatanicoMechanism } from "./authorSatanicoRelationSearch.js";

export type { AuthorCognitionInput, AuthorCreativeInterpretation, AuthorAdaptiveQuestion, AuthorCognitionPlan } from "./authorCognitionUniversal.js";
import type { AuthorCognitionInput, AuthorCognitionPlan } from "./authorCognitionUniversal.js";

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

function relationCandidates(graph: RealityGraph, subject: string, returning: boolean): LatentMovieCandidate[] {
  return searchSatanicoRelations({ graph, subject, limit: 8 }).map((relation, index) => {
    const [firstId, secondId] = relation.eventIds;
    const first = graph.events.find((event) => event.id === firstId)!;
    const second = graph.events.find((event) => event.id === secondId)!;
    const operation = operationForRelation(relationKindForMechanism(relation.mechanism))!;
    const question = relation.mechanism === "contrast"
      ? "What expectation changes when these facts meet?"
      : relation.mechanism === "transformation"
        ? "What is different after the supplied change?"
        : relation.mechanism === "recurrence"
          ? "What accumulates because this returns?"
          : "What does seeing these facts together make newly noticeable?";
    return {
      id: `satanico-movie-${index + 1}`,
      lens: "NONE",
      anchorEventIds: [firstId, secondId],
      supportingRelationKinds: [relationKindForMechanism(relation.mechanism)],
      trajectory: [
        { order: 1, operation: "establish", eventIds: [firstId], viewerChange: `Notice the supplied detail: ${first.label}`, nextQuestion: question },
        { order: 2, operation, eventIds: [firstId, secondId], viewerChange: relation.reason, nextQuestion: question },
        { order: 3, operation: "payoff", eventIds: [secondId, firstId], viewerChange: returning ? "Land the changed reading without adding a fact." : `Land the changed reading on the supplied detail: ${second.label}`, nextQuestion: returning ? "What will be different next time?" : "What remains after the reading changes?" },
      ],
      payoff: returning ? "Land the changed reading without invention." : `Let the supplied detail ${second.label} carry the changed reading.`,
      unresolvedQuestion: question,
      evidence: [first.label, second.label, ...relation.evidence],
      hypothesis: [`The relationship between ${first.label} and ${second.label} changes what is worth noticing.`, "Interpretation only; no new event is asserted."],
      truthRisk: 0,
      novelty: Math.min(1, 0.55 + relation.score * 0.4),
      specificity: 0.94,
      informationValue: Math.min(1, 0.64 + relation.score * 0.32),
      uncertainty: Math.max(0.08, 0.48 - relation.score * 0.28),
      attentionPotential: Math.min(1, 0.64 + relation.score * 0.32),
      consequencePotential: relation.mechanism === "transformation" || relation.mechanism === "contrast" ? 0.84 : 0.7,
      callbackPotential: relation.mechanism === "recurrence" || returning ? 0.8 : 0.18,
      compressionPotential: 0.84,
      repetitionRisk: 0.04,
      distinctiveness: Math.min(1, 0.72 + relation.score * 0.25),
      score: Math.max(0.6, Math.min(0.92, 0.62 + relation.score * 0.3)),
    } satisfies LatentMovieCandidate;
  });
}

function groundedCandidate(graph: RealityGraph, candidate: LatentMovieCandidate): boolean {
  const validIds = new Set(graph.events.map((event) => event.id));
  const declaredKinds = new Set(candidate.supportingRelationKinds);
  return candidate.trajectory.every((step) => {
    if (!step.eventIds.length || step.eventIds.some((id) => !validIds.has(id))) return false;
    if (step.eventIds.length < 2) return true;
    for (let i = 0; i < step.eventIds.length; i += 1) {
      for (let j = i + 1; j < step.eventIds.length; j += 1) {
        const relation = graph.relations.find((item) =>
          (item.from === step.eventIds[i] && item.to === step.eventIds[j]) ||
          (item.from === step.eventIds[j] && item.to === step.eventIds[i]),
        );
        if (relation) {
          const expected = operationForRelation(relation.kind);
          if (expected === step.operation) return true;
        }
      }
    }
    const expectedKinds: RealityRelation["kind"][] = step.operation === "contrast"
      ? ["contrasts"]
      : step.operation === "consequence"
        ? ["changes"]
        : step.operation === "converge"
          ? ["converges"]
          : step.operation === "reframe"
            ? ["recontextualizes", "involves"]
            : step.operation === "recur"
              ? ["repeats"]
              : [];
    return expectedKinds.some((kind) => declaredKinds.has(kind));
  });
}

function dedupeCandidates(candidates: LatentMovieCandidate[], limit = 10): LatentMovieCandidate[] {
  const out: LatentMovieCandidate[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates.slice().sort((a, b) => b.score - a.score)) {
    const signature = `${candidate.trajectory.map((step) => step.operation).join(">")}|${candidate.trajectory.flatMap((step) => step.eventIds).sort().join(",")}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    out.push(candidate);
    if (out.length >= limit) break;
  }
  return out;
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const modelPlan = await buildModelCognitivePlan(input);
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const derived = relationCandidates(input.realityGraph, String(input.subject ?? "the subject").trim() || "the subject", returning);
  const modelGrounded = modelPlan.latentMovieCandidates.filter((candidate) => groundedCandidate(input.realityGraph, candidate));
  const candidates = dedupeCandidates([...modelGrounded, ...derived], 10);
  const selectedMovie = candidates.find((candidate) => candidate.id === modelPlan.selectedMovie?.id) ?? candidates[0];
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
