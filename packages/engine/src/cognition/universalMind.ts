import type {
  CinematicScene,
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
  details: string[];
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
  "arrived","entered","walked","went","came","left","returned","found","cleaned","washed","groomed","repaired","fixed","restored","built","made","created","designed","wrote","cooked","served","prepared","opened","closed","visited","traveled","travelled","drove","rode","painted","danced","sang","played","chose","picked","selected","decided","touched","held","wore","tasted","smelled","looked","saw","watched","shared","gave","took","brought","received","checked","inspected","tested","installed","removed","changed","turned","transformed","finished","completed","celebrated","married","photographed","captured","recorded","taught","learned","discovered","collected","organized","decorated","styled","trimmed","cut","brushed","dried","massaged","relaxed","pampered","spoiled","treated","shook","chewed","stole","tore","ate","ran","called","rented","documented","started","stopped","hit","sat","stood","talked","met","stayed","slept","practiced","won","lost","broke","rescued","adopted","graduated","performed","settled","cried","laughed","loved","hated","feared","remembered","forgot","crossed","lasted","happened","surrendered","disappeared","appeared","continued","waited","lingered","got"
] as const;
const ACTION_RE = new RegExp(`\\b(?:${ACTIONS.join("|")})\\b`, "i");
const STATE_RE = /\\b(?:has been|have been|had been|was|were|is|are|am|remained|became|kept|seemed|felt|stayed|got)\\b/i;
const TIME_RE = /\\b(?:\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)|\\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \\w+ (?:minutes|hours|days|weeks|years)|for forty years|every [A-Za-z]+)\\b/i;
const PLACE_RE = /\\b(?:restaurant|bar|club|museum|theater|theatre|park|beach|hotel|house|home|kitchen|bathroom|bathrooms|living room|bedroom|garage|school|office|stadium|arena|shop|store|airport|station|road|street|city|town|warehouse|church|hall|studio|groomer|gym|spa|backyard|venue|pier|lake|mountain|forest|farm|garden|downtown|desert)\\b/i;
const RETURN_RE = /\\b(?:back|again|returned|returning|same place|there)\\b/i;
const LEAK_RE = /\\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|latent state|internal state|generated output|result is available|next experiential state|delivery pipeline|scan pipeline)\\b/i;
const GENERIC_RE = /\\b(?:approached .* compensation|negotiat(?:ed|ing) terms|arrived with opinions|entered like there was already a disagreement)\\b/i;
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
    const before = text.slice(0, match.index);
    const next = semanticIndex(text, match.index + match[0].length);
    const beforeHasSemantic = Boolean(semanticIndex(before));
    if (next && (beforeHasSemantic || /^(?:then|but|while|after|before)\\b/i.test(match[0]))) cuts.push(match.index);
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
      if (parts.length === 1) { output.push(clause); continue; }
      let current = "";
      for (const part of parts) {
        const hasSemantic = Boolean(semanticIndex(part));
        const currentHasSemantic = Boolean(current && semanticIndex(current));
        const newEvent = Boolean(current && hasSemantic && currentHasSemantic);
        if (newEvent && /^(?:then|but)\\b/i.test(part)) {
          output.push(current);
          current = part.replace(/^(?:then|but)\\s+/i, "");
        } else if (newEvent && /^and\\s+/i.test(part)) {
          output.push(current);
          current = part.replace(/^and\\s+/i, "");
        } else current = current ? `${current}, ${part}` : part;
      }
      if (current) output.push(current);
    }
  }
  return unique(output.flatMap(splitSemanticClauses));
}

