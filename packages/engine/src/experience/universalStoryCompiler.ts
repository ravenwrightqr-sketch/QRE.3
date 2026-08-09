import type {
  CognitiveExperiencePlan,
  ExperienceEntities,
  ExperienceGenome,
  ExperienceMeaning,
  ExperienceTone,
  ExperienceBlueprint,
  ExperienceMoment,
  Moment,
  CinematicScene,
  ExperienceModel,
  FlowStep,
  ExperienceStory,
  StoryBeat,
  StoryBeatKind,
  StoryProvenance,
  StoryScenePlan,
  SemanticInterpretation,
} from "@qre/contracts";

/**
 * ============================================================
 * QRE UNIVERSAL STORY COMPILER — ARCHITECTURE LOCK
 * ============================================================
 *
 * PURPOSE:
 * Domain-neutral compilation substrate. It converts observed semantic
 * material into story, blueprint, flow, moments, and cinematic scenes.
 *
 * CANONICAL PIPELINE:
 *
 * PROMPT
 *   → COGNITIVE UNDERSTANDING
 *   → EVIDENCE
 *   → MEANING
 *   → HYPOTHESES
 *   → OPPORTUNITY SPACE
 *   → SELECTED EXPERIENCE DIRECTION
 *   → COGNITIVE PLAN
 *   → UNIVERSAL COMPILATION
 *   → BLUEPRINT
 *   → FLOW
 *   → MOMENTS
 *   → CINEMATIC SCENES
 *
 * ARCHITECTURE RULE:
 * THE COMPILER BECOMES SMARTER.
 * IT DOES NOT INVENT ANOTHER ARCHITECTURE.
 *
 * COGNITIVE RULE:
 * This compiler is the substrate, not the brain.
 *
 * When a cognitive plan is supplied:
 *   - centralSubject outranks heuristic subject extraction.
 *   - direction determines realization strategy.
 *   - storyStructure determines beat architecture.
 *   - interactionModel determines experiential motion.
 *   - plan semantics determine language.
 *
 * When no plan is supplied:
 *   - the substrate remains independently usable.
 *
 * NO-TEMPLATE RULE:
 * Candidate shapes are generic narrative operations.
 * Domain meaning comes from evidence and the cognitive plan.
 *
 * CONTRACT RULE:
 * Shared semantic/runtime shapes come only from @qre/contracts.
 *
 * ============================================================
 */

export type StoryCompilerMemory = {
  summary: string;
  entities?: string[];
  timestamp?: string;
};

export type StoryCompilerContext = {
  memories?: StoryCompilerMemory[];
  event?: {
    name?: string;
    venue?: string;
    participants?: string[];
    atmosphere?: string;
    timestamp?: string;
  };
  location?: {
    label?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  cognitivePlan?: CognitiveExperiencePlan;
};

export type StorySignal = {
  value: string;
  source: "prompt" | "context" | "memory" | "event" | "location";
  confidence: number;
  salience: number;
};

export type StorySituation = {
  subject: string;
  actors: string[];
  activity: string;
  setting: string[];
  temporal: string[];
  social: "solo" | "shared" | "unknown";
  purpose: string;
  change: string;
  tension: string;
  signals: StorySignal[];
};

type Candidate = {
  id: string;
  beats: StoryBeatKind[];
  score: number;
  rationale: string;
  evidence: StoryProvenance[];
};

type NarrativeOperation =
  | "orientation"
  | "hook"
  | "need"
  | "threshold"
  | "origin"
  | "encounter"
  | "challenge"
  | "discovery"
  | "reveal"
  | "instruction"
  | "action"
  | "feedback"
  | "contribution"
  | "escalation"
  | "transformation"
  | "reflection"
  | "provenance"
  | "identity"
  | "milestone"
  | "unlock"
  | "payoff"
  | "earned_access"
  | "next_step"
  | "continuation";

export type ExperienceObservation = {
  prompt: string;
  subject: string;
  activity: string;
  context: string[];
  entities: ExperienceEntities;
  explicitEmotions: string[];
  audience: string[];
  temporal: string[];
  affordances: string[];
  evidence: StoryProvenance[];
};

export type CompiledStoryExperience = {
  observation: ExperienceObservation;
  situation: StorySituation;
  candidates: Candidate[];
  genome: ExperienceGenome;
  story: ExperienceStory;
  blueprint: ExperienceBlueprint;
  flowSteps: FlowStep[];
  moments: Moment[];
  cinematicScenes: CinematicScene[];
  scenePlan: StoryScenePlan[];
  model: ExperienceModel;
  title: string;
  estimatedDuration: number;
  momentCount: number;
};

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
  "my",
  "me",
  "to",
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
]);

const ACTIONS: Array<[RegExp, string]> = [
  [/\b(teach|teaching|learn|learning|lesson|guide|practice)\b/i, "learning"],
  [/\b(play|playing|game|challenge|quest|race|compete)\b/i, "play"],
  [/\b(discover|explore|find|hidden|secret|mystery|uncover|reveal)\b/i, "discovery"],
  [/\b(travel|traveling|trip|journey|visit|visiting)\b/i, "movement"],
  [/\b(meet|meeting|connect|connecting|reconnect|share)\b/i, "connection"],
  [/\b(buy|buying|sell|selling|shop|shopping|purchase|product|loyalty|reward)\b/i, "commerce"],
  [/\b(celebrate|celebrating|celebration|wedding|birthday|anniversary)\b/i, "celebration"],
  [/\b(build|building|make|making|create|creating|design|designing|craft)\b/i, "creation"],
  [/\b(fix|repair|restore|restoring|solve|solving|missing|lost)\b/i, "resolution"],
];

const CONTEXT: Array<[string, RegExp]> = [
  [
    "event",
    /\b(event|party|festival|concert|wedding|birthday|crowd|guests?|ceremony|conference|rave|nightclub)\b/i,
  ],
  [
    "place",
    /\b(venue|restaurant|bar|shop|store|home|park|beach|hotel|salon|museum|stadium|school|office|studio|gas station)\b/i,
  ],
  [
    "memory",
    /\b(memory|memorial|remember|past|history|childhood|legacy|forever|nostalgia|keepsake|milestone|preserve)\b/i,
  ],
  [
    "media",
    /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan|guitar|pick)\b/i,
  ],
  [
    "work",
    /\b(project|meeting|business|office|client|customer|brand|product|team|launch|shop)\b/i,
  ],
  [
    "relationship",
    /\b(friend|friends|family|partner|couple|daughter|son|mom|mother|dad|father|brother|sister|community)\b/i,
  ],
];

const EMOTIONS: Array<[RegExp, string]> = [
  [/\b(fun|funny|playful|joy|happy|delight|laugh|laughter)\b/i, "joy"],
  [/\b(love|romantic|beloved|affection|care)\b/i, "love"],
  [/\b(excited|excitement|hype|thrill|energy|electric)\b/i, "excitement"],
  [/\b(calm|peaceful|quiet|gentle|serene)\b/i, "calm"],
  [/\b(nostalgia|nostalgic|sentimental|remember)\b/i, "nostalgia"],
  [/\b(mystery|mysterious|secret|hidden|unknown|curious|curiosity)\b/i, "curiosity"],
  [/\b(scary|dark|creepy|danger|intense|urgent)\b/i, "intensity"],
  [/\b(proud|pride|accomplished|achievement|victory)\b/i, "pride"],
];

const unique = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

const lower = (value: string) => clean(value).toLowerCase();

