/**
 * QRE FILE ROLE: universal realization-mode classifier.
 * HARD RULE: classify the supplied material before choosing how much to dramatize.
 * DO NOT hard-code domain examples. Generic linguistic/event structure only.
 * COLLECTION is identity/preference material; SEQUENCE FILM requires an earned
 * event chain or explicit creative direction.
 */

export type AuthorRealizationMode = "collection" | "state" | "sequence-film";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = (value: unknown): string => clean(value).toLowerCase();

const IDENTITY = /^(?:[a-z0-9'’.-]+\s+)?(?:is|are|was|were)\s+(?:a|an|the)\b/i;
const PREFERENCE = /\b(?:likes?|loves?|hates?|prefers?|favorite|favourite|usually|often|always|never|wants?|enjoys?|avoids?)\b/i;
const STATE = /\b(?:happy|sad|angry|calm|excited|nervous|scared|proud|confident|tired|quiet|loud|ready|clean|dirty|broken|fixed|alive|gone|afraid|upset|relieved)\b/i;
const TIME_OR_CONTEXT = /\b(?:today|yesterday|tomorrow|this\s+(?:morning|afternoon|evening|night)|last\s+(?:night|week|month)|next\s+(?:day|week|month)|at\s+\d|\d{1,2}:\d{2}|round\s+\d+|level\s+\d+|mile\b|miles\b|geo\b|location\b)\b/i;
const OCCURRENCE = /\b(?:arrived|entered|met|talked|spoke|said|left|came|went|found|lost|got|cleaned|finished|started|opened|closed|walked|ran|drove|ate|drank|kissed|married|celebrated|played|worked|visited|bought|sold|built|fixed|painted|wore|used|shook|chewed|connected|stayed|waited|called|laughed|cried|looked|felt|saw|observed|rolled|booted|slapped|won|kicked|packed|moved|traveled|travelled|returned|became|changed|stole|stole)\b/i;
const EXPLICIT_CREATIVE = /\b(?:make|create|turn|build|write|give\s+me|show\s+me)\b.{0,60}\b(?:movie|film|cinematic|sequence\s+film|adventure|epic|story|fiction|horror|noir|spy|cyber|game)\b/i;

function fragments(input: { facts: string[]; sourceMoments: string[] }): string[] {
  return [...input.facts, ...input.sourceMoments]
    .map(clean)
    .filter(Boolean)
    .filter((value) => !IDENTITY.test(value));
}

export function classifyAuthorRealizationMode(input: {
  prompt: string;
  facts: string[];
  sourceMoments: string[];
  relationKinds?: readonly string[];
  movieMode?: boolean;
}): AuthorRealizationMode {
  const text = lower(input.prompt);
  const items = fragments(input);
  const relations = new Set(input.relationKinds ?? []);

  if (input.movieMode === true || EXPLICIT_CREATIVE.test(text)) return "sequence-film";

  const occurrenceCount = items.filter((value) => OCCURRENCE.test(value)).length;
  const timedCount = items.filter((value) => TIME_OR_CONTEXT.test(value)).length;
  const preferenceCount = items.filter((value) => PREFERENCE.test(value)).length;
  const stateCount = items.filter((value) => STATE.test(value)).length;
  const strongRelations = ["before", "after", "causes", "changes"].filter((kind) => relations.has(kind)).length;

  if (strongRelations > 0) return "sequence-film";
  if (timedCount > 0 && occurrenceCount > 0) return "sequence-film";
  if (occurrenceCount >= 2 && occurrenceCount > preferenceCount) return "sequence-film";
  if (occurrenceCount >= 3 && preferenceCount < occurrenceCount) return "sequence-film";

  if (stateCount > 0 && occurrenceCount === 0 && preferenceCount === 0) return "state";
  return "collection";
}
