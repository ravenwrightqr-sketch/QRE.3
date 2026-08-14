/**
 * QRE UNIVERSAL EXPERIENCE ENGINE — CANONICAL
 *
 * One reasoning system for every prompt. Domain words are evidence, never
 * control flow. There are no groomer/nightlife/tattoo/holiday branches here.
 *
 * prompt -> evidence -> events -> relations -> change -> consequence -> prose
 */
import type {
  UniversalEvidence,
  UniversalEvidenceKind,
  UniversalEvent,
  UniversalExperienceModel,
  UniversalExperienceResult,
  UniversalRelation,
} from "@qre/contracts";

const clean = (v: string): string => v.replace(/\s+/g, " ").trim();
const lower = (v: string): string => clean(v).toLowerCase();
const stripSentence = (v: string): string => clean(v).replace(/[.!?]+$/, "");
const unique = (v: readonly string[]): string[] => [...new Set(v.map(clean).filter(Boolean))];
const cap = (v: string): string => { const s = stripSentence(v); return s ? s[0]!.toUpperCase() + s.slice(1) : ""; };

const INTERNAL = /\b(?:compiler|cognitive|cognition|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|interaction model|progression model|dynamic behavior|future evolution|mechanic|mechanics|trajectory|latent state|internal state)\b/i;
const REQUEST = /^(?:please\s+)?(?:make|create|build|write|generate|produce|design|turn|transform|give|tell|show|teach)\b/i;

const VERBS = new Set([
  "add","added","arrive","arrived","become","became","begin","began","bring","brought","build","built",
  "call","called","capture","captured","carry","carried","change","changed","check","checked","choose","chose",
  "clean","cleaned","close","closed","collect","collected","come","came","complete","completed","cook","cooked",
  "create","created","cut","cutting","decide","decided","deliver","delivered","discover","discovered","do","did",
  "draw","drew","drive","drove","eat","ate","enjoy","enjoyed","enter","entered","escape","escaped","feel","felt",
  "find","found","finish","finished","fix","fixed","follow","followed","get","got","give","gave","go","went",
  "grab","grabbed","grow","grew","handle","handled","hear","heard","hold","held","install","installed","invite","invited",
  "keep","kept","leave","left","like","liked","live","lived","look","looked","love","loved","make","made",
  "meet","met","move","moved","notice","noticed","open","opened","order","ordered","paint","painted","pick","picked",
  "play","played","prepare","prepared","receive","received","record","recorded","remember","remembered","remove","removed",
  "repair","repaired","return","returned","run","ran","save","saved","see","saw","send","sent","serve","served",
  "share","shared","shake","shook","show","showed","sing","sang","sit","sat","smell","smelled","spoil","spoiled",
  "start","started","stay","stayed","steal","stole","take","took","taste","tasted","teach","taught","touch","touched",
  "travel","traveled","travelled","trim","trimmed","try","tried","turn","turned","use","used","visit","visited",
  "walk","walked","wash","washed","watch","watched","wear","wore",
]);
const STATES = new Set([
  "afraid","angry","anxious","awkward","bad","better","broken","calm","comfortable","confused","curious","delighted",
  "different","dirty","excited","familiar","fine","frightened","good","great","happy","hopeful","impatient","interested",
  "joyful","lost","mad","nervous","okay","peaceful","ready","relaxed","sad","scared","secure","suspicious","terrified",
  "thrilled","tired","uncomfortable","uncertain","upset","worried","wrong",
]);
const NEGATIVE = new Set(["afraid","angry","anxious","awkward","bad","broken","confused","dirty","frightened","lost","mad","nervous","sad","scared","suspicious","terrified","tired","uncomfortable","uncertain","upset","worried","wrong"]);
const POSITIVE = new Set(["better","calm","comfortable","delighted","excited","familiar","fine","good","great","happy","hopeful","interested","joyful","okay","peaceful","ready","relaxed","secure","thrilled"]);
const CONSEQUENTIAL = new Set(["add","added","change","changed","complete","completed","discover","discovered","find","found","fix","fixed","finish","finished","give","gave","grab","grabbed","remove","removed","repair","repaired","steal","stole","take","took","turn","turned"]);
const STOP = new Set(["a","an","and","are","as","at","be","been","but","by","can","do","for","from","had","has","have","he","her","here","his","i","if","in","into","is","it","its","just","me","my","of","on","or","our","she","so","some","than","that","the","their","them","then","there","they","this","to","was","we","were","what","when","where","which","who","with","would","you","your","will","should","could","more","very","really"]);
const INTENT = new Set(["experience","story","memory","something","anything","thing","things","moment","moments"]);

