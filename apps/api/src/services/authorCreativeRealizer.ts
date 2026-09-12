/**
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Cognition discovers grounded relationships and creative possibilities.
 * The Artist discovers how to embody them.
 *
 * Reality owns concrete truth.
 * The Artist owns visible language, form, rhythm, selection and treatment.
 *
 * The rendered product is moving screen text.
 * Each cut is one attention beat.
 *
 * A Movie is a possibility, not an outline.
 * The Artist may choose one, combine several, mutate one, use none,
 * or discover a stronger idea outside every Movie.
 */

import type {
  AuthorDomainContext,
  AuthorScene,
  LatentMovieCandidate,
  RealityGraph,
} from "@qre/contracts";
import type { AuthorArtistDirection } from "./authorArtistChoice.js";
import {
  localModelGenerate,
  type LocalModelJsonSchema,
} from "./localModelRuntime.js";
import {
  judgeRealizedFilm,
  type RealizedFilmJudgment,
} from "./authorRealizedFilmJudge.js";
export type RealizedScene = AuthorScene & {
  sourceEventIds: string[];
  score: number;
};

export type AuthorRealizationResult = {
  scenes: RealizedScene[];
  score: number;
  model: string;
  modelCalls: number;
  rejectedSets: number;

  /**
   * The Artist's semantic inspiration choice.
   * This does NOT select the visible film.
   */
  selectedMovieIndex?: number;

  /**
   * The Artist's actual visible-film choice.
   */
  selectedSetIndex?: number;

  judgment?: RealizedFilmJudgment;
  reason?: string;
};

type RawScene = {
  text?: unknown;
  kind?: unknown;
  sourceEventIds?: unknown;
};

type RawSet = {
  scenes?: unknown;
};

type ValidationResult = {
  scenes?: RealizedScene[];
  reason?: string;
};

type ArtistDevice = {
  relationKind: string;
  mechanism: string;
  sourceEventIds: string[];
  operation: string;
  transformationModes: string[];
  languageAim: string;
};

const INTERNAL =
  /\b(?:cognition|planner|planning|candidate|trajectory|viewer|audience|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity|semantic turn|semanticRealization)\b/i;

const EXPLANATION =
  /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance|let the supplied detail|the relationship between|changes what is worth noticing)\b/i;

const GENERIC =
  /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was|worth noticing)\.?$/i;

const SCREENPLAY =
  /^(?:close(?:\s+in)?(?:\s+on)?|quick\s+cut|cut\s+to|sound\s*:|camera\s*:|wide\s+shot|medium\s+shot|tight\s+shot|fade(?:\s+(?:in|out|to))?|angle(?:\s+on)?|montage|dissolve(?:\s+to)?|smash\s+cut)\b/i;

const SCREENPLAY_INLINE =
  /\b(?:camera|close-up|wide shot|medium shot|tight shot|sound design|sound effect|sfx|voice-over|voiceover)\s*:/i;

const ALLOWED_KINDS = new Set([
  "line",
  "hook",
  "movement",
  "discovery",
  "turn",
  "payoff",
  "afterglow",
]);

const MAX_CUTS = 24;
const MAX_BEAT_CHARS = 140;

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const unique = (values: readonly string[]): string[] => [
  ...new Set(values.map(clean).filter(Boolean)),
];

const words = (text: string): string[] =>
  clean(text)
    .toLowerCase()
    .match(/[a-z0-9]+/g) ?? [];

function overlap(a: string, b: string): number {
  const left = new Set(words(a));
  const right = new Set(words(b));

  if (!left.size || !right.size) return 0;

  let intersection = 0;

  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }

  return (2 * intersection) / (left.size + right.size);
}