const tokens = (value: string) =>
  clean(value)
    .split(/[^A-Za-z0-9'’-]+/)
    .filter(Boolean);

const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The Moment";

function entities(
  prompt: string,
  context: StoryCompilerContext,
): ExperienceEntities {
  const text = clean(prompt);
  const lo = lower(text);

  const people = unique(
    (
      text.match(
        /\b(?:my|our|with|from|by)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})/g,
      ) ?? []
    ).map((value) =>
      value.replace(/^\b(?:my|our|with|from|by)\s+/i, ""),
    ),
  );

  const dates = unique(
    text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) ?? [],
  );

  const times = unique(
    text.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi) ?? [],
  );

  const urls = unique(text.match(/https?:\/\/[^\s]+/gi) ?? []);

  const emails = unique(
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [],
  );

  const phones = unique(
    text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [],
  );

  const events = unique(
    lo.match(
      /\b(wedding|concert|festival|birthday|party|ceremony|event|show|conference|rave|nightclub|anniversary|memorial)\b/g,
    ) ?? [],
  );

  const products = unique(
    lo.match(
      /\b(qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|pick|jewelry|tattoo)\b/g,
    ) ?? [],
  );

  const places = unique([
    ...(context.location?.label ? [context.location.label] : []),
    ...(context.location?.city ? [context.location.city] : []),
    ...(context.event?.venue ? [context.event.venue] : []),
    ...(
      text.match(
        /\b(?:at|in|near)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/g,
      ) ?? []
    ).map((value) =>
      value.replace(/^\b(?:at|in|near)\s+/i, ""),
    ),
  ]);

  const media = /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan)\b/i.test(
    text,
  )
    ? ["media"]
    : [];

  const keywords = unique(
    tokens(text)
      .map((value) => value.toLowerCase())
      .filter(
        (value) => value.length > 2 && !STOP.has(value),
      ),
  );

  return {
    people,
    places,
    organizations: [],
    dates,
    times,
    events,
    products,
    urls,
    phones,
    media,
    emails,
    keywords,
  };
}

/**
 * Semantic subject authority.
 *
 * Priority:
 *
 * 1. cognitivePlan.centralSubject
 * 2. explicit semantic prompt subject
 * 3. entity-derived subject
 * 4. keyword fallback
 *
 * The critical rule is that the cognitive brain's interpretation wins
 * over the old regex extraction.
 */
function subject(
  prompt: string,
  value: ExperienceEntities,
  plan?: CognitiveExperiencePlan,
): string {
  const cognitiveSubject = clean(plan?.centralSubject ?? "");

  if (cognitiveSubject) {
    return cognitiveSubject;
  }

  const direct = prompt.match(
    /\b(?:for|about|with)\s+([^,.!?]+?)(?:\s+(?:about|at|in|on|tonight|today|now)\b|[,.!?]|$)/i,
  )?.[1];

  const possessive = prompt.match(
    /\bmy\s+([^,.!?]+?)(?:[,.!?]|$)/i,
  )?.[1];

  if (direct && clean(direct).length <= 80) {
    return clean(direct);
  }

  if (possessive && clean(possessive).length <= 80) {
    return clean(possessive);
  }

  return (
    value.products[0] ??
    value.events[0] ??
    value.people[0] ??
    (
      tokens(prompt)
        .filter((x) => !STOP.has(x.toLowerCase()))
        .slice(0, 5)
        .join(" ") || "this moment"
    )
  );
}

/**
 * The prompt's grammatical action is not necessarily the experience's
 * experiential action.
 *
 * "Create a treasure hunt" should not become a "creation" experience.
 * "Create something mysterious" should not become a "creation" story.
 *
 * Cognitive direction gets first authority.
 */
function activity(
  prompt: string,
  plan?: CognitiveExperiencePlan,
): string {
  const direction = lower(plan?.direction ?? "");

  const directionActivity: Record<string, string> = {
    utility: "guidance",
    game: "play",
    discovery: "discovery",
    memory: "remembering",
    social: "connection",
    commerce: "return",
    journey: "movement",
    identity: "identity",
    story: "story",
    transformation: "change",
  };

  if (directionActivity[direction]) {
    return directionActivity[direction];
  }

  for (const [pattern, value] of ACTIONS) {
    if (pattern.test(prompt)) {
      return value;
    }
  }

  return "observation";
}

function contextKinds(
  prompt: string,
  context: StoryCompilerContext,
): string[] {
  const result = CONTEXT.filter(([, pattern]) =>
    pattern.test(prompt),
  ).map(([kind]) => kind);

  if (context.event) result.push("event");
  if (context.memories?.length) result.push("memory");
  if (context.location) result.push("place");

  return unique(result);
}

function emotions(prompt: string): string[] {
  return unique(
    EMOTIONS.filter(([pattern]) => pattern.test(prompt)).map(
      ([, emotion]) => emotion,
    ),
  );
}

function audience(
  prompt: string,
  context: StoryCompilerContext,
  plan?: CognitiveExperiencePlan,
): string[] {
  const plannedAudience = unique(plan?.audience ?? []);

  if (plannedAudience.length) {
    return plannedAudience;
  }

  const text = lower(prompt);

  if (
    context.event?.participants?.length ||
    /\b(everyone|crowd|guests?|fans?|people|community|group|team|together)\b/.test(
      text,
    )
  ) {
    return ["shared"];
  }

  if (/\b(my|me|mine|personal|private|for me)\b/.test(text)) {
    return ["personal"];
  }

  return ["individual"];
}

function temporal(
  prompt: string,
  context: StoryCompilerContext,
): string[] {
  const text = lower(prompt);

  return unique([
    /\b(now|today|tonight|live|currently|happening)\b/.test(text)
      ? "present"
      : "",
    /\b(yesterday|last|past|ago|old|formerly|before)\b/.test(text)
      ? "past"
      : "",
    /\b(tomorrow|next|future|soon|will|upcoming)\b/.test(text)
      ? "future"
      : "",
    context.event?.timestamp ? "event_time" : "",
  ]);
}

function affordances(
  prompt: string,
  activityValue: string,
  contextValue: string[],
  audienceValue: string[],
  temporalValue: string[],
  hasMemories: boolean,
  plan?: CognitiveExperiencePlan,
): string[] {
  const text = lower(prompt);
  const result = new Set<string>();

  if (activityValue !== "observation") result.add("change");
  if (audienceValue[0] === "shared") result.add("connection");
  if (contextValue.length) result.add("environment");
  if (hasMemories || temporalValue.includes("past")) {
    result.add("continuity");
  }
  if (temporalValue.includes("future")) {
    result.add("anticipation");
  }

  if (/\b(fun|funny|playful|wild|surprise|laugh)\b/.test(text)) {
    result.add("play");
  }

  if (
    /\b(mystery|secret|hidden|discover|explore|unknown|uncover)\b/.test(
      text,
    )
  ) {
    result.add("reveal");
  }

  if (
    /\b(remember|memory|forever|legacy|preserve|capture|keepsake)\b/.test(
      text,
    )
  ) {
    result.add("preservation");
  }

  if (/\b(boring|ordinary|routine|usual)\b/.test(text)) {
    result.add("contrast");
  }

  if (/\b(why|meaning|important|significant|matter)\b/.test(text)) {
    result.add("meaning");
  }

  if (/\b(game|challenge|quest|race|puzzle|competition)\b/.test(text)) {
    result.add("challenge");
  }

  if (/\b(choice|choose|decide|vote|pick)\b/.test(text)) {
    result.add("choice");
  }

  if (/\b(replay|again|return|next time)\b/.test(text)) {
    result.add("replay");
  }

  if (plan?.dynamicBehavior.length) {
    result.add("adaptation");
  }

  if (plan?.futureEvolution.length) {
    result.add("evolution");
  }

  if (plan?.discoveryModel.length) {
    result.add("discovery");
  }

  if (plan?.rewardModel.length) {
    result.add("reward");
  }

  if (plan?.progressionModel.length) {
    result.add("progression");
  }

  if (plan?.commerceModel.length) {
    result.add("commerce");
  }

  return [
    ...result,
    ...(result.size ? [] : ["curiosity", "payoff"]),
  ];
}

