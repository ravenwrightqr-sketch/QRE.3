import type { MouthCandidateBeat, MouthCandidate } from "./authorMouthCandidateSearch.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { scoreMouthCandidate } from "./authorMouthCandidateSearch.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function labelsForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const ids = [...(beat.eventIds ?? []), ...(beat.setsUp ?? []), ...(beat.paysOff ?? [])].filter(Boolean);
  return [
    ...new Set(
      ids
        .map((id) => envelope.events.find((event) => event.id === id)?.label)
        .filter((value): value is string => Boolean(value))
        .map(clean),
    ),
  ];
}

function relationKindsForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const ids = new Set(beat.eventIds ?? []);
  return [
    ...new Set(
      envelope.relations
        .filter((relation) => ids.has(relation.from) || ids.has(relation.to))
        .sort((a, b) => b.strength - a.strength)
        .map((relation) => relation.kind),
    ),
  ];
}

function suppliedStateLabels(labels: readonly string[], envelope: RealityEnvelope): string[] {
  const states = new Set(envelope.suppliedStates.map(clean).filter(Boolean));
  return labels.filter((label) => states.has(label));
}

function suppliedActionLabels(labels: readonly string[], envelope: RealityEnvelope): string[] {
  const actions = new Set(envelope.suppliedActions.map(clean).filter(Boolean));
  return labels.filter((label) =>
    [...actions].some((action: string) => clean(label).toLowerCase().includes(action.toLowerCase())),
  );
}

function groundedVariants(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const labels = labelsForBeat(beat, envelope);
  const first = labels[0] ?? "";
  const second = labels[1] ?? "";
  const endpoint = labels[labels.length - 1] ?? first;
  const subject = clean(envelope.subject);
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  const relations = relationKindsForBeat(beat, envelope);
  const states = suppliedStateLabels(labels, envelope);
  const actions = suppliedActionLabels(labels, envelope);
  const variants: string[] = [];

  // The fallback may only reuse supplied language. It is deliberately
  // domain-neutral: no grooming, wedding, restaurant, pet, or other
  // industry-specific verbs/objects are authorized here.
  if (subject && first) variants.push(`${subject} ${first}.`);
  if (first && (attention === "hook" || role === "arrival" || role === "establish")) variants.push(`${first}.`);

  if (second) {
    // Prefer exact supplied phrases and punctuation over fabricated grammar.
    // The model remains responsible for polished natural-language realization.
    if (states.length >= 2 && (relations.includes("contrasts") || relations.includes("changes"))) {
      variants.push(`${states[0]}; ${states[1]}.`);
      variants.push(`${states[1]}; ${states[0]}.`);
    }
    if (states.length >= 1 && actions.length >= 1) {
      variants.push(`${states[0]}; ${actions[0]}.`);
      variants.push(`${actions[0]}; ${states[0]}.`);
    }
    if (relations.includes("contrasts") || relations.includes("changes") || relations.includes("converges")) {
      variants.push(`${first}; ${second}.`);
      variants.push(`${first}. ${second}.`);
    } else {
      variants.push(`${first}; ${second}.`);
    }
  }

  if (attention === "callback" && first && second) variants.push(`${first}; ${second}.`);

  if (endpoint && (attention === "payoff" || role === "payoff" || attention === "release")) {
    // The endpoint is an exact supplied reality anchor. Never append invented
    // language after it and never replace it with a generated synonym.
    if (labels.length >= 2) {
      const prior = labels[labels.length - 2];
      variants.push(`${prior}; ${endpoint}.`);
      variants.push(`${prior}. ${endpoint}.`);
    }
    if (subject) variants.push(`${subject} ${endpoint}.`);
    variants.push(`${endpoint}.`);
  }

  return [...new Set(variants.map(clean).filter(Boolean))].slice(0, 8);
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
