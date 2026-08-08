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
 *   Domain-neutral compilation substrate. It converts observed semantic
 *   material into story, blueprint, flow, moments, and cinematic scenes.
 *
 * CANONICAL PIPELINE:
 *   PROMPT
 *     → COGNITIVE UNDERSTANDING
 *     → EVIDENCE
 *     → MEANING
 *     → HYPOTHESES
 *     → OPPORTUNITY SPACE
 *     → SELECTED EXPERIENCE DIRECTION
 *     → COGNITIVE PLAN
 *     → UNIVERSAL COMPILATION
 *     → BLUEPRINT
 *     → FLOW
 *     → MOMENTS
 *     → CINEMATIC SCENES
 *
 * ARCHITECTURE RULE:
 *   THE COMPILER BECOMES SMARTER.
 *   IT DOES NOT INVENT ANOTHER ARCHITECTURE.
 *
 * COGNITIVE RULE:
 *   This compiler is the substrate, not the brain. When a cognitive plan is
 *   supplied, it directs candidate selection and realization. When no plan is
 *   supplied, the substrate remains independently usable for compatibility.
 *
 * NO-TEMPLATE RULE:
 *   Candidate shapes are generic narrative operations. Domain meaning comes
 *   from evidence and the cognitive plan, not from an industry template.
 *
 * CONTRACT RULE:
 *   Shared semantic/runtime shapes come only from @qre/contracts.
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
  "a", "an", "the", "and", "or", "but", "for", "with", "about", "this", "that",
  "into", "from", "make", "create", "something", "please", "experience", "story",
  "build", "want", "need", "give", "get", "tell", "show", "i", "my", "me", "to",
  "is", "are", "was", "were", "be", "has", "have", "had", "just", "than", "then",
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
  ["event", /\b(event|party|festival|concert|wedding|birthday|crowd|guests?|ceremony|conference|rave|nightclub)\b/i],
  ["place", /\b(venue|restaurant|bar|shop|store|home|park|beach|hotel|salon|museum|stadium|school|office|studio|gas station)\b/i],
  ["memory", /\b(memory|memorial|remember|past|history|childhood|legacy|forever|nostalgia|keepsake|milestone|preserve)\b/i],
  ["media", /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan|guitar|pick)\b/i],
  ["work", /\b(project|meeting|business|office|client|customer|brand|product|team|launch|shop)\b/i],
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

const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const tokens = (value: string) => clean(value).split(/[^A-Za-z0-9'’-]+/).filter(Boolean);
const cap = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "The Moment";

function entities(prompt: string, context: StoryCompilerContext): ExperienceEntities {
  const text = clean(prompt);
  const lo = lower(text);
  const people = unique(
    (text.match(/\b(?:my|our|with|from|by)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})/g) ?? [])
      .map((value) => value.replace(/^\b(?:my|our|with|from|by)\s+/i, "")),
  );
  const dates = unique(text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) ?? []);
  const times = unique(text.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi) ?? []);
  const urls = unique(text.match(/https?:\/\/[^\s]+/gi) ?? []);
  const emails = unique(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []);
  const phones = unique(text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? []);
  const events = unique(lo.match(/\b(wedding|concert|festival|birthday|party|ceremony|event|show|conference|rave|nightclub|anniversary|memorial)\b/g) ?? []);
  const products = unique(lo.match(/\b(qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|pick|jewelry|tattoo)\b/g) ?? []);
  const places = unique([
    ...(context.location?.label ? [context.location.label] : []),
    ...(context.location?.city ? [context.location.city] : []),
    ...(context.event?.venue ? [context.event.venue] : []),
    ...(text.match(/\b(?:at|in|near)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/g) ?? [])
      .map((value) => value.replace(/^\b(?:at|in|near)\s+/i, "")),
  ]);
  const media = /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan)\b/i.test(text) ? ["media"] : [];
  const keywords = unique(tokens(text).map((value) => value.toLowerCase()).filter((value) => value.length > 2 && !STOP.has(value)));

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