function observe(
  prompt: string,
  context: StoryCompilerContext,
): ExperienceObservation {
  const text = clean(prompt);

  if (!text) {
    throw new Error("Experience prompt required.");
  }

  const entitySet = entities(text, context);

  /*
   * IMPORTANT:
   * Pass the cognitive plan into subject extraction.
   * This is the architectural correction that prevents the realization
   * layer from reverting to regex-derived subjects.
   */
  const subjectValue = subject(
    text,
    entitySet,
    context.cognitivePlan,
  );

  const activityValue = activity(
    text,
    context.cognitivePlan,
  );

  const contextValue = contextKinds(text, context);
  const emotionValue = emotions(text);
  const audienceValue = audience(
    text,
    context,
    context.cognitivePlan,
  );
  const temporalValue = temporal(text, context);

  return {
    prompt: text,
    subject: subjectValue,
    activity: activityValue,
    context: contextValue,
    entities: entitySet,
    explicitEmotions: emotionValue,
    audience: audienceValue,
    temporal: temporalValue,
    affordances: affordances(
      text,
      activityValue,
      contextValue,
      audienceValue,
      temporalValue,
      Boolean(context.memories?.length),
      context.cognitivePlan,
    ),
    evidence: [
      {
        kind: "observed",
        source: "prompt",
        confidence: 1,
      },
    ],
  };
}

function situation(
  observation: ExperienceObservation,
  context: StoryCompilerContext,
): StorySituation {
  const social: StorySituation["social"] =
    observation.audience[0] === "shared"
      ? "shared"
      : observation.audience[0] === "personal"
        ? "solo"
        : "unknown";

  const actors = unique([
    ...observation.entities.people,
    ...(context.event?.participants ?? []),
  ]);

  const setting = unique([
    ...observation.context,
    ...(context.event?.venue ? [context.event.venue] : []),
    ...(context.location?.label
      ? [context.location.label]
      : []),
  ]);

  const plan = context.cognitivePlan;

  return {
    subject: observation.subject,
    actors,
    activity: observation.activity,
    setting,
    temporal: observation.temporal,
    social,
    purpose: plan?.purpose ?? "make the moment matter",
    change:
      plan?.interactionModel[0] ??
      (
        observation.activity === "observation"
          ? "attention shifts"
          : `${observation.activity} changes the situation`
      ),
    tension:
      /\b(boring|lost|missing|problem|hard|difficult|danger|unknown|mystery|risk)\b/i.test(
        observation.prompt,
      )
        ? "something needs resolution"
        : "the moment has unrealized potential",
    signals: observation.entities.keywords
      .slice(0, 20)
      .map((value, index) => ({
        value,
        source: "prompt",
        confidence: 0.8,
        salience: Math.max(0.2, 1 - index / 20),
      })),
  };
}

function tone(
  observation: ExperienceObservation,
): ExperienceTone[] {
  const result: ExperienceTone[] = [];

  if (
    observation.explicitEmotions.includes("joy") ||
    observation.affordances.includes("play")
  ) {
    result.push("playful");
  }

  if (
    observation.explicitEmotions.includes("love") ||
    observation.explicitEmotions.includes("nostalgia")
  ) {
    result.push("emotional");
  }

  if (observation.explicitEmotions.includes("excitement")) {
    result.push("energetic");
  }

  if (
    observation.explicitEmotions.includes("curiosity") ||
    observation.affordances.includes("reveal")
  ) {
    result.push("mysterious");
  }

  if (observation.explicitEmotions.includes("intensity")) {
    result.push("dark");
  }

  if (observation.explicitEmotions.includes("calm")) {
    result.push("cinematic");
  }

  return (result.length ? result : ["cinematic"]) as ExperienceTone[];
}

const provenance = (
  kind: StoryProvenance["kind"],
  source: string,
  confidence: number,
): StoryProvenance[] => [
  {
    kind,
    source,
    confidence,
  },
];

function planText(
  plan?: CognitiveExperiencePlan,
): string[] {
  if (!plan) return [];

  return unique([
    plan.centralSubject ?? "",
    plan.purpose ?? "",
    ...plan.whyInteract,
    ...plan.emotionalIntent,
    ...plan.interactionModel,
    ...plan.storyStructure,
    ...plan.memoryModel,
    ...plan.geographicModel,
    ...plan.socialModel,
    ...plan.discoveryModel,
    ...plan.rewardModel,
    ...plan.commerceModel,
    ...plan.progressionModel,
    ...plan.contentModel,
    ...plan.dynamicBehavior,
    ...plan.futureEvolution,
    ...plan.creativePossibilities,
  ]);
}

function wordOverlap(
  a: string,
  b: string,
): number {
  const left = new Set(
    tokens(lower(a)).filter((x) => x.length > 3),
  );

  const right = new Set(
    tokens(lower(b)).filter((x) => x.length > 3),
  );

  if (!left.size || !right.size) return 0;

  let hits = 0;

  for (const word of left) {
    if (right.has(word)) hits += 1;
  }

  return hits / Math.max(left.size, right.size);
}

/**
 * Converts the cognitive plan into a preferred narrative operation sequence.
 *
 * The plan is now allowed to determine the architecture of realization.
 *
 * This is intentionally not an industry-template system.
 * These are experiential operations already represented by the cognitive
 * plan's own semantic vocabulary.
 */
function planBeatStructure(
  plan?: CognitiveExperiencePlan,
): StoryBeatKind[] | undefined {
  if (!plan?.direction) return undefined;

  const direction = lower(plan.direction);

  const structures: Record<string, StoryBeatKind[]> = {
    memory: [
      "orientation",
      "origin",
      "encounter",
      "reflection",
      "payoff",
      "continuation",
    ],

    utility: [
      "need",
      "instruction",
      "action",
      "feedback",
      "next_step",
    ],

    game: [
      "hook",
      "challenge",
      "discovery",
      "escalation",
      "payoff",
    ],

    discovery: [
      "threshold",
      "reveal",
      "discovery",
      "payoff",
      "continuation",
    ],

    social: [
      "orientation",
      "encounter",
      "contribution",
      "payoff",
      "continuation",
    ],

    commerce: [
      "orientation",
      "identity",
      "discovery",
      "payoff",
      "continuation",
    ],

    journey: [
      "orientation",
      "threshold",
      "discovery",
      "transformation",
      "continuation",
    ],

    identity: [
      "orientation",
      "identity",
      "reflection",
      "payoff",
      "continuation",
    ],

    story: [
      "orientation",
      "hook",
      "encounter",
      "transformation",
      "payoff",
      "continuation",
    ],
  };

  return structures[direction];
}

