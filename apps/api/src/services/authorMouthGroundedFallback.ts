import type {
  MouthCandidateBeat,
  MouthCandidate,
} from "./authorMouthCandidateSearch.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { scoreMouthCandidate } from "./authorMouthCandidateSearch.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const words = (value: string): string[] =>
  clean(value).split(/\s+/).filter(Boolean);

const normalize = (value: string): string =>
  clean(value).replace(/[.!?]+$/g, "").toLowerCase();

const bounded = (value: string): string =>
  words(value).slice(0, 7).join(" ");

function contractEventIds(beat: MouthCandidateBeat): string[] {
  return [
    ...(beat.eventIds ?? []),
    ...(beat.setsUp ?? []),
    ...(beat.paysOff ?? []),
  ].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index);
}

function labelsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  return contractEventIds(beat)
    .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
    .map(clean)
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((item) => normalize(item) === normalize(value)) === index);
}

function stateLabels(
  labels: readonly string[],
  envelope: RealityEnvelope,
): string[] {
  const states = new Set(envelope.suppliedStates.map(clean).filter(Boolean));
  return labels.filter((label) => states.has(label));
}

function actionLabels(
  labels: readonly string[],
  envelope: RealityEnvelope,
): string[] {
  const actions = envelope.suppliedActions.map(clean).filter(Boolean);
  return labels.filter((label) =>
    actions.some((action) => label.toLowerCase().includes(action.toLowerCase())),
  );
}

function relationKinds(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): Set<string> {
  const ids = new Set(contractEventIds(beat));
  return new Set(
    envelope.relations
      .filter((relation) => ids.has(relation.from) || ids.has(relation.to))
      .sort((a, b) => b.strength - a.strength)
      .map((relation) => relation.kind),
  );
}

function approvedRelations(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): RealityEnvelope["relations"] {
  const ids = new Set(contractEventIds(beat));
  return envelope.relations.filter(
    (relation) => ids.has(relation.from) && ids.has(relation.to),
  );
}

function isHook(beat: MouthCandidateBeat): boolean {
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  const mode = clean(beat.realizationMode).toLowerCase();
  return (
    attention === "hook" ||
    role === "arrival" ||
    role === "establish" ||
    mode === "direct_grounded_realization"
  );
}

function isPayoff(beat: MouthCandidateBeat): boolean {
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  return (
    attention === "payoff" ||
    attention === "release" ||
    role === "payoff" ||
    role === "release"
  );
}

function addBounded(variants: string[], value: string): void {
  const text = bounded(value);
  const count = words(text).length;
  if (!text || count < 1 || count > 7) return;
  if (!variants.some((item) => normalize(item) === normalize(text))) {
    variants.push(text);
  }
}

function addPairVariant(
  variants: string[],
  first: string,
  second: string,
  relationKindsSet: Set<string>,
): void {
  if (!first || !second) return;

  if (
    relationKindsSet.has("contrasts") ||
    relationKindsSet.has("changes")
  ) {
    addBounded(variants, `${first} but ${second}`);
    addBounded(variants, `${second} but ${first}`);
    addBounded(variants, `${first}, still ${second}`);
    addBounded(variants, `${second}, still ${first}`);
    addBounded(variants, `${first} with ${second}`);
  }

  if (relationKindsSet.has("recontextualizes")) {
    addBounded(variants, `${first}, now ${second}`);
    addBounded(variants, `${second}, now ${first}`);
    addBounded(variants, `${first}, apparently ${second}`);
  }

  if (relationKindsSet.has("repeats")) {
    addBounded(variants, `${first}, still ${second}`);
    addBounded(variants, `${second}, again`);
  }

  if (
    relationKindsSet.has("causes") ||
    relationKindsSet.has("converges") ||
    relationKindsSet.has("involves") ||
    relationKindsSet.has("belongs_to")
  ) {
    addBounded(variants, `${first} with ${second}`);
  }
}