function relationForMovie(
  graph: RealityGraph,
  movie: LatentMovieCandidate,
): { relationKind: string; sourceEventIds: string[] } {
  const preferred = new Set(
    movie.supportingRelationKinds.map(clean).filter(Boolean),
  );

  for (const step of movie.trajectory) {
    const ids = unique(step.eventIds);

    if (ids.length < 2) continue;

    const relation = graph.relations.find(
      (candidate) =>
        ids.includes(candidate.from) &&
        ids.includes(candidate.to) &&
        (!preferred.size || preferred.has(candidate.kind)),
    );

    if (relation) {
      return {
        relationKind: relation.kind,
        sourceEventIds: [relation.from, relation.to],
      };
    }
  }

  for (const relation of graph.relations) {
    if (preferred.size && !preferred.has(relation.kind)) continue;

    if (
      movie.anchorEventIds.includes(relation.from) ||
      movie.anchorEventIds.includes(relation.to)
    ) {
      return {
        relationKind: relation.kind,
        sourceEventIds: [relation.from, relation.to],
      };
    }
  }

  return {
    relationKind: "observation",
    sourceEventIds: movie.anchorEventIds.slice(0, 2),
  };
}

function mechanismFor(relationKind: string): {
  mechanism: string;
  operation: string;
  modes: string[];
  languageAim: string;
} {
  switch (relationKind) {
    case "recontextualizes":
      return {
        mechanism: "expectation_shift",
        operation: "reframe",
        modes: ["compression", "juxtaposition", "omission", "grammatical_shift", "callback"],
        languageAim: "make the later fact alter the charge of the earlier one",
      };
    case "contrasts":
      return {
        mechanism: "contrast",
        operation: "contrast",
        modes: ["juxtaposition", "asymmetry", "fragmentation", "reversal", "silence"],
        languageAim: "make the difference itself carry the energy",
      };
    case "changes":
    case "state_change":
      return {
        mechanism: "state_shift",
        operation: "escalate",
        modes: ["before_after_compression", "status_flip", "repetition_with_mutation", "inversion"],
        languageAim: "make the changed state feel different without inventing the transition",
      };
    case "repeats":
      return {
        mechanism: "recurrence",
        operation: "recur",
        modes: ["repetition_with_mutation", "callback", "rhythmic_return", "omission"],
        languageAim: "return to a real detail with a changed charge",
      };
    case "causes":
      return {
        mechanism: "consequence",
        operation: "consequence",
        modes: ["compression", "aftermath", "causal_cut", "status_flip"],
        languageAim: "let the consequence land rather than explain the cause",
      };
    case "converges":
      return {
        mechanism: "convergence",
        operation: "converge",
        modes: ["accumulation", "collision", "fragmentation", "compression"],
        languageAim: "make separate supplied details arrive at one felt point",
      };
    case "before":
    case "after":
      return {
        mechanism: "continuation",
        operation: "continue",
        modes: ["ellipsis", "open_end", "callback", "compression"],
        languageAim: "leave the world moving rather than summarizing it",
      };
    default:
      return {
        mechanism: "observation",
        operation: "observe",
        modes: ["compression", "fragmentation", "nominalization", "silence", "unexpected_selection"],
        languageAim: "make one supplied detail newly charged without inventing plot",
      };
  }
}

function buildArtistDevice(graph: RealityGraph, movie: LatentMovieCandidate): ArtistDevice {
  const relation = relationForMovie(graph, movie);
  const mechanism = mechanismFor(relation.relationKind);
  return {
    relationKind: relation.relationKind,
    mechanism: mechanism.mechanism,
    sourceEventIds: relation.sourceEventIds,
    operation: mechanism.operation,
    transformationModes: mechanism.modes,
    languageAim: mechanism.languageAim,
  };
}

function eventText(event: RealityGraph["events"][number]): string {
  return [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" ");
}

function parseJson(text: string): Record<string, unknown> | undefined {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
}

