/**
 * QRE ENTERPRISE MOUTH · ORCHESTRATION BOUNDARY
 *
 * Qwen proposes language variants. QRE owns reality, meaning, realization
 * constraints, candidate scoring, repair objectives, sequence selection, and
 * enterprise diagnostics.
 *
 * Performance law:
 *   - one primary batch generation
 *   - at most one batched recovery generation
 *   - at most one final revision generation in full mode
 *
 * Missing beats are recovered in ONE request, never one request per beat.
 */
import type { RealityGraph, AuthorCreativeCritique } from "@qre/contracts";
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
import { adaptMouthCandidatePool } from "./authorMouthQualityAdapter.js";
import {
  selectBestMouthSequence,
  type MouthCandidatePool,
} from "./authorMouthSequenceBeamSearch.js";
import { buildMeaningSpine, type MeaningSpine } from "./authorMeaningSpine.js";
import { buildRealizationSlots, type RealizationSlot } from "./authorMouthRealizationSlot.js";
import {
  buildMouthRepairObjectives,
  compactRepairInstructions,
  type MouthRepairObjective,
} from "./authorMouthRepairPlanner.js";
import {
  getEnterpriseMouthPolicy,
  type EnterpriseMouthExecutionPolicy,
} from "./authorEnterpriseMouthPolicy.js";
import {
  buildEnterpriseIntelligence,
  type EnterpriseIntelligenceContext,
} from "./authorEnterpriseIntelligence.js";
import {
  buildCumulativeMeaningState,
  evaluateCumulativeMeaning,
} from "./authorCumulativeMeaning.js";
import { detectAuthorSafetyViolations } from "./authorEnterpriseSafety.js";
import { critiqueCreativeSelection, surpriseScore } from "./authorCreativeSearch.js";

export type EnterpriseMouthInput = {
  graph: RealityGraph;
  subject: string;
  lens?: string;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  revisionGuidance?: readonly string[];
  temperature?: number;
};

export type EnterpriseMouthResult = {
  texts: string[];
  candidates: MouthCandidate[];
  rawModelText: string;
  beamScore: number;
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>;
  meaningSpine: MeaningSpine;
  realizationSlots: RealizationSlot[];
  repairObjectives: MouthRepairObjective[];
  policy: EnterpriseMouthExecutionPolicy;
  modelCallCount: number;
  enterpriseIntelligence: EnterpriseIntelligenceContext;
  cumulativeMeaningScore: number;
  creativeCritique: AuthorCreativeCritique;
  safetyViolations: string[];
  groundedSurprise: number;
};

const QUALITY = {
  minimumGrounding: 0.42,
  minimumMeaning: 0.4,
  maximumInventionRisk: 0.45,
  minimumCompression: 0.45,
  minimumBeamScore: 0.32,
} as const;

const MAX_CANONICAL_BEATS = 6;

