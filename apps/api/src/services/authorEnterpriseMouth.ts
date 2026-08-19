/**
 * QRE ENTERPRISE MOUTH · CANONICAL ORCHESTRATION
 *
 * Reality → Meaning Spine → Realization Slots → Mouth Candidates → Beam.
 *
 * The RealizationSlot is the authoritative creative job. Model output is
 * optional language evidence; QRE owns grounding, semantic contracts,
 * fallback, sequence selection, and endpoint authority.
 */
import type {
  AuthorCreativeCritique,
  RealityGraph,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidate,
  type MouthCandidateBatch,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearch.js";
import { adaptMouthCandidatePool } from "./authorMouthQualityAdapter.js";
import {
  selectBestMouthSequence,
  type MouthCandidatePool,
} from "./authorMouthSequenceBeamSearch.js";
import {
  buildMeaningSpine,
  type MeaningSpine,
} from "./authorMeaningSpine.js";
import {
  buildRealizationSlots,
  type RealizationSlot,
} from "./authorMouthRealizationSlot.js";
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
import {
  critiqueCreativeSelection,
  surpriseScore,
} from "./authorCreativeSearch.js";

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
  grounding: 0.42,
  meaning: 0.4,
  invention: 0.45,
  compression: 0.45,
  beam: 0.32,
} as const;

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function canonicalizeBeats(
  beats: readonly MouthCandidateBeat[],
  maxBeats: number,
): MouthCandidateBeat[] {
  return beats
    .filter((beat) => beat && Number.isFinite(Number(beat.order)) && Number(beat.order) > 0)
    .slice()
    .sort((a, b) => Number(a.order) - Number(b.order))
    .filter(
      (beat, index, all) =>
        all.findIndex((item) => Number(item.order) === Number(beat.order)) === index,
    )
    .slice(0, maxBeats)
    .map((beat, index) => ({
      ...beat,
      order: index + 1,
      eventIds: [...new Set((beat.eventIds ?? []).filter((value) => typeof value === "string" && clean(value)))],
      setsUp: [...new Set((beat.setsUp ?? []).filter((value) => typeof value === "string" && clean(value)))],
      paysOff: [...new Set((beat.paysOff ?? []).filter((value) => typeof value === "string" && clean(value)))],
    }));
}

function endpointLabel(envelope: ReturnType<typeof buildAuthorRealityEnvelope>): string {
  return envelope.events.find((event) => event.id === envelope.endpointEventId)?.label ?? "";
}

/**
 * The only adapter from RealizationSlot into the canonical Mouth beat shape.
 * Every downstream Mouth operation consumes this representation.
 */
function canonicalMouthBeats(
  beats: readonly MouthCandidateBeat[],
  slots: readonly RealizationSlot[],
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  spine: MeaningSpine,
): MouthCandidateBeat[] {
  return beats.map((beat) => {
    const slot = slots.find((candidate) => candidate.order === beat.order);
    const spineBeat = spine.beats.find((candidate) => candidate.order === beat.order);
    const payoff = slot?.kind === "payoff" || beat.role === "payoff" || beat.attentionFunction === "payoff";
    const endpoint = endpointLabel(envelope);

    const sourceEventIds = [
      ...(slot?.sourceEventIds ?? []),
      ...(slot?.inheritedEventIds ?? []),
      ...(beat.eventIds ?? []),
    ].filter(Boolean);

    const targetLabels = [
      ...(slot?.targetLabels ?? []),
      ...(payoff && endpoint ? [endpoint] : []),
      ...(beat.paysOff ?? []),
    ].filter(Boolean);

    return {
      ...beat,
      order: beat.order,
      role: payoff ? "payoff" : beat.role,
      attentionFunction: payoff ? "payoff" : beat.attentionFunction,
      creativeMove: beat.creativeMove ?? slot?.mode,
      realizationMode: clean(
        `${slot?.kind ?? ""} ${slot?.mode ?? ""}`,
      ) || beat.realizationMode,
      eventIds: [...new Set(sourceEventIds)],
      change: clean(spineBeat?.change) || clean(beat.change),
      next: clean(spineBeat?.next) || clean(beat.next) || targetLabels.join("; "),
      frontier: clean(spineBeat?.next) || clean(beat.frontier) || targetLabels.join("; "),
      setsUp: beat.setsUp?.length ? beat.setsUp : slot?.sourceLabels ?? [],
      paysOff: payoff ? [endpoint].filter(Boolean) : beat.paysOff ?? slot?.targetLabels ?? [],
      obligations: slot?.obligations ?? beat.obligations ?? [],
      forbiddenMoves: slot?.forbiddenMoves ?? beat.forbiddenMoves ?? [],
      relationKinds: slot?.relationKinds ?? beat.relationKinds ?? [],
      relationStrength: slot?.relationStrength ?? beat.relationStrength ?? 0,
    };
  });
}

