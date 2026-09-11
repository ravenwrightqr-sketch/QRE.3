import type { AuthorDomainContext, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import type { CreativeLensCandidate } from "./authorCreativeLens.js";
import { localModelGenerate, type LocalModelJsonSchema } from "./localModelRuntime.js";

export type ArtistDirectionPart = {
  text: string;
  sourceEventIds: string[];
};

export type AuthorArtistDirection = {
  mechanic: ArtistDirectionPart;
  hook: ArtistDirectionPart;
  openLoop: ArtistDirectionPart;
  tension: ArtistDirectionPart;
  surprise: ArtistDirectionPart;
  payoff: ArtistDirectionPart;
};

export type AuthorArtistChoice = {
  selectedLens: string;
  selectedMovieIndex?: number;
  attentionStrategy: string;
  artistDirection: AuthorArtistDirection;
  model: string;
  modelCalls: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function compactMovie(movie: LatentMovieCandidate, index: number) {
  return {
    index,
    id: movie.id,
    hypothesis: clean(movie.hypothesis[0]),
    payoff: clean(movie.payoff),
    question: clean(movie.unresolvedQuestion),
    relations: unique(movie.supportingRelationKinds).slice(0, 4),
    anchors: unique(movie.anchorEventIds).slice(0, 4),
  };
}

function compactLens(candidate: CreativeLensCandidate, index: number) {
  return {
    index,
    lens: clean(candidate.lens),
    family: candidate.family,
    score: candidate.score,
    reason: clean(candidate.reason),
    supportedSignals: unique(candidate.supportedSignals).slice(0, 5),
  };
}

const partSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text", "sourceEventIds"],
  properties: {
    text: { type: "string", minLength: 1, maxLength: 140 },
    sourceEventIds: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string", minLength: 1 },
    },
  },
} as const;

const schema: LocalModelJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["selectedLens", "selectedMovieIndex", "attentionStrategy", "artistDirection"],
  properties: {
    selectedLens: { type: "string", minLength: 1, maxLength: 80 },
    selectedMovieIndex: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
    attentionStrategy: { type: "string", minLength: 1, maxLength: 600 },
    artistDirection: {
      type: "object",
      additionalProperties: false,
      required: ["mechanic", "hook", "openLoop", "tension", "surprise", "payoff"],
      properties: {
        mechanic: partSchema,
        hook: partSchema,
        openLoop: partSchema,
        tension: partSchema,
        surprise: partSchema,
        payoff: partSchema,
      },
    },
  },
};

const UNSUPPORTED_FACT = /\b(?:deliberately|intentionally|purposely|secretly|obviously|definitely|genuinely|really)\b/i;
const PRODUCTION_DIRECTION = /\b(?:close[- ]?up|camera|zoom|pan|dolly|tracking shot|wide shot|medium shot|tight shot|angle on|montage|dissolve|smash cut|sound design|sound effect|sfx|voice[- ]over|voiceover|footage|film this|film the|shoot this|shoot the)\b/i;
const INVENTED_BEHAVIOR = /\b(?:earns?|wins?|loses?|chases?|encounters?|interacts?|swaps?|rotates?|moves?|appears?|disappears?|speaks?|says?|thinks?|watches?\s+with|approves?|judges?|reacts?|requires?|forces?|decides?|comes?|arrives?|hands?|gives?|receives?|offers?|eats?|drinks?|runs?|jumps?|rolls?|follows?|greets?)\b/i;
const NEW_ACTOR = /\b(?:employee|employees|worker|workers|customer|customers|staff|manager|crew chief|owner|visitor|audience|viewer)\b/i;
const OPERATIONAL_CLAIM = /\b(?:reserve|reserved|staging area|quick replenishment|controlled availability|demand-driven|popular|best-selling|most visible|priority stock|hidden because|kept for|held for)\b/i;
const FUTURE_CLAIM = /\b(?:will|would then|next,?\s+the|later,?\s+the)\b/i;
const EMBEDDED_IDS = /\s*(?:source(?:Event)?Ids?)\s*[:=]\s*\[[^\]]*\]\s*$/i;

function riskyDirectionText(text: string): boolean {
  const value = clean(text);
  if (!value) return true;
  return UNSUPPORTED_FACT.test(value)
    || PRODUCTION_DIRECTION.test(value)
    || INVENTED_BEHAVIOR.test(value)
    || NEW_ACTOR.test(value)
    || OPERATIONAL_CLAIM.test(value)
    || FUTURE_CLAIM.test(value);
}

