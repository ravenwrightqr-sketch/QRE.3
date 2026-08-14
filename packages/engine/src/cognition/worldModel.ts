import type { CognitiveEvidence, ExperienceEntities } from "@qre/contracts";

export type CognitiveLens = "neutral" | "comedy" | "horror" | "romance" | "wild" | "mysterious";
export type WorldKind = "entity" | "event" | "state" | "relationship" | "place" | "time" | "history" | "detail";

export type WorldEvidence = CognitiveEvidence & {
  id: string;
  kind: WorldKind;
  salience: number;
};

export type WorldRelation = {
  from: string;
  relation: string;
  to: string;
  evidenceId: string;
};

export type WorldEvent = {
  id: string;
  raw: string;
  participants: string[];
  action?: string;
  state?: string;
  object?: string;
  place?: string;
  time?: string;
  details: string[];
  order: number;
  evidence: WorldEvidence[];
  resolvedFromMemory?: boolean;
};

export type WorldModel = {
  prompt: string;
  lens: CognitiveLens;
  entities: string[];
  participants: string[];
  places: string[];
  times: string[];
  events: WorldEvent[];
  relations: WorldRelation[];
  evidence: WorldEvidence[];
  memoryMatches: string[];
  entitiesByKind: ExperienceEntities;
};

const ACTIONS = [
  "arrived","entered","walked","went","came","left","returned","found","cleaned","washed","groomed","repaired","fixed","restored","built","made","created","designed","wrote","cooked","served","prepared","opened","closed","visited","traveled","travelled","drove","rode","painted","danced","sang","played","chose","picked","selected","decided","touched","held","wore","tasted","smelled","looked","saw","watched","shared","gave","took","brought","received","checked","inspected","tested","installed","removed","changed","turned","transformed","finished","completed","celebrated","married","photographed","captured","recorded","taught","learned","discovered","collected","organized","decorated","styled","trimmed","cut","brushed","dried","massaged","relaxed","pampered","spoiled","treated","shook","chewed","stole","tore","ate","ran","called","rented","documented","started","stopped","hit","sat","stood","talked","met","stayed","slept","practiced","won","lost","broke","rescued","adopted","graduated","performed","settled","cried","laughed","loved","hated","feared","remembered","forgot","crossed","lasted","happened","surrendered","disappeared","appeared","continued","waited","lingered","kept","became"
] as const;

const ACTION_RE = new RegExp(`\\b(?:${ACTIONS.join("|")})\\b`, "i");
const STATE_RE = /\b(?:has been|have been|had been|was|were|is|are|am|remained|became|kept|seemed|felt|stayed|looked|seemed)\b/i;
const TIME_RE = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \w+ (?:minutes|hours|days|weeks|years)|for forty years|every [A-Za-z]+)\b/i;
const PLACE_WORDS = ["restaurant","bar","club","museum","theater","theatre","park","beach","hotel","house","home","kitchen","bathroom","bathrooms","living room","bedroom","garage","school","office","stadium","arena","shop","store","airport","station","road","street","city","town","warehouse","church","hall","studio","groomer","gym","spa","backyard","venue","pier","lake","mountain","forest","farm","garden","downtown","desert","convention","expo"];
const PLACE_RE = new RegExp(`\\b(?:${PLACE_WORDS.map((v) => v.replace(/ /g, "\\s+")).join("|")})\\b`, "i");
const PLACE_PHRASE_RE = new RegExp(`\\b(?:[A-Za-z][A-Za-z'’-]*\\s+){0,3}(?:${PLACE_WORDS.map((v) => v.replace(/ /g, "\\s+")).join("|")})\\b`, "i");
const RETURN_RE = /\b(?:back|again|returned|returning|same place|there)\b/i;

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown) => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly string[]) => [...new Set(values.map(sentence).filter(Boolean))];

function semanticIndex(text: string, start = 0): number | undefined {
  const fragment = text.slice(start);
  const matches = [fragment.match(ACTION_RE), fragment.match(STATE_RE)].filter((m): m is RegExpMatchArray => Boolean(m));
  if (!matches.length) return undefined;
  const first = matches.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
  return first?.index === undefined ? undefined : start + first.index;
}

function splitClauses(input: string): string[] {
  const text = sentence(input);
  const out: string[] = [];
  let start = 0;
  for (const match of text.matchAll(/\b(?:then|but|while|after|before)\b/gi)) {
    if (match.index === undefined) continue;
    const next = semanticIndex(text, match.index + match[0].length);
    if (next === undefined) continue;
    const piece = sentence(text.slice(start, match.index));
    if (piece.length >= 5) out.push(piece);
    start = match.index;
  }
  const tail = sentence(text.slice(start));
  if (tail.length >= 5) out.push(tail);
  return out.length ? out : [text];
}

