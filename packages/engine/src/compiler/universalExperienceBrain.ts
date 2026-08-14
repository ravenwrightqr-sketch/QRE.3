import type {
  CinematicScene,
  CognitiveBeatDirective,
  CognitiveExperiencePlan,
  ExperienceMoment,
  StoryBeat,
  StoryBeatKind,
} from "@qre/contracts";
import type { ExperienceCompilerContext } from "../experience/experienceCompilerContext.js";

type Lens = "qre" | "comedy" | "horror" | "romance" | "wild";

type SourceEvent = {
  id: string;
  order: number;
  raw: string;
  actor?: string;
  action?: string;
  object?: string;
  place?: string;
  time?: string;
  emotion?: string;
  resolvedFromMemory?: string;
};

type World = {
  prompt: string;
  events: SourceEvent[];
  entities: string[];
  participants: string[];
  places: string[];
  times: string[];
  lens: Lens;
  signals: string[];
  memoryMatches: string[];
};

export type UniversalBrainResult = {
  world: World;
  beats: StoryBeat[];
  moments: ExperienceMoment[];
  cinematicScenes: CinematicScene[];
  adaptiveQuestions: string[];
  discoveries: string[];
};

const ACTIONS = [
  "arrived","entered","walked","went","came","left","returned","found","cleaned","washed","groomed","repaired","fixed","restored","built","made","created","designed","wrote","cooked","served","prepared","opened","closed","visited","traveled","travelled","drove","rode","painted","danced","sang","played","chose","picked","selected","decided","touched","held","wore","tasted","smelled","looked","saw","watched","shared","gave","took","brought","received","checked","inspected","tested","installed","removed","changed","turned","transformed","finished","completed","celebrated","married","photographed","captured","recorded","taught","learned","discovered","collected","organized","decorated","styled","trimmed","cut","brushed","dried","massaged","relaxed","pampered","spoiled","treated","shook","chewed","stole","tore","ate","ran","called","rented","documented","started","stopped","hit","sat","stood","talked","met","stayed","slept","practiced","won","lost","broke","rescued","adopted","graduated","performed","settled","cried","laughed","loved","hated","feared","remembered","forgot","crossed","lasted","happened","surrendered","disappeared","appeared","continued","waited","lingered","returned",
] as const;

const ACTION_RE = new RegExp(`\\b(?:${ACTIONS.join("|")})\\b`, "i");
const STATE_RE = /\b(?:has been|have been|had been|was|were|is|are|am|sat|stood|remained|became|kept|seemed|felt)\b/i;
const SEMANTIC_RE = new RegExp(`(?:${ACTION_RE.source.slice(2, -3)}|${STATE_RE.source.slice(2, -3)})`, "i");
const TIME_RE = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \w+ (?:minutes|hours|days|weeks|years)|for forty years|for \d+ years)\b/i;
const PLACE_RE = /\b(?:restaurant|bar|club|museum|theater|theatre|park|beach|hotel|house|home|kitchen|bathroom|bathrooms|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer|gym|spa|backyard|venue|pier|lake|mountain|forest|farm|garden|downtown|desert)\b/i;
const EMOTION_RE = /\b(?:nervous|suspicious|scared|afraid|excited|happy|sad|angry|furious|restless|delighted|terrified|calm|proud|lonely|curious|relieved|embarrassed|annoyed|thrilled|tender|intimate|weird|strange|wild|ridiculous|absurd|beautiful|romantic)\b/i;
const LEAK_RE = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|latent state|internal state|generated output|result is available|next experiential state|delivery pipeline|scan pipeline|customer-facing)\b/i;
const GENERIC_RE = /\b(?:arrived with opinions|entered like there was already a disagreement|approached .* compensation|negotiat(?:ed|ing) terms|appeared to be negotiating compensation|the ordinary part of the day had found an unexpected detail)\b/i;

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => sentence(value).toLowerCase();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? `${text[0]!.toUpperCase()}${text.slice(1)}` : "";
};

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function semanticMatches(text: string): number[] {
  const regex = new RegExp(`(?:${ACTIONS.join("|")}|has\\s+been|have\\s+been|had\\s+been|was|were|is|are|am|remained|became|kept|seemed|felt)`, "gi");
  return [...text.matchAll(regex)].flatMap((match) => typeof match.index === "number" ? [match.index] : []);
}