function normalizedSourceEventIds(raw: unknown, validIds: Set<string>): string[] {
  const values = Array.isArray(raw)
    ? raw.flatMap((value) => typeof value === "string" ? value.split(/[;,]/g) : [])
    : typeof raw === "string"
      ? raw.split(/[;,]/g)
      : [];
  return unique(values)
    .filter((id) => validIds.has(id))
    .slice(0, 4);
}

function cleanDirectionText(raw: unknown): string {
  return clean(raw)
    .replace(EMBEDDED_IDS, "")
    .replace(/\s*source(?:Event)?Ids?\s*[:=]\s*\[[^\]]*\]\s*$/i, "")
    .trim();
}

function directionPart(raw: unknown, validIds: Set<string>, fallback: string): ArtistDirectionPart {
  if (!raw || typeof raw !== "object") return { text: fallback, sourceEventIds: [] };
  const row = raw as Record<string, unknown>;
  const text = cleanDirectionText(row.text) || fallback;
  const sourceEventIds = normalizedSourceEventIds(row.sourceEventIds, validIds);

  if (riskyDirectionText(text) || sourceEventIds.length === 0) {
    return { text: fallback, sourceEventIds };
  }

  return { text, sourceEventIds };
}

function formatAttention(direction: AuthorArtistDirection): string {
  return [
    `MECHANIC=${direction.mechanic.text}`,
    `HOOK=${direction.hook.text}`,
    `OPEN_LOOP=${direction.openLoop.text}`,
    `TENSION=${direction.tension.text}`,
    `SURPRISE=${direction.surprise.text}`,
    `PAYOFF=${direction.payoff.text}`,
  ].join(" | ");
}

const fallbackDirection = (): AuthorArtistDirection => ({
  mechanic: { text: "grounded subject system", sourceEventIds: [] },
  hook: { text: "specific identity", sourceEventIds: [] },
  openLoop: { text: "discover the subject's rule", sourceEventIds: [] },
  tension: { text: "raise the supplied priority", sourceEventIds: [] },
  surprise: { text: "change the reading using supplied material", sourceEventIds: [] },
  payoff: { text: "land the subject's defining detail", sourceEventIds: [] },
});

