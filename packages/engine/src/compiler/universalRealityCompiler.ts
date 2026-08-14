import type {
  CognitiveExperiencePlan,
  CinematicScene,
  Moment,
  StoryBeat,
  StoryBeatKind,
} from "@qre/contracts";

/**
 * STATUS: CANONICAL / UNIVERSAL COMPILER
 *
 * ROLE:
 * Convert arbitrary user language into observable reality, discover a
 * sequence inside that reality, and perform that sequence as runtime text.
 *
 * MUST NOT:
 * - classify prompts into domain-specific story engines
 * - invent participants, owners, relationships, places, or events
 * - expose cognitive/compiler vocabulary
 * - use semantic labels such as "funny" or "horror" as customer prose
 *
 * CORE LAW:
 * reality first -> causality second -> creative performance third.
 */

export type RealityAtom = {
  id: string;
  kind: "entity" | "event" | "state" | "place" | "time" | "relation" | "emotion" | "concept";
  text: string;
  clause: number;
  observed: boolean;
  salience: number;
};

export type RealityEvent = {
  id: string;
  order: number;
  raw: string;
  actor?: string;
  action?: string;
  object?: string;
  place?: string;
  time?: string;
  atoms: string[];
  pressure: number;
  novelty: number;
};

export type RealityModel = {
  prompt: string;
  atoms: RealityAtom[];
  events: RealityEvent[];
  subjects: string[];
  participants: string[];
  places: string[];
  times: string[];
  emotions: string[];
  explicitLenses: string[];
};

type Lens = "plain" | "comedy" | "horror" | "romance" | "cinematic";

const ACTION_WORDS = [
  "arrive", "arrived", "arrives", "enter", "entered", "enters", "walk", "walked", "walks",
  "go", "went", "goes", "come", "came", "comes", "leave", "left", "leaves", "return", "returned", "returns",
  "find", "found", "finds", "clean", "cleaned", "cleans", "wash", "washed", "washes", "repair", "repaired", "repairs",
  "fix", "fixed", "fixes", "restore", "restored", "restores", "build", "built", "builds", "make", "made", "makes",
  "create", "created", "creates", "design", "designed", "designs", "write", "wrote", "writes", "cook", "cooked", "cooks",
  "serve", "served", "serves", "prepare", "prepared", "prepares", "open", "opened", "opens", "close", "closed", "closes",
  "visit", "visited", "visits", "travel", "traveled", "travelled", "drive", "drove", "drives", "ride", "rode", "rides",
  "paint", "painted", "paints", "dance", "danced", "dances", "sing", "sang", "sings", "play", "played", "plays",
  "choose", "chose", "chooses", "pick", "picked", "picks", "select", "selected", "selects", "decide", "decided", "decides",
  "touch", "touched", "touches", "hold", "held", "holds", "wear", "wore", "wears", "taste", "tasted", "tastes",
  "smell", "smelled", "smells", "look", "looked", "looks", "see", "saw", "sees", "watch", "watched", "watches",
  "share", "shared", "shares", "give", "gave", "gives", "take", "took", "takes", "bring", "brought", "brings",
  "receive", "received", "receives", "check", "checked", "checks", "inspect", "inspected", "inspects", "test", "tested", "tests",
  "measure", "measured", "measures", "install", "installed", "installs", "remove", "removed", "removes", "change", "changed", "changes",
  "turn", "turned", "turns", "transform", "transformed", "transforms", "finish", "finished", "finishes", "complete", "completed", "completes",
  "celebrate", "celebrated", "celebrates", "marry", "married", "marries", "photograph", "photographed", "photographs", "capture", "captured", "captures",
  "record", "recorded", "records", "teach", "taught", "teaches", "learn", "learned", "learns", "discover", "discovered", "discovers",
  "collect", "collected", "collects", "organize", "organized", "organizes", "decorate", "decorated", "decorates", "style", "styled", "styles",
  "trim", "trimmed", "trims", "cut", "cuts", "brush", "brushed", "brushes", "dry", "dried", "dries", "massage", "massaged", "massages",
  "relax", "relaxed", "relaxes", "pamper", "pampered", "pampers", "spoil", "spoiled", "spoils", "treat", "treated", "treats",
  "shake", "shook", "shakes", "chew", "chewed", "chews", "steal", "stole", "steals", "tear", "tore", "tears", "eat", "ate", "eats",
  "run", "ran", "runs", "call", "called", "calls", "rent", "rented", "rents", "document", "documented", "documents",
  "start", "started", "starts", "stop", "stopped", "stops", "hit", "hits", "sit", "sat", "sits", "stand", "stood", "stands",
  "talk", "talked", "talks", "meet", "met", "meets", "stay", "stayed", "stays", "sleep", "slept", "sleeps", "practice", "practiced", "practices",
  "win", "won", "wins", "lose", "lost", "loses", "break", "broke", "breaks",
];

