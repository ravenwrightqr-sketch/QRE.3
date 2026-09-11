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
const NEW_BEHAVIOR = /\b(?:triggers?|causes?|earns?|wins?|loses?|chases?|encounters?|interacts?|interrupts?|disrupts?|swaps?|rotates?|moves?|appears?|disappears?|speaks?|says?|thinks?|watches?\s+with|approves?|judges?|reacts?|reveals?\s+that|requires?|forces?|decides?|chooses?|returns?|comes?|arrives?)\b/i;
const NEW_ACTOR = /\b(?:employee|employees|worker|workers|customer|customers|staff|manager|crew chief|owner|visitor|audience|viewer)\b/i;
const OPERATIONAL_CLAIM = /\b(?:reserve|reserved|staging area|quick replenishment|controlled availability|demand-driven|popular|best-selling|most visible|priority stock|hidden because|kept for|held for)\b/i;
const FUTURE_CLAIM = /\b(?:will|would then|next,?\s+the|later,?\s+the)\b/i;
const EMBEDDED_IDS = /\s*(?:source(?:Event)?Ids?)\s*[:=]\s*\[[^\]]*\]\s*$/i;

function riskyDirectionText(text: string): boolean {
  const value = clean(text);
  if (!value) return true;
  return UNSUPPORTED_FACT.test(value)
    || NEW_BEHAVIOR.test(value)
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
            "You are QRE's Artist making the final creative direction choice.",
            "QRE is the distribution itself. Find the idea that makes this specific subject worth remembering and wanting to watch again.",
            "Do not merely pick a style. Discover how the supplied material can create forward pull.",
            "The strongest system is discovered from supplied reality, not invented. Find a relationship, priority, contradiction, repetition, status difference, obsession, habit, rule-like pattern, or other organizing logic genuinely present in the supplied material.",
            "Do not force a system. If the supplied material has no strong system, use another grounded creative device.",
            "CRITICAL HANDOFF CONTRACT: each artistDirection field is an EDITORIAL INSTRUCTION, not a factual report. Write what the film should DO WITH the cited facts, not what new thing is true.",
            "Prefer imperative/editorial phrasing such as 'Frame...', 'Treat...', 'Contrast...', 'Return to...', 'Use the existing...', 'Arrange the supplied...', or 'Let these known details compete...'.",
            "Do NOT state an interpretation as though it were a newly observed fact. 'Frame the behind-counter stock as a reserve' is acceptable; 'the stock is deliberately reserved' is not.",
            "A sourceEventId is evidence for the creative treatment, not permission to invent activity around that event.",
            "Each of mechanic, hook, openLoop, tension, surprise, and payoff must cite 1-4 exact sourceEventIds in the sourceEventIds array.",
            "Never write sourceEventIds, sourceIds, or event IDs inside the text field. IDs belong ONLY in the sourceEventIds array.",
            "The text in each field must not assert a new concrete person, action, object, location, event, outcome, thought, dialogue, motive, physical change, customer behavior, employee behavior, business operation, sound, or future event.",
            "Allowed: organizing known facts into a priority, comparison, contrast, recurrence, mock rule, investigation, ranking, label, meter, or other editorial framing.",
            "The mechanic is editorial, representational, or interpretive. It never changes the real world.",
            "Example: with Coco facts about walks, grass, squirrels, apples, and bacon, 'Frame Coco as running on competing priorities' is valid. 'Coco earns points' is not.",
            "Example: with housekeeping facts about kitchen, bathroom, inspection, and a cat, 'Use the cat as a silent witness in the framing' is valid. 'The cat approves the final clean' is not.",
            "Example: with shelf facts about flavors, grouping, behind-counter stock, trying products, and replenishment, 'Frame the shelf around visibility versus replenishment' is valid. 'The shelf reacts to demand' is not unless that behavior is supplied.",
            "Do not invent people, staff, customers, signs, sounds, thoughts, dialogue, physical movement, operational rules, or future actions.",
            "Do not use certainty words such as deliberately, intentionally, secretly, obviously, or genuinely to turn an interpretation into a fact.",
            "Do not make claims such as reserved, popular, best-selling, most visible, staging area, quick replenishment, controlled availability, or demand-driven unless the supplied reality explicitly establishes them. When uncertain, phrase them as framing: 'treat as', 'frame as', 'contrast with', 'make the viewer notice'.",
            "Do not use future tense to smuggle in an invented event.",
            "Prefer short, specific, characterful language. 'Coco has a system' is strong when the cited evidence supports it.",
            "Avoid decorative metaphor chains, generic cinematic language, and tech metaphors without a grounded reason.",
            "These are creative pressures, not a fixed beat template. Hook, open loop, tension, surprise, and payoff describe attention function, not mandatory plot events.",
            "selectedMovieIndex is optional creative inspiration. You may reject every Movie and choose null.",
            "selectedLens may be NONE.",
            "attentionStrategy should be the compact version of the six artistDirection fields.",
            "Return JSON only.",
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
