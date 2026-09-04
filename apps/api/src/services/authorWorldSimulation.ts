import type {
  LensPressure,
  RealityGraph,
  RealityRelation,
  ViewerBeliefUpdate,
  ViewerExpectation,
  ViewerHypothesis,
  ViewerPredictionError,
  ViewerSimulationState,
  WorldQuestion,
  WorldQuestionType,
  WorldRef,
  WorldRelation,
  WorldRelationKind,
  WorldSimulation,
  WorldSimulationBuildInput,
  WorldSnapshot,
  SimulationCutObjective,
  InterpretationOpportunity,
} from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function eventIds(graph: RealityGraph): string[] {
  return graph.events.map((item) => item.id);
}

function refForEvent(graph: RealityGraph, id: string): WorldRef {
  const item = event(graph, id);
  return {
    id: `world-ref:${id}`,
    kind: "event",
    label: clean(item?.label) || id,
    sourceEventIds: [id],
    sourceEvidenceIds: item?.sourceIds ?? [],
  };
}

function entityRefs(graph: RealityGraph): WorldRef[] {
  const refs = new Map<string, WorldRef>();
  for (const item of graph.events) {
    for (const entity of item.entities ?? []) {
      const key = clean(entity).toLowerCase();
      if (!key) continue;
      const existing = refs.get(key);
      if (existing) {
        existing.sourceEventIds = unique([...existing.sourceEventIds, item.id]);
        existing.sourceEvidenceIds = unique([...existing.sourceEvidenceIds, ...(item.sourceIds ?? [])]);
        continue;
      }
      refs.set(key, {
        id: `world-entity:${key}`,
        kind: "entity",
        label: clean(entity),
        sourceEventIds: [item.id],
        sourceEvidenceIds: [...(item.sourceIds ?? [])],
      });
    }
  }
  return [...refs.values()];
}

function relationLabel(kind: string): string {
  return kind.replace(/_/g, " ");
}

function mapRelationKind(kind: RealityRelation["kind"]): WorldRelationKind | string {
  const map: Partial<Record<RealityRelation["kind"], WorldRelationKind>> = {
    before: "precedes",
    after: "follows",
    causes: "causes",
    changes: "changes",
    contrasts: "contrasts_with",
    repeats: "repeats",
    belongs_to: "belongs_to",
    involves: "interacts_with",
    recontextualizes: "recontextualizes",
    converges: "converges_with",
  };
  return map[kind] ?? kind;
}

function worldRelations(graph: RealityGraph): WorldRelation[] {
  return graph.relations.map((relation, index) => ({
    id: `world-relation:${index + 1}`,
    from: refForEvent(graph, relation.from),
    to: refForEvent(graph, relation.to),
    kind: mapRelationKind(relation.kind),
    strength: metric(relation.strength),
    explicitness: relation.kind === "before" || relation.kind === "after" ? "derived" : "hypothesized",
    evidenceEventIds: unique([relation.from, relation.to]),
    evidenceRelations: [`reality:${relation.kind}`],
    temporalContext: relation.kind === "before" || relation.kind === "after"
      ? { kind: "explicit", label: relationLabel(relation.kind) }
      : { kind: "unknown" },
    persistence: relation.kind === "repeats" ? "recurring" : relation.kind === "belongs_to" ? "durable" : "episode",
  }));
}

function strongestRelations(relations: readonly WorldRelation[], minimum = 0.55): WorldRelation[] {
  return relations.filter((relation) => relation.strength >= minimum).sort((a, b) => b.strength - a.strength);
}

function questionFor(relation: WorldRelation): WorldQuestion | undefined {
  const typeByRelation: Record<string, WorldQuestionType> = {
    causes: "causal",
    recontextualizes: "meaning",
    repeats: "return",
    changes: "consequence",
    contrasts_with: "relational",
    converges_with: "meaning",
    precedes: "temporal",
    follows: "temporal",
    interacts_with: "relational",
  };
  const type = typeByRelation[relation.kind];
  if (!type) return undefined;
  const from = relation.from.label;
  const to = relation.to.label;
  const text = relation.kind === "recontextualizes"
    ? `What does ${from} make newly meaningful about ${to}?`
    : relation.kind === "repeats"
      ? `Why does ${from} return here?`
      : relation.kind === "changes"
        ? `What changed between ${from} and ${to}?`
        : relation.kind === "causes"
          ? `What follows from ${from} and ${to}?`
          : `What connects ${from} with ${to}?`;
  return {
    id: `world-question:${relation.id}`,
    type,
    text,
    openedByEventIds: unique(relation.evidenceEventIds),
    supportedByRelationIds: [relation.id],
    pressure: metric(relation.strength * (relation.kind === "recontextualizes" ? 1 : 0.84)),
    resolved: false,
    resolutionEventIds: [],
  };
}

