
import type {
 AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  MouthCandidatePool,
  SequenceCut,
  SequencePlay,
  ViewerAttentionRole,
  ViewerState,
} from "@qre/contracts";

import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import { deriveViewerStateCut } from "./authorMouthCandidateSearch.js";
import {
  classifyAuthorRealizationMode,
  type AuthorRealizationMode,
} from "./authorRealizationMode.js";
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearchCanonical.js";

import { editAttentionSequence } from "./authorAttentionEditor.js";
import { evaluateSequenceArc } from "./authorSequenceArcGate.js";
import { localModelGenerate } from "./localModelRuntime.js";
import {
  isAuthorizedMouthCandidate,
  selectBestMouthSequence,
} from "./authorMouthSequenceBeamSearch.js";
const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, value)).toFixed(3),
  );

const unique = (
  values: readonly string[],
): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function looksLikeIdentityAssertion(
  text: string,
): boolean {
  const value = clean(text).toLowerCase();

  return /^(?:\w+\s+)?(?:is|are|was|were)\s+(?:a|an|the)\b/.test(
    value,
  );
}

function lensFrom(
  input: AuthorBrainTruth,
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
): string {
  return (
    clean(input.lens) ||
    clean(cognition.selectedFrame) ||
    "NONE"
  );
}

function buildCognition(
  input: AuthorBrainTruth,
  graph: ReturnType<typeof buildAuthorRealityGraph>,
): ReturnType<typeof buildAuthorCognitivePlan> {
  return buildAuthorCognitivePlan({
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    subject: clean(input.subject),
    place: clean(input.place),
    facts: unique(input.facts),
    sourceMoments: unique(input.sourceMoments),
    realityGraph: graph,
    memoryContext: input.memoryContext ?? [],
    domainContext: input.domainContext,
    priorScenes: input.trajectory ?? [],
    priorStrategies: input.creativeLearningContext ?? [],
    movieMode: input.movieMode,
  });
}

function chooseMovie(
  input: AuthorBrainTruth,
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
): LatentMovieCandidate | undefined {
  if (input.movieMode === false) {
    return undefined;
  }

  /*
   * COGNITION IS THE SOLE MOVIE AUTHORITY.
   *
   * Search, structural analysis, viewer-state reasoning, and thesis
   * enrichment happen upstream in Author Cognition.
   *
   * The canonical Brain never invents another movie.
   */
  return cognition.selectedMovie;
}

function realizationAuthorityForBeat(
  movie: LatentMovieCandidate,
  step: LatentMovieTrajectoryStep,
): string {
  const thesis =
    movie.storyThesis;

  if (!thesis) {
    return "";
  }

  const semanticTurn =
    clean(thesis.semanticTurn);

  const relationKind =
    clean(thesis.relationKind);

  const beforeMeaning = unique(
    thesis.beforeMeaning ?? [],
  );

  const afterMeaning = unique(
    thesis.afterMeaning ?? [],
  );

  const payoffDependency =
    clean(thesis.payoffDependency);

  const thesisEventIds =
    unique([
      ...(thesis.beforeEventIds ?? []),
      ...(thesis.afterEventIds ?? []),
    ]);

  const touchesThesis =
    step.eventIds.some((id) =>
      thesisEventIds.includes(id),
    );

  /*
   * Whole-world material movies are deliberately allowed to have no
   * semantic thesis. Do not manufacture one here.
   */
  if (!semanticTurn) {
    return [
      "CANONICAL SEMANTIC THESIS: none.",
      "This supplied sequence is material/presentation structure, not a graph-backed semantic turn.",
      "Realize the current supplied beat without inventing a relationship that the graph does not establish.",
    ].join(" ");
  }

  const lines: string[] = [
    `CANONICAL SEMANTIC TURN: ${semanticTurn}`,
  ];

  if (relationKind) {
    lines.push(
      `CANONICAL RELATION: ${relationKind}`,
    );
  }

  if (beforeMeaning.length) {
    lines.push(
      `CANONICAL BEFORE: ${beforeMeaning.join(
        " | ",
      )}`,
    );
  }

  if (afterMeaning.length) {
    lines.push(
      `CANONICAL AFTER: ${afterMeaning.join(
        " | ",
      )}`,
    );
  }

  if (payoffDependency) {
    lines.push(
      `CANONICAL PAYOFF DEPENDENCY: ${payoffDependency}`,
    );
  }

  if (touchesThesis) {
    lines.push(
      "CURRENT CUT PARTICIPATES IN THE APPROVED SEMANTIC TURN: realize the change in meaning rather than merely restating the source event.",
    );
  } else if (
    step.operation === "payoff"
  ) {
    lines.push(
      "CURRENT CUT IS THE APPROVED ENDPOINT: preserve the supplied endpoint and let the earlier semantic movement earn it.",
    );
  } else {
    lines.push(
      "CURRENT CUT IS SUPPORTING SEQUENCE MATERIAL: preserve the approved thesis as context without forcing this cut to perform the entire turn.",
    );
  }

  lines.push(
    "This authority changes language realization only. It never authorizes a new concrete event.",
  );

  return lines.join(" ");
}