function tokens(text: string): string[] { return clean(text).split(/[^A-Za-z0-9'’.-]+/).filter(Boolean); }
function norm(v: string): string { return lower(v).replace(/[^a-z0-9'’-]/g, ""); }
function isVerb(v: string): boolean { return VERBS.has(norm(v)); }
function isState(v: string): boolean { return STATES.has(norm(v)); }
function statesIn(text: string): string[] { return unique(tokens(text).map(norm).filter(isState)); }
function actionAt(text: string): { token?: string; index: number } {
  const list = tokens(text); const index = list.findIndex(isVerb); return { token: index >= 0 ? list[index] : undefined, index };
}
function stripRequest(text: string): string {
  return REQUEST.test(text) ? stripSentence(text.replace(REQUEST, "").replace(/^\s*(?:a|an|the)\s+/i, "")) : stripSentence(text);
}

function splitPrompt(prompt: string): string[] {
  const base = prompt.replace(/[\r\n]+/g, " ").split(/(?<=[.!?])\s+|\s*;\s*/).map(stripSentence).filter(Boolean);
  const result: string[] = [];
  const connector = /\s+(?:and then|then|after that|afterwards|but then)\s+/i;
  for (const sentencePart of base) {
    for (const part of sentencePart.split(connector).map(stripSentence).filter(Boolean)) {
      const clauses = part.split(/,\s+(?=(?:and\s+)?(?:[A-Z][A-Za-z'’-]*|I|he|she|they|we|the|a|an)\s+[A-Za-z'’-]+\b)/);
      result.push(...clauses.map(stripSentence).filter(Boolean));
    }
  }
  return unique(result);
}

function explicitNames(text: string): string[] {
  return unique([...text.matchAll(/\b[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,2}\b/g)].map((m) => m[0] ?? "").filter((x) => !/^(?:Create|Make|Build|Write|Generate|Produce|Design|Turn|Transform|Give|Tell|Show|Teach|Please|The|Then|And|By)$/i.test(x)));
}

function detectSubject(prompt: string, clauses: string[]): string {
  const named = explicitNames(prompt)[0];
  if (named) return named;
  if (REQUEST.test(prompt)) {
    const match = prompt.match(/^(?:please\s+)?(?:make|create|build|write|generate|produce|design|turn|transform|give|tell|show|teach)\s+(?:a|an|the|my|our|this|that)?\s*([^,.!?;]+?)(?:\s+(?:for|about|in|at|with|where|that|which|who)\b|$)/i);
    const target = clean(match?.[1] ?? "");
    if (target && !INTENT.has(norm(target))) return target;
  }
  const first = stripRequest(clauses[0] ?? prompt);
  const actor = clean(first.match(/^(?:a|an|the|my|our|this|that)\s+([^,.!?;]+?)\s+(?=[A-Za-z'’-]+\b)/i)?.[1] ?? "");
  if (actor && actor.length <= 80 && !actor.split(/\s+/).some(isVerb)) return actor.toLowerCase();
  const list = tokens(first); const verbIndex = list.findIndex(isVerb);
  const candidate = list.slice(0, verbIndex >= 0 ? verbIndex : list.length).map(norm).find((x) => x.length > 2 && !STOP.has(x) && !INTENT.has(x));
  return candidate || "the subject";
}

function detectActor(text: string, fallback: string): string {
  const list = tokens(stripRequest(text)); const verbIndex = list.findIndex(isVerb);
  if (verbIndex <= 0) return fallback;
  const candidate = clean(list.slice(0, verbIndex).join(" ").replace(/^(?:then|after that|afterwards|and)\s+/i, ""));
  if (!candidate || candidate.split(/\s+/).length > 5 || /^(?:there|this|that|it)$/i.test(candidate)) return fallback;
  return candidate;
}

function extractPlace(text: string): string | undefined {
  const value = clean(text.match(/\b(?:at|in|inside|near|around|from|to|on)\s+((?:the|a|an|my|our)?\s*[A-Za-z0-9'’.-]+(?:\s+[A-Za-z0-9'’.-]+){0,4})(?=\s+(?:and|then|before|after|while|when)\b|[,.!?;]|$)/i)?.[1] ?? "");
  if (!value || /^(?:the|a|an)\s+(?:day|night|morning|afternoon|time|moment)$/i.test(value)) return undefined;
  return value;
}
function extractDate(text: string): string | undefined {
  const patterns = [
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{2,4})?\b/i,
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/,
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
    /\b(?:today|yesterday|tomorrow|tonight)\b/i,
  ];
  return patterns.map((pattern) => text.match(pattern)?.[0]).find(Boolean);
}
function extractTime(text: string): string | undefined {
  return clean(text.match(/\b(?:at\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|noon|midnight|morning|afternoon|evening|night)\b/i)?.[0] ?? "") || undefined;
}
function objectPhrase(text: string, actionIndex: number): string | undefined {
  const rest = tokens(stripRequest(text)).slice(actionIndex + 1); const kept: string[] = [];
  for (const token of rest) {
    const word = norm(token);
    if (/^(?:because|while|after|before|when|which|that|where|and|but|like|as)$/i.test(word)) break;
    if (isState(word)) break;
    if (/^(?:at|in|inside|near|around|from|to|on)$/i.test(word) && kept.length) break;
    kept.push(token); if (kept.length >= 6) break;
  }
  const value = clean(kept.join(" ").replace(/^[,.:;-]+|[,.:;-]+$/g, "")); return value || undefined;
}
function detailsFor(text: string, subject: string, actor: string, action: string | undefined, object: string | undefined, states: string[]): string[] {
  const blocked = new Set([...tokens(subject).map(norm), ...tokens(actor).map(norm), action ? norm(action) : "", ...states]);
  const atoms = tokens(stripRequest(text)).map(norm).filter((word) => word.length > 2 && !STOP.has(word) && !blocked.has(word) && !isVerb(word) && !isState(word));
  return unique([object ?? "", ...atoms]).slice(0, 10);
}

function buildEvent(raw: string, subject: string, order: number): UniversalEvent {
  const sourceText = stripRequest(raw); const actionInfo = actionAt(sourceText); const states = statesIn(sourceText);
  const actor = detectActor(sourceText, subject); const object = actionInfo.index >= 0 ? objectPhrase(sourceText, actionInfo.index) : undefined;
  const place = extractPlace(sourceText); const date = extractDate(sourceText); const time = extractTime(sourceText);
  const details = detailsFor(sourceText, subject, actor, actionInfo.token, object, states);
  const consequential = actionInfo.token ? CONSEQUENTIAL.has(norm(actionInfo.token)) : false;
  return {
    id: `universal-event-${order + 1}`,
    order,
    sourceText,
    actor,
    action: actionInfo.token,
    object,
    states,
    details,
    place,
    date,
    time,
    evidenceIds: [],
    importance: Math.min(1, 0.25 + details.length * 0.06 + states.length * 0.2 + (consequential ? 0.25 : 0) + (place ? 0.08 : 0) + (date || time ? 0.08 : 0)),
  };
}

function addEvidence(evidence: UniversalEvidence[], kind: UniversalEvidenceKind, text: string, sourceText: string, order: number): string | undefined {
  const value = clean(text); if (!value || INTERNAL.test(value)) return undefined;
  const id = `universal-${kind}-${order + 1}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  if (!evidence.some((item) => item.id === id)) evidence.push({ id, kind, text: value, sourceText, order, confidence: 0.99 });
  return id;
}
function buildEvidence(events: UniversalEvent[], subject: string): UniversalEvidence[] {
  const evidence: UniversalEvidence[] = []; const subjectId = addEvidence(evidence, "subject", subject, subject, 0); if (subjectId) evidence[0]!.id = "universal-subject";
  for (const event of events) {
    const ids: string[] = [];
    for (const [kind, value] of [["action",event.action],["object",event.object],["place",event.place],["date",event.date],["time",event.time]] as const) {
      const id = addEvidence(evidence, kind, value ?? "", event.sourceText, event.order); if (id) ids.push(id);
    }
    for (const state of event.states) { const id = addEvidence(evidence, "state", state, event.sourceText, event.order); if (id) ids.push(id); }
    for (const detail of event.details) { const id = addEvidence(evidence, "detail", detail, event.sourceText, event.order); if (id) ids.push(id); }
    event.evidenceIds = unique(ids);
  }
  return evidence;
}

function buildRelations(events: UniversalEvent[]): UniversalRelation[] {
  const relations: UniversalRelation[] = [];
  for (let index = 1; index < events.length; index += 1) {
    const previous = events[index - 1]!; const current = events[index]!;
    relations.push({ fromEventId: previous.id, toEventId: current.id, kind: "sequence", strength: 0.72, reason: "observed event order" });
    const before = previous.states.at(-1); const after = current.states.at(-1);
    if (before && after && before !== after) relations.push({ fromEventId: previous.id, toEventId: current.id, kind: "state_change", strength: 0.94, reason: "observed state transition" });
    if (current.action && CONSEQUENTIAL.has(norm(current.action))) relations.push({ fromEventId: previous.id, toEventId: current.id, kind: "consequence", strength: Math.min(0.98, 0.62 + current.importance * 0.34), reason: "distinctive action follows the prior event" });
    if (previous.place && current.place && lower(previous.place) !== lower(current.place)) relations.push({ fromEventId: previous.id, toEventId: current.id, kind: "sequence", strength: 0.84, reason: "observed place transition" });
  }
  return relations;
}
function buildChange(events: UniversalEvent[], relations: UniversalRelation[]): UniversalExperienceModel["change"] {
  const transition = relations.find((relation) => relation.kind === "state_change");
  if (transition) {
    const before = events.find((event) => event.id === transition.fromEventId)?.states.at(-1); const after = events.find((event) => event.id === transition.toEventId)?.states.at(-1);
    return { before, after, triggerEventId: transition.toEventId, confidence: transition.strength };
  }
  const negative = events.find((event) => event.states.some((state) => NEGATIVE.has(norm(state)))); const positive = [...events].reverse().find((event) => event.states.some((state) => POSITIVE.has(norm(state))));
  if (negative && positive) return { before: negative.states.find((state) => NEGATIVE.has(norm(state))), after: positive.states.find((state) => POSITIVE.has(norm(state))), triggerEventId: positive.id, confidence: 0.86 };
  return { confidence: 0.18 };
}
function strongestConsequence(events: UniversalEvent[], relations: UniversalRelation[]): UniversalExperienceModel["strongestConsequence"] {
  const relation = relations.filter((item) => item.kind === "consequence").sort((a,b) => b.strength - a.strength)[0];
  if (relation) return { eventId: relation.toEventId, reason: relation.reason, strength: relation.strength };
  const event = [...events].sort((a,b) => b.importance - a.importance)[0]; return event ? { eventId: event.id, reason: "strongest observed event", strength: event.importance } : undefined;
}
function buildModel(prompt: string): UniversalExperienceModel {
  const clauses = splitPrompt(prompt); const usable = clauses.length ? clauses : [prompt]; const subject = detectSubject(prompt, usable);
  const events = usable.map((clause,index) => buildEvent(clause,subject,index)); const relations = buildRelations(events); const change = buildChange(events,relations);
  return { prompt, subject, evidence: buildEvidence(events,subject), events, relations, change, strongestConsequence: strongestConsequence(events,relations), strongestDetails: unique(events.flatMap((event) => event.details)).sort((a,b) => b.length-a.length).slice(0,8) };
}

/* -------------------------------------------------------------------------- */
/* Sentence realization                                                      */
/* -------------------------------------------------------------------------- */
function usableSource(event: UniversalEvent): boolean { const text = stripSentence(event.sourceText); return text.length >= 8 && text.length <= 180 && !INTERNAL.test(text); }
function actorFor(event: UniversalEvent, subject: string): string { return event.actor && lower(event.actor) !== lower(subject) ? event.actor : subject; }
function eventSentence(event: UniversalEvent, subject: string): string {
  if (usableSource(event) && event.action) return stripSentence(event.sourceText);
  const actor = actorFor(event,subject); const action = event.action ? lower(event.action) : "";
  if (action && event.object) return `${cap(actor)} ${action} ${lower(stripSentence(event.object))}`;
  if (action) return `${cap(actor)} ${action}`;
  if (event.states[0]) return `${cap(actor)} was ${event.states[0]}`;
  if (event.details[0]) return `${cap(event.details[0])} entered the picture`;
  return stripSentence(event.sourceText);
}
function changeSentence(model: UniversalExperienceModel): string | undefined {
  const { before, after, triggerEventId } = model.change; if (!before || !after) return undefined;
  const trigger = triggerEventId ? model.events.find((event) => event.id === triggerEventId) : undefined;
  if (trigger?.object) return `${cap(stripSentence(trigger.object))} changed the mood`;
  return `The mood shifted from ${before} to ${after}`;
}
function consequenceSentence(model: UniversalExperienceModel): string | undefined {
  const id = model.strongestConsequence?.eventId; const event = id ? model.events.find((item) => item.id === id) : undefined;
  if (!event?.action) return undefined;
  const actor = lower(actorFor(event,model.subject)); const action = lower(event.action); const object = event.object ? lower(stripSentence(event.object)) : "";
  if (object && /^(?:steal|stole|take|took)$/.test(action)) return `Then ${actor} ${action} ${object} like compensation was part of the package`;
  if (object && /^(?:find|found|discover|discovered|notice|noticed)$/.test(action)) return `Then ${actor} ${action} ${object}, and that changed what came next`;
  if (object) return `Then ${actor} ${action} ${object}, and that became the part worth remembering`;
  if (event.details[0]) return `Then ${actor} ${action}, with ${event.details[0]} becoming the detail that stayed`;
  return undefined;
}
function payoffSentence(model: UniversalExperienceModel): string | undefined {
  const final = model.events.at(-1); if (!final) return undefined;
  if ([...final.states].reverse().some((state) => POSITIVE.has(norm(state)))) return "By the end, the whole ordeal had apparently been forgiven";
  if (final.place || final.date || final.time) {
    const marker = [final.place,final.date,final.time].filter(Boolean).join(" • ");
    if (marker) return `By the end, ${marker} was part of what the story remembered`;
  }
  if (final.object && final.action) return `By the end, ${lower(final.action)} ${lower(stripSentence(final.object))} was the part worth remembering`;
  if (final.details[0]) return `By the end, ${final.details[0]} was the detail that stayed`;
  return undefined;
}
function markerSentence(event: UniversalEvent): string | undefined {
  const marker = [event.place,event.date,event.time].filter(Boolean).join(" • "); if (!marker) return undefined;
  return `At ${marker}, ${lower(stripSentence(event.sourceText))}`;
}
function rotateSubject(lines: string[], subject: string): string[] {
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); const prefix = new RegExp(`^${escaped}\\b`,"i"); let count = 0;
  return lines.map((line) => { if (!prefix.test(line)) return line; count += 1; return count <= 2 ? line : line.replace(prefix,"Then"); });
}
function realize(model: UniversalExperienceModel): string[] {
  const events = model.events; const first = events[0]; const last = events.at(-1); const strongestId = model.strongestConsequence?.eventId;
  const strongest = strongestId ? events.find((event) => event.id === strongestId) : undefined;
  const lines: string[] = [];
  if (first) lines.push(eventSentence(first,model.subject));

  const transition = changeSentence(model); if (transition) lines.push(transition);

  const middle = events.find((event) => event !== first && event !== last && event !== strongest);
  if (middle) lines.push(eventSentence(middle,model.subject));

  const consequence = consequenceSentence(model); if (consequence) lines.push(consequence);

  if (last && last !== first && (!consequence || lower(consequence) !== lower(last.sourceText))) {
    const finalLine = usableSource(last) ? stripSentence(last.sourceText) : payoffSentence(model);
    if (finalLine) lines.push(finalLine);
  }

  if (lines.length < 3 && strongest && strongest !== first) lines.push(eventSentence(strongest,model.subject));
  if (lines.length < 3) { const fallback = payoffSentence(model); if (fallback) lines.push(fallback); }
  if (lines.length < 4) { const marker = events.find((event) => [event.place,event.date,event.time].some(Boolean) && !lines.some((line) => lower(line).includes(lower(event.sourceText.slice(0,12))))); const marked = marker ? markerSentence(marker) : undefined; if (marked) lines.push(marked); }

  const normalized = rotateSubject(unique(lines).map(stripSentence).filter(Boolean).map((line) => `${line}.`),model.subject).slice(0,4);
  if (normalized.length === 1 && REQUEST.test(model.prompt ?? "")) normalized.push(`The brief is to make ${lower(model.subject)} matter.`);
  return unique(normalized);
}

export function compileUniversalExperience(prompt: string): UniversalExperienceResult {
  const normalized = clean(prompt); if (!normalized) return { version:"universal-v1", prompt:"", model:{ prompt:"", subject:"the subject", evidence:[], events:[], relations:[], change:{confidence:0}, strongestDetails:[] }, lines:[] };
  const model = buildModel(normalized);
  return { version:"universal-v1", prompt:normalized, model, lines:realize(model) };
}
