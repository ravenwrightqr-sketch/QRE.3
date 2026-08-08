import type {
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

/*
 * The compiler is deliberately domain-neutral.
 *
 * It does not ask "what template is this?". It asks:
 *
 *   What is observable?
 *   What can change?
 *   What can be felt?
 *   What can be revealed?
 *   Who is present?
 *   What can continue?
 *
 * The lexical rules below are evidence extractors, not story templates.
 * They only create signals. Narrative structure is selected later from the
 * joint signal state, and missing evidence is never silently promoted to fact.
 */

const STOP = new Set([
  "a", "an", "the", "and", "or", "but", "for", "with", "about", "this",
  "that", "into", "from", "make", "create", "something", "please", "experience",
  "story", "build", "want", "need", "give", "get", "tell", "show",
]);

const ACTIONS: Array<[RegExp, string]> = [
  [/\b(groom|grooming|groomer|trim|trimming|bathe|bathing)\b/i, "care"],
  [/\b(celebrate|celebrating|celebration)\b/i, "celebration"],
  [/\b(launch|launching|launched)\b/i, "launch"],
  [/\b(visit|visiting|visited|travel|traveling|trip|journey)\b/i, "movement"],
  [/\b(meet|meeting|met|connect|connecting|reconnect)\b/i, "connection"],
  [/\b(buy|buying|sell|selling|shop|shopping|purchase|product)\b/i, "commerce"],
  [/\b(teach|teaching|learn|learning|lesson|guide|practice)\b/i, "learning"],
  [/\b(play|playing|game|challenge|quest|race|compete)\b/i, "play"],
  [/\b(build|building|make|making|create|creating|design|designing|craft)\b/i, "creation"],
  [/\b(surprise|discover|explore|find|hidden|secret|mystery|uncover)\b/i, "discovery"],
  [/\b(cook|cooking|eat|eating|taste|tasting|drink|drinking|dinner|meal)\b/i, "gathering"],
  [/\b(perform|performing|sing|singing|dance|dancing|music|concert|show)\b/i, "performance"],
  [/\b(fix|repair|restore|restoring|solve|solving)\b/i, "repair"],
];

const CONTEXT: Array<[string, RegExp]> = [
  ["event", /\b(event|party|festival|concert|wedding|birthday|crowd|guests?|ceremony|conference|game)\b/i],
  ["place", /\b(venue|restaurant|bar|shop|store|home|park|beach|hotel|salon|museum|stadium|school|office|studio)\b/i],
  ["memory", /\b(memory|remember|past|history|childhood|legacy|forever|nostalgia|keepsake|milestone)\b/i],
  ["media", /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan)\b/i],
  ["work", /\b(project|meeting|business|office|client|customer|brand|product|team|launch)\b/i],
  ["play", /\b(fun|funny|playful|wild|game|challenge|quest|race|surprise)\b/i],
  ["relationship", /\b(friend|friends|family|partner|couple|daughter|son|mom|mother|dad|father|brother|sister|community)\b/i],
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

const unique = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];
const clean = (x: string) => x.replace(/\s+/g, " ").trim();
const lower = (x: string) => clean(x).toLowerCase();
const tokens = (x: string) => clean(x).split(/[^A-Za-z0-9'’-]+/).filter(Boolean);

function entities(prompt: string, context: StoryCompilerContext): ExperienceEntities {
  const text = clean(prompt);
  const lo = lower(text);

  const people = unique(
    (text.match(/\b(?:my|for|with|from|by)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})/g) ?? [])
      .map((x) => x.replace(/^\b(?:my|for|with|from|by)\s+/i, "")),
  );

  const dates = unique(text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) ?? []);
  const times = unique(text.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi) ?? []);
  const urls = unique(text.match(/https?:\/\/[^\s]+/gi) ?? []);
  const emails = unique(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []);
  const phones = unique(text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? []);

  const events = unique(
    lo.match(/\b(wedding|concert|festival|birthday|party|ceremony|event|show|conference|game)\b/g) ?? [],
  );

  const products = unique(
    lo.match(/\b(qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift)\b/g) ?? [],
  );

  const places = unique([
    ...(context.location?.label ? [context.location.label] : []),
    ...(text.match(/\b(?:at|in|near)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/g) ?? [])
      .map((x) => x.replace(/^\b(?:at|in|near)\s+/i, "")),
  ]);

  const media = /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan)\b/i.test(text)
    ? ["media"]
    : [];

  const keywords = unique(
    tokens(text)
      .map((x) => x.toLowerCase())
      .filter((x) => x.length > 2 && !STOP.has(x)),
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

function subject(prompt: string, entitiesValue: ExperienceEntities): string {
  const direct = prompt.match(
    /\b(?:for|about|with)\s+([^,.!?]+?)(?:\s+(?:about|at|in|on|tonight|today|now)\b|[,.!?]|$)/i,
  )?.[1];
  const possessive = prompt.match(/\bmy\s+([^,.!?]+?)(?:[,.!?]|$)/i)?.[1];

  if (direct && clean(direct).length <= 60) return clean(direct);
  if (possessive && clean(possessive).length <= 60) return clean(possessive);

  return (
    entitiesValue.people[0] ??
    entitiesValue.products[0] ??
    entitiesValue.events[0] ??
    tokens(prompt).filter((x) => !STOP.has(x.toLowerCase())).slice(0, 4).join(" ") ||
    "this moment"
  );
}

function activity(prompt: string): string {
  for (const [pattern, value] of ACTIONS) {
    if (pattern.test(prompt)) return value;
  }
  return "observation";
}

function contextKinds(prompt: string, context: StoryCompilerContext): string[] {
  const result = CONTEXT.filter(([, pattern]) => pattern.test(prompt)).map(([kind]) => kind);
  if (context.event) result.push("event");
  if (context.memories?.length) result.push("memory");
  if (context.location) result.push("place");
  return unique(result);
}

function emotions(prompt: string): string[] {
  return unique(EMOTIONS.filter(([pattern]) => pattern.test(prompt)).map(([, emotion]) => emotion));
}

function audience(prompt: string, context: StoryCompilerContext): string[] {
  const text = lower(prompt);
  if (
    context.event?.participants?.length ||
    /\b(everyone|crowd|guests?|fans?|people|community|group|team|together)\b/.test(text)
  ) return ["shared"];
  if (/\b(my|me|mine|personal|private|for me)\b/.test(text)) return ["personal"];
  return ["individual"];
}

function temporal(prompt: string, context: StoryCompilerContext): string[] {
  const text = lower(prompt);
  const result: string[] = [];
  if (/\b(now|today|tonight|live|currently|happening)\b/.test(text)) result.push("present");
  if (/\b(yesterday|last|past|ago|old|formerly|before)\b/.test(text)) result.push("past");
  if (/\b(tomorrow|next|future|soon|will|upcoming)\b/.test(text)) result.push("future");
  if (context.event?.timestamp) result.push("event_time");
  return unique(result);
}

function affordances(
  prompt: string,
  activityValue: string,
  contextKindsValue: string[],
  audienceValue: string[],
  temporalValue: string[],
  hasMemories: boolean,
): string[] {
  const text = lower(prompt);
  const result = new Set<string>();

  if (activityValue !== "observation") result.add("change");
  if (audienceValue[0] === "shared") result.add("connection");
  if (contextKindsValue.length) result.add("environment");
  if (hasMemories || temporalValue.includes("past")) result.add("continuity");
  if (temporalValue.includes("future")) result.add("anticipation");
  if (/\b(fun|funny|playful|wild|surprise|laugh)\b/.test(text)) result.add("play");
  if (/\b(mystery|secret|hidden|discover|explore|unknown|uncover)\b/.test(text)) result.add("reveal");
  if (/\b(remember|memory|forever|legacy|preserve|capture|keepsake)\b/.test(text)) result.add("preservation");
  if (/\b(boring|ordinary|routine|usual)\b/.test(text)) result.add("contrast");
  if (/\b(why|meaning|important|significant|matter)\b/.test(text)) result.add("meaning");
  if (/\b(game|challenge|quest|race|puzzle|competition)\b/.test(text)) result.add("challenge");
  if (/\b(choice|choose|decide|vote|pick)\b/.test(text)) result.add("choice");
  if (/\b(replay|again|return|next time)\b/.test(text)) result.add("replay");

  if (!result.size) {
    result.add("curiosity");
    result.add("payoff");
  }

  return [...result];
}

function observe(prompt: string, context: StoryCompilerContext): ExperienceObservation {
  const text = clean(prompt);
  if (!text) throw new Error("Experience prompt required.");

  const entitySet = entities(text, context);
  const subjectValue = subject(text, entitySet);
  const activityValue = activity(text);
  const contextValue = contextKinds(text, context);
  const emotionValue = emotions(text);
  const audienceValue = audience(text, context);
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
    ),
    evidence: [{ kind: "observed", source: "prompt", confidence: 1 }],
  };
}