function splitSemanticClause(text: string): string[] {
  const value = sentence(text);
  const conjunction = /\s+(?:and|then|but|while|after|before)\s+/gi;
  const parts = value.split(conjunction).map(sentence).filter(Boolean);
  if (parts.length < 2) return [value];
  const output: string[] = [];
  let current = parts[0]!;
  for (let index = 1; index < parts.length; index += 1) {
    const right = parts[index]!;
    const leftHasSemantic = SEMANTIC_RE.test(current);
    const rightHasSemantic = SEMANTIC_RE.test(right);
    const leftHasHistory = /\b(?:has been|have been|had been|for \w+ years|for \w+ months|for \w+ weeks)\b/i.test(current);
    if ((leftHasSemantic && rightHasSemantic) || (leftHasHistory && rightHasSemantic)) {
      output.push(current);
      current = right;
    } else {
      current = `${current} and ${right}`;
    }
  }
  output.push(current);
  return unique(output);
}

function splitPrompt(prompt: string): string[] {
  const chunks = clean(prompt).split(/\n+|\s*·\s*|(?<=[.!?])\s+/).map(sentence).filter(Boolean);
  const output: string[] = [];
  for (const chunk of chunks) {
    const commaParts = chunk.split(/,\s+/).map(sentence).filter(Boolean);
    let current = "";
    for (const part of commaParts) {
      const normalized = part.replace(/^(?:and|but|then)\s+/i, "");
      if (current && SEMANTIC_RE.test(current) && SEMANTIC_RE.test(normalized)) {
        output.push(...splitSemanticClause(current));
        current = normalized;
      } else {
        current = current ? `${current}, ${normalized}` : normalized;
      }
    }
    if (current) output.push(...splitSemanticClause(current));
  }
  return unique(output);
}

function actionOf(text: string): string | undefined { return text.match(ACTION_RE)?.[0]; }

function actorOf(text: string): string | undefined {
  const action = actionOf(text);
  if (action) {
    const index = lower(text).indexOf(action.toLowerCase());
    if (index > 0) {
      const prefix = clean(text.slice(0, index).replace(/^(?:then|and|but|my|our|the|a|an)\s+/i, ""));
      if (prefix && prefix.length <= 80 && !ACTION_RE.test(prefix)) return prefix;
    }
  }
  const state = text.match(/^(.*?)\s+(?:has been|have been|had been|was|were|is|are|am)\b/i);
  return state?.[1] ? sentence(state[1].replace(/^(?:my|our|the|a|an)\s+/i, "")) : undefined;
}

function placeOf(text: string): string | undefined {
  const explicit = text.match(/\b(?:at|in|inside|near|around|outside|on|to)\s+(?:the\s+)?([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,5})/);
  if (explicit?.[1] && !/^(?:and|but|then|first|last|home|it|the)\b/i.test(explicit[1])) return sentence(explicit[1]);
  return text.match(PLACE_RE)?.[0];
}

function timeOf(text: string): string | undefined { return text.match(TIME_RE)?.[0]; }

function objectOf(text: string, action?: string): string | undefined {
  if (!action) return undefined;
  const match = text.match(new RegExp(`\\b${action}\\b(?:\\s+(?:the|a|an))?\\s+([A-Za-z0-9'’-]+(?:\\s+[A-Za-z0-9'’-]+){0,3})`, "i"));
  const value = sentence(match?.[1]);
  if (!value || PLACE_RE.test(value) || TIME_RE.test(value) || /^(?:home|there|again|until)$/i.test(value)) return undefined;
  return value;
}

function memoryStrings(context?: ExperienceCompilerContext): string[] {
  const values = [...(context?.memorySummary ?? [])];
  for (const memory of context?.memories ?? []) values.push(typeof memory === "string" ? memory : JSON.stringify(memory));
  if (context?.event) values.push(JSON.stringify(context.event));
  return values.map(clean).filter(Boolean);
}

