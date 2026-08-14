import type {
  CinematicScene,
  CognitiveBeatDirective,
  CognitiveExperiencePlan,
  Moment,
  StoryBeat,
  StoryBeatKind,
} from "@qre/contracts";

/**
 * STATUS: CANONICAL
 * ROLE: Universal cognitive/creative bridge for compiler input.
 * INPUT: raw human prompt + optional cognitive plan.
 * OUTPUT: source world, creative scene candidates, runtime moments, cinematic scenes.
 * MUST NOT: classify domains, invent factual participants/owners/places/events, expose cognitive vocabulary.
 * ARCHITECTURE: reality -> memory/context -> attention -> creative candidates -> ranked performance -> runtime.
 *
 * This is intentionally not a story-template engine. The same machinery handles pets,
 * weddings, businesses, events, people, objects, places, memories, tickets, and arbitrary input.
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
};

export type UniversalBrainResult = {
  world: World;
  beats: StoryBeat[];
  moments: Moment[];
  cinematicScenes: CinematicScene[];
};

const ACTIONS = new Set([
  "arrived", "entered", "walked", "went", "came", "left", "returned", "found", "cleaned", "washed", "groomed",
  "repaired", "fixed", "restored", "built", "made", "created", "designed", "wrote", "cooked", "served", "prepared",
  "opened", "closed", "visited", "traveled", "travelled", "drove", "rode", "painted", "danced", "sang", "played",
  "chose", "picked", "selected", "decided", "held", "wore", "tasted", "smelled", "looked", "saw", "watched",
  "shared", "gave", "took", "brought", "received", "checked", "inspected", "tested", "installed", "removed", "changed",
  "turned", "transformed", "finished", "completed", "celebrated", "married", "photographed", "captured", "recorded",
  "taught", "learned", "discovered", "collected", "organized", "decorated", "styled", "trimmed", "cut", "brushed",
  "dried", "massaged", "relaxed", "pampered", "spoiled", "treated", "shook", "chewed", "stole", "tore", "ate", "ran",
  "called", "rented", "documented", "started", "stopped", "hit", "sat", "stood", "talked", "met", "stayed", "slept",
  "practiced", "won", "lost", "broke", "rescued", "adopted", "graduated", "performed", "settled", "cried", "laughed",
  "loved", "hated", "feared", "remembered", "forgot", "returned", "crossed",
]);

const ACTION_RE = new RegExp(`\\b(?:${[...ACTIONS].join("|")})\\b`, "i");
const TIME_RE = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \w+ (?:minutes|hours|days|weeks|years))\b/i;
const EMOTION_RE = /\b(?:nervous|suspicious|scared|afraid|excited|happy|sad|angry|furious|restless|delighted|terrified|calm|proud|lonely|curious|relieved|embarrassed|annoyed|thrilled|tender|intimate|weird|strange|wild|ridiculous|absurd|beautiful|romantic)\b/i;
const PLACE_WORDS = /\b(?:restaurant|bar|club|museum|theater|theatre|park|beach|hotel|house|home|kitchen|bathroom|bathrooms|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer|gym|spa|backyard|venue|pier|lake|mountain|forest|farm|garden|downtown|desert)\b/i;
const LENS_RE = /\b(?:funny|humor|humour|comedy|playful|absurd|ridiculous|silly|cheeky|witty|hilarious|horror|terrifying|scary|haunted|creepy|sinister|romantic|romance|intimate|tender|wild|demented|dark)\b/i;
const LEAK_RE = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|latent state|internal state|generated output|result is available|next experiential state|delivery pipeline|scan pipeline|customer-facing)\b/i;
const STOP = new Set(["the", "a", "an", "and", "or", "but", "for", "with", "about", "from", "this", "that", "then", "there", "here", "when", "where", "while", "because", "was", "were", "is", "are", "be", "been", "being", "it", "its", "they", "them", "their", "he", "she", "his", "her", "we", "our", "you", "your", "i", "my", "me", "to", "of", "in", "on", "at", "as", "by", "than", "more", "very", "really", "just", "want", "need", "make", "create", "build", "turn", "write", "show", "give", "send", "story", "experience", "something", "anything"]);

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
  const source = sentence(prompt);
  if (!source) return [];
  const sentences = source.split(/(?<=[.!?])\s+/).map(sentence).filter(Boolean);
  const pieces: string[] = [];

  for (const s of sentences) {
    const commaParts = s.split(/,\s+/).map(sentence).filter(Boolean);
    if (commaParts.length < 2) {
      pieces.push(s);
      continue;
    }

    let current: string[] = [];
    const flush = () => {
      if (current.length) {
        pieces.push(sentence(current.join(", ")));
        current = [];
      }
    };

    for (const part of commaParts) {
      const candidate = part.replace(/^(?:and|but|then)\s+/i, "");
      const hasAction = ACTION_RE.test(candidate) || EMOTION_RE.test(candidate);
      if (hasAction) {
        if (current.length && ACTION_RE.test(current.join(" "))) flush();
        current.push(candidate);
      } else {
        current.push(candidate);
      }
    }
    flush();
  }

  return unique(pieces);
}

function words(text: string): string[] {
  return sentence(text).split(/[^A-Za-z0-9'’-]+/).map((v) => v.toLowerCase()).filter((v) => v.length > 2 && !STOP.has(v));
}

function actorOf(text: string): string | undefined {
  const m = sentence(text).match(/^((?:my|our|the|a|an)?\s*[A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9'’-]+){0,3})\s+(?=\w)/i);
  if (!m?.[1]) return undefined;
  const candidate = sentence(m[1].replace(/^(?:my|our|the|a|an)\s+/i, ""));
  return candidate && !ACTION_RE.test(candidate) ? candidate : undefined;
}

function actionOf(text: string): string | undefined {
  return text.match(ACTION_RE)?.[0];
}

function objectOf(text: string, action?: string): string | undefined {
  if (!action) return undefined;
  const after = text.match(new RegExp(`\\b${action}\\b\\s+(?:the|a|an)?\\s*([A-Za-z0-9'’-]+(?:\\s+[A-Za-z0-9'’-]+){0,2})`, "i"));
  if (after?.[1]) return sentence(after[1]);
  const preferred = /\b(?:blue bow|bath|bubbles|kitchen|bathrooms?|living room|watch|truck|guitar pick|recipe|cake|door|window|lights|ring|clues|song|chairs|table|coffee|shoes|photo|video|crowd|band|house|home|surfboard|dress|restaurant|laundry set)\b/i;
  return text.match(preferred)?.[0];
}

function placeOf(text: string): string | undefined {
  const explicit = text.match(/\b(?:at|in|inside|near|around|outside|on)\s+(?:the\s+)?([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,4})/);
  if (explicit?.[1] && !/^(?:and|but|then|first|last)\b/i.test(explicit[1])) return sentence(explicit[1]);
  return text.match(PLACE_WORDS)?.[0];
}

function timeOf(text: string): string | undefined {
  return text.match(TIME_RE)?.[0];
}

function lensOf(prompt: string, plan?: CognitiveExperiencePlan): Lens {
  const corpus = lower([prompt, ...(plan?.emotionalIntent ?? []), ...(plan?.creativePossibilities ?? [])].join(" "));
  if (/\b(?:horror|terrifying|scary|haunted|creepy|sinister|demented|dark)\b/i.test(corpus)) return "horror";
  if (/\b(?:funny|humor|humour|comedy|playful|absurd|ridiculous|silly|cheeky|witty|hilarious)\b/i.test(corpus)) return "comedy";
  if (/\b(?:romantic|romance|intimate|tender|first date|love)\b/i.test(corpus)) return "romance";
  if (/\b(?:wild|chaotic|unhinged)\b/i.test(corpus)) return "wild";
  return "qre";
}

function extractWorld(prompt: string, plan?: CognitiveExperiencePlan): World {
  const clauses = splitPrompt(prompt);
  const events: SourceEvent[] = clauses.map((raw, index) => ({
    id: `event-${index + 1}`,
    order: index,
    raw,
    actor: actorOf(raw),
    action: actionOf(raw),
    object: objectOf(raw, actionOf(raw)),
    place: placeOf(raw),
    time: timeOf(raw),
    emotion: raw.match(EMOTION_RE)?.[0],
  }));

  let carryActor: string | undefined;
  for (const event of events) {
    if (event.actor) carryActor = event.actor;
    else if (carryActor && event.action) event.actor = carryActor;
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
    ...(plan?.premise?.slots.filter((s) => s.role === "place").flatMap((s) => s.values) ?? []),
    ...events.map((e) => e.place ?? ""),
  ]);
  const times = unique([
    ...(plan?.premise?.slots.filter((s) => s.role === "temporal").flatMap((s) => s.values) ?? []),
    ...events.map((e) => e.time ?? ""),
  ]);

  return {
    prompt,
    events: events.length ? events : [{ id: "event-1", order: 0, raw: sentence(prompt) }],
    entities,
    participants,
    places,
    times,
    lens: lensOf(prompt, plan),
    signals: unique([...(plan?.creativePossibilities ?? []), ...(plan?.emotionalIntent ?? [])]),
  };
}

function creativeLines(event: SourceEvent, world: World): string[] {
  const actor = event.actor;
  const object = event.object;
  const action = event.action;
  const raw = sentence(event.raw);
  const lines: string[] = [raw];

  if (world.lens === "comedy" || world.lens === "wild" || world.lens === "qre") {
    if (actor && object) lines.push(
      `${cap(actor)} treated ${object} like it had personally caused the problem.`,
      `${cap(actor)} and ${object} appeared to be negotiating terms.`,
      `${cap(actor)} approached ${object} like compensation was part of the package.`,
    );
    else if (actor) lines.push(
      `${cap(actor)} arrived with opinions and apparently intended to keep them.`,
      `${cap(actor)} had the unmistakable energy of someone preparing a complaint.`,
      `${cap(actor)} seemed determined to make the ordinary portion of the day more interesting.`,
    );
    else if (object) lines.push(
      `${cap(object)} suddenly mattered more than anyone had planned.`,
      `Nobody had planned on ${object} becoming the main character.`,
    );
  }

  if (world.lens === "horror") {
    if (object) lines.push(
      `${cap(object)} was the first detail that felt slightly wrong.`,
      `Then ${object} became difficult to ignore.`,
      `The strange part was how ordinary ${object} looked at first.`,
    );
    else if (event.place) lines.push(`At ${event.place}, something about the moment stopped feeling ordinary.`);
  }

  if (world.lens === "romance") {
    if (actor && event.place) lines.push(`${cap(actor)} was back at ${event.place}, and the place remembered more than the night did.`);
    else if (actor && object) lines.push(`${cap(actor)} stayed with ${object} a little longer than the moment required.`);
    else if (event.place) lines.push(`${cap(event.place)} became part of the memory rather than just the setting.`);
  }

  if (event.place && event.time && action) {
    lines.push(`${cap(event.place)} was where it happened ${event.time.toLowerCase()}.`);
  }

  return unique(lines).filter((line) => !LEAK_RE.test(line));
}

function score(line: string, event: SourceEvent, used: Set<string>, world: World): number {
  const value = lower(line);
  let score = 0;
  for (const evidence of [event.actor, event.action, event.object, event.place, event.time].filter(Boolean) as string[]) {
    if (value.includes(lower(evidence))) score += evidence === event.actor ? 4 : 6;
  }
  if (line.length >= 32 && line.length <= 170) score += 4;
  if (world.lens !== "qre" && value !== lower(event.raw)) score += 6;
  if (used.has(value)) score -= 20;
  if (LEAK_RE.test(line)) score -= 100;
  return score;
}

function beatKind(index: number, total: number): StoryBeatKind {
  if (total === 1) return "payoff";
  if (index === 0) return "orientation";
  if (index === total - 1) return "payoff";
  if (index === 1) return "encounter";
  if (index === total - 2) return "transformation";
  return index % 2 === 0 ? "discovery" : "escalation";
}

function directiveFor(event: SourceEvent, kind: StoryBeatKind, index: number, total: number): CognitiveBeatDirective {
  return {
    kind,
    intent: "realize the strongest supported change or detail in this source event",
    subject: event.actor ?? event.object ?? event.place ?? "",
    action: event.action ?? "",
    stateBefore: index === 0 ? event.raw : "",
    stateAfter: index === total - 1 ? event.raw : "",
    relationalFocus: unique([event.object ?? "", event.place ?? "", event.time ?? ""]),
    evidence: [{ source: "prompt", detail: event.raw, confidence: 1 }],
    confidence: 1,
  };
}

function messageText(moment: Moment): string {
  if (moment.type === "message" || moment.type === "system") return moment.text;
  if (moment.type === "action") return moment.text ?? "";
  if (moment.type === "media") return moment.meta?.text ?? "";
  return "";
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
  if (!value) return "";
  if (index === 0) return value;
  if (/^(?:then|and|at|by|back|eventually|later|for|looking|somewhere)\b/i.test(value)) return value;
  if (lens === "horror" || lens === "comedy" || lens === "wild") return `Then ${value.toLowerCase()}`;
  if (lens === "romance") return `And ${value.toLowerCase()}`;
  return value;
}

export function compileUniversalExperienceBrain(prompt: string, plan?: CognitiveExperiencePlan): UniversalBrainResult {
  const world = extractWorld(prompt, plan);
  const used = new Set<string>();
  const sourceEvents = world.events.slice(0, 12);

  const beats: StoryBeat[] = sourceEvents.map((event, index) => {
    const candidates = creativeLines(event, world);
    const ranked = candidates.sort((a, b) => score(b, event, used, world) - score(a, event, used, world));
    const chosen = normalize(ranked[0] ?? event.raw, index, world.lens);
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
      provenance: [{ kind: "observed", source: "prompt", confidence: 1 }],
      directive: directiveFor(event, kind, index, sourceEvents.length),
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
    });
  }

  const moments: Moment[] = beats.map((beat, index) => ({
    type: "message",
    order: index,
    text: beat.text,
    meta: {
      source: "canonical_universal_experience_brain",
      lens: world.lens,
      realityEventId: sourceEvents[index]?.id,
      place: sourceEvents[index]?.place,
      time: sourceEvents[index]?.time,
      duration: index === beats.length - 1 ? 5200 : 3600,
    },
  }));

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

  return { world, beats, moments, cinematicScenes };
}

export { messageText };