function score(
  beats: StoryBeatKind[],
  observation: ExperienceObservation,
  situationValue: StorySituation,
  plan?: CognitiveExperiencePlan,
): number {
  const affordanceSet = new Set(observation.affordances);

  const compatibility: Partial<
    Record<StoryBeatKind, string[]>
  > = {
    orientation: [
      "environment",
      "continuity",
      "anticipation",
    ],

    hook: [
      "change",
      "contrast",
      "play",
      "curiosity",
    ],

    need: [
      "meaning",
      "challenge",
      "choice",
      "payoff",
    ],

    threshold: [
      "reveal",
      "curiosity",
      "environment",
      "discovery",
    ],

    origin: [
      "continuity",
      "preservation",
      "meaning",
    ],

    encounter: [
      "connection",
      "environment",
      "continuity",
    ],

    challenge: [
      "challenge",
      "play",
      "choice",
      "progression",
    ],

    discovery: [
      "reveal",
      "curiosity",
      "meaning",
      "discovery",
    ],

    reveal: [
      "reveal",
      "curiosity",
      "discovery",
    ],

    instruction: [
      "meaning",
      "payoff",
      "change",
    ],

    action: [
      "change",
      "challenge",
      "play",
      "choice",
    ],

    feedback: [
      "change",
      "progression",
      "payoff",
    ],

    contribution: [
      "connection",
      "choice",
      "play",
    ],

    escalation: [
      "challenge",
      "play",
      "connection",
      "change",
    ],

    transformation: [
      "change",
      "contrast",
      "meaning",
    ],

    reflection: [
      "meaning",
      "preservation",
      "continuity",
    ],

    identity: [
      "meaning",
      "preservation",
      "connection",
    ],

    milestone: [
      "progression",
      "payoff",
      "change",
    ],

    unlock: [
      "reward",
      "progression",
      "discovery",
    ],

    payoff: [
      "payoff",
      "play",
      "meaning",
      "preservation",
      "reward",
    ],

    earned_access: [
      "reward",
      "progression",
      "discovery",
    ],

    next_step: [
      "payoff",
      "progression",
      "anticipation",
      "evolution",
    ],

    continuation: [
      "continuity",
      "anticipation",
      "preservation",
      "replay",
      "evolution",
    ],
  };

  let value = 0;

  for (const beat of beats) {
    for (const signal of compatibility[beat] ?? []) {
      if (affordanceSet.has(signal)) {
        value += 1.35;
      }
    }
  }

  if (beats.includes("payoff")) {
    value += 1.6;
  }

  if (
    beats.includes("orientation") &&
    situationValue.setting.length
  ) {
    value += 0.8;
  }

  if (
    beats.includes("encounter") &&
    situationValue.actors.length
  ) {
    value += 0.9;
  }

  if (
    beats.includes("reflection") &&
    (
      observation.context.includes("memory") ||
      observation.explicitEmotions.length
    )
  ) {
    value += 1.5;
  }

  if (
    beats.includes("transformation") &&
    observation.activity !== "observation"
  ) {
    value += 1.2;
  }

  if (
    beats.includes("continuation") &&
    (
      observation.temporal.includes("future") ||
      observation.context.includes("memory")
    )
  ) {
    value += 1.1;
  }

  if (plan) {
    const planWords = planText(plan).join(" ");
    const candidateWords = beats.join(" ");

    /*
     * Keep semantic overlap as a small signal.
     * Beat names are no longer allowed to dominate candidate selection.
     */
    value += wordOverlap(candidateWords, planWords) * 0.75;

    if (
      plan.interactionModel.length &&
      beats.some((beat) =>
        [
          "encounter",
          "discovery",
          "action",
          "challenge",
          "instruction",
          "contribution",
        ].includes(beat),
      )
    ) {
      value += plan.interactionModel.length * 0.18;
    }

    if (
      plan.futureEvolution.length &&
      beats.includes("continuation")
    ) {
      value += plan.futureEvolution.length * 0.35;
    }

    if (
      plan.creativePossibilities.length &&
      beats.some((beat) =>
        ["discovery", "hook", "reveal"].includes(beat),
      )
    ) {
      value += plan.creativePossibilities.length * 0.15;
    }

    if (
      plan.rewardModel.length &&
      beats.some((beat) =>
        ["payoff", "unlock", "earned_access"].includes(beat),
      )
    ) {
      value += plan.rewardModel.length * 0.3;
    }
  }

  value +=
    beats.length >= 2 && beats.length <= 7
      ? 0.8
      : 0;

  value -= Math.max(0, beats.length - 7) * 0.6;

  return Number(value.toFixed(3));
}

function candidates(
  observation: ExperienceObservation,
  situationValue: StorySituation,
  plan?: CognitiveExperiencePlan,
): Candidate[] {
  const pool: Array<
    [string, StoryBeatKind[], string]
  > = [
    [
      "momentum",
      ["orientation", "hook", "escalation", "payoff"],
      "Build energy around observed action.",
    ],

    [
      "reveal",
      ["orientation", "hook", "discovery", "payoff"],
      "Expose a meaningful second layer.",
    ],

    [
      "change",
      ["orientation", "hook", "transformation", "payoff"],
      "Make observable change the story engine.",
    ],

    [
      "memory",
      [
        "orientation",
        "encounter",
        "reflection",
        "payoff",
        "continuation",
      ],
      "Connect present evidence to continuity.",
    ],

    [
      "play",
      [
        "hook",
        "encounter",
        "escalation",
        "payoff",
      ],
      "Use participation and play as momentum.",
    ],

    [
      "meaning",
      [
        "orientation",
        "discovery",
        "reflection",
        "payoff",
      ],
      "Move from surface detail toward significance.",
    ],

    [
      "relationship",
      [
        "orientation",
        "encounter",
        "transformation",
        "payoff",
        "continuation",
      ],
      "Let people and interaction carry change.",
    ],

    [
      "minimal",
      ["hook", "payoff"],
      "Respect sparse prompts instead of inventing machinery.",
    ],
  ];

  /*
   * The cognitive plan gets an explicit candidate.
   * This means the selected plan is visible in the candidate layer rather
   * than being reconstructed later from generic narrative candidates.
   */
  const plannedStructure = planBeatStructure(plan);

  if (plannedStructure?.length) {
    pool.push([
      `cognitive-${lower(plan?.direction ?? "experience")}`,
      plannedStructure,
      `Realize the cognitive direction "${plan?.direction ?? "experience"}" using its declared experiential structure.`,
    ]);
  }

  return pool
    .map(([id, beats, rationale]) => ({
      id,
      beats,
      score: score(
        beats,
        observation,
        situationValue,
        plan,
      ),
      rationale,
      evidence: provenance(
        "inferred",
        `candidate:${id}`,
        id.startsWith("cognitive-") ? 0.96 : 0.7,
      ),
    }))
    .sort((a, b) => b.score - a.score);
}

function choose(
  candidateList: Candidate[],
  observation: ExperienceObservation,
  plan?: CognitiveExperiencePlan,
): Candidate {
  if (!candidateList.length) {
    throw new Error("Story compiler produced no candidates.");
  }

  /*
   * If cognition supplied a direction, prefer the candidate explicitly
   * compiled from that direction.
   *
   * This is intentionally stronger than generic score-based selection.
   */
  if (plan?.direction) {
    const cognitiveCandidate = candidateList.find(
      (candidate) =>
        candidate.id ===
        `cognitive-${lower(plan.direction)}`,
    );

    if (cognitiveCandidate) {
      return cognitiveCandidate;
    }
  }

  if (!plan) {
    return candidateList[0];
  }

  const planTextValue = planText(plan).join(" ");

  return (
    [...candidateList].sort((a, b) => {
      const aFit =
        wordOverlap(a.rationale, planTextValue) +
        a.score * 0.08;

      const bFit =
        wordOverlap(b.rationale, planTextValue) +
        b.score * 0.08;

      return bFit - aFit;
    })[0] ?? candidateList[0]
  );
}

function primaryPlanSignal(
  plan: CognitiveExperiencePlan | undefined,
  field:
    | "whyInteract"
    | "purpose"
    | "interactionModel"
    | "contentModel"
    | "discoveryModel"
    | "rewardModel"
    | "progressionModel"
    | "futureEvolution"
    | "creativePossibilities",
): string {
  if (!plan) return "";

  if (field === "purpose") {
    return clean(plan.purpose ?? "");
  }

  return clean(plan[field]?.[0] ?? "");
}

function subjectDetail(
  observation: ExperienceObservation,
): string {
  const subjectWords = new Set(
    tokens(lower(observation.subject)),
  );

  const detail = observation.entities.keywords.find(
    (word) =>
      !subjectWords.has(word.toLowerCase()) &&
      word.length > 3,
  );

  return detail ?? "";
}