function situation(observation: ExperienceObservation, context: StoryCompilerContext): StorySituation {
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
    ...(context.location?.label ? [context.location.label] : []),
  ]);

  const change = observation.activity === "observation"
    ? "attention shifts"
    : `${observation.activity} changes the situation`;

  const tension = /\b(boring|lost|missing|problem|hard|difficult|danger|unknown|mystery|risk)\b/i.test(observation.prompt)
    ? "something needs resolution"
    : observation.affordances.includes("contrast")
      ? "the ordinary needs a reason to matter"
      : "the moment has unrealized potential";

  const purpose = observation.affordances.includes("preservation")
    ? "preserve and deepen the experience"
    : observation.affordances.includes("play")
      ? "turn participation into memorable momentum"
      : "make the moment matter";

  return {
    subject: observation.subject,
    actors,
    activity: observation.activity,
    setting,
    temporal: observation.temporal,
    social,
    purpose,
    change,
    tension,
    signals: observation.entities.keywords.slice(0, 20).map((value, index) => ({
      value,
      source: "prompt",
      confidence: 0.8,
      salience: Math.max(0.2, 1 - index / 20),
    })),
  };
}

function tone(observation: ExperienceObservation): ExperienceTone[] {
  const result: string[] = [];
  if (observation.explicitEmotions.includes("joy") || observation.affordances.includes("play")) result.push("playful");
  if (observation.explicitEmotions.includes("love") || observation.explicitEmotions.includes("nostalgia")) result.push("emotional");
  if (observation.explicitEmotions.includes("excitement")) result.push("energetic");
  if (observation.explicitEmotions.includes("curiosity") || observation.affordances.includes("reveal")) result.push("mysterious");
  if (observation.explicitEmotions.includes("intensity")) result.push("dark");
  if (observation.explicitEmotions.includes("calm")) result.push("calm");

  if (result.length) return result as ExperienceTone[];
  return [observation.audience[0] === "shared" ? "friendly" : "cinematic"] as ExperienceTone[];
}

