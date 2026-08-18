import type { MouthCandidateBeat, MouthCandidate } from "./authorMouthCandidateSearch.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { scoreMouthCandidate } from "./authorMouthCandidateSearch.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function labelsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const ids = [
    ...(beat.eventIds ?? []),
    ...(beat.setsUp ?? []),
    ...(beat.paysOff ?? []),
  ].filter(Boolean);

  const labels = ids
    .map((id) => envelope.events.find((event) => event.id === id)?.label)
    .filter((value): value is string => Boolean(value))
    .map(clean);

  return [...new Set(labels)];
}

function relationKindsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
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

function groundedVariants(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const labels = labelsForBeat(beat, envelope);
  const first = labels[0] ?? "";
  const second = labels[1] ?? "";
  const endpoint = labels[labels.length - 1] ?? first;
  const subject = clean(envelope.subject);
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  const relations = relationKindsForBeat(beat, envelope);
  const variants: string[] = [];

  if (subject && first) variants.push(`${subject} ${first}.`);
  if (first) variants.push(`${first}.`);

  if ((attention === "hook" || role === "arrival" || role === "establish") && subject && first) {
    variants.push(`${subject}, ${first}.`);
  }

  if (second) {
    if (relations.includes("contrasts")) {
      variants.push(`${first} with ${second}.`);
      variants.push(`${first}; ${second}.`);
    } else if (relations.includes("changes") || relations.includes("converges")) {
      variants.push(`${first}, now ${second}.`);
      variants.push(`${first} — now ${second}.`);
    } else {
      variants.push(`${first}, then ${second}.`);
    }
  }

  if (endpoint && (attention === "payoff" || role === "payoff" || attention === "release")) {
    if (subject) variants.push(`${subject} ${endpoint}.`);
    variants.push(`${endpoint}.`);
  }

  return [...new Set(variants.map(clean).filter(Boolean))].slice(0, 6);
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
