import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  SequenceCut,
  SequencePlay,
  ViewerAttentionRole,
  ViewerState,
} from "@qre/contracts";

import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import { searchUniversalMovieCandidates } from "./authorUniversalMovieSearch.js";
import { classifyAuthorRealizationMode, type AuthorRealizationMode } from "./authorRealizationMode.js";
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearch.js";
import { selectBestMouthSequence, type MouthCandidatePool } from "./authorMouthSequenceBeamSearch.js";
import { editAttentionSequence } from "./authorAttentionEditor.js";
import { evaluateSequenceArc } from "./authorSequenceArcGate.js";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function looksLikeIdentityAssertion(text: string): boolean {
  const value = clean(text).toLowerCase();
  return /^(?:\w+\s+)?(?:is|are|was|were)\s+(?:a|an|the)\b/.test(value);
}

function lensFrom(input: AuthorBrainTruth, cognition: ReturnType<typeof buildAuthorCognitivePlan>): string {
  return clean(input.lens) || clean(cognition.selectedFrame) || "NONE";
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
    memoryContext: [],
    priorScenes: [],
    priorStrategies: [],
    movieMode: input.movieMode,
  });
}

function orderedSourceCandidate(
  graph: ReturnType<typeof buildAuthorRealityGraph>,
  lens: string,
  materialOnly = false,
): LatentMovieCandidate | undefined {
  const events = graph.events.filter((event) => !looksLikeIdentityAssertion(event.label) && clean(event.label));
  if (!events.length) return undefined;

  const selected = events.slice(0, Math.min(6, events.length));
  const trajectory: LatentMovieTrajectoryStep[] = selected.map((event, index) => ({
    order: index + 1,
    operation: index === 0 ? "establish" : index === selected.length - 1 ? "payoff" : "reveal",
    eventIds: [event.id],
    viewerChange: index === 0 ? `Establish supplied detail: ${event.label}.` : `Advance to supplied detail: ${event.label}.`,
    nextQuestion: index === selected.length - 1 ? "What is now true at the ending?" : "What changes on the next cut?",
  }));

  const evidence = selected.map((event) => event.label);
  const specificity = metric(
    selected.reduce(
      (sum, event) => sum + Math.min(1, event.entities.length * 0.08 + event.label.split(/\s+/).length * 0.05),
      0,
    ) / Math.max(1, selected.length),
  );

  return {
    id: materialOnly ? "memory-material" : "movie-ordered-source",
    lens,
    anchorEventIds: selected.length >= 2 ? [selected[0].id, selected[selected.length - 1].id] : [selected[0].id],
    supportingRelationKinds: [],
    trajectory,
    payoff: materialOnly ? "" : selected[selected.length - 1]?.label ?? "",
    unresolvedQuestion: materialOnly ? "" : "What becomes newly meaningful?",
    evidence,
    hypothesis: [
      "Preserve supplied order as presentation order only.",
      "Do not treat input order as proof of chronology.",
      "Do not invent a bridge event between supplied details.",
    ],
    truthRisk: 0.02,
    novelty: metric(0.45 + specificity * 0.25),
    specificity,
    informationValue: metric(0.48 + specificity * 0.35),
    uncertainty: 0.18,
    attentionPotential: metric(0.44 + selected.length * 0.07),
    consequencePotential: metric(0.25 + selected.length * 0.08),
    callbackPotential: 0.12,
    compressionPotential: 0.74,
    repetitionRisk: 0.02,
    distinctiveness: 1,
    score: metric(0.48 + specificity * 0.2 + Math.min(0.18, selected.length * 0.03)),
  };
}
function chooseMovie(
  input: AuthorBrainTruth,
  graph: ReturnType<typeof buildAuthorRealityGraph>,
  lens: string,
  realizationMode: AuthorRealizationMode,
): LatentMovieCandidate | undefined {
  if (input.movieMode === false) return undefined;

  /*
   * Non-sequence modes keep the safe supplied-material path.
   *
   * Sequence Film uses the existing Universal Movie Search as the
   * authoritative trajectory selector. The ordered source candidate
   * is fallback only; raw input order must never outrank a discovered
   * semantic trajectory merely because it contains more facts.
   */
  if (realizationMode !== "sequence-film") {
    return orderedSourceCandidate(graph, lens, true);
  }

  const candidates = searchUniversalMovieCandidates({
    graph,
    subject: clean(input.subject),
    lens,
    limit: 8,
  });

  if (process.env.QRE_AUTHOR_DEBUG_MOVIE === "true") {
    console.log("\n--- QRE MOVIE CANDIDATES ---");

    candidates.forEach((candidate, index) => {
      console.log(
        `CANDIDATE ${index + 1} | id=${candidate.id} | score=${candidate.score} | payoff=${candidate.payoff}`,
      );

      for (const step of candidate.trajectory) {
        const labels = step.eventIds
          .map(
            (id) =>
              graph.events.find((event) => event.id === id)?.label ?? id,
          )
          .join(" -> ");

        console.log(
          `  [${step.order}] ${step.operation} | ${labels}`,
        );
      }
    });

    console.log("--- END QRE MOVIE CANDIDATES ---\n");
  }

  const selected = candidates.find(
    (candidate) => candidate.trajectory.length >= 3,
  );

  return selected ?? orderedSourceCandidate(graph, lens);
}

