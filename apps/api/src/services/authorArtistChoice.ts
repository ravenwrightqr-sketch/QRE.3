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

function directionPart(raw: unknown, validIds: Set<string>, fallback: string): ArtistDirectionPart {
  if (!raw || typeof raw !== "object") return { text: fallback, sourceEventIds: [] };
  const row = raw as Record<string, unknown>;
  const text = clean(row.text) || fallback;
  const sourceEventIds = Array.isArray(row.sourceEventIds)
    ? unique(row.sourceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => validIds.has(id)).slice(0, 4)
    : [];
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
            "You are QRE's Artist making the final creative direction choice.",
            "QRE is the distribution itself. Find the idea that makes this specific subject worth remembering and wanting to watch again.",
            "Do not merely pick a style. Discover how the supplied material can create forward pull.",
            "The strongest system is discovered from supplied reality, not invented. Find a relationship, priority, contradiction, repetition, status difference, obsession, habit, rule-like pattern, or other organizing logic that is genuinely present in the supplied material.",
            "Do not force a system. If the supplied material has no strong system, use another grounded creative device.",
            "CRITICAL: return an evidence-bearing creative brief. Each of mechanic, hook, openLoop, tension, surprise, and payoff must name the creative idea AND cite 1-4 exact sourceEventIds that support it.",
            "A sourceEventId is evidence, not permission to invent what happened around it.",
            "The text in each field is an interpretation of the cited facts. It must not assert a new concrete person, action, object, location, event, outcome, thought, dialogue, motive, physical change, customer behavior, employee behavior, or business operation.",
            "Allowed: organizing known facts into a priority, comparison, contrast, recurrence, mock rule, investigation, ranking, label, or other editorial framing.",
            "Forbidden: inventing a person, worker, customer, sign, sound, thought, dialogue, reaction, physical movement, shelf behavior, transaction, future event, or operational detail.",
            "Example: with Coco facts about walks, grass, squirrels, apples, and bacon, 'Coco has a system' can frame those facts as competing priorities. Do not invent Coco earning points, completing missions, or encountering a new event.",
            "Example: with housekeeping facts about kitchen, bathroom, inspection, and a cat, the cat can be part of the framing because it is supplied. Do not invent the cat's thoughts, dialogue, approval, standards, or new reactions.",
            "Example: with shelf facts about flavors, grouping, behind-counter stock, trying products, and replenishment, use a flavor hierarchy or visibility/replenishment framing only as interpretation. Do not invent shelf movement, customer choices, sounds, signs, or staff actions beyond supplied facts.",
            "The mechanic is editorial, representational, or interpretive. It never changes the real world.",
            "Do not use future tense to smuggle in an invented event. Do not describe what 'will happen' unless it is explicitly supplied.",
            "Prefer short, specific, characterful language. 'Coco has a system.' is strong when the cited evidence supports it.",
            "Avoid decorative metaphor chains, generic cinematic language, and tech metaphors without a strong grounded reason.",
            "These are creative pressures, not a fixed beat template. Hook, open loop, tension, surprise, and payoff describe attention function, not mandatory plot events.",
            "selectedMovieIndex is optional creative inspiration. You may reject every Movie and choose null.",
            "selectedLens may be NONE.",
            "Return JSON only.",
            "attentionStrategy should be the compact version of the six artistDirection fields.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      "json",
      { numPredict: 500, temperature: 1.05, jsonSchema: schema },
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
      attentionStrategy: formatAttention(artistDirection),
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
