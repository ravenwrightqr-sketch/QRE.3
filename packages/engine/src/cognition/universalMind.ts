import type {
  CinematicScene,
  CognitiveBeatDirective,
  CognitiveEvidence,
  CognitiveExperiencePlan,
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
  actor?: string;
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
  "arrived","entered","walked","went","came","left","returned","found","cleaned","washed","groomed","repaired","fixed","restored","built","made","created","designed","wrote","cooked","served","prepared","opened","closed","visited","traveled","travelled","drove","rode","painted","danced","sang","played","chose","picked","selected","decided","touched","held","wore","tasted","smelled","looked","saw","watched","shared","gave","took","brought","received","checked","inspected","tested","installed","removed","changed","turned","transformed","finished","completed","celebrated","married","photographed","captured","recorded","taught","learned","discovered","collected","organized","decorated","styled","trimmed","cut","brushed","dried","massaged","relaxed","pampered","spoiled","treated","shook","chewed","stole","tore","ate","ran","called","rented","documented","started","stopped","hit","sat","stood","talked","met","stayed","slept","practiced","won","lost","broke","rescued","adopted","graduated","performed","settled","cried","laughed","loved","hated","feared","remembered","forgot","crossed","lasted","happened","surrendered","disappeared","appeared","continued","waited","lingered","returned"
] as const;

const ACTION_RE = new RegExp(`\\b(?:${ACTIONS.join("|")})\\b`, "i");
const STATE_RE = /\b(?:has been|have been|had been|was|were|is|are|am|remained|became|kept|seemed|felt|stayed)\b/i;
const TIME_RE = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \w+ (?:minutes|hours|days|weeks|years)|for forty years)\b/i;
const PLACE_RE = /\b(?:restaurant|bar|club|museum|theater|theatre|park|beach|hotel|house|home|kitchen|bathroom|bathrooms|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer|gym|spa|backyard|venue|pier|lake|mountain|forest|farm|garden|downtown|desert)\b/i;
const RETURN_RE = /\b(?:back|again|returned|returning|same place|there)\b/i;
const LEAK_RE = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|latent state|internal state|generated output|result is available|next experiential state|delivery pipeline|scan pipeline|customer-facing)\b/i;
const GENERIC_RE = /\b(?:arrived with opinions|entered like there was already a disagreement|approached .* compensation|negotiat(?:ed|ing) terms|appeared to be negotiating compensation|the ordinary part of the day had found an unexpected detail)\b/i;

const clean = (v: unknown) => typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
const sentence = (v: unknown) => clean(v).replace(/[.!?]+$/, "");
const lower = (v: unknown) => sentence(v).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.map(sentence).filter(Boolean))];
const cap = (v: string) => { const s = sentence(v); return s ? s[0]!.toUpperCase() + s.slice(1) : ""; };

