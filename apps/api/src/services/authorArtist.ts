import type {
  AuthorBrainTruth,
  AuthorCreativeProposition,
  AuthorDomainContext,
  AuthorMetamorphicRelationSet,
  RealityGraph,
  SequenceCandidate,
} from "@qre/contracts";
import { isAuthorTreatmentId, chooseFallbackTreatment, treatmentDescriptor } from "./authorTreatment.js";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const BLOCKED_WORDS = /\b(?:camera|shot|montage|soundtrack|screenplay|voice[- ]?over|slogan|caption|genre|cinematic)\b/i;

function relationIdsForCandidate(candidate: SequenceCandidate, relations: AuthorMetamorphicRelationSet): string[] {
  const anchorIds = new Set(candidate.anchorEventIds);
  return relations.relations
    .filter((relation) =>
      relation.evidenceEventIds.some((id) => anchorIds.has(id)) ||
      relation.beforeEventIds.some((id) => anchorIds.has(id)) ||
      relation.afterEventIds.some((id) => anchorIds.has(id)) ||
      candidate.supportingRelationKinds.includes(relation.type),
    )
    .map((relation) => relation.id)
    .slice(0, 8);
}

function orderingRuleFromCandidate(candidate: SequenceCandidate): string {
  const trajectory = candidate.trajectory.map((step) => `${step.operation}: ${step.viewerChange}`).join("; ");
  return candidate.payoff
    ? `Reveal the selected relationship progressively: establish concrete evidence, introduce the connected or competing behavior, show the interaction, then let the payoff prove the rule. ${trajectory}`
    : `Reveal the selected relationship progressively by moving from concrete evidence to the consequence that makes the relationship legible. ${trajectory}`;
}

function fallback(input: {
  truth: AuthorBrainTruth;
  candidate: SequenceCandidate;
  alternatives: SequenceCandidate[];
  graph: RealityGraph;
  relations: AuthorMetamorphicRelationSet;
  excludedCandidateIds: ReadonlySet<string>;
}): AuthorCreativeProposition {
  const pool = (input.alternatives.length ? input.alternatives : [input.candidate])
    .filter((candidate) => !input.excludedCandidateIds.has(candidate.id));
  const selected = [...pool].sort((a, b) => b.score - a.score)[0] ?? input.candidate;
  const sourceEventIds = selected.anchorEventIds.filter((id) => input.graph.events.some((event) => event.id === id)).slice(0, 8);
  const relationIds = relationIdsForCandidate(selected, input.relations);
  const hypothesis = clean(selected.hypothesis[0]);
  const payoff = clean(selected.payoff);
  const text = hypothesis || payoff || clean(selected.lens) || "A distinctive relationship is already present here.";
  const treatment = chooseFallbackTreatment({ relations: input.relations, returning: input.truth.returning });
  return {
    text: BLOCKED_WORDS.test(text) ? "A distinctive relationship is already present here." : text,
    pattern: clean(selected.lens) || selected.supportingRelationKinds[0] || "relationship",
    orderingRule: orderingRuleFromCandidate(selected),
    sourceEventIds,
    candidateId: selected.id,
    relationIds,
    treatment,
  };
}

