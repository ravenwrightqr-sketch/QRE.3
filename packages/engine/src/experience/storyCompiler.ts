import type {
  ExperienceEntities,
  ExperienceGenome,
  ExperienceMeaning,
  ExperienceWorld,
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

import { extractEntities } from "../semantic/entityExtractor.js";

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

const ANIMAL_WORDS = [
  "dog", "poodle", "cat", "kitten", "puppy", "horse", "bird", "parrot",
  "rabbit", "bunny", "hamster", "fish", "pet", "animal"
];

const CONTEXT_WORDS: Record<string, string[]> = {
  event: ["event", "party", "festival", "concert", "wedding", "birthday", "celebration", "crowd"],
  place: ["venue", "restaurant", "bar", "shop", "store", "home", "park", "beach", "hotel", "salon"],
  work: ["launch", "project", "meeting", "business", "office", "client", "customer"],
  memory: ["memory", "remember", "past", "history", "grandmother", "grandfather", "childhood", "old"],
  media: ["photo", "image", "video", "film", "music", "song", "voice", "recording"],
};

const ACTIONS: Array<[RegExp, string]> = [
  [/\bgroom(?:er|ing)?\b|\btrim(?:ming)?\b|\bbathe(?:d|s|ing)?\b/i, "grooming"],
  [/\bcelebrat(?:e|ing|ion|ed)\b/i, "celebration"],
  [/\blaunch(?:ing|ed)?\b/i, "launch"],
  [/\bvisit(?:ing|ed)?\b/i, "visit"],
  [/\bmeet(?:ing|s)?\b/i, "meeting"],
  [/\btravel(?:ing|led)?\b|\btrip\b/i, "travel"],
  [/\bbuy(?:ing|s|er)?\b|\bsell(?:ing|s)?\b/i, "commerce"],
  [/\bmake(?:ing|s)?\b|\bcreate(?:d|s|ing)?\b/i, "creation"],
  [/\bteach(?:ing|es)?\b|\blearn(?:ing|s)?\b/i, "learning"],
  [/\bplay(?:ing|ful)?\b|\bgame\b/i, "play"],
];

const EMOTIONS: Array<[RegExp, string]> = [
  [/\bfun(?:ny)?\b|\bplayful\b|\bjoy\b|\bhappy\b/i, "joy"],
  [/\blove\b|\bromantic\b/i, "love"],
  [/\bexcited\b|\bexcitement\b|\bhype\b/i, "excitement"],
  [/\bcalm\b|\bpeaceful\b|\bquiet\b/i, "calm"],
  [/\bnostalgia\b|\bsentimental\b/i, "nostalgia"],
  [/\bmyster(?:y|ious)\b|\bsecret\b|\bhidden\b/i, "curiosity"],
  [/\bscary\b|\bdark\b|\bcreepy\b/i, "intensity"],
];

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function lower(prompt: string): string {
  return prompt.toLowerCase().replace(/\s+/g, " ").trim();
}

function phraseAfter(prompt: string, pattern: RegExp): string | undefined {
  const match = prompt.match(pattern);
  return match?.[1]?.trim();
}

function detectSubject(prompt: string): string {
  const explicit =
    phraseAfter(prompt, /\b(?:for|about|with)\s+([^,.!?]+?)(?:\s+about\b|\s+at\b|\s+in\b|\s+tonight\b|[,.!?]|$)/i) ??
    phraseAfter(prompt, /\bmy\s+([^,.!?]+?)(?:[,.!?]|$)/i);

  if (explicit) return explicit;

  const words = prompt.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, Math.min(6, words.length)).join(" ") || "this moment";
}

function detectActivity(prompt: string): string {
  for (const [pattern, activity] of ACTIONS) {
    if (pattern.test(prompt)) return activity;
  }
  return "experience";
}

function detectContext(prompt: string): string[] {
  const text = lower(prompt);
  const found: string[] = [];
  for (const [kind, words] of Object.entries(CONTEXT_WORDS)) {
    if (words.some((word) => text.includes(word))) found.push(kind);
  }
  return found;
}

