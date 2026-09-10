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
type Parsed = { selectedMovieIndex?: unknown; selectedSetIndex?: unknown; sets?: unknown };

type RealitySemanticRole = "observed-event" | "preference" | "habit" | "attribute" | "general-fact";

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer state|audience state|observer state|evidence id|source event|provenance|compiler|realizer|semantic turn|latent movie|creative opportunity)\b/i;
const EXPLAINING = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|the viewer|the audience|the relationship between|what this means)\b/i;
const SCREENPLAY = /^(?:camera|close(?:-up)?|wide shot|medium shot|tight shot|cut to|fade|dissolve|sound|sfx|voice[- ]over)\b/i;
const ABSTRACT_ONLY = /^(?:a feeling|a moment|something changed|everything changed|worth noticing|the experience|a connection|a memory)\.?$/i;
const PREFERENCE = /\b(?:love|loves|like|likes|enjoy|enjoys|hate|hates|prefer|prefers|adore|adores|favorite|favourite)\b/i;
const PROGRESSIVE = /\b(?:am|is|are|was|were)\s+\w+ing\b/i;
const OBSERVED_ANCHOR = /\b(?:today|yesterday|tomorrow|right now|currently|this morning|this afternoon|this evening|tonight|just now|for\s+\d+(?:\.\d+)?\s+(?:minute|minutes|hour|hours|second|seconds)|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i;
const PAST_OCCURRENCE = /\b(?:arrived|came|left|went|met|talked|spoke|said|did|made|gave|got|found|lost|cleaned|finished|started|opened|closed|walked|ran|drove|ate|drank|kissed|married|celebrated|played|worked|visited|bought|sold|built|fixed|painted|wore|used|stayed|waited|called|laughed|cried|looked|felt|became|changed|repaired|tested|selected|cut|shaped|polished|delivered|welcomed|checked|booked|reserved|approved|groomed|dyed|tailored|installed|stole|returned|rescued|adopted|remembered|watched|heard|sang|danced)\b/i;
const FIRST_OR_SECOND_PERSON_EVENT = /\b(?:I|we|you)\s+(?:walk|walked|go|went|take|took|meet|met|see|saw|visit|visited|clean|cleaned|work|worked|call|called|love|loved|eat|ate|drink|drank|play|played|stay|stayed|arrive|arrived)\b/i;
const MAX_CUTS = 18;
const MAX_CHARS = 150;
const MAX_WORDS = 22;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): string[] => clean(text).toLowerCase().match(/[a-z0-9’'-]+/g) ?? [];

function semanticRole(label: string): RealitySemanticRole {
  const text = clean(label);
  if (PROGRESSIVE.test(text) || OBSERVED_ANCHOR.test(text) || PAST_OCCURRENCE.test(text) || FIRST_OR_SECOND_PERSON_EVENT.test(text)) return "observed-event";
  if (PREFERENCE.test(text)) return "preference";
  if (/\b(?:is|are)\s+(?:a|an|the)?\s*(?:small|large|big|little|old|young|new|black|white|red|blue|green|brown|tall|short|quiet|loud|gentle|wild|sweet|funny|fierce|goofy|beautiful|strange|weird)\b/i.test(text)) return "attribute";
  if (/\b(?:walks|runs|goes|visits|plays|works|lives|sleeps|eats|drinks|chases|likes|loves|wears|uses|keeps)\b/i.test(text) && !OBSERVED_ANCHOR.test(text)) return "habit";
  return "general-fact";
}

function roleExplanation(role: RealitySemanticRole): string {
  switch (role) {
    case "observed-event": return "This statement is explicit occurrence reality. Physical action described here is authorized because the statement supplies an occurrence, temporal anchor, progressive action, or witnessed/past event.";
    case "preference": return "This statement describes preference or disposition. It is character material, not proof that the preferred action happened.";
    case "habit": return "This statement describes general or recurring behavior. It is not a newly occurring event unless the input explicitly anchors an occurrence.";
    case "attribute": return "This statement describes identity or an attribute. Do not stage a new action from it.";
    case "general-fact": return "This statement is supplied descriptive reality. Interpret it creatively, but do not invent a concrete occurrence from it.";
  }
}

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
  if (["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"].includes(normalized)) return normalized as AuthorScene["kind"];
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  return "discovery";
}

function validateScenes(raw: unknown, graph: RealityGraph): RealizedScene[] | undefined {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > MAX_CUTS) return undefined;
  const scenes: RealizedScene[] = [];
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
  const quality = Math.max(0.25, Math.min(0.99, 0.5 + Math.min(0.25, distinctSources / Math.max(1, graph.events.length) * 0.25) + Math.min(0.2, bridges * 0.04)));
  return scenes.map((scene, index) => ({ ...scene, score: Number(Math.max(0.25, quality - index * 0.01).toFixed(3)) }));
}

