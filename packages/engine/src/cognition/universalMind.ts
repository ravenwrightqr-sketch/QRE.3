import type {
  CinematicScene,
  CognitiveAssumption,
  CognitiveBeatDirective,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitiveExperienceRealization,
  CognitivePremise,
  ExperienceBlueprint,
  ExperienceEntities,
  ExperienceMeaning,
  ExperienceMoment,
  ExperienceTone,
  ExperienceType,
  FlowStep,
  StoryBeat,
  StoryBeatKind,
} from "@qre/contracts";

export type UniversalMindContext = {
  memorySummary?: string[];
  memories?: unknown[];
  location?: { label?: string; city?: string; country?: string; latitude?: number; longitude?: number };
  event?: { name?: string; venue?: string; date?: string; description?: string; participants?: string[] };
  entityHints?: string[];
  creativePreferences?: string[];
  feedback?: { accepted?: string[]; rejected?: string[] };
};

type Lens = "neutral" | "comedy" | "horror" | "romance" | "wild" | "mysterious";
type RealityKind = "entity" | "event" | "state" | "relationship" | "place" | "time" | "history";

type Evidence = CognitiveEvidence & { id: string; kind: RealityKind; salience: number };
type Relation = { from: string; relation: string; to: string; evidenceId: string };
type RealityEvent = {
  id: string;
  raw: string;
  participants: string[];
  action?: string;
  object?: string;
  place?: string;
  time?: string;
  state?: string;
  order: number;
  evidence: Evidence[];
  resolvedFromMemory?: boolean;
};

type World = {
  prompt: string;
  entities: string[];
  participants: string[];
  places: string[];
  times: string[];
  events: RealityEvent[];
  relations: Relation[];
  lens: Lens;
  memoryMatches: string[];
};

export type UniversalMindResult = {
  title: string;
  blueprint: ExperienceBlueprint;
  plan: CognitiveExperiencePlan;
  flowSteps: FlowStep[];
  moments: ExperienceMoment[];
  cinematicScenes: CinematicScene[];
  estimatedDuration: number;
  momentCount: number;
  world: World;
  adaptiveQuestions: string[];
  discoveries: string[];
  learningSignals: string[];
};

const ACTIONS = [
  "arrived","entered","walked","went","came","left","returned","found","cleaned","washed","groomed","repaired","fixed","restored","built","made","created","designed","wrote","cooked","served","prepared","opened","closed","visited","traveled","travelled","drove","rode","painted","danced","sang","played","chose","picked","selected","decided","touched","held","wore","tasted","smelled","looked","saw","watched","shared","gave","took","brought","received","checked","inspected","tested","installed","removed","changed","turned","transformed","finished","completed","celebrated","married","photographed","captured","recorded","taught","learned","discovered","collected","organized","decorated","styled","trimmed","cut","brushed","dried","massaged","relaxed","pampered","spoiled","treated","shook","chewed","stole","tore","ate","ran","called","rented","documented","started","stopped","hit","sat","stood","talked","met","stayed","slept","practiced","won","lost","broke","rescued","adopted","graduated","performed","settled","cried","laughed","loved","hated","feared","remembered","forgot","crossed","lasted","happened","surrendered","disappeared","appeared","continued","waited","lingered"
] as const;

const ACTION_RE = new RegExp(`\\b(?:${ACTIONS.join("|")})\\b`, "i");
const STATE_RE = /\\b(?:has been|have been|had been|was|were|is|are|am|remained|became|kept|seemed|felt|stayed)\\b/i;
const TIME_RE = /\\b(?:\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)|\\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \\w+ (?:minutes|hours|days|weeks|years)|for forty years|every [A-Za-z]+)\\b/i;
const PLACE_RE = /\\b(?:restaurant|bar|club|museum|theater|theatre|park|beach|hotel|house|home|kitchen|bathroom|bathrooms|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer|gym|spa|backyard|venue|pier|lake|mountain|forest|farm|garden|downtown|desert)\\b/i;
const RETURN_RE = /\\b(?:back|again|returned|returning|same place|there)\\b/i;
const LEAK_RE = /\\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|latent state|internal state|generated output|result is available|next experiential state|delivery pipeline|scan pipeline)\\b/i;
const GENERIC_RE = /\\b(?:approached .* compensation|negotiat(?:ed|ing) terms|arrived with opinions|entered like there was already a disagreement|the ordinary part of the day had found an unexpected detail|the detail was worth keeping)\\b/i;

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\\s+/g, " ").trim() : "";
const sentence = (value: unknown) => clean(value).replace(/[.!?]+$/, "");
const lower = (value: unknown) => sentence(value).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (value: string) => { const s = sentence(value); return s ? s[0]!.toUpperCase() + s.slice(1) : ""; };