function timeOf(text: string) { return text.match(TIME_RE)?.[0]; }
function actionOf(text: string) { return text.match(ACTION_RE)?.[0]; }
function stateOf(text: string) { return text.match(STATE_RE)?.[0]; }
function placeOf(text: string): string | undefined {
  const named = text.match(/\\b(?:at|in|inside|near|around|outside|on|to)\\s+(?:the\\s+)?([^,.;]+)/i)?.[1];
  if (named) {
    const tokens = sentence(named).split(/\\s+/).filter(Boolean);
    const hit = tokens.findIndex((token) => PLACE_RE.test(token));
    if (hit >= 0) return tokens.slice(Math.max(0, hit - 1), Math.min(tokens.length, hit + 1)).join(" ");
    return sentence(named);
  }
  return text.match(PLACE_RE)?.[0];
}
function properNameCandidates(text: string): string[] {
  const stop = /^(?:I|We|The|Then|At|And|My|Our|This|A|An|By|He|She|They|Guests|Everyone|Grandma|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday)$/i;
  return unique([...text.matchAll(/\\b[A-Z][A-Za-z'’-]*(?:\\s+[A-Z][A-Za-z'’-]*)?\\b/g)].map((m) => m[0]).filter((name) => !stop.test(name)));
}
function participantsOf(text: string, fallback: string[] = []): string[] {
  const semantic = semanticIndex(text);
  if (!semantic || semantic.index <= 0) return fallback;
  const prefix = sentence(text.slice(0, semantic.index).replace(/^(?:then|and|but)\\s+/i, ""));
  const names = properNameCandidates(prefix);
  const pair = prefix.match(/^([A-Z][A-Za-z'’-]*)\\s+(?:and|&)\\s+([A-Z][A-Za-z'’-]*)$/);
  return pair ? unique([pair[1]!, pair[2]!]) : names.length ? names : fallback;
}
function detailBeforeSemantic(text: string): string | undefined {
  const semantic = semanticIndex(text);
  if (!semantic || semantic.index <= 0) return undefined;
  const prefix = sentence(text.slice(0, semantic.index).replace(/^(?:then|and|but)\\s+/i, ""));
  const cleaned = prefix.replace(/^(?:the|a|an|this|that|these|those|my|our|their)\\s+/i, "");
  if (!cleaned || /^(?:I|we|he|she|they|it|Alex|Sam)$/i.test(cleaned)) return undefined;
  return cleaned;
}
function objectOf(text: string, action?: string, state?: string): string | undefined {
  if (action) {
    const match = text.match(new RegExp(`\\b${action}\\b(?:\\s+(?:the|a|an))?\\s+([^,.;]+)`, "i"));
    const raw = sentence(match?.[1]);
    if (raw) {
      const value = raw.split(/\\b(?:like|at|in|on|to|for|until|and|then|but)\\b/i)[0]?.trim();
      if (value && !PLACE_RE.test(value) && !TIME_RE.test(value) && !/^(?:home|there|again|until|every)$/i.test(value)) return sentence(value);
    }
  }
  if (state) return detailBeforeSemantic(text);
  return undefined;
}
function memoryStrings(context?: UniversalMindContext): string[] {
  const values = [...(context?.memorySummary ?? []), ...(context?.memories ?? []).map((item) => typeof item === "string" ? item : JSON.stringify(item) ?? "")];
  if (context?.event) values.push(JSON.stringify(context.event));
  return values.map(clean).filter(Boolean);
}
function memoryPlaces(context?: UniversalMindContext): string[] {
  return unique(memoryStrings(context).flatMap((memory) => {
    const named = [...memory.matchAll(/\\b(?:at|in|near|on)\\s+(?:the\\s+)?([^,.;]+)/gi)].map((m) => placeOf(`at ${m[1]}`) ?? "");
    const generic = memory.match(PLACE_RE)?.[0] ?? "";
    return [...named, generic];
  }));
}
function resolveMemoryPlace(text: string, context?: UniversalMindContext): { place?: string; matches: string[]; question?: string } {
  if (!RETURN_RE.test(text)) return { matches: [] };
  const candidates = memoryPlaces(context);
  if (candidates.length === 1) return { place: candidates[0], matches: candidates };
  if (candidates.length > 1) return { matches: candidates.slice(0, 6), question: "Which place did you go back to?" };
  return { matches: [], question: "Where did you go back to?" };
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
function evidence(id: string, detail: string, kind: RealityKind, salience: number, source: CognitiveEvidence["source"] = "prompt"): Evidence { return { id, detail, kind, salience, source, confidence: 1 }; }

function buildEvents(prompt: string, context?: UniversalMindContext) {
  const chunks = splitInput(prompt);
  const events: RealityEvent[] = [];
  const adaptiveQuestions: string[] = [];
  const memoryMatches: string[] = [];
  let carryParticipants = unique(context?.event?.participants ?? []);
  let carryPlace = context?.location?.label ?? context?.event?.venue;
  chunks.forEach((raw, index) => {
    const participants = participantsOf(raw, carryParticipants);
    const action = actionOf(raw);
    const state = stateOf(raw);
    const resolved = resolveMemoryPlace(raw, context);
    const place = resolved.place ?? placeOf(raw) ?? (RETURN_RE.test(raw) ? carryPlace : undefined);
    const time = timeOf(raw);
    const object = objectOf(raw, action, state);
    const detail = object ?? detailBeforeSemantic(raw);
    if (resolved.question) adaptiveQuestions.push(resolved.question);
    memoryMatches.push(...resolved.matches);
    if (participants.length) carryParticipants = participants;
    if (place) carryPlace = place;
    const items: Evidence[] = [evidence(`event-${index}-raw`, raw, action ? "event" : "history", action || state ? 0.95 : 0.8, resolved.place ? "memory" : "prompt")];
    for (const participant of participants) items.push(evidence(`event-${index}-participant-${participant}`, participant, "entity", 1));
    if (place) items.push(evidence(`event-${index}-place`, place, "place", 1, resolved.place ? "memory" : "prompt"));
    if (time) items.push(evidence(`event-${index}-time`, time, "time", 1));
    if (object) items.push(evidence(`event-${index}-detail`, object, "entity", 0.98));
    if (state) items.push(evidence(`event-${index}-state`, state, "state", 0.85));
    events.push({ id: `event-${index + 1}`, raw, participants, details: unique([detail ?? "", raw.match(/\\b[A-Za-z]+(?=\\s+(?:were|was|is|are)\\b)/i)?.[0] ?? ""]), action, state, object, place, time, order: index, evidence: items, resolvedFromMemory: Boolean(resolved.place) });
  });
  return { events, adaptiveQuestions: unique(adaptiveQuestions), memoryMatches: unique(memoryMatches) };
}
function deriveEntities(events: RealityEvent[]): ExperienceEntities {
  const people = unique(events.flatMap((event) => event.participants));
  const places = unique(events.map((event) => event.place ?? ""));
  const products = unique(events.flatMap((event) => [...event.details, event.object ?? ""]));
  const dates = unique(events.map((event) => event.time ?? "").filter((v) => /\\d{4}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(v)));
  const times = unique(events.map((event) => event.time ?? "").filter((v) => /\\b(?:am|pm|sunrise|sunset|closing)\\b/i.test(v)));
  const eventFacts = unique(events.map((event) => event.raw));
  const keywords = unique(events.flatMap((event) => `${event.raw} ${event.state ?? ""}`.split(/[^A-Za-z0-9'’-]+/).filter((word) => word.length >= 5))).slice(0, 120);
  return { people, places, organizations: [], dates, times, events: eventFacts, products, urls: [], phones: [], media: [], emails: [], keywords };
}
function premiseFor(world: World): CognitivePremise {
  const slots: CognitivePremise["slots"] = [];
  const add = (role: CognitivePremise["slots"][number]["role"], values: string[], salience: number) => { const v = unique(values); if (v.length) slots.push({ role, values: v, status: "observed", confidence: 1, salience, evidence: v.map((detail) => ({ source: "prompt", detail, confidence: 1 })) }); };
  add("subject", world.participants.slice(0, 3), 1); add("participants", world.participants, 1); add("event", world.events.map((e) => e.action ?? e.raw), 0.95); add("artifact", world.events.flatMap((e) => e.details), 0.95); add("place", world.places, 1); add("temporal", world.times, 1); add("emotion", world.events.map((e) => e.state ?? ""), 0.7);
  const relations: CognitivePremise["relations"] = [];
  for (const e of world.events) for (const p of e.participants) { if (e.place) relations.push({ from: "participants", to: "place", relation: "experienced_at", confidence: 1, evidence: [{ source: "prompt", detail: e.raw, confidence: 1 }] }); if (e.object) relations.push({ from: "participants", to: "artifact", relation: "interacted_with", confidence: 1, evidence: [{ source: "prompt", detail: e.raw, confidence: 1 }] }); }
  return { slots, relations };
}
function chooseType(prompt: string): ExperienceType { const t = lower(prompt); if (/\\b(?:ticket|concert|rave|festival|wedding|birthday|conference|event|party|ceremony|convention)\\b/.test(t)) return "event"; if (/\\b(?:memory|remember|grandma|grandfather|family|years ago|milestone|anniversary)\\b/.test(t)) return "memory"; if (/\\b(?:collection|collectible|card|watch|coin|sneaker|guitar|artwork)\\b/.test(t)) return "collection"; return "story"; }
function tones(lens: Lens): ExperienceTone[] { if (lens === "comedy") return ["humorous", "playful", "cinematic"]; if (lens === "horror") return ["dark", "mysterious", "cinematic"]; if (lens === "romance") return ["romantic", "emotional", "cinematic"]; if (lens === "wild") return ["energetic", "playful", "cinematic"]; if (lens === "mysterious") return ["mysterious", "cinematic"]; return ["cinematic"]; }
function phrase(e: RealityEvent): string { return e.participants.length > 1 ? e.participants.join(" and ") : e.participants[0] ?? ""; }
function faithful(e: RealityEvent): string { const raw = sentence(e.raw); if (!e.participants.length || e.participants.every((p) => lower(raw).includes(lower(p)))) return raw; return `${phrase(e)} ${raw}`; }
function creativeCandidates(e: RealityEvent, world: World): { text: string; creativity: number }[] {
  const out = [{ text: faithful(e), creativity: 0 }];
  const subject = phrase(e);
  if (world.lens === "comedy" && subject && /\\b(?:arrived|entered|came|walked)\\b/i.test(e.action ?? "")) out.push({ text: `${subject} arrived like legal counsel was already on the way.`, creativity: 9 });
  if (world.lens === "comedy" && subject && e.object && /\\b(?:stole|chewed|broke|tore|ate)\\b/i.test(e.action ?? "")) out.push({ text: `${subject} took ${e.object} with the confidence of someone who had already made the decision.`, creativity: 8 });
  if (world.lens === "romance" && subject && e.place && RETURN_RE.test(e.raw)) out.push({ text: `${subject} were back at ${e.place}, where the story had started.`, creativity: 9 });
  if (world.lens === "horror" && e.object) out.push({ text: `${cap(e.object)} were still there. That was the first thing that felt wrong.`, creativity: 9 });
  if (world.lens === "horror" && e.place && !e.object) out.push({ text: `${cap(e.place)} looked exactly as remembered. That was not reassuring.`, creativity: 8 });
  if (world.lens === "mysterious" && e.place && RETURN_RE.test(e.raw)) out.push({ text: `The return to ${e.place} made the old details feel less accidental.`, creativity: 8 });
  if (world.lens === "wild" && subject) out.push({ text: `${subject} did not ease into the moment. They arrived in it at full speed.`, creativity: 8 });
  return out;
}
function coverage(text: string, e: RealityEvent): number {
  const anchors = [...e.participants, ...e.details, e.object, e.place, e.time].filter(Boolean) as string[];
  return anchors.reduce((score, anchor) => score + (lower(text).includes(lower(anchor)) ? 20 : -80), 0);
}
function pick(e: RealityEvent, world: World, used: Set<string>): string {
  const ranked = creativeCandidates(e, world).filter((c) => !LEAK_RE.test(c.text) && !GENERIC_RE.test(c.text)).map((c) => ({ ...c, score: c.creativity + coverage(c.text, e) + (used.has(lower(c.text)) ? -120 : 0) })).sort((a, b) => b.score - a.score || a.text.length - b.text.length);
  return ranked[0]?.text ?? faithful(e);
}
function directive(e: RealityEvent, kind: CognitiveBeatDirective["kind"]): CognitiveBeatDirective { return { kind, intent: "perform the strongest truthful change or meaningful detail supported by the event", subject: phrase(e), action: e.action ?? e.state ?? "", stateBefore: "", stateAfter: e.state ?? "", relationalFocus: [...e.participants, ...e.details, e.place, e.time].filter(Boolean) as string[], evidence: e.evidence, confidence: 1 }; }
function planFor(world: World): CognitiveExperiencePlan {
  const premise = premiseFor(world);
  return { direction: world.events.length > 1 ? "story" : "memory", centralSubject: world.participants[0] ?? world.entities[0] ?? "the experience", audience: [], whyInteract: ["experience the supplied reality rather than read a report"], emotionalIntent: [world.lens === "neutral" ? "memorable" : world.lens], purpose: "turn observed reality into a coherent experience", interactionModel: ["open or scan and play sequentially"], storyStructure: ["reality", "attention", "change", "consequence", "payoff"], memoryModel: ["preserve observed evidence", "connect new events to prior context", "leave room for continuation"], geographicModel: world.places, socialModel: world.participants, discoveryModel: ["repetition", "return", "relationships", "unusual details"], rewardModel: [], commerceModel: [], progressionModel: ["each new event can change what becomes meaningful next"], contentModel: world.entities, dynamicBehavior: ["resolve known memory before asking", "preserve identity independently of grammar", "adapt creative performance to context"], futureEvolution: ["new events can extend the same world", "accepted and rejected creative preferences can influence later performance"], creativePossibilities: ["contrast", "personification", "understatement", "escalation", "callback", "reveal", "earned payoff"], premise, realization: { direction: world.events.length > 1 ? "story" : "memory", directives: world.events.map((e, i) => directive(e, i === 0 ? "orientation" : i === world.events.length - 1 ? "payoff" : i === world.events.length - 2 ? "transformation" : "discovery")), semanticArc: world.events.map((e) => e.raw), conservedRoles: premise.slots.map((s) => s.role), confidence: 1 } as CognitiveExperienceRealization };
}
function meaningFor(world: World): ExperienceMeaning { const p = world.participants; const subject = p[0] ?? world.entities[0] ?? "the experience"; return { why: "Turn observed reality into an experience worth remembering and returning to.", relationship: p.length > 1 ? { subject: p[0]!, object: p[1]!, type: "shared_experience" } : undefined, emotions: [world.lens], memories: ["persistent", "continuation"], desiredFeeling: [world.lens === "neutral" ? "memorable" : world.lens], transformation: world.events.length > 1 ? "separate facts become a connected experience" : `a supplied reality becomes an experience about ${subject}` }; }
function titleFor(world: World): string { const s = world.participants.length > 1 ? world.participants.join(" + ") : world.participants[0] ?? world.entities[0] ?? "This Experience"; return world.places[0] ? `${s} at ${world.places[0]}` : `${s}: What Happened`; }
function makeMoment(e: RealityEvent, text: string, index: number, total: number, world: World): ExperienceMoment { const type: ExperienceMoment["type"] = index === 0 ? "introduction" : index === total - 1 ? "completion" : "story"; return { type, component: "story", title: index === 0 ? titleFor(world) : undefined, subtitle: index === 0 ? phrase(e) || undefined : undefined, text: `${sentence(text)}.`, description: `${sentence(text)}.`, editable: true, demo: false, order: index, payload: { source: "universal-mind", realityEventId: e.id, participants: e.participants, details: e.details, evidence: e.evidence.map((item) => item.detail), place: e.place, time: e.time }, meta: { source: "universal-mind", lens: world.lens, realityEventId: e.id, place: e.place, time: e.time, duration: index === total - 1 ? 5200 : 3600 } }; }
export function messageText(moment: ExperienceMoment): string { return moment.text ?? moment.description ?? moment.title ?? (typeof moment.meta?.text === "string" ? moment.meta.text : ""); }
export function compileCognitiveExperience(prompt: string, context: UniversalMindContext = {}): UniversalMindResult {
  const built = buildEvents(prompt, context); const lens = lensOf(prompt, context); const participants = unique([...built.events.flatMap((e) => e.participants), ...(context.event?.participants ?? [])]); const entities = deriveEntities(built.events);
  const world: World = { prompt, entities: unique([...entities.people, ...entities.places, ...entities.products]), participants, places: entities.places, times: entities.times, events: built.events, relations: built.events.flatMap((e) => e.participants.flatMap((p, i) => [ ...(e.place ? [{ from: p, relation: "experienced_at", to: e.place, evidenceId: e.id }] : []), ...(e.details.map((d) => ({ from: p, relation: "connected_to", to: d, evidenceId: e.id }))), ...e.participants.slice(i + 1).map((other) => ({ from: p, relation: "shared_event", to: other, evidenceId: e.id })) ])), lens, memoryMatches: built.memoryMatches };
  const plan = planFor(world); const used = new Set<string>(); const texts = world.events.map((e) => { const text = pick(e, world, used); used.add(lower(text)); return text; });
  const eventsForMoments = world.events.length ? world.events : [{ id: "event-1", raw: prompt, participants, details: [], order: 0, evidence: [evidence("prompt", prompt, "history", 1)] }];
  const moments = texts.length ? texts.map((text, i) => makeMoment(eventsForMoments[Math.min(i, eventsForMoments.length - 1)]!, text, i, texts.length, world)) : [makeMoment(eventsForMoments[0]!, sentence(prompt), 0, 1, world), makeMoment(eventsForMoments[0]!, "The moment stayed with its strongest detail", 1, 2, world)];
  const cinematicScenes: CinematicScene[] = moments.map((moment, i) => ({ id: `mind-scene-${i + 1}`, type: i === 0 ? "intro" : i === moments.length - 1 ? "emotion" : "action", duration: Number(moment.meta?.duration ?? 3600), moment, order: i, transition: i === 0 ? "none" : lens === "horror" ? (i % 2 ? "fade" : "flash") : lens === "romance" ? "cinematic" : lens === "wild" ? "zoom" : "fade", visual: lens === "horror" ? { theme: "dark", animation: "glitch" } : lens === "romance" ? { theme: "cinematic", animation: "slow_zoom" } : lens === "wild" ? { theme: "cinematic", animation: "particles" } : { theme: "cinematic", animation: i === 0 ? "slow_zoom" : "parallax" }, preload: i < moments.length - 1 }));
  const flowSteps: FlowStep[] = moments.map((moment, i) => ({ id: `mind-step-${i + 1}`, order: i, type: i === 0 ? "introduction" : i === moments.length - 1 ? "completion" : "story", payload: moment.payload }));
  const type = chooseType(prompt); const blueprint: ExperienceBlueprint = { title: titleFor(world), type, tone: tones(lens), meaning: meaningFor(world), moments, entities, cognitivePlan: plan, metadata: { archetypes: [type, lens, "universal_entity_experience"], themes: unique([...participants, ...world.places, ...world.times]).slice(0, 20), dna: ["reality-first", "memory-aware", "participant-preserving", "detail-preserving", "adaptive", "creative-hypothesis-search", "experience-moment-canonical"] } };
  const learningSignals = unique([...(context.feedback?.accepted ?? []).map((v) => `accepted:${v}`), ...(context.feedback?.rejected ?? []).map((v) => `rejected:${v}`), ...(context.creativePreferences ?? []).map((v) => `preference:${v}`)]);
  return { title: blueprint.title, blueprint, plan, flowSteps, moments, cinematicScenes, estimatedDuration: moments.reduce((sum, m) => sum + Number(m.meta?.duration ?? 3600), 0), momentCount: moments.length, world, adaptiveQuestions: built.adaptiveQuestions, discoveries: unique([...built.memoryMatches.map((m) => `This experience connects to ${m}.`), ...(RETURN_RE.test(prompt) && world.places[0] ? [`You returned to ${world.places[0]}.`] : []), ...(world.participants.length > 1 ? [`Shared experience between ${world.participants.join(" and ")}.`] : [])]), learningSignals };
}
