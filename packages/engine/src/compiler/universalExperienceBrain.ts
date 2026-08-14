import type {
  CinematicScene,
  CognitiveBeatDirective,
  CognitiveExperiencePlan,
  ExperienceMoment,
  StoryBeat,
  StoryBeatKind,
} from "@qre/contracts";
import type { ExperienceCompilerContext } from "../experience/experienceCompilerContext.js";

/**
 * STATUS: CANONICAL
 * ROLE: Universal cognitive + creative realization brain.
 *
 * Pipeline:
 * input -> evidence -> world -> memory resolution -> change/attention ->
 * creative hypotheses -> ranked realization -> ExperienceMoment -> cinema.
 *
 * MUST NOT: classify domains, invent factual participants, invent owners,
 * expose internal cognition language, or turn templates into facts.
 */

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

const ACTIONS = new Set([
  "arrived","entered","walked","went","came","left","returned","found","cleaned","washed","groomed","repaired","fixed","restored","built","made","created","designed","wrote","cooked","served","prepared","opened","closed","visited","traveled","travelled","drove","rode","painted","danced","sang","played","chose","picked","selected","decided","touched","held","wore","tasted","smelled","looked","saw","watched","shared","gave","took","brought","received","checked","inspected","tested","installed","removed","changed","turned","transformed","finished","completed","celebrated","married","photographed","captured","recorded","taught","learned","discovered","collected","organized","decorated","styled","trimmed","cut","brushed","dried","massaged","relaxed","pampered","spoiled","treated","shook","chewed","stole","tore","ate","ran","called","rented","documented","started","stopped","hit","sat","stood","talked","met","stayed","slept","practiced","won","lost","broke","rescued","adopted","graduated","performed","settled","cried","laughed","loved","hated","feared","remembered","forgot","crossed","lasted","happened",
]);
const ACTION_RE = new RegExp(`\\b(?:${[...ACTIONS].join("|")})\\b`, "i");
const TIME_RE = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \w+ (?:minutes|hours|days|weeks|years))\b/i;
const EMOTION_RE = /\b(?:nervous|suspicious|scared|afraid|excited|happy|sad|angry|furious|restless|delighted|terrified|calm|proud|lonely|curious|relieved|embarrassed|annoyed|thrilled|tender|intimate|weird|strange|wild|ridiculous|absurd|beautiful|romantic)\b/i;
const PLACE_WORDS = /\b(?:restaurant|bar|club|museum|theater|theatre|park|beach|hotel|house|home|kitchen|bathroom|bathrooms|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer|gym|spa|backyard|venue|pier|lake|mountain|forest|farm|garden|downtown|desert)\b/i;
const LEAK_RE = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|latent state|internal state|generated output|result is available|next experiential state|delivery pipeline|scan pipeline|customer-facing)\b/i;
const STOP = new Set(["the","a","an","and","or","but","for","with","about","from","this","that","then","there","here","when","where","while","because","was","were","is","are","be","been","being","it","its","they","them","their","he","she","his","her","we","our","you","your","i","my","me","to","of","in","on","at","as","by","than","more","very","really","just","want","need","make","create","build","turn","write","show","give","send","story","experience","something","anything"]);

