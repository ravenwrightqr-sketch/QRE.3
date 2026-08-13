import type {
  CognitiveAssumption,
  CognitiveClaim,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitiveExperienceState,
  ExperienceEntities,
  ExperienceHypothesis,
  ExperienceHypothesisKind,
} from "@qre/contracts";

import type {
  ExperienceCompilerContext,
} from "../experience/experienceCompilerContext.js";

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "for",
  "with",
  "about",
  "this",
  "that",
  "into",
  "from",
  "make",
  "create",
  "something",
  "please",
  "experience",
  "story",
  "build",
  "want",
  "need",
  "give",
  "get",
  "tell",
  "show",
  "i",
  "to",
  "my",
  "me",
  "is",
  "are",
  "was",
  "were",
  "be",
  "has",
  "have",
  "had",
  "just",
  "than",
  "then",
  "so",
  "it",
  "its",
  "their",
  "there",
  "someone",
  "another",
]);

const GENERIC_SUBJECTS = new Set([
  "experience",
  "story",
  "something",
  "thing",
  "program",
  "idea",
  "project",
]);

const unique = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const clean = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const lower = (value: string) =>
  clean(value).toLowerCase().replace(/[�]/g, "'");

const tokens = (value: string) =>
  clean(value)
    .split(/[^A-Za-z0-9'�-]+/)
    .filter(Boolean);

const clamp = (value: number) =>
  Math.max(0, Math.min(1, value));

const has = (text: string, pattern: RegExp) =>
  pattern.test(text);

function promptEvidence(
  detail: string,
  confidence = 0.95,
): CognitiveEvidence {
  return {
    source: "prompt",
    detail,
    confidence,
  };
}

function extractEntities(
  prompt: string,
  context: ExperienceCompilerContext,
): ExperienceEntities {
  const text = clean(prompt);
  const lo = lower(text);

  const keywords = unique(
    tokens(text)
      .map((value) => value.toLowerCase())
      .filter(
        (value) =>
          value.length > 2 &&
          !STOP.has(value),
      ),
  );

  const people = unique([
    ...(text.match(
      /\b(?:my|our)\s+([A-Z][A-Za-z'�-]+(?:\s+[A-Z][A-Za-z'�-]+){0,2})/g,
    ) ?? []).map((value) =>
      value.replace(
        /^\b(?:my|our)\s+/i,
        "",
      ),
    ),

    ...(has(lo, /\bmusician\b/)
      ? ["musician"]
      : []),

    ...(has(lo, /\bartist\b/)
      ? ["artist"]
      : []),
  ]);

  return {
    people,

    places: unique([
      ...(context.location?.label
        ? [context.location.label]
        : []),

      ...(context.location?.city
        ? [context.location.city]
        : []),

      ...(context.event?.venue
        ? [context.event.venue]
        : []),

      ...(text.match(
        /\b(?:at|near)\s+([A-Z][A-Za-z'�-]+(?:\s+[A-Z][A-Za-z'�-]+){0,3})/g,
      ) ?? []).map((value) =>
        value.replace(
          /^\b(?:at|near)\s+/i,
          "",
        ),
      ),
    ]),

    organizations: unique(
      lo.match(
        /\b(?:brand|company|business|shop|studio|restaurant|hotel|club|venue|gas station)\b/g,
      ) ?? [],
    ),

    dates: unique(
      text.match(
        /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
      ) ?? [],
    ),

    times: unique(
      text.match(
        /\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi,
      ) ?? [],
    ),

    events: unique(
      lo.match(
        /\b(?:wedding|concert|festival|birthday|party|ceremony|event|show|conference|convention|expo|exposition|rave|nightclub|club|anniversary|memorial|gathering|meetup|fair|tournament|showcase|opening|launch|premiere|parade|carnival|retreat|summit|convention\s+center)\b/g,
      ) ?? [],
    ),

    products: unique(
      lo.match(
        /\b(?:qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|guitar pick|pick|jewelry|artwork|artifact|portal|token|totem|emblem|installation|tattoo)\b/g,
      ) ?? [],
    ),

    urls: unique(
      text.match(
        /https?:\/\/[^\s]+/gi,
      ) ?? [],
    ),

    phones: unique(
      text.match(
        /\+?\d[\d\s().-]{7,}\d/g,
      ) ?? [],
    ),

    media: has(
      lo,
      /\b(?:photo|image|video|film|music|song|voice|recording|qr|nfc|scan)\b/,
    )
      ? ["media"]
      : [],

    emails: unique(
      text.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      ) ?? [],
    ),

    keywords,
  };
}

/**
 * Detect semantic mode/cues before hypothesis generation.
 *
 * This is intentionally prompt-native rather than industry-template-native.
 * The same physical subject can therefore become a memory, discovery,
 * journey, game, utility, identity, ritual, social, commerce, or story
 * experience depending on what the prompt actually says.
 */