function inferExpectation(question: WorldQuestion, relation: WorldRelation): ViewerExpectation {
  return {
    id: `expectation:${question.id}`,
    proposition: question.text,
    basisEventIds: [...question.openedByEventIds],
    basisRelationIds: [relation.id],
    confidence: metric(question.pressure * 0.86),
    horizon: question.type === "return" ? "episode" : "near",
    violatedByEventIds: [],
    fulfilledByEventIds: [],
  };
}

function hypothesisFor(question: WorldQuestion, relation: WorldRelation): ViewerHypothesis {
  return {
    id: `hypothesis:${question.id}`,
    interpretation: question.text,
    supportingEventIds: [...question.openedByEventIds],
    supportingRelationIds: [relation.id],
    contradictingEventIds: [],
    confidence: metric(question.pressure * 0.72),
    status: "forming",
    competingHypothesisIds: [],
  };
}

function predictionErrorFor(expectation: ViewerExpectation, observedEventId: string, observedLabel: string, magnitude: number): ViewerPredictionError {
  return {
    id: `prediction-error:${expectation.id}:${observedEventId}`,
    expectationId: expectation.id,
    observedEventId,
    expected: expectation.proposition,
    observed: observedLabel,
    magnitude: metric(magnitude),
    causesModelUpdate: magnitude >= 0.58,
  };
}

function lensPressure(label: string | undefined): LensPressure | undefined {
  const normalized = clean(label).toLowerCase();
  if (!normalized) return undefined;
  const presets: Record<string, Omit<LensPressure, "id" | "label">> = {
    comedy: { attentionPriorities: ["status", "contrast", "recurrence", "underreaction"], preferredRelations: ["contrasts_with", "recontextualizes", "repeats", "changes"], preferredQuestionTypes: ["relational", "meaning", "return"], realizationMoves: ["understatement", "status_inversion", "callback"], statusFrames: ["inversion", "deadpan"], juxtapositionModes: ["high_status_low_stakes", "ordinary_against_extraordinary"], permissiblePersonification: "light", explanationPressure: 0.08, intensity: 0.65 },
    horror: { attentionPriorities: ["presence", "absence", "observation", "recurrence"], preferredRelations: ["observed_by", "repeats", "recontextualizes", "contrasts_with"], preferredQuestionTypes: ["identity", "meaning", "prediction"], realizationMoves: ["restraint", "normalcy_under_pressure", "callback"], statusFrames: ["matter_of_fact"], juxtapositionModes: ["ordinary_against_unresolved", "quiet_after_change"], permissiblePersonification: "light", explanationPressure: 0.05, intensity: 0.72 },
    romance: { attentionPriorities: ["continuity", "proximity", "return", "recognition"], preferredRelations: ["interacts_with", "repeats", "returns_to", "recontextualizes"], preferredQuestionTypes: ["relational", "return", "meaning"], realizationMoves: ["understatement", "recognition", "callback"], statusFrames: ["intimacy", "shared_history"], juxtapositionModes: ["small_detail_large_meaning"], permissiblePersonification: "light", explanationPressure: 0.08, intensity: 0.62 },
  noir: { attentionPriorities: ["observation", "absence", "implication", "recontextualization"], preferredRelations: ["observes", "recontextualizes", "contrasts_with", "repeats"], preferredQuestionTypes: ["meaning", "identity", "causal"], realizationMoves: ["implication", "understatement", "compression"], statusFrames: ["ambiguous", "judicial"], juxtapositionModes: ["evidence_against_context"], permissiblePersonification: "light", explanationPressure: 0.04, intensity: 0.58 },
    game: { attentionPriorities: ["progression", "threshold", "status", "return"], preferredRelations: ["changes", "repeats", "converges_with", "causes"], preferredQuestionTypes: ["consequence", "prediction", "return"], realizationMoves: ["status_inversion", "progression", "callback"], statusFrames: ["level", "unlock", "boss"], juxtapositionModes: ["mundane_as_system", "detail_as_reward"], permissiblePersonification: "strong", explanationPressure: 0.1, intensity: 0.68 },
    spy: { attentionPriorities: ["observation", "access", "absence", "convergence"], preferredRelations: ["observes", "interacts_with", "recontextualizes", "converges_with"], preferredQuestionTypes: ["causal", "identity", "meaning"], realizationMoves: ["implication", "compression", "recontextualization"], statusFrames: ["operation", "surveillance"], juxtapositionModes: ["ordinary_as_cover", "detail_as_evidence"], permissiblePersonification: "strong", explanationPressure: 0.06, intensity: 0.63 },
  };
  const preset = presets[normalized];
  if (!preset) return {
    id: `lens:${normalized}`,
    label: normalized,
    attentionPriorities: ["novelty", "relationship_change", "recurrence", "salience"],
    preferredRelations: ["changes", "contrasts_with", "recontextualizes", "repeats", "converges_with"],
    preferredQuestionTypes: ["meaning", "relational", "consequence", "prediction"],
    realizationMoves: ["compression", "implication", "callback"],
    statusFrames: ["contextual"],
    juxtapositionModes: ["detail_against_context"],
    permissiblePersonification: "light",
    explanationPressure: 0.08,
    intensity: 0.55,
  };
  return { id: `lens:${normalized}`, label: normalized, ...preset };
}

