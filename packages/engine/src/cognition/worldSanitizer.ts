import type { WorldEvent, WorldModel, CognitiveLens } from "./worldModel.js";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const sentence = (value: string) => clean(value).replace(/^[,;:.!?]+|[,;:.!?]+$/g, "").trim();
const unique = (values: readonly string[]) => [...new Set(values.map(sentence).filter(Boolean))];
const GENERIC_ACTOR_RE = /^(?:i|we|you|he|she|they|it|this|that|someone|something|everyone|nobody|somebody|guests|people|ten|one|two|three|four|five|six|seven|eight|nine|zero)$/i;
const NON_PLACE_RE = /^(?:nervous|anxious|afraid|scared|fabulous|ordinary|quiet|loud|spotless|beautiful|ugly|tender|strange|weird|normal|empty|full|old|young|small|large|tiny|big|ready|late|early|alive|dead|missing|gone|there|here|back|again)$/i;
const STYLE_DIRECTIVE_RE = /^(?:(?:make|write|tell)\s+(?:it|this|that|the story|the experience)\b|show\s+(?:it|this|that)\b)/i;
const STYLE_WORD_RE = /\b(?:funny|comedy|humorous|hilarious|romantic|romance|horror|scary|creepy|mysterious|mystery|cinematic|tender|sweet|dramatic|wild|chaotic|playful|serious)\b/i;
const TIME_ONLY_RE = /^(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this morning|this afternoon|this evening|last night|\w+ years? later)$/i;
const TIME_FRAGMENT_RE = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow)\b/i;
const FRAGMENT_RE = /^(?:in|at|on|to|from|with|by|and|but|then|before|after|until|re)\s+/i;
const ARTICLE_PLACE_RE = /^(?:the|a|an)\s+/i;
const KNOWN_COMMON_ENTITY_RE = /^(?:dog|cat|puppy|kitten|family|couple|realtor|agent|chef|owner|homeowner|client|bride|groom|baby|dad|mom|father|mother|grandma|grandpa|crowd|team|group|concert|restaurant|salon|groomer|hotel|house|home|garage|porch|pier|beach|theater|kitchen|bathroom|living room|parking lot|camera|suitcase|ticket|guitar|chair|cake|ring|photo|photograph|bow|flower)$/i;
const MALFORMED_DETAIL_RE = /^(?:t|the)\s+.*\b(?:at|in|on)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i;
const NON_EVENT_STATE_RE = /^(?:am|pm)$/i;

function isHumanLike(value: string): boolean {
  const v = sentence(value).replace(/^the\s+/i, "");
  if (!v || GENERIC_ACTOR_RE.test(v) || TIME_ONLY_RE.test(v)) return false;
  if (ARTICLE_PLACE_RE.test(value)) return KNOWN_COMMON_ENTITY_RE.test(v);
  return /^[A-Z][A-Za-z'’\-]*(?:\s+[A-Z][A-Za-z'’\-]*)?$/.test(v) || KNOWN_COMMON_ENTITY_RE.test(v);
}