function interactionVerb(
  plan?: CognitiveExperiencePlan,
): string {
  const model = lower(
    plan?.interactionModel?.join(" ") ?? "",
  );

  if (/\b(scan|tap|enter|open)\b/.test(model)) {
    return "enter";
  }

  if (/\b(choose|pick|select|decide)\b/.test(model)) {
    return "choose";
  }

  if (/\b(solve|complete|challenge)\b/.test(model)) {
    return "solve";
  }

  if (/\b(discover|reveal|explore)\b/.test(model)) {
    return "discover";
  }

  if (/\b(learn|understand|teach)\b/.test(model)) {
    return "learn";
  }

  if (/\b(share|contribute|connect)\b/.test(model)) {
    return "connect";
  }

  return "continue";
}

/**
 * Subject-native realization.
 *
 * This is the major correction.
 *
 * Generic prose is retained only as a final compatibility fallback.
 * The normal path is driven by:
 *
 *   subject
 *   direction
 *   storyStructure
 *   interactionModel
 *   whyInteract
 *   purpose
 *   content
 *   reward
 *   progression
 *   future evolution
 */
function beatText(
  kind: StoryBeatKind,
  observation: ExperienceObservation,
  situationValue: StorySituation,
  plan?: CognitiveExperiencePlan,
): string {
  const subjectValue = observation.subject;
  const subjectName = cap(subjectValue);
  const detail = subjectDetail(observation);
  const direction = lower(plan?.direction ?? "");
  const why = primaryPlanSignal(
    plan,
    "whyInteract",
  );
  const purpose = primaryPlanSignal(
    plan,
    "purpose",
  );
  const interaction = primaryPlanSignal(
    plan,
    "interactionModel",
  );
  const content = primaryPlanSignal(
    plan,
    "contentModel",
  );
  const discovery = primaryPlanSignal(
    plan,
    "discoveryModel",
  );
  const reward = primaryPlanSignal(
    plan,
    "rewardModel",
  );
  const progression = primaryPlanSignal(
    plan,
    "progressionModel",
  );
  const future = primaryPlanSignal(
    plan,
    "futureEvolution",
  );
  const creative = primaryPlanSignal(
    plan,
    "creativePossibilities",
  );

  const actor =
    situationValue.actors[0] ??
    (observation.audience.includes("shared")
      ? "the people around it"
      : "");

  /*
   * Direction-specific realization.
   *
   * These are not hard-coded industry templates.
   * They translate the semantic operations already produced by cognition
   * into language appropriate to each experiential mode.
   */

  if (direction === "utility") {
    switch (kind) {
      case "need":
        return why
          ? `${subjectName} is here because ${why}.`
          : `Start with what ${subjectValue} needs most right now.`;

      case "instruction":
        return content
          ? `For ${subjectValue}, the useful answer begins here: ${content}.`
          : `The next useful move with ${subjectValue} is to understand the immediate task before adding anything else.`;

      case "action":
        return interaction
          ? `Now act on ${subjectValue}: ${interaction}.`
          : `Put the guidance into action with ${subjectValue}.`;

      case "feedback":
        return `Check what changed. ${subjectName} gives you a signal about whether the next move is working.`;

      case "next_step":
        return progression
          ? `Once that works, move forward through ${progression}.`
          : future
            ? `The next step can adapt as new knowledge and results accumulate: ${future}.`
            : `Use what just happened to choose the next useful step.`;
    }
  }

  if (direction === "game") {
    switch (kind) {
      case "hook":
        return why
          ? `${subjectName} becomes the starting point. Your job is to ${why}.`
          : `The game starts here. ${subjectName} is the thing you have to figure out.`;

      case "challenge":
        return progression
          ? `The next challenge is part of the progression: ${progression}.`
          : `A challenge appears. Solve it before moving deeper into ${subjectValue}.`;

      case "discovery":
        return discovery
          ? `The clue opens another layer of ${subjectValue}: ${discovery}.`
          : detail
            ? `The clue points toward ${detail}. There is more to ${subjectValue} than the first answer suggests.`
            : `The clue reveals another layer of ${subjectValue}.`;

      case "escalation":
        return `The next move is harder because the game has learned from what you already did.`;

      case "payoff":
        return reward
          ? `You earned the next piece of the experience: ${reward}.`
          : `You made it through the challenge. What was hidden in ${subjectValue} is now yours to discover.`;
    }
  }

  if (direction === "discovery") {
    switch (kind) {
      case "threshold":
        return why
          ? `${subjectName} is the threshold. ${why}.`
          : `Look past the obvious layer of ${subjectValue}.`;

      case "reveal":
        return discovery
          ? `${subjectName} reveals something that was not visible at first: ${discovery}.`
          : detail
            ? `A closer look at ${subjectValue} reveals ${detail}.`
            : `Something hidden inside ${subjectValue} comes into view.`;

      case "discovery":
        return creative
          ? `The deeper discovery is what ${subjectValue} can become in context: ${creative}.`
          : `The deeper layer connects ${subjectValue} to something you could not see from the surface.`;

      case "payoff":
        return purpose
          ? `${cap(purpose)}. What was hidden now has a reason to matter.`
          : `The reveal changes what ${subjectValue} means.`;

      case "continuation":
        return future
          ? `The discovery does not end here. ${future}.`
          : `Another interaction can reveal a different layer of ${subjectValue}.`;
    }
  }

  if (direction === "memory") {
    switch (kind) {
      case "orientation":
        return `${subjectName} is already carrying a history. The scan simply gives that history somewhere to surface.`;

      case "origin":
        return contextMemoryText(
          observation,
          plan,
        );

      case "encounter":
        return actor
          ? `${actor} brings another piece of ${subjectValue} into the present.`
          : detail
            ? `A remembered detail brings ${subjectValue} closer: ${detail}.`
            : `A memory gives ${subjectValue} another dimension.`;

      case "reflection":
        return creative
          ? `What remains is not only the memory itself, but what it still means: ${creative}.`
          : `The memory matters because it connects the person, place, or object that was there with the person encountering it now.`;

      case "payoff":
        return purpose
          ? `${cap(purpose)}. The past becomes something the present can carry forward.`
          : `The memory becomes part of the present instead of staying behind it.`;

      case "continuation":
        return future
          ? `The story can keep growing as new memories arrive: ${future}.`
          : `New memories can change what later visitors discover.`;
    }
  }

  if (direction === "social") {
    switch (kind) {
      case "orientation":
        return actor
          ? `${subjectName} brings ${actor} into the same moment.`
          : `${subjectName} creates a shared point of attention.`;

      case "encounter":
        return interaction
          ? `${subjectName} becomes something people can respond to together: ${interaction}.`
          : `${subjectName} becomes a reason to enter the same conversation.`;

      case "contribution":
        return `The experience changes when someone adds something of their own to ${subjectValue}.`;

      case "payoff":
        return purpose
          ? `${cap(purpose)}. The value is created between the people taking part.`
          : `${subjectName} becomes more meaningful because people contributed to it together.`;

      case "continuation":
        return future
          ? `The shared experience can continue: ${future}.`
          : `The next person can add to what the group has already created.`;
    }
  }

  if (direction === "commerce") {
    switch (kind) {
      case "orientation":
        return `${subjectName} is more than an object of attention. It gives the interaction a reason to begin.`;

      case "identity":
        return creative
          ? `${subjectName} expresses an identity through context, story, and use: ${creative}.`
          : `${subjectName} becomes recognizable through the meaning people attach to it.`;

      case "discovery":
        return discovery
          ? `There is more to discover around ${subjectValue}: ${discovery}.`
          : `The interaction reveals why ${subjectValue} is worth returning to.`;

      case "payoff":
        return reward
          ? `${cap(reward)}. The exchange gives the person something beyond the transaction.`
          : `The reason to return is created by the experience, not just the purchase.`;

      case "continuation":
        return future
          ? `The relationship can evolve after the first interaction: ${future}.`
          : `A future interaction can deepen the relationship with ${subjectValue}.`;
    }
  }

  if (direction === "journey") {
    switch (kind) {
      case "orientation":
        return `${subjectName} is where the journey begins.`;

      case "threshold":
        return why
          ? `Cross the threshold when you are ready to ${why}.`
          : `The next step moves ${subjectValue} from where it is into somewhere new.`;

      case "discovery":
        return discovery
          ? `Along the way, ${subjectValue} reveals ${discovery}.`
          : `The journey reveals something that could not be understood from the starting point.`;

      case "transformation":
        return `${subjectName} has changed through what happened along the way.`;

      case "continuation":
        return future
          ? `The journey remains open: ${future}.`
          : `There is another place, moment, or layer waiting beyond this one.`;
    }
  }

  if (direction === "identity") {
    switch (kind) {
      case "orientation":
        return `${subjectName} is the surface. The experience asks what it says about the world around it.`;

      case "identity":
        return creative
          ? `${subjectName} carries an identity shaped by ${creative}.`
          : `${subjectName} becomes a marker of the people, values, and stories connected to it.`;

      case "reflection":
        return `What you recognize in ${subjectValue} says something about the person encountering it.`;

      case "payoff":
        return purpose
          ? `${cap(purpose)}. The subject becomes part of the participant's own story.`
          : `${subjectName} becomes more than something observed; it becomes something identified with.`;

      case "continuation":
        return future
          ? `That identity can keep evolving: ${future}.`
          : `The meaning of ${subjectValue} can deepen with every return.`;
    }
  }

  /*
   * Generic story mode.
   *
   * This is deliberately evidence-grounded and avoids the previous
   * placeholder vocabulary.
   */
  switch (kind) {
    case "orientation":
      return situationValue.setting.length
        ? `${subjectName} is here, in ${situationValue.setting.join(", ")}.`
        : `${subjectName} is the thing the experience puts into focus.`;

    case "hook":
      return why
        ? `${cap(why)}. ${subjectName} gives that idea something concrete to act on.`
        : detail
          ? `Something about ${subjectValue} deserves a closer look: ${detail}.`
          : `${subjectName} contains more than the first glance reveals.`;

    case "encounter":
      return actor
        ? `${actor} enters the experience and changes the relationship with ${subjectValue}.`
        : detail
          ? `${subjectName} connects to ${detail}, giving the moment a direction.`
          : `${subjectName} encounters something that gives the moment a direction.`;

    case "escalation":
      return interaction
        ? `The experience moves forward through ${interaction}.`
        : `What began with ${subjectValue} now has consequences for what happens next.`;

    case "discovery":
      return discovery
        ? `${subjectName} reveals another layer: ${discovery}.`
        : detail
          ? `Look again at ${subjectValue}. The important detail is ${detail}.`
          : `A second layer of ${subjectValue} comes into view.`;

    case "transformation":
      return `${subjectName} is changed by what the experience has revealed.`;

    case "payoff":
      return purpose
        ? `${cap(purpose)}. The subject now means more because of what happened around it.`
        : `${subjectName} has become more meaningful through the interaction.`;

    case "reflection":
      return observation.explicitEmotions.length
        ? `The experience leaves behind ${observation.explicitEmotions.join(" and ")} as part of what remains.`
        : `The experience leaves a meaning behind, attached to ${subjectValue}.`;

    case "continuation":
      return future
        ? `The story stays open: ${future}.`
        : `The next interaction can change what ${subjectValue} means.`;

    case "need":
      return why
        ? `${cap(why)}.`
        : `Start with what ${subjectValue} needs from this interaction.`;

    case "threshold":
      return `Cross into the part of ${subjectValue} that is not visible from the surface.`;

    case "origin":
      return contextMemoryText(
        observation,
        plan,
      );

    case "challenge":
      return `There is something to solve before ${subjectValue} can reveal what comes next.`;

    case "reveal":
      return `The hidden relationship around ${subjectValue} becomes visible.`;

    case "instruction":
      return content
        ? `The useful information is here: ${content}.`
        : `The experience gives you the next useful piece of information.`;

    case "action":
      return interaction
        ? `Take the next action: ${interaction}.`
        : `Act on what ${subjectValue} just revealed.`;

    case "feedback":
      return `What happens next depends on what the interaction tells us.`;

    case "contribution":
      return `Your contribution changes what ${subjectValue} can become.`;

    case "identity":
      return `${subjectName} carries an identity that becomes clearer through interaction.`;

    case "milestone":
      return progression
        ? `You have reached a meaningful point in the progression: ${progression}.`
        : `This is a meaningful point in the experience.`;

    case "unlock":
      return reward
        ? `The next layer is unlocked: ${reward}.`
        : `Something previously unavailable is now open.`;

    case "earned_access":
      return reward
        ? `Access is earned through what just happened: ${reward}.`
        : `The interaction has earned access to what comes next.`;

    case "next_step":
      return progression
        ? `The next step is clear: ${progression}.`
        : `Use what you learned here to choose the next step.`;

    default:
      return `${subjectName} continues to develop through the interaction.`;
  }
}

