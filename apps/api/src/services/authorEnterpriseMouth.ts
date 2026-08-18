/**
 * QRE ENTERPRISE MOUTH · ORCHESTRATION BOUNDARY
 *
 * This is the integration seam between the canonical Beat Graph and the
 * deterministic mouth candidate selector. The model proposes variants; QRE
 * selects the surviving realization using RealityGraph-derived evidence.
 */
import type { RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import {
  buildAuthorRealityEnvelope,
} from "./authorRealityEnvelope.js";
import {
  generateAndSelectMouthCandidates,
  type MouthCandidate,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearch.js";

export type EnterpriseMouthInput = {
  graph: RealityGraph;
  subject: string;
  lens?: string;
  beats: MouthCandidateBeat[];
  priorTexts?: string[];
  temperature?: number;
};

export type EnterpriseMouthResult = {
  texts: string[];
  candidates: MouthCandidate[];
  rawModelText: string;
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >;
};

export async function realizeEnterpriseMouth(
  input: EnterpriseMouthInput,
): Promise<EnterpriseMouthResult> {
  const envelope =
    buildAuthorRealityEnvelope({
      graph: input.graph,
      subject: input.subject,
    });

  const modelResult =
    await generateAndSelectMouthCandidates({
      envelope,
      beats: input.beats,
      priorTexts:
        input.priorTexts,
      lens: input.lens,
      model: async (messages) => {
        const result =
          await localModelGenerate(
            messages,
            "json",
            {
              numPredict: 1024,
              temperature:
                input.temperature ?? 0.72,
            },
          );

        return {
          text: result.text,
        };
      },
    });

  return {
    texts: modelResult.texts,
    candidates:
      modelResult.candidates,
    rawModelText:
      modelResult.rawText,
    envelope,
  };
}
