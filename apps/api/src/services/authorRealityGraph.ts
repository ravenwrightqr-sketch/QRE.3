import type {
  RealityEvent,
  RealityEvidence,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import { looksLikeIdentityAssertion } from "@qre/contracts";

/*
 * QRE FILE ROLE: RealityGraph construction.
 * AUTHORITY: supplied reality only.
 * ALLOWED: derive explainable semantic relations from explicit facts/moments.
 * FORBIDDEN: generic predicates, role words, or loose lexical matches creating narrative causality.
 * MEDIA RULE: media is an artifact, not an inferred human action.
 */

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = (value: string): string => clean(value).toLowerCase();

const STOP = new Set(["the","a","an","and","or","but","to","of","in","on","at","for","with","from","by","through","after","before","then","now","very","just","still","again","this","that","it","is","are","was","were","be","been","being","as","into","my","your","our","their","his","her","its","he","she","they","them","you","we","me"]);
const GENERIC = new Set(["likes","like","loves","love","is","are","was","were","be","been","has","have","had","does","do","did","gets","get","got","makes","make","made","goes","go","went","walks","walk","walked"]);
const ACTIONS = /\b(?:arriv(?:e|ed|es|ing)|return(?:ed|s|ing)?|came|come|left|leave|went|go|met|meet|talk(?:ed|s|ing)?|spoke|said|did|made|make|gave|give|get|got|found|find|lost|lose|clean(?:ed|s|ing)?|finished|finish|started|start|opened|close(?:d|s|ing)?|walk(?:ed|s|ing)?|ran|run|drove|drive|ate|eat|drank|drink|kiss(?:ed|es|ing)?|married|celebrated|played|play|worked|work|visited|visit|bought|buy|sold|sell|built|build|fixed|fix|paint(?:ed|s|ing)?|wore|wear|used|use|shook|shake|chewed|chew|connected|connect|stayed|stay|wait(?:ed|s|ing)?|called|call|laughed|laugh(?:ed|s|ing)?|cried|cry(?:ing|ied)?|look(?:ed|s|ing)?|felt|feel|seemed|seem|became|become|changed|change)\b/i;
const STATE_WORDS = /\b(?:happy|sad|angry|calm|excited|nervous|scared|proud|confident|fun|funny|wild|goofy|sweet|gentle|fierce|stubborn|tired|quiet|loud|beautiful|strange|weird|odd|dark|bright|new|old|young|male|female|single|married|late|early|ready|clean|dirty|broken|fixed|alive|gone|back|again|first|second|third|different|dapper|fabulous|cool|sharp)\b/i;
const TIME_WORDS = /\b(?:today|yesterday|tomorrow|morning|afternoon|evening|night|later|earlier|first|again|second|third|last|next|at \d|\d{1,2}:\d{2})\b/i;
const RECURRENCE_WORDS = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|once more)\b/i;

function evidence(kind: RealityEvidence["kind"], text: string, index: number): RealityEvidence {
  return { id: `evidence-${kind}-${index + 1}`, text: clean(text), kind };
}

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
  return [...new Set(lower(text).replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3 && !STOP.has(token)))].slice(0, 16);
}

function meaningfulContentTokens(text: string, subject?: string): string[] {
  const subjectTokens = new Set(contentTokens(subject ?? ""));
  return contentTokens(text).filter((token) => !GENERIC.has(token) && !subjectTokens.has(token));
}

