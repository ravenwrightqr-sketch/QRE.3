/*
 * QRE CANONICAL AUTHOR
 *
 * One production creative path:
 *
 * raw input / supplied facts
 *   -> Reality Extractor
 *   -> RealityGraph
 *   -> Meaning
 *   -> Creative Search
 *   -> Creative Addition
 *   -> Treatment
 *   -> Realization
 *   -> Grounding
 *   -> contract/runtime projection
 *
 * TypeScript owns truth, provenance and output contracts.
 * The model owns creative interpretation and realization.
 */
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
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import type { AuthorReadout } from "./authorReadout.js";
import { extractAuthorReality } from "./authorRealityExtractor.js";
import {
  discoverAuthorCreativeDirection,
  type AuthorCreativeDiscovery,
} from "./authorCreativeDiscovery.js";
import { createAuthorExperience } from "./authorCreative.js";
import { verifyAuthorCreativeGrounding } from "./authorCreativeGroundingVerifier.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function memoryForActiveWorld(input: AuthorBrainTruth): string[] {
  const activeWorldId = clean(input.worldScope?.worldId);

  if (!activeWorldId) {
    return unique(input.memoryContext ?? []);
  }

  const allowedWorldIds = new Set([
    activeWorldId,
    ...(input.worldScope?.relatedWorldIds ?? []).map(clean).filter(Boolean),
  ]);

  return unique(
    (input.scopedMemoryContext ?? [])
      .filter((entry) => allowedWorldIds.has(clean(entry.worldId)))
      .map((entry) => clean(entry.text))
      .filter(Boolean),
  );
}

type CreativeSelection = {
  relationship: string;
  latentMovie: string;
  lens: string;
  confidence: number;
  why: string;
  risk: string;
};

function selectionFromDiscovery(discovery: AuthorCreativeDiscovery): CreativeSelection {
  return {
    relationship: discovery.selected.relationship,
    latentMovie: discovery.selected.perception,
    lens: discovery.lens,
    confidence: discovery.confidence,
    why: unique([
      discovery.selected.observerInference,
      discovery.selected.whyItHits,
      discovery.selectionReason,
    ]).join(" | "),
    risk: discovery.risk || discovery.selected.risk,
  };
}

function roleFor(index: number, total: number): ViewerAttentionRole {
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  return "discovery";
}

function makeSequence(
  subject: string,
  premise: string,
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>,
): SequencePlay {
  const cuts: SequenceCut[] = scenes.map((scene, index) => {
    const prior = scenes.slice(0, index).map((item) => item.text);
    const before: ViewerState = {
      known: prior,
      recentChange: prior.length ? prior[prior.length - 1] : undefined,
    };
    const after: ViewerState = {
      known: [...prior, scene.text],
      recentChange: scene.text,
    };

    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role: roleFor(index, scenes.length),
      gainKind: index === scenes.length - 1 ? "payoff" : "discovery",
      sourceIds: unique(scene.sourceEventIds),
      informationGain: scene.text,
      attentionDelta: scene.text,
      viewerBefore: before,
      viewerAfter: after,
      necessity: {
        necessary: true,
        reason: "QRE Creative experience beat",
      },
      confidence: 1,
    };
  });

  return {
    subject,
    premise,
    openingState: { known: [] },
    baselineFacts: [],
    cuts,
    closingState: cuts.length ? cuts[cuts.length - 1]?.viewerAfter : undefined,
    continuity: [],
    antiCrutch: [],
  };
}

function makeMovie(
  discovery: AuthorCreativeDiscovery,
  events: Array<{ id: string; text: string }>,
): LatentMovieCandidate {
  const trajectory: LatentMovieTrajectoryStep[] = events.map((event, index) => ({
    order: index + 1,
    operation:
      index === 0
        ? "establish"
        : index === events.length - 1
          ? "payoff"
          : "reveal",
    eventIds: [event.id],
    viewerChange: event.text,
    nextQuestion: "",
  }));

  return {
    id: "qre-creative-read",
    lens: discovery.lens,
    anchorEventIds: events.map((event) => event.id),
    supportingRelationKinds: [],
    trajectory,
    payoff: events.length ? events[events.length - 1]!.text : "",
    unresolvedQuestion: discovery.selected.observerInference,
    evidence: events.map((event) => event.text),
    hypothesis: [
      discovery.selected.perception ||
      discovery.selected.relationship ||
      "Grounded creative discovery from supplied reality.",
    ],
    truthRisk: 0,
    novelty: 0.7,
    specificity: 1,
    informationValue: 0.7,
    uncertainty: 0,
    attentionPotential: 0.8,
    consequencePotential: 0.7,
    callbackPotential: 0,
    compressionPotential: 0.7,
    repetitionRisk: 0,
    distinctiveness: 0.8,
    score: 0.8,
  };
}