export async function chooseArtistDirection(input: {
  prompt: string;
  subject: string;
  graph: RealityGraph;
  subjectMaterial?: Record<string, string[]>;
  movies: readonly LatentMovieCandidate[];
  lensCandidates: readonly CreativeLensCandidate[];
  domainContext?: AuthorDomainContext;
}): Promise<AuthorArtistChoice> {
  const lenses = input.lensCandidates.slice(0, 8).map(compactLens);
  if (!lenses.some((item) => item.lens.toUpperCase() === "NONE")) {
    lenses.push({ index: lenses.length, lens: "NONE", family: "none", score: .5, reason: "Keep the supplied material unframed when that is genuinely stronger.", supportedSignals: [] });
  }

  const events = input.graph.events.slice(0, 18).map((event) => ({
    id: event.id,
    label: clean(event.label),
    place: clean(event.place),
    time: clean(event.time),
  }));
  const validEventIds = new Set(events.map((event) => event.id));

  const payload = {
    prompt: clean(input.prompt),
    subject: clean(input.subject),
    subjectMaterial: input.subjectMaterial ?? {},
    creatorContext: input.domainContext ? {
      category: clean(input.domainContext.category),
      businessType: clean(input.domainContext.businessType),
      subjectKind: clean(input.domainContext.subjectKind),
      audience: unique(input.domainContext.audience ?? []).slice(0, 8),
      objective: clean(input.domainContext.objective),
      desiredAction: clean(input.domainContext.desiredAction),
    } : null,
    reality: events,
    movies: input.movies.slice(0, 8).map(compactMovie),
    lensField: lenses,
  };

  try {
    const result = await localModelGenerate(
      [
        {
          role: "system",
          content: [
            "You are QRE's Artist. Your job is to discover the most specific, memorable creative idea in the supplied material.",
            "Do not write a generic content strategy. Find what is peculiar about THIS subject and build the treatment around that.",
            "The finished product is moving readable text. Artist direction is the creative idea that the Realizer will translate into that text.",
            "Start by scanning the whole supplied reality for a repeated behavior, priority, contradiction, obsession, habit, status difference, relationship, rule-like pattern, recurring detail, or other organizing logic genuinely present in the material.",
            "Do not force a system where none exists. Another grounded creative device may be stronger.",
            "The best treatment often sounds simple after it is found. Example: 'Coco has a system. Bacon overrides it.'",
            "The six fields are six creative pressures around ONE idea, not six unrelated writing tasks and not six mandatory scenes.",
            "MECHANIC = the simple organizing idea or game-like rule created from known facts.",
            "HOOK = the strongest entry into that idea.",
            "OPEN LOOP = the unresolved relationship, comparison, question, or expectation that creates forward pull without inventing an event.",
            "TENSION = the real contrast, competing priority, mismatch, or contradiction already present in the supplied material.",
            "SURPRISE = the detail or reversal that changes how the earlier material reads, using only what is supplied.",
            "PAYOFF = the cleanest return or landing on the detail that best defines the subject.",
            "Write these as concise creative treatment instructions, not as prose explanations.",
            "Good: 'Treat Coco's preferences as a priority ladder.'",
            "Good: 'Put the ordinary walk beside the stronger food preferences so the hierarchy becomes obvious.'",
            "Good: 'Return to bacon as the detail that defeats the rest of the system.'",
            "Bad: 'Open with a close-up of Coco reacting to bacon.'",
            "Bad: 'Show Coco chasing a squirrel.'",
            "Bad: 'The customers will notice the back stock is reserved.'",
            "Creative verbs such as frame, treat, contrast, return, compress, repeat, rank, juxtapose, reveal, invert, build, land, and open are allowed when they describe how to shape known material.",
            "Do NOT turn editorial interpretation into a new factual claim.",
            "Do NOT invent a person, action, object, location, event, outcome, reaction, thought, dialogue, motive, operational rule, customer behavior, employee behavior, sound, physical movement, or future event.",
            "A cited sourceEventId is evidence for the treatment, not permission to invent activity around the event.",
            "Each field must cite 1-4 exact sourceEventIds in sourceEventIds. Never put IDs in the text.",
            "Do not write audiovisual production directions: no close-ups, shots, camera moves, zooms, pans, angles, footage, SFX, voice-over or filming instructions.",
            "Do not write invented behavior merely because it would make a story more dramatic.",
            "Avoid generic cinematic language and abstract consultant language. Prefer short, specific, slightly opinionated creative language.",
            "Do not make every field mention a different topic. They should reinforce one central idea.",
            "selectedMovieIndex is supporting inspiration only. It may be null.",
            "selectedLens may be NONE.",
            "attentionStrategy should be one compact sentence describing the central creative idea.",
            "Return JSON only.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      "json",
      { numPredict: 500, temperature: 1.1, jsonSchema: schema },
    );

    const parsed = (() => {
      try { return JSON.parse(clean(result.text)) as Record<string, unknown>; } catch { return undefined; }
    })();

    const rawMovie = parsed?.selectedMovieIndex;
    const selectedMovieIndex = typeof rawMovie === "number" && Number.isInteger(rawMovie) && rawMovie >= 0 && rawMovie < input.movies.length ? rawMovie : undefined;
    const rawDirection = parsed?.artistDirection && typeof parsed.artistDirection === "object" ? parsed.artistDirection as Record<string, unknown> : {};
    const fallback = fallbackDirection();
    const artistDirection: AuthorArtistDirection = {
      mechanic: directionPart(rawDirection.mechanic, validEventIds, fallback.mechanic.text),
      hook: directionPart(rawDirection.hook, validEventIds, fallback.hook.text),
      openLoop: directionPart(rawDirection.openLoop, validEventIds, fallback.openLoop.text),
      tension: directionPart(rawDirection.tension, validEventIds, fallback.tension.text),
      surprise: directionPart(rawDirection.surprise, validEventIds, fallback.surprise.text),
      payoff: directionPart(rawDirection.payoff, validEventIds, fallback.payoff.text),
    };

    return {
      selectedLens: clean(parsed?.selectedLens) || "NONE",
      selectedMovieIndex,
      attentionStrategy: clean(parsed?.attentionStrategy) || formatAttention(artistDirection),
      artistDirection,
      model: result.model,
      modelCalls: 1,
    };
  } catch {
    const artistDirection = fallbackDirection();
    return {
      selectedLens: "NONE",
      selectedMovieIndex: undefined,
      attentionStrategy: formatAttention(artistDirection),
      artistDirection,
      model: "fallback",
      modelCalls: 1,
    };
  }
}