function subject(prompt: string, value: ExperienceEntities): string {
  const direct = prompt.match(/\b(?:for|about|with)\s+([^,.!?]+?)(?:\s+(?:about|at|in|on|tonight|today|now)\b|[,.!?]|$)/i)?.[1];
  const possessive = prompt.match(/\bmy\s+([^,.!?]+?)(?:[,.!?]|$)/i)?.[1];
  if (direct && clean(direct).length <= 80) return clean(direct);
  if (possessive && clean(possessive).length <= 80) return clean(possessive);
  return value.products[0] ?? value.events[0] ?? value.people[0] ?? tokens(prompt).filter((x) => !STOP.has(x.toLowerCase())).slice(0, 5).join(" ") || "this moment";
}

function activity(prompt: string): string {
  for (const [pattern, value] of ACTIONS) if (pattern.test(prompt)) return value;
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

function affordances(prompt: string, activityValue: string, contextValue: string[], audienceValue: string[], temporalValue: string[], hasMemories: boolean, plan?: CognitiveExperiencePlan): string[] {
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
  return [...result, ...(result.size ? [] : ["curiosity", "payoff"] )];
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
    affordances: affordances(text, activityValue, contextValue, audienceValue, temporalValue, Boolean(context.memories?.length), context.cognitivePlan),
    evidence: [{ kind: "observed", source: "prompt", confidence: 1 }],
  };
}