function semanticIndex(text: string, start = 0): { word: string; index: number } | undefined {
  const fragment = text.slice(start);
  const action = fragment.match(ACTION_RE);
  const state = fragment.match(STATE_RE);
  const candidates = [
    action?.index !== undefined && action[0] ? { word: action[0], index: start + action.index } : undefined,
    state?.index !== undefined && state[0] ? { word: state[0], index: start + state.index } : undefined,
  ].filter(Boolean) as { word: string; index: number }[];
  return candidates.sort((a, b) => a.index - b.index)[0];
}

function splitSemanticClauses(value: string): string[] {
  const text = sentence(value);
  const cuts: number[] = [];
  const joiner = /\\b(?:and|then|but|while|after|before)\\b/gi;
  for (const match of text.matchAll(joiner)) {
    if (typeof match.index !== "number") continue;
    const next = semanticIndex(text, match.index + match[0].length);
    if (next) cuts.push(match.index);
  }
  if (!cuts.length) return [text];
  const pieces: string[] = [];
  let start = 0;
  for (const cut of cuts) {
    const piece = sentence(text.slice(start, cut));
    if (piece.length >= 5) pieces.push(piece);
    start = cut;
  }
  const tail = sentence(text.slice(start));
  if (tail.length >= 5) pieces.push(tail);
  return unique(pieces.length > 1 ? pieces : [text]);
}

function splitInput(prompt: string): string[] {
  const sentences = clean(prompt).split(/\\n+|(?<=[.!?])\\s+/).map(sentence).filter(Boolean);
  const output: string[] = [];
  for (const item of sentences) {
    for (const clause of splitSemanticClauses(item)) {
      const parts = clause.split(/,\\s+/).map(sentence).filter(Boolean);
      if (parts.length === 1) {
        output.push(clause);
        continue;
      }
      let current = "";
      for (const part of parts) {
        const semantic = semanticIndex(part);
        const isNewEvent = Boolean(current) && Boolean(semantic) && Boolean(semanticIndex(current));
        if (isNewEvent && /^(?:then|and|but)\\b/i.test(part)) {
          output.push(current);
          current = part.replace(/^(?:then|and|but)\\s+/i, "");
        } else if (isNewEvent && /^(?:the|a|an)\\s/i.test(part)) {
          current = current ? `${current}, ${part}` : part;
        } else {
          current = current ? `${current}, ${part}` : part;
        }
      }
      if (current) output.push(...splitSemanticClauses(current));
    }
  }
  return unique(output);
}

function timeOf(text: string) { return text.match(TIME_RE)?.[0]; }
function actionOf(text: string) { return text.match(ACTION_RE)?.[0]; }
function stateOf(text: string) { return text.match(STATE_RE)?.[0]; }