function bindProvenance(
  rawIds: unknown,
  index: number,
  movies: readonly LatentMovieCandidate[],
  graph: RealityGraph,
  sceneText: string,
): string[] {
  const valid = new Set(graph.events.map((event) => event.id));
  const supplied = Array.isArray(rawIds)
    ? unique(rawIds.filter((id): id is string => typeof id === "string").filter((id) => valid.has(id)))
    : [];
  if (supplied.length) return supplied.slice(0, 3);

  const scored = graph.events
    .map((event) => ({ id: event.id, score: overlap(sceneText, eventText(event)) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length) {
    const best = scored[0]!.score;
    return scored.filter((item) => item.score >= Math.max(0.18, best * 0.55)).slice(0, 2).map((item) => item.id);
  }

  const fallbackMovie = movies.length > 0 ? movies[index % movies.length] : undefined;
  if (fallbackMovie) {
    const trajectoryIds = unique(fallbackMovie.trajectory.flatMap((step) => step.eventIds)).filter((id) => valid.has(id));
    if (trajectoryIds.length) return [trajectoryIds[Math.min(index, trajectoryIds.length - 1)]!];
    const anchors = unique(fallbackMovie.anchorEventIds.filter((id) => valid.has(id)));
    if (anchors.length) return anchors.slice(0, 2);
  }
  return [];
}

function validateSet(
  raw: unknown,
  input: { graph: RealityGraph; movies: readonly LatentMovieCandidate[] },
): ValidationResult {
  if (!raw || typeof raw !== "object") return { reason: "set is not an object" };
  const row = raw as RawSet;
  if (!Array.isArray(row.scenes)) return { reason: "set.scenes is missing" };
  if (row.scenes.length < 2) return { reason: "film needs at least 2 cuts" };
  if (row.scenes.length > MAX_CUTS) return { reason: `film exceeds ${MAX_CUTS} cuts` };

  const scenes: RealizedScene[] = [];
  for (const [index, item] of row.scenes.entries()) {
    if (!item || typeof item !== "object") return { reason: `cut ${index + 1} is not an object` };
    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text) return { reason: `cut ${index + 1} is empty` };
    if (text.length > MAX_BEAT_CHARS) return { reason: `cut ${index + 1} exceeds ${MAX_BEAT_CHARS} characters` };
    if (INTERNAL.test(text)) return { reason: `cut ${index + 1} leaks internal architecture` };
    if (EXPLANATION.test(text)) return { reason: `cut ${index + 1} explains instead of dramatizing` };
    if (GENERIC.test(text)) return { reason: `cut ${index + 1} is generic` };
    if (SCREENPLAY.test(text) || SCREENPLAY_INLINE.test(text)) return { reason: `cut ${index + 1} contains screenplay direction` };
    const rawKind = clean(scene.kind);
    const kind = ALLOWED_KINDS.has(rawKind)
      ? (rawKind as AuthorScene["kind"])
      : index === 0
        ? "hook"
        : index === row.scenes.length - 1
          ? "payoff"
          : "line";
    scenes.push({
      text,
      kind,
      sourceEventIds: bindProvenance(scene.sourceEventIds, index, input.movies, input.graph, text),
      score: 0,
    });
  }
  if (scenes.some((scene) => scene.sourceEventIds.length === 0)) {
    return { reason: "one or more cuts could not be grounded to supplied reality" };
  }
  return { scenes };
}

function context(
  input: {
    prompt: string;
    subject: string;
    lens: string;
    graph: RealityGraph;
    movies: readonly LatentMovieCandidate[];
    artistDirection: AuthorArtistDirection;
    domainContext?: AuthorDomainContext;
    memoryContext?: string[];
    priorScenes?: string[];
    creativeLearningContext?: string[];
  },
  repairFeedback: string,
) {
  const availableReality = input.graph.events.map((event) => ({
    id: event.id,
    text: eventText(event),
    entities: event.entities,
    place: event.place,
    time: event.time,
  }));
  const creatorContext = input.domainContext
    ? {
        category: clean(input.domainContext.category),
        businessType: clean(input.domainContext.businessType),
        businessName: clean(input.domainContext.businessName),
        businessDescription: clean(input.domainContext.businessDescription),
        serviceType: clean(input.domainContext.serviceType),
        serviceName: clean(input.domainContext.serviceName),
        subjectKind: clean(input.domainContext.subjectKind),
        knownCapabilities: unique(input.domainContext.knownCapabilities ?? []).slice(0, 24),
        contextualSignals: unique(input.domainContext.contextualSignals ?? []).slice(0, 24),
        creatorRole: clean(input.domainContext.creatorRole),
        audience: unique(input.domainContext.audience ?? []).slice(0, 24),
        objective: clean(input.domainContext.objective),
        desiredAction: clean(input.domainContext.desiredAction),
        creativePreferences: unique(input.domainContext.creativePreferences ?? []).slice(0, 24),
      }
    : null;
  const creativeSparks = input.movies.slice(0, 8).map((movie, index) => ({
    index,
    id: movie.id,
    lens: clean(movie.lens),
    hypothesis: clean(movie.hypothesis),
    payoff: clean(movie.payoff),
    unresolvedQuestion: clean(movie.unresolvedQuestion),
    supportingRelations: unique(movie.supportingRelationKinds),
    anchors: unique(movie.anchorEventIds),
  }));
  return {
    creativeTask: clean(input.prompt),
    creatorContext,
    subjectReference: clean(input.subject),
    frame: clean(input.lens) || "NONE",
    sourceReality: availableReality,
    realityPriority: "The entire supplied reality is the primary creative palette. Every supplied event is eligible for artistic use.",
    creativeSparks,
    artistDirection: input.artistDirection,
    artistDirectionRule:
      "ARTIST DIRECTION IS THE CHOSEN CREATIVE TREATMENT. Preserve its central mechanic, hook, open loop, tension, surprise and payoff. It is editorial instruction, not source reality. Do not replace the treatment with a generic idea and do not invent literal events merely to satisfy it.",
    selectedStructureRule:
      "These Movie possibilities are hypotheses discovered by cognition. They are not instructions, outlines, rankings, or required structures. The Artist treatment outranks them. The Movie may support the treatment, but it must never replace it.",
    memory: (input.memoryContext ?? []).slice(0, 20),
    priorFilms: (input.priorScenes ?? []).slice(-12),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 20),
    repairFeedback: clean(repairFeedback),
    creativePermission:
      "Interpretive language is wide open. Humor, irony, metaphor, personification, status, absurdity, tenderness, menace, gamification, playful language, pop-cultural framing, compression, omission, fragments, sensory intensity, unexpected grammar, attitude and dramatic framing are available whenever earned by the supplied reality.",
    artistRule:
      "The Artist owns the creative treatment. The supplied artistDirection is the chosen treatment for this run. Semantic truth must survive; source wording does not. Start from creator objective plus the entire reality palette. Use cognition's Movies only as possible support. You may invent no literal facts, but you may make the truth feel radically more interesting through framing, compression, metaphor, juxtaposition, rhythm, repetition, implication, contrast, escalation, surprise and unexpected language.",
    selectionRule:
      "Do not reopen the creative premise after the Artist direction is supplied. Realize the chosen treatment rather than selecting a new one. You may vary wording, order and number of screens only when the central treatment remains intact.",
    serviceMediaRule:
      "When the creator objective is service or business media, make media for the service or business—not a boring chronological recap of the service appointment. Use supplied details to create desire, personality, memorability, proof, identity, humor, tension, transformation, craft, speed, precision, chaos-to-order or another earned creative treatment.",
    beatRule:
      "One beat is one screenful of attention, not one fact. Combine facts when their collision creates the stronger hit. Split facts when separation creates rhythm, surprise, escalation or payoff. The Artist chooses the number of beats.",
    truthRule:
      "Concrete supplied reality is immutable. Figurative language is allowed. Never present invented people, objects, actions, locations, sounds, dialogue, reactions, outcomes, capabilities, offers, prices or claims as literal reality.",
    sensoryRule:
      "Supplied sound, music, bass, silence, darkness, light, heat, cold, movement, texture, taste, smell, impact, repetition and physical work are creative material, not facts to flatten into explanation.",
    universalityRule:
      "Do not assume every subject is a person, every experience is a story, every business is an advertisement, or every creation has the same structure. Let the supplied objective and reality determine the form.",
  };
}

