/**
 * QRE FILE ROLE: universal source-shape classifier.
 * HARD BOUNDARY: recognize what kind of reality the source actually supplies.
 * STYLE REMAINS FREE: this file does not prescribe sentence length or form.
 *
 * A sequence-film-capable source contains an actual supplied occurrence,
 * explicit creative direction, or an explicit movie switch. Stable traits,
 * preferences, and habitual behavior are not episodes merely because they use
 * action verbs.
 */

export type AuthorRealizationMode = "collection" | "state" | "sequence-film";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = (value: unknown): string => clean(value).toLowerCase();

const IDENTITY = /^(?:[a-z0-9'’.-]+\s+)?(?:is|are|was|were)\s+(?:a|an|the)\b/i;
const PREFERENCE = /\b(?:likes?|loves?|hates?|prefers?|favorite|favourite|usually|often|always|never|wants?|enjoys?|avoids?)\b/i;
const STATE = /\b(?:happy|sad|angry|calm|excited|nervous|scared|proud|confident|tired|quiet|loud|ready|clean|dirty|broken|fixed|alive|gone|afraid|upset|relieved)\b/i;
const TIME_OR_CONTEXT = /\b(?:today|yesterday|tomorrow|this\s+(?:morning|afternoon|evening|night)|last\s+(?:night|week|month)|next\s+(?:day|week|month)|at\s+\d|\d{1,2}:\d{2}|round\s+\d+|level\s+\d+|mile\b|miles\b|geo\b|location\b|hours?\s+later|later\b|earlier\b)\b/i;
const EXPLICIT_OCCURRENCE = /\b(?:arrived|entered|met|talked|spoke|said|left|came|went|found|lost|got|cleaned|finished|started|opened|closed|walked|ran|drove|ate|drank|kissed|married|celebrated|played|worked|visited|bought|sold|built|fixed|painted|wore|used|shook|chewed|connected|stayed|waited|called|laughed|cried|looked|felt|saw|observed|rolled|booted|slapped|won|kicked|packed|moved|traveled|travelled|returned|became|changed|stole)\b/i;
const HABITUAL_ACTION = /^(?:[a-z0-9'’.-]+\s+)?(?:walks|runs|drives|eats|drinks|plays|works|visits|buys|sells|builds|fixes|paints|wears|uses|shakes|chews|connects|stays|waits|calls|laughs|cries|looks|feels|sees|observes|rolls|boots|slaps|wins|kicks|packs|moves|travels|returns|changes|steals)\b/i;
const EXPLICIT_CREATIVE = /\b(?:make|create|turn|build|write|give\s+me|show\s+me)\b.{0,80}\b(?:movie|film|cinematic|sequence\s+film|adventure|epic|story|fiction)\b/i;

function fragments(input: { facts: string[]; sourceMoments: string[] }): string[] {
  return [...input.facts, ...input.sourceMoments]
    .map(clean)
    .filter(Boolean)
    .filter((value) => !IDENTITY.test(value));
}

/**
 * True only when the supplied material actually contains an occurrence-capable
 * statement. Habitual/profile language such as "walks" or "rolls in grass"
 * does not qualify unless it is anchored by explicit temporal/contextual
 * wording such as "5PM", "yesterday", or "on Friday".
 */
export function hasEpisodeEvidence(input: {
  facts: string[];
  sourceMoments: string[];
}): boolean {
  return fragments(input).some((value) => {
    if (TIME_OR_CONTEXT.test(value) && EXPLICIT_OCCURRENCE.test(value)) return true;
    if (EXPLICIT_OCCURRENCE.test(value) && !HABITUAL_ACTION.test(value)) return true;
    return false;
  });
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

  const episodeEvidence = hasEpisodeEvidence({ facts: input.facts, sourceMoments: input.sourceMoments });
  const timedCount = items.filter((value) => TIME_OR_CONTEXT.test(value)).length;
  const preferenceCount = items.filter((value) => PREFERENCE.test(value)).length;
  const stateCount = items.filter((value) => STATE.test(value)).length;
  const strongRelations = ["before", "after", "causes", "changes"].filter((kind) => relations.has(kind)).length;

  /* Strong graph relationships are useful only when the source contains actual occurrences. */
  if (episodeEvidence && (strongRelations > 0 || timedCount > 0)) return "sequence-film";
  if (episodeEvidence) return "sequence-film";

  if (stateCount > 0 && preferenceCount === 0) return "state";
  return "collection";
}