function canonicalizeBeats(beats: readonly MouthCandidateBeat[]): MouthCandidateBeat[] {
  return beats
    .filter(
      (beat) =>
        beat &&
        Number.isFinite(Number(beat.order)) &&
        Number(beat.order) > 0,
    )
    .slice()
    .sort((a, b) => Number(a.order) - Number(b.order))
    .filter(
      (beat, index, values) =>
        values.findIndex(
          (candidate) => Number(candidate.order) === Number(beat.order),
        ) === index,
    )
    .slice(0, MAX_CANONICAL_BEATS)
    .map((beat, index) => ({
      ...beat,
      order: index + 1,
      eventIds: Array.isArray(beat.eventIds)
        ? [...new Set(beat.eventIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0))]
        : [],
      setsUp: Array.isArray(beat.setsUp)
        ? [...new Set(beat.setsUp.filter((value): value is string => typeof value === "string" && value.trim().length > 0))]
        : [],
      paysOff: Array.isArray(beat.paysOff)
        ? [...new Set(beat.paysOff.filter((value): value is string => typeof value === "string" && value.trim().length > 0))]
        : [],
    }));
}

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
      failures.push(`beat ${candidate.beatOrder}: weak-grounding=${candidate.groundingScore}`);
    }
    if (candidate.meaningScore < QUALITY.minimumMeaning) {
      failures.push(`beat ${candidate.beatOrder}: weak-meaning=${candidate.meaningScore}`);
    }
    if (candidate.inventionRisk > QUALITY.maximumInventionRisk) {
      failures.push(`beat ${candidate.beatOrder}: invention-risk=${candidate.inventionRisk}`);
    }
    if (candidate.compressionScore < QUALITY.minimumCompression) {
      failures.push(`beat ${candidate.beatOrder}: poor-compression=${candidate.compressionScore}`);
    }
    if (
      candidate.reasons.includes("language-quality-gate") ||
      candidate.reasons.includes("weak-natural-language") ||
      candidate.reasons.includes("keyword-assembly") ||
      candidate.reasons.includes("analytic-language") ||
      candidate.reasons.includes("analytic-realization-language")
    ) {
      failures.push(`beat ${candidate.beatOrder}: language-quality-failure`);
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
  limit: number,
): MouthCandidateBatch {
  const variantsByBeat = beats
    .map((beat) => {
      const primaryEntry = primary?.variantsByBeat.find((item) => item.order === beat.order);
      const recoveredVariants = recovered.get(beat.order) ?? [];

      return {
        order: beat.order,
        variants: [
          ...(primaryEntry?.variants ?? []),
          ...recoveredVariants,
        ]
          .map((value) => String(value ?? "").trim())
          .filter(Boolean)
          .filter((value, index, values) => values.indexOf(value) === index)
          .slice(0, Math.max(1, limit)),
      };
    })
    .filter((entry) => entry.variants.length > 0);

  return { variantsByBeat };
}

async function recoverMissingBeatVariants(
  input: EnterpriseMouthInput,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  missingBeats: readonly MouthCandidateBeat[],
  policy: EnterpriseMouthExecutionPolicy,
): Promise<{ recovered: ReadonlyMap<number, string[]>; modelCalls: number }> {
  const recovered = new Map<number, string[]>();

  if (!missingBeats.length || policy.maxRecoveryCalls <= 0 || policy.mode === "no-model") {
    return { recovered, modelCalls: 0 };
  }

  const targetedMessages = buildMouthCandidateMessages({
    envelope,
    beats: missingBeats,
    priorTexts: input.priorTexts ? [...input.priorTexts] : undefined,
    lens: input.lens,
  });

  targetedMessages[0] = {
    ...targetedMessages[0],
    content:
      `${targetedMessages[0].content}\n\n` +
      "BATCHED BEAT RECOVERY:\n" +
      `Recover ONLY the missing beat orders: ${missingBeats.map((beat) => beat.order).join(", ")}.\n` +
      "Return one variantsByBeat entry for each requested order and no others.\n" +
      `Maximum variants per beat: ${policy.variantsPerBeat}.\n` +
      "Use supplied anchors for each beat.\n" +
      "Do not create new people, objects, locations, reactions, actions, or outcomes.\n" +
      (input.revisionGuidance?.length
        ? input.revisionGuidance.slice(-10).map((item) => `- ${item}`).join("\n")
        : ""),
  };

  const requestedTemperature = input.temperature ?? policy.temperature;
  const result = await localModelGenerate(targetedMessages, "json", {
    numPredict: Math.max(128, Math.min(policy.numPredict || 768, 768)),
    temperature: Math.max(0.4, Math.min(policy.temperature || 0.62, requestedTemperature)),
  });

  const parsed = parseMouthCandidateBatch(result.text);
  for (const beat of missingBeats) {
    const entry = parsed?.variantsByBeat.find((item) => item.order === beat.order);
    if (entry?.variants.length) {
      recovered.set(beat.order, entry.variants.slice(0, policy.variantsPerBeat));
    }
  }

  return { recovered, modelCalls: 1 };
}