function compatibility(opportunityRelations: WorldRelation[], lens?: LensPressure): { grounding: number; lensFit: number } {
  if (!opportunityRelations.length) return { grounding: 0, lensFit: 0 };
  const grounding = metric(opportunityRelations.reduce((sum, relation) => sum + relation.strength, 0) / opportunityRelations.length);
  if (!lens) return { grounding, lensFit: 1 };
  const hits = opportunityRelations.filter((relation) => lens.preferredRelations.includes(relation.kind as WorldRelationKind)).length;
  return { grounding, lensFit: metric(hits / Math.max(1, opportunityRelations.length)) };
}

function opportunities(graph: RealityGraph, relations: WorldRelation[], questions: WorldQuestion[], lens?: LensPressure): InterpretationOpportunity[] {
  const grouped = new Map<string, WorldRelation[]>();
  for (const relation of strongestRelations(relations, 0.5)) {
    const key = [...relation.evidenceEventIds].sort().join(":");
    const bucket = grouped.get(key) ?? [];
    bucket.push(relation);
    grouped.set(key, bucket);
  }

  return [...grouped.values()].slice(0, 24).map((bucket, index) => {
    const questionIds = questions.filter((question) => bucket.some((relation) => question.supportedByRelationIds.includes(relation.id))).map((question) => question.id);
    const ids = unique(bucket.flatMap((relation) => relation.evidenceEventIds));
    const compatibilityScore = compatibility(bucket, lens);
    const relationText = bucket.slice(0, 3).map((relation) => relation.kind.replace(/_/g, " ")).join(", ");
    return {
      id: `opportunity:${index + 1}`,
      hypothesis: `The supplied constellation may be read through ${relationText}.`,
      relationIds: bucket.map((relation) => relation.id),
      eventIds: ids,
      questionIds,
      compatibleLenses: lens ? [lens] : [],
      inferenceDistance: metric(0.35 + compatibilityScore.grounding * 0.35 + (bucket.length > 1 ? 0.2 : 0)),
      grounding: compatibilityScore.grounding,
      novelty: metric(Math.min(1, 0.32 + bucket.length * 0.11 + compatibilityScore.lensFit * 0.24)),
      ambiguity: metric(bucket.length > 1 ? 0.72 : 0.46),
      continuationPotential: metric(Math.max(...bucket.map((relation) => relation.kind === "repeats" || relation.kind === "recontextualizes" ? 0.82 : 0.42))),
    };
  });
}