function contextMemoryText(
  observation: ExperienceObservation,
  plan?: CognitiveExperiencePlan,
): string {
  const memorySignal =
    plan?.memoryModel?.[0] ??
    plan?.creativePossibilities?.[0];

  if (memorySignal) {
    return `${cap(observation.subject)} carries a past into the present: ${memorySignal}.`;
  }

  return `${cap(observation.subject)} carries something from before this moment into the present.`;
}

function beatPurpose(
  kind: StoryBeatKind,
  observation: ExperienceObservation,
  plan?: CognitiveExperiencePlan,
): string {
  const direction = lower(plan?.direction ?? "");

  const purposeByDirection: Record<
    string,
    Partial<Record<StoryBeatKind, string>>
  > = {
    utility: {
      need: "Identify the immediate need.",
      instruction: "Provide useful guidance.",
      action: "Turn guidance into an actionable step.",
      feedback: "Use the result to determine what happens next.",
      next_step: "Continue from the user's current state.",
    },

    game: {
      hook: "Establish the challenge.",
      challenge: "Create a meaningful obstacle.",
      discovery: "Reward exploration with information.",
      escalation: "Increase meaningful difficulty.",
      payoff: "Deliver the earned result.",
    },

    discovery: {
      threshold: "Move beyond the obvious layer.",
      reveal: "Expose hidden information.",
      discovery: "Connect the revealed information to meaning.",
      payoff: "Make the discovery matter.",
      continuation: "Leave room for deeper discovery.",
    },

    memory: {
      orientation: "Place the present beside the remembered past.",
      origin: "Surface where the memory comes from.",
      encounter: "Bring a remembered detail into the present.",
      reflection: "Interpret what the memory still means.",
      payoff: "Turn memory into present meaning.",
      continuation: "Allow future memories to extend the experience.",
    },

    social: {
      orientation: "Create shared context.",
      encounter: "Bring participants into the same experience.",
      contribution: "Let participation change the experience.",
      payoff: "Create collective value.",
      continuation: "Invite another shared interaction.",
    },

    commerce: {
      orientation: "Give the interaction a reason to begin.",
      identity: "Connect the subject to identity and meaning.",
      discovery: "Reveal value beyond the transaction.",
      payoff: "Create a meaningful reason to return.",
      continuation: "Extend the relationship beyond the first interaction.",
    },

    journey: {
      orientation: "Establish the starting point.",
      threshold: "Begin movement into the unknown.",
      discovery: "Reveal what the journey makes possible.",
      transformation: "Show what changed through movement.",
      continuation: "Keep the journey open.",
    },
  };

  const directionPurpose =
    purposeByDirection[direction]?.[kind];

  if (directionPurpose) {
    return directionPurpose;
  }

  return `Advance ${observation.subject} through ${kind}.`;
}