const provenance = (
  kind: StoryProvenance["kind"],
  source: string,
  confidence: number,
): StoryProvenance[] => [{ kind, source, confidence }];

/*
 * Narrative search is intentionally mathematical rather than categorical.
 * Each candidate is a sequence of operations over the same observed state.
 * Scores reward evidence coverage, coherence, payoff, and appropriate length.
 */
function score(
  beats: StoryBeatKind[],
  observation: ExperienceObservation,
  situationValue: StorySituation,
): number {
  const affordanceSet = new Set(observation.affordances);
  const compatibility: Record<StoryBeatKind, string[]> = {
    orientation: ["environment", "continuity", "anticipation"],
    hook: ["change", "contrast", "play", "curiosity"],
    encounter: ["connection", "environment", "relationship"],
    escalation: ["challenge", "play", "connection", "change"],
    discovery: ["reveal", "curiosity", "meaning"],
    transformation: ["change", "contrast", "learning"],
    payoff: ["payoff", "play", "meaning", "preservation"],
    reflection: ["meaning", "preservation", "continuity", "relationship"],
    continuation: ["continuity", "anticipation", "preservation", "replay"],
  };

  let value = 0;
  const covered = new Set<string>();

  for (const beat of beats) {
    for (const signal of compatibility[beat] ?? []) {
      if (affordanceSet.has(signal)) {
        value += 1.35;
        covered.add(signal);
      }
    }
  }

  if (beats.includes("payoff")) value += 1.6;
  if (beats.includes("orientation") && situationValue.setting.length) value += 0.8;
  if (beats.includes("encounter") && situationValue.actors.length) value += 0.9;
  if (beats.includes("escalation") && situationValue.social === "shared") value += 1.1;
  if (beats.includes("reflection") && (observation.context.includes("memory") || observation.explicitEmotions.length)) value += 1.5;
  if (beats.includes("transformation") && observation.activity !== "observation") value += 1.2;
  if (beats.includes("continuation") && (observation.temporal.includes("future") || observation.context.includes("memory"))) value += 1.1;

  // Reward evidence coverage, penalize unsupported theatrical machinery.
  value += covered.size * 0.35;
  value -= Math.max(0, beats.length - 7) * 0.6;
  value += beats.length >= 2 && beats.length <= 7 ? 0.8 : 0;

  return Number(value.toFixed(3));
}

