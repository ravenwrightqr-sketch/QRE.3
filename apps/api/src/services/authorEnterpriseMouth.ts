/**
 * QRE ENTERPRISE MOUTH · ORCHESTRATION BOUNDARY
 *
 * Canonical path:
 * REALITY → MEANING SPINE → REALIZATION SLOTS → CANDIDATES → CRITIC → BEAM → REPAIR
 *
 * Qwen proposes language. QRE owns meaning, evidence, budgets, selection, and repair.
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
import { adaptMouthCandidatePool } from "./authorMouthQualityAdapter.js";
import { selectBestMouthSequence, type MouthCandidatePool } from "./authorMouthSequenceBeamSearch.js";
import { buildMeaningSpine, type MeaningSpine } from "./authorMeaningSpine.js";
import { buildRealizationSlots, type RealizationSlot } from "./authorMouthRealizationSlot.js";
import { buildMouthRepairObjectives, compactRepairInstructions } from "./authorMouthRepairPlanner.js";
import { getEnterpriseMouthPolicy, type EnterpriseMouthExecutionPolicy } from "./authorEnterpriseMouthPolicy.js";

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
  repairObjectives: ReturnType<typeof buildMouthRepairObjectives>;
  policy: EnterpriseMouthExecutionPolicy;
  modelCallCount: number;
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
  if (texts.length !== beatCount) failures.push(`expected ${beatCount} lines, received ${texts.length}`);

  for (const candidate of candidates) {
    if (candidate.groundingScore < QUALITY.minimumGrounding) failures.push(`beat ${candidate.beatOrder}: weak-grounding=${candidate.groundingScore}`);
    if (candidate.meaningScore < QUALITY.minimumMeaning) failures.push(`beat ${candidate.beatOrder}: weak-meaning=${candidate.meaningScore}`);
    if (candidate.inventionRisk > QUALITY.maximumInventionRisk) failures.push(`beat ${candidate.beatOrder}: invention-risk=${candidate.inventionRisk}`);
    if (candidate.compressionScore < QUALITY.minimumCompression) failures.push(`beat ${candidate.beatOrder}: poor-compression=${candidate.compressionScore}`);
    if (
      candidate.reasons.includes("language-quality-gate") ||
      candidate.reasons.includes("weak-natural-language") ||
      candidate.reasons.includes("keyword-assembly") ||
      candidate.reasons.includes("analytic-language") ||
      candidate.reasons.includes("analytic-realization-language")
    ) failures.push(`beat ${candidate.beatOrder}: language-quality-failure`);
  }

  if (beamScore < QUALITY.minimumBeamScore) failures.push(`beam-score=${beamScore}`);
  return [...new Set(failures)];
}

function mergeCandidateBatches(
  beats: readonly MouthCandidateBeat[],
  primary: MouthCandidateBatch | undefined,
  recovered: ReadonlyMap<number, string[]>,
  limit: number,
): MouthCandidateBatch {
  return {
    variantsByBeat: beats
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
            .slice(0, limit),
        };
      })
      .filter((entry) => entry.variants.length > 0),
  };
}

function slotContext(slots: readonly RealizationSlot[]): string {
  return [
    "QRE REALIZATION SLOTS · EXECUTION CONTRACT:",
    ...slots.map((slot) => [
      `Beat ${slot.order} · ${slot.kind} · mode=${slot.mode}`,
      `sources=${slot.sourceLabels.join(" | ") || "none"}`,
      `targets=${slot.targetLabels.join(" | ") || "none"}`,
      `relations=${slot.relationKinds.join(" | ") || "none"}`,
      `obligations=${slot.obligations.join(" | ")}`,
      `FORBIDDEN=${slot.forbiddenMoves.join(" | ")}`,
      `candidateBudget=${slot.candidateCount}`,
    ].join("\n")).join("\n\n"),
  ].join("\n");
}

async function recoverMissingBeatVariants(
  input: EnterpriseMouthInput,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  missingBeats: readonly MouthCandidateBeat[],
  slots: readonly RealizationSlot[],
  policy: EnterpriseMouthExecutionPolicy,
): Promise<{ recovered: ReadonlyMap<number, string[]>; modelCalls: number }> {
  if (!missingBeats.length || policy.maxRecoveryCalls < 1 || policy.mode === "no-model") {
    return { recovered: new Map(), modelCalls: 0 };
  }

  const recovered = new Map<number, string[]>();
  const messages = buildMouthCandidateMessages({
    envelope,
    beats: missingBeats,
    priorTexts: input.priorTexts,
    lens: input.lens,
  });

  messages[0] = {
    ...messages[0],
    content:
      `${messages[0].content}\n\n${slotContext(slots)}\n\n` +
      "BATCHED RECOVERY: recover ONLY the missing beat orders above in ONE JSON response. Never invent extra beat orders.\n" +
      (input.revisionGuidance?.length ? input.revisionGuidance.slice(-8).map((x) => `- ${x}`).join("\n") : ""),
  };

  const result = await localModelGenerate(messages, "json", {
    numPredict: policy.numPredict,
    temperature: Math.max(0.4, input.temperature ?? policy.temperature),
  });

  const parsed = parseMouthCandidateBatch(result.text);
  for (const beat of missingBeats) {
    const entry = parsed?.variantsByBeat.find((item) => item.order === beat.order);
    if (entry?.variants.length) recovered.set(beat.order, entry.variants);
  }
  return { recovered, modelCalls: 1 };
}

async function generateBeam(
  input: EnterpriseMouthInput,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  spine: MeaningSpine,
  slots: readonly RealizationSlot[],
  policy: EnterpriseMouthExecutionPolicy,
): Promise<{
  resultText: string;
  texts: string[];
  candidates: MouthCandidate[];
  beamScore: number;
  modelCalls: number;
}> {
  if (policy.mode === "no-model") {
    return { resultText: "", texts: [], candidates: [], beamScore: 0, modelCalls: 0 };
  }

  const candidateMessages = buildMouthCandidateMessages({
    envelope,
    beats: input.beats,
    priorTexts: input.priorTexts,
    lens: input.lens,
  });

  candidateMessages[0] = {
    ...candidateMessages[0],
    content:
      `${candidateMessages[0].content}\n\n` +
      `CANONICAL MEANING SPINE:\n${JSON.stringify(spine)}\n\n` +
      slotContext(slots) +
      (input.revisionGuidance?.length
        ? `\n\nENTERPRISE REPAIR GUIDANCE:\n${input.revisionGuidance.slice(0, 12).map((x) => `- ${x}`).join("\n")}`
        : ""),
  };

  const result = await localModelGenerate(candidateMessages, "json", {
    numPredict: policy.numPredict,
    temperature: input.temperature ?? policy.temperature,
  });

  const parsed = parseMouthCandidateBatch(result.text);
  const expected = new Set(input.beats.map((beat) => beat.order));
  const present = new Set(parsed?.variantsByBeat.map((item) => item.order) ?? []);
  const missing = input.beats.filter((beat) => !present.has(beat.order));

  const recovery = await recoverMissingBeatVariants(input, envelope, missing, slots, policy);
  const merged = mergeCandidateBatches(input.beats, parsed, recovery.recovered, policy.variantsPerBeat);
  const coverage = new Set(merged.variantsByBeat.map((item) => item.order));

  if ([...expected].some((order) => !coverage.has(order))) {
    return { resultText: result.text, texts: [], candidates: [], beamScore: 0, modelCalls: 1 + recovery.modelCalls };
  }

  const pools: MouthCandidatePool[] = input.beats
    .map((beat) => {
      const entry = merged.variantsByBeat.find((item) => item.order === beat.order);
      const rawCandidates = (entry?.variants ?? []).map((text) =>
        scoreMouthCandidate({ text, beat, envelope, priorTexts: input.priorTexts ?? [] }),
      );
      return {
        order: beat.order,
        candidates: adaptMouthCandidatePool({ candidates: rawCandidates, beat, envelope }),
      };
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
    modelCalls: 1 + recovery.modelCalls,
  };
}

export async function realizeEnterpriseMouth(input: EnterpriseMouthInput): Promise<EnterpriseMouthResult> {
  const policy = getEnterpriseMouthPolicy();
  const envelope = buildAuthorRealityEnvelope({ graph: input.graph, subject: input.subject });

  const canonicalBeats = [...input.beats]
    .sort((a, b) => a.order - b.order)
    .filter((beat, index, all) => all.findIndex((x) => x.order === beat.order) === index)
    .slice(0, policy.maxBeats);

  if (canonicalBeats.length === 0) {
    throw new Error("ENTERPRISE MOUTH INVARIANT FAILED: no approved beats");
  }

  const spine = buildMeaningSpine({ envelope, beats: canonicalBeats, premise: input.lens });
  const slots = buildRealizationSlots({
    envelope,
    beats: canonicalBeats,
    spine,
    fast: policy.mode === "dev-fast",
  });

  const boundedInput: EnterpriseMouthInput = {
    ...input,
    beats: canonicalBeats,
  };

  let current = await generateBeam(boundedInput, envelope, spine, slots, policy);
  let modelCallCount = current.modelCalls;
  let failures = qualityFailures(current.texts, current.candidates, canonicalBeats.length, current.beamScore);

  let repairObjectives = buildMouthRepairObjectives({ candidates: current.candidates, slots });

  if (failures.length > 0 && policy.maxRevisionCalls > 0 && modelCallCount < policy.maxTotalModelCalls && policy.mode !== "no-model") {
    const repairInstructions = compactRepairInstructions(repairObjectives, 8);
    const revised = await generateBeam(
      {
        ...boundedInput,
        priorTexts: current.texts,
        revisionGuidance: [
          ...(input.revisionGuidance ?? []),
          ...failures,
          ...repairInstructions,
          "Do not regenerate a whole new movie. Repair realization only.",
          "Concrete verbs are evidence-sensitive. Use supplied actions or direct grammatical equivalents only.",
          "Never name the semantic operation; perform it in the sentence.",
        ],
        temperature: Math.max(0.45, (input.temperature ?? policy.temperature) - 0.08),
      },
      envelope,
      spine,
      slots,
      {
        ...policy,
        maxRecoveryCalls: Math.min(policy.maxRecoveryCalls, Math.max(0, policy.maxTotalModelCalls - modelCallCount - 1)),
      },
    );

    modelCallCount += revised.modelCalls;
    const revisedFailures = qualityFailures(revised.texts, revised.candidates, canonicalBeats.length, revised.beamScore);

    if (revisedFailures.length < failures.length || (revisedFailures.length === failures.length && revised.beamScore > current.beamScore)) {
      current = revised;
      failures = revisedFailures;
      repairObjectives = buildMouthRepairObjectives({ candidates: current.candidates, slots });
    }
  }

  return {
    texts: current.texts,
    candidates: current.candidates,
    rawModelText: current.resultText,
    beamScore: current.beamScore,
    envelope,
    meaningSpine: spine,
    realizationSlots: slots,
    repairObjectives,
    policy,
    modelCallCount,
  };
}