function makeBeat(
  kind: StoryBeatKind,
  index: number,
  observation: ExperienceObservation,
  situationValue: StorySituation,
  toneValue: ExperienceTone[],
  plan?: CognitiveExperiencePlan,
): StoryBeat {
  const planConfidence =
    plan?.centralSubject &&
    plan.centralSubject.trim()
      ? 0.96
      : 0.72;

  return {
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: beatPurpose(
      kind,
      observation,
      plan,
    ),
    text: beatText(
      kind,
      observation,
      situationValue,
      plan,
    ),
    entities: unique([
      observation.subject,
      ...observation.entities.keywords.slice(0, 4),
      ...situationValue.actors.slice(0, 2),
    ]),
    emotionalTarget:
      toneValue[0] ?? "curiosity",
    provenance:
      kind === "orientation" ||
      kind === "need" ||
      kind === "threshold"
        ? [
            ...provenance(
              "observed",
              "prompt",
              1,
            ),
            ...(plan
              ? provenance(
                  "inferred",
                  "cognitive_plan",
                  planConfidence,
                )
              : []),
          ]
        : [
            ...provenance(
              "observed",
              "prompt",
              1,
            ),
            ...provenance(
              "inferred",
              "cognitive_story_realization",
              plan ? 0.92 : 0.72,
            ),
          ],
  };
}

function title(
  subjectValue: string,
  candidate: Candidate,
  plan?: CognitiveExperiencePlan,
): string {
  const base = cap(
    subjectValue.replace(/^the\s+/i, ""),
  );

  const direction = lower(
    plan?.direction ?? "",
  );

  const directionTitles: Record<
    string,
    string
  > = {
    memory: `${base}: What Remains`,
    discovery: `${base}: Beyond the Surface`,
    journey: `${base}: The Way Through`,
    game: `${base}: The Hunt Begins`,
    identity: `${base}: What It Carries`,
    commerce: `${base}: A Reason to Return`,
    utility: `${base}: The Useful Next Step`,
    social: `${base}: Shared`,
    story: `${base}: Something Happens`,
  };

  if (directionTitles[direction]) {
    return directionTitles[direction];
  }

  if (candidate.id === "play") {
    return `${base} Gets Interesting`;
  }

  if (candidate.id === "change") {
    return `${base} Changes`;
  }

  if (candidate.id === "reveal") {
    return `${base}: Beyond the Surface`;
  }

  return `${base}: The Moment`;
}

function story(
  observation: ExperienceObservation,
  situationValue: StorySituation,
  candidate: Candidate,
  toneValue: ExperienceTone[],
  context: StoryCompilerContext,
): ExperienceStory {
  const beats = candidate.beats.map(
    (kind, index) =>
      makeBeat(
        kind,
        index,
        observation,
        situationValue,
        toneValue,
        context.cognitivePlan,
      ),
  );

  const name = title(
    observation.subject,
    candidate,
    context.cognitivePlan,
  );

  const ending =
    beats.find(
      (beat) => beat.kind === "payoff",
    )?.text ??
    beats.at(-1)?.text ??
    "The moment continues.";

  const continuity =
    context.memories?.length
      ? " Existing memory adds context without replacing the present moment."
      : "";

  return {
    title: name,
    hook:
      beats[0]?.text ??
      "A moment begins.",
    logline:
      context.cognitivePlan?.purpose ??
      `${name} turns observed detail into an evidence-aware experience.${continuity}`,
    beats,
    ending,
    continuation:
      beats.find(
        (beat) =>
          beat.kind === "continuation",
      )?.text,
    tone: toneValue,
    provenance: [
      ...observation.evidence,
      ...candidate.evidence,
    ],
  };
}

function genome(
  observation: ExperienceObservation,
  storyValue: ExperienceStory,
  context: StoryCompilerContext,
): ExperienceGenome {
  const plan = context.cognitivePlan;

  const interpretation: SemanticInterpretation = {
    intent: [
      plan?.direction ??
        "experience_creation",
    ],

    concepts: unique([
      observation.subject,
      observation.activity,
      ...observation.affordances,
      ...(plan
        ? [plan.direction ?? ""]
        : []),
    ]),

    emotionalSignals: unique([
      ...observation.explicitEmotions,
      ...(plan?.emotionalIntent ?? []),
    ]),

    worldSignals: observation.context,

    cognitiveSignals: [
      "observation",
      "evidence_weighting",
      "candidate_search",
      "cognitive_direction",
      "cognitive_subject_authority",
      "plan_native_structure",
      "subject_native_realization",
      "variable_beats",
    ],

    confidence: plan
      ? 0.92
      : 0.82,
  };

  const meaning: ExperienceMeaning = {
    why: storyValue.logline,
    emotions:
      interpretation.emotionalSignals,
    memories:
      context.memories?.map(
        (memory) => memory.summary,
      ) ?? [],
    desiredFeeling:
      interpretation.emotionalSignals.length
        ? interpretation.emotionalSignals
        : ["curiosity"],
    transformation:
      storyValue.ending,
  };

  const journey: ExperienceGenome["journey"] =
    storyValue.beats.flatMap(
      (beat) => {
        switch (beat.kind) {
          case "orientation":
          case "threshold":
            return ["arrival"];

          case "origin":
            return ["arrival"];

          case "discovery":
          case "reveal":
            return ["discovery"];

          case "transformation":
            return ["transformation"];

          case "escalation":
          case "challenge":
            return ["peak"];

          case "reflection":
            return ["memory"];

          case "continuation":
          case "next_step":
            return ["return"];

          default:
            return [];
        }
      },
    );

  return {
    intent: [
      plan?.direction ??
        "experience_creation",
    ],

    interpretation,

    archetypes: plan?.direction
      ? [plan.direction]
      : [],

    themes: unique([
      observation.subject,
      ...observation.context,
      ...(plan?.futureEvolution ?? []),
    ]),

    emotions:
      interpretation.emotionalSignals,

    meaning,

    relationships:
      observation.entities.people,

    energy: storyValue.tone.includes(
      "playful",
    )
      ? "playful"
      : storyValue.tone.includes(
            "energetic",
          )
        ? "intense"
        : storyValue.tone.includes(
              "mysterious",
            )
          ? "mysterious"
          : "emotional",

    pacing:
      storyValue.tone.includes("energetic")
        ? "fast"
        : "medium",

    social:
      observation.audience.includes(
        "shared",
      )
        ? "shared"
        : "solo",

    journey: unique(
      journey,
    ) as ExperienceGenome["journey"],

    discovery:
      observation.affordances.includes(
        "reveal",
      ) ||
      observation.affordances.includes(
        "discovery",
      ) ||
      plan?.direction === "discovery"
        ? 0.9
        : 0.45,

    memory:
      context.memories?.length ||
      observation.context.includes(
        "memory",
      ) ||
      plan?.direction === "memory"
        ? 0.95
        : 0,

    commerce:
      observation.activity ===
        "commerce" ||
      plan?.direction === "commerce"
        ? 0.85
        : 0,

    immersion:
      observation.context.includes(
        "media",
      )
        ? 0.8
        : 0.45,

    interaction:
      observation.affordances.includes(
        "play",
      ) ||
      observation.audience.includes(
        "shared",
      ) ||
      Boolean(
        plan?.interactionModel.length,
      )
        ? 0.8
        : 0.3,

    replay:
      observation.context.includes(
        "memory",
      ) ||
      observation.context.includes(
        "media",
      ) ||
      Boolean(
        plan?.futureEvolution.length,
      )
        ? 0.85
        : 0.25,

    entities:
      observation.entities,

    environments:
      observation.context,

    audience: unique([
      ...observation.audience,
      ...(plan?.audience ?? []),
    ]),

    dna: unique([
      "adaptive",
      "subject-native",
      "evidence-driven",
      "variable-length",
      "cognitive-directed",
      "cognitive-subject-authoritative",
      "plan-native-realization",
      "memory-as-context",
      "event-as-context",
      ...(plan
        ? ["plan-directed"]
        : []),
      ...observation.affordances,
    ]),
  };
}

