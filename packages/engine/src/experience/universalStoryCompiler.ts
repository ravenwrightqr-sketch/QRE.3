import { realizePremiseBeat } from "./premiseRealizer.js";
import { composeCognitiveTrajectory } from "./cognitiveTrajectory.js";
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
  "a", "an", "the", "and", "or", "but", "for", "with", "about",
  "this", "that", "into", "from", "make", "create", "something",
  "please", "experience", "story", "build", "want", "need", "give",
  "get", "tell", "show", "i", "my", "me", "to", "is", "are", "was",
  "were", "be", "has", "have", "had", "just", "than", "then",
]);

const unique = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const tokens = (value: string) =>
  clean(value).split(/[^A-Za-z0-9'’-]+/).filter(Boolean);
const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The Moment";

function entities(
  prompt: string,
  context: StoryCompilerContext,
): ExperienceEntities {
  const text = clean(prompt);
  const lo = lower(text);
  const people = unique(
    (text.match(
      /\b(?:my|our|with|from|by)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})/g,
    ) ?? []).map((value) =>
      value.replace(/^\b(?:my|our|with|from|by)\s+/i, ""),
    ),
  );
  const dates = unique(text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) ?? []);
  const times = unique(text.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi) ?? []);
  const urls = unique(text.match(/https?:\/\/[^\s]+/gi) ?? []);
  const emails = unique(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []);
  const phones = unique(text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? []);
  const events = unique(lo.match(
    /\b(wedding|concert|festival|birthday|party|ceremony|event|show|conference|convention|expo|exposition|rave|nightclub|club|anniversary|memorial|gathering|meetup|fair|tournament|showcase|opening|launch|premiere|parade|carnival|retreat|summit)\b/g,
  ) ?? []);
  const products = unique(lo.match(
    /\b(qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|pick|jewelry|artwork|artifact|portal|token|totem|emblem|installation|tattoo)\b/g,
  ) ?? []);
  const places = unique([
    ...(context.location?.label ? [context.location.label] : []),
    ...(context.location?.city ? [context.location.city] : []),
    ...(context.event?.venue ? [context.event.venue] : []),
    ...(text.match(/\b(?:at|in|near)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/g) ?? [])
      .map((value) => value.replace(/^\b(?:at|in|near)\s+/i, "")),
  ]);
  const media = /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan)\b/i.test(text)
    ? ["media"]
    : [];
  const keywords = unique(
    tokens(text)
      .map((value) => value.toLowerCase())
      .filter((value) => value.length > 2 && !STOP.has(value)),
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

function subject(
  prompt: string,
  value: ExperienceEntities,
  plan?: CognitiveExperiencePlan,
): string {
  const cognitiveSubject = clean(plan?.centralSubject ?? "");
  const text = clean(prompt);
  const mediumOnly = /^(?:qr|nfc|scan|scannable|tag|code|barcode)$/i.test(cognitiveSubject);
  if (cognitiveSubject && !mediumOnly) return cognitiveSubject;

  const audienceWords = new Set([
    "everyone", "everybody", "people", "someone", "users", "customers",
    "guests", "visitors", "friends", "family", "families", "children",
    "kids", "participants", "members", "players", "fans", "attendees",
  ]);
  const direct = clean(text.match(
    /\b(?:for|about|with)\s+([^,.!?]+?)(?=\s+(?:at|in|on|during|tonight|today|now)\b|[,.!?]|$)/i,
  )?.[1] ?? "");
  if (direct && direct.length <= 80 && !audienceWords.has(direct.toLowerCase())) {
    return direct;
  }

  const audienceContext = text.match(
    /\b(?:for|with)\s+(?:all\s+the\s+|the\s+)?([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*)*)\s+(?:at|in|on|during)\s+(?:my|our|the|this|that)?\s*([^,.!?]+?)(?:\s+(?:tonight|today|now)\b|[,.!?]|$)/i,
  );
  if (audienceContext) {
    const audienceValue = clean(audienceContext[1] ?? "");
    const contextValue = clean(audienceContext[2] ?? "");
    if (audienceWords.has(audienceValue.toLowerCase()) && contextValue && contextValue.length <= 80) {
      return contextValue;
    }
  }

  const possessive = clean(text.match(/\bmy\s+([^,.!?]+?)(?:[,.!?]|$)/i)?.[1] ?? "");
  if (possessive && possessive.length <= 80 && !audienceWords.has(possessive.toLowerCase())) {
    return possessive;
  }

  return value.products[0] ?? value.events[0] ?? value.places[0] ?? value.people[0] ??
    tokens(prompt)
      .filter((word) => !STOP.has(word.toLowerCase()))
      .filter((word) => !audienceWords.has(word.toLowerCase()))
      .slice(0, 5)
      .join(" ") || "this moment";
}

function activity(prompt: string, plan?: CognitiveExperiencePlan): string {
  const direction = lower(plan?.direction ?? "");
  const directionActivity: Record<string, string> = {
    utility: "guidance", game: "play", discovery: "discovery", memory: "remembering",
    social: "connection", commerce: "return", journey: "movement", identity: "identity",
    story: "story", transformation: "change",
  };
  if (directionActivity[direction]) return directionActivity[direction];

  const patterns: Array<[RegExp, string]> = [
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
  return patterns.find(([pattern]) => pattern.test(prompt))?.[1] ?? "observation";
}

function contextKinds(prompt: string, context: StoryCompilerContext): string[] {
  const patterns: Array<[string, RegExp]> = [
    ["event", /\b(event|party|festival|concert|wedding|birthday|crowd|guests?|ceremony|conference|rave|nightclub|convention|expo)\b/i],
    ["place", /\b(venue|restaurant|bar|shop|store|home|park|beach|hotel|salon|museum|stadium|school|office|studio|gas station)\b/i],
    ["memory", /\b(memory|memorial|remember|past|history|childhood|legacy|forever|nostalgia|keepsake|milestone|preserve)\b/i],
    ["media", /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan|guitar|pick)\b/i],
    ["work", /\b(project|meeting|business|office|client|customer|brand|product|team|launch|shop)\b/i],
    ["relationship", /\b(friend|friends|family|partner|couple|daughter|son|mom|mother|dad|father|brother|sister|community)\b/i],
  ];
  return unique([
    ...patterns.filter(([, pattern]) => pattern.test(prompt)).map(([kind]) => kind),
    ...(context.event ? ["event"] : []),
    ...(context.memories?.length ? ["memory"] : []),
    ...(context.location ? ["place"] : []),
  ]);
}

function emotions(prompt: string): string[] {
  const patterns: Array<[RegExp, string]> = [
    [/\b(fun|funny|playful|joy|happy|delight|laugh|laughter)\b/i, "joy"],
    [/\b(love|romantic|beloved|affection|care)\b/i, "love"],
    [/\b(excited|excitement|hype|thrill|energy|electric)\b/i, "excitement"],
    [/\b(calm|peaceful|quiet|gentle|serene)\b/i, "calm"],
    [/\b(nostalgia|nostalgic|sentimental|remember)\b/i, "nostalgia"],
    [/\b(mystery|mysterious|secret|hidden|unknown|curious|curiosity)\b/i, "curiosity"],
    [/\b(scary|dark|creepy|danger|intense|urgent)\b/i, "intensity"],
    [/\b(proud|pride|accomplished|achievement|victory)\b/i, "pride"],
  ];
  return unique(patterns.filter(([pattern]) => pattern.test(prompt)).map(([, value]) => value));
}

function audience(prompt: string, context: StoryCompilerContext, plan?: CognitiveExperiencePlan): string[] {
  const planned = unique(plan?.audience ?? []);
  if (planned.length) return planned;
  const text = lower(prompt);
  if (context.event?.participants?.length || /\b(everyone|crowd|guests?|fans?|people|community|group|team|together)\b/.test(text)) return ["shared"];
  if (/\b(my|me|mine|personal|private|for me)\b/.test(text)) return ["personal"];
  return ["individual"];
}

function temporal(prompt: string, context: StoryCompilerContext): string[] {
  const text = lower(prompt);
  return unique([
    /\b(now|today|tonight|live|currently|happening)\b/.test(text) ? "present" : "",
    /\b(yesterday|last|past|ago|old|formerly|before)\b/.test(text) ? "past" : "",
    /\b(tomorrow|next|future|soon|will|upcoming)\b/.test(text) ? "future" : "",
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
  if (plan?.dynamicBehavior.length) result.add("adaptation");
  if (plan?.futureEvolution.length) result.add("evolution");
  if (plan?.discoveryModel.length) result.add("discovery");
  if (plan?.rewardModel.length) result.add("reward");
  if (plan?.progressionModel.length) result.add("progression");
  if (plan?.commerceModel.length) result.add("commerce");
  return [...result, ...(result.size ? [] : ["curiosity", "payoff"] )];
}

function observe(prompt: string, context: StoryCompilerContext): ExperienceObservation {
  const text = clean(prompt);
  if (!text) throw new Error("Experience prompt required.");
  const entitySet = entities(text, context);
  const subjectValue = subject(text, entitySet, context.cognitivePlan);
  const activityValue = activity(text, context.cognitivePlan);
  const contextValue = contextKinds(text, context);
  const emotionValue = emotions(text);
  const audienceValue = audience(text, context, context.cognitivePlan);
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
    affordances: affordances(text, activityValue, contextValue, audienceValue, temporalValue, Boolean(context.memories?.length), context.cognitivePlan),
    evidence: [{ kind: "observed", source: "prompt", confidence: 1 }],
  };
}

function situation(observation: ExperienceObservation, context: StoryCompilerContext): StorySituation {
  const social: StorySituation["social"] = observation.audience[0] === "shared" ? "shared" : observation.audience[0] === "personal" ? "solo" : "unknown";
  const actors = unique([...observation.entities.people, ...(context.event?.participants ?? [])]);
  const setting = unique([...observation.context, ...(context.event?.venue ? [context.event.venue] : []), ...(context.location?.label ? [context.location.label] : [])]);
  const plan = context.cognitivePlan;
  return {
    subject: observation.subject,
    actors,
    activity: observation.activity,
    setting,
    temporal: observation.temporal,
    social,
    purpose: plan?.purpose ?? "",
    change: plan?.interactionModel[0] ?? observation.activity,
    tension: /\b(boring|lost|missing|problem|hard|difficult|danger|unknown|mystery|risk)\b/i.test(observation.prompt) ? "resolution" : "",
    signals: observation.entities.keywords.slice(0, 20).map((value, index) => ({ value, source: "prompt", confidence: 0.8, salience: Math.max(0.2, 1 - index / 20) })),
  };
}

function tone(observation: ExperienceObservation): ExperienceTone[] {
  const result: ExperienceTone[] = [];
  if (observation.explicitEmotions.includes("joy") || observation.affordances.includes("play")) result.push("playful");
  if (observation.explicitEmotions.includes("love") || observation.explicitEmotions.includes("nostalgia")) result.push("emotional");
  if (observation.explicitEmotions.includes("excitement")) result.push("energetic");
  if (observation.explicitEmotions.includes("curiosity") || observation.affordances.includes("reveal")) result.push("mysterious");
  if (observation.explicitEmotions.includes("intensity")) result.push("dark");
  if (observation.explicitEmotions.includes("calm")) result.push("cinematic");
  return (result.length ? result : ["cinematic"]) as ExperienceTone[];
}

const provenance = (kind: StoryProvenance["kind"], source: string, confidence: number): StoryProvenance[] => [{ kind, source, confidence }];

function score(beats: StoryBeatKind[], observation: ExperienceObservation, situationValue: StorySituation, plan?: CognitiveExperiencePlan): number {
  const signals = new Set(observation.affordances);
  let value = beats.includes("payoff") ? 1.6 : 0;
  const compatibility: Partial<Record<StoryBeatKind, string[]>> = {
    orientation: ["environment", "continuity", "anticipation"], hook: ["change", "contrast", "play", "curiosity"], need: ["meaning", "challenge", "choice", "payoff"],
    threshold: ["reveal", "curiosity", "environment", "discovery"], origin: ["continuity", "preservation", "meaning"], encounter: ["connection", "environment", "continuity"],
    challenge: ["challenge", "play", "choice", "progression"], discovery: ["reveal", "curiosity", "meaning", "discovery"], reveal: ["reveal", "curiosity", "discovery"],
    instruction: ["meaning", "payoff", "change"], action: ["change", "challenge", "play", "choice"], feedback: ["change", "progression", "payoff"],
    contribution: ["connection", "choice", "play"], escalation: ["challenge", "play", "connection", "change"], transformation: ["change", "contrast", "meaning"],
    reflection: ["meaning", "preservation", "continuity"], identity: ["meaning", "preservation", "connection"], milestone: ["progression", "payoff", "change"],
    unlock: ["reward", "progression", "discovery"], earned_access: ["reward", "progression", "discovery"], next_step: ["payoff", "progression", "anticipation", "evolution"],
    continuation: ["continuity", "anticipation", "preservation", "replay", "evolution"],
  };
  for (const beat of beats) for (const signal of compatibility[beat] ?? []) if (signals.has(signal)) value += 1.35;
  if (beats.includes("orientation") && situationValue.setting.length) value += 0.8;
  if (beats.includes("encounter") && situationValue.actors.length) value += 0.9;
  if (beats.includes("reflection") && (observation.context.includes("memory") || observation.explicitEmotions.length)) value += 1.5;
  if (beats.includes("transformation") && observation.activity !== "observation") value += 1.2;
  if (beats.includes("continuation") && (observation.temporal.includes("future") || observation.context.includes("memory"))) value += 1.1;
  if (plan) {
    if (plan.interactionModel.length && beats.some((beat) => ["encounter", "discovery", "action", "challenge", "instruction", "contribution"].includes(beat))) value += plan.interactionModel.length * 0.18;
    if (plan.futureEvolution.length && beats.includes("continuation")) value += plan.futureEvolution.length * 0.35;
    if (plan.rewardModel.length && beats.some((beat) => ["payoff", "unlock", "earned_access"].includes(beat))) value += plan.rewardModel.length * 0.3;
    if (plan.creativePossibilities.length && beats.some((beat) => ["discovery", "hook", "reveal"].includes(beat))) value += plan.creativePossibilities.length * 0.15;
  }
  value += beats.length >= 2 && beats.length <= 7 ? 0.8 : 0;
  value -= Math.max(0, beats.length - 7) * 0.6;
  return Number(value.toFixed(3));
}

function candidates(observation: ExperienceObservation, situationValue: StorySituation, plan?: CognitiveExperiencePlan): Candidate[] {
  const pool: Array<[string, StoryBeatKind[], string]> = [
    ["momentum", ["orientation", "hook", "escalation", "payoff"], "Observed action gains momentum."],
    ["reveal", ["orientation", "hook", "discovery", "payoff"], "Observed detail becomes newly visible."],
    ["change", ["orientation", "hook", "transformation", "payoff"], "Observable change carries the experience."],
    ["memory", ["orientation", "encounter", "reflection", "payoff", "continuation"], "Present evidence connects to continuity."],
    ["play", ["hook", "encounter", "escalation", "payoff"], "Participation carries the experience."],
    ["relationship", ["orientation", "encounter", "transformation", "payoff", "continuation"], "People and interaction carry change."],
    ["minimal", ["hook", "payoff"], "Sparse prompts stay sparse."],
  ];
  const trajectory = composeCognitiveTrajectory({ plan });
  if (trajectory.beats.length) pool.push(["cognitive-derived", trajectory.beats, trajectory.rationale.join(" ")]);
  return pool.map(([id, beats, rationale]) => ({
    id,
    beats,
    score: score(beats, observation, situationValue, plan),
    rationale,
    evidence: provenance("inferred", `candidate:${id}`, id === "cognitive-derived" ? 0.96 : 0.7),
  })).sort((a, b) => b.score - a.score);
}

function choose(list: Candidate[], plan?: CognitiveExperiencePlan): Candidate {
  if (!list.length) throw new Error("Story compiler produced no candidates.");
  if (plan) {
    const cognitive = list.find((candidate) => candidate.id === "cognitive-derived");
    if (cognitive) return cognitive;
  }
  return list[0];
}

/**
 * The universal compiler creates a factual beat shell.
 * It does not write presentation prose here.
 *
 * Presentation belongs exclusively to premiseRealizer.ts:
 * cognition → trajectory → beat shell → premise realization → runtime.
 */
function beatSeed(kind: StoryBeatKind, observation: ExperienceObservation, plan?: CognitiveExperiencePlan): string {
  const subjectValue = observation.subject;
  const concrete = unique([
    plan?.premise?.slots
      .filter((slot) => ["event", "artifact", "medium", "place", "temporal", "outcome", "transformation", "affordance"].includes(slot.role))
      .flatMap((slot) => slot.values)
      .filter((value): value is string => typeof value === "string") ?? [],
    observation.entities.events,
    observation.entities.products,
    observation.entities.places,
    observation.entities.media,
    observation.entities.keywords.slice(0, 6),
  ]);
  const anchor = concrete.find((value) => lower(value) !== lower(subjectValue)) ?? "";
  return anchor ? `${kind}: ${subjectValue}; ${anchor}` : `${kind}: ${subjectValue}`;
}

function beatPurpose(kind: StoryBeatKind, plan?: CognitiveExperiencePlan): string {
  const directive = plan?.realization?.directives.find((item) => item.kind === kind);
  return directive?.action?.trim() || kind;
}

function makeBeat(kind: StoryBeatKind, index: number, observation: ExperienceObservation, toneValue: ExperienceTone[], plan?: CognitiveExperiencePlan): StoryBeat {
  const rawBeat: StoryBeat = {
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: beatPurpose(kind, plan),
    text: beatSeed(kind, observation, plan),
    entities: unique([
      observation.subject,
      ...observation.entities.events,
      ...observation.entities.products,
      ...observation.entities.places,
      ...observation.entities.media,
      ...observation.entities.keywords,
    ]),
    emotionalTarget: toneValue[0] ?? "curiosity",
    provenance: [
      ...provenance("observed", "prompt", 1),
      ...(plan ? provenance("inferred", "cognitive_plan", 0.96) : provenance("inferred", "universal_story_compiler", 0.72)),
    ],
  };
  return { ...rawBeat, text: realizePremiseBeat(rawBeat, plan) };
}

function title(subjectValue: string, candidate: Candidate): string {
  const base = cap(subjectValue.replace(/^the\s+/i, ""));
  if (candidate.id === "play") return `${base} Gets Interesting`;
  if (candidate.id === "change") return `${base} Changes`;
  if (candidate.id === "reveal") return `${base}: Beyond the Surface`;
  return `${base}: The Moment`;
}

function story(observation: ExperienceObservation, situationValue: StorySituation, candidate: Candidate, toneValue: ExperienceTone[], context: StoryCompilerContext): ExperienceStory {
  const beats = candidate.beats.map((kind, index) => makeBeat(kind, index, observation, toneValue, context.cognitivePlan));
  const name = title(observation.subject, candidate);
  const ending = beats.find((beat) => beat.kind === "payoff")?.text ?? beats.at(-1)?.text ?? "The moment continues.";
  return {
    title: name,
    hook: beats[0]?.text ?? "A moment begins.",
    logline: context.cognitivePlan?.purpose ?? `${name} is compiled from observed evidence.`,
    beats,
    ending,
    continuation: beats.find((beat) => beat.kind === "continuation")?.text,
    tone: toneValue,
    provenance: [...observation.evidence, ...candidate.evidence],
  };
}

function genome(observation: ExperienceObservation, storyValue: ExperienceStory, context: StoryCompilerContext): ExperienceGenome {
  const plan = context.cognitivePlan;
  const interpretation: SemanticInterpretation = {
    intent: [plan?.direction ?? "experience_creation"],
    concepts: unique([observation.subject, observation.activity, ...observation.affordances, ...(plan?.direction ? [plan.direction] : [])]),
    emotionalSignals: unique([...observation.explicitEmotions, ...(plan?.emotionalIntent ?? [])]),
    worldSignals: observation.context,
    cognitiveSignals: ["observation", "evidence_weighting", "candidate_search", "cognitive_direction", "cognitive_subject_authority", "plan_native_structure", "single_realization_boundary", "variable_beats"],
    confidence: plan ? 0.92 : 0.82,
  };
  const meaning: ExperienceMeaning = {
    why: storyValue.logline,
    emotions: interpretation.emotionalSignals,
    memories: context.memories?.map((memory) => memory.summary) ?? [],
    desiredFeeling: interpretation.emotionalSignals.length ? interpretation.emotionalSignals : ["curiosity"],
    transformation: storyValue.ending,
  };
  const journey = unique(storyValue.beats.flatMap((beat) => {
    switch (beat.kind) {
      case "orientation":
      case "threshold":
      case "origin": return ["arrival"];
      case "discovery":
      case "reveal": return ["discovery"];
      case "transformation": return ["transformation"];
      case "escalation":
      case "challenge": return ["peak"];
      case "reflection": return ["memory"];
      case "continuation":
      case "next_step": return ["return"];
      default: return [];
    }
  })) as ExperienceGenome["journey"];
  return {
    intent: [plan?.direction ?? "experience_creation"],
    interpretation,
    archetypes: plan?.direction ? [plan.direction] : [],
    themes: unique([observation.subject, ...observation.context, ...(plan?.futureEvolution ?? [])]),
    emotions: interpretation.emotionalSignals,
    meaning,
    relationships: observation.entities.people.map((person) => ({ subject: observation.subject, predicate: "shared_with", object: person, confidence: 0.8 })),
    energy: storyValue.tone.includes("playful") ? "playful" : storyValue.tone.includes("energetic") ? "intense" : storyValue.tone.includes("mysterious") ? "mysterious" : "emotional",
    pacing: storyValue.tone.includes("energetic") ? "fast" : "medium",
    social: observation.audience.includes("shared") ? "shared" : "solo",
    journey,
    discovery: observation.affordances.includes("reveal") || observation.affordances.includes("discovery") || plan?.direction === "discovery" ? 0.9 : 0.45,
    memory: context.memories?.length || observation.context.includes("memory") || plan?.direction === "memory" ? 0.95 : 0,
    commerce: observation.activity === "commerce" || plan?.direction === "commerce" ? 0.85 : 0,
    immersion: observation.context.includes("media") ? 0.8 : 0.45,
    interaction: observation.affordances.includes("play") || observation.audience.includes("shared") || Boolean(plan?.interactionModel.length) ? 0.8 : 0.3,
    replay: observation.context.includes("memory") || observation.context.includes("media") || Boolean(plan?.futureEvolution.length) ? 0.85 : 0.25,
    entities: observation.entities,
    environments: observation.context,
    audience: unique([...observation.audience, ...(plan?.audience ?? [])]),
    dna: unique(["adaptive", "subject-native", "evidence-driven", "variable-length", "cognitive-directed", "cognitive-subject-authoritative", "single-realization-boundary", "memory-as-context", "event-as-context", ...(plan ? ["plan-directed"] : []), ...observation.affordances]),
  };
}

function blueprint(storyValue: ExperienceStory, observation: ExperienceObservation, plan?: CognitiveExperiencePlan): ExperienceBlueprint {
  const moments: ExperienceMoment[] = storyValue.beats.map((beat) => ({
    type: "story",
    component: "story",
    title: beat.kind === "orientation" || beat.kind === "hook" || beat.kind === "need" || beat.kind === "threshold" ? storyValue.title : cap(beat.kind),
    subtitle: beat.emotionalTarget,
    description: beat.text,
    editable: true,
    demo: false,
    order: beat.order,
    payload: { beatId: beat.id, purpose: beat.purpose, entities: beat.entities, provenance: beat.provenance },
  }));
  return {
    title: storyValue.title,
    type: "story",
    tone: storyValue.tone,
    meaning: { why: storyValue.logline, emotions: observation.explicitEmotions, memories: [], desiredFeeling: storyValue.tone, transformation: storyValue.ending },
    moments,
    entities: observation.entities,
    ...(plan ? { cognitivePlan: plan } : {}),
    metadata: {
      themes: unique([observation.subject, ...observation.context, ...(plan?.emotionalIntent ?? [])]),
      dna: unique(["evidence-driven", "no-template", "cognitive-directed", "subject-native", "single-realization-boundary", ...(plan ? ["plan-native"] : []), ...observation.affordances]),
    },
  };
}

function flow(storyValue: ExperienceStory): FlowStep[] {
  return storyValue.beats.map((beat) => ({ id: beat.id, order: beat.order, type: "story", payload: { beat } }));
}

function moments(storyValue: ExperienceStory): Moment[] {
  return storyValue.beats.map((beat) => ({
    type: "message",
    order: beat.order,
    text: beat.text,
    meta: {
      duration: beat.kind === "payoff" ? 2800 : beat.kind === "hook" || beat.kind === "threshold" ? 2400 : 2200,
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
    duration: beat.kind === "payoff" ? 2800 : beat.kind === "hook" || beat.kind === "threshold" ? 2400 : 2200,
    transition: beat.kind === "hook" || beat.kind === "threshold" ? "zoom" : beat.kind === "payoff" ? "cinematic" : "fade",
    visual: {
      theme: "cinematic",
      animation: beat.kind === "hook" || beat.kind === "threshold" ? "slow_zoom" : beat.kind === "escalation" || beat.kind === "challenge" ? "parallax" : "none",
    },
    audio: { type: "ambient", mood: beat.emotionalTarget },
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
    audio: scene.audio ? { type: scene.audio.type, url: "", volume: 0.7, autoplay: true } : undefined,
    preload: index < plan.length - 1,
    meta: { source: "universal_story_compiler", purpose: scene.purpose, emotionalTarget: scene.emotionalTarget, entities: scene.entities, provenance: scene.provenance },
  }));
}

function model(storyValue: ExperienceStory, blueprintValue: ExperienceBlueprint, plan?: CognitiveExperiencePlan): ExperienceModel {
  return {
    title: storyValue.title,
    description: storyValue.logline,
    industry: "generic",
    goal: "storytelling",
    tone: blueprintValue.tone,
    moments: blueprintValue.moments,
    metadata: {
      category: "generated_story",
      tags: unique(["any-prompt", "evidence-driven", "no-template", "adaptive-story", "subject-native", "single-realization-boundary", plan ? "cognitive-directed" : "substrate-only"]),
    },
  };
}

export function compileStoryExperience(prompt: string, context: StoryCompilerContext = {}): CompiledStoryExperience {
  const observationValue = observe(prompt, context);
  const situationValue = situation(observationValue, context);
  const candidateList = candidates(observationValue, situationValue, context.cognitivePlan);
  const selectedCandidate = choose(candidateList, context.cognitivePlan);
  const toneValue = tone(observationValue);
  const storyValue = story(observationValue, situationValue, selectedCandidate, toneValue, context);
  const genomeValue = genome(observationValue, storyValue, context);
  const blueprintValue = blueprint(storyValue, observationValue, context.cognitivePlan);
  const flowSteps = flow(storyValue);
  const momentList = moments(storyValue);
  const scenePlanValue = scenePlan(storyValue);
  const cinematicScenes = scenes(scenePlanValue, momentList);
  const modelValue = model(storyValue, blueprintValue, context.cognitivePlan);
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
    estimatedDuration: momentList.reduce((total, moment) => total + (moment.meta?.duration ?? 2200), 0),
    momentCount: momentList.length,
  };
}