function prompt(attempt: number, feedback: string): string {
  const attacks = [
    "Find the strongest creative idea hidden anywhere in the supplied material. Then make it undeniable.",
    "Reject the safest treatment. Search for the unusual combination, contradiction, joke, image, mechanic, rhythm or detail that makes this piece uniquely itself.",
    "Make the thing a human would remember tomorrow. Take a creative risk without breaking reality.",
  ];
  return [
    "You are QRE's ONE CREATIVE ARTIST.",
    "You are the final creative authority for the visible moving-text experience.",
    "You are NOT a summarizer.",
    "You are NOT a receipt writer.",
    "You are NOT a chronology formatter.",
    "You are NOT a caption generator.",
    "You are NOT a screenplay writer.",
    "You are creating entertainment media from supplied reality.",
    "SOURCE TRUTH:",
    "Concrete supplied reality is sacred.",
    "Source wording is disposable.",
    "Never invent literal facts.",
    "ARTIST DIRECTION — DO NOT REOPEN IT:",
    "The supplied artistDirection is the chosen creative idea for this realization.",
    "Preserve its mechanic, hook, open loop, tension, surprise and payoff.",
    "Do not choose a different central idea just because a Movie hypothesis looks easier.",
    "Do not convert the six fields into visible headings or labels unless the treatment itself calls for it.",
    "Do not treat artistDirection prose as factual reality. Ground every literal claim in sourceReality.",
    "You may realize the treatment through different wording, ordering, compression, omission and screen count, but the treatment itself is binding.",
    "The chosen treatment may be subtle. Do not force every field into a separate screen.",
    "PREMISE REALIZATION INVARIANT:",
    "The Artist mechanic is the central premise of the piece. The visible sequence must realize THAT premise, not merely mention its ingredients.",
    "A strong realization can state the premise directly, imply it through a pattern, or reveal it through a change in meaning. It must remain recognizable across the whole sequence.",
    "Do not substitute a topic for the premise. Bacon, squirrels, park and apples are topics. They are not a creative idea by themselves.",
    "Do not serialize the source material. The sequence is not a catalog of everything known about the subject.",
    "At least one screen must clearly establish the central premise in memorable language or an unmistakable equivalent.",
    "At least one later screen must deepen, complicate, reverse, or sharpen that same premise.",
    "The final screen must land the same premise rather than introduce a new topic.",
    "A screen containing only a noun or generic adjective is weak unless that exact word is doing a specific job inside the chosen premise.",
    "For example, if the premise is that Coco has a priority system, the realization should make the hierarchy itself visible through wording and progression; it should not become Bacon. Squirrel. Park. Apples.",
    "CREATIVE AUTHORITY:",
    "Cognition supplied Movie possibilities only as supporting hypotheses.",
    "The Artist treatment outranks Movie hypotheses.",
    "RealityGraph outranks both for concrete truth.",
    "CREATIVE ORDER:",
    "FIRST silently understand the creator objective.",
    "SECOND silently scan the entire supplied reality palette.",
    "THIRD silently understand the chosen Artist treatment.",
    "FOURTH silently decide how the treatment should become moving text.",
    "ONLY THEN write the films.",
    "DO NOT CONFUSE MATERIAL WITH FORM:",
    "Facts are material.",
    "The Artist treatment is creative direction.",
    "Movies are possibilities.",
    "The Realizer creates the visible text.",
    "One fact can become multiple screens.",
    "Multiple facts can become one screen.",
    "MOVING TEXT:",
    "The product is readable moving screen text, not camera footage.",
    "A screen may be text-only. A future media layer may combine a supplied photo, media item and text without changing the creative authority described here.",
    "One beat equals one screenful of attention.",
    "Do not write production directions.",
    "Do not describe camera work.",
    "Do not explain why something is funny, meaningful or emotional.",
    "Make the viewer experience it.",
    "FOR SERVICE AND BUSINESS MEDIA:",
    "When the creator objective is promotional, create actual media for the service, business, product, place or offering—not a boring appointment recap.",
    "FIND THE FUCKING IDEA:",
    "Do not become generic. Use the chosen Artist treatment as the starting point and find the most alive realization of it that the supplied world permits.",
    "SCREEN RULE:",
    "Do not write one beat per fact.",
    "Do not make all beats the same length.",
    "Do not force every fact into the film.",
    "Do not force every Movie detail into the film.",
    "Do not let source-fact coverage become the goal. The goal is expression of the central Artist premise.",
    "Do not let a list of nouns stand in for the creative premise.",
    "Prefer fewer, stronger screens over a complete list of supplied details.",
    "Do not force a beginning-middle-end template.",
    "Do not force a fixed beat count.",
    "Use exactly as many beats as the idea needs.",
    "LANGUAGE:",
    "Compression is encouraged.",
    "Fragments are encouraged.",
    "Unexpected grammar is encouraged.",
    "Metaphor is encouraged.",
    "Personification is encouraged.",
    "Attitude is encouraged.",
    "Humor is encouraged.",
    "Silence and omission are encouraged.",
    "A small factual detail can carry an entire film.",
    "FORBIDDEN VISIBLE LANGUAGE:",
    "Never write CLOSE ON, QUICK CUT, CUT TO, SOUND:, CAMERA:, WIDE SHOT, MEDIUM SHOT, TIGHT SHOT, FADE, MONTAGE, DISSOLVE, SHOT OF, SFX, VOICE-OVER or production notes.",
    "NO EXPLANATION:",
    "Never write this means, the point is, the meaning is, the viewer, the audience, this shows or similar explanation.",
    "Do not explain the metaphor.",
    "Do not explain the artistic device.",
    "CREATE:",
    "Make something worth watching.",
    "Make the supplied material feel alive.",
    "Do not sanitize it into a summary.",
    "GENERATE FOUR DIFFERENT FILMS.",
    "These must be genuinely different realizations of the SAME chosen Artist treatment.",
    "Change rhythm, ordering, compression, joke, metaphor, framing or emphasis while preserving the treatment's central idea.",
    "Do not create four cosmetic rewrites of the same chronology.",
    "AFTER CREATING THE FOUR FILMS:",
    "Choose the strongest film yourself.",
    "selectedSetIndex chooses WHICH OF THE FOUR GENERATED FILMS should ship.",
    "selectedMovieIndex records WHICH COGNITIVE MOVIE POSSIBILITY most influenced the treatment, if any.",
    "These are different indexes.",
    "You may set selectedMovieIndex to null when no Movie materially influenced the final work.",
    "OUTPUT EXACTLY:",
    "{\"selectedSetIndex\":3,\"selectedMovieIndex\":1,\"sets\":[{\"scenes\":[{\"text\":\"...\",\"kind\":\"hook\"}]}]}",
    "selectedSetIndex is zero-based and refers to the generated sets array.",
    "selectedMovieIndex is zero-based and refers to the supplied creativePossibilities array.",
    "Each text value is exactly one moving screen.",
    "Allowed kinds: line, hook, movement, discovery, turn, payoff, afterglow.",
    "No commentary.",
    "No source IDs.",
    "No analysis.",
    `Creative attack ${attempt + 1} of 3.`,
    feedback
      ? `Previous attempts failed because: ${feedback}. Do not become safer. Become more specific, more inventive and more committed to the chosen Artist treatment.`
      : "No prior failure. Explore the full creative space inside the chosen Artist treatment.",
    attacks[Math.min(attempt, attacks.length - 1)],
  ].join("\n");
}

