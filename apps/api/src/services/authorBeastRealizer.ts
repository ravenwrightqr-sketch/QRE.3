import type { AuthorDomainContext, AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { judgeRealizedFilm, type RealizedFilmJudgment } from "./authorRealizedFilmJudge.js";

export type RealizedScene = AuthorScene & { sourceEventIds: string[]; score: number };

export type AuthorRealizationResult = {
  scenes: RealizedScene[];
  score: number;
  model: string;
  modelCalls: number;
  rejectedSets: number;
  selectedMovieIndex?: number;
  selectedSetIndex?: number;
  judgment?: RealizedFilmJudgment;
  reason?: string;
};

type Input = {
  prompt: string;
  subject: string;
  lens?: string;
  graph: RealityGraph;
  movies: LatentMovieCandidate[];
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  priorScenes?: string[];
  creativeLearningContext?: string[];
};

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
type RawSet = { scenes?: unknown };

type Parsed = {
  selectedMovieIndex?: unknown;
  selectedSetIndex?: unknown;
  sets?: unknown;
};

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer state|audience state|observer state|evidence id|source event|provenance|compiler|realizer|semantic turn|latent movie|creative opportunity)\b/i;
const EXPLAINING = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|the viewer|the audience|the relationship between|what this means)\b/i;
const SCREENPLAY = /^(?:camera|close(?:-up)?|wide shot|medium shot|tight shot|cut to|fade|dissolve|sound|sfx|voice[- ]over)\b/i;
const ABSTRACT_ONLY = /^(?:a feeling|a moment|something changed|everything changed|worth noticing|the experience|a connection|a memory)\.?$/i;
const MAX_CUTS = 18;
const MAX_CHARS = 150;
const MAX_WORDS = 22;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): string[] => clean(text).toLowerCase().match(/[a-z0-9’'-]+/g) ?? [];

function parse(text: string): Parsed | undefined {
  const trimmed = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(trimmed);
    return value && typeof value === "object" ? value as Parsed : undefined;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(trimmed.slice(start, end + 1));
      return value && typeof value === "object" ? value as Parsed : undefined;
    } catch {
      return undefined;
    }
  }
}

function validSourceIds(value: unknown, graph: RealityGraph): string[] {
  const known = new Set(graph.events.map((event) => event.id));
  if (!Array.isArray(value)) return [];
  return unique(value.filter((item): item is string => typeof item === "string")).filter((id) => known.has(id));
}

function sceneKind(value: unknown, index: number, total: number): AuthorScene["kind"] {
  const normalized = clean(value).toLowerCase();
  if (["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"].includes(normalized)) {
    return normalized as AuthorScene["kind"];
  }
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  return "discovery";
}

function validateScenes(raw: unknown, graph: RealityGraph): RealizedScene[] | undefined {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > MAX_CUTS) return undefined;
  const scenes: RealizedScene[] = [];
  const corpus = graph.events.flatMap((event) => [event.label, ...event.entities, event.place, event.time]).filter(Boolean).join(" ");
  for (let index = 0; index < raw.length; index += 1) {
    const item = raw[index];
    if (!item || typeof item !== "object") return undefined;
    const row = item as RawScene;
    const text = clean(row.text);
    const ids = validSourceIds(row.sourceEventIds, graph);
    if (!text || text.length > MAX_CHARS || words(text).length > MAX_WORDS || !ids.length) return undefined;
    if (INTERNAL.test(text) || EXPLAINING.test(text) || SCREENPLAY.test(text) || ABSTRACT_ONLY.test(text)) return undefined;
    scenes.push({ text, kind: sceneKind(row.kind, index, raw.length), sourceEventIds: ids, score: 0.5 });
  }
  const distinctSources = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size;
  const bridges = scenes.filter((scene) => scene.sourceEventIds.length >= 2).length;
  const copySignals = scenes.reduce((sum, scene) => {
    const compact = scene.text.toLowerCase();
    return sum + (corpus && compact === corpus.toLowerCase() ? 1 : 0);
  }, 0);
  const quality = Math.max(0.25, Math.min(0.99, 0.5 + Math.min(0.25, distinctSources / Math.max(1, graph.events.length) * 0.25) + Math.min(0.2, bridges * 0.04) - copySignals * 0.1));
  return scenes.map((scene, index) => ({ ...scene, score: Number(Math.max(0.25, quality - index * 0.01).toFixed(3)) }));
}