function detectEmotions(prompt: string): string[] {
  return unique(
    EMOTIONS.filter(([pattern]) => pattern.test(prompt)).map(([, emotion]) => emotion),
  );
}

function detectAudience(prompt: string): string[] {
  const text = lower(prompt);
  const audience: string[] = [];
  if (/\beveryone\b|\bcrowd\b|\bguests?\b|\bcommunity\b|\bfans?\b/.test(text)) audience.push("shared");
  if (/\bmy\b|\bme\b|\bpersonal\b|\bprivate\b/.test(text)) audience.push("personal");
  return audience.length ? audience : ["individual"];
}

function detectTemporal(prompt: string): string[] {
  const text = lower(prompt);
  const result: string[] = [];
  if (/\btonight\b|\btoday\b|\bnow\b|\blive\b/.test(text)) result.push("present");
  if (/\byesterday\b|\blast\b|\bpast\b|\bago\b|\bold\b/.test(text)) result.push("past");
  if (/\btomorrow\b|\bnext\b|\bfuture\b|\bsoon\b/.test(text)) result.push("future");
  return result;
}

function buildAffordances(input: {
  prompt: string;
  subject: string;
  activity: string;
  context: string[];
  emotions: string[];
}): string[] {
  const affordances: string[] = [];
  const text = lower(input.prompt);

  if (input.activity === "grooming") affordances.push("care", "anticipation", "transformation", "reveal", "playful_identity");
  if (input.context.includes("event")) affordances.push("anticipation", "shared_energy", "peak", "aftermath");
  if (input.context.includes("memory")) affordances.push("origin", "connection", "reflection", "legacy");
  if (input.context.includes("media")) affordances.push("replay", "visual_reveal", "soundtrack");
  if (input.context.includes("work")) affordances.push("purpose", "stakes", "payoff");
  if (input.context.includes("place")) affordances.push("arrival", "environment", "departure");
  if (/\bsurprise\b|\bsecret\b|\bmystery\b/.test(text)) affordances.push("surprise", "reveal");
  if (/\bfun\b|\bplayful\b|\bfunny\b|\bwild\b/.test(text)) affordances.push("play", "comic_turn");
  if (/\bwhy\b|\bmeaning\b|\bsignificance\b/.test(text)) affordances.push("meaning", "reflection");

  if (!affordances.length) affordances.push("curiosity", "encounter", "payoff");
  return unique(affordances);
}

function observePrompt(prompt: string): ExperienceObservation {
  if (!prompt.trim()) throw new Error("Experience prompt required.");

  const subject = detectSubject(prompt);
  const activity = detectActivity(prompt);
  const context = detectContext(prompt);
  const explicitEmotions = detectEmotions(prompt);
  const entities = extractEntities(prompt);
  const audience = detectAudience(prompt);
  const temporal = detectTemporal(prompt);
  const affordances = buildAffordances({ prompt, subject, activity, context, emotions: explicitEmotions });

  const evidence: StoryProvenance[] = [
    { kind: "observed", source: "prompt", confidence: 1 },
  ];

  return { prompt, subject, activity, context, entities, explicitEmotions, audience, temporal, affordances, evidence };
}

function chooseTone(observation: ExperienceObservation): ExperienceTone[] {
  const tones: ExperienceTone[] = [];
  if (observation.explicitEmotions.includes("joy")) tones.push("playful");
  if (observation.explicitEmotions.includes("love") || observation.explicitEmotions.includes("nostalgia")) tones.push("emotional");
  if (observation.explicitEmotions.includes("excitement")) tones.push("energetic");
  if (observation.explicitEmotions.includes("curiosity")) tones.push("mysterious");
  if (observation.explicitEmotions.includes("intensity")) tones.push("dark");
  if (!tones.length) tones.push("cinematic", "friendly");
  return unique(tones) as ExperienceTone[];
}

