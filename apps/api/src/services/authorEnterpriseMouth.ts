/**
 * QRE ENTERPRISE MOUTH · ORCHESTRATION BOUNDARY
 *
 * Qwen proposes variants. QRE derives the RealityEnvelope, scores every
 * candidate, applies deterministic language/transition quality, then performs
 * sequence-level beam selection.
 */
import type { RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidate,
  type MouthCandidateBeat,
  type MouthCandidateBatch,
} from "./authorMouthCandidateSearch.js";
import {
  adaptMouthCandidatePool,
} from "./authorMouthQualityAdapter.js";
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
  minimumMeaning: 0.4,
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
    if (
      candidate.reasons.includes("language-quality-gate") ||
      candidate.reasons.includes("weak-natural-language") ||
      candidate.reasons.includes("keyword-assembly") ||
      candidate.reasons.includes("analytic-language")
    ) {
      failures.push(
        `beat ${candidate.beatOrder}: language-quality-failure`,
      );
    }
  }

  if (beamScore < QUALITY.minimumBeamScore) {
    failures.push(`beam-score=${beamScore}`);
  }

  return [...new Set(failures)];
}

function mergeCandidateBatches(
  beats: readonly MouthCandidateBeat[],
  primary: MouthCandidateBatch | undefined,
  recovered: ReadonlyMap<number, string[]>,
): MouthCandidateBatch {
  const variantsByBeat = beats
    .map((beat) => {
      const primaryEntry = primary?.variantsByBeat.find(
        (item) => item.order === beat.order,
      );
      const recoveredVariants = recovered.get(beat.order) ?? [];

      return {
        order: beat.order,
        variants: [
          ...(primaryEntry?.variants ?? []),
          ...recoveredVariants,
        ]
          .map((value) => String(value ?? "").trim())
          .filter(Boolean)
          .filter(
            (value, index, values) =>
              values.indexOf(value) === index,
          )
          .slice(0, 8),
      };
    })
    .filter((entry) => entry.variants.length > 0);

  return { variantsByBeat };
}

async function recoverMissingBeatVariants(
  input: EnterpriseMouthInput,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  missingBeats: readonly MouthCandidateBeat[],
): Promise<ReadonlyMap<number, string[]>> {
  const recovered = new Map<number, string[]>();

  for (const beat of missingBeats) {
    const targetedMessages = buildMouthCandidateMessages({
      envelope,
      beats: [beat],
      priorTexts: input.priorTexts,
      lens: input.lens,
    });

    targetedMessages[0] = {
      ...targetedMessages[0],
      content:
        `${targetedMessages[0].content}\n\n` +
        "TARGETED BEAT RECOVERY:\n" +
        `Generate candidates for beat ${beat.order} ONLY.\n` +
        "Return exactly one variantsByBeat entry with this beat order.\n" +
        "Do not generate any other beat.\n" +
        "Use the supplied anchors for this beat.\n" +
        "Do not describe the planning operation; perform the approved meaning shift.\n" +
        (input.revisionGuidance?.length
          ? input.revisionGuidance
              .slice(-10)
              .map((item) => `- ${item}`)
              .join("\n")
          : ""),
    };

    const result = await localModelGenerate(
      targetedMessages,
      "json",
      {
        numPredict: 512,
        temperature: Math.max(
          0.48,
          input.temperature ?? 0.72,
        ),
      },
    );

    const parsed = parseMouthCandidateBatch(result.text);
    const entry = parsed?.variantsByBeat.find(
      (item) => item.order === beat.order,
    );

    if (entry?.variants.length) {
      recovered.set(
        beat.order,
        entry.variants,
      );
    }
  }

  return recovered;
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
  const expectedOrders = new Set(
    input.beats.map((beat) => beat.order),
  );

  const recovered = await recoverMissingBeatVariants(
    input,
    envelope,
    input.beats.filter(
      (beat) =>
        !parsed?.variantsByBeat.some(
          (item) => item.order === beat.order,
        ),
    ),
  );

  const merged = mergeCandidateBatches(
    input.beats,
    parsed,
    recovered,
  );

  const coverageOrders = new Set(
    merged.variantsByBeat.map(
      (item) => item.order,
    ),
  );

  const missingAfterRecovery =
    [...expectedOrders].filter(
      (order) => !coverageOrders.has(order),
    );

  if (missingAfterRecovery.length) {
    return {
      resultText: result.text,
      texts: [],
      candidates: [],
      beamScore: 0,
    };
  }

  const pools: MouthCandidatePool[] = input.beats
    .map((beat) => {
      const entry = merged.variantsByBeat.find(
        (item) => item.order === beat.order,
      );

      const rawCandidates = (entry?.variants ?? [])
        .map((text) =>
          scoreMouthCandidate({
            text,
            beat,
            envelope,
            priorTexts: input.priorTexts ?? [],
          }),
        );

      const candidates = adaptMouthCandidatePool({
        candidates: rawCandidates,
        beat,
        envelope,
      });

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
          "Write natural language, not keyword fragments. A line like 'Coco nervous' or 'Fierce to bow' is not acceptable simply because its words are grounded.",
          "For multi-signal beats, preserve enough evidence to make the transition legible without naming the operation.",
        ],
        temperature: Math.max(
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