export async function realizeAuthorExperience(input: {
  prompt: string;
  subject: string;
  lens: string;
  graph: RealityGraph;
  movies: readonly LatentMovieCandidate[];
  artistDirection: AuthorArtistDirection;
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  priorScenes?: string[];
  creativeLearningContext?: string[];
}): Promise<AuthorRealizationResult> {
  let model = "fallback";
  let modelCalls = 0;
  let rejectedSets = 0;
  let lastJudgment: RealizedFilmJudgment | undefined;
  let selectedMovieIndex: number | undefined;
  let selectedSetIndex: number | undefined;
  const rejectedReasons: string[] = [];
  const realizationMode = process.env.QRE_AUTHOR_REALIZATION_MODE || "full";

  const artistJsonSchema: LocalModelJsonSchema = {
    type: "object",
    additionalProperties: false,
    required: ["selectedSetIndex", "selectedMovieIndex", "sets"],
    properties: {
      selectedSetIndex: { type: "integer", minimum: 0, maximum: 3 },
      selectedMovieIndex: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
      sets: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["scenes"],
          properties: {
            scenes: {
              type: "array",
              minItems: 2,
              maxItems: 24,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["text", "kind"],
                properties: {
                  text: { type: "string", minLength: 1, maxLength: 140 },
                  kind: { type: "string", enum: ["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"] },
                },
              },
            },
          },
        },
      },
    },
  } as const;

  if (realizationMode === "single") {
    const feedback = rejectedReasons.slice(-4).join(" | ");
    const ctx = context(input, feedback);
    const selectionSchema: LocalModelJsonSchema = {
      type: "object",
      additionalProperties: false,
      required: ["selectedMovieIndex"],
      properties: {
        selectedMovieIndex: { type: "integer", minimum: 0, maximum: Math.max(0, input.movies.length - 1) },
      },
    };

    try {
      const selection = await localModelGenerate(
        [
          {
            role: "system",
            content: "Choose the strongest supporting Movie for the already-chosen Artist treatment. The Artist treatment is binding. Do not create scenes, do not replace the treatment, do not invent facts. Return ONLY the selectedMovieIndex.",
          },
          { role: "user", content: JSON.stringify(ctx) },
        ],
        undefined,
        { numPredict: 128, temperature: 1.05, jsonSchema: selectionSchema },
      );
      model = selection.model;
      modelCalls += 1;
      const parsedSelection = parseJson(selection.text);
      const rawMovieValue = parsedSelection?.selectedMovieIndex;
      if (typeof rawMovieValue !== "number" || !Number.isInteger(rawMovieValue) || rawMovieValue < 0 || rawMovieValue >= input.movies.length) {
        rejectedSets += 1;
        rejectedReasons.push("single mode returned invalid selectedMovieIndex");
        return { scenes: [], score: 0, model, modelCalls, rejectedSets, selectedMovieIndex, selectedSetIndex, judgment: lastJudgment, reason: rejectedReasons.join(" | ") };
      }
      selectedMovieIndex = rawMovieValue;
      const selectedMovie = input.movies[selectedMovieIndex];
      if (!selectedMovie) {
        rejectedSets += 1;
        rejectedReasons.push("single mode selected nonexistent Movie");
        return { scenes: [], score: 0, model, modelCalls, rejectedSets, selectedMovieIndex, selectedSetIndex, judgment: lastJudgment, reason: rejectedReasons.join(" | ") };
      }

      const realizationSchema: LocalModelJsonSchema = {
        type: "object",
        additionalProperties: false,
        required: ["scenes"],
        properties: {
          scenes: {
            type: "array",
            minItems: 2,
            maxItems: 24,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "kind"],
              properties: {
                text: { type: "string", minLength: 1, maxLength: 140 },
                kind: { type: "string", enum: ["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"] },
              },
            },
          },
        },
      };

      const realization = await localModelGenerate(
        [
          {
            role: "system",
            content: "Realize the chosen Artist treatment into the strongest possible moving-text sequence. The Artist treatment is binding creative direction; the supplied reality is factual authority; the supporting Movie is optional inspiration. Do not invent facts, do not explain, do not output metadata, and write only the finished scenes JSON.",
          },
          { role: "user", content: JSON.stringify({ ...ctx, selectedMovieIndex, selectedMovie }) },
        ],
        undefined,
        { numPredict: 3500, temperature: 1.1, jsonSchema: realizationSchema },
      );
      model = realization.model;
      modelCalls += 1;
      const parsedRealization = parseJson(realization.text);
      const validation = validateSet({ scenes: parsedRealization?.scenes }, { graph: input.graph, movies: input.movies });
      if (!validation.scenes) {
        rejectedSets += 1;
        if (validation.reason) rejectedReasons.push(validation.reason);
        return { scenes: [], score: 0, model, modelCalls, rejectedSets, selectedMovieIndex, selectedSetIndex, judgment: lastJudgment, reason: rejectedReasons.join(" | ") || "single realization failed validation" };
      }
      const judgment = judgeRealizedFilm({ scenes: validation.scenes, movie: selectedMovie, graph: input.graph });
      lastJudgment = judgment;
      selectedSetIndex = 0;
      return { scenes: validation.scenes, score: judgment.score, model, modelCalls, rejectedSets, selectedMovieIndex, selectedSetIndex, judgment, reason: rejectedReasons.length ? rejectedReasons.join(" | ") : undefined };
    } catch (error) {
      rejectedSets += 1;
      rejectedReasons.push(error instanceof Error ? error.message : "single creative realizer call failed");
      return { scenes: [], score: 0, model, modelCalls, rejectedSets, selectedMovieIndex, selectedSetIndex, judgment: lastJudgment, reason: rejectedReasons.join(" | ") || "single creative realizer failed" };
    }
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const feedback = rejectedReasons.slice(-4).join(" | ");
    const ctx = context(input, feedback);
    try {
      const result = await localModelGenerate(
        [
          { role: "system", content: prompt(attempt, feedback) },
          { role: "user", content: JSON.stringify(ctx) },
        ],
        undefined,
        { numPredict: 10000, temperature: [1.05, 1.15, 1.1][attempt]!, jsonSchema: artistJsonSchema },
      );
      model = result.model;
      modelCalls += 1;
      const parsed = parseJson(result.text);
      const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : [];
      const rawSetIndex = Number(parsed?.selectedSetIndex);
      if (Number.isInteger(rawSetIndex) && rawSetIndex >= 0 && rawSetIndex < rawSets.length) selectedSetIndex = rawSetIndex;
      const rawMovieValue = parsed?.selectedMovieIndex;
      if (typeof rawMovieValue === "number" && Number.isInteger(rawMovieValue) && rawMovieValue >= 0 && rawMovieValue < input.movies.length) selectedMovieIndex = rawMovieValue;
      else if (typeof rawMovieValue === "string" && rawMovieValue.trim() !== "" && Number.isInteger(Number(rawMovieValue)) && Number(rawMovieValue) >= 0 && Number(rawMovieValue) < input.movies.length) selectedMovieIndex = Number(rawMovieValue);

      const diagnosticMovie = selectedMovieIndex !== undefined ? input.movies[selectedMovieIndex] : input.movies[0];
      if (!diagnosticMovie) {
        rejectedSets += 1;
        rejectedReasons.push("no diagnostic Movie available");
        continue;
      }

      const validSets: Array<{ scenes: RealizedScene[]; judgment: RealizedFilmJudgment; index: number }> = [];
      for (const [index, raw] of rawSets.entries()) {
        const validation = validateSet(raw, { graph: input.graph, movies: input.movies });
        if (!validation.scenes) {
          rejectedSets += 1;
          if (validation.reason) rejectedReasons.push(validation.reason);
          continue;
        }
        const judgment = judgeRealizedFilm({ scenes: validation.scenes, movie: diagnosticMovie, graph: input.graph });
        lastJudgment = judgment;
        validSets.push({ scenes: validation.scenes, judgment, index });
      }
      if (!validSets.length) continue;
      const selected = selectedSetIndex !== undefined ? validSets.find((candidate) => candidate.index === selectedSetIndex) : undefined;
      const chosen = selected ?? validSets[validSets.length - 1]!;
      selectedSetIndex = chosen.index;
      return {
        scenes: chosen.scenes,
        score: chosen.judgment.score,
        model,
        modelCalls,
        rejectedSets,
        selectedMovieIndex,
        selectedSetIndex,
        judgment: chosen.judgment,
        reason: rejectedReasons.length ? rejectedReasons.join(" | ") : undefined,
      };
    } catch (error) {
      rejectedSets += 1;
      rejectedReasons.push(error instanceof Error ? error.message : "creative realizer call failed");
    }
  }

  return {
    scenes: [],
    score: 0,
    model,
    modelCalls,
    rejectedSets,
    selectedMovieIndex,
    selectedSetIndex,
    judgment: lastJudgment,
    reason: rejectedReasons.join(" | ") || "no realized film survived validation",
  };
}