function blueprint(
  storyValue: ExperienceStory,
  observation: ExperienceObservation,
  plan?: CognitiveExperiencePlan,
): ExperienceBlueprint {
  const moments: ExperienceMoment[] =
    storyValue.beats.map(
      (beat) => ({
        type: "story",
        component: "story",
        title:
          beat.kind === "orientation" ||
          beat.kind === "hook" ||
          beat.kind === "need" ||
          beat.kind === "threshold"
            ? storyValue.title
            : cap(beat.kind),
        subtitle:
          beat.emotionalTarget,
        description:
          beat.text,
        editable: true,
        demo: false,
        order: beat.order,
        payload: {
          beatId: beat.id,
          purpose:
            beat.purpose,
          entities:
            beat.entities,
          provenance:
            beat.provenance,
        },
      }),
    );

  return {
    title: storyValue.title,
    type: "story",
    tone: storyValue.tone,

    meaning: {
      why: storyValue.logline,
      emotions:
        observation.explicitEmotions,
      memories: [],
      desiredFeeling:
        storyValue.tone,
      transformation:
        storyValue.ending,
    },

    moments,

    entities:
      observation.entities,

    ...(plan
      ? {
          cognitivePlan:
            plan,
        }
      : {}),

    metadata: {
      themes: unique([
        observation.subject,
        ...observation.context,
        ...(plan?.emotionalIntent ?? []),
      ]),

      dna: unique([
        "evidence-driven",
        "no-template",
        "cognitive-directed",
        "subject-native",
        ...(plan
          ? ["plan-native"]
          : []),
        ...observation.affordances,
      ]),
    },
  };
}

function flow(
  storyValue: ExperienceStory,
): FlowStep[] {
  return storyValue.beats.map(
    (beat) => ({
      id: beat.id,
      order: beat.order,
      type: "story",
      payload: {
        beat,
      },
    }),
  );
}

function moments(
  storyValue: ExperienceStory,
): Moment[] {
  return storyValue.beats.map(
    (beat) => ({
      type: "message",
      order: beat.order,
      text: beat.text,
      meta: {
        duration:
          beat.kind === "payoff"
            ? 2800
            : beat.kind === "hook" ||
                beat.kind === "threshold"
              ? 2400
              : 2200,

        beatId:
          beat.id,

        beatKind:
          beat.kind,

        emotionalTarget:
          beat.emotionalTarget,

        entities:
          beat.entities,

        provenance:
          beat.provenance,
      },
    }),
  );
}

function scenePlan(
  storyValue: ExperienceStory,
): StoryScenePlan[] {
  return storyValue.beats.map(
    (beat) => ({
      id: `scene-${beat.id}`,
      order: beat.order,
      beatId: beat.id,
      purpose: beat.purpose,
      text: beat.text,
      emotionalTarget:
        beat.emotionalTarget,
      entities:
        beat.entities,

      duration:
        beat.kind === "payoff"
          ? 2800
          : beat.kind === "hook" ||
              beat.kind === "threshold"
            ? 2400
            : 2200,

      transition:
        beat.kind === "hook" ||
        beat.kind === "threshold"
          ? "zoom"
          : beat.kind === "payoff"
            ? "cinematic"
            : "fade",

      visual: {
        theme: "cinematic",

        animation:
          beat.kind === "hook" ||
          beat.kind === "threshold"
            ? "slow_zoom"
            : beat.kind === "escalation" ||
                beat.kind === "challenge"
              ? "parallax"
              : "none",
      },

      audio: {
        type: "ambient",
        mood:
          beat.emotionalTarget,
      },

      provenance:
        beat.provenance,
    }),
  );
}

function scenes(
  plan: StoryScenePlan[],
  momentList: Moment[],
): CinematicScene[] {
  return plan.map(
    (scene, index) => ({
      id: scene.id,
      type: "emotion",
      duration: scene.duration,
      moment: momentList[index],
      order: index,
      transition:
        scene.transition,
      visual: scene.visual,
      audio: scene.audio
        ? {
            type:
              scene.audio.type,
            url: "",
            volume: 0.7,
            autoplay: true,
          }
        : undefined,
      preload:
        index < plan.length - 1,

      meta: {
        source:
          "universal_story_compiler",
        purpose:
          scene.purpose,
        emotionalTarget:
          scene.emotionalTarget,
        entities:
          scene.entities,
        provenance:
          scene.provenance,
      },
    }),
  );
}

function model(
  storyValue: ExperienceStory,
  blueprintValue: ExperienceBlueprint,
  plan?: CognitiveExperiencePlan,
): ExperienceModel {
  return {
    title:
      storyValue.title,

    description:
      storyValue.logline,

    industry:
      "generic",

    goal:
      "storytelling",

    tone:
      blueprintValue.tone,

    moments:
      blueprintValue.moments,

    metadata: {
      category:
        "generated_story",

      tags: unique([
        "any-prompt",
        "evidence-driven",
        "no-template",
        "adaptive-story",
        "subject-native",
        "plan-native-realization",
        plan
          ? "cognitive-directed"
          : "substrate-only",
      ]),
    },
  };
}

export function compileStoryExperience(
  prompt: string,
  context: StoryCompilerContext = {},
): CompiledStoryExperience {
  /*
   * Cognitive plan is intentionally passed into the first semantic
   * observation boundary. This prevents later realization from having
   * to reconstruct what cognition already understood.
   */
  const observationValue =
    observe(prompt, context);

  const situationValue =
    situation(
      observationValue,
      context,
    );

  const candidateList =
    candidates(
      observationValue,
      situationValue,
      context.cognitivePlan,
    );

  const selectedCandidate =
    choose(
      candidateList,
      observationValue,
      context.cognitivePlan,
    );

  const toneValue =
    tone(observationValue);

  const storyValue =
    story(
      observationValue,
      situationValue,
      selectedCandidate,
      toneValue,
      context,
    );

  const genomeValue =
    genome(
      observationValue,
      storyValue,
      context,
    );

  const blueprintValue =
    blueprint(
      storyValue,
      observationValue,
      context.cognitivePlan,
    );

  const flowSteps =
    flow(storyValue);

  const momentList =
    moments(storyValue);

  const scenePlanValue =
    scenePlan(storyValue);

  const cinematicScenes =
    scenes(
      scenePlanValue,
      momentList,
    );

  const modelValue =
    model(
      storyValue,
      blueprintValue,
      context.cognitivePlan,
    );

  return {
    observation:
      observationValue,

    situation:
      situationValue,

    candidates:
      candidateList,

    genome:
      genomeValue,

    story:
      storyValue,

    blueprint:
      blueprintValue,

    flowSteps,

    moments:
      momentList,

    cinematicScenes,

    scenePlan:
      scenePlanValue,

    model:
      modelValue,

    title:
      storyValue.title,

    estimatedDuration:
      momentList.reduce(
        (total, moment) =>
          total +
          (moment.meta?.duration ??
            2200),
        0,
      ),

    momentCount:
      momentList.length,
  };
}