function mouthBeats(movie: LatentMovieCandidate): MouthCandidateBeat[] {
  if (movie.id === "memory-material") {
    const eventIds = unique(movie.trajectory.flatMap((step) => step.eventIds ?? []));
    return eventIds.map((eventId, index) => ({
      order: index + 1,
      role: "material",
      attentionFunction: "Realize one supplied Living Memory detail or a grounded relationship among supplied details.",
      eventIds: [eventId],
      change: "Make this supplied material interesting without turning it into an invented occurrence.",
      next: "",
      frontier: "",
      paysOff: [],
      relationKinds: [],
    }));
  }

  return movie.trajectory.map((step, index) => ({
    order: step.order,
    role: index === 0 ? "establishing" : index === movie.trajectory.length - 1 ? "payoff" : "reveal",
    attentionFunction: step.viewerChange,
    eventIds: step.eventIds,
    change: step.viewerChange,
    next: step.nextQuestion,
    frontier: step.nextQuestion,
    paysOff: index === movie.trajectory.length - 1 ? [step.eventIds[0]] : [],
    relationKinds: movie.supportingRelationKinds,
  }));
}

function makeSequence(
  selected: ReturnType<typeof selectBestMouthSequence>,
  beats: MouthCandidateBeat[],
  subject: string,
  movie: LatentMovieCandidate,
): SequencePlay {
  const cuts: SequenceCut[] = selected.candidates.map((candidate, index, candidates) => {
    const before: ViewerState = {
      known: candidates.slice(0, index).map((item) => clean(item.text)),
      recentChange: index > 0 ? clean(candidates[index - 1]?.text) : undefined,
    };
    const after: ViewerState = {
      known: [...before.known, clean(candidate.text)].filter(Boolean),
      recentChange: clean(candidate.text),
    };
    const beat = beats[index];
    const sourceIds = unique(beat?.eventIds ?? []);
    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role: (beat?.role ?? "discovery") as ViewerAttentionRole,
      sourceIds,
      informationGain: clean(candidate.text),
      attentionDelta: clean(beat?.next),
      viewerBefore: before,
      viewerAfter: after,
      necessity: { necessary: true, reason: clean(beat?.change) || "advances supplied reality" },
      nextPromise: clean(beat?.next),
      payoffConnection: index === candidates.length - 1 ? clean(movie.payoff) : undefined,
      confidence: metric(candidate.score),
    };
  });

  return {
    subject,
    premise: cuts[0]?.informationGain ?? "",
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: [],
    cuts,
    closingState: cuts.length ? cuts[cuts.length - 1].viewerAfter : undefined,
    continuation: cuts.length ? "The memory can continue with another supplied detail." : undefined,
  };
}