function mouthBeats(
  movie: LatentMovieCandidate,
): MouthCandidateBeat[] {
  if (
    movie.id ===
    "memory-material"
  ) {
    const eventIds = unique(
      movie.trajectory.flatMap(
        (step) =>
          step.eventIds ?? [],
      ),
    );

    return eventIds.map(
      (eventId, index) => ({
        order: index + 1,
        role: "material",
        attentionFunction:
          "Realize one supplied Living Memory detail or a grounded relationship among supplied details.",
        eventIds: [eventId],
        change:
          "Make this supplied material interesting without turning it into an invented occurrence.",
        next: "",
        frontier: "",
        paysOff: [],
        relationKinds: [],
      }),
    );
  }

  return movie.trajectory.map(
    (step, index) => {
      const canonicalAuthority =
        realizationAuthorityForBeat(
          movie,
          step,
        );

      const baseAttention =
        clean(step.viewerChange);

      const attentionFunction =
        canonicalAuthority
          ? [
              baseAttention,
              canonicalAuthority,
            ]
              .filter(Boolean)
              .join(" ")
          : baseAttention;

      const baseChange =
        clean(step.viewerChange);

      const change =
        canonicalAuthority &&
        movie.storyThesis
          ?.semanticTurn &&
        step.eventIds.some(
          (id) =>
            movie.storyThesis
              ?.beforeEventIds?.includes(
                id,
              ) ||
            movie.storyThesis
              ?.afterEventIds?.includes(
                id,
              ),
        )
          ? movie.storyThesis
              .semanticTurn
          : baseChange;

      const next =
        clean(step.nextQuestion);

      const frontier =
        clean(step.nextQuestion);

      return {
        order: step.order,

        role:
          index === 0
            ? "establishing"
            : index ===
                movie.trajectory.length - 1
              ? "payoff"
              : "reveal",

        attentionFunction,

        eventIds: unique(
  step.eventIds,
),

        change,

        next,

        frontier,

        paysOff:
          index ===
          movie.trajectory.length - 1
            ? [movie.payoff]
            : [],

        relationKinds:
          movie.supportingRelationKinds,
      };
    },
  );
}

/**
 * The sequence cut's attention delta is the authorized viewer-state
 * transition already derived for the approved beat.
 *
 * IMPORTANT SEPARATION:
 *
 *   attentionDelta = what changed because of THIS cut
 *   nextPromise    = what the viewer may now anticipate
 *
 * These are different cognitive objects and must remain different.
 */
function viewerAttentionDelta(
  beat: MouthCandidateBeat | undefined,
): string {
  if (!beat) {
    return "";
  }

  const state =
    beat.viewerState;

  if (!state) {
    return "";
  }

  const before =
    clean(
      state.beforeState,
    );

  const after =
    clean(
      state.afterState,
    );

  if (
    before &&
    after &&
    before !== after
  ) {
    return `${before} → ${after}`;
  }

  if (after) {
    return after;
  }

  if (before) {
    return before;
  }

  return "";
}

