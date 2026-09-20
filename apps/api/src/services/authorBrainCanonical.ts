/*
 * QRE CANONICAL AUTHOR
 *
 * One production creative path:
 *
 * raw input / supplied facts
 *   -> Reality Extractor
 *   -> RealityGraph
 *   -> Creative Read
 *   -> QRE Creative
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

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

type CreativeSelection = {
  relationship: string;
  latentMovie: string;
  frame: string;
  confidence: number;
  why: string;
  risk: string;
};

function selectionFromDiscovery(discovery: AuthorCreativeDiscovery): CreativeSelection {
  return {
    relationship: discovery.selected.relationship,
    latentMovie: discovery.selected.perception,
    frame: discovery.lens,
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
    selectedFrame?: CreativeSelection;
    creativeDiscovery?: AuthorCreativeDiscovery;
    realityModel?: string;
    creativeDiscoveryModel?: string;
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
      memoryContext: input.memoryContext ?? [],
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
    requestedLens: input.lens,
    memory: input.memoryContext ?? [],
    domainContext: input.domainContext,
  });

  const discoveryReady =
    Boolean(discoveryResult.discovery.selected.perception) &&
    Boolean(discoveryResult.discovery.selected.relationship) &&
    discoveryResult.discovery.candidates.length > 0;

  const selectedPlayableIds = new Set(
    unique([
      ...discoveryResult.discovery.playableEventIds,
    ]),
  );

  const playableEvents = events.filter((event) => selectedPlayableIds.has(event.id));

  const playableIdSet = new Set(playableEvents.map((event) => event.id));
  const backgroundEvents = events.filter((event) => !playableIdSet.has(event.id));

  const creativeResult = discoveryReady
    ? await createAuthorExperience({
        subject,
        playableEvents,
        backgroundEvents,
        creativeDiscovery: discoveryResult.discovery,
        memory: input.memoryContext ?? [],
        domainContext: input.domainContext,
      })
    : {
        scenes: [],
        model: discoveryResult.model,
        modelCalls: 0,
      };

  const usedEvidenceIds = new Set(
    creativeResult.scenes.flatMap((scene) => scene.sourceEventIds),
  );
  const movieEvidence = usedEvidenceIds.size
    ? events.filter((event) => usedEvidenceIds.has(event.id))
    : playableEvents;

  const movie = makeMovie(discoveryResult.discovery, movieEvidence);
  const sequence = makeSequence(
    subject,
    discoveryResult.discovery.selected.perception ||
      discoveryResult.discovery.selected.relationship,
    creativeResult.scenes,
  );

  const scenes = creativeResult.scenes.map(({ text, kind }) => ({ text, kind }));
  const complete = scenes.length > 0;
  const selection = selectionFromDiscovery(discoveryResult.discovery);

  const brief: AuthorCreativeBrief = {
    angle: discoveryResult.discovery.lens,
    engine: "Reality -> Creative Discovery -> QRE Creative",
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
        creativeResult.modelCalls,
      candidateSequences: discoveryResult.discovery.candidates.length,
      acceptedCandidates: complete ? 1 : 0,
      qualityStatus: complete ? "ACCEPTED" : "REJECTED",
      renderable: complete,
      complete,
      selectedScore: complete ? discoveryResult.discovery.confidence : 0,
      rejectedCandidates: [],
      selectedFrame: selection,
      creativeDiscovery: discoveryResult.discovery,
      realityModel: receipt.model,
      creativeDiscoveryModel: discoveryResult.model,
    },
    adaptiveQuestions: [],
    world,
  };
}
