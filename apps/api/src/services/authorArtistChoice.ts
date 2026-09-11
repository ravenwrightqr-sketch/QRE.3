import type { AuthorDomainContext, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import type { CreativeLensCandidate } from "./authorCreativeLens.js";
import { localModelGenerate, type LocalModelJsonSchema } from "./localModelRuntime.js";

export type AuthorArtistChoice = {
  selectedLens: string;
  selectedMovieIndex?: number;
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

const schema: LocalModelJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["selectedLens", "selectedMovieIndex"],
  properties: {
    selectedLens: { type: "string", minLength: 1, maxLength: 80 },
    selectedMovieIndex: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
  },
};

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
    lenses.push({ index: lenses.length, lens: "NONE", family: "none", score: .5, reason: "Keep the supplied material unframed when that is stronger.", supportedSignals: [] });
  }

  const events = input.graph.events.slice(0, 18).map((event) => ({
    id: event.id,
    label: clean(event.label),
    place: clean(event.place),
    time: clean(event.time),
  }));

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
            "Choose the lens yourself from the supplied lens field, including NONE.",
            "You may choose a compound lens such as 'spy + deadpan' only when both supplied lenses genuinely fit.",
            "You may also write a concise new framing when none of the supplied lenses is right.",
            "Choose the strongest Movie possibility only as creative material; you may reject every Movie.",
            "Do not invent concrete reality. A lens changes perception, not facts.",
            "Persistent identity, traits, preferences, routines, goals, relationships, and memories are not chronological events.",
            "Prefer the smallest creative decision that gives the supplied reality a distinctive voice.",
            "For sparse identity-only material, it is valid to choose NONE and make a character introduction rather than forcing plot.",
            "Return JSON only with selectedLens and selectedMovieIndex.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      "json",
      { numPredict: 256, temperature: 1.0, jsonSchema: schema },
    );

    const parsed = (() => {
      try {
        return JSON.parse(clean(result.text)) as Record<string, unknown>;
      } catch {
        return undefined;
      }
    })();

    const selectedLens = clean(parsed?.selectedLens) || "NONE";
    const rawMovie = parsed?.selectedMovieIndex;
    const selectedMovieIndex = typeof rawMovie === "number" && Number.isInteger(rawMovie) && rawMovie >= 0 && rawMovie < input.movies.length
      ? rawMovie
      : undefined;

    return { selectedLens, selectedMovieIndex, model: result.model, modelCalls: 1 };
  } catch {
    return { selectedLens: "NONE", selectedMovieIndex: undefined, model: "fallback", modelCalls: 1 };
  }
}