function qualityFailures(
  texts: readonly string[],
  candidates: readonly MouthCandidate[],
  beatCount: number,
  beamScore: number,
): string[] {
  const failures: string[] = [];
  if (texts.length !== beatCount) failures.push(`expected ${beatCount} lines, received ${texts.length}`);

  for (const candidate of candidates) {
    if (candidate.groundingScore < QUALITY.grounding) failures.push(`beat ${candidate.beatOrder}: weak-grounding=${candidate.groundingScore}`);
    if (candidate.meaningScore < QUALITY.meaning) failures.push(`beat ${candidate.beatOrder}: weak-meaning=${candidate.meaningScore}`);
    if (candidate.inventionRisk > QUALITY.invention) failures.push(`beat ${candidate.beatOrder}: invention-risk=${candidate.inventionRisk}`);
    if (candidate.compressionScore < QUALITY.compression) failures.push(`beat ${candidate.beatOrder}: poor-compression=${candidate.compressionScore}`);
    if (
      candidate.reasons.includes("keyword-assembly") ||
      candidate.reasons.includes("analytic-realization-language") ||
      candidate.reasons.includes("question-leak")
    ) {
      failures.push(`beat ${candidate.beatOrder}: language-quality-failure`);
    }
  }

  if (beamScore < QUALITY.beam) failures.push(`beam-score=${beamScore}`);
  return [...new Set(failures)];
}

function mergeBatches(
  beats: readonly MouthCandidateBeat[],
  primary: MouthCandidateBatch | undefined,
): MouthCandidateBatch {
  return {
    variantsByBeat: beats.map((beat) => ({
      order: beat.order,
      variants: [
        ...(primary?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? []),
      ]
        .map(clean)
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index),
    })),
  };
}

function buildFallbackPools(
  beats: readonly MouthCandidateBeat[],
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  priorTexts: readonly string[],
  primary: MouthCandidateBatch | undefined,
  limit: number,
): MouthCandidatePool[] {
  return beats.map((beat) => {
    const entry = primary?.variantsByBeat.find((item) => item.order === beat.order);
    const raw = (entry?.variants ?? []).map((text) =>
      scoreMouthCandidate({
        text,
        beat,
        envelope,
        priorTexts,
      }),
    );

    const candidates = adaptMouthCandidatePool({
      candidates: raw,
      beat,
      envelope,
      priorTexts,
    }).slice(0, limit);

    return { order: beat.order, candidates };
  });
}

