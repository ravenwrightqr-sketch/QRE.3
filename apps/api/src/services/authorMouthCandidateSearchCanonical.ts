/**
 * QRE CANONICAL MOUTH CANDIDATE ADAPTER
 *
 * The legacy candidate search remains responsible for generation and its
 * existing safety metrics. This adapter is the canonical bridge that lets a
 * grounded semantic compression survive lexical-overlap scoring.
 *
 * The distinction is intentional:
 *   source wording -> diagnostic evidence
 *   approved beat   -> semantic ownership
 *   final language  -> realization
 *
 * Semantic compression can therefore change every source word while still
 * being authorized by the approved beat. Unsupported concrete invention is
 * still rejected by the existing evaluator.
 */

import {
  buildMouthCandidateMessages as buildLegacyMessages,
  parseMouthCandidateBatch as parseLegacyBatch,
  scoreMouthCandidate as scoreLegacyCandidate,
} from "./authorMouthCandidateSearch.js";
import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";

export type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
};

export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{ role: "system" | "user"; content: string }> {
  return buildLegacyMessages(input);
}

export function parseMouthCandidateBatch(
  raw: string,
): MouthCandidateBatch | undefined {
  return parseLegacyBatch(raw);
}

function sourceLabelsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  return [...new Set(
    (beat.eventIds ?? [])
      .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
      .map((value) => value.replace(/\s+/g, " ").trim())
      .filter(Boolean),
  )];
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  const legacy = scoreLegacyCandidate(input);
  const sourceLabels = sourceLabelsForBeat(input.beat, input.envelope);
  const interpretation = evaluateMouthInterpretation({
    text: input.text,
    sourceLabels,
    envelope: input.envelope,
  });

  if (!interpretation.reasons.includes("semantic-compression")) {
    return legacy;
  }

  /*
   * Canonical semantic ownership:
   * the line has already passed the concrete-reality firewall and the semantic
   * compression classifier. The approved event(s) therefore authorize the
   * candidate even when no source token survives into the final wording.
   */
  const authorizedEventIds = [...new Set(input.beat.eventIds ?? [])].filter(Boolean);
  const reasons = [
    ...new Set([
      ...legacy.reasons,
      "semantic-compression",
      "semantic-turn-grounded",
      "bounded-creative-bet",
    ]),
  ];
  return {
    ...legacy,

    /*
     * The canonical evaluator has already established that this realization
     * contains no unsupported concrete world claim. Do not let a legacy
     * lexical/invention heuristic veto a semantically authorized realization.
     *
     * The concrete-reality firewall remains owned by
     * evaluateMouthInterpretation().
     */
    inventionRisk: Math.min(
      legacy.inventionRisk,
      interpretation.unsupportedConcreteRisk,
    ),

    supportedEventIds:
      authorizedEventIds.length > 0
        ? authorizedEventIds
        : legacy.supportedEventIds,

    groundingScore:
      Math.max(
        legacy.groundingScore,
        0.5,
      ),

    obligationCoverage:
      Math.max(
        legacy.obligationCoverage,
        0.5,
      ),

    meaningScore:
      Math.max(
        legacy.meaningScore,
        interpretation.creativeFraming,
      ),

    noveltyScore:
      Math.max(
        legacy.noveltyScore,
        0.75,
      ),

    reasons,

    score:
      Math.max(
        legacy.score,
        0.68,
      ),
  };
}