export async function chooseAuthorProposition(input: {
  truth: AuthorBrainTruth;
  candidate: SequenceCandidate;
  alternatives: SequenceCandidate[];
  graph: RealityGraph;
  relations: AuthorMetamorphicRelationSet;
  domainContext?: AuthorDomainContext;
  excludedCandidateIds?: string[];
  judgeFeedback?: string[];
}): Promise<AuthorCreativeProposition> {
  const excluded = new Set(input.excludedCandidateIds ?? []);
  const available = (input.alternatives.length ? input.alternatives : [input.candidate])
    .filter((candidate) => !excluded.has(candidate.id)).slice(0, 6);
  const candidates = available.length ? available : [input.candidate];
  const fallbackValue = fallback({ ...input, alternatives: candidates, excludedCandidateIds: excluded });
  const candidateField = candidates.map((candidate) => ({
    id: candidate.id, lens: candidate.lens, anchors: candidate.anchorEventIds,
    relationships: candidate.supportingRelationKinds, trajectory: candidate.trajectory,
    payoff: candidate.payoff, unresolvedQuestion: candidate.unresolvedQuestion,
    evidence: candidate.evidence, hypothesis: candidate.hypothesis, score: candidate.score,
  }));

  try {
    const response = await localModelGenerate([
      { role: "system", content: [
        "You are QRE Artist.",
        "Choose exactly one grounded cognitive candidate and turn it into one central creative proposition.",
        "Also define one ordering rule for the realization: a concise instruction describing how the selected grounded relationship should be progressively revealed.",
        "The ordering rule is specific to this evidence. It is not a fixed template or category.",
        "Choose one bounded perceptual treatment from: horror-romance, heist-comedy, game-fierce, noir-tenderness, documentary-chaos.",
        "A treatment changes perception of the selected relationship; it never changes reality and never invents an event.",
        "The proposition should expose a rule, tension, dependency, contradiction, priority, recurrence, transformation, or consequence that belongs to the supplied reality.",
        "Prefer a proposition with character, stakes, movement, surprise, and payoff over a list of nouns.",
        "The candidate ID, source event IDs, and relationship IDs must come from the supplied data.",
        "Do not write the final sequence. Do not write slogans. Return JSON only.",
      ].join(" ") },
      { role: "user", content: JSON.stringify({
        prompt: input.truth.prompt, subject: input.truth.subject, place: input.truth.place,
        returning: input.truth.returning ?? false, visitNumber: input.truth.visitNumber ?? null,
        memory: input.truth.memoryContext?.slice(0, 100) ?? [], learning: input.truth.creativeLearningContext?.slice(0, 80) ?? [],
        domain: input.truth.domainContext ?? input.domainContext ?? null,
        reality: input.graph.events.slice(0, 100), relationships: input.relations.relations.slice(0, 24),
        candidates: candidateField, excludedCandidateIds: [...excluded], judgeFeedback: input.judgeFeedback?.slice(-8) ?? [],
      }) },
    ], "json", {
      numPredict: 1150, numCtx: 12288, temperature: 0.84,
      jsonSchema: {
        type: "object", additionalProperties: false,
        required: ["candidateId", "text", "pattern", "orderingRule", "sourceEventIds", "relationIds", "treatment"],
        properties: {
          candidateId: { type: "string" }, text: { type: "string" }, pattern: { type: "string" },
          orderingRule: { type: "string", minLength: 12, maxLength: 500 },
          sourceEventIds: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
          relationIds: { type: "array", maxItems: 8, items: { type: "string" } },
          treatment: { type: "object", additionalProperties: false, required: ["id", "reason"],
            properties: { id: { type: "string" }, reason: { type: "string" } } },
        },
      },
    });
    const parsed: unknown = JSON.parse(response.text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const row = parsed as Record<string, unknown>;
      const candidateId = clean(row.candidateId); const candidate = candidates.find((value) => value.id === candidateId);
      const text = clean(row.text); const pattern = clean(row.pattern); const orderingRule = clean(row.orderingRule);
      const sourceEventIds = Array.isArray(row.sourceEventIds) ? row.sourceEventIds.filter((value): value is string => typeof value === "string" && input.graph.events.some((event) => event.id === value)).slice(0, 8) : [];
      const relationIds = Array.isArray(row.relationIds) ? row.relationIds.filter((value): value is string => typeof value === "string" && input.relations.relations.some((relation) => relation.id === value)).slice(0, 8) : [];
      const treatment = row.treatment && typeof row.treatment === "object" && !Array.isArray(row.treatment) ? row.treatment as Record<string, unknown> : {};
      const treatmentId = clean(treatment.id); const reason = clean(treatment.reason);
      if (candidate && text && pattern && orderingRule && sourceEventIds.length && !BLOCKED_WORDS.test(text) && isAuthorTreatmentId(treatmentId)) {
        const fallbackTreatment = chooseFallbackTreatment({ relations: input.relations, returning: input.truth.returning });
        const selectedTreatment = treatmentId === fallbackTreatment.id ? fallbackTreatment : {
          ...fallbackTreatment, id: treatmentId,
          primary: treatmentId.split("-")[0], secondary: treatmentId.split("-")[1] ?? fallbackTreatment.secondary,
          rule: treatmentDescriptor(treatmentId), reason: reason || `Selected ${treatmentId} to alter perception of the grounded relationship.`,
        };
        return { text, pattern, orderingRule, sourceEventIds, candidateId: candidate.id,
          relationIds: relationIds.length ? relationIds : relationIdsForCandidate(candidate, input.relations), treatment: selectedTreatment };
      }
    }
  } catch {
    // Deterministic fallback preserves a valid Author result when local inference fails.
  }
  return fallbackValue;
}
