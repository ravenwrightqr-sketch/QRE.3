import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import {
  evaluateMouthLanguage,
} from "./authorMouthLanguageGate.js";
import type {
  MouthCandidate,
  MouthCandidateBeat,
} from "./authorMouthCandidateSearch.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function requiredEventIds(
  beat: MouthCandidateBeat,
): string[] {
  return [
    ...(beat.eventIds ?? []),
    ...(beat.setsUp ?? []),
    ...(beat.paysOff ?? []),
  ].filter(Boolean);
}

function relationMode(beat: MouthCandidateBeat): boolean {
  const mode = clean(
    beat.realizationMode,
  ).toLowerCase();

  return [
    "reframe",
    "contrast",
    "turn",
    "callback",
    "reversal",
    "meaning",
  ].some((value) => mode.includes(value));
}

function transitionCoverage(
  candidate: MouthCandidate,
  beat: MouthCandidateBeat,
): number {
  const required = [
    ...(beat.eventIds ?? []),
  ].filter(Boolean);

  if (!required.length) return 0.5;

  const supported = new Set(
    candidate.supportedEventIds,
  );

  const hits = required.filter((id) =>
    supported.has(id),
  ).length;

  return metric(
    hits / Math.max(1, required.length),
  );
}

export function adaptMouthCandidateQuality(input: {
  candidate: MouthCandidate;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
}): MouthCandidate {
  const { candidate, beat, envelope } = input;
  const language = evaluateMouthLanguage(
    candidate.text,
    envelope,
  );

  const transition = transitionCoverage(
    candidate,
    beat,
  );

  const relationRequired = relationMode(
    beat,
  );

  const meaningPenalty =
    relationRequired && transition < 1
      ? (1 - transition) * 0.35
      : 0;

  const naturalnessPenalty =
    language.fragmentRisk * 0.22 +
    language.keywordAssemblyRisk * 0.2 +
    language.analyticLanguageRisk * 0.2 +
    language.supportedActionRisk * 0.14 +
    language.supportedEntityRisk * 0.08;

  const adaptedMeaning = metric(
    Math.max(
      0,
      candidate.meaningScore -
        meaningPenalty,
    ),
  );

  const adaptedInvention = metric(
    Math.max(
      candidate.inventionRisk,
      language.supportedActionRisk,
      language.supportedEntityRisk,
    ),
  );

  const score = metric(
    candidate.score * 0.62 +
      language.naturalness * 0.16 +
      transition * 0.14 -
      naturalnessPenalty * 0.18 -
      meaningPenalty * 0.2,
  );

  const reasons = [
    ...candidate.reasons,
    ...language.reasons,
  ];

  if (
    relationRequired &&
    transition < 1
  ) {
    reasons.push(
      "incomplete-transition-coverage",
    );
  }

  if (language.accepted === false) {
    reasons.push(
      "language-quality-gate",
    );
  }

  return {
    ...candidate,
    groundingScore: metric(
      candidate.groundingScore * 0.85 +
        language.naturalness * 0.15,
    ),
    meaningScore: adaptedMeaning,
    inventionRisk: adaptedInvention,
    score,
    reasons: [...new Set(reasons)],
  };
}

export function adaptMouthCandidatePool(input: {
  candidates: readonly MouthCandidate[];
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
}): MouthCandidate[] {
  return input.candidates
    .map((candidate) =>
      adaptMouthCandidateQuality({
        candidate,
        beat: input.beat,
        envelope: input.envelope,
      }),
    )
    .sort((a, b) => b.score - a.score);
}
