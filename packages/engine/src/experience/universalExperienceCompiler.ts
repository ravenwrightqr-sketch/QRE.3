import type {
  UniversalEvidence,
  UniversalEvidenceKind,
  UniversalEvent,
  UniversalExperienceModel,
  UniversalExperienceResult,
  UniversalRelation,
} from "@qre/contracts";

/**
 * CANONICAL UNIVERSAL EXPERIENCE ENGINE
 *
 * One reasoning path for every prompt:
 *
 * prompt
 *   -> observed evidence
 *   -> event units
 *   -> relationships
 *   -> change / turn
 *   -> strongest consequence
 *   -> concise human language
 *
 * There are NO industry branches here. Domain words are evidence only.
 */

const clean = (value: string): string => value.replace(/\s+/g, " ").trim();
const lower = (value: string): string => clean(value).toLowerCase();
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const META = /\b(?:compiler|cognitive|cognition|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|interaction model|progression model|dynamic behavior|future evolution|mechanic|mechanics)\b/i;
const INSTRUCTION = /^(?:please\s+)?(?:make|create|build|write|generate|produce|design|turn|transform|give|tell|show)\b/i;

/* -------------------------------------------------------------------------- */
/* UNIVERSAL LEXICAL CLASSES                                                 */
/* -------------------------------------------------------------------------- */

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
  "afraid","angry","anxious","awkward","bad","better","broken","calm","comfortable","confused","curious","dark",
  "delighted","different","dirty","enjoyed","excited","familiar","fine","frightened","good","great","happy","hopeful",
  "impatient","interested","joyful","liked","loved","lost","mad","nervous","okay","peaceful","ready","relaxed","sad",
  "scared","secure","suspicious","terrified","thrilled","tired","uncomfortable","uncertain","upset","worried","wrong",
]);

const POSITIVE = new Set(["better","calm","comfortable","delighted","enjoyed","excited","fine","good","great","happy","hopeful","interested","joyful","liked","loved","okay","peaceful","ready","relaxed","secure","thrilled"]);
const NEGATIVE = new Set(["afraid","angry","anxious","awkward","bad","broken","confused","dirty","frightened","lost","mad","nervous","sad","scared","suspicious","terrified","tired","uncomfortable","uncertain","upset","worried","wrong"]);
const CONSEQUENTIAL = new Set(["add","added","change","changed","complete","completed","discover","discovered","find","found","fix","fixed","finish","finished","give","gave","grab","grabbed","remove","removed","repair","repaired","steal","stole","take","took","turn","turned"]);

const STOP = new Set([
  "a","an","and","are","as","at","be","been","but","by","can","do","for","from","had","has","have","he","her",
  "here","his","i","if","in","into","is","it","its","just","me","my","of","on","or","our","she","so","some",
  "than","that","the","their","them","then","there","they","this","to","was","we","were","what","when","where",
  "which","who","with","would","you","your",
]);

const BORING_INTENT_WORDS = new Set(["experience","story","memory","something","anything","thing","things","moment","moments"]);