function lensOf(prompt: string, plan?: CognitiveExperiencePlan): Lens {
  const corpus = lower([prompt, ...(plan?.emotionalIntent ?? []), ...(plan?.creativePossibilities ?? [])].join(" "));
  if (/\b(?:horror|terrifying|scary|haunted|creepy|sinister|demented|dark)\b/i.test(corpus)) return "horror";
  if (/\b(?:funny|humor|humour|comedy|playful|absurd|ridiculous|silly|cheeky|witty|hilarious)\b/i.test(corpus)) return "comedy";
  if (/\b(?:romantic|romance|intimate|tender|first date|love)\b/i.test(corpus)) return "romance";
  if (/\b(?:wild|chaotic|unhinged)\b/i.test(corpus)) return "wild";
  return "qre";
}

function resolveFromMemory(event: SourceEvent, memories: string[], knownPlaces: string[]): { event: SourceEvent; matches: string[]; question?: string } {
  if (!/\b(?:back|again|returned|returning|same place|there)\b/i.test(event.raw) || event.place) return { event, matches: [] };
  const places = unique([...knownPlaces, ...memories.flatMap((memory) => memory.match(new RegExp(PLACE_RE.source, "ig")) ?? [])]);
  if (places.length === 1) return { event: { ...event, place: places[0], resolvedFromMemory: places[0] }, matches: [places[0]] };
  if (places.length > 1) return { event, matches: places.slice(0, 5), question: "Which place did you go back to?" };
  return { event, matches: [], question: "Where did you go back to?" };
}

function extractWorld(prompt: string, plan?: CognitiveExperiencePlan, context?: ExperienceCompilerContext): { world: World; adaptiveQuestions: string[] } {
  const memories = memoryStrings(context);
  const clauses = splitPrompt(prompt);
  const baseEvents: SourceEvent[] = clauses.map((raw, index) => {
    const action = actionOf(raw);
    return { id: `event-${index + 1}`, order: index, raw, actor: actorOf(raw), action, object: objectOf(raw, action), place: placeOf(raw), time: timeOf(raw), emotion: raw.match(EMOTION_RE)?.[0] };
  });
  const knownPlaces = unique([
    ...(plan?.premise?.slots.filter((slot) => slot.role === "place").flatMap((slot) => slot.values) ?? []),
    ...(context?.location?.label ? [context.location.label] : []),
    ...(context?.event?.venue ? [context.event.venue] : []),
  ]);
  const adaptiveQuestions: string[] = [];
  const memoryMatches: string[] = [];
  const events = baseEvents.map((event) => {
    const resolved = resolveFromMemory(event, memories, knownPlaces);
    memoryMatches.push(...resolved.matches);
    if (resolved.question) adaptiveQuestions.push(resolved.question);
    return resolved.event;
  });
  let carryActor: string | undefined;
  let carryPlace: string | undefined;
  for (const event of events) {
    if (event.actor) carryActor = event.actor;
    else if (carryActor && (event.action || event.raw)) event.actor = carryActor;
    if (event.place) carryPlace = event.place;
    else if (carryPlace && /\b(?:there|same place|back|again)\b/i.test(event.raw)) event.place = carryPlace;
  }
  const entities = unique([
    ...events.flatMap((event) => [event.actor ?? "", event.object ?? "", event.place ?? ""]),
    ...(plan?.premise?.slots.filter((slot) => slot.role === "subject").flatMap((slot) => slot.values) ?? []),
  ]);
  const participants = unique([
    ...(plan?.premise?.slots.filter((slot) => slot.role === "participants").flatMap((slot) => slot.values) ?? []),
    ...events.map((event) => event.actor ?? ""),
  ]);
  const places = unique([...knownPlaces, ...events.map((event) => event.place ?? "")]);
  const times = unique([
    ...(plan?.premise?.slots.filter((slot) => slot.role === "temporal").flatMap((slot) => slot.values) ?? []),
    ...events.map((event) => event.time ?? ""),
  ]);
  return {
    adaptiveQuestions: unique(adaptiveQuestions),
    world: {
      prompt,
      events: events.length ? events : [{ id: "event-1", order: 0, raw: sentence(prompt) }],
      entities,
      participants,
      places,
      times,
      lens: lensOf(prompt, plan),
      signals: unique([...(plan?.creativePossibilities ?? []), ...(plan?.emotionalIntent ?? [])]),
      memoryMatches: unique(memoryMatches),
    },
  };
}

