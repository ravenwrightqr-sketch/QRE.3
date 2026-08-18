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

const QUALITY = {
  minimumGrounding: 0.42,
  minimumMeaning: 0.24,
  maximumInventionRisk: 0.45,
  minimumCompression: 0.45,
  minimumBeamScore: 0.32,
} as const;

function qualityFailures(
  texts: readonly string[],
  candidates: readonly MouthCandidate[],
  beatCount: number,
  beamScore: number,
): string[] {
  const failures: string[] = [];

  if (texts.length !== beatCount) {
    failures.push(`expected ${beatCount} lines, received ${texts.length}`);
  }

  for (const candidate of candidates) {
    if (candidate.groundingScore < QUALITY.minimumGrounding) {
      failures.push(
        `beat ${candidate.beatOrder}: weak-grounding=${candidate.groundingScore}`,
      );
    }
    if (candidate.meaningScore < QUALITY.minimumMeaning) {
      failures.push(
        `beat ${candidate.beatOrder}: weak-meaning=${candidate.meaningScore}`,
      );
    }
    if (candidate.inventionRisk > QUALITY.maximumInventionRisk) {
      failures.push(
        `beat ${candidate.beatOrder}: invention-risk=${candidate.inventionRisk}`,
      );
    }
    if (candidate.compressionScore < QUALITY.minimumCompression) {
      failures.push(
        `beat ${candidate.beatOrder}: poor-compression=${candidate.compressionScore}`,
      );
    }
  }

  if (beamScore < QUALITY.minimumBeamScore) {
    failures.push(`beam-score=${beamScore}`);
  }

  return failures;
}

async function generateBeam(
  input: EnterpriseMouthInput,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
): Promise<{
  resultText: string;
  texts: string[];
  candidates: MouthCandidate[];
  beamScore: number;
}> {
  const candidateMessages = buildMouthCandidateMessages({
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
          .slice(0, 20)
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
      temperature: input.temperature ?? 0.72,
    },
  );

  const parsed = parseMouthCandidateBatch(result.text);

  if (!parsed) {
    return {
      resultText: result.text,
      texts: [],
      candidates: [],
      beamScore: 0,
    };
  }

  const pools: MouthCandidatePool[] = input.beats
    .map((beat) => {
      const entry = parsed.variantsByBeat.find(
        (item) => item.order === beat.order,
      );

      const candidates = (entry?.variants ?? [])
        .map((text) =>
          scoreMouthCandidate({
            text,
            beat,
            envelope,
            priorTexts: input.priorTexts ?? [],
          }),
        )
        .sort((a, b) => b.score - a.score);

      return {
        order: beat.order,
        candidates,
      };
    })
    .sort((a, b) => a.order - b.order);

  const beam = selectBestMouthSequence(pools, {
    width: 8,
    candidatesPerBeat: 8,
  });

  return {
    resultText: result.text,
    texts: beam.texts,
    candidates: beam.candidates,
    beamScore: beam.score,
  };
}

export async function realizeEnterpriseMouth(
  input: EnterpriseMouthInput,
): Promise<EnterpriseMouthResult> {
  const envelope = buildAuthorRealityEnvelope({
    graph: input.graph,
    subject: input.subject,
  });

  let current = await generateBeam(input, envelope);
  let failures = qualityFailures(
    current.texts,
    current.candidates,
    input.beats.length,
    current.beamScore,
  );

  for (let attempt = 0; attempt < 2 && failures.length > 0; attempt += 1) {
    const revised = await generateBeam(
      {
        ...input,
        priorTexts: current.texts,
        revisionGuidance: [
          ...(input.revisionGuidance ?? []),
          "QUALITY GATE FAILED. Do not merely paraphrase the previous candidates.",
          ...failures,
          "Use supplied event labels as lexical anchors whenever possible.",
          "Meaning shifts must be grounded in actual graph relationships.",
          "Concrete verbs are evidence-sensitive: use only supplied actions or direct universal equivalents.",
          "Interpretation may change the reading of evidence, but may not create a new concrete action, object, person, setting, or reaction.",
        ],
        temperature:
          Math.max(
            0.5,
            (input.temperature ?? 0.72) - (attempt + 1) * 0.08,
          ),
      },
      envelope,
    );

    const revisedFailures = qualityFailures(
      revised.texts,
      revised.candidates,
      input.beats.length,
      revised.beamScore,
    );

    if (
      revisedFailures.length < failures.length ||
      (revisedFailures.length === failures.length &&
        revised.beamScore > current.beamScore)
    ) {
      current = revised;
      failures = revisedFailures;
    }
  }

  return {
    texts: current.texts,
    candidates: current.candidates,
    rawModelText: current.resultText,
    beamScore: current.beamScore,
    envelope,
  };
}