function words(text: string): string[] {
  return clean(text).split(/[^A-Za-z0-9'’-]+/).filter(Boolean);
}

function norm(value: string): string {
  return lower(value).replace(/[^a-z0-9'’-]/g, "");
}

function isVerb(value: string): boolean {
  const word = norm(value);
  return VERBS.has(word) || (word.length > 5 && /(?:ed|ing)$/i.test(word));
}

function isState(value: string): boolean {
  return STATES.has(norm(value));
}

function statesIn(text: string): string[] {
  return unique(words(text).map(norm).filter(isState));
}

function actionsIn(text: string): string[] {
  return unique(words(text).map(norm).filter((word) => VERBS.has(word)));
}

/* -------------------------------------------------------------------------- */
/* PROMPT PARSING                                                             */
/* -------------------------------------------------------------------------- */

function stripInstruction(text: string): string {
  if (!INSTRUCTION.test(text)) return sentence(text);
  return sentence(
    text
      .replace(INSTRUCTION, "")
      .replace(/^\s*(?:a|an|the)\s+/i, ""),
  );
}

function splitPrompt(prompt: string): string[] {
  const sentences = prompt
    .replace(/[\r\n]+/g, " ")
    .split(/(?<=[.!?])\s+|\s*;\s*/)
    .map(sentence)
    .filter(Boolean);

  const result: string[] = [];
  const coordinator = /\s+(?:and then|then|after that|afterwards|but then)\s+/i;

  for (const raw of sentences) {
    const parts = raw.split(coordinator).map(sentence).filter(Boolean);
    for (const part of parts) {
      // A comma is a discourse boundary only when the next phrase looks like
      // a new clause (subject/pronoun + verb). This prevents destroying things
      // such as "a house, after the repair" into nonsense fragments.
      const commaParts = part.split(/,\s+(?=(?:and\s+)?(?:[A-Z][A-Za-z'’-]*|I|he|she|they|we|the|a|an)\s+[A-Za-z'’-]+)/);
      if (commaParts.length > 1) {
        result.push(...commaParts.map(sentence).filter(Boolean));
      } else {
        result.push(part);
      }
    }
  }

  return unique(result);
}

function firstNamed(text: string): string | undefined {
  const match = text.match(/\b[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,2}\b/);
  const value = match?.[0];
  if (!value) return undefined;
  if (/^(?:Create|Make|Build|Write|Generate|Produce|Design|Turn|Transform|Give|Tell|Show|Please)$/i.test(value)) return undefined;
  return value;
}

function detectSubject(prompt: string, clauses: string[]): string {
  const named = firstNamed(prompt);
  if (named) return named;

  const first = stripInstruction(clauses[0] ?? prompt);

  // Explicit subject first: "my dog", "our house", "this watch".
  const possessive = first.match(/\b(?:my|our|this|that|the)\s+([A-Za-z][A-Za-z0-9'’-]*)/i)?.[1];
  if (possessive && !STOP.has(norm(possessive)) && !isVerb(possessive)) return possessive.toLowerCase();

  // Explicit actor: "a housekeeper...", "a musician...", "the guests...".
  const actor = first.match(/^(?:a|an|the)\s+([A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z][A-Za-z0-9'’-]*){0,2})\s+/i)?.[1];
  if (actor && !actor.split(/\s+/).some(isVerb)) return actor.toLowerCase();

  const tokenList = words(first);
  const actionIndex = tokenList.findIndex(isVerb);
  const beforeAction = tokenList
    .slice(0, actionIndex >= 0 ? actionIndex : tokenList.length)
    .map(norm)
    .filter((word) => word.length > 2 && !STOP.has(word) && !BORING_INTENT_WORDS.has(word));

  return beforeAction[0] || "the subject";
}

function objectPhrase(text: string, actionIndex: number): string | undefined {
  const remainder = words(text).slice(actionIndex + 1);
  const kept: string[] = [];

  for (const token of remainder) {
    const word = norm(token);
    if (isState(word)) break;
    if (/^(?:because|while|after|before|when|which|that)$/i.test(word)) break;
    kept.push(token);
  }

  const value = kept.join(" ").replace(/^[,.:;-]+|[,.:;-]+$/g, "").trim();
  if (!value || /^\b(?:the|a|an)\s+(?:day|moment|experience|story|thing)\b$/i.test(value)) return undefined;
  return value;
}

function detailsFor(text: string, subject: string, action: string | undefined, object: string | undefined, states: string[]): string[] {
  const excluded = new Set([
    norm(subject),
    action ? norm(action) : "",
    ...states,
  ]);

  const atomic = words(text)
    .map(norm)
    .filter((word) => word.length > 2 && !STOP.has(word) && !excluded.has(word) && !isVerb(word) && !isState(word));

  return unique([object ?? "", ...atomic]).slice(0, 8);
}

function eventFromClause(raw: string, subject: string, order: number): UniversalEvent {
  const sourceText = stripInstruction(raw);
  const tokenList = words(sourceText);
  const actionIndex = tokenList.findIndex(isVerb);
  const action = actionIndex >= 0 ? norm(tokenList[actionIndex]!) : undefined;
  const object = actionIndex >= 0 ? objectPhrase(sourceText, actionIndex) : undefined;
  const states = statesIn(sourceText);
  const details = detailsFor(sourceText, subject, action, object, states);
  const causal = action ? CONSEQUENTIAL.has(action) : false;
  const importance = Math.min(1, 0.25 + details.length * 0.07 + states.length * 0.2 + (causal ? 0.25 : 0));

  return {
    id: `universal-event-${order + 1}`,
    order,
    sourceText,
    actor: subject,
    action,
    object,
    states,
    details,
    evidenceIds: [],
    importance,
  };
}

/* -------------------------------------------------------------------------- */
/* EVIDENCE / RELATION REASONING                                              */
/* -------------------------------------------------------------------------- */

function buildEvidence(events: UniversalEvent[], subject: string): UniversalEvidence[] {
  const evidence: UniversalEvidence[] = [{
    id: "universal-subject",
    kind: "subject",
    text: subject,
    sourceText: subject,
    order: 0,
    confidence: 1,
  }];

  const add = (kind: UniversalEvidenceKind, text: string, sourceText: string, order: number) => {
    const value = clean(text);
    if (!value || META.test(value)) return;
    const id = `universal-${kind}-${order}-${norm(value).replace(/[^a-z0-9]+/g, "-")}`;
    evidence.push({ id, kind, text: value, sourceText, order, confidence: 0.98 });
    return id;
  };

  for (const event of events) {
    const ids: string[] = [];
    if (event.action) {
      const id = add("action", event.action, event.sourceText, event.order);
      if (id) ids.push(id);
    }
    if (event.object) {
      const id = add("object", event.object, event.sourceText, event.order);
      if (id) ids.push(id);
    }
    for (const state of event.states) {
      const id = add("state", state, event.sourceText, event.order);
      if (id) ids.push(id);
    }
    for (const detail of event.details) {
      const id = add("detail", detail, event.sourceText, event.order);
      if (id) ids.push(id);
    }
    event.evidenceIds = unique(ids);
  }

  return evidence;
}

function buildRelations(events: UniversalEvent[]): UniversalRelation[] {
  const relations: UniversalRelation[] = [];

  for (let i = 1; i < events.length; i += 1) {
    const previous = events[i - 1]!;
    const current = events[i]!;

    relations.push({
      fromEventId: previous.id,
      toEventId: current.id,
      kind: "sequence",
      strength: 0.7,
      reason: "observed order in prompt",
    });

    const before = previous.states.at(-1);
    const after = current.states.at(-1);
    if (before && after && before !== after) {
      relations.push({
        fromEventId: previous.id,
        toEventId: current.id,
        kind: "state_change",
        strength: 0.92,
        reason: "observed state changed between prompt events",
      });
    }

    if (current.action && CONSEQUENTIAL.has(current.action)) {
      relations.push({
        fromEventId: previous.id,
        toEventId: current.id,
        kind: "consequence",
        strength: Math.min(0.97, 0.6 + current.importance * 0.35),
        reason: "distinctive consequential action follows earlier event",
      });
    }
  }

  return relations;
}

function buildChange(events: UniversalEvent[], relations: UniversalRelation[]): UniversalExperienceModel["change"] {
  const stateRelation = relations.find((relation) => relation.kind === "state_change");
  if (stateRelation) {
    const before = events.find((event) => event.id === stateRelation.fromEventId)?.states.at(-1);
    const after = events.find((event) => event.id === stateRelation.toEventId)?.states.at(-1);
    return { before, after, triggerEventId: stateRelation.toEventId, confidence: stateRelation.strength };
  }

  const negative = events.find((event) => event.states.some((state) => NEGATIVE.has(state)));
  const positive = [...events].reverse().find((event) => event.states.some((state) => POSITIVE.has(state)));
  if (negative && positive) {
    return { before: negative.states.find((state) => NEGATIVE.has(state)), after: positive.states.find((state) => POSITIVE.has(state)), triggerEventId: positive.id, confidence: 0.84 };
  }

  return { confidence: 0.25 };
}

function strongestConsequence(events: UniversalEvent[], relations: UniversalRelation[]): UniversalExperienceModel["strongestConsequence"] {
  const consequences = relations
    .filter((relation) => relation.kind === "consequence")
    .sort((a, b) => b.strength - a.strength);

  if (consequences[0]) {
    return {
      eventId: consequences[0].toEventId,
      reason: consequences[0].reason,
      strength: consequences[0].strength,
    };
  }

  const distinctive = [...events].sort((a, b) => b.importance - a.importance)[0];
  return distinctive
    ? { eventId: distinctive.id, reason: "strongest observed event", strength: distinctive.importance }
    : undefined;
}

function buildModel(prompt: string): UniversalExperienceModel {
  const parsed = splitPrompt(prompt);
  const cleaned = parsed.length ? parsed : [prompt];
  const subject = detectSubject(prompt, cleaned);
  const events = cleaned.map((clause, order) => eventFromClause(clause, subject, order));
  const evidence = buildEvidence(events, subject);
  const relations = buildRelations(events);
  const change = buildChange(events, relations);
  const strongest = strongestConsequence(events, relations);

  return {
    subject,
    evidence,
    events,
    relations,
    change,
    strongestConsequence: strongest,
    strongestDetails: unique(events.flatMap((event) => event.details)).sort((a, b) => b.length - a.length).slice(0, 8),
  };
}

/* -------------------------------------------------------------------------- */
/* HUMAN LANGUAGE REALIZATION                                                 */
/* -------------------------------------------------------------------------- */

const POSITIVE_MOOD = new Set(["calm","comfortable","delighted","enjoyed","excited","fine","good","great","happy","joyful","liked","loved","peaceful","ready","relaxed","secure","thrilled","better"]);

function article(value: string): string {
  const text = sentence(value).toLowerCase();
  if (!text) return "";
  if (/^(?:a|an|the)\b/.test(text)) return text;
  return /^[aeiou]/i.test(text) ? `an ${text}` : `a ${text}`;
}

function eventActionSentence(event: UniversalEvent, subject: string): string {
  const action = event.action;
  const object = event.object ? sentence(event.object) : "";

  if (action && object) return `${cap(subject)} ${action} ${object}.`;
  if (action) return `${cap(subject)} ${action}.`;
  if (event.details[0]) return `${cap(event.details[0])} entered the picture.`;
  return cap(event.sourceText);
}

function changeSentence(model: UniversalExperienceModel): string | undefined {
  const { before, after, triggerEventId } = model.change;
  if (!before || !after) return undefined;
  const trigger = triggerEventId ? model.events.find((event) => event.id === triggerEventId) : undefined;
  const triggerObject = trigger?.object;
  const triggerAction = trigger?.action;

  if (triggerObject) return `${cap(triggerObject)} changed the mood.`;
  if (triggerAction && triggerAction !== "become" && triggerAction !== "became") return `${cap(triggerAction)} changed the mood.`;
  return `The mood shifted from ${before} to ${after}.`;
}

function consequenceSentence(model: UniversalExperienceModel): string | undefined {
  const eventId = model.strongestConsequence?.eventId;
  if (!eventId) return undefined;
  const event = model.events.find((item) => item.id === eventId);
  if (!event) return undefined;

  if (event.object && /^(?:steal|stole|take|took)\b/i.test(event.action ?? "")) {
    return `Then ${lower(model.subject)} ${event.action} ${sentence(event.object).toLowerCase()} like compensation was part of the package.`;
  }
  if (event.object && /^(?:find|found|discover|discovered|notice|noticed)\b/i.test(event.action ?? "")) {
    return `Then ${lower(model.subject)} ${event.action} ${sentence(event.object).toLowerCase()}, and that changed what came next.`;
  }
  if (event.object) {
    return `Then ${lower(model.subject)} ${event.action ?? "did"} ${sentence(event.object).toLowerCase()}, and that became the part that mattered.`;
  }
  if (event.details[0]) return `Then ${lower(model.subject)} ${event.action ?? "moved"}, with ${article(event.details[0])} becoming the detail that stayed.`;
  return undefined;
}

function payoffSentence(model: UniversalExperienceModel): string | undefined {
  const final = model.events.at(-1);
  if (!final) return undefined;

  const positive = [...final.states].reverse().find((state) => POSITIVE_MOOD.has(state));
  if (positive) return "By the end, the whole ordeal had apparently been forgiven.";

  if (final.object && final.action) return `By the end, ${sentence(final.action).toLowerCase()} ${sentence(final.object).toLowerCase()} was the part worth remembering.`;
  if (final.details[0]) return `By the end, ${article(final.details[0])} was the detail that stayed.`;
  return "By the end, the ending had earned its place in the story.";
}

function rotateRepeatedSubjects(lines: string[], subject: string): string[] {
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefix = new RegExp(`^${escaped}\\s+`, "i");
  let direct = 0;

  return lines.map((line, index) => {
    if (index === 0) {
      direct = prefix.test(line) ? 1 : 0;
      return line;
    }
    if (prefix.test(line)) {
      direct += 1;
      if (direct >= 3) return line.replace(prefix, "");
    }
    return line;
  });
}

function realize(model: UniversalExperienceModel): string[] {
  const lines: string[] = [];
  const first = model.events[0];

  if (first) lines.push(eventActionSentence(first, model.subject));

  const change = changeSentence(model);
  if (change) lines.push(change);

  const consequence = consequenceSentence(model);
  if (consequence && !lines.some((line) => lower(line) === lower(consequence))) lines.push(consequence);

  const payoff = payoffSentence(model);
  if (payoff && lines.length < 4) lines.push(payoff);

  if (lines.length < 4) {
    for (const event of model.events.slice(1)) {
      const line = eventActionSentence(event, model.subject);
      if (!lines.some((existing) => lower(existing) === lower(line))) lines.push(line);
      if (lines.length >= 4) break;
    }
  }

  return rotateRepeatedSubjects(unique(lines).map(sentence).map((line) => `${line}.`), model.subject).slice(0, 4);
}

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

export function compileUniversalExperience(prompt: string): UniversalExperienceResult {
  const normalized = clean(prompt);
  if (!normalized) {
    return {
      version: "universal-v1",
      prompt: "",
      model: { subject: "the subject", evidence: [], events: [], relations: [], change: { confidence: 0 }, strongestDetails: [] },
      lines: [],
    };
  }

  const model = buildModel(normalized);
  return {
    version: "universal-v1",
    prompt: normalized,
    model,
    lines: realize(model),
  };
}
