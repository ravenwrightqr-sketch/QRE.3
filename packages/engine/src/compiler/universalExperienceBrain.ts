import type { CinematicScene, CognitiveExperiencePlan, Moment, StoryBeat, StoryBeatKind } from "@qre/contracts";

/**
 * STATUS: CANONICAL / UNIVERSAL COGNITIVE EXPERIENCE BRAIN
 * ROLE: Convert arbitrary human input into source-grounded, creative, sequential experience.
 * INPUT: raw human prompt + optional cognitive plan.
 * OUTPUT: source events, latent movie beats, runtime moments, cinematic scenes.
 * AUTHORITY: source language first; derived cognition second; creative interpretation third.
 * MUST NOT: invent owners/participants/places/events; expose compiler language; classify domains.
 * REPLACEMENT: supersedes generic sentence/template realizer behavior inside compiler path.
 *
 * CORE LAW
 *
 *   raw reality -> event structure -> attention opportunities -> creative performance -> validation
 *
 * The user supplies reality. The brain supplies imagination.
 */

type Lens = "plain" | "comedy" | "horror" | "romance" | "cinematic" | "wild";

type SourceEvent = {
  id: string;
  order: number;
  raw: string;
  actor?: string;
  action?: string;
  object?: string;
  place?: string;
  time?: string;
  words: string[];
  explicitEmotion?: string;
  sourceEvidence: string[];
};

type BrainWorld = {
  prompt: string;
  entities: string[];
  participants: string[];
  places: string[];
  times: string[];
  events: SourceEvent[];
  lens: Lens;
  creativeSignals: string[];
};

export type UniversalBrainResult = {
  world: BrainWorld;
  beats: StoryBeat[];
  moments: Moment[];
  cinematicScenes: CinematicScene[];
};

const ACTIONS = new Set([
  "arrived", "entered", "walked", "went", "came", "left", "returned", "found", "cleaned", "washed", "repaired", "fixed",
  "restored", "built", "made", "created", "designed", "wrote", "cooked", "served", "prepared", "opened", "closed", "visited",
  "traveled", "travelled", "drove", "rode", "painted", "danced", "sang", "played", "chose", "picked", "selected", "decided",
  "touched", "held", "wore", "tasted", "smelled", "looked", "saw", "watched", "shared", "gave", "took", "brought", "received",
  "checked", "inspected", "tested", "measured", "installed", "removed", "changed", "turned", "transformed", "finished", "completed",
  "celebrated", "married", "photographed", "captured", "recorded", "taught", "learned", "discovered", "found", "collected", "organized",
  "decorated", "styled", "trimmed", "cut", "brushed", "dried", "massaged", "relaxed", "pampered", "spoiled", "treated", "shook", "chewed",
  "stole", "tore", "ate", "ran", "called", "rented", "documented", "started", "stopped", "hit", "sat", "stood", "talked", "met",
  "stayed", "slept", "practiced", "won", "lost", "broke", "rescued", "adopted", "learned", "graduated", "performed", "arrived",
]);

const ACTION_RE = new RegExp(`\\b(?:${[...ACTIONS].join("|")})\\b`, "i");
const LEAK_RE = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent movie|latent state|internal state|dynamic behavior|generated output|customer-facing|delivery pipeline|scan pipeline|result is available|next experiential state)\b/i;
const LENS_RE = /\b(?:funny|humor|humour|comedy|playful|absurd|ridiculous|silly|cheeky|witty|hilarious|horror|terrifying|scary|haunted|creepy|sinister|romantic|romance|intimate|tender|cinematic|epic|wild|demented|dark)\b/i;
const EMOTION_RE = /\b(?:nervous|suspicious|scared|afraid|excited|happy|sad|angry|furious|restless|delighted|terrified|calm|proud|lonely|curious|relieved|embarrassed|annoyed|thrilled|tender|intimate|weird|strange|wild|ridiculous|absurd)\b/i;
const PLACE_WORDS = /\b(?:restaurant|bar|club|museum|theater|theatre|park|beach|hotel|house|home|kitchen|bathroom|bathrooms|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer|gym|spa|backyard|venue|pier|lake|mountain|forest|farm|garden|downtown)\b/i;
const TIME_RE = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset)\b/i;

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown): string => sentence(value).toLowerCase();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (value: string): string => { const s = sentence(value); return s ? s[0]!.toUpperCase() + s.slice(1) : ""; };

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function choose<T>(values: readonly T[], seed: string): T {
  if (!values.length) throw new Error("choose() requires values");
  return values[hash(seed) % values.length] ?? values[0]!;
}

