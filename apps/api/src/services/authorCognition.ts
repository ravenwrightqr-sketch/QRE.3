import type {
  AuthorBrainTruth,
  AuthorCognitionResult,
  RealityGraph,
  SequenceCandidate,
  SequenceTrajectoryStep,
} from "@qre/contracts";
import { searchAuthorMetamorphicRelations } from "./authorMetamorphicSearch.js";
import { localModelGenerate } from "./localModelRuntime.js";

type RawCandidate = Record<string, unknown>;
const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const clamp = (value: unknown, fallback = 0.5): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
};
const strings = (value: unknown, limit = 12): string[] => Array.isArray(value)
  ? [...new Set(value.filter((x): x is string => typeof x === "string").map(clean).filter(Boolean))].slice(0, limit)
  : typeof value === "string" ? [clean(value)] : [];
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const operations = new Set<SequenceTrajectoryStep["operation"]>([
  "establish", "contrast", "recur", "reframe", "escalate", "converge", "reveal", "consequence", "payoff",
]);

function normalizeTrajectory(value: unknown, graph: RealityGraph): SequenceTrajectoryStep[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set(graph.events.map((event) => event.id));
  return value.map((entry, index): SequenceTrajectoryStep | null => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const row = entry as Record<string, unknown>;
    const operation = clean(row.operation) as SequenceTrajectoryStep["operation"];
    const eventIds = unique(strings(row.eventIds, 6)).filter((id) => valid.has(id));
    const viewerChange = clean(row.viewerChange);
    const nextQuestion = clean(row.nextQuestion);
    if (!operations.has(operation) || !eventIds.length || !viewerChange || !nextQuestion) return null;
    return { order: index + 1, operation, eventIds, viewerChange, nextQuestion };
  }).filter((value): value is SequenceTrajectoryStep => Boolean(value)).slice(0, 8);
}

function candidateFromRelation(truth: AuthorBrainTruth, graph: RealityGraph, relation: ReturnType<typeof searchAuthorMetamorphicRelations>["relations"][number], index: number): SequenceCandidate | null {
  const before = graph.events.find((event) => event.id === relation.beforeEventIds[0]);
  const after = graph.events.find((event) => event.id === relation.afterEventIds[0]);
  if (!before || !after) return null;
  const returningBonus = truth.returning && relation.mechanism === "recurrence" ? 0.2 : 0;
  const contrastBonus = relation.mechanism === "contrast" ? 0.15 : 0;
  const consequenceBonus = relation.mechanism === "consequence" ? 0.12 : 0;
  const score = clamp(relation.score * 0.32 + relation.confidence * 0.28 + returningBonus + contrastBonus + consequenceBonus, 0.55);
  const trajectory: SequenceTrajectoryStep[] = [
    { order: 1, operation: "establish", eventIds: [before.id], viewerChange: "register the first concrete condition", nextQuestion: "what changes the reading?" },
    { order: 2, operation: relation.mechanism === "contrast" ? "contrast" : relation.mechanism === "recurrence" ? "recur" : "reframe", eventIds: [after.id], viewerChange: relation.viewerShift, nextQuestion: relation.after },
    { order: 3, operation: "payoff", eventIds: [before.id, after.id], viewerChange: "see the relationship rather than isolated facts", nextQuestion: "what does this make newly noticeable?" },
  ];
  return {
    id: `candidate-${index + 1}-${relation.id}`,
    lens: relation.creativeOpportunity,
    anchorEventIds: unique(relation.evidenceEventIds),
    supportingRelationKinds: [relation.type],
    trajectory,
    payoff: relation.after,
    unresolvedQuestion: relation.viewerShift,
    evidence: [relation.before, relation.after, relation.feltEffect],
    hypothesis: [relation.feltEffect],
    truthRisk: clamp(1 - relation.confidence, 0.05),
    novelty: score,
    specificity: score,
    informationValue: score,
    uncertainty: clamp(1 - relation.confidence, 0.05),
    attentionPotential: clamp((score + relation.confidence) / 2),
    consequencePotential: clamp(relation.score),
    callbackPotential: relation.mechanism === "recurrence" ? 0.92 : clamp(relation.score * 0.45),
    compressionPotential: 0.72,
    repetitionRisk: 0.1,
    distinctiveness: score,
    score,
  };
}