function inferLens(prompt: string, current: CognitiveLens): CognitiveLens {
  const corpus = prompt.toLowerCase();
  if (current !== "neutral") return current;
  if (/\b(horror|scary|haunted|creepy|sinister|terrifying|old photograph|lights flickered|uninvited|nobody remembered inviting|whisper|shadow)\b/.test(corpus)) return "horror";
  if (/\b(mystery|mysterious|strange|surreal|unknown|unexplained|nobody remembered|didn't know where)\b/.test(corpus)) return "mysterious";
  if (/\b(comedy|funny|humor|playful|absurd|ridiculous|witty|hilarious)\b/.test(corpus)) return "comedy";
  if (/\b(romance|romantic|intimate|tender|first date|love|baby arrived|years later|anniversary)\b/.test(corpus)) return "romance";
  if (/\b(wild|chaotic|unhinged|crowd stayed|road emptied|party|festival|concert)\b/.test(corpus)) return "wild";
  return current;
}

function cleanEventRaw(raw: string): string { return sentence(raw.replace(/^(?:then|and|but)\s+/i, "")); }
function isStyleDirective(raw: string): boolean {
  const value = sentence(raw);
  return STYLE_DIRECTIVE_RE.test(value) && value.split(/\s+/).length <= 9 && STYLE_WORD_RE.test(value);
}
function isLikelyFragment(raw: string): boolean {
  const value = cleanEventRaw(raw);
  if (!value || value.length < 3) return true;
  if (FRAGMENT_RE.test(value)) return true;
  if (/^(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+minutes?$/i.test(value)) return true;
  return false;
}

function previousActor(events: WorldEvent[], index: number): string | undefined {
  for (let i = index - 1; i >= 0; i -= 1) {
    const actor = events[i]?.participants.find((value) => isHumanLike(value));
    if (actor) return actor;
  }
  return undefined;
}

function repairParticipant(event: WorldEvent, fallback?: string): WorldEvent {
  const participants = unique(event.participants).filter(isHumanLike);
  const raw = cleanEventRaw(event.raw);
  const shouldCarry = !participants.length && fallback && /^(?:got|stole|left|walked|went|came|returned|found|played|sang|laughed|watched|stayed|finished|cleaned|opened|closed|arrived|entered|danced|ran|sat|stood|waited|lingered|kept|looked|loved|hated|ended|finished)\b/i.test(raw);
  const state = NON_EVENT_STATE_RE.test(sentence(event.state ?? "")) ? undefined : event.state;
  return { ...event, raw, state, participants: shouldCarry ? [fallback] : participants };
}

function repairStandalonePlace(event: WorldEvent, previous: WorldEvent | undefined): WorldEvent {
  if (event.place || event.participants.length || event.action || event.state || event.time) return event;
  const raw = cleanEventRaw(event.raw);
  if (previous && /\b(?:again|there|back|returned|went|visited|came)\b/i.test(previous.raw) && /^[A-Z][A-Za-z'’\-]{2,40}(?:\s+[A-Z][A-Za-z'’\-]{2,40})?$/.test(raw)) {
    return { ...event, place: raw, details: unique([...event.details, raw]) };
  }
  return event;
}

function absorbFragment(events: WorldEvent[]): WorldEvent[] {
  const out: WorldEvent[] = [];
  for (const original of events) {
    const raw = cleanEventRaw(original.raw);
    if (isStyleDirective(raw)) continue;
    if (isLikelyFragment(raw) && out.length) {
      const previous = out[out.length - 1]!;
      if (!previous.details.some((detail) => detail.toLowerCase() === raw.toLowerCase())) {
        out[out.length - 1] = { ...previous, details: unique([...previous.details, raw]), evidence: [...previous.evidence] };
      }
      continue;
    }
    out.push(original);
  }
  return out;
}

function repairFragments(events: WorldEvent[]): WorldEvent[] {
  let working = events.map((original, index) => repairStandalonePlace(repairParticipant(original, previousActor(events, index)), events[index - 1]));
  working = absorbFragment(working);
  let carry: string | undefined;
  return working.map((original) => {
    let event = original;
    if (!event.participants.length && carry && /^(?:got|stole|left|walked|went|came|returned|found|played|sang|laughed|watched|stayed|finished|cleaned|opened|closed|arrived|entered|danced|ran|sat|stood|waited|lingered|kept|looked|loved|hated|ended)\b/i.test(event.raw)) event = { ...event, participants: [carry] };
    if (event.participants[0] && isHumanLike(event.participants[0])) carry = event.participants[0];
    const details = unique(event.details)
      .filter((detail) => !NON_PLACE_RE.test(detail))
      .filter((detail) => !GENERIC_ACTOR_RE.test(detail))
      .filter((detail) => !isStyleDirective(detail))
      .filter((detail) => !TIME_ONLY_RE.test(detail))
      .filter((detail) => !TIME_FRAGMENT_RE.test(detail))
      .filter((detail) => !MALFORMED_DETAIL_RE.test(detail))
      .filter((detail) => !FRAGMENT_RE.test(detail))
      .filter((detail) => !/^\s*(?:re|the|and|or|before|after|then)\s*$/i.test(detail));
    return { ...event, details };
  }).filter((event) => !isStyleDirective(event.raw) && event.raw.length >= 5);
}

function repairPlaces(events: WorldEvent[]): WorldEvent[] {
  return events.map((event) => {
    const place = event.place ? sentence(event.place).replace(/^(?:the|a|an)\s+/i, "") : undefined;
    if (!place || NON_PLACE_RE.test(place) || TIME_ONLY_RE.test(place) || GENERIC_ACTOR_RE.test(place)) return { ...event, place: undefined };
    return { ...event, place };
  });
}

export function sanitizeWorldModel(world: WorldModel): WorldModel {
  const events = repairPlaces(repairFragments(world.events)).map((event, index) => ({ ...event, order: index }));
  const participants = unique(events.flatMap((event) => event.participants)).filter(isHumanLike);
  const places = unique(events.map((event) => event.place ?? "")).filter((place) => !NON_PLACE_RE.test(place) && !GENERIC_ACTOR_RE.test(place) && !TIME_ONLY_RE.test(place));
  const times = unique(events.map((event) => event.time ?? "")).filter(Boolean);
  const evidence = events.flatMap((event) => event.evidence).filter((item) => {
    if (item.kind === "time" && NON_EVENT_STATE_RE.test(item.detail)) return false;
    if (item.kind === "place" && (NON_PLACE_RE.test(item.detail) || GENERIC_ACTOR_RE.test(item.detail))) return false;
    if (item.kind === "entity" && !isHumanLike(item.detail) && !places.some((place) => place.toLowerCase() === item.detail.toLowerCase())) return false;
    return true;
  });
  const entities = unique([...participants, ...places, ...events.flatMap((event) => [event.object ?? "", ...event.details])]);
  return {
    ...world,
    lens: inferLens(world.prompt, world.lens),
    events,
    participants,
    places,
    times,
    evidence,
    entities,
    entitiesByKind: {
      ...world.entitiesByKind,
      people: participants,
      places,
      dates: [],
      times,
      events: events.map((event) => event.raw),
      objects: unique(events.flatMap((event) => [event.object ?? "", ...event.details])),
      other: [],
    },
    relations: world.relations.filter((relation) => participants.includes(relation.from) || participants.includes(relation.to) || places.includes(relation.to)),
  };
}