async function generateBeam(
  input: EnterpriseMouthInput,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  policy: EnterpriseMouthExecutionPolicy,
): Promise<{
  resultText: string;
  texts: string[];
  candidates: MouthCandidate[];
  beamScore: number;
  modelCalls: number;
}> {
  if (policy.mode === "no-model" || policy.maxPrimaryCalls <= 0) {
    return {
      resultText: JSON.stringify({ variantsByBeat: [] }),
      texts: [],
      candidates: [],
      beamScore: 0,
      modelCalls: 0,
    };
  }

  const candidateMessages = buildMouthCandidateMessages({
    envelope,
    beats: input.beats,
    priorTexts: input.priorTexts ? [...input.priorTexts] : undefined,
    lens: input.lens,
  });

  if (input.revisionGuidance?.length) {
    candidateMessages[0] = {
      ...candidateMessages[0],
      content:
        `${candidateMessages[0].content}\n\n` +
        "ENTERPRISE REVISION GUIDANCE:\n" +
        input.revisionGuidance.slice(0, 20).map((item) => `- ${item}`).join("\n") +
        "\nRegenerate candidates that address these failures. Preserve approved reality and the Meaning Spine.",
    };
  }

  const result = await localModelGenerate(candidateMessages, "json", {
    numPredict: policy.numPredict,
    temperature: input.temperature ?? policy.temperature,
  });

  const parsed = parseMouthCandidateBatch(result.text);
  const expectedOrders = new Set(input.beats.map((beat) => beat.order));
  const presentOrders = new Set(parsed?.variantsByBeat.map((item) => item.order) ?? []);
  const missingBeats = input.beats.filter((beat) => !presentOrders.has(beat.order));

  let modelCalls = 1;
  const recovery = await recoverMissingBeatVariants(input, envelope, missingBeats, policy);
  modelCalls += recovery.modelCalls;

  const merged = mergeCandidateBatches(
    input.beats,
    parsed,
    recovery.recovered,
    policy.variantsPerBeat,
  );
  const coverageOrders = new Set(merged.variantsByBeat.map((item) => item.order));
  const missingAfterRecovery = [...expectedOrders].filter((order) => !coverageOrders.has(order));

  if (missingAfterRecovery.length) {
    return {
      resultText: result.text,
      texts: [],
      candidates: [],
      beamScore: 0,
      modelCalls,
    };
  }

  const pools: MouthCandidatePool[] = input.beats
    .map((beat) => {
      const entry = merged.variantsByBeat.find((item) => item.order === beat.order);
      const rawCandidates = (entry?.variants ?? []).map((text) =>
        scoreMouthCandidate({
          text,
          beat,
          envelope,
          priorTexts: input.priorTexts ? [...input.priorTexts] : [],
        }),
      );

      const candidates = adaptMouthCandidatePool({
        candidates: rawCandidates,
        beat,
        envelope,
      }).slice(0, policy.beamCandidatesPerBeat);

      return { order: beat.order, candidates };
    })
    .sort((a, b) => a.order - b.order);

  const beam = selectBestMouthSequence(pools, {
    width: policy.beamWidth,
    candidatesPerBeat: policy.beamCandidatesPerBeat,
  });

  return {
    resultText: result.text,
    texts: beam.texts,
    candidates: beam.candidates,
    beamScore: beam.score,
    modelCalls,
  };
}

