/*
STATUS: CANONICAL
ROLE: Universal source-reality graph construction.
INPUT: Natural-language facts, source moments, known subject/place, remembered world context.
OUTPUT: RealityGraph containing explicit evidence plus conservative derived structure.
AUTHORITY: Source reality only. Derived structure is advisory and never source truth.
MUST NOT: Invent events, participants, places, chronology, causality, outcomes, or creative prose.
UPSTREAM: Experience input, persistent memory, geo/presence context.
DOWNSTREAM: Canonical Cognition and memory projection.
REPLACEMENT: Replaces the previous Author-specific reality/parser stack.

COMPOSITION BOUNDARY:
- Evidence may contain timing, GPS/location, attachment, photo and other presentation metadata.
- Metadata is preserved as evidence but is not promoted to a narrative event by itself.
- A standalone timestamp must never consume a Movie beat.
- Place/geo supplied separately is rendering/context enrichment, not a mandatory scene.
*/
import type {
  RealityEntityContinuity,
  RealityEvent,
  RealityEventStructure,
  RealityEvidence,
  RealityGraph,
  RealityPattern,
  RealityRelation,
} from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const lower = (value: string): string => clean(value).toLowerCase();
const tokens = (value: string): string[] => unique(lower(value).replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((item) => item.length >= 3 && !STOP.has(item)));

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "through", "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are", "was", "were", "be", "been", "being", "as", "into", "my", "your", "our", "their", "his", "her", "its", "he", "she", "they", "them", "you", "we", "me", "same", "just", "very", "really",
]);

const ACTION = /\b(?:arrive|arrived|arrives|came|come|left|leave|went|go|met|meet|talk|talked|spoke|said|did|made|make|gave|give|get|got|found|find|lost|lose|clean|cleaned|finish|finished|started|start|opened|close|closed|walk|walked|ran|run|drove|drive|ate|eat|drank|drink|kissed|kiss|married|celebrated|played|play|worked|work|visited|visit|bought|buy|sold|sell|built|build|fixed|fix|painted|paint|wore|wear|used|use|stayed|stay|waited|wait|called|call|laughed|laugh|cried|cry|looked|look|felt|feel|became|become|changed|change|repaired|repair|tested|test|selected|select|cut|shaped|polished|delivered|welcomed|checked|booked|reserved|approved|groomed|dyed|tailored|installed|stole|stole|returned|return|rescued|adopted|remembered|remember|watched|watch|heard|hear|sang|sung|danced|dance)\b/i;
const STATE = /\b(?:nervous|scared|happy|sad|angry|calm|excited|proud|confident|funny|wild|goofy|sweet|gentle|fierce|stubborn|tired|quiet|loud|beautiful|strange|weird|odd|dark|bright|new|old|young|late|early|ready|clean|dirty|broken|fixed|alive|gone|back|first|second|third|different|same|open|closed|restored|renewed|lost|found)\b/i;
const TIME = /\b(?:today|yesterday|tomorrow|morning|afternoon|evening|night|later|earlier|first|again|second|third|last|next|until|before|after|weekly|daily|every|\d{1,2}:\d{2}|\d{4})\b/i;
const RECURRENCE = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|once more|weekly|daily|every|same|remembered|remember)\b/i;
const TRANSITIONS: Array<[string, string]> = [["nervous", "confident"], ["nervous", "calm"], ["broken", "working"], ["broken", "fixed"], ["dirty", "clean"], ["old", "new"], ["lost", "found"], ["closed", "open"], ["sad", "happy"], ["scared", "safe"]];

