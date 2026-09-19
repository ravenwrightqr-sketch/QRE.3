import type {
  LatentMovieCandidate,
  MouthCandidateBeat,
  RealityGraph,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly unknown[] = []): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const ALLOWED_ROLES = new Set([
  "arrival",
  "hook",
  "question",
  "pressure",
  "reframe",
  "escalation",
  "discovery",
  "consequence",
  "release",
  "payoff",
  "callback",
  "continuation",
  "establishing",
  "reveal",
]);

export type AuthorDiscoveredBeat = {
  order: number;
  role: MouthCandidateBeat["role"];
  eventIds: string[];
  change: string;
  next: string;
  frontier: string;
  necessity: string;
};

export type AuthorBeatDiscoveryResult = {
  beats: AuthorDiscoveredBeat[];
  model: string;
  modelCalls: number;
  raw: string;
  recovered: boolean;
};

function parsePlan(
  raw: string,
  approvedEventIds: readonly string[],
): AuthorDiscoveredBeat[] {
  const approved = new Set(approvedEventIds);
  const text = clean(raw)
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== "object") return [];
  const record = parsed as { beats?: unknown };
  if (!Array.isArray(record.beats)) return [];

  const beats: AuthorDiscoveredBeat[] = [];

  record.beats.slice(0, 8).forEach((rawBeat, index) => {
    if (!rawBeat || typeof rawBeat !== "object") return;
    const beat = rawBeat as Record<string, unknown>;
    const eventIds = unique(
      Array.isArray(beat.eventIds) ? beat.eventIds : [],
    ).filter((id) => approved.has(id));

    const change = clean(beat.change);
    if (!eventIds.length || !change) return;

    const roleValue = clean(beat.role).toLowerCase();
    const role = (
      ALLOWED_ROLES.has(roleValue) ? roleValue : "discovery"
    ) as MouthCandidateBeat["role"];

    beats.push({
      order: index + 1,
      role,
      eventIds,
      change,
      next: clean(beat.next),
      frontier: clean(beat.frontier || beat.next),
      necessity:
        clean(beat.necessity) ||
        "This cut changes what the observer wants or understands next.",
    });
  });

  if (!beats.length) return [];

  const final = beats[beats.length - 1];
  if (final) final.role = "payoff";

  return beats;
}

function messages(input: {
  graph: RealityGraph;
  movie: LatentMovieCandidate;
  subject: string;
  prompt: string;
  lens?: string;
  selectedInference?: {
    kind?: string;
    latentRead?: string;
    evidenceEventIds?: readonly string[];
  };
}): Array<{ role: "system" | "user"; content: string }> {
  const events = input.graph.events.map((event) => ({
    id: event.id,
    label: event.label,
  }));

  const movie = {
    id: input.movie.id,
    evidence: input.movie.evidence,
    payoff: input.movie.payoff,
    unresolvedQuestion: input.movie.unresolvedQuestion,
    trajectory: input.movie.trajectory.map((step) => ({
      order: step.order,
      operation: step.operation,
      eventIds: step.eventIds,
      viewerChange: step.viewerChange,
      nextQuestion: step.nextQuestion,
    })),
    storyThesis: input.movie.storyThesis
      ? {
          semanticTurn: input.movie.storyThesis.semanticTurn,
          relationKind: input.movie.storyThesis.relationKind,
          beforeMeaning: input.movie.storyThesis.beforeMeaning,
          afterMeaning: input.movie.storyThesis.afterMeaning,
          payoffDependency: input.movie.storyThesis.payoffDependency,
          observerExperience: input.movie.storyThesis.observerExperience,
          semanticRealization: input.movie.storyThesis.semanticRealization,
        }
      : undefined,
  };

  return [
    {
      role: "system",
      content: [
        "You are QRE's universal Author/director. You work before Mouth.",
        "Reality is fixed. Expression is free.",
        "Discover HOW the approved reality should unfold as a moving sequence for the observer.",
        "Do not write viewer-facing prose. Do not act as Mouth.",
        "Do not summarize every fact and do not create one beat per fact unless the experience truly earns that shape.",
        "A sequence needs movement, but movement may happen in the world OR in the observer's understanding.",
        "When supplied reality contains events, movement may follow those events.",
        "When supplied reality is stable identity, preference, state, relationship, or character material, movement may happen through attention, priority, contrast, interruption, recontextualization, recognition, anticipation, callback, or payoff without inventing an occurrence.",
        "Use the selected inference and semantic thesis as creative material, not as wording to expose.",
        "Every beat must change what the observer notices, expects, wants, or understands next.",
        "Each beat must cite only approved eventIds from the supplied reality.",
        "Never invent a new person, role, object, place, action, sensory observation, chronology, dialogue, or event.",
        "Choose the number of beats the experience earns. Prefer compression over padding. Stop when the perception lands.",
        "Return JSON only: {beats:[{role,eventIds,change,next,frontier,necessity}]}.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        request: {
          prompt: clean(input.prompt),
          lens: clean(input.lens),
          subject: clean(input.subject),
        },
        approvedReality: events,
        selectedMovie: movie,
        selectedInference: input.selectedInference
          ? {
              kind: clean(input.selectedInference.kind),
              latentRead: clean(input.selectedInference.latentRead),
              evidenceEventIds: unique(
                input.selectedInference.evidenceEventIds ?? [],
              ),
            }
          : undefined,
      }),
    },
  ];
}

export async function discoverAuthorBeatPlan(input: {
  graph: RealityGraph;
  movie: LatentMovieCandidate;
  subject: string;
  prompt: string;
  lens?: string;
  selectedInference?: {
    kind?: string;
    latentRead?: string;
    evidenceEventIds?: readonly string[];
  };
}): Promise<AuthorBeatDiscoveryResult> {
  const approvedEventIds = input.graph.events.map((event) => event.id);

  try {
    const generated = await localModelGenerate(
      messages(input),
      "json",
      {
        numPredict: 900,
        temperature: 0.82,
      },
    );

    const beats = parsePlan(generated.text, approvedEventIds);

    return {
      beats,
      model: generated.model || "unknown",
      modelCalls: 1,
      raw: generated.text,
      recovered: false,
    };
  } catch (error) {
    return {
      beats: [],
      model: "unknown",
      modelCalls: 1,
      raw: error instanceof Error ? error.message : clean(error),
      recovered: false,
    };
  }
}
