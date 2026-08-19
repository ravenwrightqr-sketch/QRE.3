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

function labelsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const ids = [
    ...(beat.eventIds ?? []),
    ...(beat.setsUp ?? []),
    ...(beat.paysOff ?? []),
  ];

  return [...new Set(
    ids
      .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
      .map(clean)
      .filter(Boolean),
  )];
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
  const ids = new Set(beat.eventIds ?? []);
  return new Set(
    envelope.relations
      .filter((relation) => ids.has(relation.from) || ids.has(relation.to))
      .sort((a, b) => b.strength - a.strength)
      .map((relation) => relation.kind),
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
  const text = clean(value);
  const count = words(text).length;
  if (!text || count < 1 || count > 7) return;
  if (!variants.some((item) => normalize(item) === normalize(text))) {
    variants.push(text);
  }
}

function groundedVariants(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const labels = labelsForBeat(beat, envelope);
  const first = labels[0] ?? "";
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
    }
  }

  const relational =
    relations.has("changes") ||
    relations.has("contrasts") ||
    relations.has("recontextualizes") ||
    clean(beat.realizationMode).toLowerCase().includes("turn") ||
    clean(beat.realizationMode).toLowerCase().includes("reframe");

  if (relational && states.length && actions.length) {
    addBounded(variants, `${states[0]}, then ${actions[0]}`);
    if (subject) addBounded(variants, `${states[0]} ${subject} ${actions[0]}`);
  }

  if (relational && labels.length >= 2) {
    addBounded(variants, `${labels[0]}, then ${labels[1]}`);
    addBounded(variants, `${labels[0]} ${labels[1]}`);
  }

  if (!variants.length && actions.length) {
    addBounded(variants, actions[0]);
  }

  if (!variants.length && first) {
    addBounded(variants, first);
  }

  return variants.slice(0, 8);
}

export function buildGroundedFallbackCandidates(input: {
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate[] {
  return groundedVariants(input.beat, input.envelope).map((text) =>
    scoreMouthCandidate({
      text,
      beat: input.beat,
      envelope: input.envelope,
      priorTexts: input.priorTexts ?? [],
    }),
  );
}