function titleFor(observation: ExperienceObservation): string {
  const subject = observation.subject.replace(/^the\s+/i, "").trim();
  if (observation.activity === "grooming") return `${subject}: The Before & After`;
  if (observation.context.includes("event")) return `${subject}: Tonight's Story`;
  if (observation.context.includes("memory")) return `${subject}: The Story It Carries`;
  if (observation.activity !== "experience") return `${subject}: ${capitalize(observation.activity)}`;
  return `${subject}: A Little Story`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sentenceSubject(observation: ExperienceObservation): string {
  return observation.subject || "the subject";
}

function beat(
  kind: StoryBeatKind,
  order: number,
  purpose: string,
  text: string,
  entities: string[],
  emotionalTarget: string | undefined,
  provenance: StoryProvenance[],
): StoryBeat {
  return {
    id: `beat-${order}-${kind}`,
    kind,
    order,
    purpose,
    text,
    entities,
    emotionalTarget,
    provenance,
  };
}

function planBeats(observation: ExperienceObservation, tone: ExperienceTone[]): StoryBeat[] {
  const subject = sentenceSubject(observation);
  const subjectEvidence: StoryProvenance[] = [{ kind: "observed", source: "prompt", confidence: 1 }];
  const inferred: StoryProvenance[] = [{ kind: "inferred", source: "story_affordance", confidence: 0.72 }];
  const playful: StoryProvenance[] = [{ kind: "playful", source: "story_realizer", confidence: 0.55 }];
  const beats: StoryBeat[] = [];

  beats.push(beat(
    "orientation",
    beats.length,
    "Place the subject inside the situation without inventing facts.",
    `${subject} enters a moment that already has a little potential in it: ${observation.prompt.trim()}`,
    [subject],
    tone.includes("playful") ? "curiosity" : "attention",
    subjectEvidence,
  ));

  if (observation.activity !== "experience") {
    beats.push(beat(
      "hook",
      beats.length,
      "Make the central activity feel specific rather than generic.",
      `The interesting part is ${observation.activity}: the ordinary action becomes the thing worth noticing.`,
      [subject, observation.activity],
      tone.includes("playful") ? "anticipation" : "interest",
      [...subjectEvidence, ...inferred],
    ));
  }

  if (observation.affordances.includes("transformation")) {
    beats.push(beat(
      "transformation",
      beats.length,
      "Turn the central action into visible change.",
      `${subject} does not just pass through the moment. Something changes, and the change becomes part of the story.`,
      [subject],
      "delight",
      [...subjectEvidence, ...inferred],
    ));
  } else if (observation.affordances.includes("shared_energy")) {
    beats.push(beat(
      "escalation",
      beats.length,
      "Increase social or experiential energy.",
      `The room starts to matter: the people around ${subject} become part of the moment, and the moment becomes shared.`,
      [subject],
      "energy",
      [...subjectEvidence, ...inferred],
    ));
  } else {
    beats.push(beat(
      "discovery",
      beats.length,
      "Reveal a second layer without pretending it was factual.",
      `Then the moment opens another door: ${subject} becomes more interesting than the first sentence suggested.`,
      [subject],
      "curiosity",
      [...subjectEvidence, ...inferred],
    ));
  }

  if (observation.explicitEmotions.length || observation.context.includes("memory")) {
    beats.push(beat(
      "reflection",
      beats.length,
      "Connect the experience to the feeling explicitly present in the prompt.",
      `What stays is the feeling the prompt was reaching for: ${observation.explicitEmotions[0] ?? "meaning"}.`,
      [subject],
      observation.explicitEmotions[0] ?? "meaning",
      [...subjectEvidence, ...inferred],
    ));
  }

  beats.push(beat(
    "payoff",
    beats.length,
    "Land the experience with a memorable line.",
    tone.includes("playful")
      ? `And that is how ${subject} turns an ordinary moment into one people will want to tell again.`
      : `The moment ends, but the story has earned a reason to be remembered.`,
    [subject],
    tone.includes("playful") ? "joy" : "belonging",
    [...subjectEvidence, ...playful],
  ));

  if (observation.temporal.includes("future") || observation.context.includes("event")) {
    beats.push(beat(
      "continuation",
      beats.length,
      "Leave the experience open to another interaction.",
      `There is still more to come. The next scan, return, or shared moment can change what this story means.`,
      [subject],
      "anticipation",
      [...subjectEvidence, ...inferred],
    ));
  }

  return beats;
}

function realizeStory(observation: ExperienceObservation, beats: StoryBeat[], tone: ExperienceTone[]): ExperienceStory {
  const title = titleFor(observation);
  const hook = beats.find((item) => item.kind === "hook")?.text ?? beats[0]?.text ?? "Something is about to happen.";
  const logline = `${title} follows ${observation.subject} through ${observation.activity}, using only the details the prompt gives us and leaving room for play.`;
  const ending = beats.find((item) => item.kind === "payoff")?.text ?? "The moment becomes a story worth keeping.";
  const continuation = beats.find((item) => item.kind === "continuation")?.text;

  return {
    title,
    hook,
    logline,
    beats,
    ending,
    continuation,
    tone,
    provenance: [{ kind: "observed", source: "prompt", confidence: 1 }],
  };
}

function toGenome(observation: ExperienceObservation, story: ExperienceStory): ExperienceGenome {
  const tone = story.tone;
  const interpretation: SemanticInterpretation = {
    intent: ["experience_creation"],
    concepts: unique([observation.activity, ...observation.affordances]),
    emotionalSignals: observation.explicitEmotions,
    worldSignals: observation.context,
    cognitiveSignals: ["evidence_driven_story_generation"],
    confidence: 0.8,
  };

  const meaning: ExperienceMeaning = {
    why: story.logline,
    emotions: observation.explicitEmotions,
    memories: observation.context.includes("memory") ? [observation.prompt] : [],
    desiredFeeling: observation.explicitEmotions.length ? observation.explicitEmotions : ["curiosity"],
    transformation: story.ending,
  };

  const dna = unique(["adaptive", "subject-native", "evidence-driven", "variable-length-story", ...observation.affordances]);

  return {
    intent: ["experience_creation"],
    interpretation,
    archetypes: [],
    themes: observation.context,
    emotions: observation.explicitEmotions,
    meaning,
    relationships: [],
    energy: tone.includes("playful") ? "playful" : tone.includes("energetic") ? "intense" : "emotional",
    pacing: tone.includes("energetic") ? "fast" : "medium",
    social: observation.audience.includes("shared") ? "shared" : "solo",
    journey: story.beats.map((item) => item.kind === "orientation" ? "arrival" : item.kind === "discovery" ? "discovery" : item.kind === "transformation" ? "transformation" : item.kind === "reflection" ? "memory" : item.kind === "payoff" ? "peak" : "return"),
    discovery: observation.affordances.includes("curiosity") ? 0.9 : 0.5,
    memory: observation.context.includes("memory") ? 0.9 : 0.1,
    commerce: observation.activity === "commerce" ? 0.8 : 0,
    immersion: observation.context.includes("media") ? 0.8 : 0.4,
    interaction: observation.context.includes("event") || observation.affordances.includes("play") ? 0.7 : 0.3,
    replay: observation.context.includes("memory") || observation.context.includes("media") ? 0.8 : 0.3,
    entities: observation.entities,
    environments: observation.context,
    audience: observation.audience,
    dna,
  };
}

function toBlueprint(story: ExperienceStory, observation: ExperienceObservation): ExperienceBlueprint {
  const moments: ExperienceMoment[] = story.beats.map((item) => ({
    type: "story",
    component: "story",
    title: item.kind === "orientation" ? story.title : capitalize(item.kind),
    subtitle: item.emotionalTarget,
    description: item.text,
    editable: true,
    demo: false,
    order: item.order,
    payload: {
      beatId: item.id,
      purpose: item.purpose,
      entities: item.entities,
      provenance: item.provenance,
    },
  }));

  return {
    title: story.title,
    type: "story",
    tone: story.tone as ExperienceTone[],
    meaning: {
      why: story.logline,
      emotions: observation.explicitEmotions,
      memories: observation.context.includes("memory") ? [observation.prompt] : [],
      desiredFeeling: story.tone,
      transformation: story.ending,
    },
    moments,
    entities: observation.entities,
    metadata: { themes: observation.context, dna: ["evidence-driven", ...observation.affordances] },
  };
}

function toFlow(story: ExperienceStory): FlowStep[] {
  return story.beats.map((beat) => ({
    id: beat.id,
    order: beat.order,
    type: "story",
    payload: {
      experience: {
        component: "story",
        momentType: "story",
        title: beat.kind,
        description: beat.text,
        editable: true,
        demo: false,
        order: beat.order,
      },
      beat,
    },
  }));
}

function toMoments(story: ExperienceStory): Moment[] {
  return story.beats.map((beat) => ({
    type: "message",
    order: beat.order,
    text: beat.text,
    meta: {
      duration: beat.kind === "payoff" ? 2600 : 2200,
      beatId: beat.id,
      beatKind: beat.kind,
      emotionalTarget: beat.emotionalTarget,
      entities: beat.entities,
      provenance: beat.provenance,
    },
  }));
}

function toScenePlan(story: ExperienceStory): StoryScenePlan[] {
  return story.beats.map((beat) => ({
    id: `scene-${beat.id}`,
    order: beat.order,
    beatId: beat.id,
    purpose: beat.purpose,
    text: beat.text,
    emotionalTarget: beat.emotionalTarget,
    entities: beat.entities,
    duration: beat.kind === "payoff" ? 2600 : 2200,
    transition: beat.kind === "hook" ? "zoom" : beat.kind === "payoff" ? "cinematic" : "fade",
    visual: {
      theme: "cinematic",
      animation: beat.kind === "hook" ? "slow_zoom" : "none",
    },
    audio: { type: "ambient", mood: beat.emotionalTarget },
    provenance: beat.provenance,
  }));
}

function toCinematicScenes(plan: StoryScenePlan[], moments: Moment[]): CinematicScene[] {
  return plan.map((scene, index) => ({
    id: scene.id,
    type: "emotion",
    duration: scene.duration,
    moment: moments[index],
    order: index,
    transition: scene.transition,
    visual: scene.visual,
    audio: scene.audio
      ? { type: scene.audio.type, url: "", volume: 0.7, autoplay: true }
      : undefined,
    preload: index < plan.length - 1,
    meta: {
      purpose: scene.purpose,
      emotionalTarget: scene.emotionalTarget,
      entities: scene.entities,
      provenance: scene.provenance,
    },
  }));
}

function toWorld(observation: ExperienceObservation, story: ExperienceStory): ExperienceWorld {
  const domain = observation.context.includes("memory")
    ? "memory_world"
    : observation.context.includes("event")
      ? "community_world"
      : observation.context.includes("work")
        ? "identity_world"
        : "discovery_world";

  return {
    domain,
    archetype: "evidence_driven_story",
    atmosphere: story.tone,
    journey: story.beats.map((item) => item.kind),
    atoms: unique([observation.subject, observation.activity, ...observation.affordances]),
    themes: observation.context,
  };
}

function toModel(story: ExperienceStory, blueprint: ExperienceBlueprint): ExperienceModel {
  return {
    title: story.title,
    description: story.logline,
    industry: "generic",
    goal: "storytelling",
    tone: blueprint.tone,
    moments: blueprint.moments,
    metadata: {
      category: "generated_story",
      tags: ["any-prompt", "evidence-driven", "no-template"],
    },
  };
}

export function compileStoryExperience(prompt: string): CompiledStoryExperience {
  const observation = observePrompt(prompt.trim());
  const tone = chooseTone(observation);
  const beats = planBeats(observation, tone);
  const story = realizeStory(observation, beats, tone);
  const genome = toGenome(observation, story);
  const blueprint = toBlueprint(story, observation);
  const flowSteps = toFlow(story);
  const moments = toMoments(story);
  const scenePlan = toScenePlan(story);
  const cinematicScenes = toCinematicScenes(scenePlan, moments);
  const world = toWorld(observation, story);
  const model = toModel(story, blueprint);

  return {
    observation,
    genome,
    story,
    blueprint,
    flowSteps,
    moments,
    cinematicScenes,
    scenePlan,
    model,
    title: story.title,
    estimatedDuration: moments.reduce((sum, moment) => sum + (moment.meta?.duration ?? 2000), 0),
    momentCount: moments.length,
  };
}
