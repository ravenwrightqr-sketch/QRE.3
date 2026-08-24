/**
 * QRE MOUTH ATTENTION CUT GATE
 *
 * A Mouth line is a cinematic cut, not a compressed paragraph.
 * This gate evaluates attention behavior only. It does not own reality,
 * meaning, or endpoint authority.
 */

import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import type { MouthCandidateBeat } from "./authorMouthCandidateSearch.js";

export type MouthAttentionCutInput = {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
};

export type MouthAttentionCutEvaluation = {
  score: number;
  independence: number;
  density: number;
  forwardPull: number;
  nextNeed: number;
  clauseLoad: number;
  sourceRestatement: number;
  attentionChange: number;
  reasons: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function words(text: string): string[] {
  return clean(text)
    .split(/\s+/)
    .filter(Boolean);
}

function normalizedTokens(text: string): Set<string> {
  return new Set(
    words(text)
      .map((word) => word.toLowerCase().replace(/[^a-z0-9'-]/g, ""))
      .filter((word) => word.length >= 3),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function phraseOverlap(text: string, phrase: string): number {
  return overlap(
    normalizedTokens(text),
    normalizedTokens(phrase),
  );
}

function clauseLoad(text: string): number {
  const value = clean(text);
  if (!value) return 1;

  const commas = (value.match(/,/g) ?? []).length;
  const conjunctions = (value.match(/\b(?:and|then|but|while|because|so)\b/gi) ?? []).length;
  const semicolons = (value.match(/;/g) ?? []).length;

  const raw =
    commas * 0.22 +
    conjunctions * 0.28 +
    semicolons * 0.4;

  return Math.min(1, raw);
}

function independence(text: string): number {
  const count = words(text).length;
  if (!count) return 0;
  if (count <= 6) return 1;
  if (count <= 8) return 0.82;
  if (count <= 10) return 0.58;
  return 0.25;
}

function density(text: string): number {
  const count = words(text).length;
  if (!count) return 0;
  if (count <= 5) return 1;
  if (count <= 7) return 0.9;
  if (count <= 9) return 0.72;
  return 0.45;
}

function sourceRestatement(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const ids = [...(beat.eventIds ?? [])].filter(Boolean);
  if (!ids.length) return 0;

  let strongest = 0;
  for (const id of ids) {
    const event = envelope.events.find((candidate) => candidate.id === id);
    if (!event) continue;
    strongest = Math.max(strongest, phraseOverlap(text, event.label));
  }

  return strongest >= 0.95 ? 1 : strongest >= 0.85 ? 0.55 : 0;
}

function nextNeed(
  text: string,
  beat: MouthCandidateBeat,
): number {
  const next = clean(beat.next || beat.frontier || "");
  if (!next) return 0.5;

  const similarity = phraseOverlap(text, next);
  return similarity >= 0.8 ? 0.25 : similarity >= 0.5 ? 0.55 : 0.85;
}

function forwardPull(
  text: string,
  beat: MouthCandidateBeat,
): number {
  const value = clean(text).toLowerCase();
  if (!value) return 0;

  const unresolvedSignals =
    /\b(?:apparently|already|again|still|yet|temporary|temporarily|almost|finally|just|now|next|back|approved|resumed|called|changed|remained|began|started|ended)\b/i;

  const signal = unresolvedSignals.test(value) ? 0.9 : 0.45;

  const transition = clean(beat.next || beat.frontier || "");
  if (!transition) return signal;

  return Math.max(signal, nextNeed(text, beat));
}

function attentionChange(
  text: string,
  beat: MouthCandidateBeat,
  priorTexts: readonly string[],
): number {
  if (!priorTexts.length) {
    return independence(text) >= 0.8 ? 0.75 : 0.55;
  }

  const current = normalizedTokens(text);
  let maxPriorOverlap = 0;

  for (const prior of priorTexts) {
    maxPriorOverlap = Math.max(
      maxPriorOverlap,
      overlap(current, normalizedTokens(prior)),
    );
  }

  const novelty = 1 - maxPriorOverlap;
  const semanticTurn = /\b(?:but|yet|still|now|then|finally|again|temporary|apparently|approved|resumed|called)\b/i.test(text)
    ? 0.85
    : 0.5;

  const requiredSignals = (beat.eventIds ?? []).length;
  const signalBonus = requiredSignals >= 2 ? 0.1 : 0;

  return Math.min(
    1,
    novelty * 0.55 + semanticTurn * 0.35 + signalBonus,
  );
}

export function evaluateAttentionCut(
  input: MouthAttentionCutInput,
): MouthAttentionCutEvaluation {
  const text = clean(input.text);
  const load = clauseLoad(text);
  const independenceScore = independence(text);
  const densityScore = density(text);
  const restatement = sourceRestatement(
    text,
    input.beat,
    input.envelope,
  );
  const pull = forwardPull(text, input.beat);
  const need = nextNeed(text, input.beat);
  const change = attentionChange(
    text,
    input.beat,
    input.priorTexts ?? [],
  );

  const score = Math.max(
    0,
    Math.min(
      1,
      independenceScore * 0.2 +
        densityScore * 0.14 +
        pull * 0.22 +
        need * 0.18 +
        change * 0.26 -
        load * 0.18 -
        restatement * 0.12,
    ),
  );

  const reasons: string[] = [];

  if (load >= 0.45) reasons.push("high-clause-load");
  if (independenceScore < 0.7) reasons.push("weak-cut-independence");
  if (pull < 0.5) reasons.push("weak-forward-pull");
  if (need < 0.5) reasons.push("weak-next-need");
  if (change < 0.5) reasons.push("weak-attention-change");
  if (restatement >= 0.55) reasons.push("attention-source-restatement");
  if (score >= 0.8) reasons.push("strong-moving-cut");

  return {
    score: Number(score.toFixed(3)),
    independence: Number(independenceScore.toFixed(3)),
    density: Number(densityScore.toFixed(3)),
    forwardPull: Number(pull.toFixed(3)),
    nextNeed: Number(need.toFixed(3)),
    clauseLoad: Number(load.toFixed(3)),
    sourceRestatement: Number(restatement.toFixed(3)),
    attentionChange: Number(change.toFixed(3)),
    reasons,
  };
}