function makeReadout(input: {
  subject: string;
  events: Array<{ id: string; text: string }>;
  scenes: AuthorScene[];
}): AuthorReadout {
  return {
    version: 1,
    identity: {
      subject: input.subject,
      round: 1,
    },
    sourceTruth: {
      eventCount: input.events.length,
      relationCount: 0,
      entityCount: 0,
      recurringSignals: [],
      unresolvedTensions: [],
      eventLabels: input.events.map((event) => event.text),
    },
    learnedProfile: {
      confidence: 0,
      compressionPreference: 0,
      explanationAversion: 0,
      callbackAffinity: 0,
      surprisePreference: 0,
      accelerationPreference: 0,
      revisitAffinity: 0,
      learnedSignals: [],
    },
    movieSearch: {
      candidateCount: 1,
      candidates: [],
    },
    realization: {
      mouthLines: input.scenes.map((scene) => scene.text),
      finalScenes: input.scenes.map((scene) => scene.text),
    },
    gates: [
      {
        name: "source_truth_present",
        passed: input.events.length > 0,
        reason: `${input.events.length} factual events supplied`,
      },
    ],
    invariants: {
      truthPreserved: true,
      learnedPreferenceOnly: true,
      movieSelectedBeforeMouth: true,
      noPlannerLanguage: true,
      noPartialSuccess: true,
    },
  };
}

export type CanonicalAuthorResult = {
  readout: AuthorReadout;
  scenes: AuthorScene[];
  sequence: SequencePlay;
  movie?: LatentMovieCandidate;
  realizationMode: "collection" | "state" | "sequence-film";
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
    semanticGate?: undefined;
    experienceJudge?: undefined;
    realizedFilmJudge?: undefined;
    selectedTreatment?: CreativeSelection;
    creativeDiscovery?: AuthorCreativeDiscovery;
    realityModel?: string;
    creativeDiscoveryModel?: string;
    bareAuthorPlan?: unknown;
    creativeTreatments?: unknown;
    mouthVariants?: unknown;
    mouthChoices?: unknown;
  };
  adaptiveQuestions: Array<{ kind: string; question: string; reason: string }>;
  world: ReturnType<typeof buildAuthorRealityGraph>;
};