function groundedVariants(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const labels = labelsForBeat(beat, envelope);
  const first = labels[0] ?? "";
  const second = labels[1] ?? "";
  const subject = clean(envelope.subject);
  const states = stateLabels(labels, envelope);
  const actions = actionLabels(labels, envelope);
  const relations = relationKinds(beat, envelope);
  const variants: string[] = [];

  if (isPayoff(beat)) {
    addBounded(variants, beat.paysOff?.[0] ?? "");
    return variants;
  }

  if (isHook(beat)) {
    addBounded(variants, first);
    if (subject && first && normalize(first) !== normalize(subject)) {
      addBounded(variants, `${subject} ${first}`);
      addBounded(variants, `${first} ${subject}`);
    }
  }

  const relational =
    relations.has("changes") ||
    relations.has("contrasts") ||
    relations.has("recontextualizes") ||
    relations.has("causes") ||
    relations.has("converges") ||
    relations.has("repeats") ||
    clean(beat.realizationMode).toLowerCase().includes("turn") ||
    clean(beat.realizationMode).toLowerCase().includes("reframe");

  if (relational && states.length && actions.length) {
    addBounded(variants, `${states[0]} but ${actions[0]}`);
    addBounded(variants, `${actions[0]}, still ${states[0]}`);
    addBounded(variants, `${states[0]}, then ${actions[0]}`);
  }

  if (relational && first && second) {
    addPairVariant(variants, first, second, relations);
  }

  if (!variants.length && actions.length) {
    addBounded(variants, actions[0]);
  }

  if (!variants.length && subject && first) {
    addBounded(variants, `${subject} ${first}`);
  }

  if (!variants.length && first) {
    addBounded(variants, first);
  }

  if (!variants.length) {
    addBounded(variants, bounded(clean(beat.change)));
    addBounded(variants, bounded(clean(beat.next || beat.frontier)));
  }

  return variants.slice(0, 8);
}

function normalizeGroundedRelationCandidate(
  candidate: MouthCandidate,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): MouthCandidate {
  const ids = new Set(contractEventIds(beat));
  const supported = new Set(candidate.supportedEventIds);
  const supportedContractIds = [...ids].filter((id) => supported.has(id));
  const relations = approvedRelations(beat, envelope).filter(
    (relation) => supported.has(relation.from) && supported.has(relation.to),
  );

  if (supportedContractIds.length < 2 || !relations.length || isPayoff(beat)) {
    return candidate;
  }

  const expectedKinds = new Set((beat.relationKinds ?? []).map(clean).filter(Boolean));
  const kindHit = relations.some((relation) => expectedKinds.size === 0 || expectedKinds.has(relation.kind));
  if (!kindHit) return candidate;

  const reasons = candidate.reasons.filter((reason) =>
    ![
      "weak-meaning-execution",
      "weak-meaning-transition",
      "weak-obligation-coverage",
      "weak-relation-contract",
    ].includes(reason),
  );

  return {
    ...candidate,
    meaningScore: Math.max(candidate.meaningScore, 0.48),
    transitionScore: Math.max(candidate.transitionScore, 0.45),
    obligationCoverage: Math.max(candidate.obligationCoverage, 0.45),
    relationContractScore: Math.max(candidate.relationContractScore, 0.5),
    score: Math.max(candidate.score, 0.34),
    reasons,
  };
}

export function buildGroundedFallbackCandidates(input: {
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate[] {
  return groundedVariants(input.beat, input.envelope).map((text) => {
    const candidate = normalizeGroundedRelationCandidate(
      scoreMouthCandidate({
        text,
        beat: input.beat,
        envelope: input.envelope,
        priorTexts: input.priorTexts ?? [],
      }),
      input.beat,
      input.envelope,
    );

    return {
      ...candidate,
      reasons: [...new Set([...candidate.reasons, "grounded-fallback"])],
    };
  });
}
