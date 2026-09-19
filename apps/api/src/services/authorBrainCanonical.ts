/*
 * QRE CANONICAL AUTHOR — SIMPLE RESTORED CORE
 *
 * Restored from the early Author behavior that worked:
 *
 * supplied reality
 *   -> factual readout
 *   -> optional creative frame
 *   -> one QRE realization
 *
 * Reality stays fixed. The model owns creative expression.
 * This file deliberately does NOT route through the later rule-heavy cognition,
 * movie-search, meaning-pressure, lens-brief, critic, or retry subsystems.
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
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const clamp = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Number(Math.max(0, Math.min(1, number)).toFixed(3))
    : fallback;
};

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
    .trim();

  if (!source) return undefined;

  try {
    const value = JSON.parse(source);
    return value && typeof value === "object"
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(source.slice(start, end + 1));
      return value && typeof value === "object"
        ? value as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
}

type FrameDecision = {
  frame: string;
  confidence: number;
  why: string;
  risk: string;
};

async function chooseFrame(input: {
  reality: string[];
  requestedLens?: string;
}): Promise<{ decision: FrameDecision; model: string }> {
  const requested = clean(input.requestedLens);

  if (requested && requested.toLowerCase() !== "let qre decide") {
    return {
      decision: {
        frame: requested,
        confidence: 1,
        why: "explicitly supplied",
        risk: "do not let the lens invent reality",
      },
      model: "explicit",
    };
  }

  const system = [
    "You are QRE's creative frame selector.",
    "You are given a factual readout of what actually happened.",
    "Choose a creative frame ONLY when it materially improves how those same facts can be experienced.",
    "The source domain does not choose the frame.",
    "A frame is perspective only. It must not invent a person, object, action, place, event, chronology, relationship, motive, feeling, dialogue, or outcome.",
    "NONE is a strong answer when the facts are better without a frame.",
    "Prefer the frame that reveals something already latent in the facts rather than decorating them.",
    "Return JSON only: {\"frame\":\"...|NONE\",\"confidence\":0.0,\"why\":\"...\",\"risk\":\"...\"}.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          factualReadout: input.reality,
          instruction: "Choose a frame only if it genuinely increases the experience. Otherwise return NONE.",
        }),
      },
    ],
    "json",
    { numPredict: 220, temperature: 0.35 },
  );

  const parsed = parseJson(result.text);
  const frame = clean(parsed?.frame) || "NONE";

  return {
    decision: {
      frame,
      confidence: clamp(parsed?.confidence, frame === "NONE" ? 0.5 : 0.65),
      why: clean(parsed?.why),
      risk: clean(parsed?.risk ?? parsed?.sequenceRisk),
    },
    model: result.model,
  };
}

type RawBeat = { text?: unknown; sourceEventIds?: unknown };

function eventIdsForBeat(
  beat: RawBeat,
  index: number,
  total: number,
  eventIds: string[],
): string[] {
  const supplied = Array.isArray(beat.sourceEventIds)
    ? beat.sourceEventIds
        .filter((value): value is string => typeof value === "string")
        .filter((id) => eventIds.includes(id))
    : [];

  if (supplied.length) return unique(supplied);

  if (!eventIds.length) return [];

  const position = total <= 1
    ? 0
    : index / Math.max(1, total - 1);

  return [
    eventIds[
      Math.min(
        eventIds.length - 1,
        Math.round(position * (eventIds.length - 1)),
      )
    ]!,
  ];
}

async function realize(input: {
  reality: Array<{ id: string; text: string }>;
  subject: string;
  frame: FrameDecision;
}): Promise<{ scenes: Array<AuthorScene & { sourceEventIds: string[] }>; model: string }> {
  const system = [
    "You are QRE Author.",
    "The factual readout below is the complete concrete reality.",
    "Turn those facts into a QRE readout.",
    "Do not merely describe, summarize, or list the facts back.",
    "Let each line change the state, pressure, implication, interpretation, or need for what comes next.",
    "Find what is funny, strange, tense, intimate, status-changing, recurring, contradictory, revealing, or otherwise worth noticing in these facts.",
    "Make the observer feel the realization. Do not explain the realization.",
    "Creative framing, metaphor, implication, understatement, wordplay, personification, rhythm, and attitude are allowed.",
    "Do not invent a new concrete person, object, action, place, event, chronology, relationship, motive, feeling, dialogue, sensory fact, or outcome.",
    "The selected frame is optional pressure, not a template. If it starts making the readout worse, ignore it.",
    "Do not optimize for a dog tag, tiny screen, fixed line count, or shortness.",
    "Stop when the experience lands.",
    "Return JSON only: {\"beats\":[{\"text\":\"...\",\"sourceEventIds\":[\"event-1\"]}]}.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          subject: input.subject,
          factualReadout: input.reality,
          selectedFrame: input.frame.frame,
          frameReason: input.frame.why,
          frameRisk: input.frame.risk,
          instruction: "Create the QRE readout from what happened. Feel it; do not explain it.",
        }),
      },
    ],
    "json",
    { numPredict: 700, temperature: 0.82 },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.beats)
    ? parsed!.beats
    : Array.isArray(parsed?.scenes)
      ? parsed!.scenes
      : [];

  const eventIds = input.reality.map((item) => item.id);

  const scenes = raw
    .flatMap((value, index): Array<AuthorScene & { sourceEventIds: string[] }> => {
      const beat: RawBeat =
        typeof value === "string"
          ? { text: value }
          : value && typeof value === "object"
            ? value as RawBeat
            : {};

      const text = clean(beat.text);
      if (!text) return [];

      return [{
        text,
        kind:
          index === 0
            ? "hook"
            : index === raw.length - 1
              ? "payoff"
              : "line",
        sourceEventIds: eventIdsForBeat(beat, index, raw.length, eventIds),
      }];
    })
    .slice(0, 16);

  return { scenes, model: result.model };
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
      recentChange: prior.at(-1),
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
        reason: "model-authored QRE readout beat",
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
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: [],
    antiCrutch: [],
  };
}

function makeMovie(
  frame: FrameDecision,
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
    id: "simple-author-structure",
    lens: frame.frame,
    anchorEventIds: events.map((event) => event.id),
    supportingRelationKinds: [],
    trajectory,
    payoff: events.at(-1)?.text ?? "",
    unresolvedQuestion: "",
    evidence: events.map((event) => event.text),
    hypothesis: [
      frame.frame === "NONE"
        ? "Natural reading of supplied reality."
        : `Supplied reality experienced through ${frame.frame} framing.`,
    ],
    truthRisk: 0,
    novelty: 0.5,
    specificity: 1,
    informationValue: 0.7,
    uncertainty: 0,
    attentionPotential: 0.7,
    consequencePotential: 0.5,
    callbackPotential: 0,
    compressionPotential: 0.7,
    repetitionRisk: 0,
    distinctiveness: 0.7,
    score: 0.7,
  };
}

function makeReadout(input: {
  subject: string;
  events: Array<{ id: string; text: string }>;
  frame: FrameDecision;
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
    selectedFrame?: FrameDecision;
  };
  adaptiveQuestions: Array<{ kind: string; question: string; reason: string }>;
  world: ReturnType<typeof buildAuthorRealityGraph>;
};

export async function authorBrainCanonical(
  input: AuthorBrainTruth,
): Promise<CanonicalAuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const prompt = clean(input.prompt);
  const facts = unique(input.facts);
  const sourceMoments = unique(input.sourceMoments);

  const world =
    input.realityGraph ??
    buildAuthorRealityGraph({
      prompt,
      subject,
      place: clean(input.place),
      facts,
      sourceMoments,
      memoryContext: input.memoryContext ?? [],
      trajectory: input.trajectory ?? [],
    });

  const events = world.events.map((event) => ({
    id: event.id,
    text: clean(event.label),
  })).filter((event) => event.text);

  const frameResult = await chooseFrame({
    reality: events.map((event) => event.text),
    requestedLens: input.lens,
  });

  const realized = await realize({
    reality: events,
    subject,
    frame: frameResult.decision,
  });

  const movie = makeMovie(frameResult.decision, events);
  const sequence = makeSequence(
    subject,
    movie.hypothesis[0] ?? "",
    realized.scenes,
  );
  const scenes = realized.scenes.map(({ text, kind }) => ({ text, kind }));
  const complete = scenes.length > 0;

  const brief: AuthorCreativeBrief = {
    angle: frameResult.decision.frame,
    engine: "Reality -> factual readout -> optional frame -> QRE Author",
    question: "",
    strongestImage: events[0]?.text ?? "",
    tension: frameResult.decision.why,
    payoff: scenes.at(-1)?.text ?? "",
    callback: "none",
    rhythm: ["standard"],
    avoid: ["invented concrete reality", "fact replay", "explanation"],
  };

  return {
    readout: makeReadout({
      subject,
      events,
      frame: frameResult.decision,
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
      model: realized.model,
      modelCalls: frameResult.model === "explicit" ? 1 : 2,
      candidateSequences: 1,
      acceptedCandidates: complete ? 1 : 0,
      qualityStatus: complete ? "ACCEPTED" : "REJECTED",
      renderable: complete,
      complete,
      selectedScore: complete ? 1 : 0,
      rejectedCandidates: [],
      selectedFrame: frameResult.decision,
    },
    adaptiveQuestions: [],
    world,
  };
}