function deterministicFactCuts(input: Input): RealizedScene[] {
  const source = input.graph.events.map((event) => ({ event, role: semanticRole(event.label) }));
  const observed = source.filter((item) => item.role === "observed-event");
  const descriptive = source.filter((item) => item.role !== "observed-event");
  const candidates: Array<{ text: string; eventId: string }> = [];

  for (const item of descriptive) {
    const escapedSubject = input.subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const label = item.event.label.replace(new RegExp("^" + escapedSubject + "\\s+", "i"), "").trim();
    const lowerLabel = label.toLowerCase();
    if (item.role === "habit" && /\bwalks\b/i.test(label)) {
      candidates.push({ text: "Love walks.", eventId: item.event.id });
      continue;
    }
    if (item.role === "preference") {
      const match = label.match(/^(?:loves?|likes?|enjoys?|hates?|prefers?|adores?)\s+(.+)$/i);
      if (match?.[1]) candidates.push({ text: `${match[1].replace(/[.!?]+$/, "")} fan.`, eventId: item.event.id });
      continue;
    }
    if (item.role === "attribute") {
      candidates.push({ text: label.replace(/[.!?]+$/, "."), eventId: item.event.id });
      continue;
    }
    if (lowerLabel) candidates.push({ text: label.replace(/[.!?]+$/, "."), eventId: item.event.id });
  }

  if (observed.length) {
    for (const item of observed.slice(0, 6)) {
      const label = item.event.label.replace(/[.!?]+$/, "");
      candidates.push({ text: label, eventId: item.event.id });
    }
  }

  const deduped: RealizedScene[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const text = clean(candidate.text);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    deduped.push({
      text,
      kind: deduped.length === 0 ? "hook" : deduped.length === candidates.length - 1 ? "payoff" : "discovery",
      sourceEventIds: [candidate.eventId],
      score: 0.72,
    });
    if (deduped.length >= MAX_CUTS) break;
  }

  if (deduped.length >= 2) {
    const last = deduped[deduped.length - 1];
    deduped[deduped.length - 1] = { ...last, kind: "payoff" };
    return deduped;
  }

  const first = input.graph.events[0];
  if (!first) return [];
  return [{ text: first.label.replace(/[.!?]+$/, "."), kind: "hook", sourceEventIds: [first.id], score: 0.65 }, { text: input.subject ? `${input.subject}.` : first.label.replace(/[.!?]+$/, "."), kind: "payoff", sourceEventIds: [first.id], score: 0.62 }];
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
    metrics: { novelty: movie.novelty, specificity: movie.specificity, attentionPotential: movie.attentionPotential, consequencePotential: movie.consequencePotential, callbackPotential: movie.callbackPotential, compressionPotential: movie.compressionPotential, distinctiveness: movie.distinctiveness },
    suppliedReality: graph.events.map((event) => ({ id: event.id, label: event.label, semanticRole: semanticRole(event.label), rule: roleExplanation(semanticRole(event.label)) })),
  };
}

function buildSystemPrompt(input: Input): string {
  const requestedLens = clean(input.lens).toLowerCase();
  const lensRule = requestedLens && requestedLens !== "none"
    ? `A creative lens was explicitly requested: ${requestedLens}. Apply it only as pressure over discovered reality. It may change framing, rhythm, attitude, metaphor, implication, or emphasis. It may NEVER create a concrete event or fact.`
    : "NO LENS IS REQUIRED. Do not choose a genre merely because the domain suggests one. Let the supplied reality determine the treatment.";
  return [
    "You are the QRE Artist.",
    "Find the experience hiding inside supplied reality, then render it as short moving cuts.",
    "The source reality is the only authority for concrete facts.",
    "Interpretation is allowed. Invention of concrete reality is forbidden.",
    "CRITICAL SEMANTIC RULE: a general fact or habitual statement is NOT a newly occurring event.",
    "For example: 'Coco walks in the park' means walking is characteristic of Coco; it does NOT authorize you to say Coco walked today.",
    "'Coco loves apples' is a preference; it does NOT authorize eating an apple.",
    "'Coco chases squirrels' is general behavior unless the input explicitly anchors an occurrence; do not turn it into a chase that happened today.",
    "'Coco walked in the park for 45 minutes today' IS an observed event. That physical movement, place, duration, and time are authorized because the input explicitly supplies them.",
    "A statement can be creatively reframed without being converted into an event. Preserve that distinction throughout the film.",
    "Do not turn ordinary facts into a themed story just because a genre is available.",
    lensRule,
    "The sequence is the art. A cut should make the next cut more wanted by changing expectation, adding pressure, revealing a relationship, creating a callback, or sharpening a landing.",
    "The language should usually get smaller while the meaning gets larger.",
    "Do not explain the realization. Let the observer complete it.",
    "Do not force a hook-build-hit formula. The strongest realization may land anywhere, may split across cuts, or may not be explicit.",
    "Use repetition, fragments, contradiction, callbacks, one-word cuts, full sentences, silence-like brevity, and unusual phrasing when earned.",
    "Never add a new person, object, action, place, motive, emotion, sound, sensory property, outcome, or backstory unless the supplied evidence supports it.",
    "A figurative transformation is allowed when it remains clearly figurative and grounded in the supplied relationship. Do not write fictional literal events.",
    "Do not restate the source as a receipt or one-fact-per-cut caption reel.",
    "Produce three materially different possible films, not three rewrites of one film. Then choose the strongest one as Artist.",
    "Every final cut must include one or more source event IDs that genuinely support that cut.",
    "Keep cuts concise. Prefer exact language and high meaning per word. Avoid generic emotional declarations.",
    "Do not use internal architecture language in visible text.",
    "Return JSON only.",
  ].join("\n");
}