async function generateCandidates(
  beats: readonly MouthCandidateBeat[],
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  priorTexts: readonly string[],
  lens: string | undefined,
  revisionGuidance: readonly string[],
  policy: EnterpriseMouthExecutionPolicy,
): Promise<{ text: string; batch?: MouthCandidateBatch; calls: number }> {
  if (policy.maxPrimaryCalls <= 0 || policy.mode === "no-model") {
    return { text: JSON.stringify({ variantsByBeat: [] }), calls: 0 };
  }

  const messages = buildMouthCandidateMessages({
    envelope,
    beats,
    priorTexts,
    lens,
  });

  const system = messages[0];
  if (system) {
    system.content += [
      "",
      "ENTERPRISE CANONICAL REALIZATION CONTRACT.",
      "The supplied beats are already canonicalized from RealizationSlots.",
      "Generate exactly one variantsByBeat entry for every beat order.",
      "Never return an empty variantsByBeat array when beat orders are supplied.",
      "Every non-payoff beat must contain at least one grounded candidate.",
      "Every payoff beat must contain the exact supplied endpoint phrase.",
      ...revisionGuidance.slice(0, 20).map((item) => `- ${item}`),
    ].join("\n");
  }

  const result = await localModelGenerate(messages, "json", {
    numPredict: policy.numPredict,
    temperature: policy.temperature,
  });

  return {
    text: result.text,
    batch: parseMouthCandidateBatch(result.text),
    calls: 1,
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

  const sourceBeats = canonicalizeBeats(
    input.beats,
    policy.maxBeats,
  );

  const meaningSpine = buildMeaningSpine({
    envelope,
    beats: sourceBeats,
  });

  const realizationSlots = buildRealizationSlots({
    envelope,
    beats: sourceBeats,
    spine: meaningSpine,
    fast: policy.mode === "dev-fast",
  });

  const mouthBeats = canonicalMouthBeats(
    sourceBeats,
    realizationSlots,
    envelope,
    meaningSpine,
  );

  const enterpriseIntelligence = buildEnterpriseIntelligence({
    graph: input.graph,
    subject: input.subject,
    lens: input.lens,
    beats: mouthBeats,
  });

  const priorTexts = [...(input.priorTexts ?? [])];
  let modelCallCount = 0;
  let rawModelText = JSON.stringify({ variantsByBeat: [] });
  let batch: MouthCandidateBatch | undefined;

  if (policy.mode !== "no-model") {
    const generated = await generateCandidates(
      mouthBeats,
      envelope,
      priorTexts,
      input.lens,
      input.revisionGuidance ?? [],
      policy,
    );
    rawModelText = generated.text;
    batch = generated.batch;
    modelCallCount += generated.calls;
  }

  const pools = buildFallbackPools(
    mouthBeats,
    envelope,
    priorTexts,
    batch,
    policy.beamCandidatesPerBeat,
  );

  const repairObjectives = buildMouthRepairObjectives({
    candidates: pools.flatMap((pool) => pool.candidates),
    slots: realizationSlots,
  });

  let beam = selectBestMouthSequence(pools, {
    width: policy.beamWidth,
    candidatesPerBeat: policy.beamCandidatesPerBeat,
  });

  let failures = qualityFailures(
    beam.texts,
    beam.candidates,
    mouthBeats.length,
    beam.score,
  );

  /*
   * Full mode gets one bounded revision request. The revision still enters
   * through the exact same candidate batch contract and receives the same
   * fallback + adapter + beam pipeline.
   */
  if (
    failures.length &&
    policy.maxRevisionCalls > 0 &&
    modelCallCount < policy.maxTotalModelCalls
  ) {
    const revisionGuidance = [
      ...(input.revisionGuidance ?? []),
      ...compactRepairInstructions(repairObjectives, 8),
      ...failures,
      "The first realization failed quality gates.",
      "Do not paraphrase a failed candidate; solve the slot's semantic job.",
      "Do not invent concrete reality.",
      "Preserve the exact supplied endpoint.",
    ];

    const revised = await generateCandidates(
      mouthBeats,
      envelope,
      beam.texts,
      input.lens,
      revisionGuidance,
      {
        ...policy,
        maxPrimaryCalls: 1,
        maxRecoveryCalls: 0,
        maxRevisionCalls: 0,
        maxTotalModelCalls: 1,
        temperature: Math.max(
          0.42,
          (input.temperature ?? policy.temperature) - 0.06,
        ),
      },
    );

    modelCallCount += revised.calls;
    if (revised.batch) {
      const revisedPools = buildFallbackPools(
        mouthBeats,
        envelope,
        beam.texts,
        revised.batch,
        policy.beamCandidatesPerBeat,
      );

      const revisedBeam = selectBestMouthSequence(
        revisedPools,
        {
          width: policy.beamWidth,
          candidatesPerBeat: policy.beamCandidatesPerBeat,
        },
      );

      const revisedFailures = qualityFailures(
        revisedBeam.texts,
        revisedBeam.candidates,
        mouthBeats.length,
        revisedBeam.score,
      );

      if (
        revisedFailures.length < failures.length ||
        (revisedFailures.length === failures.length &&
          revisedBeam.score > beam.score)
      ) {
        beam = revisedBeam;
        failures = revisedFailures;
        rawModelText = revised.text;
      }
    }
  }

  const safetyViolations = [
    ...new Set(
      beam.texts.flatMap((text) =>
        detectAuthorSafetyViolations({
          text,
          envelope,
        }),
      ),
    ),
  ];

  const cumulativeStates = buildCumulativeMeaningState(
    mouthBeats,
    envelope,
  );

  const finalText = beam.texts.join(" ");
  const creativeCritique = critiqueCreativeSelection(
    finalText,
    [],
  );

  return {
    texts: beam.texts,
    candidates: beam.candidates,
    rawModelText,
    beamScore: beam.score,
    envelope,
    meaningSpine,
    realizationSlots,
    repairObjectives,
    policy,
    modelCallCount,
    enterpriseIntelligence,
    cumulativeMeaningScore: evaluateCumulativeMeaning(cumulativeStates),
    creativeCritique,
    safetyViolations,
    groundedSurprise: surpriseScore(finalText, envelope),
  };
}
