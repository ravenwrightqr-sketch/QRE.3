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
  const recurring = new Set(envelope.recurringSignals.map(clean).filter(Boolean));
  const matched = labels.filter((label) => states.has(label));
  return [...matched].sort((left, right) => {
    const leftRecurring = recurring.has(left) ? 1 : 0;
    const rightRecurring = recurring.has(right) ? 1 : 0;
    return rightRecurring - leftRecurring;
  });
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

  // This fallback is a universal evidence-to-language recovery path. It may
  // use generic connective language, but it never authorizes a domain object,
  // setting, reaction, or concrete action that is absent from the evidence.
  if (subject && first) variants.push(`${subject} ${first}.`);
  if (first && (attention === "hook" || role === "arrival" || role === "establish")) variants.push(`${first}.`);

  if (states.length >= 2 && (relations.includes("contrasts") || relations.includes("changes"))) {
    if (subject) variants.push(`${subject} was ${states[0]}, but ${states[1]}.`);
    variants.push(`${states[0]}, but ${states[1]}.`);
    variants.push(`${states[1]}, even then ${states[0]}.`);
  }

  if (states.length >= 1 && actions.length >= 1) {
    if (subject) variants.push(`${subject} was ${states[0]}, but then ${actions[0]}.`);
    variants.push(`${states[0]}; then ${actions[0]}.`);
    variants.push(`${actions[0]}. That was enough.`);
    variants.push(`${actions[0]}. There it was.`);
  }

  if (actions.length >= 1 && relations.includes("contrasts")) {
    variants.push(`${actions[0]}. That was the turn.`);
  }

  if (second && (relations.includes("contrasts") || relations.includes("changes") || relations.includes("converges"))) {
    variants.push(`${first}; ${second}.`);
    variants.push(`${first}. ${second}.`);
  }

  if (attention === "callback" && first && second) variants.push(`${first}; ${second}.`);

  if (endpoint && (attention === "payoff" || role === "payoff" || attention === "release")) {
    // The endpoint is supplied reality. Preserve it exactly and never append
    // generated language after it.
    if (labels.length >= 2) {
      const prior = labels[labels.length - 2];
      variants.push(`${prior}; ${endpoint}.`);
      variants.push(`${prior}. ${endpoint}.`);
    }
    if (subject) variants.push(`${subject} ${endpoint}.`);
    variants.push(`${endpoint}.`);
  }

  return [...new Set(variants.map(clean).filter(Boolean))].slice(0, 10);
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