function capitalizedEntities(text: string): string[] {
  return [...new Set(text.match(/\b[A-Z][A-Za-z0-9'’-]{1,}\b/g) ?? [])].slice(0, 8);
}

function eventKind(text: string): "event" | "state" | "observation" {
  if (ACTIONS.test(text) || TIME_WORDS.test(text)) return "event";
  if (STATE_WORDS.test(text)) return "state";
  return "observation";
}

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
  const entities = [...new Set([...(subject ? [clean(subject)] : []), ...capitalizedEntities(label), ...concepts.slice(0, 5)].filter(Boolean))].slice(0, 12);
  const kind = eventKind(label);
  return {
    id: `event-${index + 1}`,
    label: clean(label),
    sourceIds,
    entities,
    place: clean(place) || undefined,
    emotionalState: kind === "state" ? clean(label) : undefined,
    salient: true,
    provenance: "explicit",
  };
}

function addRelation(relations: RealityRelation[], from: string, to: string, kind: RealityRelation["kind"], strength: number): void {
  if (from === to) return;
  if (relations.some((relation) => relation.from === from && relation.to === to && relation.kind === kind)) return;
  relations.push({ from, to, kind, strength: Math.max(0, Math.min(1, strength)) });
}

function buildRelationships(events: RealityEvent[]): RealityRelation[] {
  const relations: RealityRelation[] = [];

  /* Explicit clocks are factual temporal relations. */
  for (let i = 0; i < events.length; i += 1) {
    const currentTime = explicitTime(events[i]!.label);
    if (currentTime === undefined) continue;
    for (let j = i + 1; j < events.length; j += 1) {
      const otherTime = explicitTime(events[j]!.label);
      if (otherTime === undefined || currentTime >= otherTime) continue;
      addRelation(relations, events[i]!.id, events[j]!.id, "before", 0.94);
      addRelation(relations, events[j]!.id, events[i]!.id, "after", 0.94);
    }
  }

  for (let i = 0; i < events.length; i += 1) {
    const current = events[i]!;
    for (let j = i + 1; j < events.length; j += 1) {
      const other = events[j]!;
      const currentMeaningful = meaningfulContentTokens(current.label);
      const otherMeaningful = meaningfulContentTokens(other.label);
      const otherSet = new Set(otherMeaningful);
      const shared = currentMeaningful.filter((token) => otherSet.has(token));

      /* Reuse only when a distinctive supplied concept actually recurs. */
      if (shared.length >= 1 && shared.some((token) => token.length >= 5)) {
        addRelation(relations, current.id, other.id, "converges", Math.min(0.82, 0.44 + shared.filter((token) => token.length >= 5).length * 0.1));
      }

      const currentTime = explicitTime(current.label);
      const otherTime = explicitTime(other.label);
      if (currentTime !== undefined && otherTime !== undefined && currentTime < otherTime) {
        addRelation(relations, current.id, other.id, "before", 0.94);
      }

      /* State/action alone is NOT a contrast and does not create a graph edge.
       * Creative interpretation derives ordered action→state consequence later. */
    }
  }

  /* Only preserve recurrence as a signal; do not attach it to every event. */
  return relations.slice(0, 96);
}

function deriveTensions(events: RealityEvent[], relations: RealityRelation[], sourceText: string): string[] {
  const lowerSource = lower(sourceText);
  const tensions: string[] = [];
  if (RECURRENCE_WORDS.test(lowerSource)) tensions.push("recurrence can change the meaning of an earlier detail");
  if (/(?:happy|proud|confident|excited)/.test(lowerSource) && /(?:sad|angry|scared|nervous|tired)/.test(lowerSource)) tensions.push("current state conflicts with another supplied state");
  if (/\b(?:old|vintage|inherited)\b/.test(lowerSource) && /\b(?:new|first|brand new)\b/.test(lowerSource)) tensions.push("old meaning meets new context");
  if (events.some((item) => item.entities.length >= 3)) tensions.push("one observation contains multiple salient details that can be reframed together");
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

function deriveSensorySignals(fragments: string[]): string[] {
  const sensory = /\b(?:smell|scent|noise|sound|music|light|dark|bright|cold|hot|wet|dry|taste|sweet|salty|rough|soft|blue|red|green|yellow|white|black|lavender|bacon|apple|water|rain|wind)\b/i;
  return [...new Set(fragments.filter((item) => sensory.test(item)).map(clean))].slice(0, 16);
}

 export function buildAuthorRealityGraph(input: {
  prompt: string;
  subject?: string;
  place?: string;
  facts: readonly string[];
  sourceMoments?: readonly string[];
  memoryContext?: readonly string[];
  trajectory?: readonly string[];
}): RealityGraph {
  const sourceValues = [...input.facts, ...(input.sourceMoments ?? [])];
  const fragments = splitReality(sourceValues);
  const sourceEvidence = fragments.map((fragment, index) => evidence("fact", fragment, index));
  const events = fragments.map((fragment, index) => event(fragment, [sourceEvidence[index]!.id], input.subject, input.place, index));
  const relations = buildRelationships(events);
  const sourceText = fragments.join(" | ");
  const recurringSignals = deriveRecurringSignals(fragments, input.memoryContext, input.trajectory);
  const sensorySignals = deriveSensorySignals(fragments);
  const unresolvedTensions = deriveTensions(events, relations, sourceText);

  return {
    evidence: sourceEvidence,
    events,
    relations,
    unresolvedTensions,
    recurringSignals,
    sensorySignals,
  };
}
