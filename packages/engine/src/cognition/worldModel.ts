import type { CognitiveEvidence, ExperienceEntities } from "@qre/contracts";

export type CognitiveLens = "neutral" | "comedy" | "horror" | "romance" | "wild" | "mysterious";
export type WorldKind = "entity" | "event" | "state" | "relationship" | "place" | "time" | "history" | "detail";
export type WorldEvidence = CognitiveEvidence & { id: string; kind: WorldKind; salience: number };
export type WorldRelation = { from: string; relation: string; to: string; evidenceId: string };
export type WorldEvent = {
  id: string; raw: string; participants: string[]; action?: string; state?: string; object?: string; place?: string; time?: string;
  details: string[]; order: number; evidence: WorldEvidence[]; resolvedFromMemory?: boolean;
};
export type WorldModel = {
  prompt: string; lens: CognitiveLens; entities: string[]; participants: string[]; places: string[]; times: string[];
  events: WorldEvent[]; relations: WorldRelation[]; evidence: WorldEvidence[]; memoryMatches: string[]; entitiesByKind: ExperienceEntities;
};

const ACTIONS = ["arrived","entered","walked","went","came","left","returned","found","cleaned","washed","groomed","repaired","fixed","restored","built","made","created","designed","wrote","cooked","served","prepared","opened","closed","visited","traveled","travelled","drove","rode","painted","danced","sang","played","chose","picked","selected","decided","touched","held","wore","tasted","smelled","looked","saw","watched","shared","gave","took","brought","received","checked","inspected","tested","installed","removed","changed","turned","transformed","finished","completed","celebrated","married","photographed","captured","recorded","taught","learned","discovered","collected","organized","decorated","styled","trimmed","cut","brushed","dried","massaged","relaxed","pampered","spoiled","treated","shook","chewed","stole","tore","ate","ran","called","rented","documented","started","stopped","hit","sat","stood","talked","met","stayed","slept","practiced","won","lost","broke","rescued","adopted","graduated","performed","settled","cried","laughed","loved","hated","feared","remembered","forgot","crossed","lasted","happened","surrendered","disappeared","appeared","continued","waited","lingered","kept","became","ended","got"] as const;
const ACTION_RE = new RegExp(`\\b(?:${ACTIONS.join("|")})\\b`, "i");
const STATE_RE = /\b(?:has been|have been|had been|was|were|is|are|am|remained|became|kept|seemed|felt|stayed|looked)\b/i;
const TIME_RE = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \w+ (?:minutes|hours|days|weeks|years)|for forty years|every [A-Za-z]+)\b/i;
const TEMPORAL_TAIL_RE = /\s+(?:at\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|two weeks ago|three years later|until closing|at sunrise|at sunset|for \w+ (?:minutes|hours|days|weeks|years)|for forty years|every [A-Za-z]+)\b.*$/i;
const SPATIAL_PREP_RE = /\b(?:at|in|inside|near|around|outside|on|onto|under|underneath|behind|beside|between|across|through|within|from|to|toward|towards)\b/i;
const RETURN_RE = /\b(?:back|again|returned|returning|same place|there|here)\b/i;
const STOPWORD_RE = /^(?:I|We|The|Then|At|And|My|Our|This|A|An|By|He|She|They|Guests|Everyone|Grandma|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday)$/i;
const PRONOUN_RE = /^(?:I|we|you|he|she|they|it|this|that|these|those|someone|something|everyone|guests)$/i;

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: unknown) => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly string[]) => [...new Set(values.map(sentence).filter(Boolean))];
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function semanticIndex(text: string, start = 0): number | undefined {
  const fragment = text.slice(start);
  const matches = [fragment.match(ACTION_RE), fragment.match(STATE_RE)].filter((m): m is RegExpMatchArray => Boolean(m));
  if (!matches.length) return undefined;
  const first = matches.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
  return first?.index === undefined ? undefined : start + first.index;
}