export async function realizeEnterpriseMouth(
  input: EnterpriseMouthInput,
): Promise<EnterpriseMouthResult> {
  const policy = getEnterpriseMouthPolicy();
  const envelope = buildAuthorRealityEnvelope({
    graph: input.graph,
    subject: input.subject,
  });
  const canonicalBeats = canonicalizeBeats(input.beats).slice(0, policy.maxBeats);

  const meaningSpine = buildMeaningSpine({ envelope, beats: canonicalBeats });
  const realizationSlots = buildRealizationSlots({
    envelope,
    beats: canonicalBeats,
    spine: meaningSpine,
    fast: policy.mode === "dev-fast",
  });
  const enterpriseIntelligence = buildEnterpriseIntelligence({
    graph: input.graph,
    subject: input.subject,
    lens: input.lens,
    beats: canonicalBeats,
  });

  if (policy.mode === "no-model") {
    const cumulativeStates = buildCumulativeMeaningState(canonicalBeats, envelope);
    return {
      texts: [],
      candidates: [],
      rawModelText: JSON.stringify({ variantsByBeat: [] }),
      beamScore: 0,
      envelope,
      meaningSpine,
      realizationSlots,
      repairObjectives: [],
      policy,
      modelCallCount: 0,
      enterpriseIntelligence,
      cumulativeMeaningScore: evaluateCumulativeMeaning(cumulativeStates),
      creativeCritique: critiqueCreativeSelection("", []),
      safetyViolations: [],
      groundedSurprise: 0,
    };
  }

  let current = await generateBeam({ ...input, beats: canonicalBeats }, envelope, policy);
  let failures = qualityFailures(current.texts, current.candidates, canonicalBeats.length, current.beamScore);
  let modelCallCount = current.modelCalls;

  const repairObjectives = buildMouthRepairObjectives({
    candidates: current.candidates,
    slots: realizationSlots,
  });

  if (
    failures.length > 0 &&
    policy.maxRevisionCalls > 0 &&
    modelCallCount < policy.maxTotalModelCalls
  ) {
    const remainingCalls = policy.maxTotalModelCalls - modelCallCount;
    const revisionPolicy: EnterpriseMouthExecutionPolicy = {
      ...policy,
      maxPrimaryCalls: remainingCalls > 0 ? 1 : 0,
      maxRecoveryCalls: remainingCalls > 1 ? 1 : 0,
      maxRevisionCalls: 0,
      maxTotalModelCalls: remainingCalls,
      beamWidth: policy.beamWidth,
      beamCandidatesPerBeat: policy.beamCandidatesPerBeat,
    };

    if (revisionPolicy.maxPrimaryCalls > 0) {
      const revised = await generateBeam(
        {
          ...input,
          beats: canonicalBeats,
          priorTexts: current.texts,
          revisionGuidance: [
            ...(input.revisionGuidance ?? []),
            ...compactRepairInstructions(repairObjectives, 8),
            ...failures,
            "QUALITY GATE FAILED. Do not merely paraphrase the previous candidates.",
            "Meaning shifts must be grounded in actual graph relationships.",
            "Concrete verbs are evidence-sensitive: use only supplied actions or direct universal equivalents.",
            "Interpretation may change the reading of evidence, but may not create a new concrete action, object, person, setting, or reaction.",
            "For multi-signal beats, preserve enough evidence to make the transition legible without naming the operation.",
          ],
          temperature: Math.max(0.42, (input.temperature ?? policy.temperature) - 0.06),
        },
        envelope,
        revisionPolicy,
      );

      const revisedFailures = qualityFailures(
        revised.texts,
        revised.candidates,
        canonicalBeats.length,
        revised.beamScore,
      );

      modelCallCount += revised.modelCalls;

      if (
        revisedFailures.length < failures.length ||
        (revisedFailures.length === failures.length && revised.beamScore > current.beamScore)
      ) {
        current = revised;
        failures = revisedFailures;
      }
    }
  }

  const safetyViolations = [
    ...new Set(
      current.texts.flatMap((text) =>
        detectAuthorSafetyViolations({ text, envelope }),
      ),
    ),
  ];

  const cumulativeStates = buildCumulativeMeaningState(canonicalBeats, envelope);
  const finalText = current.texts.join(" ");

  return {
    texts: current.texts,
    candidates: current.candidates,
    rawModelText: current.resultText,
    beamScore: current.beamScore,
    envelope,
    meaningSpine,
    realizationSlots,
    repairObjectives,
    policy,
    modelCallCount,
    enterpriseIntelligence,
    cumulativeMeaningScore: evaluateCumulativeMeaning(cumulativeStates),
    creativeCritique: critiqueCreativeSelection(finalText, []),
    safetyViolations,
    groundedSurprise: surpriseScore(finalText, envelope),
  };
}