function splitCoordinatedActions(clause: string): string[] {
  const text = sentence(clause);
  const boundaries: number[] = [];
  for (const match of text.matchAll(/\b(?:and|&|then|but)\b/gi)) {
    if (match.index === undefined) continue;
    const left = text.slice(0, match.index);
    const rightStart = match.index + match[0].length;
    const right = text.slice(rightStart);
    if (semanticIndex(left) !== undefined && semanticIndex(right) !== undefined) boundaries.push(match.index);
  }
  if (!boundaries.length) return [text];
  const parts: string[] = [];
  let start = 0;
  for (const boundary of boundaries) {
    const piece = sentence(text.slice(start, boundary));
    if (piece.length >= 5) parts.push(piece);
    start = boundary;
  }
  const tail = sentence(text.slice(start));
  if (tail.length >= 5) parts.push(tail);
  return parts.length ? parts.map((part) => sentence(part.replace(/^(?:and|&|then|but)\s+/i, ""))) : [text];
}

function splitPrompt(prompt: string): string[] {
  const sentences = clean(prompt).split(/\n+|(?<=[.!?])\s+/).map(sentence).filter(Boolean);
  const result: string[] = [];
  for (const value of sentences) {
    for (const clause of splitClauses(value)) {
      const parts = clause.split(/,\s+/).map(sentence).filter(Boolean);
      let current = "";
      for (const part of parts) {
        const semantic = semanticIndex(part);
        const currentSemantic = current ? semanticIndex(current) : undefined;
        if (current && semantic !== undefined && currentSemantic !== undefined) {
          result.push(current);
          current = part.replace(/^(?:and|&|then|but)\s+/i, "");
        } else {
          current = current ? `${current}, ${part}` : part;
        }
      }
      if (current) result.push(current);
      const coordinated = splitCoordinatedActions(result.splice(result.length - (parts.length ? 1 : 0))[0] ?? "");
      if (coordinated.length > 1) result.push(...coordinated);
    }
  }
  return unique(result);
}

function properNames(text: string): string[] {
  const stop = /^(?:I|We|The|Then|At|And|My|Our|This|A|An|By|He|She|They|Guests|Everyone|Grandma|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday)$/i;
  return unique([...text.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*)?\b/g)].map((m) => m[0]).filter((v) => !stop.test(v)));
}

function participants(text: string, carry: string[]): string[] {
  const index = semanticIndex(text);
  if (index === undefined) return carry;
  const prefix = sentence(text.slice(0, index).replace(/^(?:then|but|and)\s+/i, ""));
  const names = properNames(prefix);
  const pair = prefix.match(/^([A-Z][A-Za-z'’-]*)\s+(?:and|&)\s+([A-Z][A-Za-z'’-]*)$/);
  return pair ? unique([pair[1]!, pair[2]!]) : names.length ? names : carry;
}

function placeOf(text: string): string | undefined {
  // Preserve the smallest useful noun phrase around the universal place token.
  // This handles "living room finally surrendered" and "Riverside Theater"
  // without encoding any domain-specific location grammar.
  const phrase = text.match(PLACE_PHRASE_RE)?.[0];
  if (phrase) {
    const cleaned = sentence(phrase).replace(/^(?:the|a|an)\s+/i, "");
    const actionIndex = semanticIndex(cleaned);
    return sentence(actionIndex === undefined ? cleaned : cleaned.slice(0, actionIndex));
  }
  return text.match(PLACE_RE)?.[0];
}

function timeOf(text: string) { return text.match(TIME_RE)?.[0]; }
function actionOf(text: string) { return text.match(ACTION_RE)?.[0]; }
function stateOf(text: string) { return text.match(STATE_RE)?.[0]; }

function objectOf(text: string, action?: string, place?: string): string | undefined {
  if (!action) return undefined;
  const escaped = action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`\\b${escaped}\\b(?:\\s+to)?\\s+(?:the|a|an|my|our|his|her|their|this|that)?\\s*([^,.;]+)`, "i"));
  if (!match?.[1]) return undefined;
  const value = sentence(match[1]).replace(/\b(?:and|or|but|while|after|before|until|where)\b.*$/i, "").trim();
  if (!value || value.length > 80) return undefined;
  if (place && value.toLowerCase() === place.toLowerCase()) return undefined;
  if (TIME_RE.test(value)) return undefined;
  return value;
}

function concreteDetails(text: string, participantsList: string[], place?: string, time?: string, object?: string): string[] {
  const withoutKnown = sentence(text)
    .replace(new RegExp(`\\b(?:${participantsList.map((x) => x.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|")})\\b`, "gi"), " ")
    .replace(place ? new RegExp(place.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "gi") : /$^/, " ")
    .replace(time ? new RegExp(time.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "gi") : /$^/, " ")
    .replace(object ? new RegExp(object.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "gi") : /$^/, " ");
  const chunks = unique(withoutKnown.split(/\b(?:and|or|but|while|after|before|until|where)\b|,|;/i));
  return chunks.filter((chunk) => chunk.length >= 3 && !ACTION_RE.test(chunk) && !STATE_RE.test(chunk) && !PLACE_RE.test(chunk) && !TIME_RE.test(chunk)).slice(0, 6);
}