const STANDALONE_TIME = /^(?:(?:at|@)\s*)?(?:\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|(?:today|yesterday|tomorrow|morning|afternoon|evening|night))$/i;
const STANDALONE_DATE = /^(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{4})$/i;
const STANDALONE_GEO = /^(?:(?:gps|geo|location|coordinates?|lat(?:itude)?|lon(?:gitude)?)\s*[:=-]?\s*)?[+-]?\d{1,3}(?:\.\d+)?\s*[,/]\s*[+-]?\d{1,3}(?:\.\d+)?$/i;
const STANDALONE_PRESENTATION = /^(?:photo|photograph|image|picture|video|attachment|media)(?:\s*#?\d+)?(?:\s+(?:attached|uploaded))?$/i;
function isCompositionMetadata(value: string): boolean {
  const text = clean(value);
  return Boolean(text) && (STANDALONE_TIME.test(text) || STANDALONE_DATE.test(text) || STANDALONE_GEO.test(text) || STANDALONE_PRESENTATION.test(text));
}

function fragments(values: readonly string[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    const source = clean(value);
    if (!source) continue;
    const parts = source.includes("\n") || source.includes("•") || source.includes("|") || source.includes(";") || source.includes("·")
      ? source.split(/[\n•|;·]+/g)
      : [source];
    for (const part of parts) {
      const text = clean(part.replace(/^[-*]\s*/, ""));
      if (text) out.push(text);
    }
  }
  return unique(out);
}

function evidence(kind: RealityEvidence["kind"], text: string, index: number): RealityEvidence {
  return { id: `evidence-${kind}-${index + 1}`, text: clean(text), kind };
}

function explicitEntityNames(text: string, subject?: string): string[] {
  const names = text.match(/\b[A-Z][A-Za-z0-9'’-]{1,}\b/g) ?? [];
  return unique([...(subject && lower(text).includes(lower(subject)) ? [subject] : []), ...names]);
}

function eventStructure(label: string, eventId: string): RealityEventStructure {
  const actions = unique([...label.matchAll(new RegExp(ACTION.source, "gi"))].map((match) => match[0].toLowerCase())).slice(0, 8);
  const states = unique([...label.matchAll(new RegExp(STATE.source, "gi"))].map((match) => match[0].toLowerCase())).slice(0, 8);
  const temporalMarkers = TIME.test(label) ? unique([...(label.toLowerCase().match(/today|yesterday|tomorrow|morning|afternoon|evening|night|later|earlier|first|again|second|third|last|next|until|before|after|weekly|daily|every|\d{1,2}:\d{2}|\d{4}/g) ?? [])]).slice(0, 8) : [];
  const words = tokens(label);
  return {
    eventId,
    subjects: [],
    actions,
    objects: words.filter((word) => !actions.includes(word) && !states.includes(word)).slice(0, 8),
    states,
    temporalMarkers,
    sensoryMarkers: [],
    semanticTags: unique([
      ...(actions.length ? ["action"] : []),
      ...(states.length ? ["state"] : []),
      ...(RECURRENCE.test(label) ? ["recurrence"] : []),
      ...(TIME.test(label) ? ["time"] : []),
      ...(TRANSITIONS.some(([a, b]) => lower(label).includes(a) || lower(label).includes(b)) ? ["transition"] : []),
      ...(isCompositionMetadata(label) ? ["presentation-metadata"] : []),
    ]),
    recurrenceScore: RECURRENCE.test(label) ? 0.8 : 0,
    transitionScore: TRANSITIONS.some(([a, b]) => lower(label).includes(a) || lower(label).includes(b)) ? 0.75 : 0,
    anomalyScore: 0,
    salienceScore: Math.min(1, 0.35 + Math.min(0.45, words.length / 30) + (RECURRENCE.test(label) ? 0.15 : 0)),
  };
}

function makeEvents(parts: string[], subject?: string, place?: string): { events: RealityEvent[]; structures: RealityEventStructure[]; evidence: RealityEvidence[] } {
  const evidenceList = parts.map((part, index) => evidence("fact", part, index));
  const events: RealityEvent[] = [];
  const structures: RealityEventStructure[] = [];
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]!;
    if (isCompositionMetadata(part)) continue;
    const id = `event-${events.length + 1}`;
    const entities = explicitEntityNames(part, subject);
    const event = {
      id,
      label: part,
      sourceIds: [evidenceList[index]!.id],
      entities: unique(entities.length ? entities : tokens(part).slice(0, 8)),
      place: place || undefined,
      time: (part.match(/\b(?:today|yesterday|tomorrow|morning|afternoon|evening|night|at\s+\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}:\d{2}\s*(?:am|pm)?)\b/i)?.[0]) || undefined,
      salient: true,
      provenance: "explicit" as const,
    } satisfies RealityEvent;
    events.push(event);
    structures.push(eventStructure(event.label, event.id));
  }
  return { events, structures, evidence: evidenceList };
}