function splitIndependentClauses(input: string): string[] {
  const text = sentence(input); const out: string[] = []; let start = 0;
  for (const match of text.matchAll(/\b(?:then|but|while|after|before)\b/gi)) {
    if (match.index === undefined) continue;
    const right = text.slice(match.index + match[0].length).trim();
    if (semanticIndex(right) === undefined) continue;
    const left = sentence(text.slice(start, match.index)); if (left.length >= 5) out.push(left); start = match.index;
  }
  const tail = sentence(text.slice(start).replace(/^(?:then|but|while|after|before)\s+/i, "")); if (tail.length >= 5) out.push(tail);
  return out.length ? out : [text];
}

function splitCommaActionClauses(input: string): string[] {
  const text = sentence(input); const parts: string[] = []; let start = 0;
  for (const match of text.matchAll(/,\s+/g)) {
    if (match.index === undefined) continue;
    const right = text.slice(match.index + match[0].length).trim();
    if (semanticIndex(right) === undefined) continue;
    const left = sentence(text.slice(start, match.index));
    if (left.length >= 5) parts.push(left);
    start = match.index + match[0].length;
  }
  const tail = sentence(text.slice(start));
  if (tail.length >= 5) parts.push(tail);
  return parts.length > 1 ? parts : [text];
}

function splitCoordinatedActions(clause: string): string[] {
  const text = sentence(clause); const boundaries: Array<{ index: number; length: number }> = [];
  for (const match of text.matchAll(/\b(?:and|&)\b/gi)) {
    if (match.index === undefined) continue;
    const left = text.slice(0, match.index), right = text.slice(match.index + match[0].length);
    if (semanticIndex(left) !== undefined && semanticIndex(right) !== undefined) boundaries.push({ index: match.index, length: match[0].length });
  }
  if (!boundaries.length) return [text];
  const parts: string[] = []; let start = 0;
  for (const boundary of boundaries) { const piece = sentence(text.slice(start, boundary.index)); if (piece.length >= 5) parts.push(piece); start = boundary.index + boundary.length; }
  const tail = sentence(text.slice(start)); if (tail.length >= 5) parts.push(tail);
  return parts.length ? parts : [text];
}

function splitPrompt(prompt: string): string[] {
  const sentences = clean(prompt).split(/(?<=[.!?])\s+|\n+/).map(sentence).filter(Boolean);
  return unique(sentences.flatMap((value) => splitIndependentClauses(value).flatMap(splitCommaActionClauses).flatMap(splitCoordinatedActions)));
}

function properNames(text: string): string[] {
  return unique([...text.matchAll(/\b[A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*){0,4}\b/g)].map((m) => m[0]).filter((v) => !STOPWORD_RE.test(v)));
}
function participants(text: string, carry: string[]): string[] {
  const index = semanticIndex(text); if (index === undefined) return carry;
  const prefix = sentence(text.slice(0, index).replace(/^(?:then|but|and)\s+/i, ""));
  const pair = prefix.match(/^([A-Z][A-Za-z'’-]*)\s+(?:and|&)\s+([A-Z][A-Za-z'’-]*)$/);
  const names = pair ? unique([pair[1]!, pair[2]!]) : properNames(prefix);
  return names.filter((name) => !/^(?:The|A|An)\s+/i.test(name) && !PRONOUN_RE.test(name));
}
function timeOf(text: string) { return text.match(TIME_RE)?.[0]; }
function actionOf(text: string) { return text.match(ACTION_RE)?.[0]; }
function stateOf(text: string) { return text.match(STATE_RE)?.[0]; }

function normalizePlace(value: string): string {
  return sentence(value)
    .replace(/^(?:the|a|an|my|our|your|his|her|their|this|that)\s+/i, "")
    .replace(TEMPORAL_TAIL_RE, "")
    .trim();
}

