import type { RealityEvent, RealityEvidence, RealityGraph, RealityRelation } from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = (value: string): string => clean(value).toLowerCase();

const STOP = new Set(["the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "through", "after", "before", "then", "now", "very", "just", "still", "again", "this", "that", "it", "is", "are", "was", "were", "be", "been", "being", "as", "into", "my", "your", "our", "their", "his", "her", "its", "he", "she", "they", "them", "you", "we", "me"]);
const ACTIONS = /\b(?:arriv(?:e|ed|es|ing)|return(?:ed|s|ing)?|came|come|left|leave|went|go|met|meet|talk(?:ed|s|ing)?|spoke|said|did|made|make|gave|give|got|get|found|find|lost|lose|clean(?:ed|s|ing)?|finished|finish|started|start|opened|close(?:d|s|ing)?|walk(?:ed|s|ing)?|ran|run|drove|drive|ate|eat|drank|drink|kiss(?:ed|es|ing)?|married|celebrated|played|play|worked|work|visited|visit|bought|buy|sold|sell|built|build|fixed|fix|paint(?:ed|s|ing)?|wore|wear|used|use|shook|shake|chewed|chew|connected|connect|stayed|stay|wait(?:ed|s|ing)?|called|call|laughed|laugh(?:ed|s|ing)?|cried|cry(?:ing|ied)?|look(?:ed|s|ing)?|felt|feel|seemed|seem|became|become|changed|change)\b/i;
const STATE_WORDS = /\b(?:happy|sad|angry|calm|excited|nervous|scared|proud|confident|fun|funny|wild|goofy|sweet|gentle|fierce|stubborn|tired|quiet|loud|beautiful|strange|weird|odd|dark|bright|new|old|young|male|female|single|married|late|early|ready|clean|dirty|broken|fixed|alive|gone|back|again|first|second|third)\b/i;
const TIME_WORDS = /\b(?:today|yesterday|tomorrow|morning|afternoon|evening|night|later|earlier|first|again|second|third|last|next|at \d|\d{1,2}:\d{2})\b/i;
const RELATION_WORDS = /\b(?:because|therefore|so|which made|which caused|as a result|due to|until|while|after|before)\b/i;
const RECURRENCE_WORDS = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|once more)\b/i;
const SENSORY_WORDS = /\b(?:smell|scent|sound|song|music|bass|taste|touch|feel|look|color|light|dark|glass|water|bubble|bow|bows|wine|rain|heat|cold|scratch|scar|texture|soft|rough|ball|balls|tie|ties)\b/i;

function evidence(kind: RealityEvidence["kind"], text: string, index: number): RealityEvidence { return { id: `evidence-${kind}-${index + 1}`, text: clean(text), kind }; }

/** Comma/list order is an input boundary, never a temporal fact. */
function splitReality(values: readonly string[]): string[] {
  const fragments: string[] = [];
  for (const value of values) {
    const text = clean(value);
    if (!text) continue;
    const parts = text.includes(",") || text.includes(";") || text.includes("\n") || text.includes("•") ? text.split(/[,;\n•]+/g) : [text];
    for (const part of parts) {
      const candidate = clean(part.replace(/^[-*]\s*/, ""));
      if (candidate) fragments.push(candidate);
    }
  }
  return [...new Set(fragments)];
}

function contentTokens(text: string): string[] {
  return [...new Set(lower(text).replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3 && !STOP.has(token)))].slice(0, 12);
}
function capitalizedEntities(text: string): string[] { return [...new Set(text.match(/\b[A-Z][A-Za-z0-9'’-]{1,}\b/g) ?? [])].slice(0, 8); }
function eventKind(text: string): "event" | "state" | "observation" { if (ACTIONS.test(text) || TIME_WORDS.test(text)) return "event"; if (STATE_WORDS.test(text)) return "state"; return "observation"; }
function explicitTime(text: string): number | undefined {
  const match = text.match(/\b(?:at\s*)?(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
  if (!match) return undefined;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function event(label: string, sourceIds: string[], subject: string | undefined, place: string | undefined, index: number): RealityEvent {
  const concepts = contentTokens(label);
  const entities = [...new Set([...(subject ? [clean(subject)] : []), ...capitalizedEntities(label), ...concepts.slice(0, 4)].filter(Boolean))].slice(0, 12);
  const kind = eventKind(label);
  return { id: `event-${index + 1}`, label: clean(label), sourceIds, entities, place: clean(place) || undefined, emotionalState: kind === "state" ? clean(label) : undefined, salient: true, provenance: "explicit" };
}

function addRelation(relations: RealityRelation[], from: string, to: string, kind: RealityRelation["kind"], strength: number): void {
  if (from === to) return;
  if (relations.some((relation) => relation.from === from && relation.to === to && relation.kind === kind)) return;
  relations.push({ from, to, kind, strength });
}

function buildRelationships(events: RealityEvent[], subject?: string): RealityRelation[] {
  const relations: RealityRelation[] = [];
  const subjectText = lower(subject ?? "");

  // Chronology is earned. We only emit temporal edges when explicit clock times exist.
  for (let i = 0; i < events.length; i += 1) {
    const currentTime = explicitTime(events[i].label);
    if (currentTime === undefined) continue;
    for (let j = 0; j < events.length; j += 1) {
      if (i === j) continue;
      const otherTime = explicitTime(events[j].label);
      if (otherTime === undefined || currentTime >= otherTime) continue;
      addRelation(relations, events[i].id, events[j].id, "before", 0.94);
      addRelation(relations, events[j].id, events[i].id, "after", 0.94);
    }
  }

  for (let i = 0; i < events.length; i += 1) {
    const current = events[i];
    const currentText = lower(current.label);
    const currentTokens = new Set(contentTokens(current.label));

    if (subjectText && currentText.includes(subjectText)) {
      for (let j = 0; j < events.length; j += 1) if (i !== j && lower(events[j].label).includes(subjectText)) addRelation(relations, current.id, events[j].id, "involves", 0.62);
    }

    for (let j = i + 1; j < events.length; j += 1) {
      const other = events[j];
      const otherText = lower(other.label);
      const otherTokens = new Set(contentTokens(other.label));
      const shared = [...currentTokens].filter((token) => otherTokens.has(token));
      if (shared.length) addRelation(relations, current.id, other.id, "converges", Math.min(0.9, 0.5 + shared.length * 0.1));

      if ((ACTIONS.test(current.label) && STATE_WORDS.test(other.label)) || (STATE_WORDS.test(current.label) && ACTIONS.test(other.label))) addRelation(relations, current.id, other.id, "changes", 0.42);
      if (RELATION_WORDS.test(current.label) || RELATION_WORDS.test(other.label)) addRelation(relations, current.id, other.id, "recontextualizes", 0.82);

      const stateObjectPair = (STATE_WORDS.test(current.label) && SENSORY_WORDS.test(otherText)) || (SENSORY_WORDS.test(current.label) && STATE_WORDS.test(otherText));
      if (stateObjectPair) addRelation(relations, current.id, other.id, "contrasts", 0.34);

      const a = explicitTime(current.label);
      const b = explicitTime(other.label);
      if (a !== undefined && b !== undefined && a < b) addRelation(relations, current.id, other.id, "before", 0.94);
    }
  }

  const recurrence = events.filter((item) => RECURRENCE_WORDS.test(item.label));
  for (const item of recurrence) for (const other of events) if (item.id !== other.id) addRelation(relations, item.id, other.id, "recontextualizes", 0.76);
  return relations.slice(0, 96);
}

function deriveTensions(events: RealityEvent[], relations: RealityRelation[], sourceText: string): string[] {
  const lowerSource = lower(sourceText);
  const tensions: string[] = [];
  if (RECURRENCE_WORDS.test(lowerSource)) tensions.push("recurrence can change the meaning of an earlier detail");
  if (/(?:happy|proud|confident|excited)/.test(lowerSource) && /(?:sad|angry|scared|nervous|tired)/.test(lowerSource)) tensions.push("current state conflicts with another supplied state");
  if (/\b(?:old|vintage|inherited)\b/.test(lowerSource) && /\b(?:new|first|brand new)\b/.test(lowerSource)) tensions.push("old meaning meets new context");
  if (events.some((item) => item.entities.length >= 3)) tensions.push("one observation contains multiple salient details that can be reframed together");
  if (relations.some((relation) => relation.kind === "contrasts")) tensions.push("two supplied details create a possible expectation violation");
  if (relations.some((relation) => relation.kind === "recontextualizes")) tensions.push("a supplied detail can change the meaning of another supplied detail");
  if (relations.some((relation) => relation.kind === "changes")) tensions.push("an observed state is linked to an observed action");
  return [...new Set(tensions)].slice(0, 10);
}

function deriveRecurringSignals(fragments: string[], memory: readonly string[] | undefined, trajectory: readonly string[] | undefined): string[] {
  const all = [...fragments, ...(memory ?? []), ...(trajectory ?? [])].map(clean).filter(Boolean);
  const normalized = all.map((item) => item.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
  const repeated = normalized.filter((item, index) => normalized.indexOf(item) !== index);
  const lexical = new Map<string, number>();
  for (const item of normalized) for (const token of contentTokens(item)) lexical.set(token, (lexical.get(token) ?? 0) + 1);
  const repeatedTokens = [...lexical.entries()].filter(([, count]) => count > 1).map(([token]) => token);
  const explicitRecurrence = fragments.filter((item) => RECURRENCE_WORDS.test(item)).map(clean);
  return [...new Set([...explicitRecurrence, ...repeated, ...repeatedTokens])].slice(0, 16);
}
function deriveSensorySignals(fragments: string[]): string[] { return fragments.filter((text) => SENSORY_WORDS.test(text)).slice(0, 16); }

export function buildAuthorRealityGraph(input: { prompt: string; subject?: string; place?: string; facts: string[]; sourceMoments: string[]; memoryContext?: string[]; trajectory?: string[] }): RealityGraph {
  const evidenceItems: RealityEvidence[] = [];
  const pushEvidence = (kind: RealityEvidence["kind"], values: readonly string[] | undefined) => {
    for (const value of values ?? []) { const text = clean(value); if (text) evidenceItems.push(evidence(kind, text, evidenceItems.length)); }
  };
  pushEvidence("prompt", [input.prompt]);
  pushEvidence("identity", input.subject ? [input.subject] : []);
  pushEvidence("fact", input.facts);
  pushEvidence("moment", input.sourceMoments);
  pushEvidence("memory", input.memoryContext);
  pushEvidence("trajectory", input.trajectory);

  const rawReality = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), ...(input.trajectory ?? [])];
  const fragments = splitReality(rawReality);
  const atomicEvidence: RealityEvidence[] = fragments.map((text, index) => ({ id: `evidence-atomic-${index + 1}`, text, kind: "fact" }));
  const events = atomicEvidence.map((source, index) => event(source.text, [source.id], input.subject, input.place, index));
  const relations = buildRelationships(events, input.subject);
  const sourceText = [input.prompt, ...rawReality].join(" ");

  return {
    evidence: [...evidenceItems, ...atomicEvidence],
    events,
    relations,
    unresolvedTensions: deriveTensions(events, relations, sourceText),
    recurringSignals: deriveRecurringSignals(fragments, input.memoryContext, input.trajectory),
    sensorySignals: deriveSensorySignals(fragments),
  };
}