function candidatePacket(movie: LatentMovieCandidate, index: number, graph: RealityGraph): Record<string, unknown> {
  return {
    index,
    id: movie.id,
    lens: movie.lens,
    hypothesis: movie.hypothesis,
    unresolvedQuestion: movie.unresolvedQuestion,
    payoff: movie.payoff,
    evidence: movie.evidence,
    anchorEventIds: movie.anchorEventIds,
    supportingRelationKinds: movie.supportingRelationKinds,
    trajectory: movie.trajectory.map((step) => ({ order: step.order, operation: step.operation, eventIds: step.eventIds, viewerChange: step.viewerChange, nextQuestion: step.nextQuestion })),
    metrics: {
      novelty: movie.novelty,
      specificity: movie.specificity,
      attentionPotential: movie.attentionPotential,
      consequencePotential: movie.consequencePotential,
      callbackPotential: movie.callbackPotential,
      compressionPotential: movie.compressionPotential,
      distinctiveness: movie.distinctiveness,
    },
    suppliedReality: graph.events.filter((event) => movie.anchorEventIds.includes(event.id)).map((event) => ({ id: event.id, label: event.label })),
  };
}

function buildSystemPrompt(input: Input): string {
  const requestedLens = clean(input.lens).toLowerCase();
  const lensRule = requestedLens && requestedLens !== "none"
    ? `A creative lens was explicitly requested: ${requestedLens}. Apply it as pressure over the discovered reality. It may change framing, rhythm, attitude, metaphor, implication, or emphasis. It may NEVER create a concrete event or fact.`
    : "NO LENS IS REQUIRED. Do not choose a genre merely because the domain suggests one. Let the supplied relationships determine the creative treatment.";
  return [
    "You are the QRE Artist.",
    "Your job is to find the film hiding inside supplied reality, then render it as short moving cuts.",
    "The source reality is the only authority for concrete facts.",
    "Interpretation is allowed. Invention of concrete reality is forbidden.",
    "Do not turn ordinary facts into a themed story just because a genre is available.",
    lensRule,
    "The sequence is the art. A cut should make the next cut more wanted by changing expectation, adding pressure, revealing a relationship, creating a callback, or sharpening a landing.",
    "The language should usually get smaller while the meaning gets larger.",
    "Do not explain the realization. Let the observer complete it.",
    "Do not force a hook-build-hit formula. The strongest realization may land anywhere, may split across cuts, or may not be explicit.",
    "Use repetition, fragments, contradiction, callbacks, one-word cuts, full sentences, silence-like brevity, and unusual phrasing when earned.",
    "Never add a new person, object, action, place, motive, emotion, sound, sensory property, outcome, or backstory unless the supplied evidence supports it.",
    "A figurative transformation is allowed when it remains clearly figurative and is grounded in the supplied relationship. Do not write fictional literal events.",
    "Do not restate the source as a receipt or one-fact-per-cut caption reel.",
    "Produce several materially different possible films, not several rewrites of one film. Then choose the strongest one as Artist.",
    "Each final cut must include one or more source event IDs that genuinely support the cut.",
    "Keep cuts concise. Prefer short clean language. Avoid generic adjectives and generic emotional declarations.",
    "Do not use internal architecture language in visible text.",
    "Return JSON only.",
  ].join("\n");
}