function candidates(
  observation: ExperienceObservation,
  situationValue: StorySituation,
): Candidate[] {
  const pool: Array<[string, StoryBeatKind[], string]> = [
    ["momentum", ["orientation", "hook", "escalation", "payoff"], "Build energy around the observed action."],
    ["reveal", ["orientation", "hook", "discovery", "payoff"], "Use curiosity to expose a second layer."],
    ["change", ["orientation", "hook", "transformation", "payoff"], "Make observable change the story engine."],
    ["memory", ["orientation", "encounter", "reflection", "payoff", "continuation"], "Connect present evidence to continuity."],
    ["play", ["hook", "encounter", "escalation", "payoff"], "Use participation and play as momentum."],
    ["meaning", ["orientation", "discovery", "reflection", "payoff"], "Move from surface detail toward significance."],
    ["relationship", ["orientation", "encounter", "transformation", "payoff", "continuation"], "Let people and their interaction carry the change."],
    ["minimal", ["hook", "payoff"], "Respect sparse prompts instead of inventing a universe."],
  ];

  return pool
    .map(([id, beats, rationale]) => ({
      id,
      beats,
      score: score(beats, observation, situationValue),
      rationale,
      evidence: provenance("inferred", `candidate:${id}`, 0.7),
    }))
    .sort((a, b) => b.score - a.score);
}

function choose(candidatesValue: Candidate[], observation: ExperienceObservation): Candidate {
  const preference = observation.affordances.includes("play")
    ? "play"
    : observation.affordances.includes("preservation")
      ? "memory"
      : observation.affordances.includes("reveal")
        ? "reveal"
        : observation.activity !== "observation"
          ? "change"
          : "minimal";

  const best = candidatesValue[0];
  const preferred = candidatesValue.find((candidate) => candidate.id === preference);

  if (!preferred) return best;
  return preferred.score >= best.score - 1.4 ? preferred : best;
}

