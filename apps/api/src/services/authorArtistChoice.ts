import type {
  AuthorDomainContext,
  LatentMovieCandidate,
  RealityGraph,
} from "@qre/contracts";
import type { CreativeLensCandidate } from "./authorCreativeLens.js";
import {
  localModelGenerate,
  type LocalModelJsonSchema,
} from "./localModelRuntime.js";

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

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const partSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text", "sourceEventIds"],
  properties: {
    text: { type: "string", minLength: 1, maxLength: 180 },
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
    selectedMovieIndex: {
      anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }],
    },
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

const PRODUCTION_DIRECTION =
  /\b(?:close[- ]?up|camera|zoom|pan|dolly|tracking shot|wide shot|medium shot|tight shot|angle on|montage|dissolve|smash cut|sound design|sound effect|sfx|voice[- ]over|voiceover|footage|film this|film the|shoot this|shoot the)\b/i;

const UNSUPPORTED_CERTAINTY =
  /\b(?:deliberately|intentionally|purposely|secretly|obviously|definitely|genuinely)\b/i;

const NEW_ACTOR =
  /\b(?:employee|employees|worker|workers|customer|customers|staff|manager|crew chief|owner|visitor|audience|viewer)\b/i;

const OPERATIONAL_CLAIM =
  /\b(?:staging area|quick replenishment|controlled availability|demand-driven|popular|best-selling|most visible|priority stock|hidden because|kept for|held for)\b/i;

const FUTURE_CLAIM =
  /\b(?:will|would then|next,?\s+the|later,?\s+the)\b/i;

const EDITORIAL_INSTRUCTION =
  /^(?:frame|treat|use|show|open with|start with|lead with|rank|contrast|repeat|compress|juxtapose|invert|build|return to|land on)\b/i;

function riskyDirectionText(text: string): boolean {
  const value = clean(text);
  return !value
    || PRODUCTION_DIRECTION.test(value)
    || UNSUPPORTED_CERTAINTY.test(value)
    || NEW_ACTOR.test(value)
    || OPERATIONAL_CLAIM.test(value)
    || FUTURE_CLAIM.test(value);
}

function normalizeSourceEventIds(
  raw: unknown,
  validIds: Set<string>,
): string[] {
  const values = Array.isArray(raw)
    ? raw.flatMap((value) =>
        typeof value === "string" ? value.split(/[;,]/g) : [],
      )
    : typeof raw === "string"
      ? raw.split(/[;,]/g)
      : [];

  return unique(values)
    .filter((id) => validIds.has(id))
    .slice(0, 4);
}

function cleanDirectionText(raw: unknown): string {
  return clean(raw)
    .replace(/\s*(?:source(?:Event)?Ids?)\s*[:=]\s*\[[^\]]*\]\s*$/i, "")
    .trim();
}

function directionPart(
  raw: unknown,
  validIds: Set<string>,
  fallback: string,
): ArtistDirectionPart {
  if (!raw || typeof raw !== "object") {
    return { text: fallback, sourceEventIds: [] };
  }

  const row = raw as Record<string, unknown>;
  const text = cleanDirectionText(row.text) || fallback;
  const sourceEventIds = normalizeSourceEventIds(row.sourceEventIds, validIds);

  if (riskyDirectionText(text) || sourceEventIds.length === 0) {
    return { text: fallback, sourceEventIds };
  }

  return { text, sourceEventIds };
}

function formatAttention(direction: AuthorArtistDirection): string {
  return direction.mechanic.text;
}

const fallbackDirection = (): AuthorArtistDirection => ({
  mechanic: { text: "Find the subject's strongest organizing idea.", sourceEventIds: [] },
  hook: { text: "Lead with the most specific supplied detail.", sourceEventIds: [] },
  openLoop: { text: "Create pull from a real unresolved relationship.", sourceEventIds: [] },
  tension: { text: "Put two supplied truths under pressure.", sourceEventIds: [] },
  surprise: { text: "Let a supplied detail change the reading.", sourceEventIds: [] },
  payoff: { text: "Land on the detail that most defines the subject.", sourceEventIds: [] },
});