function spatialPhraseOf(text: string): string | undefined {
  const prep = "at|in|inside|near|around|outside|on|onto|under|underneath|behind|beside|between|across|through|within|from|to|toward|towards";
  const stop = "at|in|on|from|to|near|around|outside|under|underneath|behind|beside|between|across|through|within|toward|towards";
  const pattern = new RegExp(`\\b(?:${prep})\\s+(?:(?:the|a|an|my|our|your|his|her|their|this|that)\\s+)?([A-Za-z0-9][A-Za-z0-9'’&.-]*(?:\\s+[A-Za-z0-9][A-Za-z0-9'’&.-]*){0,8}?)(?=\\s+(?:${stop})\\b|[,;.]|$)`, "gi");
  for (const match of text.matchAll(pattern)) {
    const value = normalizePlace(match[1] ?? "");
    if (!value || PRONOUN_RE.test(value) || TIME_RE.test(value)) continue;
    if (/^\d/.test(value)) continue;
    return value;
  }
  return undefined;
}
function subjectEntityOf(text: string, action?: string): string | undefined {
  if (!action) return undefined; const index = text.toLowerCase().indexOf(action.toLowerCase()); if (index <= 0) return undefined;
  const prefix = sentence(text.slice(0, index)).replace(/\b(?:finally|suddenly|just|already|still|now)\b/gi, " ").trim();
  if (!prefix || PRONOUN_RE.test(prefix)) return undefined; return prefix.length <= 100 ? prefix : undefined;
}
function objectOf(text: string, action?: string): string | undefined {
  if (!action) return undefined; const match = text.match(new RegExp(`\\b${escapeRegExp(action)}\\b(?:\\s+to)?\\s+(?:the|a|an|my|our|your|his|her|their|this|that)?\\s*([^,.;]+)`, "i"));
  if (!match?.[1]) return undefined;
  const value = sentence(match[1]).replace(/\b(?:and|or|but|while|after|before|until|where|then)\b.*$/i, "").trim();
  if (!value || value.length > 100 || PRONOUN_RE.test(value) || TIME_RE.test(value)) return undefined; return value;
}
function objectParts(value: string | undefined): string[] { return value ? value.split(/\s+(?:and|&|or)\s+/i).map(sentence).filter(Boolean) : []; }
function detailCandidates(text: string, participantsList: string[], place: string | undefined, time: string | undefined, action: string | undefined, object: string | undefined, subject: string | undefined): string[] {
  const known = [...participantsList, place ?? "", time ?? "", action ?? "", object ?? "", subject ?? ""].filter(Boolean).map(escapeRegExp);
  const residual = known.length ? text.replace(new RegExp(`\\b(?:${known.join("|")})\\b`, "gi"), " ") : text;
  return unique(residual.split(/\b(?:and|or|but|while|after|before|until|where|then)\b|,|;/i)).filter((chunk) => chunk.length >= 3 && !ACTION_RE.test(chunk) && !STATE_RE.test(chunk) && !TIME_RE.test(chunk)).slice(0, 8);
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
function evidence(id: string, detail: string, kind: WorldKind, salience: number, source: CognitiveEvidence["source"] = "prompt"): WorldEvidence { return { id, detail, kind, salience, source, confidence: 1 }; }

function eventFromChunk(raw: string, index: number, carryParticipants: string[], carryPlace: string | undefined, memoryMatches: string[], memorySources: string[]): WorldEvent {
  const eventParticipants = participants(raw, carryParticipants); const action = actionOf(raw); const state = stateOf(raw); const place = spatialPhraseOf(raw) ?? (RETURN_RE.test(raw) ? carryPlace : undefined); const time = timeOf(raw); const object = objectOf(raw, action); const objectList = objectParts(object); const subject = subjectEntityOf(raw, action);
  const details = unique([...objectList, ...(subject && !eventParticipants.some((p) => p.toLowerCase() === subject.toLowerCase()) && !SPATIAL_PREP_RE.test(subject) ? [subject] : []), ...detailCandidates(raw, eventParticipants, place, time, action, object, subject)]).filter((value) => !eventParticipants.some((p) => p.toLowerCase() === value.toLowerCase()));
  const source = memorySources[index] ? "memory" : "prompt"; const items: WorldEvidence[] = [evidence(`event-${index}-raw`, raw, action ? "event" : "history", action || state ? 0.95 : 0.8, source)];
  eventParticipants.forEach((value) => items.push(evidence(`event-${index}-p-${value}`, value, "entity", 1, source))); if (place) items.push(evidence(`event-${index}-place`, place, "place", 1, source)); if (time) items.push(evidence(`event-${index}-time`, time, "time", 1, source)); if (state) items.push(evidence(`event-${index}-state`, state, "state", 0.85, source)); if (action) items.push(evidence(`event-${index}-action`, action, "event", 0.95, source)); objectList.forEach((value) => items.push(evidence(`event-${index}-object-${value}`, value, "detail", 0.95, source))); if (subject && !eventParticipants.some((p) => p.toLowerCase() === subject.toLowerCase())) items.push(evidence(`event-${index}-subject`, subject, "entity", 0.9, source)); details.forEach((value) => { if (!items.some((item) => item.detail.toLowerCase() === value.toLowerCase())) items.push(evidence(`event-${index}-detail-${value}`, value, "detail", 0.8, source)); });
  return { id: `event-${index + 1}`, raw, participants: eventParticipants, action, state, object: objectList[0], place, time, details, order: index, evidence: items, resolvedFromMemory: Boolean(memoryMatches.length) };
}

export function buildWorldModel(prompt: string, options: { memoryMatches?: string[]; memorySources?: string[]; creativePreferences?: string[]; eventParticipants?: string[]; locationLabel?: string; eventVenue?: string } = {}): WorldModel {
  const chunks = splitPrompt(prompt); const events: WorldEvent[] = []; const allEvidence: WorldEvidence[] = []; let carryParticipants = unique(options.eventParticipants ?? []).filter((name) => !PRONOUN_RE.test(name)); let carryPlace = options.locationLabel ?? options.eventVenue;
  chunks.forEach((raw, index) => { const event = eventFromChunk(raw, index, carryParticipants, carryPlace, options.memoryMatches ?? [], options.memorySources ?? []); events.push(event); allEvidence.push(...event.evidence); if (event.participants.length) carryParticipants = event.participants; if (event.place) carryPlace = event.place; });
  const participantsList = unique(events.flatMap((event) => event.participants)); const places = unique(events.map((event) => event.place ?? "")); const times = unique(events.map((event) => event.time ?? ""));
  const objects = unique(events.flatMap((event) => [event.object ?? "", ...event.details])); const entities = unique([...participantsList, ...places, ...objects, ...events.map((event) => event.raw)]); const relations: WorldRelation[] = [];
  for (const event of events) {
    for (const participant of event.participants) {
      if (event.place) relations.push({ from: participant, relation: "experienced_at", to: event.place, evidenceId: `event-${event.order}-place` });
      if (event.object) relations.push({ from: participant, relation: "acted_on", to: event.object, evidenceId: `event-${event.order}-object-${event.object}` });
    }
    for (let i = 0; i < event.participants.length; i += 1) for (let j = i + 1; j < event.participants.length; j += 1) { const left = event.participants[i]!; const right = event.participants[j]!; relations.push({ from: left, relation: "shared_event", to: right, evidenceId: `event-${event.order}-raw` }); relations.push({ from: right, relation: "shared_event", to: left, evidenceId: `event-${event.order}-raw` }); }
  }
  const entitiesByKind: ExperienceEntities = { people: participantsList, places, organizations: [], dates: [], times, events: events.map((event) => event.raw), products: [], objects, collections: [], concepts: [], other: [], urls: [], phones: [], media: [], emails: [], keywords: [] };
  return { prompt, lens: lensOf(prompt, options.creativePreferences ?? []), entities, participants: participantsList, places, times, events, relations, evidence: allEvidence, memoryMatches: unique(options.memoryMatches ?? []), entitiesByKind };
}