function makeSequence(
  selected: ReturnType<
    typeof selectBestMouthSequence
  >,
  beats: MouthCandidateBeat[],
  subject: string,
  movie: LatentMovieCandidate,
): SequencePlay {
  const cuts: SequenceCut[] =
    selected.candidates.map(
      (
        candidate,
        index,
        candidates,
      ) => {
        const beat =
          beats[index];

        /*
         * ViewerBefore/ViewerAfter remain the renderer-facing state
         * accumulation representation.
         *
         * The authoritative cognitive transition is stored separately
         * in attentionDelta below.
         */
        const before: ViewerState =
          {
            known:
              candidates
                .slice(
                  0,
                  index,
                )
                .map(
                  (item) =>
                    clean(
                      item.text,
                    ),
                ),
            recentChange:
              index > 0
                ? clean(
                    candidates[
                      index - 1
                    ]?.text,
                  )
                : undefined,
          };

        const after: ViewerState =
          {
            known: [
              ...before.known,
              clean(
                candidate.text,
              ),
            ].filter(Boolean),

            recentChange:
              clean(
                candidate.text,
              ),
          };

        const sourceIds =
          unique(
            beat?.eventIds ??
              [],
          );

        return {
          id:
            `sequence-cut-${
              index + 1
            }`,

          order:
            index + 1,

          role:
            (beat?.role ??
              "discovery") as ViewerAttentionRole,

          sourceIds,

          informationGain:
            clean(
              candidate.text,
            ),

          /*
           * CANONICAL COGNITIVE TRANSITION.
           *
           * This is no longer beat.next.
           */
          attentionDelta:
            viewerAttentionDelta(
              beat,
            ),

          viewerBefore:
            before,

          viewerAfter:
            after,

          necessity: {
            necessary: true,

            reason:
              clean(
                beat?.change,
              ) ||
              "advances supplied reality",
          },

          /*
           * FUTURE EXPECTATION.
           *
           * Deliberately distinct from attentionDelta.
           */
          nextPromise:
            clean(
              beat?.next,
            ),

          payoffConnection:
            index ===
            candidates.length - 1
              ? clean(
                  movie.payoff,
                )
              : undefined,

          confidence:
            metric(
              candidate.score,
            ),
        };
      },
    );

  return {
    subject,

    premise:
      cuts[0]
        ?.informationGain ??
      "",

    openingState:
      cuts[0]
        ?.viewerBefore ?? {
        known: [],
      },

    baselineFacts: [],

    cuts,

    closingState:
      cuts.length
        ? cuts[
            cuts.length - 1
          ].viewerAfter
        : undefined,

    continuation:
      cuts.length
        ? "The memory can continue with another supplied detail."
        : undefined,
  };
}

export type CanonicalAuthorResult =
  {
    scenes: AuthorScene[];
    sequence: SequencePlay;
    movie?: LatentMovieCandidate;
    realizationMode: AuthorRealizationMode;
    brief: AuthorCreativeBrief;
    diagnostics: {
      model: string;
      modelCalls: number;
      candidateSequences: number;
      acceptedCandidates: number;
      recoveryUsed: boolean;
      qualityStatus:
        | "ACCEPTED"
        | "REJECTED";
      renderable: boolean;
      complete: boolean;
      selectedScore: number;
      rejectedCandidates: unknown[];
    };
  };