function lensOf(prompt: string, preferences: string[]): CognitiveLens {
  const corpus = `${prompt} ${preferences.join(" ")}`.toLowerCase();
  if (/\b(horror|scary|haunted|creepy|sinister|demented|terrifying)\b/.test(corpus)) return "horror";
  if (/\b(comedy|funny|humor|playful|absurd|ridiculous|witty|hilarious)\b/.test(corpus)) return "comedy";
  if (/\b(romance|romantic|intimate|tender|first date|love)\b/.test(corpus)) return "romance";
  if (/\b(wild|chaotic|unhinged)\b/.test(corpus)) return "wild";
  if (/\b(mystery|mysterious|strange|surreal)\b/.test(corpus)) return "mysterious";
  return "neutral";
}

function evidence(id: string, detail: string, kind: WorldKind, salience: number, source: CognitiveEvidence["source"] = "prompt"): WorldEvidence {
  return { id, detail, kind, salience, source, confidence: 1 };
}

export function buildWorldModel(prompt: string, options: { memoryMatches?: string[]; memorySources?: string[]; creativePreferences?: string[]; eventParticipants?: string[]; locationLabel?: string; eventVenue?: string } = {}): WorldModel {
  const chunks = splitPrompt(prompt);
  const events: WorldEvent[] = [];
  const allEvidence: WorldEvidence[] = [];
  let carryParticipants = unique(options.eventParticipants ?? []);
  let carryPlace = options.locationLabel ?? options.eventVenue;

  chunks.forEach((raw, index) => {
    const eventParticipants = participants(raw, carryParticipants);
    const action = actionOf(raw);
    const state = stateOf(raw);
    const place = placeOf(raw) ?? (RETURN_RE.test(raw) ? carryPlace : undefined);
    const time = timeOf(raw);
    const object = objectOf(raw, action, place);
    const detailList = concreteDetails(raw, eventParticipants, place, time, object);
    if (eventParticipants.length) carryParticipants = eventParticipants;
    if (place) carryPlace = place;
    const items: WorldEvidence[] = [evidence(`event-${index}-raw`, raw, action ? "event" : "history", action || state ? 0.95 : 0.8, options.memorySources?.[index] ? "memory" : "prompt")];
    eventParticipants.forEach((value) => items.push(evidence(`event-${index}-p-${value}`, value, "entity", 1)));
    if (place) items.push(evidence(`event-${index}-place`, place, "place", 1));
    if (time) items.push(evidence(`event-${index}-time`, time, "time", 1));
    if (state) items.push(evidence(`event-${index}-state`, state, "state", 0.85));
    if (object) items.push(evidence(`event-${index}-object`, object, "detail", 0.95));
    detailList.forEach((value) => items.push(evidence(`event-${index}-detail-${value}`, value, "detail", 0.9)));
    const event: WorldEvent = { id: `event-${index + 1}`, raw, participants: eventParticipants, action, state, object, place, time, details: detailList, order: index, evidence: items, resolvedFromMemory: Boolean(options.memoryMatches?.length) };
    events.push(event);
    allEvidence.push(...items);
  });

  const participantsList = unique(events.flatMap((event) => event.participants));
  const places = unique(events.map((event) => event.place ?? ""));
  const times = unique(events.map((event) => event.time ?? ""));
  const objects = unique(events.flatMap((event) => [event.object ?? "", ...event.details]));
  const entities = unique([...participantsList, ...places, ...objects, ...events.map((event) => event.raw)]);
  const relations: WorldRelation[] = [];
  for (const event of events) {
    for (const participant of event.participants) {
      if (event.place) relations.push({ from: participant, relation: "experienced_at", to: event.place, evidenceId: `event-${event.order}-place` });
      if (event.object) relations.push({ from: participant, relation: "acted_on", to: event.object, evidenceId: `event-${event.order}-object` });
    }
    for (let i = 0; i < event.participants.length; i += 1) {
      for (let j = i + 1; j < event.participants.length; j += 1) {
        const left = event.participants[i]!;
        const right = event.participants[j]!;
        relations.push({ from: left, relation: "shared_event", to: right, evidenceId: `event-${event.order}-raw` });
        relations.push({ from: right, relation: "shared_event", to: left, evidenceId: `event-${event.order}-raw` });
      }
    }
  }

  const entitiesByKind: ExperienceEntities = {
    people: participantsList,
    places,
    objects,
    events: events.map((event) => event.raw),
    media: [],
    collections: [],
    organizations: [],
    concepts: [],
    other: [],
  };

  return {
    prompt,
    lens: lensOf(prompt, options.creativePreferences ?? []),
    entities,
    participants: participantsList,
    places,
    times,
    events,
    relations,
    evidence: allEvidence,
    memoryMatches: unique(options.memoryMatches ?? []),
    entitiesByKind,
  };
}
