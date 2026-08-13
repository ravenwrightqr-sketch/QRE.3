import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import type {
  MemoryContext,
  MemoryEntity,
  MemoryFact,
  MemoryRelation,
  MemoryEvent,
  MemoryEntityKind,
  MemoryFactKind,
} from "@qre/contracts";

export type MemoryScopeV12 = {
  assetId: string;
  visibility?: "private" | "shared" | "public";
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const key = (value: string) => normalize(value).replace(/\s+/g, "-");
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = <T>(values: T[]) => [...new Set(values)];

const stop = new Set([
  "the", "and", "that", "this", "with", "from", "into", "when", "then", "was", "were", "been", "have", "had",
  "they", "them", "their", "there", "here", "very", "really", "just", "made", "make", "got", "get", "for", "with",
]);

function subjectKind(prompt: string, movie: LatentMovieV5): MemoryEntityKind {
  const text = `${prompt} ${movie.facts.map((fact) => fact.text).join(" ")}`.toLowerCase();
  if (/\b(?:husband|wife|spouse|couple|partner|married|marriage|anniversary|boyfriend|girlfriend)\b/.test(text)) return "experience";
  if (/\b(?:dog|puppy|cat|pet|pomeranian|retriever|puppy|kitten)\b/.test(text)) return "animal";
  if (/\b(?:company|business|team|organization|brand|shop|salon|groomer|housekeeper)\b/.test(text)) return "organization";
  if (/\b(?:house|home|property|beach|park|restaurant|hotel|place)\b/.test(text)) return "place";
  if (/\b(?:project|launch|product|campaign|book|album|build)\b/.test(text)) return "experience";
  return movie.subject ? "person" : "other";
}

function candidateMembers(movie: LatentMovieV5, prompt: string): string[] {
  const actors = movie.facts.flatMap((fact) => fact.actors).map(clean).filter(Boolean);
  const named = unique(actors);
  if (named.length >= 2) return named.slice(0, 8);
  const subject = clean(movie.subject);
  const pair = prompt.match(/\b([A-Z][a-z]+)\s+(?:and|&|with)\s+([A-Z][a-z]+)\b/);
  return unique([subject, ...(pair ? [pair[1], pair[2]] : [])]).filter(Boolean);
}

function relationship(prompt: string, members: string[]): MemoryRelation[] {
  if (members.length < 2) return [];
  const text = prompt.toLowerCase();
  const relation = /\b(?:married|marriage|husband|wife|spouse|anniversary|couple)\b/.test(text)
    ? "married_to"
    : /\b(?:boyfriend|girlfriend|partner|dating)\b/.test(text)
      ? "partner_of"
      : /\b(?:mother|mom|father|dad|parent|child|daughter|son)\b/.test(text)
        ? "family_of"
        : "connected_to";
  const relations: MemoryRelation[] = [];
  for (let index = 1; index < members.length; index += 1) {
    relations.push({
      id: `memory-relation-${key(members[0])}-${key(members[index])}`,
      fromEntityId: key(members[0]),
      toEntityId: key(members[index]),
      relation,
      confidence: relation === "connected_to" ? 0.55 : 0.9,
      source: "prompt",
      observedAt: new Date().toISOString(),
      visibility: "private",
    });
  }
  return relations;
}

function lexicalAnchors(movie: LatentMovieV5): string[] {
  return unique(movie.facts.flatMap((fact) => normalize(fact.text).split(" "))
    .filter((token) => token.length >= 4 && !stop.has(token) && !/^\d+$/.test(token)))
    .slice(0, 32);
}

function entities(movie: LatentMovieV5, members: string[], visibility: MemoryEntity["visibility"]): MemoryEntity[] {
  return unique(members).map((name) => ({
    id: key(name),
    kind: name === movie.subject ? "person" : "other",
    name,
    canonicalKey: key(name),
    confidence: 0.92,
    visibility,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

function facts(movie: LatentMovieV5, subjectId: string, visibility: MemoryFact["visibility"]): MemoryFact[] {
  return movie.facts.map((fact, index) => ({
    id: `memory-fact-${index + 1}-${key(fact.text).slice(0, 48)}`,
    entityId: subjectId,
    kind: "event" as MemoryFactKind,
    predicate: "experienced",
    value: fact.text,
    confidence: fact.confidence ?? 0.8,
    source: "prompt",
    status: "active",
    observedAt: new Date().toISOString(),
    visibility,
  }));
}

function events(movie: LatentMovieV5, members: string[], sequenceOffset: number): MemoryEvent[] {
  return movie.facts.map((fact, index) => ({
    id: `memory-event-${sequenceOffset + index + 1}`,
    type: "experience",
    summary: fact.text,
    occurredAt: fact.times[0] ?? fact.dates[0] ?? new Date().toISOString(),
    source: "prompt",
    confidence: fact.confidence ?? 0.8,
    entityIds: unique([key(movie.subject), ...members.map(key)]),
    metadata: { places: fact.places, times: fact.times, dates: fact.dates },
  }));
}

export function compileUniversalMemoryV12(
  scope: MemoryScopeV12,
  prompt: string,
  movie: LatentMovieV5,
  previous?: MemoryContext,
): MemoryContext {
  const visibility = scope.visibility ?? "private";
  const members = candidateMembers(movie, prompt);
  const kind = subjectKind(prompt, movie);
  const subjectId = key(movie.subject || members[0] || "subject");
  const priorEvents = previous?.events ?? [];
  const currentEntities = entities(movie, members, visibility).map((entity) =>
    entity.id === subjectId ? { ...entity, kind } : entity,
  );
  const mergedEntities = [...(previous?.entities ?? [])];
  for (const entity of currentEntities) {
    const existing = mergedEntities.find((candidate) => candidate.id === entity.id);
    if (existing) Object.assign(existing, entity, { createdAt: existing.createdAt });
    else mergedEntities.push(entity);
  }

  const currentFacts = facts(movie, subjectId, visibility);
  const mergedFacts = [...(previous?.facts ?? []), ...currentFacts].filter((fact, index, all) =>
    all.findIndex((candidate) => normalize(candidate.value) === normalize(fact.value) && candidate.entityId === fact.entityId) === index,
  );
  const currentRelations = relationship(prompt, members).map((relation) => ({ ...relation, visibility }));
  const mergedRelations = [...(previous?.relations ?? [])];
  for (const relation of currentRelations) {
    if (!mergedRelations.some((candidate) => candidate.fromEntityId === relation.fromEntityId && candidate.toEntityId === relation.toEntityId && candidate.relation === relation.relation)) mergedRelations.push(relation);
  }

  const currentEvents = events(movie, members, priorEvents.length);
  const mergedEvents = [...priorEvents, ...currentEvents];
  const recurringAnchors = lexicalAnchors(movie).filter((anchor) => {
    const previousText = (previous?.events ?? []).map((event) => event.summary).join(" ");
    return normalize(previousText).includes(anchor);
  });
  const recurringPatterns = previous
    ? previous.events.filter((event) => event.entityIds.includes(subjectId)).slice(-6).map((event) => event.summary)
    : [];

  return {
    assetId: scope.assetId,
    generatedAt: new Date().toISOString(),
    entities: mergedEntities,
    facts: mergedFacts,
    relations: mergedRelations,
    events: mergedEvents,
  };
}

export function memoryContinuitySignalsV12(memory: MemoryContext, subjectId: string): string[] {
  const facts = memory.facts.filter((fact) => !fact.entityId || fact.entityId === subjectId);
  return unique([
    ...facts.slice(-8).map((fact) => fact.value),
    ...memory.relations.filter((relation) => relation.fromEntityId === subjectId || relation.toEntityId === subjectId).map((relation) => relation.relation),
  ]);
}