const ACTION = new RegExp(`\\b(?:${ACTION_WORDS.join("|")})\\b`, "i");
const COORDINATED_ACTION = new RegExp(
  `\\b(?:and|but)\\s+(?:(?:the|a|an|my|our|their|his|her|this|that)\\s+)?[A-Za-z][A-Za-z0-9'’-]*(?:\\s+[A-Za-z0-9'’-]*){0,3}\\s+(?:${ACTION_WORDS.join("|")})\\b`,
  "i",
);
const CHANGE = /\b(?:but|then|until|after|before|finally|suddenly|however|instead|became|becomes|turned|changed|ended|left|arrived|hit|stole|found|lost|missing|wrong|broken|first|last|again|still|no longer)\b/i;
const EMOTION = /\b(?:scared|afraid|happy|excited|angry|furious|sad|restless|nervous|suspicious|surprised|delighted|terrified|calm|proud|lonely|curious|relieved|embarrassed|annoyed|thrilled|romantic|tender|intimate|mysterious|strange|weird|wild|ridiculous|absurd)\b/i;
const LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|dynamic behavior|result is available|current state|next experiential state|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output|customer-facing)\b/i;
const PARTICIPANTS = new Set(["kids", "children", "guests", "visitors", "crowd", "family", "friends", "fans", "customers", "clients", "team", "group", "partner", "sister", "brother", "mother", "father", "grandmother", "grandfather", "wife", "husband", "daughter", "son", "musician", "artist", "teacher", "student", "player", "players", "band", "someone", "somebody"]);
const STOP = new Set(["the", "a", "an", "and", "or", "but", "for", "with", "about", "from", "this", "that", "then", "there", "here", "when", "where", "while", "because", "was", "were", "is", "are", "be", "been", "being", "it", "its", "they", "them", "their", "he", "she", "his", "her", "we", "our", "you", "your", "i", "my", "me", "to", "of", "in", "on", "at", "as", "by", "than", "more", "very", "really", "just", "want", "need", "make", "create", "build", "design", "write", "show", "give", "send", "experience", "story", "people", "will", "can", "should", "could", "would", "like", "some", "everything", "nothing"]);

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

function splitSourceSentence(source: string): string[] {
  const base = sentence(source);
  if (!base) return [];

  const pieces = base
    .replace(/\s*;\s*/g, "|")
    .replace(/\s+(?:and then|then suddenly|but then)\s+/gi, "|")
    .replace(/,\s*(?=then\b)/gi, "|")
    .split("|")
    .flatMap((piece) => {
      const text = sentence(piece);
      if (!text) return [];

      if (!COORDINATED_ACTION.test(text)) return [text];

      const match = text.match(/\s+(and|but)\s+/i);
      if (!match || match.index == null) return [text];

      const left = sentence(text.slice(0, match.index));
      const right = sentence(text.slice(match.index + match[0].length));
      if (!left || !right || !ACTION.test(right)) return [text];

      return [left, right];
    });

  return unique(pieces).filter((p) => p.length >= 3);
}