function snapshots(graph: RealityGraph, refs: WorldRef[], relations: WorldRelation[], questions: WorldQuestion[]): WorldSnapshot[] {
  return graph.events.map((current, index) => {
    const priorIds = graph.events.slice(0, index + 1).map((item) => item.id);
    const activeRefs = refs.filter((ref) => ref.sourceEventIds.some((id) => priorIds.includes(id)));
    const activeRelations = relations.filter((relation) => relation.evidenceEventIds.some((id) => priorIds.includes(id)));
    const changed = new Set<Parameters<typeof changedDimensions>[0]>();
    for (const relation of activeRelations.filter((item) => item.evidenceEventIds.includes(current.id))) {
      if (["precedes", "follows"].includes(relation.kind)) changed.add("time");
      else if (["interacts_with", "converges_with", "contrasts_with", "recontextualizes"].includes(relation.kind)) changed.add("relationship");
      else if (["changes", "causes"].includes(relation.kind)) changed.add("status");
    }
    return {
      id: `snapshot:${index + 1}`,
      eventIds: priorIds,
      activeRefs,
      activeRelations,
      changedDimensions: [...changed],
      stableDimensions: ["participants", "identity"].filter((dimension) => activeRefs.length > 0) as WorldSnapshot["stableDimensions"],
      unresolved: questions.filter((question) => question.openedByEventIds.some((id) => priorIds.includes(id)) && !question.resolved),
      timestampLabel: current.time,
    };
  });
}

function changedDimensions(value: string): WorldSnapshot["changedDimensions"][number] {
  return value as WorldSnapshot["changedDimensions"][number];
}

function attentionField(refs: WorldRef[], relations: WorldRelation[], questions: WorldQuestion[]): ViewerSimulationState["attentionField"] {
  const result: ViewerSimulationState["attentionField"] = [];
  for (const relation of strongestRelations(relations).slice(0, 10)) {
    const reason = relation.kind === "repeats" ? "recurrence" : relation.kind === "changes" ? "status_change" : relation.kind === "recontextualizes" ? "relationship_change" : "salience";
    result.push({ ref: relation.to, reason, strength: relation.strength, durationHint: relation.kind === "recontextualizes" ? "return" : "hold" });
  }
  for (const question of questions.slice(0, 6)) {
    const ref = refs.find((item) => item.sourceEventIds.includes(question.openedByEventIds[0] ?? ""));
    if (ref) result.push({ ref, reason: "unresolved_question", strength: question.pressure, durationHint: "return" });
  }
  return result.slice(0, 16);
}