function creativeLines(event: SourceEvent, world: World): string[] {
  const actor = event.actor;
  const object = event.object;
  const action = lower(event.action ?? "");
  const place = event.place;
  const time = event.time;
  const raw = sentence(event.raw);
  const lines = [raw];

  if (/\b(?:returned|back|again)\b/.test(raw) && place) lines.push(actor ? `${cap(actor)} was back at ${place}.` : `Back at ${place}, the old details had company again.`);
  if (/\b(?:stole|chewed|broke|tore|ate)\b/.test(action) && actor && object && (world.lens === "comedy" || world.lens === "wild")) lines.push(`${cap(actor)} apparently decided ${object} was worth the trouble.`);
  if (/\b(?:talked|stayed|met|lingered)\b/.test(action) && time && /until closing/i.test(time)) lines.push(actor ? `${cap(actor)} stayed talking until closing.` : `The conversation carried on until closing.`);
  else if (/\b(?:talked|stayed|met|lingered)\b/.test(action)) lines.push(place ? `They kept talking while ${place} slowly emptied around them.` : `The talking lasted longer than anyone had planned.`);
  if (/\b(?:cleaned|groomed|washed|restored|repaired|transformed)\b/.test(action) && actor) lines.push(`${cap(actor)} started with one version of the situation and left with another.`);
  if (!action && /\b(?:has been|have been|had been|was|were|is|are)\b/i.test(raw)) lines.push(`Some histories are quiet until the right detail brings them back to life.`);
  if (world.lens === "horror") {
    if (object) lines.push(`${cap(object)} was the first detail that felt slightly wrong.`);
    else if (place) lines.push(`At ${place}, something about the moment stopped feeling ordinary.`);
  }
  if (world.lens === "romance" && actor && place && /\b(?:returned|back|met|stayed|talked|went|came)\b/.test(action)) lines.push(`${cap(actor)} was back at ${place}, and the place carried the memory with it.`);

  return unique(lines).filter((line) => !LEAK_RE.test(line) && !GENERIC_RE.test(line));
}

function score(line: string, event: SourceEvent, used: Set<string>, world: World): number {
  const value = lower(line);
  const raw = lower(event.raw);
  const required = [event.actor, event.object, event.place, event.time].filter(Boolean) as string[];
  let total = 0;
  for (const evidence of required) total += value.includes(lower(evidence)) ? (evidence === event.actor ? 4 : 10) : -28;
  if (event.action && value.includes(lower(event.action))) total += 5;
  if (value !== raw) total += 7;
  if (line.length >= 36 && line.length <= 180) total += 3;
  if (used.has(value)) total -= 100;
  if (GENERIC_RE.test(line) || LEAK_RE.test(line)) total -= 100;
  return total;
}

function beatKind(index: number, total: number): StoryBeatKind {
  if (total === 1) return "payoff";
  if (index === 0) return "orientation";
  if (index === total - 1) return "payoff";
  if (index === 1) return "encounter";
  if (index === total - 2) return "transformation";
  return index % 2 === 0 ? "discovery" : "escalation";
}

function directiveFor(event: SourceEvent, kind: StoryBeatKind): CognitiveBeatDirective {
  return {
    kind,
    intent: "realize the strongest supported change, relationship, or memorable detail in this event",
    subject: event.actor ?? event.object ?? event.place ?? "",
    action: event.action ?? "",
    stateBefore: "",
    stateAfter: "",
    relationalFocus: unique([event.object ?? "", event.place ?? "", event.time ?? ""]),
    evidence: [{ source: event.resolvedFromMemory ? "memory" : "prompt", detail: event.raw, confidence: 1 }],
    confidence: 1,
  };
}

function transition(lens: Lens, index: number): "none" | "fade" | "slide" | "zoom" | "cinematic" | "flash" {
  if (index === 0) return "none";
  if (lens === "horror") return index % 2 ? "fade" : "flash";
  if (lens === "romance") return "cinematic";
  if (lens === "wild") return "zoom";
  return index % 3 === 0 ? "slide" : "fade";
}

