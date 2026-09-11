import type { AuthorDomainContext, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import type { CreativeLensCandidate } from "./authorCreativeLens.js";
import { localModelGenerate, type LocalModelJsonSchema } from "./localModelRuntime.js";

export type AuthorArtistChoice = {
  selectedLens: string;
  selectedMovieIndex?: number;
  attentionStrategy: string;
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
  required: ["selectedLens", "selectedMovieIndex", "attentionStrategy"],
  properties: {
    selectedLens: { type: "string", minLength: 1, maxLength: 80 },
    selectedMovieIndex: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
    attentionStrategy: { type: "string", minLength: 1, maxLength: 600 },
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
    lenses.push({
      index: lenses.length,
      lens: "NONE",
      family: "none",
      score: .5,
      reason: "Keep the supplied material unframed when that is genuinely stronger.",
      supportedSignals: [],
    });
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
            "QRE is the distribution itself: the sequence must be worth remembering, talking about, and wanting for yourself.",
            "Your job is not merely to pick a style. Design the attention mechanic that makes a person want the next screen and remember the whole sequence.",
            "Silently decide four things before you return: the character or identity hook, the game/mechanic that gives the sequence behavior, the tension/change that moves attention, and the surprise/payoff that makes the ending land.",
            "These are creative pressures, not a fixed four-beat template. The finished sequence may use more, fewer, or different beats.",
            "Prefer character + game + tension + surprise + payoff over noun + metaphor + noun + metaphor.",
            "Look for a subject-specific system, rule, habit, priority, obsession, contradiction, status ladder, secret, mission, challenge, rivalry, countdown, investigation, reveal, recurring joke, or mock authority when the supplied reality supports it.",
            "The strongest system is DISCOVERED, not fabricated. Derive it from at least two supplied facts that interact or repeat. Name the relationship between the facts; do not add new facts to make the relationship work.",
            "A useful mechanic should make the supplied facts interact. It should help a watcher connect the dots rather than merely receive facts one at a time.",
            "IMPORTANT REALITY BOUNDARY: framing may be invented; concrete subject behavior, people, places, objects, actions, outcomes, routines, physical changes, and business operations may not be invented.",
            "Do not invent a new person, employee, customer, animal, object, sign, rule, rotation, ranking, transaction, event, or physical behavior. Do not invent a future event and pretend it is already part of the supplied reality.",
            "Do not make the mechanic depend on a fictional action that the source does not establish. The creative device must be a lens over the supplied material, not a replacement reality.",
            "For example, 'Coco has a system' can organize supplied facts such as walks, grass, small dogs, apples, and bacon. A fictional 'Bea' crew chief, a new shelf rotation, or a new customer behavior would violate the reality boundary unless supplied.",
            "Creative devices such as points, missions, ranks, investigations, mock rules, labels, meters, or recurring jokes are allowed only as clearly interpretive framing over existing facts. Keep their inputs anchored to supplied facts.",
            "Do not assume a visual implementation that changes the world. A meter or points label is framing; claiming the real shelf physically rotates is a new fact.",
            "Use the supplied subject name and supplied nouns. Generic framing nouns such as system, rules, mission, points, score, investigation, witness, or priority are allowed when they are clearly interpretive rather than factual claims.",
            "Choose mechanisms that create forward pull: one screen creates curiosity about the next, later material changes the read of earlier material, and the ending pays something back.",
            "Prefer playful, mischievous, specific, characterful treatments. A line such as 'Coco has a system.' is stronger than generic poetic atmosphere when the reality supports it.",
            "Use metaphor, personification, irony, absurdity, and poetic compression only when they sharpen the character or mechanic. Do not substitute decorative metaphor for creative structure.",
            "Avoid abstract metaphor chains, generic cinematic language, unexplained surreal substitutions, and tech cosplay such as turning ordinary facts into code, debug, checksum, protocol, or similar imagery without a strong reason.",
            "Persistent identity, traits, preferences, routines, goals, relationships, and memories are not chronological events.",
            "NONE is a real option, but do not choose NONE merely because it is safe. Choose it only when no added framing improves the supplied reality.",
            "Choose the strongest Movie possibility only as creative material; you may reject every Movie.",
            "attentionStrategy must be a compact creative brief, not analysis. Format it as: MECHANIC=... | HOOK=... | OPEN_LOOP=... | TENSION=... | SURPRISE=... | PAYOFF=...",
            "Every field must stay grounded in the supplied reality. A creative field may describe a framing device, but it must not introduce an unsupplied concrete fact.",
            "Return JSON only with selectedLens, selectedMovieIndex, and attentionStrategy.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      "json",
      { numPredict: 420, temperature: 1.08, jsonSchema: schema },
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
    const attentionStrategy = clean(parsed?.attentionStrategy) ||
      "MECHANIC=character system | HOOK=specific identity | OPEN_LOOP=discover the subject's rule | TENSION=raise the priority | SURPRISE=change the read | PAYOFF=land the subject's defining priority";

    return { selectedLens, selectedMovieIndex, attentionStrategy, model: result.model, modelCalls: 1 };
  } catch {
    return {
      selectedLens: "NONE",
      selectedMovieIndex: undefined,
      attentionStrategy: "MECHANIC=character system | HOOK=specific identity | OPEN_LOOP=discover the subject's rule | TENSION=raise the priority | SURPRISE=change the read | PAYOFF=land the subject's defining priority",
      model: "fallback",
      modelCalls: 1,
    };
  }
}