function fallbackCandidates(truth: AuthorBrainTruth, graph: RealityGraph): SequenceCandidate[] {
  return searchAuthorMetamorphicRelations(graph).relations
    .map((relation, index) => candidateFromRelation(truth, graph, relation, index))
    .filter((candidate): candidate is SequenceCandidate => Boolean(candidate))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function normalizeCandidate(raw: RawCandidate, graph: RealityGraph, index: number): SequenceCandidate | null {
  const valid = new Set(graph.events.map((event) => event.id));
  const anchorEventIds = unique(strings(raw.anchorEventIds, 8)).filter((id) => valid.has(id));
  const trajectory = normalizeTrajectory(raw.trajectory, graph);
  const lens = clean(raw.lens);
  const payoff = clean(raw.payoff);
  const unresolvedQuestion = clean(raw.unresolvedQuestion);
  if (!anchorEventIds.length || trajectory.length < 2 || !lens || !payoff || !unresolvedQuestion) return null;
  return {
    id: clean(raw.id) || `candidate-model-${index + 1}`,
    lens,
    anchorEventIds,
    supportingRelationKinds: strings(raw.supportingRelationKinds, 8),
    trajectory,
    payoff,
    unresolvedQuestion,
    evidence: strings(raw.evidence, 10),
    hypothesis: strings(raw.hypothesis, 6),
    truthRisk: clamp(raw.truthRisk),
    novelty: clamp(raw.novelty),
    specificity: clamp(raw.specificity),
    informationValue: clamp(raw.informationValue),
    uncertainty: clamp(raw.uncertainty),
    attentionPotential: clamp(raw.attentionPotential),
    consequencePotential: clamp(raw.consequencePotential),
    callbackPotential: clamp(raw.callbackPotential),
    compressionPotential: clamp(raw.compressionPotential),
    repetitionRisk: clamp(raw.repetitionRisk),
    distinctiveness: clamp(raw.distinctiveness),
    score: clamp(raw.score),
  };
}

export async function authorCognition(input: { truth: AuthorBrainTruth; reality: RealityGraph }): Promise<AuthorCognitionResult> {
  const metamorphic = searchAuthorMetamorphicRelations(input.reality);
  if (!input.reality.events.length) return { candidates: [], relations: metamorphic, readout: [] };
  const fallback = fallbackCandidates(input.truth, input.reality);

  try {
    const response = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE Cognition.",
          "Discover semantic opportunities; do not write final copy and do not choose the final creative proposition.",
          "Reason over the complete supplied reality, metamorphic relations, memory, returning context, learning, and business context.",
          "Find 4-6 genuinely different interpretations of what is interesting here.",
          "A useful interpretation is a relationship or rule hidden in the facts: priority, hierarchy, contradiction, recurrence, status change, dependency, accumulation, scarcity, excess, precision, transformation, convergence, consequence, anomaly, normalization, or recontextualization.",
          "Memory can make a present event mean something different because it happened before. Never invent a current fact.",
          "Do not serialize the source. Do not make one fact per cut. Do not write slogans. Do not select presentation or production.",
          "Each candidate must be grounded in real event IDs, name its semantic lens, state the hidden hypothesis, and describe a trajectory in which meaning changes.",
          "The strongest candidate is not automatically the most dramatic; prefer high information-per-cut and specific relationships that belong to this reality.",
          "Return JSON only.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          prompt: input.truth.prompt,
          subject: input.truth.subject,
          place: input.truth.place,
          returning: input.truth.returning ?? false,
          visitNumber: input.truth.visitNumber ?? null,
          facts: input.truth.facts.slice(0, 100),
          sourceMoments: input.truth.sourceMoments.slice(0, 100),
          memoryContext: input.truth.memoryContext?.slice(0, 100) ?? [],
          trajectoryContext: input.truth.trajectory?.slice(0, 60) ?? [],
          learning: input.truth.creativeLearningContext?.slice(0, 80) ?? [],
          domain: input.truth.domainContext ?? null,
          events: input.reality.events.slice(0, 100),
          relations: input.reality.relations.slice(0, 100),
          patterns: input.reality.patterns?.slice(0, 40) ?? [],
          metamorphic: metamorphic.relations.slice(0, 24),
        }),
      },
    ], "json", {
      numPredict: 2200,
      numCtx: 16384,
      temperature: 0.88,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["candidates"],
        properties: {
          candidates: {
            type: "array", minItems: 3, maxItems: 6,
            items: {
              type: "object", additionalProperties: false,
              required: ["id", "lens", "anchorEventIds", "supportingRelationKinds", "trajectory", "payoff", "unresolvedQuestion", "evidence", "hypothesis", "truthRisk", "novelty", "specificity", "informationValue", "uncertainty", "attentionPotential", "consequencePotential", "callbackPotential", "compressionPotential", "repetitionRisk", "distinctiveness", "score"],
              properties: {
                id: { type: "string" }, lens: { type: "string" }, anchorEventIds: { type: "array", items: { type: "string" } }, supportingRelationKinds: { type: "array", items: { type: "string" } },
                trajectory: { type: "array", minItems: 2, maxItems: 8, items: { type: "object", additionalProperties: false, required: ["order", "operation", "eventIds", "viewerChange", "nextQuestion"], properties: { order: { type: "number" }, operation: { type: "string" }, eventIds: { type: "array", items: { type: "string" } }, viewerChange: { type: "string" }, nextQuestion: { type: "string" } } } },
                payoff: { type: "string" }, unresolvedQuestion: { type: "string" }, evidence: { type: "array", items: { type: "string" } }, hypothesis: { type: "array", items: { type: "string" } },
                truthRisk: { type: "number" }, novelty: { type: "number" }, specificity: { type: "number" }, informationValue: { type: "number" }, uncertainty: { type: "number" }, attentionPotential: { type: "number" }, consequencePotential: { type: "number" }, callbackPotential: { type: "number" }, compressionPotential: { type: "number" }, repetitionRisk: { type: "number" }, distinctiveness: { type: "number" }, score: { type: "number" },
              },
            },
          },
        },
      },
    });

    const parsed: unknown = JSON.parse(response.text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const raw = (parsed as { candidates?: unknown }).candidates;
      if (Array.isArray(raw)) {
        const normalized = raw.map((item, index) => normalizeCandidate(item as RawCandidate, input.reality, index)).filter((x): x is SequenceCandidate => Boolean(x));
        const distinct = new Map<string, SequenceCandidate>();
        for (const candidate of normalized) {
          const signature = `${candidate.lens}|${candidate.hypothesis.join("|")}|${candidate.anchorEventIds.join(",")}`;
          if (!distinct.has(signature)) distinct.set(signature, candidate);
        }
        if (distinct.size >= 3) {
          return { candidates: [...distinct.values()].sort((a, b) => b.score - a.score).slice(0, 6), relations: metamorphic, readout: input.reality.events.slice(0, 16).map((e) => e.label) };
        }
      }
    }
  } catch {
    // Safe grounded fallback.
  }

  return { candidates: fallback, relations: metamorphic, readout: input.reality.events.slice(0, 16).map((event) => event.label) };
}
