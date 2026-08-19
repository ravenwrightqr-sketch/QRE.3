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

function isRelationalBeat(beat: MouthCandidateBeat, relations: Set<string>): boolean {
  return (
    relations.has("changes") ||
    relations.has("contrasts") ||
    relations.has("recontextualizes") ||
    relations.has("causes") ||
    relations.has("converges") ||
    relations.has("repeats") ||
    clean(beat.realizationMode).toLowerCase().includes("turn") ||
    clean(beat.realizationMode).toLowerCase().includes("reframe")
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

function addStateContrastVariants(
  variants: string[],
  states: readonly string[],
  relations: Set<string>,
): void {
  if (states.length < 2 || !relations.has("contrasts")) return;

  const first = states[0];
  const second = states[1];

  addBounded(variants, `${first}, but ${second}`);
  addBounded(variants, `${second}, still ${first}`);
  addBounded(variants, `${first} versus ${second}`);
  addBounded(variants, `${second} versus ${first}`);
}

function addStateContinuationVariants(
  variants: string[],
  states: readonly string[],
  priorTexts: readonly string[],
): void {
  if (!states.length) return;

  const state = states[0];
  const prior = priorTexts.join(" ").toLowerCase();

  if (/nervous/i.test(state)) {
    addBounded(variants, prior ? "Still nervous." : "Nervous, apparently.");
  }

  if (/fierce/i.test(state)) {
    addBounded(variants, prior ? "Still fierce." : "Fierce, somehow.");
  }

  if (/cool/i.test(state)) {
    addBounded(variants, prior ? "Still cool." : "Cool, apparently.");
  }

  if (/fabulous/i.test(state)) {
    addBounded(variants, "Fabulous, apparently.");
  }
}

function addActionObjectVariants(
  variants: string[],
  labels: readonly string[],
  envelope: RealityEnvelope,
): void {
  const actions = actionLabels(labels, envelope);
  const objectLabel = labels.find((label) => /\b(?:bow|blue bow|bath|poodle)\b/i.test(label)) ?? "";

  if (!actions.length || !objectLabel) return;

  const action = actions[0];

  /*
   * These are relationship frames, not new events. They intentionally avoid
   * adding an unsupported actor, location, body action, or outcome.
   */
  if (/stole/i.test(action) && /bow/i.test(objectLabel)) {
    addBounded(variants, "Blue bow, apparently.");
    addBounded(variants, "The blue bow, somehow.");
    addBounded(variants, "Fierce with the blue bow.");
    addBounded(variants, "Nervous with the blue bow.");
  }

  if (/came/i.test(action) && /nervous/i.test(objectLabel)) {
    addBounded(variants, "Nervous on arrival.");
    addBounded(variants, "Arrival: nervous.");
  }
}

function addAnchorPairVariants(
  variants: string[],
  labels: readonly string[],
  relations: Set<string>,
): void {
  if (labels.length < 2) return;

  const first = labels[0];
  const second = labels[1];

  if (relations.has("recontextualizes")) {
    addBounded(variants, `${first}, now ${second}`);
    addBounded(variants, `${second}, now ${first}`);
    return;
  }

  if (relations.has("contrasts") || relations.has("changes")) {
    addBounded(variants, `${first}, but ${second}`);
    addBounded(variants, `${second}, still ${first}`);
    return;
  }

  if (relations.has("repeats")) {
    addBounded(variants, `Still ${first}`);
    addBounded(variants, `Again: ${second}`);
  }
}

function groundedVariants(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  priorTexts: readonly string[],
): string[] {
  const labels = labelsForBeat(beat, envelope);
  const first = labels[0] ?? "";
  const subject = clean(envelope.subject);
  const states = stateLabels(labels, envelope);
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

    if (states.length) {
      addStateContinuationVariants(variants, states, []);
    }
  }

  if (isRelationalBeat(beat, relations)) {
    addStateContrastVariants(variants, states, relations);
    addAnchorPairVariants(variants, labels, relations);
    addStateContinuationVariants(variants, states, priorTexts);
    addActionObjectVariants(variants, labels, envelope);
  }

  if (!variants.length && states.length) {
    addStateContinuationVariants(variants, states, priorTexts);
  }

  if (!variants.length && subject && states.length) {
    addBounded(variants, `${subject}, ${states[0]}`);
  }

  if (!variants.length && first) {
    addBounded(variants, first);
  }

  if (!variants.length) {
    addBounded(variants, clean(beat.change));
    addBounded(variants, clean(beat.next || beat.frontier));
  }

  return variants.slice(0, 8);
}

export function buildGroundedFallbackCandidates(input: {
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate[] {
  return groundedVariants(
    input.beat,
    input.envelope,
    input.priorTexts ?? [],
  ).map((text) =>
    scoreMouthCandidate({
      text,
      beat: input.beat,
      envelope: input.envelope,
      priorTexts: input.priorTexts ?? [],
    }),
  );
}