function beatText(
  kind: StoryBeatKind,
  observation: ExperienceObservation,
  situationValue: StorySituation,
  toneValue: ExperienceTone[],
): string {
  const subjectValue = observation.subject;
  const nouns = observation.entities.keywords.filter((word) => word !== lower(subjectValue)).slice(0, 4);
  const detail = nouns.length ? nouns.join(", ") : "the detail already in front of us";
  const social = situationValue.social === "shared"
    ? "the people around the moment"
    : "the person inside the moment";
  const playful = toneValue.includes("playful");

  switch (kind) {
    case "orientation":
      return `Begin with ${subjectValue}, ${observation.activity === "observation" ? "and notice what is already there" : `in the middle of ${observation.activity}`}.`;
    case "hook":
      return playful
        ? `There is a small opening for mischief: ${detail} can become more interesting than expected.`
        : `One detail deserves the foreground: ${detail}.`;
    case "encounter":
      return situationValue.actors.length
        ? `${social} enters the frame, giving ${subjectValue} something to respond to.`
        : `${subjectValue} encounters a detail that changes what the moment can become.`;
    case "escalation":
      return situationValue.social === "shared"
        ? `The energy rises as everyone gets pulled a little closer to the action.`
        : `The moment gains momentum; a simple action now has somewhere to go.`;
    case "discovery":
      return observation.affordances.includes("reveal")
        ? `Look again: the obvious layer is not the whole story.`
        : `A second meaning appears when the ordinary detail is given attention.`;
    case "transformation":
      return observation.activity === "observation"
        ? `Nothing needs to be invented here; the transformation is the shift in attention itself.`
        : `${subjectValue} is no longer quite where the moment began. ${cap(observation.activity)} has changed the state of the experience.`;
    case "payoff":
      return playful
        ? `And that is the fun of it: the original moment was enough. It only needed the right turn to become memorable.`
        : `The moment lands because the payoff grows from what was actually given, rather than from a borrowed template.`;
    case "reflection":
      return observation.explicitEmotions.length
        ? `The experience echoes ${observation.explicitEmotions.join(" and ")}; that feeling becomes part of what remains.`
        : `The experience leaves a question behind: what made this particular moment worth noticing?`;
    case "continuation":
      return `The story stays open. A future interaction, replay, or new piece of evidence can change what it means next time.`;
  }
}

function makeBeat(
  kind: StoryBeatKind,
  index: number,
  observation: ExperienceObservation,
  situationValue: StorySituation,
  toneValue: ExperienceTone[],
): StoryBeat {
  const observed = provenance("observed", "prompt", 1);
  const inferred = provenance("inferred", "narrative_search", 0.72);
  const playful = provenance("playful", "story_realization", 0.58);

  return {
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: `Advance the experience through ${kind} using available evidence.`,
    text: beatText(kind, observation, situationValue, toneValue),
    entities: unique([
      observation.subject,
      ...observation.entities.keywords.slice(0, 4),
      ...situationValue.actors.slice(0, 2),
    ]),
    emotionalTarget: toneValue[0] ?? "curiosity",
    provenance: kind === "payoff"
      ? [...observed, ...playful]
      : kind === "orientation"
        ? observed
        : [...observed, ...inferred],
  };
}

const cap = (value: string) => value
  ? value.charAt(0).toUpperCase() + value.slice(1)
  : "The Moment";

function title(
  subjectValue: string,
  observation: ExperienceObservation,
  candidate: Candidate,
): string {
  const subjectTitle = cap(subjectValue.replace(/^the\s+/i, ""));

  if (candidate.id === "play") return `${subjectTitle} Gets Interesting`;
  if (candidate.id === "change") return `${subjectTitle} Changes`;
  if (candidate.id === "memory") return `${subjectTitle}: Worth Keeping`;
  if (candidate.id === "reveal") return `${subjectTitle}: Look Again`;
  if (candidate.id === "relationship") return `${subjectTitle}: Together`;
  if (observation.activity !== "observation") return `${subjectTitle}: ${cap(observation.activity)}`;
  return `${subjectTitle}: The Moment`;
}

function story(
  observation: ExperienceObservation,
  situationValue: StorySituation,
  candidate: Candidate,
  toneValue: ExperienceTone[],
  context: StoryCompilerContext,
): ExperienceStory {
  const beats = candidate.beats.map((kind, index) =>
    makeBeat(kind, index, observation, situationValue, toneValue),
  );
  const name = title(observation.subject, observation, candidate);
  const ending = beats.find((beat) => beat.kind === "payoff")?.text
    ?? beats.at(-1)?.text
    ?? "The moment continues.";

  const continuity = context.memories?.length
    ? " Existing memory adds context without replacing the present moment."
    : "";

  return {
    title: name,
    hook: beats[0]?.text ?? "A moment begins.",
    logline: `${name} turns observed detail into a variable, evidence-aware experience.${continuity}`,
    beats,
    ending,
    continuation: beats.find((beat) => beat.kind === "continuation")?.text,
    tone: toneValue,
    provenance: [...observation.evidence, ...candidate.evidence],
  };
}