function situation(observation: ExperienceObservation, context: StoryCompilerContext): StorySituation {
  const social: StorySituation["social"] = observation.audience[0] === "shared" ? "shared" : observation.audience[0] === "personal" ? "solo" : "unknown";
  const actors = unique([...observation.entities.people, ...(context.event?.participants ?? [])]);
  const setting = unique([...observation.context, ...(context.event?.venue ? [context.event.venue] : []), ...(context.location?.label ? [context.location.label] : [])]);
  return {
    subject: observation.subject,
    actors,
    activity: observation.activity,
    setting,
    temporal: observation.temporal,
    social,
    purpose: context.cognitivePlan?.purpose ?? "make the moment matter",
    change: observation.activity === "observation" ? "attention shifts" : `${observation.activity} changes the situation`,
    tension: /\b(boring|lost|missing|problem|hard|difficult|danger|unknown|mystery|risk)\b/i.test(observation.prompt) ? "something needs resolution" : "the moment has unrealized potential",
    signals: observation.entities.keywords.slice(0, 20).map((value, index) => ({ value, source: "prompt", confidence: 0.8, salience: Math.max(0.2, 1 - index / 20) })),
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
  return (result.length ? result : ["cinematic"]) as ExperienceTone[];
}

const provenance = (kind: StoryProvenance["kind"], source: string, confidence: number): StoryProvenance[] => [{ kind, source, confidence }];

function planText(plan?: CognitiveExperiencePlan): string[] {
  if (!plan) return [];
  return unique([
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

function wordOverlap(a: string, b: string): number {
  const left = new Set(tokens(lower(a)).filter((x) => x.length > 3));
  const right = new Set(tokens(lower(b)).filter((x) => x.length > 3));
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const word of left) if (right.has(word)) hits += 1;
  return hits / Math.max(left.size, right.size);
}

function score(beats: StoryBeatKind[], observation: ExperienceObservation, situationValue: StorySituation, plan?: CognitiveExperiencePlan): number {
  const affordanceSet = new Set(observation.affordances);
  const compatibility: Record<StoryBeatKind, string[]> = {
    orientation: ["environment", "continuity", "anticipation"],
    hook: ["change", "contrast", "play", "curiosity"],
    encounter: ["connection", "environment"],
    escalation: ["challenge", "play", "connection", "change"],
    discovery: ["reveal", "curiosity", "meaning"],
    transformation: ["change", "contrast"],
    payoff: ["payoff", "play", "meaning", "preservation"],
    reflection: ["meaning", "preservation", "continuity"],
    continuation: ["continuity", "anticipation", "preservation", "replay", "evolution"],
  };
  let value = 0;
  for (const beat of beats) for (const signal of compatibility[beat] ?? []) if (affordanceSet.has(signal)) value += 1.35;
  if (beats.includes("payoff")) value += 1.6;
  if (beats.includes("orientation") && situationValue.setting.length) value += 0.8;
  if (beats.includes("encounter") && situationValue.actors.length) value += 0.9;
  if (beats.includes("reflection") && (observation.context.includes("memory") || observation.explicitEmotions.length)) value += 1.5;
  if (beats.includes("transformation") && observation.activity !== "observation") value += 1.2;
  if (beats.includes("continuation") && (observation.temporal.includes("future") || observation.context.includes("memory"))) value += 1.1;

  if (plan) {
    const planWords = planText(plan).join(" ");
    const candidateWords = beats.join(" ");
    value += wordOverlap(candidateWords, planWords) * 3;
    value += plan.interactionModel.length * (beats.includes("encounter") || beats.includes("discovery") ? 0.08 : 0);
    value += plan.futureEvolution.length * (beats.includes("continuation") ? 0.18 : 0);
    value += plan.creativePossibilities.length * (beats.includes("discovery") || beats.includes("hook") ? 0.08 : 0);
  }

  value += beats.length >= 2 && beats.length <= 7 ? 0.8 : 0;
  value -= Math.max(0, beats.length - 7) * 0.6;
  return Number(value.toFixed(3));
}

function candidates(observation: ExperienceObservation, situationValue: StorySituation, plan?: CognitiveExperiencePlan): Candidate[] {
  const pool: Array<[string, StoryBeatKind[], string]> = [
    ["momentum", ["orientation", "hook", "escalation", "payoff"], "Build energy around observed action."],
    ["reveal", ["orientation", "hook", "discovery", "payoff"], "Expose a meaningful second layer."],
    ["change", ["orientation", "hook", "transformation", "payoff"], "Make observable change the story engine."],
    ["memory", ["orientation", "encounter", "reflection", "payoff", "continuation"], "Connect present evidence to continuity."],
    ["play", ["hook", "encounter", "escalation", "payoff"], "Use participation and play as momentum."],
    ["meaning", ["orientation", "discovery", "reflection", "payoff"], "Move from surface detail toward significance."],
    ["relationship", ["orientation", "encounter", "transformation", "payoff", "continuation"], "Let people and interaction carry change."],
    ["minimal", ["hook", "payoff"], "Respect sparse prompts instead of inventing machinery."],
  ];
  return pool.map(([id, beats, rationale]) => ({ id, beats, score: score(beats, observation, situationValue, plan), rationale, evidence: provenance("inferred", `candidate:${id}`, 0.7) })).sort((a, b) => b.score - a.score);
}

function choose(candidateList: Candidate[], observation: ExperienceObservation, plan?: CognitiveExperiencePlan): Candidate {
  if (!plan) return candidateList[0];
  const planTextValue = planText(plan).join(" ");
  return [...candidateList].sort((a, b) => {
    const aFit = wordOverlap(a.rationale, planTextValue) + a.score * 0.08;
    const bFit = wordOverlap(b.rationale, planTextValue) + b.score * 0.08;
    return bFit - aFit;
  })[0] ?? candidateList[0];
}

function beatText(kind: StoryBeatKind, observation: ExperienceObservation, situationValue: StorySituation, plan?: CognitiveExperiencePlan): string {
  const subjectValue = observation.subject;
  const detail = observation.entities.keywords.filter((word) => word !== lower(subjectValue)).slice(0, 4).join(", ") || "the detail already in front of us";
  const planWhy = plan?.whyInteract[0];
  switch (kind) {
    case "orientation": return `Begin with ${subjectValue}, ${observation.activity === "observation" ? "and notice what is already there" : `in the middle of ${observation.activity}`}.`;
    case "hook": return planWhy ? `${cap(planWhy)}. One detail deserves the foreground: ${detail}.` : `One detail deserves the foreground: ${detail}.`;
    case "encounter": return situationValue.actors.length ? `${situationValue.social === "shared" ? "The people around the moment" : "The person inside the moment"} enters the frame, giving ${subjectValue} something to respond to.` : `${subjectValue} encounters a detail that changes what the moment can become.`;
    case "escalation": return `The moment gains momentum; what began as ${observation.activity} now has somewhere to go.`;
    case "discovery": return plan?.creativePossibilities[0] ?? `Look again: the obvious layer is not the whole story.`;
    case "transformation": return observation.activity === "observation" ? "The transformation is the shift in attention itself." : `${subjectValue} is no longer quite where the moment began. ${cap(observation.activity)} has changed the state of the experience.`;
    case "payoff": return plan?.purpose ? `${cap(plan.purpose)}. The payoff grows from what the prompt actually gave us.` : "The payoff grows from what the prompt actually gave us.";
    case "reflection": return observation.explicitEmotions.length ? `The experience echoes ${observation.explicitEmotions.join(" and ")}; that feeling becomes part of what remains.` : "The experience leaves a question behind: what made this particular moment worth noticing?";
    case "continuation": return plan?.futureEvolution[0] ?? "The story stays open. A future interaction, replay, or new piece of evidence can change what it means next time.";
  }
}

function makeBeat(kind: StoryBeatKind, index: number, observation: ExperienceObservation, situationValue: StorySituation, toneValue: ExperienceTone[], plan?: CognitiveExperiencePlan): StoryBeat {
  return {
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: `Advance the experience through ${kind} using available evidence and cognitive direction.`,
    text: beatText(kind, observation, situationValue, plan),
    entities: unique([observation.subject, ...observation.entities.keywords.slice(0, 4), ...situationValue.actors.slice(0, 2)]),
    emotionalTarget: toneValue[0] ?? "curiosity",
    provenance: kind === "orientation" ? provenance("observed", "prompt", 1) : [...provenance("observed", "prompt", 1), ...provenance("inferred", "cognitive_story_search", 0.72)],
  };
}

function title(subjectValue: string, candidate: Candidate, plan?: CognitiveExperiencePlan): string {
  const base = cap(subjectValue.replace(/^the\s+/i, ""));
  if (plan?.direction === "memory") return `${base}: Worth Keeping`;
  if (plan?.direction === "discovery") return `${base}: Look Again`;
  if (plan?.direction === "journey") return `${base}: The Journey`;
  if (plan?.direction === "game") return `${base}: The Challenge`;
  if (plan?.direction === "identity") return `${base}: Inside the World`;
  if (plan?.direction === "commerce") return `${base}: A Reason to Return`;
  if (candidate.id === "play") return `${base} Gets Interesting`;
  if (candidate.id === "change") return `${base} Changes`;
  return `${base}: The Moment`;
}

function story(observation: ExperienceObservation, situationValue: StorySituation, candidate: Candidate, toneValue: ExperienceTone[], context: StoryCompilerContext): ExperienceStory {
  const beats = candidate.beats.map((kind, index) => makeBeat(kind, index, observation, situationValue, toneValue, context.cognitivePlan));
  const name = title(observation.subject, candidate, context.cognitivePlan);
  const ending = beats.find((beat) => beat.kind === "payoff")?.text ?? beats.at(-1)?.text ?? "The moment continues.";
  const continuity = context.memories?.length ? " Existing memory adds context without replacing the present moment." : "";
  return {
    title: name,
    hook: beats[0]?.text ?? "A moment begins.",
    logline: context.cognitivePlan?.purpose ?? `${name} turns observed detail into an evidence-aware experience.${continuity}`,
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
    concepts: unique([observation.activity, ...observation.affordances, ...(plan ? [plan.direction ?? ""] : [])]),
    emotionalSignals: unique([...observation.explicitEmotions, ...(plan?.emotionalIntent ?? [])]),
    worldSignals: observation.context,
    cognitiveSignals: ["observation", "evidence_weighting", "candidate_search", "cognitive_direction", "variable_beats"],
    confidence: 0.82,
  };
  const meaning: ExperienceMeaning = {
    why: storyValue.logline,
    emotions: interpretation.emotionalSignals,
    memories: context.memories?.map((memory) => memory.summary) ?? [],
    desiredFeeling: interpretation.emotionalSignals.length ? interpretation.emotionalSignals : ["curiosity"],
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
    intent: [plan?.direction ?? "experience_creation"],
    interpretation,
    archetypes: plan?.direction ? [plan.direction] : [],
    themes: unique([...observation.context, ...(plan?.futureEvolution ?? [])]),
    emotions: interpretation.emotionalSignals,
    meaning,
    relationships: [],
    energy: storyValue.tone.includes("playful") ? "playful" : storyValue.tone.includes("energetic") ? "intense" : storyValue.tone.includes("mysterious") ? "mysterious" : "emotional",
    pacing: storyValue.tone.includes("energetic") ? "fast" : "medium",
    social: observation.audience.includes("shared") ? "shared" : "solo",
    journey: unique(journey) as ExperienceGenome["journey"],
    discovery: observation.affordances.includes("reveal") || plan?.direction === "discovery" ? 0.9 : 0.45,
    memory: context.memories?.length || observation.context.includes("memory") || plan?.direction === "memory" ? 0.95 : 0,
    commerce: observation.activity === "commerce" || plan?.direction === "commerce" ? 0.85 : 0,
    immersion: observation.context.includes("media") ? 0.8 : 0.45,
    interaction: observation.affordances.includes("play") || observation.audience.includes("shared") || Boolean(plan?.interactionModel.length) ? 0.8 : 0.3,
    replay: observation.context.includes("memory") || observation.context.includes("media") || Boolean(plan?.futureEvolution.length) ? 0.85 : 0.25,
    entities: observation.entities,
    environments: observation.context,
    audience: unique([...observation.audience, ...(plan?.audience ?? [])]),
    dna: unique(["adaptive", "subject-native", "evidence-driven", "variable-length", "cognitive-directed", "memory-as-context", "event-as-context", ...(plan ? ["plan-directed"] : []), ...observation.affordances]),
  };
}

function blueprint(storyValue: ExperienceStory, observation: ExperienceObservation, plan?: CognitiveExperiencePlan): ExperienceBlueprint {
  const moments: ExperienceMoment[] = storyValue.beats.map((beat) => ({
    type: "story",
    component: "story",
    title: beat.kind === "orientation" ? storyValue.title : cap(beat.kind),
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
    meaning: {
      why: storyValue.logline,
      emotions: observation.explicitEmotions,
      memories: [],
      desiredFeeling: storyValue.tone,
      transformation: storyValue.ending,
    },
    moments,
    entities: observation.entities,
    ...(plan ? { cognitivePlan: plan } : {}),
    metadata: {
      themes: unique([...observation.context, ...(plan?.emotionalIntent ?? [])]),
      dna: unique(["evidence-driven", "no-template", "cognitive-directed", ...observation.affordances]),
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
    meta: { duration: beat.kind === "payoff" ? 2800 : 2200, beatId: beat.id, beatKind: beat.kind, emotionalTarget: beat.emotionalTarget, entities: beat.entities, provenance: beat.provenance },
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
    visual: { theme: "cinematic", animation: beat.kind === "hook" ? "slow_zoom" : beat.kind === "escalation" ? "parallax" : "none" },
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
      tags: unique(["any-prompt", "evidence-driven", "no-template", "adaptive-story", plan ? "cognitive-directed" : "substrate-only"]),
    },
  };
}

export function compileStoryExperience(prompt: string, context: StoryCompilerContext = {}): CompiledStoryExperience {
  const observationValue = observe(prompt, context);
  const situationValue = situation(observationValue, context);
  const candidateList = candidates(observationValue, situationValue, context.cognitivePlan);
  const selectedCandidate = choose(candidateList, observationValue, context.cognitivePlan);
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