function judgmentAcceptable(judgment: RealizedFilmJudgment): boolean {
  return judgment.accepted &&
    judgment.dimensions.inventionRisk <= 0.4 &&
    judgment.dimensions.explanationRisk === 0 &&
    judgment.dimensions.captionReelRisk <= 0.85 &&
    judgment.score >= 0.58;
}

export async function realizeAuthorExperience(input: Input): Promise<AuthorRealizationResult> {
  const movies = input.movies.slice(0, 10);
  if (!movies.length) return { scenes: [], score: 0, model: "deterministic", modelCalls: 0, rejectedSets: 1, reason: "no creative possibilities supplied" };

  const reality = input.graph.events.map((event) => ({
    id: event.id,
    label: event.label,
    entities: event.entities,
    place: event.place,
    time: event.time,
    semanticRole: semanticRole(event.label),
    semanticRule: roleExplanation(semanticRole(event.label)),
  }));
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
      sets: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", additionalProperties: false, required: ["scenes"], properties: { scenes: { type: "array", minItems: 2, maxItems: MAX_CUTS, items: { type: "object", additionalProperties: false, required: ["text", "kind", "sourceEventIds"], properties: { text: { type: "string", minLength: 1, maxLength: MAX_CHARS }, kind: { type: "string", enum: ["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"] }, sourceEventIds: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } } } } } } } },
    },
  } as const;

  let model = "deterministic";
  let modelCalls = 0;
  let rejectedSets = 0;
  let lastJudgment: RealizedFilmJudgment | undefined;
  const rejectionReasons: string[] = [];

  try {
    const result = await localModelGenerate(
      [{ role: "system", content: buildSystemPrompt(input) }, { role: "user", content: JSON.stringify(body) }],
      "json",
      { numPredict: 2600, temperature: 1.05, jsonSchema: schema },
    );
    model = result.model;
    modelCalls += 1;
    const parsed = parse(result.text);
    const rawSets = Array.isArray(parsed?.sets) ? parsed.sets as RawSet[] : [];
    const selectedMovieValue = Number(parsed?.selectedMovieIndex);
    const selectedMovieIndex = Number.isInteger(selectedMovieValue) && selectedMovieValue >= 0 && selectedMovieValue < movies.length ? selectedMovieValue : 0;
    const selectedSetValue = Number(parsed?.selectedSetIndex);
    const selectedSetIndex = Number.isInteger(selectedSetValue) && selectedSetValue >= 0 && selectedSetValue < rawSets.length ? selectedSetValue : 0;

    for (let index = 0; index < rawSets.length; index += 1) {
      const scenes = validateScenes(rawSets[index]?.scenes, input.graph);
      if (!scenes) {
        rejectedSets += 1;
        rejectionReasons.push(`set ${index + 1} failed reality/style validation`);
        continue;
      }
      const movie = movies[selectedMovieIndex]!;
      const judgment = judgeRealizedFilm({ scenes, movie, graph: input.graph });
      lastJudgment = judgment;
      if (!judgmentAcceptable(judgment)) {
        rejectedSets += 1;
        rejectionReasons.push(`set ${index + 1} failed film judgment: ${judgment.reasons.join("; ") || "quality below creative threshold"}`);
        continue;
      }
      if (index === selectedSetIndex) {
        return { scenes, score: judgment.score, model, modelCalls, rejectedSets, selectedMovieIndex, selectedSetIndex: index, judgment };
      }
    }
  } catch (error) {
    modelCalls += 1;
    rejectionReasons.push(error instanceof Error ? error.message : "Artist call failed");
  }

  const fallbackScenes = deterministicFactCuts(input);
  if (fallbackScenes.length >= 2) {
    return {
      scenes: fallbackScenes,
      score: 0.7,
      model,
      modelCalls,
      rejectedSets,
      selectedMovieIndex: 0,
      selectedSetIndex: 0,
      reason: rejectionReasons.length ? `model realization rejected; truthful fallback used: ${rejectionReasons.join(" | ")}` : "truthful deterministic realization used",
    };
  }

  return { scenes: [], score: 0, model, modelCalls, rejectedSets, judgment: lastJudgment, reason: rejectionReasons.join(" | ") || "Artist failed to realize a valid film" };
}