function genome(
  observation: ExperienceObservation,
  storyValue: ExperienceStory,
  context: StoryCompilerContext,
): ExperienceGenome {
  const interpretation: SemanticInterpretation = {
    intent: ["experience_creation"],
    concepts: unique([observation.activity, ...observation.affordances]),
    emotionalSignals: observation.explicitEmotions,
    worldSignals: observation.context,
    cognitiveSignals: ["observation", "evidence_weighting", "candidate_search", "variable_beats"],
    confidence: 0.8,
  };

  const meaning: ExperienceMeaning = {
    why: storyValue.logline,
    emotions: observation.explicitEmotions,
    memories: context.memories?.map((memory) => memory.summary) ?? [],
    desiredFeeling: observation.explicitEmotions.length
      ? observation.explicitEmotions
      : ["curiosity"],
    transformation: storyValue.ending,
  };

  const journey: ExperienceGenome["journey"] = storyValue.beats.flatMap((beat) => {
    switch (beat.kind) {
      case "orientation": return ["arrival"];
      case "discovery": return ["discovery"];
      case "transformation": return ["transformation"];
      case "escalation": return ["peak"];
      case "reflection": return ["memory"];
      case "continuation": return ["return"];
      default: return [];
    }
  });

  return {
    intent: ["experience_creation"],
    interpretation,
    archetypes: [],
    themes: observation.context,
    emotions: observation.explicitEmotions,
    meaning,
    relationships: [],
    energy: storyValue.tone.includes("playful")
      ? "playful"
      : storyValue.tone.includes("energetic")
        ? "intense"
        : storyValue.tone.includes("mysterious")
          ? "mysterious"
          : "emotional",
    pacing: storyValue.tone.includes("energetic") ? "fast" : "medium",
    social: observation.audience.includes("shared") ? "shared" : "solo",
    journey: unique(journey) as ExperienceGenome["journey"],
    discovery: observation.affordances.includes("reveal") || observation.affordances.includes("curiosity") ? 0.85 : 0.45,
    memory: context.memories?.length || observation.context.includes("memory") ? 0.9 : 0,
    commerce: observation.activity === "commerce" ? 0.8 : 0,
    immersion: observation.context.includes("media") ? 0.8 : 0.4,
    interaction: observation.affordances.includes("play") || observation.audience.includes("shared") ? 0.75 : 0.25,
    replay: observation.context.includes("memory") || observation.context.includes("media") ? 0.8 : 0.25,
    entities: observation.entities,
    environments: observation.context,
    audience: observation.audience,
    dna: unique([
      "adaptive",
      "subject-native",
      "evidence-driven",
      "variable-length",
      "memory-as-context",
      "event-as-context",
      ...observation.affordances,
    ]),
  };
}

function blueprint(
  storyValue: ExperienceStory,
  observation: ExperienceObservation,
): ExperienceBlueprint {
  const moments: ExperienceMoment[] = storyValue.beats.map((beat) => ({
    type: "story",
    component: "story",
    title: beat.kind === "orientation" ? storyValue.title : cap(beat.kind),
    subtitle: beat.emotionalTarget,
    description: beat.text,
    editable: true,
    demo: false,
    order: beat.order,
    payload: {
      beatId: beat.id,
      purpose: beat.purpose,
      entities: beat.entities,
      provenance: beat.provenance,
    },
  }));

  return {
    title: storyValue.title,
    type: "story",
    tone: storyValue.tone,
    meaning: {
      why: storyValue.logline,
      emotions: observation.explicitEmotions,
      memories: [],
      desiredFeeling: storyValue.tone,
      transformation: storyValue.ending,
    },
    moments,
    entities: observation.entities,
    metadata: {
      themes: observation.context,
      dna: ["evidence-driven", "no-template", ...observation.affordances],
    },
  };
}