const clean = (v: unknown): string => typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
const sentence = (v: unknown): string => clean(v).replace(/[.!?]+$/, "");
const lower = (v: unknown): string => sentence(v).toLowerCase();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (v: string): string => {
  const s = sentence(v);
  return s ? s[0]!.toUpperCase() + s.slice(1) : "";
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function splitPrompt(prompt: string): string[] {
  const source = clean(prompt);
  if (!source) return [];
  const coarse = source
    .split(/\n+|\s*·\s*|(?<=[.!?])\s+/)
    .map(sentence)
    .filter(Boolean);

  const pieces: string[] = [];
  for (const chunk of coarse) {
    const parts = chunk.split(/,\s+/).map(sentence).filter(Boolean);
    if (parts.length === 1) {
      pieces.push(chunk);
      continue;
    }
    let current = "";
    for (const part of parts) {
      const hasAction = ACTION_RE.test(part) || EMOTION_RE.test(part);
      if (hasAction && current && ACTION_RE.test(current)) {
        pieces.push(sentence(current));
        current = part;
      } else {
        current = current ? `${current}, ${part}` : part;
      }
    }
    if (current) pieces.push(sentence(current));
  }
  return unique(pieces);
}

function actorOf(text: string): string | undefined {
  const action = actionOf(text);
  if (!action) return undefined;
  const prefix = sentence(text).slice(0, lower(text).indexOf(lower(action))).trim();
  const candidate = sentence(prefix.replace(/^(?:my|our|the|a|an)\s+/i, ""));
  if (!candidate || candidate.length > 60 || ACTION_RE.test(candidate)) return undefined;
  return candidate;
}

function actionOf(text: string): string | undefined { return text.match(ACTION_RE)?.[0]; }
function placeOf(text: string): string | undefined {
  const explicit = text.match(/\b(?:at|in|inside|near|around|outside|on)\s+(?:the\s+)?([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,5})/);
  if (explicit?.[1] && !/^(?:and|but|then|first|last)\b/i.test(explicit[1])) return sentence(explicit[1]);
  return text.match(PLACE_WORDS)?.[0];
}
function timeOf(text: string): string | undefined { return text.match(TIME_RE)?.[0]; }
function objectOf(text: string, action?: string): string | undefined {
  if (!action) return undefined;
  const explicit = text.match(new RegExp(`\\b${action}\\b(?:\\s+(?:the|a|an))?\\s+([A-Za-z0-9'’-]+(?:\\s+[A-Za-z0-9'’-]+){0,3})`, "i"));
  return explicit?.[1] ? sentence(explicit[1]) : undefined;
}

function memoryStrings(context?: ExperienceCompilerContext): string[] {
  const values: string[] = [...(context?.memorySummary ?? [])];
  for (const item of context?.memories ?? []) {
    if (typeof item === "string") values.push(item);
    else if (item && typeof item === "object") values.push(JSON.stringify(item));
  }
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
  const raw = lower(event.raw);
  const backRef = /\b(?:back|again|returned|returning|same place|there)\b/i.test(raw);
  if (!backRef || event.place) return { event, matches: [] };

  const placeCandidates = unique([...knownPlaces, ...memories.flatMap((m) => m.match(new RegExp(PLACE_WORDS.source, "ig")) ?? [])]);
  if (placeCandidates.length === 1) {
    return {
      event: { ...event, place: placeCandidates[0], resolvedFromMemory: placeCandidates[0] },
      matches: [placeCandidates[0]],
    };
  }
  if (placeCandidates.length > 1) return { event, matches: placeCandidates.slice(0, 5), question: "Which place did you go back to?" };
  return { event, matches: [], question: "Where did you go back to?" };
}

function extractWorld(prompt: string, plan?: CognitiveExperiencePlan, context?: ExperienceCompilerContext): { world: World; adaptiveQuestions: string[] } {
  const memories = memoryStrings(context);
  const clauses = splitPrompt(prompt);
  const baseEvents: SourceEvent[] = clauses.map((raw, index) => {
    const action = actionOf(raw);
    return {
      id: `event-${index + 1}`,
      order: index,
      raw,
      actor: actorOf(raw),
      action,
      object: objectOf(raw, action),
      place: placeOf(raw),
      time: timeOf(raw),
      emotion: raw.match(EMOTION_RE)?.[0],
    };
  });

  const knownPlaces = unique([
    ...(plan?.premise?.slots.filter((s) => s.role === "place").flatMap((s) => s.values) ?? []),
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
  let carryTime: string | undefined;
  for (const event of events) {
    if (event.actor) carryActor = event.actor;
    else if (carryActor && event.action) event.actor = carryActor;
    if (event.place) carryPlace = event.place;
    else if (carryPlace && /\b(?:there|same place|back|again)\b/i.test(event.raw)) event.place = carryPlace;
    if (event.time) carryTime = event.time;
    else if (carryTime && /\b(?:then|later|after|until)\b/i.test(event.raw)) event.time = carryTime;
  }

  const entities = unique([
    ...events.flatMap((e) => [e.actor ?? "", e.object ?? ""]),
    ...(plan?.premise?.slots.filter((s) => s.role === "subject").flatMap((s) => s.values) ?? []),
  ]);
  const participants = unique([
    ...(plan?.premise?.slots.filter((s) => s.role === "participants").flatMap((s) => s.values) ?? []),
    ...events.map((e) => e.actor ?? ""),
  ]);
  const places = unique([
    ...knownPlaces,
    ...events.map((e) => e.place ?? ""),
  ]);
  const times = unique([
    ...(plan?.premise?.slots.filter((s) => s.role === "temporal").flatMap((s) => s.values) ?? []),
    ...events.map((e) => e.time ?? ""),
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
  const raw = sentence(event.raw);
  const lines = [raw];

  if (/\breturned\b|\bback\b|\bagain\b/.test(action + " " + lower(raw))) {
    if (actor && place) lines.push(`${cap(actor)} was back at ${place}, which meant the place had officially become part of the story.`);
    else if (place) lines.push(`Back at ${place}, the old details suddenly had company.`);
  }
  if (/\b(?:stole|chewed|broke|tore)\b/.test(action) && actor && object) lines.push(`${cap(actor)} appeared to regard ${object} as negotiable property.`);
  if (/\b(?:talked|stayed|met)\b/.test(action) && actor && place) lines.push(`The talking lasted long enough for ${place} to start disappearing around them.`);
  if (/\b(?:cleaned|groomed|washed|restored|repaired|transformed)\b/.test(action) && actor) lines.push(`${cap(actor)} started with a mess and somehow ended with evidence that the plan had worked.`);

  if (world.lens === "comedy" || world.lens === "wild" || world.lens === "qre") {
    if (actor && object) lines.push(
      `${cap(actor)} treated ${object} like it had personally caused the problem.`,
      `${cap(actor)} and ${object} appeared to be negotiating terms.`,
      `${cap(actor)} approached ${object} like compensation was part of the package.`,
    );
    else if (actor) lines.push(
      `${cap(actor)} arrived with opinions and apparently intended to keep them.`,
      `${cap(actor)} had the unmistakable energy of someone preparing a complaint.`,
    );
    else if (object) lines.push(`${cap(object)} suddenly mattered more than anyone had planned.`);
  }

  if (world.lens === "horror") {
    if (object) lines.push(`${cap(object)} was the first detail that felt slightly wrong.`, `Then ${object} became difficult to ignore.`);
    else if (place) lines.push(`At ${place}, something about the moment stopped feeling ordinary.`);
  }
  if (world.lens === "romance") {
    if (actor && place) lines.push(`${cap(actor)} was back at ${place}, and the place carried the memory with it.`);
    else if (actor && object) lines.push(`${cap(actor)} stayed with ${object} a little longer than the moment required.`);
  }

  return unique(lines).filter((line) => !LEAK_RE.test(line));
}

function score(line: string, event: SourceEvent, used: Set<string>, world: World): number {
  const value = lower(line);
  const raw = lower(event.raw);
  let scoreValue = 0;
  for (const evidence of [event.actor, event.action, event.object, event.place, event.time].filter(Boolean) as string[]) {
    if (value.includes(lower(evidence))) scoreValue += evidence === event.actor ? 3 : 5;
  }
  if (value !== raw) scoreValue += 7;
  if (value !== raw && world.lens === "qre") scoreValue += 4;
  if (line.length >= 36 && line.length <= 180) scoreValue += 3;
  if (used.has(value)) scoreValue -= 100;
  if (LEAK_RE.test(line)) scoreValue -= 100;
  return scoreValue;
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

function normalize(line: string, index: number, lens: Lens): string {
  const value = sentence(line);
  if (!value || index === 0) return value;
  if (/^(?:then|and|at|by|back|eventually|later|for|looking|somewhere)\b/i.test(value)) return value;
  if (lens === "horror" || lens === "comedy" || lens === "wild") return `Then ${value.toLowerCase()}`;
  if (lens === "romance") return `And ${value.toLowerCase()}`;
  return value;
}

function messageText(moment: ExperienceMoment): string {
  return moment.text ?? moment.description ?? moment.title ?? (typeof moment.meta?.text === "string" ? moment.meta.text : "");
}

export function compileUniversalExperienceBrain(
  prompt: string,
  plan?: CognitiveExperiencePlan,
  context?: ExperienceCompilerContext,
): UniversalBrainResult {
  const { world, adaptiveQuestions } = extractWorld(prompt, plan, context);
  const used = new Set<string>();
  const sourceEvents = world.events.slice(0, 16);

  const beats: StoryBeat[] = sourceEvents.map((event, index) => {
    const candidates = creativeLines(event, world);
    const ranked = candidates
      .map((candidate) => ({ candidate, score: score(candidate, event, used, world) }))
      .sort((a, b) => b.score - a.score || hash(`${prompt}:${event.id}:${a.candidate}`) - hash(`${prompt}:${event.id}:${b.candidate}`));
    const chosen = normalize(ranked[0]?.candidate ?? event.raw, index, world.lens);
    used.add(lower(chosen));
    const kind = beatKind(index, sourceEvents.length);
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

  if (beats.length === 0) {
    beats.push({
      id: "brain-fallback",
      kind: "payoff",
      order: 0,
      purpose: "preserve source input",
      text: `${sentence(prompt)}.`,
      entities: [],
      provenance: [{ kind: "observed", source: "prompt", confidence: 1 }],
      directive: directiveFor({ id: "fallback", order: 0, raw: sentence(prompt) }, "payoff"),
    });
  }

  const moments: ExperienceMoment[] = beats.map((beat, index) => {
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
        duration: index === beats.length - 1 ? 5200 : 3600,
      },
    };
  });

  const discoveries = unique([
    ...world.memoryMatches.map((place) => `This experience connects to ${place}.`),
    ...(world.events.filter((e) => /\b(?:returned|back|again)\b/i.test(e.raw)).map((e) => `A return to ${e.place ?? "a known place"} may be part of an emerging pattern.`)),
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

  return { world, beats, moments, cinematicScenes, adaptiveQuestions, discoveries };
}

export { messageText };