function clauses(prompt: string): string[] {
  return unique(
    prompt
      .replace(/\r/g, "")
      .split(/(?<=[.!?])\s+(?=[A-Z0-9\"'“])/)
      .flatMap(splitSourceSentence),
  );
}

function timeOf(text: string): string | undefined {
  const match = text.match(/\b(?:at|around|by|before|after|on|during|since|from)\s+(?:the\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{4}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{1,2})?)\b/i);
  return match?.[0];
}

function placeOf(text: string): string | undefined {
  const explicit = text.match(/\b(?:at|in|inside|near|around|outside|on)\s+(?:the\s+)?([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,5})/);
  if (explicit?.[1] && !/^(?:and|but|then)\b/i.test(explicit[1])) return sentence(explicit[1]);
  return text.match(/\b(?:theater|theatre|museum|park|beach|hotel|restaurant|bar|club|house|home|kitchen|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer|gym|spa|backyard|venue)\b/i)?.[0];
}

function named(text: string): string[] {
  const proper = [...text.matchAll(/\b[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,4}\b/g)].map((m) => sentence(m[0] ?? ""));
  return unique(proper.filter((v) => !/^(?:Create|Make|Build|Turn|Generate|The|Then|And|At|By|For|This|That|My|Our|I|We)\b/i.test(v)));
}

function tokens(text: string): string[] {
  return sentence(text).toLowerCase().split(/[^a-z0-9'’-]+/).filter((w) => w.length > 2 && !STOP.has(w));
}

function actorOf(text: string): string | undefined {
  const direct = sentence(text).match(/^(?:(?:my|our|the|a|an)\s+)?([A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9'’-]*){0,4})\s+(?=(?:arrived|arrives|entered|enters|walked|walks|went|goes|came|comes|left|leaves|returned|returns|found|finds|sat|sits|stood|stands|started|starts|was|were|is|are|had|has|began|begins)\b)/i);
  return sentence(direct?.[1]);
}

function actionOf(text: string): string | undefined {
  return text.match(ACTION)?.[0];
}

function objectOf(text: string, actor?: string): string | undefined {
  const preferred = ["bath", "bow", "bubbles", "kitchen", "bathroom", "bathrooms", "recipe", "watch", "truck", "guitar", "pick", "cake", "door", "window", "lights", "ring", "clues", "song", "chairs", "table", "coffee", "shoes", "hat", "photo", "video", "crowd", "band", "house", "home", "spa", "tattoo", "surfboard", "wave", "keys", "phone", "dress", "restaurant"];
  const actorWords = new Set(tokens(actor ?? ""));
  const ws = tokens(text).filter((w) => !actorWords.has(w) && !ACTION.test(w));
  return ws.find((w) => preferred.includes(w)) ?? ws[0];
}

function lensOf(prompt: string, plan?: CognitiveExperiencePlan): Lens {
  const corpus = lower([prompt, ...(plan?.emotionalIntent ?? []), ...(plan?.creativePossibilities ?? [])].join(" "));
  if (/\b(?:horror|terrifying|scary|haunted|sinister|creepy|dark|demented)\b/i.test(corpus)) return "horror";
  if (/\b(?:funny|comedy|playful|absurd|ridiculous|wild|silly|humor|humour|cheeky|witty)\b/i.test(corpus)) return "comedy";
  if (/\b(?:romantic|romance|intimate|love|first date|tender)\b/i.test(corpus)) return "romance";
  if (/\b(?:cinematic|epic|mysterious|beautiful|dramatic|adventure)\b/i.test(corpus)) return "cinematic";
  return "plain";
}

export function buildRealityModel(prompt: string, plan?: CognitiveExperiencePlan): RealityModel {
  const cs = clauses(prompt);
  const atoms: RealityAtom[] = [];
  const events: RealityEvent[] = [];
  const subjects: string[] = [];
  const participants: string[] = [];
  const places: string[] = [];
  const times: string[] = [];
  const emotions: string[] = [];
  let atomNo = 0;

  cs.forEach((raw, clause) => {
    const actor = actorOf(raw) ?? named(raw)[0];
    const action = actionOf(raw);
    const object = objectOf(raw, actor);
    const place = placeOf(raw);
    const time = timeOf(raw);
    const ws = tokens(raw);
    const pressure = (CHANGE.test(raw) ? 3 : 1) + (action ? 2 : 0) + (EMOTION.test(raw) ? 1 : 0);
    const novelty = (CHANGE.test(raw) ? 3 : 0) + (EMOTION.test(raw) ? 2 : 0) + (ws.length > 8 ? 1 : 0);
    const atomIds: string[] = [];

    const add = (kind: RealityAtom["kind"], text: string, salience: number) => {
      const value = sentence(text);
      if (!value || atoms.some((a) => lower(a.text) === lower(value) && a.clause === clause)) return;
      const id = `r-${++atomNo}`;
      atoms.push({ id, kind, text: value, clause, observed: true, salience });
      atomIds.push(id);
    };

    if (actor) { subjects.push(actor); add("entity", actor, 8); }
    if (action) add("event", raw, 7);
    if (object) add("entity", object, 6);
    if (place) { places.push(place); add("place", place, 7); }
    if (time) { times.push(time); add("time", time, 8); }
    if (EMOTION.test(raw)) {
      const e = raw.match(EMOTION)?.[0];
      if (e) { emotions.push(e); add("emotion", e, 6); }
    }
    for (const t of ws) if (PARTICIPANTS.has(t)) { participants.push(t); add("entity", t, 5); }

    if (action || place || time || object || actor) {
      events.push({ id: `event-${clause + 1}`, order: clause, raw, actor, action, object, place, time, atoms: atomIds, pressure, novelty });
    }
  });

  return {
    prompt,
    atoms,
    events: events.length ? events : [{ id: "event-1", order: 0, raw: sentence(prompt), atoms: [], pressure: 1, novelty: 1 }],
    subjects: unique([...subjects, ...(plan?.premise?.slots.filter((s) => s.role === "subject").flatMap((s) => s.values) ?? [])]),
    participants: unique(participants),
    places: unique(places),
    times: unique(times),
    emotions: unique(emotions),
    explicitLenses: unique([...(plan?.emotionalIntent ?? []), ...(plan?.creativePossibilities ?? [])]),
  };
}

function topicFor(event: RealityEvent, world: RealityModel): string {
  return event.actor ?? event.object ?? event.place ?? world.subjects[0] ?? event.raw;
}

function cleanRaw(raw: string): string {
  return sentence(raw).replace(/^(?:create|make|build|design|write|turn|generate)\s+/i, "").trim();
}

function preserveLocationTime(text: string, event: RealityEvent): string {
  let value = sentence(text);
  if (event.place && !lower(value).includes(lower(event.place))) value = `${value} at ${event.place}`;
  if (event.time && !lower(value).includes(lower(event.time))) value = `${value} ${event.time}`;
  return value;
}

function candidateLines(event: RealityEvent, world: RealityModel, lens: Lens): string[] {
  const raw = cleanRaw(event.raw);
  const object = event.object;
  const actor = event.actor;
  const topic = topicFor(event, world);
  const candidates = [
    raw,
    actor && event.action && object ? `${cap(actor)} ${lower(event.action)} ${object}` : undefined,
    actor && event.action ? `${cap(actor)} ${lower(event.action)}.` : undefined,
    event.place && actor ? `At ${event.place}, ${raw.toLowerCase()}` : undefined,
    event.time && (actor || object) ? `${cap(actor ?? object ?? "It")} ${lower(event.action ?? "was")}, ${event.time.toLowerCase()}` : undefined,
  ].filter((v): v is string => Boolean(v));

  if (lens === "comedy" && actor && object) candidates.push(
    `${cap(actor)} treated ${object} like it had personally created the problem.`,
    `${cap(actor)} and ${object} appeared to be negotiating terms.`,
  );
  if (lens === "horror" && object) candidates.push(`Then ${object} became the detail that refused to feel ordinary.`);
  if (lens === "romance" && actor && object) candidates.push(`${cap(actor)} stayed with ${object} a little longer than the moment required.`);
  if (lens === "cinematic" && event.place && object) candidates.push(`At ${event.place}, ${object} became the detail the scene kept returning to.`);
  if (lens === "cinematic" && !actor && topic) candidates.push(`${cap(topic)} became the point where the scattered details lined up.`);

  return unique(candidates).filter((v) => !LEAK.test(v));
}

function scoreCandidate(text: string, event: RealityEvent, usedText: Set<string>): number {
  const low = lower(text);
  let score = 0;
  for (const evidence of [event.actor, event.object, event.place, event.time].filter(Boolean) as string[]) {
    if (low.includes(lower(evidence))) score += event.place === evidence || event.time === evidence ? 5 : 7;
  }
  if (event.action && low.includes(lower(event.action))) score += 5;
  if (event.pressure >= 3) score += 2;
  if (event.novelty >= 2) score += 2;
  if (text.length >= 28 && text.length <= 180) score += 2;
  if (!usedText.has(low)) score += 5;
  return score;
}

function eventEvidenceExpansion(world: RealityModel, selected: Array<{ event: RealityEvent; text: string }>): Array<{ event: RealityEvent; text: string }> {
  if (selected.length >= 3) return selected;

  const used = new Set(selected.flatMap((entry) => [lower(entry.event.raw), lower(entry.event.object ?? ""), lower(entry.event.place ?? ""), lower(entry.event.time ?? "")]));
  const candidates: RealityEvent[] = [];

  for (const event of world.events) {
    for (const atom of world.atoms.filter((a) => a.clause === event.order && (a.kind === "entity" || a.kind === "place" || a.kind === "time"))) {
      if (used.has(lower(atom.text))) continue;
      candidates.push({
        ...event,
        id: `${event.id}-${atom.id}`,
        raw: atom.text,
        object: atom.kind === "entity" ? atom.text : event.object,
        place: atom.kind === "place" ? atom.text : event.place,
        time: atom.kind === "time" ? atom.text : event.time,
        atoms: [atom.id],
        pressure: event.pressure + 1,
        novelty: event.novelty + 1,
      });
      used.add(lower(atom.text));
      if (selected.length + candidates.length >= 3) break;
    }
    if (selected.length + candidates.length >= 3) break;
  }

  return [...selected, ...candidates.map((event) => ({ event, text: cleanRaw(event.raw) }))];
}

function kindFor(index: number, total: number): StoryBeatKind {
  if (index === 0) return "orientation";
  if (index === total - 1) return "payoff";
  if (index === 1) return "encounter";
  if (index === total - 2) return "transformation";
  return index % 2 === 0 ? "discovery" : "escalation";
}

function perform(text: string, event: RealityEvent, lens: Lens, index: number): string {
  const value = sentence(preserveLocationTime(text, event));
  if (index > 0 && !/^(?:then|and|by|at|looking|for|somewhere|eventually|after)\b/i.test(value)) {
    if (lens === "comedy" || lens === "horror") return `Then ${value.toLowerCase()}`;
    if (lens === "romance") return `And ${value.toLowerCase()}`;
  }
  return value;
}

export function compileUniversalRealityExperience(prompt: string, plan?: CognitiveExperiencePlan) {
  const world = buildRealityModel(prompt, plan);
  const lens = lensOf(prompt, plan);
  const usedText = new Set<string>();

  const selected = world.events.map((event) => {
    const ranked = candidateLines(event, world, lens).sort((a, b) => scoreCandidate(b, event, usedText) - scoreCandidate(a, event, usedText));
    const text = perform(ranked[0] ?? cleanRaw(event.raw), event, lens, event.order);
    usedText.add(lower(text));
    return { event, text };
  });

  const expanded = eventEvidenceExpansion(world, selected);
  const scenes = expanded.slice(0, 8);

  const beats: StoryBeat[] = scenes.map(({ event, text }, index) => ({
    id: `reality-${index + 1}`,
    kind: kindFor(index, scenes.length),
    order: index,
    purpose: "realize concrete source reality as a sequential experience",
    text: `${sentence(perform(text, event, lens, index))}.`,
    emotionalTarget: world.emotions[index] ?? plan?.emotionalIntent?.[index],
    entities: unique([event.actor ?? "", event.object ?? "", event.place ?? "", ...world.participants]),
    provenance: [{ kind: "observed", source: "prompt", confidence: 1 }],
  }));

  const moments: Moment[] = beats.map((beat, index) => ({
    type: "message",
    order: index,
    text: beat.text,
    meta: {
      source: "canonical_universal_reality_compiler",
      lens,
      realityEventId: scenes[index]?.event.id,
      place: scenes[index]?.event.place,
      time: scenes[index]?.event.time,
      duration: index === beats.length - 1 ? 5200 : 3800,
    },
  }));

  const cinematicScenes: CinematicScene[] = moments.map((moment, index) => ({
    id: `reality-scene-${index + 1}`,
    type: index === 0 ? "intro" : index === moments.length - 1 ? "emotion" : "action",
    duration: Number(moment.meta?.duration ?? 3800),
    moment,
    order: index,
    transition: index === 0 ? "none" : index === moments.length - 1 ? "cinematic" : lens === "horror" ? "flash" : "fade",
    visual: {
      theme: lens === "horror" ? "dark" : lens === "plain" ? "light" : "cinematic",
      animation: lens === "horror" ? "glitch" : index === 0 ? "slow_zoom" : "parallax",
    },
    preload: index < moments.length - 1,
  }));

  return { world, lens, beats, moments, cinematicScenes };
}