export async function realizeAuthorExperience(input: Input): Promise<AuthorRealizationResult> {
  const movies = input.movies.slice(0, 10);
  if (!movies.length) return { scenes: [], score: 0, model: "deterministic", modelCalls: 0, rejectedSets: 1, reason: "no creative possibilities supplied" };

  const reality = input.graph.events.map((event) => ({ id: event.id, label: event.label, entities: event.entities, place: event.place, time: event.time }));
  const body = {
    subject: input.subject,
    prompt: clean(input.prompt),
    lens: clean(input.lens) || "NONE",
    reality,
    relationships: input.graph.relations,
    priorScenes: (input.priorScenes ?? []).slice(0, 12),
    memoryContext: (input.memoryContext ?? []).slice(0, 12),
    candidates: movies.map((movie, index) => candidatePacket(movie, index, input.graph)),
  };

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["selectedMovieIndex", "selectedSetIndex", "sets"],
    properties: {
      selectedMovieIndex: { type: "integer", minimum: 0, maximum: Math.max(0, movies.length - 1) },
      selectedSetIndex: { type: "integer", minimum: 0, maximum: 2 },
      sets: {
        type: "array", minItems: 3, maxItems: 3,
        items: {
          type: "object", additionalProperties: false, required: ["scenes"],
          properties: {
            scenes: {
              type: "array", minItems: 2, maxItems: MAX_CUTS,
              items: {
                type: "object", additionalProperties: false, required: ["text", "kind", "sourceEventIds"],
                properties: {
                  text: { type: "string", minLength: 1, maxLength: MAX_CHARS },
                  kind: { type: "string", enum: ["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"] },
                  sourceEventIds: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
  } as const;

  let model = "deterministic";
  let modelCalls = 0;
  let rejectedSets = 0;
  let lastJudgment: RealizedFilmJudgment | undefined;
  const rejectionReasons: string[] = [];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const feedback = rejectionReasons.slice(-4);
    const prompt = feedback.length
      ? `${buildSystemPrompt(input)}\nPrevious attempt was rejected for: ${feedback.join(" | ")}\nCorrect those failures without explaining them.`
      : buildSystemPrompt(input);
    try {
      const result = await localModelGenerate(
        [{ role: "system", content: prompt }, { role: "user", content: JSON.stringify(body) }],
        "json",
        { numPredict: 7000, temperature: attempt === 0 ? 1.05 : 1.15, jsonSchema: schema },
      );
      model = result.model;
      modelCalls += 1;
      const parsed = parse(result.text);
      const rawSets = Array.isArray(parsed?.sets) ? parsed.sets as RawSet[] : [];
      const selectedMovieValue = Number(parsed?.selectedMovieIndex);
      const selectedMovieIndex = Number.isInteger(selectedMovieValue) && selectedMovieValue >= 0 && selectedMovieValue < movies.length ? selectedMovieValue : 0;
      const selectedSetValue = Number(parsed?.selectedSetIndex);
      const selectedSetIndex = Number.isInteger(selectedSetValue) && selectedSetValue >= 0 && selectedSetValue < rawSets.length ? selectedSetValue : 0;
      if (!rawSets.length) { rejectedSets += 1; rejectionReasons.push("Artist returned no film sets"); continue; }

      const normalized = rawSets.flatMap((raw, index) => {
        const scenes = validateScenes(raw?.scenes, input.graph);
        if (!scenes) { rejectedSets += 1; rejectionReasons.push(`set ${index + 1} failed reality/style validation`); return []; }
        const movie = movies[Math.min(selectedMovieIndex, movies.length - 1)]!;
        const judgment = judgeRealizedFilm({ scenes, movie, graph: input.graph });
        lastJudgment = judgment;
        return [{ scenes, judgment, index }];
      });

      const chosen = normalized.find((item) => item.index === selectedSetIndex) ?? normalized[0];
      if (!chosen) continue;

      return {
        scenes: chosen.scenes,
        score: chosen.judgment.score,
        model,
        modelCalls,
        rejectedSets,
        selectedMovieIndex,
        selectedSetIndex: chosen.index,
        judgment: chosen.judgment,
        reason: rejectionReasons.length ? rejectionReasons.join(" | ") : undefined,
      };
    } catch (error) {
      modelCalls += 1;
      rejectionReasons.push(error instanceof Error ? error.message : "Artist call failed");
    }
  }

  return {
    scenes: [], score: 0, model, modelCalls, rejectedSets,
    judgment: lastJudgment,
    reason: rejectionReasons.join(" | ") || "Artist failed to realize a valid film",
  };
}