function placeOf(text: string): string | undefined {
  const named = text.match(/\\b(?:at|in|inside|near|around|outside|on|to)\\s+(?:the\\s+)?([A-Z][A-Za-z0-9'’-]*(?:\\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,5})/);
  if (named?.[1] && !/^(?:and|but|then|first|last|home|there)\\b/i.test(named[1])) return sentence(named[1]);
  return text.match(PLACE_RE)?.[0];
}

function properNameCandidates(text: string): string[] {
  const stop = /^(?:I|We|The|Then|At|And|My|Our|This|A|An|By|He|She|They|Guests|Everyone|Grandma)$/i;
  return unique([...text.matchAll(/\\b[A-Z][A-Za-z'’-]*(?:\\s+[A-Z][A-Za-z'’-]*)?\\b/g)].map((m) => m[0]).filter((name) => !stop.test(name)));
}

function participantsOf(text: string): string[] {
  const semantic = semanticIndex(text);
  if (!semantic || semantic.index <= 0) return [];
  const prefix = sentence(text.slice(0, semantic.index).replace(/^(?:then|and|but)\\s+/i, ""));
  const names = properNameCandidates(prefix);
  if (names.length > 1) return names;
  const pair = prefix.match(/^([A-Z][A-Za-z'’-]*)\\s+(?:and|&)\\s+([A-Z][A-Za-z'’-]*)$/);
  if (pair) return unique([pair[1]!, pair[2]!]);
  return names;
}

function genericSubject(text: string): string | undefined {
  const semantic = semanticIndex(text);
  if (!semantic || semantic.index <= 0) return undefined;
  const prefix = sentence(text.slice(0, semantic.index).replace(/^(?:then|and|but)\\s+/i, ""));
  if (!prefix || prefix.length > 120) return undefined;
  return prefix;
}

function objectOf(text: string, action?: string): string | undefined {
  if (!action) return undefined;
  const match = text.match(new RegExp(`\\b${action}\\b(?:\\s+(?:the|a|an))?\\s+([A-Za-z0-9'’-]+(?:\\s+[A-Za-z0-9'’-]+){0,5})`, "i"));
  const value = sentence(match?.[1]);
  if (!value || PLACE_RE.test(value) || TIME_RE.test(value) || /^(?:home|there|again|until|every)$/i.test(value)) return undefined;
  return value;
}

function memoryStrings(context?: UniversalMindContext): string[] {
  const values = [
    ...(context?.memorySummary ?? []),
    ...(context?.memories ?? []).map((item) => typeof item === "string" ? item : JSON.stringify(item) ?? ""),
  ];
  if (context?.event) values.push(JSON.stringify(context.event));
  return values.map(clean).filter(Boolean);
}

function lensOf(prompt: string, context?: UniversalMindContext): Lens {
  const corpus = lower([prompt, ...(context?.creativePreferences ?? [])].join(" "));
  if (/\\b(?:horror|terrifying|scary|haunted|creepy|sinister|demented|dark)\\b/i.test(corpus)) return "horror";
  if (/\\b(?:funny|humor|humour|comedy|playful|absurd|ridiculous|silly|cheeky|witty|hilarious)\\b/i.test(corpus)) return "comedy";
  if (/\\b(?:romantic|romance|intimate|tender|first date|love)\\b/i.test(corpus)) return "romance";
  if (/\\b(?:wild|chaotic|unhinged)\\b/i.test(corpus)) return "wild";
  if (/\\b(?:mysterious|mystery|strange|surreal)\\b/i.test(corpus)) return "mysterious";
  return "neutral";
}

function resolvePlaceFromMemory(text: string, context?: UniversalMindContext): { place?: string; matches: string[]; question?: string } {
  if (!RETURN_RE.test(text)) return { matches: [] };
  const memories = memoryStrings(context);
  const candidates = unique([
    ...memories.flatMap((memory) => {
      const named = [...memory.matchAll(/\\b(?:at|in|near|on)\\s+([A-Z][A-Za-z0-9'’-]*(?:\\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,5})/g)].map((m) => m[1] ?? "");
      const known = memory.match(PLACE_RE)?.[0] ?? "";
      return [...named, known];
    }),
    context?.location?.label ?? "",
    context?.event?.venue ?? "",
  ]);
  if (candidates.length === 1) return { place: candidates[0], matches: candidates };
  if (candidates.length > 1) return { matches: candidates.slice(0, 6), question: "Which place did you go back to?" };
  return { matches: [], question: "Where did you go back to?" };
}

function ev(id: string, detail: string, kind: RealityKind, salience: number, source: CognitiveEvidence["source"] = "prompt"): Evidence {
  return { id, detail, kind, salience, source, confidence: 1 };
}

function buildEvents(prompt: string, context?: UniversalMindContext) {
  const chunks = splitInput(prompt);
  const events: RealityEvent[] = [];
  const adaptiveQuestions: string[] = [];
  const memoryMatches: string[] = [];
  let carryParticipants: string[] = [];
  let carryPlace: string | undefined;

  chunks.forEach((raw, index) => {
    const parsedParticipants = participantsOf(raw);
    const participants = parsedParticipants.length ? parsedParticipants : carryParticipants;
    const action = actionOf(raw);
    const placeResolution = resolvePlaceFromMemory(raw, context);
    const place = placeResolution.place ?? placeOf(raw) ?? (RETURN_RE.test(raw) ? carryPlace : undefined);
    const time = timeOf(raw);
    const object = objectOf(raw, action);
    const state = stateOf(raw);
    if (placeResolution.question) adaptiveQuestions.push(placeResolution.question);
    memoryMatches.push(...placeResolution.matches);
    if (participants.length) carryParticipants = participants;
    if (place) carryPlace = place;

    const evidence: Evidence[] = [ev(`event-${index}-raw`, raw, action ? "event" : "history", action || state ? 0.9 : 0.75, placeResolution.place ? "memory" : "prompt")];
    for (const participant of participants) evidence.push(ev(`event-${index}-participant-${participant}`, participant, "entity", 1));
    if (place) evidence.push(ev(`event-${index}-place`, place, "place", 1, placeResolution.place ? "memory" : "prompt"));
    if (time) evidence.push(ev(`event-${index}-time`, time, "time", 1));
    if (object) evidence.push(ev(`event-${index}-object`, object, "entity", 0.95));
    if (state) evidence.push(ev(`event-${index}-state`, state, "state", 0.8));

    events.push({ id: `event-${index + 1}`, raw, participants, action, object, place, time, state, order: index, evidence, resolvedFromMemory: Boolean(placeResolution.place) });
  });

  return { events, adaptiveQuestions: unique(adaptiveQuestions), memoryMatches: unique(memoryMatches) };
}

function deriveEntities(events: RealityEvent[]): ExperienceEntities {
  const people = unique(events.flatMap((event) => event.participants).filter((value) => /^[A-Z][A-Za-z'’-]*(?:\\s+[A-Z][A-Za-z'’-]*)?$/.test(value)));
  const places = unique(events.map((event) => event.place ?? ""));
  const dates = unique(events.map((event) => event.time ?? "").filter((value) => /\\d{4}/.test(value)));
  const times = unique(events.map((event) => event.time ?? "").filter((value) => /\\b(?:am|pm|sunrise|sunset|closing)\\b/i.test(value)));
  const products = unique(events.map((event) => event.object ?? ""));
  const eventFacts = unique(events.map((event) => event.raw));
  const keywords = unique(events.flatMap((event) => `${event.raw} ${event.state ?? ""}`.toLowerCase().split(/[^a-z0-9'’-]+/).filter((word) => word.length >= 5))).slice(0, 80);
  return { people, places, organizations: [], dates, times, events: eventFacts, products, urls: [], phones: [], media: [], emails: [], keywords };
}

function premiseFor(world: World): CognitivePremise {
  const slots: CognitivePremise["slots"] = [];
  const add = (role: CognitivePremise["slots"][number]["role"], values: string[], salience: number) => {
    const cleanValues = unique(values);
    if (!cleanValues.length) return;
    slots.push({ role, values: cleanValues, status: "observed", confidence: 1, salience, evidence: cleanValues.map((value) => ({ source: "prompt", detail: value, confidence: 1 })) });
  };
  add("subject", world.participants.slice(0, 3), 1);
  add("participants", world.participants, 1);
  add("event", world.events.map((event) => event.action ?? event.raw), 0.95);
  add("artifact", world.events.map((event) => event.object ?? ""), 0.9);
  add("place", world.places, 1);
  add("temporal", world.times, 1);
  add("emotion", world.events.map((event) => event.state ?? ""), 0.7);
  const relations: CognitivePremise["relations"] = [];
  for (const event of world.events) {
    for (const participant of event.participants) {
      if (event.place) relations.push({ from: "participants", to: "place", relation: "experienced_at", confidence: 1, evidence: [{ source: "prompt", detail: event.raw, confidence: 1 }] });
      if (event.object) relations.push({ from: "participants", to: "artifact", relation: "interacted_with", confidence: 1, evidence: [{ source: "prompt", detail: event.raw, confidence: 1 }] });
    }
  }
  return { slots, relations };
}

function chooseType(prompt: string): ExperienceType {
  const text = lower(prompt);
  if (/\\b(?:ticket|concert|rave|festival|wedding|birthday|conference|event|party|ceremony|convention)\\b/.test(text)) return "event";
  if (/\\b(?:memory|remember|grandma|grandfather|family|years ago|milestone|anniversary)\\b/.test(text)) return "memory";
  if (/\\b(?:collection|collectible|card|watch|coin|sneaker|guitar|artwork)\\b/.test(text)) return "collection";
  return "story";
}

function tones(lens: Lens): ExperienceTone[] {
  if (lens === "comedy") return ["humorous", "playful", "cinematic"];
  if (lens === "horror") return ["dark", "mysterious", "cinematic"];
  if (lens === "romance") return ["romantic", "emotional", "cinematic"];
  if (lens === "wild") return ["energetic", "playful", "cinematic"];
  if (lens === "mysterious") return ["mysterious", "cinematic"];
  return ["cinematic"];
}

function participantPhrase(event: RealityEvent): string {
  return event.participants.length > 1 ? event.participants.join(" and ") : event.participants[0] ?? "";
}

function faithfulText(event: RealityEvent): string {
  const raw = sentence(event.raw);
  if (!event.participants.length) return raw;
  if (event.participants.every((participant) => lower(raw).includes(lower(participant)))) return raw;
  const phrase = participantPhrase(event);
  return phrase ? `${phrase} ${raw}` : raw;
}

function creativeCandidates(event: RealityEvent, world: World): { text: string; creativity: number }[] {
  const faithful = faithfulText(event);
  const subject = participantPhrase(event);
  const candidates: { text: string; creativity: number }[] = [{ text: faithful, creativity: 0 }];
  if (world.lens === "comedy") {
    if (subject && /\\b(?:arrived|entered|came|walked)\\b/i.test(event.action ?? "")) candidates.push({ text: `${subject} arrived as though the appointment had already been litigated.`, creativity: 9 });
    if (subject && event.object && /\\b(?:stole|chewed|broke|tore|ate)\\b/i.test(event.action ?? "")) candidates.push({ text: `${subject} found ${event.object} and immediately assigned it a new role in the day.`, creativity: 8 });
    if (subject && /\\b(?:groomed|cleaned|repaired|restored|transformed)\\b/i.test(event.action ?? "")) candidates.push({ text: `${subject} started with one version of the situation and left with another.`, creativity: 7 });
  }
  if (world.lens === "romance" && subject && event.place && (RETURN_RE.test(event.raw) || event.time)) candidates.push({ text: `${subject} were back at ${event.place}; enough time had passed to make the return matter.`, creativity: 9 });
  if (world.lens === "horror" && event.place) candidates.push({ text: `${cap(event.place)} looked exactly as remembered. That was not reassuring.`, creativity: 9 });
  if (world.lens === "mysterious" && event.place && RETURN_RE.test(event.raw)) candidates.push({ text: `The return to ${event.place} made the old details feel less accidental.`, creativity: 8 });
  if (world.lens === "wild" && subject) candidates.push({ text: `${subject} did not ease into the next moment. They arrived in it at full speed.`, creativity: 8 });
  return candidates;
}

function coverage(text: string, event: RealityEvent): number {
  const anchors = [...event.participants, event.object, event.place, event.time].filter(Boolean) as string[];
  return anchors.reduce((score, anchor) => score + (lower(text).includes(lower(anchor)) ? 16 : -55), 0);
}

function pick(event: RealityEvent, world: World, used: Set<string>): string {
  return creativeCandidates(event, world)
    .filter((candidate) => !LEAK_RE.test(candidate.text) && !GENERIC_RE.test(candidate.text))
    .map((candidate) => ({ ...candidate, score: candidate.creativity + coverage(candidate.text, event) + (used.has(lower(candidate.text)) ? -100 : 0) }))
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length)[0]?.text ?? faithfulText(event);
}

function beatKind(index: number, total: number): StoryBeatKind {
  if (total <= 1) return "payoff";
  if (index === 0) return "orientation";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "transformation";
  return index % 2 === 0 ? "discovery" : "escalation";
}

function directive(event: RealityEvent, kind: StoryBeatKind): CognitiveBeatDirective {
  return {
    kind,
    intent: "perform the strongest truthful change or meaningful detail supported by the event",
    subject: participantPhrase(event),
    action: event.action ?? event.state ?? "",
    stateBefore: "",
    stateAfter: event.state ?? "",
    relationalFocus: [...event.participants, event.object, event.place, event.time].filter(Boolean) as string[],
    evidence: event.evidence,
    confidence: 1,
  };
}

function planFor(world: World): CognitiveExperiencePlan {
  const premise = premiseFor(world);
  const subject = world.participants[0] ?? world.entities[0] ?? "the experience";
  const assumptions: CognitiveAssumption[] = [];
  return {
    direction: world.events.length > 1 ? "story" : "memory",
    centralSubject: subject,
    audience: [],
    whyInteract: ["experience the supplied reality rather than read a report"],
    emotionalIntent: [world.lens === "neutral" ? "memorable" : world.lens],
    purpose: "turn observed reality into a coherent experience",
    interactionModel: ["open or scan and play sequentially"],
    storyStructure: ["reality", "attention", "change", "consequence", "payoff"],
    memoryModel: ["preserve observed evidence", "connect new events to prior context", "leave room for continuation"],
    geographicModel: world.places,
    socialModel: world.participants,
    discoveryModel: ["repetition", "return", "relationships", "unusual details"],
    rewardModel: [],
    commerceModel: [],
    progressionModel: ["each new event can change what becomes meaningful next"],
    contentModel: world.entities,
    dynamicBehavior: ["resolve known memory before asking", "preserve identity independently of grammar", "adapt creative performance to context"],
    futureEvolution: ["new events can extend the same world", "accepted and rejected creative preferences can influence later performance"],
    creativePossibilities: ["contrast", "personification", "understatement", "escalation", "callback", "reveal", "earned payoff"],
    premise,
    realization: {
      direction: world.events.length > 1 ? "story" : "memory",
      directives: world.events.map((event, index) => directive(event, beatKind(index, world.events.length))),
      semanticArc: world.events.map((event) => event.raw),
      conservedRoles: premise.slots.map((slot) => slot.role),
      confidence: 1,
    } as CognitiveExperienceRealization,
  };
}

function meaningFor(world: World): ExperienceMeaning {
  const participants = world.participants;
  const subject = participants[0] ?? world.entities[0] ?? "the experience";
  return {
    why: "Turn observed reality into an experience worth remembering and returning to.",
    relationship: participants.length > 1 ? { subject: participants[0]!, object: participants[1]!, type: "shared_experience" } : undefined,
    emotions: [world.lens],
    memories: ["persistent", "continuation"],
    desiredFeeling: [world.lens === "neutral" ? "memorable" : world.lens],
    transformation: world.events.length > 1 ? "separate facts become a connected experience" : `a supplied reality becomes an experience about ${subject}`,
  };
}

function titleFor(world: World): string {
  const subject = world.participants.length > 1 ? world.participants.join(" + ") : world.participants[0] ?? world.entities[0] ?? "This Experience";
  const place = world.places[0];
  return place ? `${subject} at ${place}` : `${subject}: What Happened`;
}

function makeMoment(event: RealityEvent, text: string, index: number, total: number, world: World): ExperienceMoment {
  const type: ExperienceMoment["type"] = index === 0 ? "introduction" : index === total - 1 ? "completion" : "story";
  return {
    type,
    component: "story",
    title: index === 0 ? titleFor(world) : undefined,
    subtitle: index === 0 ? participantPhrase(event) || undefined : undefined,
    text: `${sentence(text)}.`,
    description: `${sentence(text)}.`,
    editable: true,
    demo: false,
    order: index,
    payload: {
      source: "universal-mind",
      realityEventId: event.id,
      participants: event.participants,
      evidence: event.evidence.map((item) => item.detail),
      place: event.place,
      time: event.time,
    },
    meta: { source: "universal-mind", lens: world.lens, realityEventId: event.id, place: event.place, time: event.time, duration: index === total - 1 ? 5200 : 3600 },
  };
}

export function messageText(moment: ExperienceMoment): string {
  return moment.text ?? moment.description ?? moment.title ?? (typeof moment.meta?.text === "string" ? moment.meta.text : "");
}

export function compileCognitiveExperience(prompt: string, context: UniversalMindContext = {}): UniversalMindResult {
  const built = buildEvents(prompt, context);
  const lens = lensOf(prompt, context);
  const participants = unique([
    ...built.events.flatMap((event) => event.participants),
    ...(context.event?.participants ?? []),
  ]);
  const entities = deriveEntities(built.events);
  const world: World = {
    prompt,
    entities: unique([...entities.people, ...entities.places, ...entities.products]),
    participants,
    places: entities.places,
    times: entities.times,
    events: built.events,
    relations: built.events.flatMap((event) => event.participants.flatMap((participant) => [
      ...(event.place ? [{ from: participant, relation: "experienced_at", to: event.place, evidenceId: event.id }] : []),
      ...(event.object ? [{ from: participant, relation: "interacted_with", to: event.object, evidenceId: event.id }] : []),
    ])),
    lens,
    memoryMatches: built.memoryMatches,
  };

  const plan = planFor(world);
  const used = new Set<string>();
  const beats: StoryBeat[] = world.events.map((event, index) => {
    const text = pick(event, world, used);
    used.add(lower(text));
    return {
      id: `mind-${event.id}`,
      kind: beatKind(index, world.events.length),
      order: index,
      purpose: "perform reality with attention and creative fidelity",
      text: `${sentence(text)}.`,
      emotionalTarget: lens,
      entities: unique([...event.participants, event.object, event.place].filter(Boolean) as string[]),
      provenance: [{ kind: "observed", source: event.resolvedFromMemory ? "memory" : "prompt", confidence: 1 }],
      directive: directive(event, beatKind(index, world.events.length)),
    };
  });

  if (world.events.length === 1 && beats.length === 1) {
    const event = world.events[0]!;
    const extra = sentence(event.raw) !== sentence(beats[0]!.text) ? sentence(event.raw) : (event.place ? `At ${event.place}, the moment had somewhere to land.` : "The moment stayed with its strongest detail.");
    if (lower(extra) !== lower(beats[0]!.text)) beats.push({ ...beats[0]!, id: `${beats[0]!.id}-payoff`, order: 1, kind: "payoff", text: `${extra}.` });
  }

  const moments = beats.map((beat, index) => makeMoment(world.events[index] ?? world.events.at(-1)!, beat.text, index, beats.length, world));
  const cinematicScenes: CinematicScene[] = moments.map((moment, index) => ({
    id: `mind-scene-${index + 1}`,
    type: index === 0 ? "intro" : index === moments.length - 1 ? "emotion" : "action",
    duration: Number(moment.meta?.duration ?? 3600),
    moment,
    order: index,
    transition: index === 0 ? "none" : lens === "horror" ? (index % 2 ? "fade" : "flash") : lens === "romance" ? "cinematic" : lens === "wild" ? "zoom" : "fade",
    visual: lens === "horror" ? { theme: "dark", animation: "glitch" } : lens === "romance" ? { theme: "cinematic", animation: "slow_zoom" } : lens === "wild" ? { theme: "cinematic", animation: "particles" } : { theme: "cinematic", animation: index === 0 ? "slow_zoom" : "parallax" },
    preload: index < moments.length - 1,
  }));
  const flowSteps: FlowStep[] = moments.map((moment, index) => ({ id: `mind-step-${index + 1}`, order: index, type: index === 0 ? "introduction" : index === moments.length - 1 ? "completion" : "story", payload: moment.payload }));
  const type = chooseType(prompt);
  const meaning = meaningFor(world);
  const blueprint: ExperienceBlueprint = {
    title: titleFor(world),
    type,
    tone: tones(lens),
    meaning,
    moments,
    entities,
    cognitivePlan: plan,
    metadata: {
      archetypes: [type, lens, "universal_entity_experience"],
      themes: unique([...participants, ...world.places, ...world.times]).slice(0, 20),
      dna: ["reality-first", "memory-aware", "participant-preserving", "adaptive", "creative-hypothesis-search", "experience-moment-canonical"],
    },
  };

  const assumptions: CognitiveAssumption[] = [];
  if (built.adaptiveQuestions.length) assumptions.push({ statement: built.adaptiveQuestions[0]!, reason: "memory/context contains multiple or insufficient place candidates", confidence: 1 });
  const learningSignals = unique([
    ...(context.feedback?.accepted ?? []).map((value) => `accepted:${value}`),
    ...(context.feedback?.rejected ?? []).map((value) => `rejected:${value}`),
    ...(context.creativePreferences ?? []).map((value) => `preference:${value}`),
  ]);

  return {
    title: blueprint.title,
    blueprint,
    plan: { ...plan, assumptions },
    flowSteps,
    moments,
    cinematicScenes,
    estimatedDuration: moments.reduce((sum, moment) => sum + Number(moment.meta?.duration ?? 3600), 0),
    momentCount: moments.length,
    world,
    adaptiveQuestions: built.adaptiveQuestions,
    discoveries: unique([
      ...built.memoryMatches.map((match) => `This experience connects to ${match}.`),
      ...(RETURN_RE.test(prompt) && world.places[0] ? [`You returned to ${world.places[0]}.`] : []),
      ...(world.participants.length > 1 ? [`Shared experience between ${world.participants.join(" and ")}.`] : []),
    ]),
    learningSignals,
  };
}

export { RealityKind };