function compactMovie(movie: LatentMovieCandidate, index: number) {
  return {
    index,
    id: movie.id,
    hypothesis: clean(movie.hypothesis[0]),
    payoff: clean(movie.payoff),
    unresolvedQuestion: clean(movie.unresolvedQuestion),
    relations: unique(movie.supportingRelationKinds).slice(0, 5),
    anchors: unique(movie.anchorEventIds).slice(0, 6),
  };
}

function compactLens(candidate: CreativeLensCandidate, index: number) {
  return {
    index,
    lens: clean(candidate.lens),
    family: candidate.family,
    score: candidate.score,
    reason: clean(candidate.reason),
    supportedSignals: unique(candidate.supportedSignals).slice(0, 6),
  };
}

export async function chooseArtistDirection(input: {
  prompt: string;
  subject: string;
  graph: RealityGraph;
  subjectMaterial?: Record<string, string[]>;
  movies: readonly LatentMovieCandidate[];
  lensCandidates: readonly CreativeLensCandidate[];
  domainContext?: AuthorDomainContext;
}): Promise<AuthorArtistChoice> {
  const lenses = input.lensCandidates
    .slice(0, 8)
    .map(compactLens);

  if (!lenses.some((item) => item.lens.toUpperCase() === "NONE")) {
    lenses.push({
      index: lenses.length,
      lens: "NONE",
      family: "none",
      score: 0.5,
      reason: "Use the supplied material directly when no stronger frame is earned.",
      supportedSignals: [],
    });
  }

  const events = input.graph.events.slice(0, 24).map((event) => ({
    id: event.id,
    label: clean(event.label),
    entities: unique(event.entities).slice(0, 8),
    place: clean(event.place),
    time: clean(event.time),
  }));

  const validEventIds = new Set(events.map((event) => event.id));
  const fallback = fallbackDirection();

  const payload = {
    prompt: clean(input.prompt),
    subject: clean(input.subject),
    subjectMaterial: input.subjectMaterial ?? {},
    creatorContext: input.domainContext
      ? {
          category: clean(input.domainContext.category),
          businessType: clean(input.domainContext.businessType),
          subjectKind: clean(input.domainContext.subjectKind),
          audience: unique(input.domainContext.audience ?? []).slice(0, 12),
          objective: clean(input.domainContext.objective),
          desiredAction: clean(input.domainContext.desiredAction),
        }
      : null,
    reality: events,
    creativePossibilities: input.movies.slice(0, 8).map(compactMovie),
    lensField: lenses,
  };

  try {
    const result = await localModelGenerate(
      [
        {
          role: "system",
          content: [
            "You are QRE's Artist.",
            "Your primary job is NOT to choose an industry style. Your job is to discover the most specific, memorable organizing idea hidden inside THIS supplied reality.",
            "The architecture is universal. The subject determines the idea.",
            "Scan the whole reality before deciding what matters.",
            "Look for patterns such as priority, hierarchy, contradiction, repetition, cycle, transformation, accumulation, precision, chaos versus order, dependency, ritual, obsession, scarcity, excess, status, competition, identity, hidden complexity, unexpected specificity, recurring failure, recurring success, or tension between two supplied truths.",
            "These are a search space, not a template. Choose the pattern that the evidence actually supports, or invent another grounded organizing idea.",
            "The strongest idea may be extremely simple after discovery.",
            "Examples of the KIND of move we want: a mechanic can become 'Problem. Diagnosis. Precision. Repair. Test.' A storage business can become 'People don't store things. They postpone decisions.' A memorial can become 'the small detail that everybody remembers.' A property can become 'what this place makes possible.' 'Coco has a priority system.' These are examples of creative reasoning, NOT reusable output templates.",
            "Do not force a pet, service, retail, real-estate, memorial, receipt, or industry-specific treatment onto another subject.",
            "The six artistDirection fields are six pressures around ONE discovered idea.",
            "MECHANIC IS THE CENTRAL CREATIVE PREMISE. It is the actual proposition discovered in the evidence, not an instruction for another creative worker.",
            "MECHANIC must be concise enough that the final moving text could say it or reveal it. Prefer 3-12 words. Good shape: 'Coco has a priority system.' 'The small detail everybody remembers.' 'People don't store things. They postpone decisions.' 'The job turns problems into tests.' Bad shape: 'Rank Coco's pleasures.' 'Frame the service around precision.' 'Show how the details unfold.' Those are instructions, not premises.",
            "Do not make the mechanic a command beginning with frame, treat, use, show, open with, start with, lead with, rank, contrast, repeat, compress, juxtapose, invert, build, return, or land.",
            "The mechanic should reveal a relationship among at least TWO supplied facts whenever the reality contains such a relationship.",
            "ATTENTION_STRATEGY must be the same central idea in compact form. The system will treat the mechanic as the authoritative attention value, so keep mechanic and attentionStrategy semantically identical.",
            "HOOK: the strongest entry into the central idea.",
            "OPEN_LOOP: a real unresolved relationship, comparison, question, expectation, or possibility already present in the supplied material.",
            "TENSION: the real contradiction, competing priority, mismatch, or pressure between supplied truths.",
            "SURPRISE: the supplied detail or reversal that changes how earlier material reads.",
            "PAYOFF: the cleanest landing on the detail that most defines the subject.",
            "These fields do NOT require six different events and do NOT require six separate screens.",
            "They should reinforce one central creative thought.",
            "Write concise, specific, slightly opinionated creative treatment language for hook/openLoop/tension/surprise/payoff, but make the mechanic itself a realizable premise rather than an editorial instruction.",
            "Creative verbs such as frame, treat, contrast, rank, repeat, compress, juxtapose, invert, build, return, and land are allowed outside the mechanic.",
            "Do not turn the treatment into a screenplay or camera plan.",
            "Do not write close-ups, shots, camera moves, zooms, pans, footage, SFX, voice-over, filming instructions, or production notes.",
            "Do not invent people, customer behavior, employee behavior, actions, reactions, thoughts, dialogue, motives, outcomes, operations, future events, or physical changes.",
            "Do not turn interpretation into fact with words like deliberately, intentionally, secretly, or obviously.",
            "A sourceEventId is evidence for the creative idea, not permission to invent activity around that event.",
            "Each field must cite 1-4 exact sourceEventIds in sourceEventIds. Never put IDs inside text.",
            "selectedMovieIndex is optional supporting inspiration. It may be null.",
            "selectedLens may be NONE.",
            "Return JSON only.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      "json",
      {
        numPredict: 650,
        temperature: 1.12,
        jsonSchema: schema,
      },
    );

    let parsed: Record<string, unknown> | undefined;
    try {
      parsed = JSON.parse(clean(result.text)) as Record<string, unknown>;
    } catch {
      parsed = undefined;
    }

    const rawMovie = parsed?.selectedMovieIndex;
    const selectedMovieIndex =
      typeof rawMovie === "number"
      && Number.isInteger(rawMovie)
      && rawMovie >= 0
      && rawMovie < input.movies.length
        ? rawMovie
        : undefined;

    const rawDirection =
      parsed?.artistDirection && typeof parsed.artistDirection === "object"
        ? parsed.artistDirection as Record<string, unknown>
        : {};

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
    return {
      selectedLens: "NONE",
      selectedMovieIndex: undefined,
      attentionStrategy: formatAttention(fallback),
      artistDirection: fallback,
      model: "fallback",
      modelCalls: 1,
    };
  }
}