export type CanonicalAuthorResult = {
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
    qualityStatus: "ACCEPTED" | "REJECTED";
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
    unique(input.sourceMoments);

  const graph =
    buildAuthorRealityGraph({
      prompt: clean(input.prompt),
      subject,
      place: clean(input.place),
      facts,
      sourceMoments,
      memoryContext: [],
      trajectory: [],
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
    classifyAuthorRealizationMode({
      prompt: clean(input.prompt),
      facts,
      sourceMoments,
      relationKinds:
        graph.relations.map(
          (relation) =>
            relation.kind,
        ),
      movieMode:
        input.movieMode,
    });

  const lens =
    lensFrom(
      input,
      cognition,
    );

  const movie =
    chooseMovie(
      input,
      graph,
      lens,
      realizationMode,
    );

  if (
    process.env.QRE_AUTHOR_DEBUG_MOVIE ===
    "true"
  ) {
    console.log(
      "\n--- QRE AUTHOR MOVIE ---",
    );

    console.log(
      `movieId=${movie?.id ?? "none"}`,
    );

    console.log(
      `trajectoryLength=${movie?.trajectory.length ?? 0}`,
    );

    for (
      const step of
        movie?.trajectory ?? []
    ) {
      const labels =
        step.eventIds
          .map(
            (id) =>
              graph.events.find(
                (event) =>
                  event.id === id,
              )?.label ?? id,
          )
          .join(" -> ");

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
    movie.trajectory.length < 1
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
        angle: lens,
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
        callback: "none",
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
          process.env.QRE_LOCAL_MODEL ||
          "unknown",
        modelCalls: 0,
        candidateSequences: 0,
        acceptedCandidates: 0,
        qualityStatus:
          "REJECTED",
        renderable: false,
        complete: false,
        selectedScore: 0,
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
    buildAuthorRealityEnvelope({
      graph,
      subject,
    });

  const beats =
    mouthBeats(movie);

  const messages =
    buildMouthCandidateMessages({
      envelope,
      beats,
      lens,
    });

  let modelName =
    process.env
      .QRE_AUTHOR_FAST_MODEL ||
    process.env.QRE_LOCAL_MODEL ||
    "unknown";

  let modelCalls = 0;

  let pools:
    MouthCandidatePool[] =
    [];

  try {
    const generated =
      await localModelGenerate(
        messages,
        "json",
        {
          numPredict: 1024,
          temperature: 0.7,
        },
      );

    modelCalls =
      beats.length;

    modelName =
      generated.model ||
      modelName;

    const parsed =
      parseMouthCandidateBatch(
        generated.text,
      );

    if (parsed) {
      pools =
        beats.map(
          (beat) => ({
            order:
              beat.order,

            candidates:
              (
                parsed.variantsByBeat.find(
                  (item) =>
                    item.order ===
                    beat.order,
                )?.variants ?? []
              )
                .map(
                  (text) =>
                    scoreMouthCandidate({
                      text,
                      beat,
                      envelope,
                    }),
                )
                .filter(
                  (candidate) =>
                    candidate.text.length >
                    0,
                ),
          }),
        );
    }
  } catch {
    modelCalls =
      Math.max(
        1,
        beats.length,
      );
  }

  const usablePools =
    pools.length ===
      beats.length &&
    pools.every(
      (pool) =>
        pool.candidates.length >
        0,
    )
      ? pools
      : beats.map(
          (beat) => ({
            order:
              beat.order,

            candidates:
              (() => {
                const source =
                  beat.eventIds
                    ?.map(
                      (id) =>
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
                    .filter(Boolean)[0];

                return source
                  ? [
                      scoreMouthCandidate({
                        text: source,
                        beat,
                        envelope,
                      }),
                    ]
                  : [];
              })(),
          }),
        );

  if (
    process.env.QRE_AUTHOR_DEBUG_MOVIE ===
    "true"
  ) {
    console.log(
      "\n--- QRE MOUTH POOLS ---",
    );

    for (
      const pool of usablePools
    ) {
      console.log(
        `beat=${pool.order} candidates=${pool.candidates.length}`,
      );

      for (
        const candidate of
          pool.candidates
      ) {
        console.log(
          `  - ${candidate.text} | score=${candidate.score} | events=${candidate.supportedEventIds.join(",")}`,
        );
      }
    }

    console.log(
      "--- END QRE MOUTH POOLS ---\n",
    );
  }

  const selected =
    selectBestMouthSequence(
      usablePools,
      {
        width: 12,
        candidatesPerBeat: 8,
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
            order: index + 1,
            role:
              beats[index]?.role,
            gainKind:
              index === 0
                ? "baseline"
                : index ===
                    selected.candidates.length -
                      1
                  ? "payoff"
                  : "new_fact",
            text:
              candidate.text,
            sourceIds: [
              ...(beats[index]
                ?.eventIds ?? []),
            ],
            attentionFunction:
              beats[index]
                ?.attentionFunction,
            next:
              beats[index]?.next,
            frontier:
              beats[index]
                ?.frontier,
            setsUp: [],
            paysOff:
              index ===
              selected.candidates.length -
                1
                ? [movie.payoff]
                : [],
          }),
        ),
      evidence:
        movie.evidence,
    });

  const arc =
    selected.candidates.length >= 3
      ? evaluateSequenceArc(
          selected.candidates.map(
            (
              candidate,
              index,
            ) => ({
              order:
                index + 1,
              role:
                beats[index]?.role,
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
                beats[index]?.next,
              frontier:
                beats[index]
                  ?.frontier,
              setsUp: [],
              paysOff:
                index ===
                selected.candidates.length -
                  1
                  ? [movie.payoff]
                  : [],
            }),
          ),
        )
      : {
          accepted: true,
        };
       const scenes: AuthorScene[] =
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
            selected.candidates.length - 1
              ? "payoff"
              : index === 0
                ? "hook"
                : "turn"
          ) as AuthorScene["kind"],
      }),
    );

  const minimumCuts =
    realizationMode ===
    "sequence-film"
      ? 3
      : 1;

    const sequenceSourcesComplete =
  sequence.cuts.every(
    (cut) =>
      cut.sourceIds.length > 0,
  );

const complete =
  scenes.length >= minimumCuts &&
  scenes.length === sequence.cuts.length &&
  sequenceSourcesComplete &&
  attention.accepted === true &&
  arc.accepted === true;

if (
  process.env.QRE_AUTHOR_DEBUG_MOVIE ===
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
      angle: lens,
      engine:
        `source reality → ${realizationMode} → deterministic sequence → single Mouth realization`,
      question:
        movie.unresolvedQuestion,
      strongestImage:
        movie.evidence[0] ??
        "",
      tension:
        "novelty → contrast → consequence → payoff",
      payoff:
        movie.payoff,
      callback:
        "none",
      rhythm:
        selected.candidates.map(
          (candidate) => {
            const wordCount =
              clean(
                candidate.text,
              )
                .split(/\s+/)
                .filter(Boolean)
                .length;

            return wordCount <= 7
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
      model: modelName,
      modelCalls,
      candidateSequences: 1,
      acceptedCandidates:
        selected.candidates.length,
      qualityStatus:
        complete
          ? "ACCEPTED"
          : "REJECTED",
      renderable:
        complete,
      complete,
      selectedScore:
        selected.score,
      rejectedCandidates: [],
    },
  };
}