export async function authorBrainCanonical(
  input: AuthorBrainTruth,
): Promise<CanonicalAuthorResult> {
  const prompt = clean(input.prompt);
  const suppliedFacts = unique(input.facts);
  const suppliedMoments = unique(input.sourceMoments);
  const activeMemory = memoryForActiveWorld(input);

  const receipt = input.realityGraph
    ? {
        subject: clean(input.subject) || clean(input.realityGraph.subject) || "the subject",
        facts: input.realityGraph.events.map((event) => clean(event.label)).filter(Boolean),
        model: "supplied-graph",
        modelCalls: 0,
      }
    : await extractAuthorReality({
        prompt,
        subject: clean(input.subject),
        facts: suppliedFacts,
        sourceMoments: suppliedMoments,
      });

  const subject = receipt.subject;

  const world =
    input.realityGraph ??
    buildAuthorRealityGraph({
      prompt,
      subject,
      place: clean(input.place),
      facts: receipt.facts,
      sourceMoments: [],
      memoryContext: activeMemory,
      trajectory: input.trajectory ?? [],
    });

  const events = world.events
    .map((event) => ({
      id: event.id,
      text: clean(event.label),
    }))
    .filter((event) => event.text);

  const discoveryResult = await discoverAuthorCreativeDirection({
    events,
    relations: world.relations.map((relation) => ({
      from: relation.from,
      to: relation.to,
      kind: relation.kind,
      strength: relation.strength,
    })),
    requestedLens: input.lens,
    memory: activeMemory,
    domainContext: input.domainContext,
  });

  const discoveryReady =
    events.length > 0 &&
    discoveryResult.discovery.selected.evidenceEventIds.length > 0 &&
    Boolean(
      discoveryResult.discovery.selected.perception ||
      discoveryResult.discovery.selected.relationship,
    );

  const creativeResult = discoveryReady
    ? await createAuthorExperience({
        subject,
        suppliedReality: events,
        creativeDiscovery: discoveryResult.discovery,
        requestedLens: input.lens,
        memory: activeMemory,
        domainContext: input.domainContext,
      })
    : {
        scenes: [],
        model: discoveryResult.model,
        modelCalls: 0,
        diagnostics: undefined,
      };

  let verifiedCreative = await verifyAuthorCreativeGrounding({
    scenes: creativeResult.scenes,
    suppliedReality: events,
    semanticAuthority: unique([
      discoveryResult.discovery.selected.perception,
      discoveryResult.discovery.selected.relationship,
    ]),
    domainContext: input.domainContext,
  });

  let groundingRecoveryModelCalls = 0;

  const memoryProductions =
    creativeResult.diagnostics?.memoryProductions ?? [];
  const groundingFailed =
    verifiedCreative.scenes.length < creativeResult.scenes.length;

  if (groundingFailed && memoryProductions.length) {
    const selectedProduction =
      creativeResult.diagnostics?.selectedProduction;
    const alternatives = memoryProductions
      .filter((production) =>
        production.accepted &&
        production.production !== selectedProduction,
      )
      .sort((a, b) => b.score - a.score);

    const originalKindByEvidence = new Map(
      creativeResult.scenes.map((scene) => [
        [...scene.sourceEventIds].sort().join(","),
        scene.kind,
      ]),
    );

    const alternativeScenes = alternatives.flatMap((production) =>
      production.lines.map((line) => ({
        text: line.text,
        kind:
          originalKindByEvidence.get(
            [...line.sourceEventIds].sort().join(","),
          ) ?? "line",
        sourceEventIds: [...line.sourceEventIds],
      })),
    );

    if (alternativeScenes.length) {
      const recovered = await verifyAuthorCreativeGrounding({
        scenes: alternativeScenes,
        suppliedReality: events,
        semanticAuthority: unique([
          discoveryResult.discovery.selected.perception,
          discoveryResult.discovery.selected.relationship,
        ]),
        domainContext: input.domainContext,
      });
      groundingRecoveryModelCalls += recovered.modelCalls;

      const verifiedKeys = new Set(
        recovered.scenes.map((scene) =>
          `${scene.text}::${[...scene.sourceEventIds].sort().join(",")}`,
        ),
      );

      const wholeProduction = alternatives.find((production) =>
        production.lines.every((line) =>
          verifiedKeys.has(
            `${line.text}::${[...line.sourceEventIds].sort().join(",")}`,
          ),
        ),
      );

      if (wholeProduction) {
        verifiedCreative = {
          ...verifiedCreative,
          scenes: wholeProduction.lines.map((line) => ({
            text: line.text,
            kind:
              originalKindByEvidence.get(
                [...line.sourceEventIds].sort().join(","),
              ) ?? "line",
            sourceEventIds: [...line.sourceEventIds],
          })),
        };
      } else {
        verifiedCreative = {
          ...verifiedCreative,
          scenes: creativeResult.scenes.map((scene) => ({
            ...scene,
            text: scene.sourceEventIds
              .map((id) => events.find((event) => event.id === id)?.text ?? "")
              .map(clean)
              .filter(Boolean)
              .join(" "),
          })),
        };
      }
    }
  } else if (
    groundingFailed &&
    creativeResult.diagnostics?.choices?.length
  ) {
    const verifiedSceneKeys = new Set(
      verifiedCreative.scenes.map((scene) =>
        `${scene.text}::${[...scene.sourceEventIds].sort().join(",")}`,
      ),
    );

    const missingChoices = creativeResult.diagnostics.choices.filter((choice) => {
      const original = creativeResult.scenes.find((scene) =>
        scene.sourceEventIds.length === choice.beat.eventIds.length &&
        scene.sourceEventIds.every((id) => choice.beat.eventIds.includes(id)),
      );
      if (!original) return false;
      const key = `${original.text}::${[...original.sourceEventIds].sort().join(",")}`;
      return !verifiedSceneKeys.has(key);
    });

    const recoveryCandidates = missingChoices.flatMap((choice) =>
      choice.candidates
        .filter((candidate) =>
          candidate.accepted &&
          candidate.text &&
          candidate.text !== choice.selected,
        )
        .sort((a, b) => b.score - a.score)
        .map((candidate) => ({
          text: candidate.text,
          kind: creativeResult.scenes.find((scene) =>
            scene.sourceEventIds.length === choice.beat.eventIds.length &&
            scene.sourceEventIds.every((id) => choice.beat.eventIds.includes(id)),
          )?.kind ?? "line",
          sourceEventIds: [...choice.beat.eventIds],
        })),
    );

    if (recoveryCandidates.length) {
      const recovered = await verifyAuthorCreativeGrounding({
        scenes: recoveryCandidates,
        suppliedReality: events,
        semanticAuthority: unique([
          discoveryResult.discovery.selected.perception,
          discoveryResult.discovery.selected.relationship,
        ]),
        domainContext: input.domainContext,
      });
      groundingRecoveryModelCalls += recovered.modelCalls;

      const recoveredByBeat = new Map<string, typeof recovered.scenes[number]>();
      for (const scene of recovered.scenes) {
        const key = [...scene.sourceEventIds].sort().join(",");
        if (!recoveredByBeat.has(key)) {
          recoveredByBeat.set(key, scene);
        }
      }

      const verifiedByBeat = new Map(
        verifiedCreative.scenes.map((scene) => [
          [...scene.sourceEventIds].sort().join(","),
          scene,
        ]),
      );

      const restoredScenes = creativeResult.scenes.map((scene) => {
        const key = [...scene.sourceEventIds].sort().join(",");
        return verifiedByBeat.get(key) ?? recoveredByBeat.get(key) ?? {
          ...scene,
          text: scene.sourceEventIds
            .map((id) => events.find((event) => event.id === id)?.text ?? "")
            .map(clean)
            .filter(Boolean)
            .join(" "),
        };
      });

      verifiedCreative = {
        ...verifiedCreative,
        scenes: restoredScenes,
      };
    }
  }

  const usedEvidenceIds = new Set(
    verifiedCreative.scenes.flatMap((scene) => scene.sourceEventIds),
  );
  const movieEvidence = usedEvidenceIds.size
    ? events.filter((event) => usedEvidenceIds.has(event.id))
    : events.filter((event) =>
        discoveryResult.discovery.selected.evidenceEventIds.includes(event.id),
      );

  const movie = makeMovie(discoveryResult.discovery, movieEvidence);
  const sequence = makeSequence(
    subject,
    discoveryResult.discovery.selected.perception ||
      discoveryResult.discovery.selected.relationship,
    verifiedCreative.scenes,
  );

  const scenes = verifiedCreative.scenes.map(({ text, kind }) => ({ text, kind }));
  const complete = scenes.length > 0;
  const selection = selectionFromDiscovery(discoveryResult.discovery);

  const brief: AuthorCreativeBrief = {
    angle: discoveryResult.discovery.lens,
    engine: "Reality -> Memory/Relations -> Meaning -> Creative Search -> Creative Addition -> Treatment -> Realization -> Grounding -> Experience -> Persistence/Learning",
    question: "",
    strongestImage: events[0]?.text ?? "",
    tension:
      discoveryResult.discovery.selected.relationship ||
      discoveryResult.discovery.selected.perception,
    payoff: scenes.length ? scenes[scenes.length - 1]!.text : "",
    callback: "none",
    rhythm: ["standard"],
    avoid: ["invented literal reality", "fact replay", "mechanic leakage"],
  };

  return {
    readout: makeReadout({
      subject,
      events,
      scenes,
    }),
    scenes,
    sequence,
    movie,
    realizationMode:
      scenes.length === 1
        ? "state"
        : scenes.length > 1
          ? "sequence-film"
          : "collection",
    brief,
    diagnostics: {
      model: creativeResult.model,
      modelCalls:
        receipt.modelCalls +
        discoveryResult.modelCalls +
        creativeResult.modelCalls +
        verifiedCreative.modelCalls +
        groundingRecoveryModelCalls,
      candidateSequences: discoveryResult.discovery.candidates.length,
      acceptedCandidates: complete ? 1 : 0,
      qualityStatus: complete ? "ACCEPTED" : "REJECTED",
      renderable: complete,
      complete,
      selectedScore: complete ? discoveryResult.discovery.confidence : 0,
      rejectedCandidates: [],
      selectedTreatment: selection,
      creativeDiscovery: discoveryResult.discovery,
      realityModel: receipt.model,
      creativeDiscoveryModel: discoveryResult.model,
      bareAuthorPlan: creativeResult.diagnostics?.plan,
      creativeTreatments: creativeResult.diagnostics?.creativeTreatments,
      mouthVariants: creativeResult.diagnostics?.variantsByBeat,
      mouthChoices: creativeResult.diagnostics?.choices,
    },
    adaptiveQuestions: [],
    world,
  };
}