export async function authorBrainCanonical(
  input: AuthorBrainTruth,
): Promise<CanonicalAuthorResult> {
  const subject =
    clean(input.subject) ||
    "the subject";

  const facts =
    unique(input.facts);

  const sourceMoments =
    unique(
      input.sourceMoments,
    );

  const graph =
    buildAuthorRealityGraph({
      prompt:
        clean(input.prompt),

      subject,

      place:
        clean(input.place),

      facts,

      sourceMoments,

      memoryContext:
        input.memoryContext ?? [],

      trajectory:
        input.trajectory ?? [],
    });

  const cognition =
    buildCognition(
      {
        ...input,
        facts,
        sourceMoments,
      },
      graph,
    );

  const realizationMode =
    classifyAuthorRealizationMode(
      {
        prompt:
          clean(input.prompt),

        facts,

        sourceMoments,

        relationKinds:
          graph.relations.map(
            (relation) =>
              relation.kind,
          ),

        movieMode:
          input.movieMode,
      },
    );

  const lens =
    lensFrom(
      input,
      cognition,
    );

  const movie =
    chooseMovie(
      input,
      cognition,
    );

  if (
    process.env
      .QRE_AUTHOR_DEBUG_MOVIE ===
    "true"
  ) {
    console.log(
      "\n--- QRE AUTHOR MOVIE ---",
    );

    console.log(
      `movieId=${
        movie?.id ?? "none"
      }`,
    );

    console.log(
      `trajectoryLength=${
        movie?.trajectory.length ??
        0
      }`,
    );

    if (
      movie?.storyThesis
    ) {
      console.log(
        `semanticTurn=${
          movie.storyThesis
            .semanticTurn ||
          "none"
        }`,
      );

      console.log(
        `relationKind=${
          movie.storyThesis
            .relationKind ??
          "none"
        }`,
      );

      console.log(
        `beforeEventIds=${
          movie.storyThesis
            .beforeEventIds.join(
              ",",
            ) ||
          "none"
        }`,
      );

      console.log(
        `afterEventIds=${
          movie.storyThesis
            .afterEventIds.join(
              ",",
            ) ||
          "none"
        }`,
      );

      console.log(
        `payoffDependency=${
          movie.storyThesis
            .payoffDependency ||
          "none"
        }`,
      );
    }

    for (
      const step of
        movie?.trajectory ??
        []
    ) {
      const labels =
        step.eventIds
          .map(
            (id) =>
              graph.events.find(
                (event) =>
                  event.id ===
                  id,
              )?.label ?? id,
          )
          .join(
            " -> ",
          );

      console.log(
        `[${step.order}] operation=${step.operation} | ${labels}`,
      );
    }

    console.log(
      "--- END QRE AUTHOR MOVIE ---\n",
    );
  }

  if (
    !movie ||
    movie.trajectory.length <
      1
  ) {
    return {
      scenes: [],

      sequence: {
        subject,

        premise: "",

        openingState: {
          known: [],
        },

        cuts: [],
      },

      movie,

      realizationMode,

      brief: {
        angle:
          lens,

        engine:
          `source reality → ${realizationMode} → single Mouth realization`,

        question:
          "What supplied detail should land next?",

        strongestImage:
          graph.events.find(
            (event) =>
              !looksLikeIdentityAssertion(
                event.label,
              ),
          )?.label ?? "",

        tension:
          "novelty → contrast → consequence → payoff",

        payoff:
          movie?.payoff ?? "",

        callback:
          "none",

        rhythm: [
          "hit",
          "standard",
          "hit",
          "short",
        ],

        avoid: [
          "fact parade",
          "invented events",
          "planner prose",
        ],
      },

      diagnostics: {
        model:
          process.env
            .QRE_AUTHOR_FAST_MODEL ||
          process.env
            .QRE_LOCAL_MODEL ||
          "unknown",

        modelCalls: 0,

        candidateSequences: 0,

        acceptedCandidates: 0,

        recoveryUsed:
          false,

        qualityStatus:
          "REJECTED",

        renderable:
          false,

        complete:
          false,

        selectedScore:
          0,

        rejectedCandidates: [
          {
            reason:
              "no-supplied-sequence-material",
          },
        ],
      },
    };
  }

  const envelope =
    buildAuthorRealityEnvelope(
      {
        graph,
        subject,
      },
    );

  /*
   * ================================================================
   * CANONICAL BRAIN → MOUTH AUTHORITY HANDOFF
   * ================================================================
   *
   * Cognition owns the selected movie and its semantic authority.
   *
   * Mouth receives approved beats plus an already-derived viewer state.
   *
   * Mouth may realize meaning.
   * Mouth may not become a second planner.
   */
  const beats =
    mouthBeats(
      movie,
    ).map(
      (
        beat,
        index,
        allBeats,
      ) => ({
        ...beat,

        viewerState:
          deriveViewerStateCut(
            beat,
            index,
            allBeats,
            envelope,
          ),
      }),
    );

  if (
    process.env
      .QRE_AUTHOR_DEBUG_MOVIE ===
    "true"
  ) {
    console.log(
      "\n--- QRE MOUTH AUTHORITY ---",
    );

    console.log(
      `movieId=${movie.id}`,
    );

    console.log(
      `semanticTurn=${
        movie.storyThesis
          ?.semanticTurn ||
        "none"
      }`,
    );

    console.log(
      `relationKind=${
        movie.storyThesis
          ?.relationKind ??
        "none"
      }`,
    );

    console.log(
      `beats=${beats.length}`,
    );

    beats.forEach(
      (beat) => {
        console.log(
          `  beat=${beat.order}`,
        );

        console.log(
          `  attention=${beat.attentionFunction}`,
        );

        console.log(
          `  change=${beat.change}`,
        );

        if (
          beat.viewerState
        ) {
          console.log(
            `  viewerBefore=${beat.viewerState.beforeState}`,
          );

          console.log(
            `  viewerAfter=${beat.viewerState.afterState}`,
          );

          console.log(
            `  viewerMove=${beat.viewerState.attentionMove}`,
          );

          console.log(
            `  curiosity=${beat.viewerState.curiosityPressure}`,
          );

          console.log(
            `  predictionError=${beat.viewerState.predictionError}`,
          );
        }
      },
    );

    console.log(
      "--- END QRE MOUTH AUTHORITY ---\n",
    );
  }

  const messages =
    buildMouthCandidateMessages({
      envelope,
      beats,
      lens,
      domainContext:
        input.domainContext,
    });

  let modelName =
    process.env
      .QRE_AUTHOR_FAST_MODEL ||
    process.env
      .QRE_LOCAL_MODEL ||
    "unknown";

  let modelCalls = 0;

  let pools:
    MouthCandidatePool[] = [];

  try {
    const generated =
      await localModelGenerate(
        messages,
        "json",
        {
          numPredict:
            2048,

          temperature:
            0.7,

          jsonSchema: {
            type: "object",

            properties: {
              variantsByBeat: {
                type: "array",

                items: {
                  type: "object",

                  properties: {
                    order: {
                      type: "integer",
                    },

                    variants: {
                      type: "array",

                      items: {
                        type: "string",
                      },

                      minItems:
                        3,

                      maxItems:
                        3,
                    },
                  },

                  required: [
                    "order",
                    "variants",
                  ],

                  additionalProperties:
                    false,
                },
              },
            },

            required: [
              "variantsByBeat",
            ],

            additionalProperties:
              false,
          },
        },
      );

    modelCalls =
      1;

    modelName =
      generated.model ||
      modelName;

    const parsed =
      parseMouthCandidateBatch(
        generated.text,
      );

    if (
      parsed
    ) {
     pools =
  beats.map(
    (
      beat,
    ) => ({
      order:
        beat.order,

      viewerState:
        beat.viewerState,

      nextPromise:
        clean(
          beat.next,
        ),

      frontier:
        clean(
          beat.frontier,
        ),

      candidates:
        (
          parsed
            .variantsByBeat.find(
              (
                item,
              ) =>
                item.order ===
                beat.order,
            )
            ?.variants ??
          []
        )
          .map(
            (text) =>
              scoreMouthCandidate(
                {
                  text,
                  beat,
                  envelope,
                },
              ),
          )
          .filter(
            (
              candidate,
            ) =>
              candidate
                .text
                .length >
              0,
          ),
    }),
  );
    }
  } catch {
    modelCalls =
      1;
  }

  /*
   * ================================================================
   * PER-BEAT RECOVERY
   * ================================================================
   *
   * A failed candidate pool must NEVER erase successful generated
   * candidates from other beats.
   *
   * Example:
   *
   *   beat 1 -> generated candidates rejected
   *   beat 2 -> generated candidates survive
   *   beat 3 -> generated candidates survive
   *   beat 4 -> generated candidates survive
   *   beat 5 -> generated candidates survive
   *
   * Only beat 1 receives grounded source fallback.
   */
  let recoveryUsed =
    false;

  const usablePools:
    MouthCandidatePool[] =
    beats.map(
      (beat) => {
        const generatedPool =
          pools.find(
            (pool) =>
              pool.order ===
              beat.order,
          );

        const hasAuthorizedCandidate =
  generatedPool?.candidates.some(
    isAuthorizedMouthCandidate,
  ) ?? false;

if (
  generatedPool &&
  hasAuthorizedCandidate
) {
  return generatedPool;
}

        recoveryUsed =
          true;

        const source =
          beat.eventIds
            ?.map(
              (
                id,
              ) =>
                clean(
                  envelope.events.find(
                    (
                      event,
                    ) =>
                      event.id ===
                      id,
                  )?.label,
                ),
            )
            .find(
              Boolean,
            );

       return {
  order:
    beat.order,

  viewerState:
    beat.viewerState,

  nextPromise:
    clean(
      beat.next,
    ),

  frontier:
    clean(
      beat.frontier,
    ),

  candidates:
    source
      ? [
          scoreMouthCandidate(
            {
              text:
                source,

              beat,

              envelope,
            },
          ),
        ]
      : [],
};
      },
    );

  if (
    process.env
      .QRE_AUTHOR_DEBUG_MOVIE ===
    "true"
  ) {
    console.log(
      "\n--- QRE MOUTH POOLS ---",
    );

    for (
      const pool of
        usablePools
    ) {
      console.log(
        `beat=${pool.order} candidates=${pool.candidates.length}`,
      );

      for (
        const candidate of
          pool.candidates
      ) {
        console.log(
          `  - ${candidate.text} | score=${candidate.score} | events=${candidate.supportedEventIds.join(",")} | reasons=${candidate.reasons.join("|")}`,
        );
      }
    }

    console.log(
      `recoveryUsed=${recoveryUsed}`,
    );

    console.log(
      "--- END QRE MOUTH POOLS ---\n",
    );
  }

  /*
   * The Beam now receives the complete mixed pool:
   *
   *   generated candidates where available
   *   grounded fallback only where necessary
   *
   * There is no second whole-sequence downgrade.
   */
  const selected =
    selectBestMouthSequence(
      usablePools,
      {
        width:
          12,

        candidatesPerBeat:
          8,
      },
    );

  const sequence =
    makeSequence(
      selected,
      beats,
      subject,
      movie,
    );

  const attention =
    editAttentionSequence({
      beats:
        selected.candidates.map(
          (
            candidate,
            index,
          ) => ({
            order:
              index + 1,

            role:
              beats[index]
                ?.role,

            gainKind:
              index === 0
                ? "baseline"
                : index ===
                    selected
                      .candidates
                      .length -
                    1
                  ? "payoff"
                  : "new_fact",

            text:
              candidate.text,

            sourceIds: [
              ...(beats[index]
                ?.eventIds ??
                []),
            ],

            attentionFunction:
              beats[index]
                ?.attentionFunction,

            next:
              beats[index]
                ?.next,

            frontier:
              beats[index]
                ?.frontier,

            setsUp: [],

            paysOff:
              index ===
              selected
                .candidates
                .length -
              1
                ? [movie.payoff]
                : [],
          }),
        ),

      evidence:
        movie.evidence,
    });

  const arc =
    selected.candidates.length >=
    3
      ? evaluateSequenceArc(
          selected.candidates.map(
            (
              candidate,
              index,
            ) => ({
              order:
                index + 1,

              role:
                beats[index]
                  ?.role,

              attentionFunction:
                beats[index]
                  ?.attentionFunction,

              creativeMove:
                beats[index]
                  ?.creativeMove,

              text:
                candidate.text,

              change:
                beats[index]
                  ?.change,

              next:
                beats[index]
                  ?.next,

              frontier:
                beats[index]
                  ?.frontier,

              setsUp: [],

              paysOff:
                index ===
                selected
                  .candidates
                  .length -
                1
                  ? [movie.payoff]
                  : [],
            }),
          ),
        )
      : {
          accepted:
            true,
        };

  const scenes:
    AuthorScene[] =
    selected.candidates.map(
      (
        candidate,
        index,
      ) => ({
        text:
          clean(
            candidate.text,
          ),

        kind:
          (
            index ===
            selected
              .candidates
              .length -
            1
              ? "payoff"
              : index === 0
                ? "hook"
                : "turn"
          ) as AuthorScene[
            "kind"
          ],
      }),
    );

  const minimumCuts =
    realizationMode ===
    "sequence-film"
      ? 3
      : 1;

  const sequenceSourcesComplete =
    sequence.cuts.every(
      (
        cut,
      ) =>
        cut.sourceIds
          .length >
        0,
    );

  const complete =
    scenes.length >=
      minimumCuts &&
    scenes.length ===
      sequence.cuts.length &&
    sequenceSourcesComplete &&
    attention.accepted ===
      true &&
    arc.accepted ===
      true;

  if (
    process.env
      .QRE_AUTHOR_DEBUG_MOVIE ===
    "true"
  ) {
    console.log(
      "\n--- QRE AUTHOR COMPLETENESS ---",
    );

    console.log(
      `minimumCuts=${minimumCuts}`,
    );

    console.log(
      `sceneCount=${scenes.length}`,
    );

    console.log(
      `sequenceCutCount=${sequence.cuts.length}`,
    );

    console.log(
      `sequenceSourcesComplete=${sequenceSourcesComplete}`,
    );

    console.log(
      `attentionAccepted=${attention.accepted}`,
    );

    console.log(
      `arcAccepted=${arc.accepted}`,
    );

    console.log(
      `complete=${complete}`,
    );

    console.log(
      "--- END QRE AUTHOR COMPLETENESS ---\n",
    );
  }

  return {
    scenes,

    sequence,

    movie,

    realizationMode,

    brief: {
      angle:
        lens,

      engine:
        `source reality → ${realizationMode} → canonical movie → canonical thesis → viewer state → Mouth realization → sequence selection → validation`,

      question:
        movie.unresolvedQuestion,

      strongestImage:
        movie.evidence[0] ??
        "",

      tension:
        movie.storyThesis
          ?.semanticTurn
          ? "semantic turn → realization → consequence → payoff"
          : "novelty → contrast → consequence → payoff",

      payoff:
        movie.payoff,

      callback:
        "none",

      rhythm:
        selected.candidates.map(
          (
            candidate,
          ) => {
            const wordCount =
              clean(
                candidate.text,
              )
                .split(
                  /\s+/,
                )
                .filter(
                  Boolean,
                ).length;

            return wordCount <=
              7
              ? "short"
              : wordCount <=
                  20
                ? "standard"
                : "long";
          },
        ),

      avoid: [
        "invented event",
        "unsupported bridge",
        "generic summary",
      ],
    },

    diagnostics: {
      model:
        modelName,

      modelCalls,

      candidateSequences:
        1,

      acceptedCandidates:
        selected.candidates
          .length,

      recoveryUsed,

      qualityStatus:
        complete
          ? "ACCEPTED"
          : "REJECTED",

      renderable:
        complete,

      complete,

      selectedScore:
        selected.score,

      rejectedCandidates:
        [],
    },
  };
}

