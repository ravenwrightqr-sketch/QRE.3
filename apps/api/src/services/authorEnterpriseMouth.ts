/**
 * QRE ENTERPRISE MOUTH · ORCHESTRATION BOUNDARY
 *
 * Qwen proposes language variants. QRE owns reality, meaning, realization
 * constraints, repair objectives, sequence selection, and enterprise
 * diagnostics.
 *
 * Performance law:
 *   - one primary batch generation
 *   - at most one batched recovery generation
 *   - at most one final revision generation in full mode
 *
 * Missing model beats are recovered in ONE request, then deterministic
 * evidence-locked fallback completes any remaining realization slots.
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
import {
  buildMeaningSpine,
  type MeaningSpine,
} from "./authorMeaningSpine.js";
import {
  buildRealizationSlots,
  type RealizationSlot,
} from "./authorMouthRealizationSlot.js";
import { selectSafeStrategies } from "./authorRealizationStrategyLattice.js";
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
  minimumGrounding: 0.42,
  minimumMeaning: 0.4,
  maximumInventionRisk: 0.45,
  minimumCompression: 0.45,
  minimumBeamScore: 0.32,
} as const;

const MAX_CANONICAL_BEATS = 6;

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

function canonicalizeBeats(
  beats: readonly MouthCandidateBeat[],
): MouthCandidateBeat[] {
  return beats
    .filter(
      (beat) =>
        beat &&
        Number.isFinite(Number(beat.order)) &&
        Number(beat.order) > 0,
    )
    .slice()
    .sort(
      (a, b) =>
        Number(a.order) -
        Number(b.order),
    )
    .filter(
      (beat, index, values) =>
        values.findIndex(
          (candidate) =>
            Number(candidate.order) ===
            Number(beat.order),
        ) === index,
    )
    .slice(0, MAX_CANONICAL_BEATS)
    .map((beat, index) => ({
      ...beat,
      order: index + 1,
      eventIds: Array.isArray(beat.eventIds)
        ? [
            ...new Set(
              beat.eventIds.filter(
                (
                  value,
                ): value is string =>
                  typeof value === "string" &&
                  value.trim().length > 0,
              ),
            ),
          ]
        : [],
      setsUp: Array.isArray(beat.setsUp)
        ? [
            ...new Set(
              beat.setsUp.filter(
                (
                  value,
                ): value is string =>
                  typeof value === "string" &&
                  value.trim().length > 0,
              ),
            ),
          ]
        : [],
      paysOff: Array.isArray(beat.paysOff)
        ? [
            ...new Set(
              beat.paysOff.filter(
                (
                  value,
                ): value is string =>
                  typeof value === "string" &&
                  value.trim().length > 0,
              ),
            ),
          ]
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

  if (
    texts.length !== beatCount
  ) {
    failures.push(
      `expected ${beatCount} lines, received ${texts.length}`,
    );
  }

  for (const candidate of candidates) {
    if (
      candidate.groundingScore <
      QUALITY.minimumGrounding
    ) {
      failures.push(
        `beat ${candidate.beatOrder}: weak-grounding=${candidate.groundingScore}`,
      );
    }

    if (
      candidate.meaningScore <
      QUALITY.minimumMeaning
    ) {
      failures.push(
        `beat ${candidate.beatOrder}: weak-meaning=${candidate.meaningScore}`,
      );
    }

    if (
      candidate.inventionRisk >
      QUALITY.maximumInventionRisk
    ) {
      failures.push(
        `beat ${candidate.beatOrder}: invention-risk=${candidate.inventionRisk}`,
      );
    }

    if (
      candidate.compressionScore <
      QUALITY.minimumCompression
    ) {
      failures.push(
        `beat ${candidate.beatOrder}: poor-compression=${candidate.compressionScore}`,
      );
    }

    if (
      candidate.reasons.includes(
        "language-quality-gate",
      ) ||
      candidate.reasons.includes(
        "weak-natural-language",
      ) ||
      candidate.reasons.includes(
        "keyword-assembly",
      ) ||
      candidate.reasons.includes(
        "analytic-language",
      ) ||
      candidate.reasons.includes(
        "analytic-realization-language",
      )
    ) {
      failures.push(
        `beat ${candidate.beatOrder}: language-quality-failure`,
      );
    }
  }

  if (
    beamScore <
    QUALITY.minimumBeamScore
  ) {
    failures.push(
      `beam-score=${beamScore}`,
    );
  }

  return [
    ...new Set(failures),
  ];
}

function mergeCandidateBatches(
  beats: readonly MouthCandidateBeat[],
  primary: MouthCandidateBatch | undefined,
  recovered: ReadonlyMap<
    number,
    string[]
  >,
  limit: number,
): MouthCandidateBatch {
  return {
    variantsByBeat: beats.map(
      (beat) => {
        const primaryEntry =
          primary?.variantsByBeat.find(
            (item) =>
              item.order ===
              beat.order,
          );

        const recoveredVariants =
          recovered.get(
            beat.order,
          ) ?? [];

        return {
          order:
            beat.order,
          variants: [
            ...(primaryEntry
              ?.variants ?? []),
            ...recoveredVariants,
          ]
            .map(
              (value) =>
                String(
                  value ?? "",
                ).trim(),
            )
            .filter(Boolean)
            .filter(
              (
                value,
                index,
                values,
              ) =>
                values.indexOf(
                  value,
                ) === index,
            )
            .slice(
              0,
              Math.max(
                1,
                limit,
              ),
            ),
        };
      },
    ),
  };
}

function eventLabel(
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >,
  id: string,
): string {
  return (
    envelope.events.find(
      (event) =>
        event.id === id,
    )?.label ?? ""
  );
}

function latentStoryDirectives(input: {
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >;
  beats: readonly MouthCandidateBeat[];
  spine: MeaningSpine;
}): string[] {
  const {
    envelope,
    beats,
    spine,
  } = input;

  const directives: string[] =
    [];

  const endpoint =
    spine.endpointLabel;

  directives.push(
    "Find the latent story already contained in the supplied evidence; do not write a receipt caption for each event.",
  );

  directives.push(
    "Each middle beat must make the selected movie more legible by changing the reading of earlier evidence or using a later supplied detail as concrete proof.",
  );

  directives.push(
    "A supplied state can be interpreted as character attitude, but the interpretation must be grounded by a supplied action, object, or later state when the graph provides one.",
  );

  directives.push(
    "Do not name the operation. Make the relationship felt through the line.",
  );

  for (
    let index = 1;
    index < beats.length - 1;
    index += 1
  ) {
    const current =
      beats[index];

    const previous =
      beats[index - 1];

    const currentLabels =
      current.eventIds
        ?.map((id) =>
          eventLabel(
            envelope,
            id,
          ),
        )
        .filter(Boolean) ??
      [];

    const nextLabels =
      beats[index + 1]
        .eventIds
        ?.map((id) =>
          eventLabel(
            envelope,
            id,
          ),
        )
        .filter(Boolean) ??
      [];

    const priorLabels =
      previous.eventIds
        ?.map((id) =>
          eventLabel(
            envelope,
            id,
          ),
        )
        .filter(Boolean) ??
      [];

    const state =
      currentLabels.find(
        (label) =>
          envelope.suppliedStates.includes(
            label,
          ),
      );

    const action =
      nextLabels.find(
        (label) =>
          envelope.suppliedActions.some(
            (value) =>
              label
                .toLowerCase()
                .includes(
                  value.toLowerCase(),
                ),
          ),
      );

    if (
      state &&
      action
    ) {
      directives.push(
        `Beat ${current.order}: ${state} is the emerging attitude; the next supplied action "${action}" must make that attitude concrete. Do not merely place the two labels beside each other.`,
      );
    } else if (
      priorLabels.length &&
      currentLabels.length
    ) {
      directives.push(
        `Beat ${current.order}: carry the prior signal ${priorLabels.join(" / ")} into ${currentLabels.join(" / ")} so the viewer feels a change, not a list.`,
      );
    }
  }

  if (endpoint) {
    directives.push(
      `FINAL SCENE END IS NON-NEGOTIABLE: the final line must end on the supplied endpoint "${endpoint}". Do not replace it, weaken it, add a fifth beat, or continue after it.`,
    );

    directives.push(
      `Everything before the endpoint exists to make "${endpoint}" land as the earned payoff of the accumulated meaning.`,
    );
  }

  return directives;
}

function realizationSlotDirectives(input: {
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >;
  beats: readonly MouthCandidateBeat[];
  slots: readonly RealizationSlot[];
}): string[] {
  const directives: string[] =
    [
      "REALIZATION SLOTS ARE THE AUTHORITATIVE CREATIVE JOBS.",
      "Do not invent, merge, reorder, or skip slots. Solve each slot as its own bounded language problem.",
      "For middle slots, the sentence must perform the required meaning movement; naming two anchors side-by-side is not enough.",
      "Prefer implication, contrast, recontextualization, understatement, or compression when they make the relationship felt without explaining it.",
    ];

  for (
    const slot of input.slots
  ) {
    const beat =
      input.beats.find(
        (candidate) =>
          candidate.order ===
          slot.order,
      );

    const endpoint =
      beat?.paysOff?.length
        ? beat.paysOff.join(
            " / ",
          )
        : "";

    const strategies = beat
      ? selectSafeStrategies(
          beat,
          input.envelope,
          5,
        )
          .map(
            (candidate) =>
              candidate.strategy,
          )
          .join(", ")
      : "implication, compression";

    directives.push(
      `SLOT ${slot.order}`,
    );

    directives.push(
      `kind=${slot.kind}; mode=${slot.mode}; source=${slot.sourceLabels.join(" | ") || "none"}; target=${slot.targetLabels.join(" | ") || "none"}`,
    );

    directives.push(
      `relations=${slot.relationKinds.join(" | ") || "none"}; strength=${slot.relationStrength}; strategies=${strategies}`,
    );

    directives.push(
      `obligations=${slot.obligations.join(" || ") || "ground the line in supplied evidence"}`,
    );

    directives.push(
      `forbidden=${slot.forbiddenMoves.join(" | ")}`,
    );

    if (endpoint) {
      directives.push(
        `supplied ending anchor=${endpoint}; this slot must support the path into that ending, not replace it.`,
      );
    }
  }

  return directives;
}

function applyLatentStoryPenalty(
  candidate: MouthCandidate,
): MouthCandidate {
  const scaffold =
    candidate.reasons.includes(
      "keyword-assembly",
    ) ||
    candidate.reasons.includes(
      "analytic-realization-language",
    );

  if (!scaffold) {
    return candidate;
  }

  return {
    ...candidate,
    score: Number(
      Math.max(
        0,
        candidate.score * 0.58,
      ).toFixed(3),
    ),
    meaningScore: Number(
      Math.max(
        0,
        candidate.meaningScore *
          0.72,
      ).toFixed(3),
    ),
    reasons: [
      ...new Set([
        ...candidate.reasons,
        "latent-story-scaffold",
      ]),
    ],
  };
}

async function recoverMissingBeatVariants(
  input: EnterpriseMouthInput,
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >,
  missingBeats: readonly MouthCandidateBeat[],
  slots: readonly RealizationSlot[],
  policy: EnterpriseMouthExecutionPolicy,
  spine: MeaningSpine,
): Promise<{
  recovered: ReadonlyMap<
    number,
    string[]
  >;
  modelCalls: number;
}> {
  const recovered =
    new Map<
      number,
      string[]
    >();

  if (
    !missingBeats.length ||
    policy.maxRecoveryCalls <= 0 ||
    policy.mode ===
      "no-model"
  ) {
    return {
      recovered,
      modelCalls: 0,
    };
  }

  const targetedMessages =
    buildMouthCandidateMessages({
      envelope,
      beats:
        missingBeats,
      priorTexts:
        input.priorTexts
          ? [
              ...input.priorTexts,
            ]
          : undefined,
      lens:
        input.lens,
    });

  const scopedSlots =
    slots.filter(
      (slot) =>
        missingBeats.some(
          (beat) =>
            beat.order ===
            slot.order,
        ),
    );

  targetedMessages[0] =
    {
      ...targetedMessages[0],
      content:
        `${targetedMessages[0].content}\n\nBATCHED BEAT RECOVERY:\n` +
        `Recover ONLY the missing beat orders: ${missingBeats
          .map(
            (beat) =>
              beat.order,
          )
          .join(", ")}.\n` +
        "Return one variantsByBeat entry for each requested order and no others.\n" +
        `Maximum variants per beat: ${policy.variantsPerBeat}.\n` +
        "Use supplied anchors for each beat.\n" +
        "Do not create new people, objects, locations, reactions, actions, or outcomes.\n" +
        `${realizationSlotDirectives({
          envelope,
          beats:
            missingBeats,
          slots:
            scopedSlots,
        }).join("\n")}\n` +
        `${latentStoryDirectives({
          envelope,
          beats:
            missingBeats,
          spine,
        }).join("\n")}\n` +
        `${
          input.revisionGuidance?.length
            ? input.revisionGuidance
                .slice(-10)
                .map(
                  (item) =>
                    `- ${item}`,
                )
                .join("\n")
            : ""
        }`,
    };

  const requestedTemperature =
    input.temperature ??
    policy.temperature;

  const result =
    await localModelGenerate(
      targetedMessages,
      "json",
      {
        numPredict:
          Math.max(
            128,
            Math.min(
              policy.numPredict ||
                768,
              768,
            ),
          ),
        temperature:
          Math.max(
            0.4,
            Math.min(
              policy.temperature ||
                0.62,
              requestedTemperature,
            ),
          ),
      },
    );

  const parsed =
    parseMouthCandidateBatch(
      result.text,
    );

  for (
    const beat of
      missingBeats
  ) {
    const entry =
      parsed?.variantsByBeat.find(
        (item) =>
          item.order ===
          beat.order,
      );

    if (
      entry?.variants.length
    ) {
      recovered.set(
        beat.order,
        entry.variants.slice(
          0,
          policy.variantsPerBeat,
        ),
      );
    }
  }

  return {
    recovered,
    modelCalls: 1,
  };
}

async function generateBeam(
  input: EnterpriseMouthInput,
  envelope: ReturnType<
    typeof buildAuthorRealityEnvelope
  >,
  slots: readonly RealizationSlot[],
  policy: EnterpriseMouthExecutionPolicy,
  spine: MeaningSpine,
): Promise<{
  resultText: string;
  texts: string[];
  candidates: MouthCandidate[];
  beamScore: number;
  modelCalls: number;
}> {
  if (
    policy.mode ===
      "no-model" ||
    policy.maxPrimaryCalls <=
      0
  ) {
    return {
      resultText:
        JSON.stringify({
          variantsByBeat: [],
        }),
      texts: [],
      candidates: [],
      beamScore: 0,
      modelCalls: 0,
    };
  }

  const candidateMessages =
    buildMouthCandidateMessages({
      envelope,
      beats:
        input.beats,
      priorTexts:
        input.priorTexts
          ? [
              ...input.priorTexts,
            ]
          : undefined,
      lens:
        input.lens,
    });

  candidateMessages[0] =
    {
      ...candidateMessages[0],
      content:
        `${candidateMessages[0].content}\n\nLATENT STORY REALIZATION CONTRACT:\n` +
        `${latentStoryDirectives({
          envelope,
          beats:
            input.beats,
          spine,
        }).join("\n")}\n\n` +
        `${realizationSlotDirectives({
          envelope,
          beats:
            input.beats,
          slots,
        }).join("\n")}`,
    };

  if (
    input.revisionGuidance?.length
  ) {
    candidateMessages[0] =
      {
        ...candidateMessages[0],
        content:
          `${candidateMessages[0].content}\n\nENTERPRISE REVISION GUIDANCE:\n` +
          `${input.revisionGuidance
            .slice(0, 20)
            .map(
              (item) =>
                `- ${item}`,
            )
            .join("\n")}\n` +
          "Regenerate candidates that address these failures. Preserve approved reality, the Meaning Spine, the realization slot contracts, and the selected ending.",
      };
  }

  if (
    process.env.QRE_AUTHOR_DEBUG_RAW ===
    "true"
  ) {
    console.log(
      "\n=== ENTERPRISE MOUTH SYSTEM PROMPT ===\n" +
        candidateMessages
          .filter(
            (message) =>
              message.role ===
              "system",
          )
          .map(
            (message) =>
              message.content,
          )
          .join(
            "\n\n",
          ) +
        "\n=== ENTERPRISE MOUTH USER PAYLOAD ===\n" +
        candidateMessages
          .filter(
            (message) =>
              message.role ===
              "user",
          )
          .map(
            (message) =>
              message.content,
          )
          .join(
            "\n\n",
          ) +
        "\n=== END ENTERPRISE MOUTH REQUEST ===\n",
    );
  }

  const result =
    await localModelGenerate(
      candidateMessages,
      "json",
      {
        numPredict:
          policy.numPredict,
        temperature:
          input.temperature ??
          policy.temperature,
      },
    );

  const parsed =
    parseMouthCandidateBatch(
      result.text,
    );

  const missingBeats =
    input.beats.filter(
      (beat) =>
        !(
          parsed?.variantsByBeat.some(
            (item) =>
              item.order ===
              beat.order,
          ) ?? false
        ),
    );

  let modelCalls = 1;

  const recovery =
    await recoverMissingBeatVariants(
      input,
      envelope,
      missingBeats,
      slots,
      policy,
      spine,
    );

  modelCalls +=
    recovery.modelCalls;

  const merged =
    mergeCandidateBatches(
      input.beats,
      parsed,
      recovery.recovered,
      policy.variantsPerBeat,
    );

  // Model coverage is diagnostic, not a prerequisite for realization.
  // Every canonical beat gets a candidate pool. The quality adapter contributes
  // deterministic evidence-locked recovery for any model gap.
  const pools:
    MouthCandidatePool[] =
    input.beats
      .map((beat) => {
        const entry =
          merged.variantsByBeat.find(
            (item) =>
              item.order ===
              beat.order,
          );

        const rawCandidates =
          (
            entry?.variants ??
            []
          )
            .map(
              (text) =>
                scoreMouthCandidate(
                  {
                    text,
                    beat,
                    envelope,
                    priorTexts:
                      input.priorTexts
                        ? [
                            ...input.priorTexts,
                          ]
                        : [],
                  },
                ),
            )
            .map(
              applyLatentStoryPenalty,
            );

        const candidates =
          adaptMouthCandidatePool({
            candidates:
              rawCandidates,
            beat,
            envelope,
            priorTexts:
              input.priorTexts
                ? [
                    ...input.priorTexts,
                  ]
                : [],
          }).slice(
            0,
            policy.beamCandidatesPerBeat,
          );

        return {
          order:
            beat.order,
          candidates,
        };
      })
      .sort(
        (a, b) =>
          a.order -
          b.order,
      );

  const missingPools =
    pools
      .filter(
        (pool) =>
          pool.candidates
            .length === 0,
      )
      .map(
        (pool) =>
          pool.order,
      );

  if (
    missingPools.length
  ) {
    return {
      resultText:
        result.text,
      texts: [],
      candidates: [],
      beamScore: 0,
      modelCalls,
    };
  }

  const beam =
    selectBestMouthSequence(
      pools,
      {
        width:
          policy.beamWidth,
        candidatesPerBeat:
          policy.beamCandidatesPerBeat,
      },
    );

  return {
    resultText:
      result.text,
    texts:
      beam.texts,
    candidates:
      beam.candidates,
    beamScore:
      beam.score,
    modelCalls,
  };
}

export async function realizeEnterpriseMouth(
  input: EnterpriseMouthInput,
): Promise<EnterpriseMouthResult> {
  const policy =
    getEnterpriseMouthPolicy();

  const envelope =
    buildAuthorRealityEnvelope({
      graph:
        input.graph,
      subject:
        input.subject,
    });

  const canonicalBeats =
    canonicalizeBeats(
      input.beats,
    ).slice(
      0,
      policy.maxBeats,
    );

  const meaningSpine =
    buildMeaningSpine({
      envelope,
      beats:
        canonicalBeats,
    });

  const realizationSlots =
    buildRealizationSlots({
      envelope,
      beats:
        canonicalBeats,
      spine:
        meaningSpine,
      fast:
        policy.mode ===
        "dev-fast",
    });

  const enterpriseIntelligence =
    buildEnterpriseIntelligence({
      graph:
        input.graph,
      subject:
        input.subject,
      lens:
        input.lens,
      beats:
        canonicalBeats,
    });

  if (
    policy.mode ===
    "no-model"
  ) {
    const cumulativeStates =
      buildCumulativeMeaningState(
        canonicalBeats,
        envelope,
      );

    return {
      texts: [],
      candidates: [],
      rawModelText:
        JSON.stringify({
          variantsByBeat: [],
        }),
      beamScore: 0,
      envelope,
      meaningSpine,
      realizationSlots,
      repairObjectives: [],
      policy,
      modelCallCount: 0,
      enterpriseIntelligence,
      cumulativeMeaningScore:
        evaluateCumulativeMeaning(
          cumulativeStates,
        ),
      creativeCritique:
        critiqueCreativeSelection(
          "",
          [],
        ),
      safetyViolations: [],
      groundedSurprise: 0,
    };
  }

  let current =
    await generateBeam(
      {
        ...input,
        beats:
          canonicalBeats,
      },
      envelope,
      realizationSlots,
      policy,
      meaningSpine,
    );

  let failures =
    qualityFailures(
      current.texts,
      current.candidates,
      canonicalBeats.length,
      current.beamScore,
    );

  let modelCallCount =
    current.modelCalls;

  const repairObjectives =
    buildMouthRepairObjectives({
      candidates:
        current.candidates,
      slots:
        realizationSlots,
    });

  if (
    failures.length > 0 &&
    policy.maxRevisionCalls >
      0 &&
    modelCallCount <
      policy.maxTotalModelCalls
  ) {
    const remainingCalls =
      policy.maxTotalModelCalls -
      modelCallCount;

    const revisionPolicy: EnterpriseMouthExecutionPolicy =
      {
        ...policy,
        maxPrimaryCalls:
          remainingCalls >
          0
            ? 1
            : 0,
        maxRecoveryCalls:
          remainingCalls >
          1
            ? 1
            : 0,
        maxRevisionCalls: 0,
        maxTotalModelCalls:
          remainingCalls,
        beamWidth:
          policy.beamWidth,
        beamCandidatesPerBeat:
          policy.beamCandidatesPerBeat,
      };

    if (
      revisionPolicy.maxPrimaryCalls >
      0
    ) {
      const revised =
        await generateBeam(
          {
            ...input,
            beats:
              canonicalBeats,
            priorTexts:
              current.texts,
            revisionGuidance: [
              ...(input.revisionGuidance ??
                []),
              ...compactRepairInstructions(
                repairObjectives,
                8,
              ),
              ...failures,
              "QUALITY GATE FAILED. Do not merely paraphrase the previous candidates.",
              "Meaning shifts must be grounded in actual graph relationships.",
              "Concrete verbs are evidence-sensitive: use only supplied actions or direct universal equivalents.",
              "Interpretation may change the reading of evidence, but may not create a new concrete action, object, person, setting, or reaction.",
              "For multi-signal beats, preserve enough evidence to make the transition legible without naming the operation.",
              "The final supplied endpoint is the end of this source sequence. Do not continue beyond it or replace it with a new invented ending.",
            ],
            temperature:
              Math.max(
                0.42,
                (
                  input.temperature ??
                  policy.temperature
                ) -
                  0.06,
              ),
          },
          envelope,
          realizationSlots,
          revisionPolicy,
          meaningSpine,
        );

      const revisedFailures =
        qualityFailures(
          revised.texts,
          revised.candidates,
          canonicalBeats.length,
          revised.beamScore,
        );

      modelCallCount +=
        revised.modelCalls;

      if (
        revisedFailures.length <
          failures.length ||
        (
          revisedFailures.length ===
            failures.length &&
          revised.beamScore >
            current.beamScore
        )
      ) {
        current =
          revised;
        failures =
          revisedFailures;
      }
    }
  }

  const safetyViolations = [
    ...new Set(
      current.texts.flatMap(
        (text) =>
          detectAuthorSafetyViolations(
            {
              text,
              envelope,
            },
          ),
      ),
    ),
  ];

  const cumulativeStates =
    buildCumulativeMeaningState(
      canonicalBeats,
      envelope,
    );

  const finalText =
    current.texts.join(
      " ",
    );

  return {
    texts:
      current.texts,
    candidates:
      current.candidates,
    rawModelText:
      current.resultText,
    beamScore:
      current.beamScore,
    envelope,
    meaningSpine,
    realizationSlots,
    repairObjectives,
    policy,
    modelCallCount,
    enterpriseIntelligence,
    cumulativeMeaningScore:
      evaluateCumulativeMeaning(
        cumulativeStates,
      ),
    creativeCritique:
      critiqueCreativeSelection(
        finalText,
        [],
      ),
    safetyViolations,
    groundedSurprise:
      surpriseScore(
        finalText,
        envelope,
      ),
  };
}