function flow(storyValue: ExperienceStory): FlowStep[] {
  return storyValue.beats.map((beat) => ({
    id: beat.id,
    order: beat.order,
    type: "story",
    payload: { beat },
  }));
}

function moments(storyValue: ExperienceStory): Moment[] {
  return storyValue.beats.map((beat) => ({
    type: "message",
    order: beat.order,
    text: beat.text,
    meta: {
      duration: beat.kind === "payoff" ? 2800 : 2200,
      beatId: beat.id,
      beatKind: beat.kind,
      emotionalTarget: beat.emotionalTarget,
      entities: beat.entities,
      provenance: beat.provenance,
    },
  }));
}

function scenePlan(storyValue: ExperienceStory): StoryScenePlan[] {
  return storyValue.beats.map((beat) => ({
    id: `scene-${beat.id}`,
    order: beat.order,
    beatId: beat.id,
    purpose: beat.purpose,
    text: beat.text,
    emotionalTarget: beat.emotionalTarget,
    entities: beat.entities,
    duration: beat.kind === "payoff" ? 2800 : 2200,
    transition: beat.kind === "hook" ? "zoom" : beat.kind === "payoff" ? "cinematic" : "fade",
    visual: {
      theme: "cinematic",
      animation: beat.kind === "hook"
        ? "slow_zoom"
        : beat.kind === "escalation"
          ? "parallax"
          : "none",
    },
    audio: {
      type: "ambient",
      mood: beat.emotionalTarget,
    },
    provenance: beat.provenance,
  }));
}

function scenes(plan: StoryScenePlan[], momentList: Moment[]): CinematicScene[] {
  return plan.map((scene, index) => ({
    id: scene.id,
    type: "emotion",
    duration: scene.duration,
    moment: momentList[index],
    order: index,
    transition: scene.transition,
    visual: scene.visual,
    audio: scene.audio
      ? { type: scene.audio.type, url: "", volume: 0.7, autoplay: true }
      : undefined,
    preload: index < plan.length - 1,
    meta: {
      source: "story_compiler",
      purpose: scene.purpose,
      emotionalTarget: scene.emotionalTarget,
      entities: scene.entities,
      provenance: scene.provenance,
    },
  }));
}

function model(
  storyValue: ExperienceStory,
  blueprintValue: ExperienceBlueprint,
): ExperienceModel {
  return {
    title: storyValue.title,
    description: storyValue.logline,
    industry: "generic",
    goal: "storytelling",
    tone: blueprintValue.tone,
    moments: blueprintValue.moments,
    metadata: {
      category: "generated_story",
      tags: ["any-prompt", "evidence-driven", "no-template", "adaptive-story"],
    },
  };
}

export function compileStoryExperience(
  prompt: string,
  context: StoryCompilerContext = {},
): CompiledStoryExperience {
  const observationValue = observe(prompt, context);
  const situationValue = situation(observationValue, context);
  const candidateList = candidates(observationValue, situationValue);
  const selectedCandidate = choose(candidateList, observationValue);
  const toneValue = tone(observationValue);
  const storyValue = story(
    observationValue,
    situationValue,
    selectedCandidate,
    toneValue,
    context,
  );
  const genomeValue = genome(observationValue, storyValue, context);
  const blueprintValue = blueprint(storyValue, observationValue);
  const flowSteps = flow(storyValue);
  const momentList = moments(storyValue);
  const scenePlanValue = scenePlan(storyValue);
  const cinematicScenes = scenes(scenePlanValue, momentList);
  const modelValue = model(storyValue, blueprintValue);

  return {
    observation: observationValue,
    situation: situationValue,
    candidates: candidateList,
    genome: genomeValue,
    story: storyValue,
    blueprint: blueprintValue,
    flowSteps,
    moments: momentList,
    cinematicScenes,
    scenePlan: scenePlanValue,
    model: modelValue,
    title: storyValue.title,
    estimatedDuration: momentList.reduce(
      (total, moment) => total + (moment.meta?.duration ?? 2200),
      0,
    ),
    momentCount: momentList.length,
  };
}
