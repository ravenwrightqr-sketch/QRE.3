/**
 * QRE ENTERPRISE MOUTH · ORCHESTRATION BOUNDARY
 *
 * Qwen proposes variants. QRE derives the RealityEnvelope, scores every
 * candidate, then performs deterministic sequence-level beam selection.
 */
import type { RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import {
  buildAuthorRealityEnvelope,
} from "./authorRealityEnvelope.js";
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidate,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearch.js";
import {
  selectBestMouthSequence,
  type MouthCandidatePool,
} from "./authorMouthSequenceBeamSearch.js";

export type EnterpriseMouthInput = {
  graph: RealityGraph;
  subject: string;
  lens?: string;
  beats: MouthCandidateBeat[];
  priorTexts?: string[];
  revisionGuidance?: string[];
  temperature?: number;
};

export type EnterpriseMouthResult = {
  texts: string[];
  candidates: MouthCandidate[];
  rawModelText: string;
  beamScore: number;
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>;
};

export async function realizeEnterpriseMouth(
  input: EnterpriseMouthInput,
): Promise<EnterpriseMouthResult> {
  const envelope =
    buildAuthorRealityEnvelope({
      graph: input.graph,
      subject: input.subject,
    });

  const candidateMessages =
    buildMouthCandidateMessages({
      envelope,
      beats: input.beats,
      priorTexts: input.priorTexts,
      lens: input.lens,
    });

  if (input.revisionGuidance?.length) {
    candidateMessages[0] = {
      ...candidateMessages[0],
      content:
        `${candidateMessages[0].content}\n\n` +
        "ENTERPRISE REVISION GUIDANCE:\n" +
        input.revisionGuidance
          .slice(0, 16)
          .map((item) => `- ${item}`)
          .join("\n") +
        "\nRegenerate candidates that address these failures. Preserve the approved reality and meaning spine.",
    };
  }

  const result = await localModelGenerate(
    candidateMessages,
    "json",
    {
      numPredict: 1024,
      temperature:
        input.temperature ?? 0.72,
    },
  );

  const parsed = parseMouthCandidateBatch(
    result.text,
  );

  if (!parsed) {
    return {
      texts: [],
      candidates: [],
      rawModelText: result.text,
      beamScore: 0,
      envelope,
    };
  }

  const pools: MouthCandidatePool[] =
    input.beats
      .map((beat) => {
        const entry =
          parsed.variantsByBeat.find(
            (item) =>
              item.order ===
              beat.order,
          );

        const candidates =
          (entry?.variants ?? [])
            .map((text) =>
              scoreMouthCandidate({
                text,
                beat,
                envelope,
                priorTexts:
                  input.priorTexts ?? [],
              }),
            )
            .sort(
              (a, b) =>
                b.score - a.score,
            );

        return {
          order: beat.order,
          candidates,
        };
      })
      .sort(
        (a, b) =>
          a.order - b.order,
      );

  const beam =
    selectBestMouthSequence(
      pools,
      {
        width: 8,
        candidatesPerBeat: 8,
      },
    );

  return {
    texts: beam.texts,
    candidates: beam.candidates,
    rawModelText: result.text,
    beamScore: beam.score,
    envelope,
  };
}