function cues(prompt: string) {
  const text = lower(prompt);

  return {
    memory: has(
      text,
      /\b(?:memory|memorial|remember|preserve|forever|legacy|after i'?m gone|history|keepsake|nostalgia|story to keep growing|only thing left)\b/,
    ),

    discovery: has(
      text,
      /\b(?:portal|universe|secret|hidden|mystery|mysterious|discover|explore|reveal|uncover|origin|world)\b/,
    ),

    journey: has(
      text,
      /\b(?:travel|traveled|travels|journey|route|passport|destination|trip|adventure|more than i have)\b/,
    ),

   social: has(
   text,
   /\b(?:shared|share|family|friends?|community|fans?|crowd|guests?|together|everyone|group|social|nightclub|nightclub|club|party|rave|concert|festival|event|venue|audience|customers?|visitors?|patrons?)\b/,
    ),

    game: has(
      text,
      /\b(?:game|challenge|quest|treasure|hunt|race|puzzle|competition|play)\b/,
    ),

    utility: has(
      text,
      /\b(?:teach|how to|guide|directions?|missing|find my|help|book|booking|schedule|information)\b/,
    ),

    identity: has(
      text,
      /\b(?:brand|musician|artist|identity)\b/,
    ),

    ritual: has(
      text,
      /\b(?:wedding|memorial|birthday|anniversary|ceremony|milestone|ritual|celebrate)\b/,
    ),

    commerce: has(
      text,
      /\b(?:loyalty|reward|rewards|purchase|buy|shop|customer|membership|subscribe|booking|upsell|referral|business)\b/,
    ),

    evolution: has(
      text,
      /\b(?:growing|evolving|forever|over time|return|again|future|after|milestone|ten|years?|life|gone)\b/,
    ),

    geographic: has(
      text,
      /\b(?:place|venue|restaurant|bar|shop|hotel|beach|park|location|where|near|travel|journey|route|wave|gas station)\b/,
    ),

    media: has(
      text,
      /\b(?:photo|image|video|film|music|song|voice|recording|guitar|pick|qr|nfc|scan)\b/,
    ),

    urgent: has(
      text,
      /\b(?:missing|lost|urgent|emergency|asap|immediately|find|recover)\b/,
    ),

    creative: has(
      text,
      /\b(?:weird|strange|absurd|surreal|wild|fantastical|impossible|alien|aliens)\b/,
    ),

    fictional: has(
      text,
      /\b(?:alien|aliens|universe|portal|magic|dragon|fictional|fantasy)\b/,
    ),

    rejection: has(
      text,
      /\b(?:don'?t want|do not want|not another|boring|tired of|avoid|without)\b/,
    ),

    transformation: has(
      text,
      /\b(?:turn|transform|make)\b[\s\S]*\b(?:into|feel|become|like)\b/,
    ),

    comparison: has(
      text,
      /\b(?:more than i|less than i|like it has|as if|feel like)\b/,
    ),
  };
}

type CueSet = ReturnType<typeof cues>;

function inferSubject(
  prompt: string,
  entities: ExperienceEntities,
): CognitiveClaim<string> {
  const text = clean(prompt);
  const lo = lower(text);

  const candidates: Array<{
    value: string;
    confidence: number;
    reason: string;
  }> = [];

  const add = (
    value: string | undefined,
    confidence: number,
    reason: string,
  ) => {
    if (!value) return;

    const normalized = clean(value)
      .replace(/^(?:a|an|the|my|our)\s+/i, "")
      .replace(/\s+(?:but|and)\s*$/i, "");

    if (
      !normalized ||
      normalized.length > 80 ||
      GENERIC_SUBJECTS.has(lower(normalized))
    ) {
      return;
    }

    candidates.push({
      value: normalized,
      confidence,
      reason,
    });
  };

  /*
   * ---------------------------------------------------------
   * 1. EXPLICIT EXPERIENCE SUBJECTS
   * ---------------------------------------------------------
   *
   * These must outrank people, places, and incidental nouns.
   *
   * Example:
   *   "Create a memorial for my grandmother"
   *
   * Subject = memorial
   * Person   = grandmother
   *
   * The grandmother is context, not the experience type.
   * ---------------------------------------------------------
   */

  const explicitExperienceSubjectPatterns: Array<{
    pattern: RegExp;
    confidence: number;
    reason: string;
  }> = [
     {
  pattern:
    /\b(?:create|build|design|make)\s+(?:a|an|the|my|our)?\s*(memorial|monument|tribute|keepsake|capsule|archive|journey|game|portal|experience|story|guide|passport|collection)\b/i,
  confidence: 0.995,
  reason: "explicit experience type",
},
    {
  pattern:
/(?<!\binto\s)\b(?:a|an|the)\s+(memorial|monument|tribute|keepsake|capsule|archive|journey|game|portal|experience|story|guide|passport|collection)\b/i,
  confidence: 0.99,
  reason: "explicit experience noun",
},
    {
      pattern:
        /\b(?:memorial|monument|tribute|keepsake|memory capsule|travel capsule|story|journey|portal|game|experience)\s+(?:for|about|of)\b/i,
      confidence: 0.995,
      reason: "explicit relational experience subject",
    },
  ];

  for (const rule of explicitExperienceSubjectPatterns) {
    add(
      text.match(rule.pattern)?.[1],
      rule.confidence,
      rule.reason,
    );
  }

  /*
   * ---------------------------------------------------------
   * 2. TRANSFORMATION LANGUAGE
   * ---------------------------------------------------------
   */

  const transformationSubject = text.match(
  /\b(?:turn|transform)\s+(?:a|an|the|my|our)?\s*(.+?)\s+\b(?:into|as)\b/i,
)?.[1];

add(
  transformationSubject,
  1.0,
  "object being transformed",
);

  /*
   * ---------------------------------------------------------
   * 3. INSTRUCTIONAL / CREATION LANGUAGE
   * ---------------------------------------------------------
   */

  add(
    text.match(
      /\b(?:how\s+to\s+make|teach(?:\s+someone)?\s+how\s+to\s+make)\s+(?:a|an|the)?\s*(.+?)(?:[,.!?]|$)/i,
    )?.[1],
    0.98,
    "thing being taught",
  );

  /*
   * ---------------------------------------------------------
   * 4. POSSESSIVE SUBJECTS
   * ---------------------------------------------------------
   *
   * This is deliberately below explicit experience nouns.
   *
   * "my grandmother" should not beat "memorial".
   * ---------------------------------------------------------
   */

  add(
    text.match(
      /\b(?:my|our)\s+(.+?)(?=\s+(?:just\s+)?(?:turned|is|was|has|have|had|wants?|needs?|keeps?|goes?|went|will|can|could|should|feels?|felt|became?|become|looks?|seems?|sounds?|acts?|and\s+I|and\s+we|after|before)\b|[,.!?]|$)/i,
    )?.[1],
    0.90,
    "possessive subject",
  );

  /*
   * ---------------------------------------------------------
   * 5. OPERATED SUBJECTS
   * ---------------------------------------------------------
   */

  add(
    text.match(
      /\b(?:run|own|manage)\s+(?:a|an|the)?\s*(.+?)(?=\s+(?:but|and|that|which|because|so)\b|[,.!?]|$)/i,
    )?.[1],
    0.94,
    "operated subject",
  );

  /*
   * ---------------------------------------------------------
   * 6. REQUESTED CREATION
   * ---------------------------------------------------------
   */

  add(
    text.match(
      /\b(?:create|build|design)\s+(?:a|an|the)?\s*(.+?)(?=\s+for\s+|\s+in\s+|\s+with\s+|\s+involving\s+|[,.!?]|$)/i,
    )?.[1],
    0.93,
    "requested creation",
  );

  /*
   * ---------------------------------------------------------
   * 7. RELATIONAL SUBJECT
   * ---------------------------------------------------------
   */

  add(
    text.match(
      /\b(?:involving|about|with)\s+(?:a|an|the)?\s*(.+?)(?:[,.!?]|$)/i,
    )?.[1],
    0.84,
    "relational subject",
  );

  add(
    text.match(
      /\b(?:for|about)\s+(?:a|an|the)?\s*(.+?)(?=\s+(?:in|at|on|tonight|today|now|because|that)\b|[,.!?]|$)/i,
    )?.[1],
    0.88,
    "explicit relational subject",
  );

  /*
   * ---------------------------------------------------------
   * 8. SUBJECT OF DESIRED CHANGE
   * ---------------------------------------------------------
   */

  add(
    text.match(
      /\b([A-Za-z][A-Za-z'�-]*(?:\s+[A-Za-z][A-Za-z'�-]*){1,5})\s+(?:wants?|needs?|is looking for|is the only thing)\b/i,
    )?.[1],
    0.90,
    "subject of desired change",
  );

  /*
   * ---------------------------------------------------------
   * 9. SEMANTIC FALLBACK
   * ---------------------------------------------------------
   *
   * People are intentionally LAST.
   *
   * A person can be an entity without being the experience
   * subject.
   * ---------------------------------------------------------
   */

  const semanticFallback =
    entities.products.find(
      (value) =>
        value.length > 2 &&
        value !== "qr",
    ) ??
    entities.events[0] ??
    entities.organizations.find(
      (value) => value !== "business",
    ) ??
    entities.people[0];

  const fallback =
    semanticFallback ??
    (
      tokens(text)
        .filter(
          (value) =>
            !STOP.has(value.toLowerCase()),
        )
        .slice(0, 5)
        .join(" ") ||
      "this experience"
    );

  /*
   * ---------------------------------------------------------
   * 10. SCORE CANDIDATES
   * ---------------------------------------------------------
   */

  const best = candidates.sort((a, b) => {
    const aGeneric = GENERIC_SUBJECTS.has(
      lower(a.value),
    )
      ? 1
      : 0;

    const bGeneric = GENERIC_SUBJECTS.has(
      lower(b.value),
    )
      ? 1
      : 0;

    return (
      b.confidence -
      bGeneric * 0.3 -
      (a.confidence -
        aGeneric * 0.3)
    );
  })[0];

  const value = best?.value ?? fallback;
  const confidence =
    best?.confidence ?? 0.65;

  return {
    value,
    status: best
      ? "observed"
      : "derived",
    confidence,
    evidence: [
      promptEvidence(
        `subject candidate: ${value}${
          best
            ? ` (${best.reason})`
            : " (semantic entity fallback)"
        }`,
        confidence,
      ),
    ],
  };
}

function inferParticipants(
  prompt: string,
  context: ExperienceCompilerContext,
): CognitiveClaim<string[]> {
  const text = lower(prompt);
  const values: string[] = [];

  if (
    /\bmy\s+(?:dog|cat|pet)\b/.test(
      text,
    )
  ) {
    values.push("owner");
  }

  if (
    /\bmusician\b/.test(text)
  ) {
    values.push("musician");
  }

  if (
    /\bartist\b/.test(text)
  ) {
    values.push("artist");
  }

  if (
    /\b(?:family|friends?|community|fans?|customers?|visitors?|guests?|crowd|people|team|group|everyone)\b/.test(
      text,
    )
  ) {
    values.push(
      "shared participants",
    );
  }

  if (
    /\b(?:kids?|children)\b/.test(
      text,
    )
  ) {
    values.push("kids");
  }

  if (
    /\b(?:someone|user|scanner|visitor)\b/.test(
      text,
    )
  ) {
    values.push("scanner");
  }

  values.push(
    ...(context.event?.participants ??
      []),
  );

  const result = unique(values);

  return {
    value: result,
    status: result.length
      ? "observed"
      : "unknown",
    confidence: result.length
      ? 0.82
      : 0,
    evidence: result.length
      ? [
          promptEvidence(
            `participants: ${result.join(", ")}`,
            0.82,
          ),
        ]
      : [],
  };
}

function opportunities(
  prompt: string,
  entities: ExperienceEntities,
) {
  const cue = cues(prompt);

  return {
    memory: unique([
      cue.memory
        ? "preserve meaningful moments and contributions over time"
        : "",

      cue.evolution
        ? "let the experience accumulate history rather than remain static"
        : "",

      entities.people.length
        ? "attach evolving memories to people and relationships"
        : "",
    ]),

    geographic: unique([
      cue.geographic ||
      cue.journey
        ? "connect the experience to meaningful places, routes, or destinations"
        : "",
    ]),

    social: unique([
      cue.social
        ? "allow participants to contribute, react, or return"
        : "",
    ]),

      discovery: unique([
  cue.discovery || cue.creative || cue.game
    ? "progressively reveal meaningful information, media, clues, or relationships"
    : "",

  cue.game
    ? "use clues, hidden layers, discoveries, and unlocks to reward exploration"
    : "",

  entities.keywords.length > 4 && !cue.utility
    ? "surface relationships between people, objects, places, and moments"
    : "",
]),

    temporal: unique([
      cue.evolution ||
      cue.journey
        ? "change behavior across time, repeat participation, or milestones"
        : "",
    ]),

    commercial: unique([
      cue.commerce
        ? "offer commerce, loyalty, access, or retention only when it follows naturally"
        : "",
    ]),
  };
}

const premise: Record<
  ExperienceHypothesisKind,
  (subject: string) => string
> = {
  story: (subject) =>
    `${subject} unfolds as a sequence of meaningful moments`,

  memory: (subject) =>
    `${subject} becomes an evolving memory object`,

  discovery: (subject) =>
    `${subject} becomes a portal into hidden layers and relationships`,

  journey: (subject) =>
    `${subject} becomes a journey whose history accumulates through time and place`,

  social: (subject) =>
    `${subject} becomes a shared participation space`,

  game: (subject) =>
    `${subject} becomes a playful progression with discovery and payoff`,

  utility: (subject) =>
    `${subject} becomes an immediately useful interaction`,

  identity: (subject) =>
    `${subject} becomes an expression of a person, brand, or world`,

  ritual: (subject) =>
    `${subject} becomes a meaningful ritual that can be revisited`,

  commerce: (subject) =>
    `${subject} becomes a commerce or retention layer without replacing the experience`,
};

const rationale: Record<
  ExperienceHypothesisKind,
  string
> = {
  story:
    "A narrative spine gives orientation and payoff without imposing an industry template.",

  memory:
    "Persistent history is appropriate when meaning can accumulate across people, objects, or moments.",

  discovery:
    "Portal, mystery, hidden-layer, and reveal language supports progressive discovery.",

  journey:
    "Travel and progression language supports accumulated place, time, and milestone context.",

  social:
    "Shared participation can create contribution, reaction, and return behavior.",

  game:
    "Challenge and quest language supports progression, feedback, and reward.",

  utility:
    "Instructional, urgent, or practical intent should produce immediate useful value.",

  identity:
    "People, artists, brands, and worlds benefit from experiences that express identity.",

  ritual:
    "Milestones and ceremonies gain meaning when the interaction becomes part of the ritual.",

  commerce:
    "Commercial behavior is useful when it follows an already meaningful interaction.",
};

function dimensions(
  kind: ExperienceHypothesisKind,
  cue: CueSet,
  emotional: string[],
  participants: string[],
): ExperienceHypothesis["dimensions"] {
  const base = {
    subjectFit: 0.82,

    emotionalResonance:
      emotional.length
        ? 0.86
        : 0.55,

    interactionNaturalness: 0.8,

    memoryPotential:
      cue.memory ||
      cue.evolution
        ? 0.9
        : 0.35,

    discoveryPotential:
      cue.discovery ||
      cue.creative
        ? 0.92
        : 0.4,

    socialPotential:
      cue.social
        ? 0.88
        : 0.18,

    temporalPotential:
      cue.evolution ||
      cue.journey
        ? 0.84
        : 0.35,

    commercialPotential:
      cue.commerce
        ? 0.78
        : 0.18,

    novelty:
      cue.discovery ||
      cue.identity ||
      cue.creative
        ? 0.86
        : 0.68,

    feasibility: 0.9,
  };

  const boost: Partial<
    Record<
      ExperienceHypothesisKind,
      Partial<
        ExperienceHypothesis["dimensions"]
      >
    >
  > = {
    story: {
      emotionalResonance:
        cue.creative ||
        cue.fictional
          ? 0.94
          : 0.75,
    },

    memory: {
      memoryPotential: 0.98,
      temporalPotential: 0.92,
    },

    discovery: {
      discoveryPotential: 0.99,
      interactionNaturalness: 0.92,
      novelty: 0.94,
    },

    journey: {
      temporalPotential: 0.97,
    },

    social: {
      socialPotential:
        participants.length ||
        cue.social
          ? 0.96
          : 0.35,
    },

    game: {
      interactionNaturalness: 0.95,
      discoveryPotential: 0.72,
      temporalPotential: 0.76,
    },

    utility: {
      interactionNaturalness: 0.97,
      feasibility: 0.96,
    },

    identity: {
      novelty: 0.96,
      emotionalResonance: 0.82,
    },

    ritual: {
      emotionalResonance: 0.94,
      memoryPotential: 0.82,
    },

    commerce: {
      commercialPotential: 0.97,
      interactionNaturalness: 0.84,
    },
  };

  return {
    ...base,
    ...(boost[kind] ?? {}),
  };
}

function semanticPriority(
  kind: ExperienceHypothesisKind,
  cue: CueSet,
): number {
  if (cue.urgent) {
    return kind === "utility"
      ? 0.55
      : 0;
  }

  if (
    cue.journey ||
    cue.comparison
  ) {
    return kind === "journey"
      ? 0.5
      : 0;
  }

  if (
    cue.transformation &&
    cue.discovery
  ) {
    return kind === "discovery"
      ? 0.5
      : 0;
  }

  if (
    cue.commerce &&
    cue.rejection
  ) {
    return kind === "commerce"
      ? 0.52
      : 0;
  }

  if (
    cue.creative &&
    cue.fictional
  ) {
    return kind === "story"
      ? 0.48
      : 0;
  }

  if (
    cue.memory &&
    !cue.social
  ) {
    return kind === "memory"
      ? 0.42
      : 0;
  }

  if (cue.discovery) {
    return kind === "discovery"
      ? 0.38
      : 0;
  }

  if (cue.game) {
    return kind === "game"
      ? 0.42
      : 0;
  }

  if (cue.ritual) {
    return kind === "ritual" ||
      kind === "memory"
      ? 0.25
      : 0;
  }

  if (
    cue.identity &&
    !cue.discovery
  ) {
    return kind === "identity"
      ? 0.32
      : 0;
  }

  return 0;
}

function score(
  kind: ExperienceHypothesisKind,
  d: ExperienceHypothesis["dimensions"],
  cue: CueSet,
): number {
  const weighted =
    d.subjectFit * 0.16 +
    d.emotionalResonance * 0.11 +
    d.interactionNaturalness * 0.13 +
    d.memoryPotential * 0.11 +
    d.discoveryPotential * 0.13 +
    d.socialPotential * 0.08 +
    d.temporalPotential * 0.08 +
    d.commercialPotential * 0.04 +
    d.novelty * 0.08 +
    d.feasibility * 0.08;

  const genericBoost: Record<
    ExperienceHypothesisKind,
    number
  > = {
    memory: cue.memory
      ? 0.12
      : 0,

    discovery: cue.discovery
      ? 0.15
      : 0,

    journey: cue.journey
      ? 0.14
      : 0,

    social: cue.social
      ? 0.12
      : 0,

    game: cue.game
      ? 0.15
      : 0,

    utility: cue.utility
      ? 0.16
      : 0,

    identity: cue.identity
      ? 0.12
      : 0,

    ritual: cue.ritual
      ? 0.12
      : 0,

    commerce: cue.commerce
      ? 0.14
      : 0,

    story:
      cue.creative ||
      cue.fictional
        ? 0.12
        : 0.03,
  };

  return clamp(
    weighted +
      genericBoost[kind] +
      semanticPriority(
        kind,
        cue,
      ),
  );
}

function makeHypotheses(
  subject: CognitiveClaim<string>,
  prompt: string,
  emotional: string[],
  participants: CognitiveClaim<string[]>,
): ExperienceHypothesis[] {
  const cue = cues(prompt);

  const evidence = [
    promptEvidence(
      `central subject: ${subject.value}`,
      subject.confidence,
    ),
  ];

  const kinds: ExperienceHypothesisKind[] = [
    "story",
    "memory",
    "discovery",
    "journey",
    "social",
    "game",
    "utility",
    "identity",
    "ritual",
    "commerce",
  ];

  return kinds
    .map((kind) => {
      const d = dimensions(
        kind,
        cue,
        emotional,
        participants.value,
      );

      const value = score(
        kind,
        d,
        cue,
      );

      return {
        id: `${kind}-${Math.round(
          value * 100,
        )}`,
        kind,
        premise:
          premise[kind](
            subject.value,
          ),
        rationale:
          rationale[kind],
        evidence,
        dimensions: d,
        score: value,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score,
    );
}

function buildPlan(
  subject: CognitiveClaim<string>,
  participants: CognitiveClaim<string[]>,
  selected: ExperienceHypothesis,
  prompt: string,
  emotional: string[],
  opportunity: ReturnType<typeof opportunities>,
): CognitiveExperiencePlan {
  const cue = cues(prompt);

  const audience =
    participants.value.length
      ? participants.value
      : ["individual scanner"];

  const plan: CognitiveExperiencePlan = {
    centralSubject:
      subject.value,

    audience,

    whyInteract: [],
    emotionalIntent:
      unique(emotional),
    purpose: "",

    interactionModel: [],
    storyStructure: [],

    memoryModel: [],
    geographicModel: [],
    socialModel: [],
    discoveryModel: [],

    rewardModel: [],
    commerceModel: [],
    progressionModel: [],

    contentModel: [],
    dynamicBehavior: [],
    futureEvolution: [],
    creativePossibilities: [],
  };

  switch (selected.kind) {
    case "memory":
      plan.whyInteract.push(
        "add, revisit, or reveal meaningful history",
      );

      plan.interactionModel.push(
        "scan ? enter living memory ? contribute or revisit",
      );

      plan.storyStructure.push(
        "origin ? meaningful moments ? present state ? continuation",
      );

      plan.memoryModel.push(
        "memories, media, milestones, relationships, and provenance",
      );

      plan.progressionModel.push(
        "the experience becomes richer as trusted history accumulates",
      );

      plan.futureEvolution.push(
        "new memories can change what later visitors discover",
      );
      break;

    case "discovery":
      plan.whyInteract.push(
        "reveal a layer that is invisible from the physical subject alone",
      );

      plan.interactionModel.push(
        "scan ? threshold ? reveal ? deeper layer ? payoff",
      );

      plan.storyStructure.push(
        "threshold ? reveal ? deeper layer ? payoff ? invitation",
      );

      plan.discoveryModel.push(
        "hidden media, relationships, origin, context, and next clues",
      );

      plan.progressionModel.push(
        "repeat interactions can reveal deeper layers",
      );

      plan.contentModel.push(
        "voice, media, lore, places, references, and contextual fragments",
      );

      plan.futureEvolution.push(
        "new work, events, places, or artifacts can add new layers",
      );
      break;

    case "journey":
      plan.whyInteract.push(
        "see where the subject has been and what each place means",
      );

      plan.interactionModel.push(
        "scan ? open accumulated journey ? explore chapter",
      );

      plan.storyStructure.push(
        "departure ? places ? encounters ? accumulation ? next destination",
      );

      plan.geographicModel.push(
        "meaningful locations, routes, destinations, and place memories",
      );

      plan.progressionModel.push(
        "each place or milestone becomes another chapter",
      );

      plan.contentModel.push(
        "maps, timestamps, media, milestones, and route context",
      );

      plan.futureEvolution.push(
        "the journey continues as new places and moments are added",
      );
      break;

     case "game":
  plan.whyInteract.push(
    "solve, explore, or complete something instead of simply reading",
  );

  plan.interactionModel.push(
    "scan ? action ? feedback ? unlock ? next step",
  );

  plan.storyStructure.push(
    "hook ? challenge ? discovery ? escalation ? payoff",
  );

  plan.progressionModel.push(
    "milestones, clues, challenges, unlocks, and meaningful rewards",
  );

  plan.rewardModel.push(
    "reward access, discovery, status, or artifacts rather than arbitrary points",
  );

  plan.discoveryModel.push(
    "clues, hidden layers, discoveries, unlocks, and progressively revealed information",
  );

  plan.dynamicBehavior.push(
    "adapt challenges, clues, and available paths as progress accumulates",
  );

  plan.futureEvolution.push(
    "new challenges, discoveries, rewards, and chapters can be added as the experience evolves",
  );
  break;

    case "utility":
      plan.whyInteract.push(
        cue.urgent
          ? "help solve the immediate problem as quickly as possible"
          : "get useful value immediately",
      );

      plan.interactionModel.push(
        "scan ? understand need ? shortest useful action",
      );

      plan.storyStructure.push(
        "need ? answer ? action",
      );

      plan.contentModel.push(
        "instructions, status, options, directions, links, or next actions",
      );
      break;

    case "identity":
      plan.whyInteract.push(
        "enter the world behind the physical subject",
      );

      plan.interactionModel.push(
        "scan ? artifact identity ? creator/world identity",
      );

      plan.storyStructure.push(
        "artifact ? creator ? world ? signature ? return",
      );

      plan.discoveryModel.push(
        "creator, aesthetic, history, origin, and surrounding universe",
      );

      plan.contentModel.push(
        "voice, origin, catalog, performances, and behind-the-scenes material",
      );
      break;

    case "ritual":
      plan.whyInteract.push(
        "mark, revisit, or deepen the meaning of a significant moment",
      );

      plan.interactionModel.push(
        "scan as part of the ritual, ceremony, or remembrance",
      );

      plan.storyStructure.push(
        "arrival ? meaning ? shared moment ? keepsake ? continuation",
      );

      plan.memoryModel.push(
        "preserve contributions with provenance and respectful access",
      );
      break;
      case "commerce":
  plan.whyInteract.push(
    cue.rejection
      ? "replace a boring transaction with meaningful reasons to return"
      : "receive useful access or value after the experience earns attention",
  );

  plan.interactionModel.push(
    cue.rejection
      ? "discover ? participate ? build identity ? unlock meaningful access ? return"
      : "experience first ? relevant offer/access second ? meaningful return",
  );

  plan.storyStructure.push(
    cue.rejection
      ? "arrival ? discovery ? participation ? earned access ? return"
      : "need ? experience ? value ? access ? return",
  );

  plan.commerceModel.push(
    "loyalty, booking, membership, referral, reward, or exclusive access only when natural",
  );

  plan.rewardModel.push(
    cue.rejection
      ? "reward meaningful participation, identity, progress, or contribution rather than arbitrary points"
      : "reward meaningful participation, identity, progress, or return behavior rather than arbitrary points",
  );

  plan.progressionModel.push(
    cue.rejection
      ? "customer history becomes an evolving relationship, reputation, and access layer instead of a points counter"
      : "customer history becomes a relationship and access layer instead of a points counter",
  );

  plan.futureEvolution.push(
    cue.rejection
      ? "the experience can evolve through new work, events, customer milestones, preferences, and earned access"
      : "new offers, services, milestones, and customer history can expand the experience over time",
  );

  break;

    case "social":
      plan.whyInteract.push(
        "see what others contributed and add something of your own",
      );

      plan.interactionModel.push(
        "scan ? witness ? contribute ? affect shared state",
      );

      plan.storyStructure.push(
        "arrival ? shared context ? contribution ? collective payoff ? return",
      );

      plan.socialModel.push(
        "contributions accumulate into a shared experience",
      );

      plan.memoryModel.push(
        "remember contributions and relationships with provenance",
      );
      break;

      case "story":
default:
  plan.whyInteract.push(
    cue.creative
      ? "enter an invented world and discover what happens"
      : "discover why this subject matters",
  );

  plan.interactionModel.push(
    "scan ? orientation ? reveal ? payoff ? continuation",
  );

  plan.storyStructure.push(
    cue.creative
      ? "premise ? strange encounter ? escalation ? reveal ? continuation"
      : "orientation ? hook ? development ? payoff ? continuation",
  );

  plan.contentModel.push(
    "subject-specific narrative, media, context, and next action",
  );

  plan.futureEvolution.push(
    cue.creative
      ? "the invented world can expand through new characters, places, events, discoveries, and consequences"
      : "the experience can deepen through new moments, context, and meaningful returns",
  );

  if (cue.creative) {
    plan.dynamicBehavior.push(
      "adapt the world and narrative based on discovered context and prior interactions",
    );
  }
  break;
  }

  plan.memoryModel.push(
    ...opportunity.memory,
  );

  plan.geographicModel.push(
    ...opportunity.geographic,
  );

  plan.socialModel.push(
    ...opportunity.social,
  );

  plan.discoveryModel.push(
    ...opportunity.discovery,
  );

  plan.commerceModel.push(
    ...opportunity.commercial,
  );

  if (
    cue.evolution ||
    selected.kind === "memory" ||
    selected.kind === "journey"
  ) {
    plan.dynamicBehavior.push(
      "adapt to accumulated history and milestones",
    );
  }
   if (
  cue.social &&
  (
    selected.kind === "social" ||
    selected.kind === "discovery" ||
    selected.kind === "story" ||
    selected.kind === "identity"
  )
) {
  plan.futureEvolution.push(
    "the experience can evolve as new events, people, performances, and contributions accumulate",
  );

  plan.dynamicBehavior.push(
    "adapt the experience as the social environment and participation change",
  );
}
  if (selected.kind === "utility") {
  plan.futureEvolution.push(
    "the experience can evolve through improved guidance, learner progress, new knowledge, and accumulated outcomes",
  );

  plan.dynamicBehavior.push(
    "adapt guidance based on available context, progress, and accumulated learning",
  );
}
  if (
    cue.media ||
    selected.kind === "discovery" ||
    selected.kind === "identity"
  ) {
    plan.dynamicBehavior.push(
      "surface different content as new media or context becomes available",
    );
  }

  if (
    cue.geographic ||
    selected.kind === "journey"
  ) {
    plan.dynamicBehavior.push(
      "adapt when meaningful location context is available",
    );
  }

  if (
    cue.social ||
    selected.kind === "social"
  ) {
    plan.dynamicBehavior.push(
      "change with participation while protecting private state",
    );
  }

  if (cue.commerce) {
    plan.dynamicBehavior.push(
      "gate commercial behavior behind relevant experience state",
    );
  }

  if (
    !plan.dynamicBehavior.length
  ) {
    plan.dynamicBehavior.push(
      "remain useful on the first interaction and become richer when future context exists",
    );
  }

  const text = lower(prompt);

  if (
    has(
      text,
      /guitar\s+pick|pick/,
    ) &&
    selected.kind === "discovery"
  ) {
    plan.creativePossibilities.push(
      "the physical pick can behave like a portal key into the musician's universe",
    );

    plan.creativePossibilities.push(
      "the reveal can connect the pick to a song, performance, venue, or moment in the artist's history",
    );
  }

  if (
    has(
      text,
      /\b(?:dog|pet)\b/,
    )
  ) {
    plan.creativePossibilities.push(
      "the subject can become a living memory profile whose story grows through trusted contributions",
    );
  }

  if (
    has(
      text,
      /\bsurfboard\b/,
    )
  ) {
    plan.creativePossibilities.push(
      "the object can become a travel passport for waves, places, and encounters",
    );
  }

  if (
    has(
      text,
      /\btattoo\s+shop|loyalty\b/,
    )
  ) {
    plan.creativePossibilities.push(
      "replace points with a living studio identity, chapters, access, and meaningful return rewards",
    );
  }

  if (
    has(
      text,
      /\btruck|vehicle\b/,
    )
  ) {
    plan.creativePossibilities.push(
      "the physical object can become a durable memorial to the people, places, and stories attached to it",
    );
  }

  if (
    has(
      text,
      /\brave|nightclub|club\b/,
    )
  ) {
    plan.creativePossibilities.push(
      "the scan can behave like a threshold into the event rather than a static information page",
    );
  }

  if (
    cue.creative &&
    cue.fictional
  ) {
    plan.creativePossibilities.push(
      "let the strange entities define an invented world instead of forcing the prompt into a business or memory template",
    );
  }

  if (
    !plan.creativePossibilities.length
  ) {
    plan.creativePossibilities.push(
      "make the physical subject feel more alive, contextual, and meaningful than it does before the interaction",
    );
  }

  plan.purpose =
    selected.kind === "utility"
      ? "deliver immediate useful value"
      : `make ${subject.value} matter through ${selected.kind}`;

  const planRecord =
    plan as unknown as Record<
      string,
      unknown
    >;

  for (
    const key of Object.keys(plan)
  ) {
    const value =
      planRecord[key];

    if (
      Array.isArray(value)
    ) {
      planRecord[key] =
        unique(
          value.filter(
            (
              item,
            ): item is string =>
              typeof item ===
              "string",
          ),
        );
    }
  }

  return plan;
}

export function understandExperience(
  prompt: string,
  context: ExperienceCompilerContext = {},
): CognitiveExperienceState {
  const text = clean(prompt);

  if (!text) {
    throw new Error(
      "Experience prompt required.",
    );
  }

  const entities =
    extractEntities(
      text,
      context,
    );

  const subject =
    inferSubject(
      text,
      entities,
    );

  const participants =
    inferParticipants(
      text,
      context,
    );

  const cue = cues(text);

  const emotionalIntent =
    unique([
      has(
        text,
        /\b(?:love|romantic|beloved|affection|care|wedding|family)\b/,
      )
        ? "connection"
        : "",

      has(
        text,
        /\b(?:memory|memorial|nostalgia|remember|legacy|forever|preserve|only thing left)\b/,
      )
        ? "remembrance"
        : "",

      has(
        text,
        /\b(?:secret|mystery|hidden|discover|portal|universe|explore)\b/,
      )
        ? "curiosity"
        : "",

      has(
        text,
        /\b(?:fun|playful|rave|party|game|quest|challenge|weird|surreal)\b/,
      )
        ? "play"
        : "",

      has(
        text,
        /\b(?:scary|dark|danger|urgent|missing|lost)\b/,
      )
        ? "urgency"
        : "",

      has(
        text,
        /\b(?:proud|achievement|victory|milestone)\b/,
      )
        ? "pride"
        : "",

      has(
        text,
        /\b(?:after i'?m gone|life|legacy|only thing left)\b/,
      )
        ? "continuity"
        : "",
    ]);

  const affordances =
    unique([
      cue.discovery
        ? "reveal"
        : "",

      cue.game
        ? "progression"
        : "",

      cue.memory ||
      cue.evolution
        ? "continuity"
        : "",

      cue.journey
        ? "journey"
        : "",

      cue.social
        ? "participation"
        : "",

      cue.commerce
        ? "commerce"
        : "",

      cue.geographic
        ? "environment"
        : "",

      cue.urgent
        ? "action"
        : "",

      cue.transformation
        ? "transformation"
        : "",

      "interaction",
    ]);

  const opportunity =
    opportunities(
      text,
      entities,
    );

  const hypotheses =
    makeHypotheses(
      subject,
      text,
      emotionalIntent,
      participants,
    );

  const selectedHypothesis =
    hypotheses[0];

  if (!selectedHypothesis) {
    throw new Error(
      "Unable to derive an experience hypothesis.",
    );
  }

  const motivations =
    unique([
      selectedHypothesis.kind ===
      "utility"
        ? "solve the immediate need"
        : "understand the subject",

      ...emotionalIntent.map(
        (value) =>
          `feel ${value}`,
      ),

      selectedHypothesis.kind ===
      "discovery"
        ? "discover something meaningful"
        : "",

      selectedHypothesis.kind ===
      "memory"
        ? "preserve something worth keeping"
        : "",

      selectedHypothesis.kind ===
      "journey"
        ? "see how the subject accumulates a history"
        : "",

      selectedHypothesis.kind ===
      "commerce"
        ? "create a reason for meaningful return"
        : "",

      selectedHypothesis.kind ===
        "story" &&
      cue.creative
        ? "experience an invented world"
        : "",
    ]);

  const assumptions:
    CognitiveAssumption[] = [];

  if (
    !participants.value.length
  ) {
    assumptions.push({
      statement:
        "The first version can be experienced by an individual scanner.",
      reason:
        "No specific participant group was confirmed.",
      confidence: 0.7,
    });
  }

  if (
    !context.location &&
    !cue.geographic
  ) {
    assumptions.push({
      statement:
        "Geographic behavior is optional until meaningful location evidence exists.",
      reason:
        "The prompt does not establish a place dependency.",
      confidence: 0.82,
    });
  }

  if (
    !context.memories?.length &&
    (cue.memory ||
      cue.evolution)
  ) {
    assumptions.push({
      statement:
        "The first interaction may begin with an empty or sparse memory layer.",
      reason:
        "The prompt implies persistence but supplies no historical records.",
      confidence: 0.86,
    });
  }

  const plan =
    buildPlan(
      subject,
      participants,
      selectedHypothesis,
      text,
      emotionalIntent,
      opportunity,
    );

  return {
    prompt: text,

    subject,

    participants,

    motivations: {
      value: motivations,
      status: "derived",
      confidence: 0.82,
      evidence: [
        promptEvidence(
          "motivations inferred from explicit intent, semantic cues, and selected hypothesis",
          0.82,
        ),
      ],
    },

    entities,

    affordances,

    emotionalIntent,

    memoryOpportunities:
      opportunity.memory,

    geographicOpportunities:
      opportunity.geographic,

    socialOpportunities:
      opportunity.social,

    discoveryOpportunities:
      opportunity.discovery,

    temporalOpportunities:
      opportunity.temporal,

    commercialOpportunities:
      opportunity.commercial,

    hypotheses,

    selectedHypothesis,

    plan,

    assumptions,
  };
}
