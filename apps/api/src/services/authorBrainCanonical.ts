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
  relationship: string;
  latentMovie: string;
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
        relationship: "",
        latentMovie: "",
        frame: requested,
        confidence: 1,
        why: "explicitly supplied",
        risk: "do not let the lens invent literal reality",
      },
      model: "explicit",
    };
  }

  const system = [
    "You are QRE's hidden story finder.",
    "You are given a factual readout of what actually happened.",
    "Before choosing a lens, discover the relationship among the facts and the latent movie already hiding inside them.",
    "Ask privately: What changed? What is the pressure? What is the turn? What is the consequence? What payoff is already supported?",
    "Do not write prose yet.",
    "At this stage, NEVER add a plausible physical condition just because the task would usually imply one. Cleaning does not prove mess, grime, crumbs, mildew, spills, disorder, or a before-state unless supplied. Finishing does not prove pristine, spotless, silence, relief, or recurrence unless supplied.",
    "Relationship and latentMovie may be ABSTRACT creative interpretations of the supplied structure: campaign, contest, operation, negotiation, progression, resistance, victory, reversal. They must not contain invented concrete evidence.",
    "Entertainment lift matters more than sounding deep. Do not mistake solemnity, symbolism, abstraction, ceremony, or poetic significance for an interesting movie.",
    "The latent movie should describe the transformation of the event structure, not repeat or embellish the facts.",
    "Then choose ONE narrative lens that makes that relationship most entertaining. The source domain does not choose the lens.",
    "A lens may transform status, metaphor, rhythm, implication, conflict, or attitude. It may not invent literal reality.",
    "NONE is correct only when no lens materially improves the latent movie.",
    "Return exactly one frame name, or exactly NONE. Never return alternatives such as Comedy|NONE.",
    "Return JSON only: {\"relationship\":\"...\",\"latentMovie\":\"...\",\"frame\":\"one frame name or NONE\",\"confidence\":0.0,\"why\":\"...\",\"risk\":\"...\"}.",
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
      relationship: clean(parsed?.relationship),
      latentMovie: clean(parsed?.latentMovie),
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
    "The readout itself is the media. It is the experience people receive, replay, show, and share. Make it entertaining and distinctive enough that seeing it can make someone think, 'what the fuck is that — I want one,' without using sales language or explaining the product.",
    "QRE writes for the screen, not the page. The sequence itself creates the experience.",
    "North star: take something ordinary and make it feel alive. The reaction should be: 'That should have been boring. Somehow it wasn't.'",
    "Silently explore several genuinely different readings of the supplied reality before writing. Choose the one that would be the most fun, surprising, strange, sharp, tense, funny, status-changing, or otherwise irresistible to keep watching while staying grounded. Do not reveal the rejected readings.",
    "The hidden story finder already supplied RELATIONSHIP and LATENT MOVIE. Trust only the grounded structure inside them, not any accidental concrete embellishment. Privately move through: FACT -> RELATIONSHIP -> CONSEQUENCE -> MEANING -> VOICE. Facts alone are not the story. QRE Creative's job is to turn that latent structure into human, entertaining experience.",
    "Do not confuse 'meaningful' with 'entertaining'. QRE may be meaningful, but this layer must first make the reality PLAY.",
    "Turn what happened into a QRE readout.",
    "Do not merely describe, summarize, or list the facts back.",
    "Do not write literary atmosphere, ceremonial prose, symbolic explanation, trailer narration, or faux-profound lines. Perform the chosen reading directly.",
    "Create interest by changing the READING of supplied facts, never by decorating them with invented scenery.",
    "Literal reality is fixed: do not present an unsupplied person, object, place, action, sensory detail, body state, time, relationship, dialogue, or event as something that actually happened.",
    "The lens may create a clearly nonliteral narrative world around supplied facts. Metaphorical resistance, battles, missions, enemies, victories, negotiations, trials, levels, status contests, and personified objects are allowed when a reasonable viewer reads them as framing rather than literal history.",
    "Translate the structure of the real event into the logic of the chosen lens. Cleaning can become clearing territory; completion can become victory; repeated work can become rounds; a room can act like an opponent. These are interpretations, not factual claims.",
    "Do not use the lens to sneak in a plausible real-world fact that the source never supplied. The test is not 'was this word in the source?' The test is 'would a viewer mistake this for a concrete thing that actually happened?'",
    "A true fact is not automatically a beat. Source order is not automatically the sequence. Choose only what changes the viewer's experience.",
    "Let each line change what the viewer knows, expects, suspects, wants, or understands—or change the meaning of something already shown.",
    "Control expectation: the best next beat is surprising enough to update the viewer's mental model but coherent enough to feel earned.",
    "Make the observer feel the realization. Do not explain it.",
    "Aim for an afterimage: a final turn, implication, callback, status change, or residue that makes the preceding lines feel more meaningful in hindsight. Do not force a conventional ending when the material wants to stop elsewhere.",
    "The selected frame is optional pressure, not a template. Use it only where it makes the supplied facts hit harder.",
    "When a frame is selected, do not merely sprinkle its vocabulary over the facts. Reinterpret the event structure through the frame so the sequence feels like a tiny world with progression, pressure, and payoff.",
    "QRE should notice more than it says, then say less than it knows.",
    "Write around the subject once identity is established. Do not keep restarting beats with the subject's name. Let objects, consequences, reactions, status, and the lens carry the subject through the sequence. Reuse the name only when the name itself creates the hit.",
    "Each beat should feel like a screen moment someone immediately gets, not prose they have to decode. Sharp is good; cryptic is not.",
    "Do not optimize for a dog tag, tiny screen, fixed line count, or shortness.",
    "Stop when the experience lands.",
    "Examples of the move, never target wording: a completed room may become a cleared sector; a repeated return may make an earlier nervous moment read differently; an approved bow may become a negotiated settlement. The metaphor changes the reading, not the facts.",
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
          relationship: input.frame.relationship,
          latentMovie: input.frame.latentMovie,
          selectedFrame: input.frame.frame,
          frameReason: input.frame.why,
          frameRisk: input.frame.risk,
          instruction: "Create the QRE experience from the latent movie. Write around the subject. Perform the relationship and consequence; do not explain the mechanics.",
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
    closingState: cuts.length ? cuts[cuts.length - 1]?.viewerAfter : undefined,
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
    payoff: events.length ? events[events.length - 1]!.text : "",
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
    payoff: scenes.length ? scenes[scenes.length - 1]!.text : "",
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