function hash(v: string): number { let h = 2166136261; for (let i = 0; i < v.length; i += 1) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function semanticVerbAt(text: string, start = 0): { word: string; index: number } | undefined {
  const fragment = text.slice(start);
  const match = fragment.match(new RegExp(`\\b(?:${ACTIONS.join("|")})\\b`, "i"));
  if (match?.index === undefined || !match[0]) return undefined;
  return { word: match[0], index: start + match.index };
}

function stateAt(text: string, start = 0): { word: string; index: number } | undefined {
  const fragment = text.slice(start);
  const match = fragment.match(STATE_RE);
  if (match?.index === undefined || !match[0]) return undefined;
  return { word: match[0], index: start + match.index };
}

function splitSemanticClauses(chunk: string): string[] {
  const value = sentence(chunk);
  const cuts: number[] = [];
  const joinRe = /\b(?:and|then|but|while|after|before)\b/gi;
  for (const match of value.matchAll(joinRe)) {
    if (typeof match.index !== "number") continue;
    const next = match.index + match[0].length;
    const nextSemantic = semanticVerbAt(value, next) ?? stateAt(value, next);
    if (nextSemantic && nextSemantic.index > next) cuts.push(match.index);
  }
  if (!cuts.length) return [value];
  const pieces: string[] = [];
  let start = 0;
  for (const cut of cuts) {
    const piece = sentence(value.slice(start, cut).replace(/(?:,|\s)$/g, ""));
    if (piece.length >= 6) pieces.push(piece);
    start = cut;
  }
  const tail = sentence(value.slice(start));
  if (tail.length >= 6) pieces.push(tail);
  return unique(pieces.length > 1 ? pieces : [value]);
}

function splitInput(prompt: string): string[] {
  const sentences = clean(prompt).split(/\n+|(?<=[.!?])\s+/).map(sentence).filter(Boolean);
  const output: string[] = [];
  for (const s of sentences) {
    const coarse = splitSemanticClauses(s);
    for (const piece of coarse) {
      const commaPieces = piece.split(/,\s+/).map(sentence).filter(Boolean);
      let current = "";
      for (const part of commaPieces) {
        const normalized = part.replace(/^(?:and|but|then)\s+/i, "");
        if (current && (semanticVerbAt(normalized) || stateAt(normalized)) && (semanticVerbAt(current) || stateAt(current))) {
          output.push(...splitSemanticClauses(current));
          current = normalized;
        } else {
          current = current ? `${current}, ${normalized}` : normalized;
        }
      }
      if (current) output.push(...splitSemanticClauses(current));
    }
  }
  return unique(output);
}

function actionOf(text: string) { return text.match(ACTION_RE)?.[0]; }
function stateOf(text: string) { return text.match(STATE_RE)?.[0]; }
function timeOf(text: string) { return text.match(TIME_RE)?.[0]; }
function placeOf(text: string): string | undefined {
  const named = text.match(/\b(?:at|in|inside|near|around|outside|on|to)\s+(?:the\s+)?((?:[A-Z][A-Za-z0-9'’-]*)(?:\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,5})/);
  if (named?.[1] && !/^(?:and|but|then|first|last|home|it|the)\b/i.test(named[1])) return sentence(named[1]);
  return text.match(PLACE_RE)?.[0];
}

function nameCandidates(text: string): string[] {
  return unique(
    [...text.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)]
      .map((m) => m[0])
      .filter((value) => !/^(?:I|We|The|Then|At|And|My|Our|This|A|An|By|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday)$/i.test(value)),
  );
}

function participantNames(text: string): string[] {
  const semantic = semanticVerbAt(text) ?? stateAt(text);
  if (!semantic || semantic.index <= 0) return [];
  const prefix = sentence(text.slice(0, semantic.index).replace(/^(?:then|and|but|my|our|the|a|an)\s+/i, ""));
  const names = nameCandidates(prefix);
  if (names.length > 1) return names;
  if (names.length === 1 && /^(?:my|our)\b/i.test(prefix)) return [];
  return names;
}

function subjectOf(text: string): string | undefined {
  const semantic = semanticVerbAt(text) ?? stateAt(text);
  if (!semantic || semantic.index <= 0) return undefined;
  const prefix = clean(text.slice(0, semantic.index).replace(/^(?:then|and|but|my|our|the|a|an)\s+/i, ""));
  if (!prefix || prefix.length > 100) return undefined;
  return prefix;
}

function objectOf(text: string, action?: string): string | undefined {
  if (!action) return undefined;
  const match = text.match(new RegExp(`\\b${action}\\b(?:\\s+(?:the|a|an))?\\s+([A-Za-z0-9'’-]+(?:\\s+[A-Za-z0-9'’-]+){0,5})`, "i"));
  const value = sentence(match?.[1]);
  if (!value || PLACE_RE.test(value) || TIME_RE.test(value) || /^(?:home|there|again|until)$/i.test(value)) return undefined;
  return value;
}

function memoryStrings(context?: UniversalMindContext): string[] {
  const values = [...(context?.memorySummary ?? []), ...(context?.memories ?? []).map((m) => typeof m === "string" ? m : JSON.stringify(m) ?? "")];
  if (context?.event) values.push(JSON.stringify(context.event));
  return values.map(clean).filter(Boolean);
}

function lensOf(prompt: string, context?: UniversalMindContext): Lens {
  const corpus = lower([prompt, ...(context?.creativePreferences ?? [])].join(" "));
  if (/\b(?:horror|terrifying|scary|haunted|creepy|sinister|demented|dark)\b/i.test(corpus)) return "horror";
  if (/\b(?:funny|humor|humour|comedy|playful|absurd|ridiculous|silly|cheeky|witty|hilarious)\b/i.test(corpus)) return "comedy";
  if (/\b(?:romantic|romance|intimate|tender|first date|love)\b/i.test(corpus)) return "romance";
  if (/\b(?:wild|chaotic|unhinged)\b/i.test(corpus)) return "wild";
  if (/\b(?:mysterious|mystery|strange|surreal)\b/i.test(corpus)) return "mysterious";
  return "neutral";
}

function memoryPlaces(memories: string[], known: string[]): string[] {
  const found: string[] = [];
  for (const memory of memories) {
    found.push(...(memory.match(/\b(?:at|in|near|on)\s+([A-Z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’-]*){0,5})/g) ?? []));
    const place = memory.match(PLACE_RE)?.[0];
    if (place) found.push(place);
  }
  return unique([...known, ...found.flatMap((v) => v.split(/\s+at\s+|\s+in\s+/i).slice(-1))]);
}

function resolveMemory(text: string, memories: string[], knownPlaces: string[]): { place?: string; matches: string[]; question?: string } {
  if (!RETURN_RE.test(text)) return { matches: [] };
  const candidates = memoryPlaces(memories, knownPlaces);
  if (candidates.length === 1) return { place: candidates[0], matches: candidates };
  if (candidates.length > 1) return { matches: candidates.slice(0, 6), question: "Which place did you go back to?" };
  return { matches: [], question: "Where did you go back to?" };
}

function evidence(id: string, detail: string, kind: RealityKind, salience: number, source: CognitiveEvidence["source"] = "prompt"): Evidence {
  return { id, detail, kind, salience, source, confidence: 1 };
}

function buildEvents(prompt: string, context?: UniversalMindContext) {
  const chunks = splitInput(prompt);
  const memories = memoryStrings(context);
  const knownPlaces = unique([context?.location?.label ?? "", context?.event?.venue ?? ""]);
  const adaptiveQuestions: string[] = [];
  const memoryMatches: string[] = [];
  const events: RealityEvent[] = [];
  let carrySubject: string | undefined;
  let carryParticipants: string[] = [];
  let carryPlace: string | undefined;

  chunks.forEach((raw, index) => {
    const action = actionOf(raw);
    const subject = subjectOf(raw) ?? carrySubject;
    const parsedParticipants = participantNames(raw);
    const participants = parsedParticipants.length ? parsedParticipants : carryParticipants;
    const resolved = resolveMemory(raw, memories, knownPlaces);
    const place = resolved.place ?? placeOf(raw) ?? (RETURN_RE.test(raw) ? carryPlace : undefined);
    const time = timeOf(raw);
    const object = objectOf(raw, action);
    const state = stateOf(raw);
    if (resolved.question) adaptiveQuestions.push(resolved.question);
    memoryMatches.push(...resolved.matches);
    if (subject) carrySubject = subject;
    if (participants.length) carryParticipants = participants;
    if (place) carryPlace = place;
    const eventEvidence: Evidence[] = [evidence(`ev-${index}-raw`, raw, action ? "event" : "history", action || state ? 0.9 : 0.75, resolved.place ? "memory" : "prompt")];
    for (const participant of participants) eventEvidence.push(evidence(`ev-${index}-participant-${participant}`, participant, "entity", 1));
    if (place) eventEvidence.push(evidence(`ev-${index}-place`, place, "place", 1, resolved.place ? "memory" : "prompt"));
    if (time) eventEvidence.push(evidence(`ev-${index}-time`, time, "time", 1));
    if (object) eventEvidence.push(evidence(`ev-${index}-object`, object, "entity", 0.95));
    if (subject && !participants.includes(subject)) eventEvidence.push(evidence(`ev-${index}-subject`, subject, "entity", 1));
    events.push({ id: `event-${index + 1}`, raw, actor: subject, participants, action, object, place, time, state, order: index, evidence: eventEvidence, resolvedFromMemory: Boolean(resolved.place) });
  });

  return { events, adaptiveQuestions: unique(adaptiveQuestions), memoryMatches: unique(memoryMatches) };
}

function deriveEntities(events: RealityEvent[]): ExperienceEntities {
  const people = unique(events.flatMap((e) => [...e.participants, e.actor ?? ""]).filter((v) => /^[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?$/.test(v)));
  const places = unique(events.map((e) => e.place ?? ""));
  const dates = unique(events.map((e) => e.time ?? "").filter((v) => /\d{4}/.test(v)));
  const times = unique(events.map((e) => e.time ?? "").filter((v) => /\b(?:am|pm|sunrise|sunset|closing)\b/i.test(v)));
  const eventsNamed = unique(events.map((e) => e.raw));
  const products = unique(events.map((e) => e.object ?? "").filter(Boolean));
  const keywords = unique(events.flatMap((e) => `${e.raw} ${e.state ?? ""}`.toLowerCase().split(/[^a-z0-9'’-]+/).filter((w) => w.length >= 5))).slice(0, 60);
  return { people, places, organizations: [], dates, times, events: eventsNamed, products, urls: [], phones: [], media: [], emails: [], keywords };
}

function planFor(world: World): CognitiveExperiencePlan {
  const promptEvidence = (detail: string): CognitiveEvidence[] => [{ source: "prompt", detail, confidence: 1 }];
  const slots = [] as CognitivePremise["slots"];
  const add = (role: CognitivePremise["slots"][number]["role"], values: string[], salience: number) => { if (values.length) slots.push({ role, values: unique(values), status: "observed", confidence: 1, salience, evidence: values.flatMap((v) => promptEvidence(v)) }); };
  add("subject", world.events.map((e) => e.actor ?? "").filter(Boolean).slice(0, 3), 1);
  add("participants", world.participants, 0.95);
  add("event", world.events.map((e) => e.action ?? e.raw).filter(Boolean), 0.9);
  add("artifact", world.events.map((e) => e.object ?? "").filter(Boolean), 0.85);
  add("place", world.places, 1);
  add("temporal", world.times, 1);
  add("emotion", world.events.map((e) => e.state ?? "").filter(Boolean), 0.6);
  const relations = [] as CognitivePremise["relations"];
  for (const event of world.events) {
    for (const participant of event.participants) {
      if (event.place) relations.push({ from: participant, to: event.place, relation: "experienced_at", confidence: 1, evidence: promptEvidence(event.raw) });
      if (event.object) relations.push({ from: participant, to: event.object, relation: "interacted_with", confidence: 1, evidence: promptEvidence(event.raw) });
    }
  }
  const premise: CognitivePremise = { slots, relations };
  const subject = world.events.find((e) => e.participants[0])?.participants[0] ?? world.events.find((e) => e.actor)?.actor ?? world.entities[0] ?? "the moment";
  const direction = world.events.length > 1 ? "story" : "memory";
  return {
    direction,
    centralSubject: subject,
    audience: [],
    whyInteract: ["experience what the supplied reality contains"],
    emotionalIntent: [world.lens === "neutral" ? "memorable" : world.lens],
    purpose: world.events.length > 1 ? "turn observed reality into a coherent sequence" : "turn a supplied memory or state into a meaningful experience",
    interactionModel: ["scan or open and play sequentially"],
    storyStructure: ["reality", "change", "consequence", "payoff"],
    memoryModel: ["preserve observed evidence", "carry continuity forward"],
    geographicModel: world.places,
    socialModel: world.participants,
    discoveryModel: ["recurrence", "connections", "unusual details"],
    rewardModel: [],
    commerceModel: [],
    progressionModel: ["each new event can extend the world"],
    contentModel: world.entities,
    dynamicBehavior: ["resolve memory before asking", "adapt creative performance to lens and history"],
    futureEvolution: ["new scans can add events", "memories can change what becomes interesting next time"],
    creativePossibilities: ["contrast", "surprise", "agency", "escalation", "callback", "unexpected consequence"],
    premise,
  };
}

function deriveLensTone(lens: Lens): ExperienceTone[] {
  switch (lens) {
    case "comedy": return ["humorous", "playful", "cinematic"];
    case "horror": return ["dark", "mysterious", "cinematic"];
    case "romance": return ["romantic", "emotional", "cinematic"];
    case "wild": return ["energetic", "playful", "cinematic"];
    case "mysterious": return ["mysterious", "cinematic"];
    default: return ["cinematic"];
  }
}

function chooseType(prompt: string, world: World): ExperienceType {
  const text = lower(prompt);
  if (/\b(?:ticket|concert|rave|festival|wedding|birthday|conference|event|party|ceremony)\b/.test(text)) return "event";
  if (/\b(?:memory|remember|grandma|grandfather|family|years ago|milestone|anniversary)\b/.test(text)) return "memory";
  if (/\b(?:collection|collectible|card|watch|coin|sneaker|guitar|artwork)\b/.test(text)) return "collection";
  if (world.events.some((e) => e.place || e.action)) return "story";
  return "story";
}

function meaningFor(subject: string, participants: string[], world: World): ExperienceMeaning {
  return {
    why: "Turn observed reality into an experience worth remembering and returning to.",
    relationship: participants.length > 1 ? { subject: participants[0]!, object: participants[1]!, type: "shared_experience" } : undefined,
    emotions: [world.lens],
    memories: ["persistent", "continuation"],
    desiredFeeling: world.lens === "neutral" ? ["memorable"] : [world.lens],
    transformation: world.events.length > 1 ? "one observed moment becomes a sequence with consequence" : "a supplied fact becomes a meaningful moment",
  };
}

function participantPhrase(event: RealityEvent): string {
  return event.participants.length > 1 ? event.participants.join(" and ") : event.participants[0] ?? event.actor ?? "";
}

function presentEventText(event: RealityEvent): string {
  const raw = sentence(event.raw);
  if (!event.participants.length) return raw;
  const phrase = participantPhrase(event);
  const existing = event.participants.every((participant) => lower(raw).includes(lower(participant)));
  return existing ? raw : `${phrase} ${raw}`;
}

function creativeCandidates(event: RealityEvent, world: World): Array<{ text: string; creativity: number }> {
  const raw = presentEventText(event);
  const actor = participantPhrase(event);
  const place = event.place;
  const object = event.object;
  const time = event.time;
  const candidates: Array<{ text: string; creativity: number }> = [{ text: raw, creativity: 0 }];

  if (world.lens === "comedy") {
    if (actor && /\b(?:arrived|entered|came|walked)\b/i.test(event.action ?? "")) candidates.push({ text: `${cap(actor)} arrived like the appointment had already been reviewed by legal.`, creativity: 9 });
    if (actor && object && /\b(?:stole|chewed|broke|tore|ate)\b/i.test(event.action ?? "")) candidates.push({ text: `${cap(actor)} took one look at ${object} and apparently decided it was part of the compensation package.`, creativity: 10 });
    if (actor && /\b(?:cleaned|groomed|repaired|restored|transformed)\b/i.test(event.action ?? "")) candidates.push({ text: `${cap(actor)} started with one version of the situation. The after-photo had other plans.`, creativity: 8 });
    if (event.state) candidates.push({ text: `${cap(actor || "It")} had been that way long enough to make the next change feel suspiciously important.`, creativity: 7 });
  }
  if (world.lens === "romance" && actor && place) {
    candidates.push({ text: `${cap(actor)} was back at ${place}; time had passed, but the place still knew the shape of the first night.`, creativity: 9 });
  }
  if (world.lens === "horror") {
    if (place) candidates.push({ text: `${cap(place)} was still the place they remembered. That was the problem.`, creativity: 10 });
    if (object) candidates.push({ text: `${cap(object)} was ordinary enough until the rest of the scene made it difficult to believe.`, creativity: 8 });
  }
  if (world.lens === "wild") {
    if (actor) candidates.push({ text: `${cap(actor)} did not exactly enter the next moment so much as arrive in it at full speed.`, creativity: 8 });
  }
  if (world.lens === "mysterious" && place) {
    candidates.push({ text: `The return to ${place} made the old details feel less accidental.`, creativity: 8 });
  }
  if (time && /until closing|sunrise|sunset/i.test(time)) candidates.push({ text: raw, creativity: 4 });
  return candidates;
}

function anchorCoverage(candidate: string, event: RealityEvent): number {
  const required = [...event.participants, event.object, event.place, event.time].filter(Boolean) as string[];
  let score = 0;
  for (const item of required) score += lower(candidate).includes(lower(item)) ? 12 : -40;
  return score;
}

function pickCandidate(event: RealityEvent, world: World, used: Set<string>): string {
  const ranked = creativeCandidates(event, world)
    .filter((candidate) => !LEAK_RE.test(candidate.text) && !GENERIC_RE.test(candidate.text))
    .map((candidate) => {
      const novelty = used.has(lower(candidate.text)) ? -100 : 0;
      const fidelity = anchorCoverage(candidate.text, event);
      const transformed = lower(candidate.text) !== lower(presentEventText(event)) ? 7 : 0;
      return { text: candidate.text, score: candidate.creativity + fidelity + transformed + novelty };
    })
    .sort((a, b) => b.score - a.score || hash(a.text) - hash(b.text));
  return sentence(ranked[0]?.text ?? presentEventText(event));
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
    intent: "perform the strongest truthful change or meaningful detail supported by this event",
    subject: participantPhrase(event) || event.object || event.place || "",
    action: event.action ?? event.state ?? "",
    stateBefore: "",
    stateAfter: event.state ?? "",
    relationalFocus: [...event.participants, event.object, event.place, event.time].filter(Boolean) as string[],
    evidence: event.evidence,
    confidence: 1,
  };
}

function titleFor(world: World): string {
  const subject = world.events.find((e) => e.participants[0])?.participants.join(" and ") ?? world.events.find((e) => e.actor)?.actor ?? world.entities[0] ?? "This Experience";
  const place = world.places[0];
  return place ? `${subject} at ${place}` : `${subject}: What Happened`;
}

function subjectFor(world: World): string { return world.events.find((e) => e.participants[0])?.participants[0] ?? world.events.find((e) => e.actor)?.actor ?? world.entities[0] ?? "the experience"; }

export function messageText(moment: ExperienceMoment): string {
  return moment.text ?? moment.description ?? moment.title ?? (typeof moment.meta?.text === "string" ? moment.meta.text : "");
}

export function compileCognitiveExperience(prompt: string, context: UniversalMindContext = {}): UniversalMindResult {
  const built = buildEvents(prompt, context);
  const entities = deriveEntities(built.events);
  const participants = unique([...built.events.flatMap((e) => e.participants), ...(context.event?.participants ?? [])]);
  const world: World = {
    prompt,
    entities: unique([...entities.people, ...entities.places, ...entities.products]),
    participants,
    places: unique([...entities.places, context.location?.label ?? "", context.event?.venue ?? ""]),
    times: unique(entities.times),
    events: built.events,
    relations: built.events.flatMap((e) => e.participants.flatMap((participant) => [
      ...(e.place ? [{ from: participant, relation: "experienced_at", to: e.place, evidenceId: e.id }] : []),
      ...(e.object ? [{ from: participant, relation: "interacted_with", to: e.object, evidenceId: e.id }] : []),
    ])),
    lens: lensOf(prompt, context),
    memoryMatches: built.memoryMatches,
  };

  const plan = planFor(world);
  const used = new Set<string>();
  const beats: StoryBeat[] = world.events.map((event, index) => {
    const text = pickCandidate(event, world, used);
    used.add(lower(text));
    return {
      id: `mind-${event.id}`,
      kind: beatKind(index, world.events.length),
      order: index,
      purpose: "perform reality with attention and creative fidelity",
      text: `${sentence(text)}.`,
      emotionalTarget: world.lens,
      entities: unique([...event.participants, event.actor, event.object, event.place].filter(Boolean) as string[]),
      provenance: [{ kind: "observed", source: event.resolvedFromMemory ? "memory" : "prompt", confidence: 1 }],
      directive: directive(event, beatKind(index, world.events.length)),
    };
  });

  if (beats.length === 1 && world.events[0]?.raw && lower(beats[0].text) === lower(presentEventText(world.events[0]))) {
    const second = `The detail was worth keeping: ${presentEventText(world.events[0])}.`;
    if (second.toLowerCase() !== beats[0].text.toLowerCase()) beats.push({ ...beats[0], id: `${beats[0].id}-payoff`, order: 1, kind: "payoff", text: second });
  }

  const tones = deriveLensTone(world.lens);
  const type = chooseType(prompt, world);
  const subject = subjectFor(world);
  const meaning = meaningFor(subject, participants, world);
  const premise = plan.premise!;
  const realization = {
    direction: plan.direction ?? "story",
    directives: beats.map((beat) => beat.directive!).filter(Boolean),
    semanticArc: world.events.map((event) => event.raw),
    conservedRoles: premise.slots.map((slot) => slot.role),
    confidence: 1,
  };
  const finalPlan: CognitiveExperiencePlan = { ...plan, realization };

  const moments: ExperienceMoment[] = beats.map((beat, index) => {
    const event = world.events[index] ?? world.events.at(-1);
    const type: ExperienceMoment["type"] = index === 0 ? "introduction" : index === beats.length - 1 ? "completion" : "story";
    return {
      type,
      component: "story",
      title: index === 0 ? titleFor(world) : undefined,
      subtitle: index === 0 ? participantPhrase(event ?? {} as RealityEvent) : undefined,
      text: beat.text,
      description: beat.text,
      editable: true,
      demo: false,
      order: index,
      payload: { source: "universal-mind", realityEventId: event?.id, evidence: event?.evidence.map((e) => e.detail) ?? [], participants: event?.participants ?? [] },
      meta: { source: "universal-mind", lens: world.lens, realityEventId: event?.id, place: event?.place, time: event?.time, duration: index === beats.length - 1 ? 5200 : 3600 },
    };
  });

  const cinematicScenes: CinematicScene[] = moments.map((moment, index) => ({
    id: `mind-scene-${index + 1}`,
    type: index === 0 ? "intro" : index === moments.length - 1 ? "emotion" : "action",
    duration: Number(moment.meta?.duration ?? 3600),
    moment,
    order: index,
    transition: index === 0 ? "none" : world.lens === "horror" ? (index % 2 ? "fade" : "flash") : world.lens === "romance" ? "cinematic" : world.lens === "wild" ? "zoom" : "fade",
    visual: world.lens === "horror" ? { theme: "dark", animation: "glitch" } : world.lens === "romance" ? { theme: "cinematic", animation: "slow_zoom" } : world.lens === "wild" ? { theme: "cinematic", animation: "particles" } : { theme: "cinematic", animation: index === 0 ? "slow_zoom" : "parallax" },
    preload: index < moments.length - 1,
  }));

  const flowSteps: FlowStep[] = moments.map((moment, index) => ({ id: `mind-step-${index + 1}`, order: index, type: "story", payload: moment.payload }));
  const blueprint: ExperienceBlueprint = {
    title: titleFor(world),
    type,
    tone: tones,
    meaning,
    moments,
    entities,
    cognitivePlan: finalPlan,
    metadata: {
      archetypes: [type, world.lens, "universal_entity_experience"],
      themes: unique([...world.places, ...world.times, ...participants]).slice(0, 16),
      dna: ["reality-first", "memory-aware", "adaptive", "creative-hypothesis-search", "experience-moment-canonical"],
    },
  };

  const discoveries = unique([
    ...built.memoryMatches.map((match) => `This experience connects to ${match}.`),
    ...(RETURN_RE.test(prompt) && world.places[0] ? [`You returned to ${world.places[0]}.`] : []),
    ...(world.events.length > 1 && world.times.length ? [`The sequence carries ${world.times.length} explicit time cue${world.times.length === 1 ? "" : "s"}.`] : []),
  ]);

  const learningSignals = unique([
    ...(context.feedback?.accepted ?? []).map((x) => `accepted:${x}`),
    ...(context.feedback?.rejected ?? []).map((x) => `rejected:${x}`),
    ...(context.creativePreferences ?? []).map((x) => `preference:${x}`),
  ]);

  return {
    title: blueprint.title,
    blueprint,
    plan: finalPlan,
    flowSteps,
    moments,
    cinematicScenes,
    estimatedDuration: moments.reduce((sum, moment) => sum + Number(moment.meta?.duration ?? 3600), 0),
    momentCount: moments.length,
    world,
    adaptiveQuestions: built.adaptiveQuestions,
    discoveries,
    learningSignals,
  };
}

export { RealityKind };