export function buildAuthorWorldSimulation(input: WorldSimulationBuildInput): WorldSimulation {
  const reality = input.reality;
  const eventRefs = eventIds(reality).map((id) => refForEvent(reality, id));
  const refs = [...eventRefs, ...entityRefs(reality)];
  const relations = worldRelations(reality);
  const questions = strongestRelations(relations)
    .map(questionFor)
    .filter((question): question is WorldQuestion => Boolean(question))
    .slice(0, 24);
  const relationById = new Map(relations.map((relation) => [relation.id, relation]));
  const expectations = questions.map((question) => inferExpectation(question, relationById.get(question.supportedByRelationIds[0] ?? "")!)).filter(Boolean);
  const hypotheses = questions.map((question) => hypothesisFor(question, relationById.get(question.supportedByRelationIds[0] ?? "")!)).filter(Boolean);
  const predictionErrors: ViewerPredictionError[] = [];
  const updates: ViewerBeliefUpdate[] = [];
  for (const expectation of expectations.slice(0, 8)) {
    const observed = expectation.basisEventIds.at(-1);
    if (!observed) continue;
    const observedLabel = clean(event(reality, observed)?.label);
    const relation = relationById.get(expectation.basisRelationIds[0] ?? "");
    const magnitude = relation?.kind === "contrasts_with" || relation?.kind === "recontextualizes" ? 0.78 : relation?.kind === "changes" ? 0.64 : 0.38;
    if (magnitude < 0.5) continue;
    const error = predictionErrorFor(expectation, observed, observedLabel, magnitude);
    predictionErrors.push(error);
    const hypothesis = hypotheses.find((item) => item.id.replace("hypothesis:", "") === expectation.id.replace("expectation:", ""));
    if (hypothesis) hypothesis.status = "reframed";
    updates.push({ id: `belief-update:${expectation.id}`, triggerEventIds: [observed], priorHypothesisIds: hypothesis ? [hypothesis.id] : [], posteriorHypothesisIds: hypothesis ? [hypothesis.id] : [], predictionErrorId: error.id, explanationPressure: metric(magnitude * 0.72), novelty: metric(magnitude) });
  }
  const unresolvedQuestions = questions.filter((question) => question.pressure >= 0.45);
  const viewer: ViewerSimulationState = {
    known: refs.filter((ref) => ref.kind === "event").slice(0, 12),
    expectations,
    hypotheses,
    unresolvedQuestions,
    predictionErrors,
    updates,
    attentionField: attentionField(refs, relations, unresolvedQuestions),
    confidence: metric(0.42 + relations.length / Math.max(1, reality.events.length * 2)),
  };
  const lens = lensPressure(input.lens);
  const interpretationOpportunities = opportunities(reality, relations, questions, lens);
  const snapshotList = snapshots(reality, refs, relations, questions);
  const cutObjectives: SimulationCutObjective[] = [];
  for (let index = 0; index < Math.min(12, snapshotList.length); index += 1) {
    const snapshot = snapshotList[index]!;
    const eventId = snapshot.eventIds.at(-1);
    if (!eventId) continue;
    const prior = snapshotList[index - 1];
    const relevantRelations = snapshot.activeRelations.filter((relation) => relation.evidenceEventIds.includes(eventId));
    const relevantQuestions = questions.filter((question) => question.openedByEventIds.includes(eventId));
    const role = relevantRelations.some((relation) => relation.kind === "recontextualizes")
      ? "recontextualize"
      : relevantRelations.some((relation) => relation.kind === "contrasts_with")
        ? "prediction_error"
        : relevantQuestions.length
          ? "question"
          : index === snapshotList.length - 1
            ? "payoff"
            : index === 0
              ? "establish"
              : "notice";
    cutObjectives.push({
      id: `cut-objective:${index + 1}`,
      role,
      sourceEventIds: [eventId],
      sourceRelationIds: relevantRelations.map((relation) => relation.id),
      viewerBefore: prior ? viewerStateAt(prior, viewer, questions) : viewer,
      viewerAfter: viewerStateAt(snapshot, viewer, questions),
      desiredInference: relevantQuestions[0]?.text,
      forbiddenExplanation: relevantQuestions.length ? relevantQuestions[0]?.text : undefined,
      nextQuestion: relevantQuestions[0]?.text,
    });
  }
    const hasSuppliedRecurrence = reality.recurringSignals.length > 0;
  const durableThreads = questions
    .filter((question) =>
      question.type === "return" ||
      question.type === "meaning" ||
      question.pressure >= 0.7 ||
      (hasSuppliedRecurrence && question.type === "relational")
    )
    .slice(0, 8);
  const remembered = input.rememberedRefIds ?? [];
  return {
    version: 1,
    reality,
    refs,
    relations,
    snapshots: snapshotList,
    questions,
    interpretationOpportunities,
    viewer,
    lensPressure: lens,
    cutObjectives,
    durableThreads,
    reentry: {
      priorExperienceIds: input.priorExperienceIds ?? [],
      rememberedRefIds: remembered,
      changedContextRefIds: unique(snapshotList.slice(-2).flatMap((snapshot) => snapshot.eventIds)),
      eligibleCallbacks: durableThreads.map((question) => question.id),
      meaningCanChange: Boolean((input.priorExperienceIds?.length || remembered.length)),
    },
  };
}

function viewerStateAt(snapshot: WorldSnapshot, base: ViewerSimulationState, questions: WorldQuestion[]): ViewerSimulationState {
  const ids = new Set(snapshot.eventIds);
  const unresolvedQuestions = questions.filter((question) => question.openedByEventIds.some((id) => ids.has(id)) && !question.resolved);
  const known = base.known.filter((ref) => ref.sourceEventIds.some((id) => ids.has(id)));
  const activeHypotheses = base.hypotheses.filter((hypothesis) => hypothesis.supportingEventIds.some((id) => ids.has(id)));
  const predictionErrors = base.predictionErrors.filter((error) => ids.has(error.observedEventId));
  return {
    ...base,
    known,
    unresolvedQuestions,
    hypotheses: activeHypotheses,
    predictionErrors,
    updates: base.updates.filter((update) => update.triggerEventIds.some((id) => ids.has(id))),
    attentionField: base.attentionField.filter((focus) => focus.ref.sourceEventIds.some((id) => ids.has(id))),
    currentSnapshotId: snapshot.id,
    dominantHypothesisId: activeHypotheses.sort((a, b) => b.confidence - a.confidence)[0]?.id,
    confidence: metric(0.35 + known.length / Math.max(1, snapshot.eventIds.length + 1) * 0.4 + activeHypotheses.length * 0.03),
  };
}