function visual(lens: Lens, index: number) {
  if (lens === "horror") return { theme: "dark" as const, animation: "glitch" as const };
  if (lens === "romance") return { theme: "cinematic" as const, animation: "slow_zoom" as const };
  if (lens === "wild") return { theme: "cinematic" as const, animation: "particles" as const };
  return { theme: "cinematic" as const, animation: index === 0 ? "slow_zoom" as const : "parallax" as const };
}

export function messageText(moment: ExperienceMoment): string {
  return moment.text ?? moment.description ?? moment.title ?? (typeof moment.meta?.text === "string" ? moment.meta.text : "");
}

export function compileUniversalExperienceBrain(prompt: string, plan?: CognitiveExperiencePlan, context?: ExperienceCompilerContext): UniversalBrainResult {
  const { world, adaptiveQuestions } = extractWorld(prompt, plan, context);
  const used = new Set<string>();
  const sourceEvents = world.events.slice(0, 16);
  const beats: StoryBeat[] = sourceEvents.map((event, index) => {
    const ranked = creativeLines(event, world).map((candidate) => ({ candidate, score: score(candidate, event, used, world) })).sort((left, right) => right.score - left.score || hash(`${prompt}:${event.id}:${left.candidate}`) - hash(`${prompt}:${event.id}:${right.candidate}`));
    const chosen = ranked[0]?.candidate ?? event.raw;
    const kind = beatKind(index, sourceEvents.length);
    used.add(lower(chosen));
    return {
      id: `brain-${event.id}`,
      kind,
      order: index,
      purpose: "perform concrete source reality as an engaging experience",
      text: `${sentence(chosen)}.`,
      emotionalTarget: event.emotion,
      entities: unique([event.actor ?? "", event.object ?? "", event.place ?? ""]),
      provenance: [{ kind: "observed", source: event.resolvedFromMemory ? "memory" : "prompt", confidence: 1 }],
      directive: directiveFor(event, kind),
    };
  });

  const finalBeats = beats.length ? beats : [{
    id: "brain-fallback",
    kind: "payoff" as StoryBeatKind,
    order: 0,
    purpose: "preserve source input",
    text: `${sentence(prompt)}.`,
    entities: [],
    provenance: [{ kind: "observed" as const, source: "prompt", confidence: 1 }],
    directive: directiveFor({ id: "fallback", order: 0, raw: sentence(prompt) }, "payoff"),
  }];

  const moments: ExperienceMoment[] = finalBeats.map((beat, index) => {
    const event = sourceEvents[index];
    const text = beat.text;
    return {
      type: "message",
      component: "story",
      title: text,
      text,
      description: text,
      editable: true,
      demo: false,
      order: index,
      payload: {
        source: "canonical-universal-experience-brain",
        beatId: beat.id,
        realityEventId: event?.id,
        place: event?.place,
        time: event?.time,
        resolvedFromMemory: event?.resolvedFromMemory,
      },
      meta: {
        source: "canonical-universal-experience-brain",
        lens: world.lens,
        realityEventId: event?.id,
        place: event?.place,
        time: event?.time,
        resolvedFromMemory: event?.resolvedFromMemory,
        duration: index === finalBeats.length - 1 ? 5200 : 3600,
      },
    };
  });

  const discoveries = unique([
    ...world.memoryMatches.map((place) => `This experience connects to ${place}.`),
    ...world.events.filter((event) => /\b(?:returned|back|again)\b/i.test(event.raw)).map((event) => `A return to ${event.place ?? "a known place"} may be part of an emerging pattern.`),
  ]);

  const cinematicScenes: CinematicScene[] = moments.map((moment, index) => ({
    id: `brain-scene-${index + 1}`,
    type: index === 0 ? "intro" : index === moments.length - 1 ? "emotion" : "action",
    duration: Number(moment.meta?.duration ?? 3600),
    moment,
    order: index,
    transition: transition(world.lens, index),
    visual: visual(world.lens, index),
    preload: index < moments.length - 1,
  }));

  return { world, beats: finalBeats, moments, cinematicScenes, adaptiveQuestions, discoveries };
}