function buildRelations(events: RealityEvent[], structures: RealityEventStructure[]): RealityRelation[] {
  const relations: RealityRelation[] = [];
  const add = (from: string, to: string, kind: RealityRelation["kind"], strength: number) => {
    if (from === to || relations.some((item) => item.from === from && item.to === to && item.kind === kind)) return;
    relations.push({ from, to, kind, strength });
  };
  for (let i = 0; i < events.length - 1; i += 1) {
    const left = events[i]!;
    const right = events[i + 1]!;
    const ll = lower(left.label);
    const rr = lower(right.label);
    if (/\b(?:before|then|after|later|next)\b/.test(rr) || TIME.test(left.label) || TIME.test(right.label)) add(left.id, right.id, "before", 0.48);
    if (RECURRENCE.test(rr)) add(left.id, right.id, "repeats", 0.78);
    const lt = new Set(tokens(left.label));
    const rt = new Set(tokens(right.label));
    const shared = [...lt].filter((token) => rt.has(token));
    if (shared.length >= 2) add(left.id, right.id, "recontextualizes", Math.min(0.86, 0.5 + shared.length * 0.08));
    for (const [a, b] of TRANSITIONS) {
      if (ll.includes(a) && rr.includes(b)) add(left.id, right.id, "changes", 0.88);
    }
    if (/\b(?:because|caused|so that|therefore|which caused)\b/.test(rr)) add(left.id, right.id, "causes", 0.82);
  }
  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const a = events[i]!;
      const b = events[j]!;
      const overlap = tokens(a.label).filter((token) => tokens(b.label).includes(token)).length;
      if (overlap >= 3) add(a.id, b.id, "repeats", Math.min(0.92, 0.58 + overlap * 0.07));
    }
  }
  for (const structure of structures) {
    if (structure.transitionScore < 0.5) continue;
    const index = events.findIndex((event) => event.id === structure.eventId);
    if (index > 0) add(events[index - 1]!.id, structure.eventId, "changes", structure.transitionScore);
  }
  return relations.slice(0, 160);
}

function continuity(events: RealityEvent[]): RealityEntityContinuity[] {
  const map = new Map<string, string[]>();
  for (const event of events) {
    for (const entity of event.entities.slice(0, 8)) {
      const key = lower(entity);
      if (key.length < 3) continue;
      const ids = map.get(key) ?? [];
      ids.push(event.id);
      map.set(key, ids);
    }
  }
  return [...map.entries()].filter(([, ids]) => ids.length >= 2).map(([name, ids]) => ({ name, mentionCount: ids.length, eventIds: unique(ids), firstEventId: ids[0]!, lastEventId: ids.at(-1)!, kind: "unknown", salienceScore: Math.min(1, 0.35 + ids.length * 0.12) }));
}

function patterns(events: RealityEvent[], relations: RealityRelation[], structures: RealityEventStructure[], evidenceList: RealityEvidence[]): RealityPattern[] {
  const out: RealityPattern[] = [];
  const recurring = relations.filter((relation) => relation.kind === "repeats");
  for (const relation of recurring.slice(0, 12)) out.push({ kind: "recurrence", label: "supplied material recurs", eventIds: [relation.from, relation.to], evidenceIds: events.find((event) => event.id === relation.from)?.sourceIds ?? [], strength: relation.strength });
  for (const relation of relations.filter((item) => item.kind === "changes" || item.kind === "contrasts").slice(0, 12)) out.push({ kind: "transition", label: `supplied change between ${relation.from} and ${relation.to}`, eventIds: [relation.from, relation.to], evidenceIds: unique([...(events.find((event) => event.id === relation.from)?.sourceIds ?? []), ...(events.find((event) => event.id === relation.to)?.sourceIds ?? [])]), strength: relation.strength });
  for (const structure of structures.filter((item) => item.anomalyScore > 0.5).slice(0, 6)) out.push({ kind: "anomaly", label: "unusual supplied detail", eventIds: [structure.eventId], evidenceIds: events.find((event) => event.id === structure.eventId)?.sourceIds ?? [], strength: structure.anomalyScore });
  return out.slice(0, 40);
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
  const parts = fragments([...input.facts, ...(input.sourceMoments ?? [])]);
  const { events, structures, evidence } = makeEvents(parts, clean(input.subject), clean(input.place));
  const relations = buildRelations(events, structures);
  const entityContinuity = continuity(events);
  const recurringSignals = unique([
    ...relations.filter((item) => item.kind === "repeats").map(() => "recurrence is present"),
    ...(input.memoryContext ?? []).filter((item) => RECURRENCE.test(item)),
    ...(input.trajectory ?? []).filter((item) => RECURRENCE.test(item)),
  ]).slice(0, 24);
  const unresolvedTensions = unique(relations.filter((item) => item.kind === "changes" || item.kind === "contrasts" || item.kind === "recontextualizes").map((item) => `supplied ${item.kind}`)).slice(0, 24);
  return {
    evidence,
    events,
    relations,
    eventStructure: structures,
    entityContinuity,
    patterns: patterns(events, relations, structures, evidence),
    unresolvedTensions,
    recurringSignals,
    sensorySignals: parts.filter((item) => /\b(?:blue|red|green|yellow|white|black|bacon|apple|water|rain|wind|music|sound|light|dark|smell|scent|cinnamon|sunset)\b/i.test(item)).slice(0, 24),
  };
}