function splitPrompt(prompt: string): string[] {
  const normalized = sentence(prompt);
  if (!normalized) return [];
  const sentences = normalized
    .replace(/\s*;\s*/g, ".")
    .split(/(?<=[.!?])\s+/)
    .map(sentence)
    .filter(Boolean);

  return unique(sentences.flatMap((s) => {
    const pieces: string[] = [];
    let rest = s;

    rest = rest.replace(/\s+(?:and then|then suddenly|but then)\s+/gi, "|");
    rest = rest.replace(/,\s*(?=then\b)/gi, "|");
    const firstPass = rest.split("|").map(sentence).filter(Boolean);

    for (const chunk of firstPass) {
      const coordinated = chunk.split(/,\s+(?=(?:and|but)\s+[A-Za-z0-9'“])/i).map(sentence).filter(Boolean);
      if (coordinated.length === 1) {
        pieces.push(chunk);
      } else {
        const withActions = coordinated.filter((part) => ACTION_RE.test(part) || EMOTION_RE.test(part));
        if (withActions.length >= 2) pieces.push(...coordinated);
        else pieces.push(chunk);
      }
    }
    return pieces;
  }));
}

function words(text: string): string[] {
  return sentence(text).split(/[^A-Za-z0-9'’-]+/).map((w) => w.trim()).filter((w) => w.length > 2);
}

function actionOf(text: string): string | undefined {
  return text.match(ACTION_RE)?.[0];
}

function actorOf(text: string): string | undefined {
  const match = sentence(text).match(/^((?:my|our|the|a|an)?\s*[A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z0-9'’\-]+){0,3})\s+(?=(?:arrived|entered|walked|went|came|left|returned|found|cleaned|washed|repaired|fixed|restored|built|made|created|designed|wrote|cooked|served|prepared|opened|closed|visited|traveled|travelled|drove|rode|painted|danced|sang|played|chose|picked|selected|decided|touched|held|wore|tasted|smelled|looked|saw|watched|shared|gave|took|brought|received|checked|inspected|tested|measured|installed|removed|changed|turned|transformed|finished|completed|celebrated|married|photographed|captured|recorded|taught|learned|discovered|collected|organized|decorated|styled|trimmed|cut|brushed|dried|massaged|relaxed|pampered|spoiled|treated|shook|chewed|stole|tore|ate|ran|called|rented|documented|started|stopped|hit|sat|stood|talked|met|stayed|slept|practiced|won|lost|broke|rescued|adopted|graduated|performed)\b)/i);
  if (!match?.[1]) return undefined;
  return sentence(match[1].replace(/^(?:my|our|the|a|an)\s+/i, ""));
}

function timeOf(text: string): string | undefined {
  return text.match(TIME_RE)?.[0];
}

function placeOf(text: string): string | undefined {
  const explicit = text.match(/\b(?:at|in|inside|near|around|outside|on)\s+(?:the\s+)?([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,4})/);
  if (explicit?.[1] && !/^(?:and|but|then|first|last)\b/i.test(explicit[1])) return sentence(explicit[1]);
  return text.match(PLACE_WORDS)?.[0];
}

function objectOf(text: string, actor?: string, action?: string): string | undefined {
  const actorTokens = new Set(words(actor ?? "").map(lower));
  const actionToken = lower(action ?? "");
  const candidates = words(text).filter((word) => !actorTokens.has(lower(word)) && lower(word) !== actionToken);
  const preference = /^(?:bath|bow|bubbles|kitchen|bathroom|bathrooms|living|recipe|watch|truck|guitar|pick|cake|door|window|lights|ring|clues|song|chairs|table|coffee|shoes|hat|photo|video|crowd|band|house|home|spa|tattoo|surfboard|wave|keys|phone|dress|restaurant)$/i;
  return candidates.find((word) => preference.test(word)) ?? candidates.at(-1);
}

function detectLens(prompt: string, plan?: CognitiveExperiencePlan): Lens {
  const text = lower([prompt, ...(plan?.emotionalIntent ?? []), ...(plan?.creativePossibilities ?? [])].join(" "));
  if (/\b(?:horror|terrifying|scary|haunted|creepy|sinister|demented)\b/i.test(text)) return "horror";
  if (/\b(?:funny|humor|humour|comedy|playful|absurd|ridiculous|silly|cheeky|witty|hilarious)\b/i.test(text)) return "comedy";
  if (/\b(?:romantic|romance|intimate|tender|first date|love)\b/i.test(text)) return "romance";
  if (/\b(?:wild|chaotic|unhinged)\b/i.test(text)) return "wild";
  if (/\b(?:cinematic|epic|mysterious|nostalgic|beautiful)\b/i.test(text)) return "cinematic";
  return "plain";
}

function extractWorld(prompt: string, plan?: CognitiveExperiencePlan): BrainWorld {
  const clauses = splitPrompt(prompt);
  const events: SourceEvent[] = clauses.map((raw, index) => {
    const actor = actorOf(raw);
    const action = actionOf(raw);
    const place = placeOf(raw);
    const time = timeOf(raw);
    const object = objectOf(raw, actor, action);
    return {
      id: `source-${index + 1}`,
      order: index,
      raw,
      actor,
      action,
      object,
      place,
      time,
      words: words(raw),
      explicitEmotion: raw.match(EMOTION_RE)?.[0],
      sourceEvidence: unique([raw, actor ?? "", action ?? "", object ?? "", place ?? "", time ?? ""]),
    };
  });

  const entities = unique(events.flatMap((event) => [event.actor ?? "", event.object ?? ""]));
  const participants = unique([
    ...(plan?.premise?.slots.filter((s) => s.role === "participants").flatMap((s) => s.values) ?? []),
    ...events.map((event) => event.actor ?? ""),
  ]);
  const places = unique([
    ...(plan?.premise?.slots.filter((s) => s.role === "place").flatMap((s) => s.values) ?? []),
    ...events.map((event) => event.place ?? ""),
  ]);
  const times = unique([
    ...(plan?.premise?.slots.filter((s) => s.role === "temporal").flatMap((s) => s.values) ?? []),
    ...events.map((event) => event.time ?? ""),
  ]);

  return {
    prompt,
    entities: unique([...entities, ...(plan?.premise?.slots.filter((s) => s.role === "subject").flatMap((s) => s.values) ?? [])]),
    participants,
    places,
    times,
    events: events.length ? events : [{ id: "source-1", order: 0, raw: sentence(prompt), words: words(prompt), sourceEvidence: [sentence(prompt)] }],
    lens: detectLens(prompt, plan),
    creativeSignals: unique([...(plan?.creativePossibilities ?? []), ...(plan?.emotionalIntent ?? [])]),
  };
}

function has(text: string, value?: string): boolean {
  return Boolean(value) && lower(text).includes(lower(value!));
}

function creativeCandidates(event: SourceEvent, world: BrainWorld, index: number): string[] {
  const actor = event.actor;
  const object = event.object;
  const place = event.place;
  const raw = sentence(event.raw);
  const out: string[] = [raw];

  if (world.lens === "comedy") {
    if (actor && object) out.push(
      `${cap(actor)} treated ${object} like it had personally caused the problem.`,
      `${cap(actor)} and ${object} appeared to have entered negotiations.`,
      `${cap(actor)} approached ${object} with the confidence of someone expecting compensation.`,
    );
    else if (actor) out.push(
      `${cap(actor)} arrived with opinions and apparently intended to keep them.`,
      `${cap(actor)} had the unmistakable energy of someone already preparing a complaint.`,
    );
    else if (object) out.push(
      `${cap(object)} suddenly seemed much more important than anyone had planned.`,
      `Nobody had planned on ${object} becoming the main character.`
    );
  }

  if (world.lens === "horror") {
    if (object) out.push(
      `${cap(object)} was the first detail that felt slightly wrong.`,
      `Then there was ${object}. Nobody had a good explanation for that yet.`,
    );
    else if (place) out.push(
      `At ${place}, something about the ordinary rhythm changed.`,
    );
  }

  if (world.lens === "romance") {
    if (actor && place) out.push(
      `${cap(actor)} returned to ${place}, where the earlier memory still seemed close.`,
    );
    if (actor && object) out.push(
      `${cap(actor)} stayed with ${object} a little longer than the moment required.`,
    );
  }

  if (world.lens === "wild") {
    if (actor && object) out.push(
      `${cap(actor)} and ${object} somehow escalated the situation beyond the original plan.`,
      `${cap(actor)} took ${object} and turned an ordinary detail into a full situation.`,
    );
  }

  if (world.lens === "cinematic") {
    if (place && actor) out.push(`At ${place}, ${cap(actor)} became the thread connecting the scene.`);
    if (place && object) out.push(`At ${place}, ${cap(object)} became the detail the scene kept returning to.`);
  }

  if (index > 0 && world.events[index - 1]?.place && place && lower(world.events[index - 1]?.place) === lower(place)) {
    out.push(`Back at ${place}, the earlier details carried a different weight.`);
  }

  return unique(out).filter((candidate) => !LEAK_RE.test(candidate));
}

function noveltyBonus(event: SourceEvent, world: BrainWorld): number {
  let score = 0;
  if (event.explicitEmotion) score += 4;
  if (event.object) score += 3;
  if (event.place) score += 3;
  if (event.time) score += 2;
  if (/\b(?:until|again|back|finally|suddenly|still|already|only|never|first|last)\b/i.test(event.raw)) score += 4;
  if (world.lens !== "plain") score += 2;
  return score;
}

function score(candidate: string, event: SourceEvent, used: Set<string>): number {
  let value = 0;
  if (has(candidate, event.actor)) value += 8;
  if (has(candidate, event.action)) value += 6;
  if (has(candidate, event.object)) value += 6;
  if (has(candidate, event.place)) value += 5;
  if (has(candidate, event.time)) value += 4;
  if (!used.has(lower(candidate))) value += 6;
  if (candidate.length >= 35 && candidate.length <= 170) value += 3;
  if (LEAK_RE.test(candidate)) value -= 100;
  return value;
}

function selectLine(event: SourceEvent, world: BrainWorld, used: Set<string>, index: number): string {
  const candidates = creativeCandidates(event, world, index);
  const ranked = candidates.sort((a, b) => score(b, event, used) - score(a, event, used));
  const selected = ranked[0] ?? event.raw;

  if (world.lens !== "plain" && event.action && index > 0 && selected.toLowerCase() === event.raw.toLowerCase()) {
    const alternate = ranked.find((line) => line.toLowerCase() !== event.raw.toLowerCase());
    if (alternate && noveltyBonus(event, world) >= 5) return alternate;
  }

  return selected;
}

function beatKind(index: number, total: number): StoryBeatKind {
  if (total === 1) return "payoff";
  if (index === 0) return "orientation";
  if (index === total - 1) return "payoff";
  if (index === 1) return "encounter";
  if (index === total - 2) return "transformation";
  return index % 2 === 0 ? "discovery" : "escalation";
}

function transition(lens: Lens, index: number): "fade" | "slide" | "zoom" | "cinematic" | "flash" | "none" {
  if (index === 0) return "none";
  if (lens === "horror") return index % 2 === 0 ? "flash" : "fade";
  if (lens === "cinematic" || lens === "romance") return "cinematic";
  if (lens === "wild") return "zoom";
  return "fade";
}

function visual(lens: Lens, index: number): { theme: "cinematic" | "dark" | "light" | "glass"; animation: "none" | "slow_zoom" | "parallax" | "particles" | "glitch" } {
  if (lens === "horror") return { theme: "dark", animation: "glitch" };
  if (lens === "plain") return { theme: "light", animation: index === 0 ? "slow_zoom" : "none" };
  if (lens === "wild") return { theme: "cinematic", animation: "particles" };
  return { theme: "cinematic", animation: index === 0 ? "slow_zoom" : "parallax" };
}

function normalize(text: string, index: number, lens: Lens): string {
  let result = sentence(text);
  if (index > 0 && lens !== "plain" && !/^(?:then|and|at|back|eventually|looking|for|by|somewhere|later)\b/i.test(result)) {
    result = lens === "horror" || lens === "comedy" ? `Then ${result.toLowerCase()}` : `And ${result.toLowerCase()}`;
  }
  return result;
}

export function compileUniversalExperienceBrain(prompt: string, plan?: CognitiveExperiencePlan): UniversalBrainResult {
  const world = extractWorld(prompt, plan);
  const used = new Set<string>();

  const beats: StoryBeat[] = world.events.slice(0, 10).map((event, index, all) => {
    const line = normalize(selectLine(event, world, used, index), index, world.lens);
    used.add(lower(line));
    return {
      id: `brain-${event.id}`,
      kind: beatKind(index, all.length),
      order: index,
      purpose: "perform source reality as an engaging sequential experience",
      text: `${sentence(line)}.`,
      emotionalTarget: event.explicitEmotion,
      entities: unique([event.actor ?? "", event.object ?? "", event.place ?? ""]),
      provenance: [{ kind: "observed", source: "prompt", confidence: 1 }],
      directive: {
        subject: event.actor,
        action: event.action,
        stateBefore: index === 0 ? event.raw : undefined,
        stateAfter: index === world.events.length - 1 ? event.raw : undefined,
        relationalFocus: unique([event.object ?? "", event.place ?? "", event.time ?? ""]),
      },
    };
  });

  if (beats.length === 0 && sentence(prompt)) {
    beats.push({
      id: "brain-fallback",
      kind: "payoff",
      order: 0,
      purpose: "preserve the user's source input",
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
      realityEventId: world.events[index]?.id,
      place: world.events[index]?.place,
      time: world.events[index]?.time,
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
