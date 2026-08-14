import type {
  UniversalEvidence,
  UniversalEvidenceKind,
  UniversalEvent,
  UniversalExperienceModel,
  UniversalExperienceResult,
  UniversalRelation,
} from "@qre/contracts";

/**
 * UNIVERSAL EXPERIENCE COMPILER V1
 *
 * One reasoning machinery for arbitrary prompts.
 *
 * prompt
 *   -> evidence extraction
 *   -> event sequence
 *   -> relationships
 *   -> change
 *   -> strongest consequence
 *   -> language realization
 *
 * There are intentionally no industry/domain branches in this file.
 * "groomer", "tattoo", "housekeeper", "wedding", etc. are only evidence
 * words. The compiler never chooses a special story mode for them.
 */

const clean = (value: string): string => value.replace(/\s+/g, " ").trim();
const lower = (value: string): string => clean(value).toLowerCase();
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
};

const META_WORD = /\b(?:compiler|cognitive|cognition|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|interaction model|progression model|dynamic behavior|future evolution|mechanic|mechanics)\b/i;
const INSTRUCTION_START = /^(?:please\s+)?(?:make|create|build|write|generate|produce|design|turn|transform|give|tell|show)\b/i;

// Generic grammar vocabulary. These are linguistic classes, not business domains.
const ACTIONS = new Set([
  "add","arrive","arrived","become","became","begin","began","bring","brought","build","built",
  "call","called","capture","captured","carry","carried","change","changed","check","checked",
  "choose","chose","clean","cleaned","close","closed","collect","collected","come","came",
  "complete","completed","cook","cooked","create","created","cut","cutting","decide","decided",
  "deliver","delivered","discover","discovered","do","did","draw","drew","drive","drove",
  "eat","ate","enter","entered","escape","escaped","feel","felt","find","found","finish","finished",
  "fix","fixed","follow","followed","get","got","give","gave","go","went","grab","grabbed",
  "grow","grew","handle","handled","hear","heard","hold","held","install","installed","invite","invited",
  "keep","kept","leave","left","like","liked","live","lived","look","looked","love","loved",
  "make","made","meet","met","move","moved","notice","noticed","open","opened","order","ordered",
  "paint","painted","pick","picked","play","played","prepare","prepared","receive","received",
  "record","recorded","remember","remembered","remove","removed","repair","repaired","return","returned",
  "run","ran","save","saved","see","saw","send","sent","serve","served","share","shared",
  "shake","shook","show","showed","sing","sang","sit","sat","smell","smelled","spoil","spoiled",
  "start","started","stay","stayed","steal","stole","take","took","taste","tasted","teach","taught",
  "touch","touched","travel","traveled","travelled","trim","trimmed","try","tried","turn","turned",
  "use","used","visit","visited","walk","walked","wash","washed","watch","watched","wear","wore",
]);

const ACTION_SUFFIX = /(?:ed|ing|en)$/i;
const STATE_WORDS = new Set([
  "afraid","angry","anxious","awkward","bad","better","broken","calm","comfortable","confused","curious",
  "dark","delighted","different","dirty","excited","familiar","fine","frightened","good","great","happy",
  "hopeful","impatient","interested","joyful","lost","mad","nervous","okay","peaceful","ready","relaxed",
  "sad","scared","secure","suspicious","terrified","thrilled","tired","uncomfortable","uncertain","upset",
  "worried","wrong",
]);

const CAUSAL_ACTIONS = new Set(["steal","stole","take","took","give","gave","remove","removed","add","added","find","found","discover","discovered","change","changed","turn","turned","break","broke","fix","fixed","repair","repaired","finish","finished","complete","completed"]);
const STATE_CHANGE_SIGNALS = new Set(["became","become","changed","different","better","worse","calm","happy","relaxed","scared","suspicious","comfortable","uncomfortable"]);
const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","been","but","by","can","do","for","from","had","has","have",
  "he","her","here","his","i","if","in","into","is","it","its","just","me","my","of","on","or",
  "our","she","so","some","than","that","the","their","them","then","there","they","this","to","was",
  "we","were","what","when","where","which","who","with","would","you","your",
]);

function words(text: string): string[] {
  return clean(text).split(/[^A-Za-z0-9'’-]+/).filter(Boolean);
}

function normalizeWord(value: string): string {
  return lower(value).replace(/[^a-z0-9'’-]/g, "");
}

function isActionWord(word: string): boolean {
  const normalized = normalizeWord(word);
  return ACTIONS.has(normalized) || (normalized.length > 4 && ACTION_SUFFIX.test(normalized) && /[a-z]/i.test(normalized));
}

function splitClauses(prompt: string): string[] {
  const normalized = prompt.replace(/[\r\n]+/g, " ").replace(/\s*;\s*/g, ". ");
  const sentences = normalized.split(/(?<=[.!?])\s+/).map(sentence).filter(Boolean);
  const clauses: string[] = [];

  for (const item of sentences) {
    const parts = item.split(/\s+(?:and then|then|after that|afterwards|but then|and|but|so)\s+/i).map(sentence).filter(Boolean);
    clauses.push(...parts);
  }

  return unique(clauses);
}

function stripInstructionClause(clause: string): string {
  if (!INSTRUCTION_START.test(clause)) return clause;
  return sentence(clause.replace(INSTRUCTION_START, "").replace(/^\s*(?:a|an|the)\s+/i, ""));
}

function firstNamedEntity(text: string): string | undefined {
  const match = text.match(/\b[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,2}\b/);
  const value = match?.[0];
  if (!value) return undefined;
  if (/^(?:Create|Make|Build|Write|Turn|Transform|Give|Tell|Show|Please)\b/.test(value)) return undefined;
  return value;
}

function detectSubject(prompt: string, clauses: string[]): string {
  const named = firstNamedEntity(prompt);
  if (named) return named;

  const first = stripInstructionClause(clauses[0] ?? prompt);
  const tokenList = words(first);

  // Generic possessive subject: "my car", "our anniversary", "this robot".
  const possessive = first.match(/\b(?:my|our|this|that|the)\s+([A-Za-z][A-Za-z0-9'’-]*)/i)?.[1];
  if (possessive && !STOPWORDS.has(lower(possessive)) && !isActionWord(possessive)) return lower(possessive);

  // Generic actor phrase: "a housekeeper cleaned..." / "a musician played...".
  const actor = first.match(/^(?:a|an|the)\s+([A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z][A-Za-z0-9'’-]*){0,2})\s+/i)?.[1];
  if (actor && !actor.split(/\s+/).some(isActionWord)) return lower(actor);

  // Otherwise take the first content token before the first action.
  const actionIndex = tokenList.findIndex(isActionWord);
  const candidates = tokenList.slice(0, actionIndex >= 0 ? actionIndex : tokenList.length)
    .map(normalizeWord)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
  return candidates[0] || "the subject";
}

function objectAfterAction(clause: string, actionIndex: number): string | undefined {
  const tokens = words(clause);
  const remainder = tokens.slice(actionIndex + 1);
  if (!remainder.length) return undefined;

  const cleanTokens = remainder.filter((token) => !STOPWORDS.has(normalizeWord(token)));
  if (!cleanTokens.length) return undefined;
  return cleanTokens.slice(0, 4).join(" ").replace(/^[,.:;-]+|[,.:;-]+$/g, "");
}

function statesIn(text: string): string[] {
  const found: string[] = [];
  for (const token of words(text)) {
    const normalized = normalizeWord(token);
    if (STATE_WORDS.has(normalized)) found.push(normalized);
  }
  return unique(found);
}

function actionsIn(text: string): string[] {
  const found: string[] = [];
  for (const token of words(text)) {
    const normalized = normalizeWord(token);
    if (ACTIONS.has(normalized)) found.push(normalized);
  }
  return unique(found);
}

function detailsIn(text: string, subject: string, action?: string, object?: string): string[] {
  const candidates = unique([
    object ?? "",
    ...words(text).filter((token) => {
      const normalized = normalizeWord(token);
      return normalized.length > 2 && !STOPWORDS.has(normalized) && normalized !== normalizeWord(subject) && !isActionWord(normalized) && !STATE_WORDS.has(normalized);
    }),
  ]);
  return candidates.filter((value) => value.length > 2).slice(0, 6);
}

function eventFromClause(clause: string, subject: string, index: number): UniversalEvent {
  const cleaned = stripInstructionClause(clause);
  const tokens = words(cleaned);
  const actionIndex = tokens.findIndex(isActionWord);
  const action = actionIndex >= 0 ? normalizeWord(tokens[actionIndex]) : undefined;
  const object = actionIndex >= 0 ? objectAfterAction(cleaned, actionIndex) : undefined;
  const states = statesIn(cleaned);
  const details = detailsIn(cleaned, subject, action, object);
  const causal = action ? CAUSAL_ACTIONS.has(action) : false;
  const importance = Math.min(1, 0.2 + details.length * 0.08 + states.length * 0.18 + (causal ? 0.28 : 0));

  return {
    id: `universal-event-${index + 1}`,
    order: index,
    sourceText: cleaned,
    actor: subject,
    action,
    object,
    states,
    details,
    evidenceIds: [],
    importance,
  };
}

function evidenceForEvents(events: UniversalEvent[], subject: string): UniversalEvidence[] {
  const evidence: UniversalEvidence[] = [{
    id: "universal-subject",
    kind: "subject",
    text: subject,
    sourceText: subject,
    order: 0,
    confidence: 0.99,
  }];

  for (const event of events) {
    const sourceText = event.sourceText;
    const candidates: Array<[UniversalEvidenceKind, string]> = [];
    if (event.action) candidates.push(["action", event.action]);
    if (event.object) candidates.push(["object", event.object]);
    for (const state of event.states) candidates.push(["state", state]);
    for (const detail of event.details) candidates.push(["detail", detail]);

    for (const [kind, text] of candidates) {
      const value = clean(text);
      if (!value || META_WORD.test(value)) continue;
      const id = `universal-${kind}-${event.order}-${normalizeWord(value).replace(/[^a-z0-9]+/g, "-")}`;
      evidence.push({ id, kind, text: value, sourceText, order: event.order, confidence: 0.97 });
      event.evidenceIds.push(id);
    }
  }

  return evidence;
}

function buildRelations(events: UniversalEvent[]): UniversalRelation[] {
  const relations: UniversalRelation[] = [];

  for (let index = 1; index < events.length; index += 1) {
    const previous = events[index - 1]!;
    const current = events[index]!;
    relations.push({
      fromEventId: previous.id,
      toEventId: current.id,
      kind: "sequence",
      strength: 0.72,
      reason: "later prompt evidence follows earlier prompt evidence",
    });

    if (previous.states.length && current.states.length && previous.states.at(-1) !== current.states.at(-1)) {
      relations.push({
        fromEventId: previous.id,
        toEventId: current.id,
        kind: "state_change",
        strength: 0.9,
        reason: "the observed state changes between adjacent events",
      });
    }

    if (previous.action && current.action && CAUSAL_ACTIONS.has(current.action)) {
      relations.push({
        fromEventId: previous.id,
        toEventId: current.id,
        kind: "consequence",
        strength: Math.min(0.95, 0.55 + current.importance * 0.4),
        reason: "a consequential action follows an established event",
      });
    }
  }

  return relations;
}

function findChange(events: UniversalEvent[], relations: UniversalRelation[]): UniversalExperienceModel["change"] {
  const stateRelation = relations.find((relation) => relation.kind === "state_change");
  if (stateRelation) {
    const beforeEvent = events.find((event) => event.id === stateRelation.fromEventId);
    const afterEvent = events.find((event) => event.id === stateRelation.toEventId);
    return {
      before: beforeEvent?.states.at(-1),
      after: afterEvent?.states.at(-1),
      triggerEventId: afterEvent?.id,
      confidence: stateRelation.strength,
    };
  }

  const negative = events.find((event) => event.states.some((state) => ["afraid","anxious","awkward","confused","lost","nervous","scared","suspicious","uncertain","upset","worried","bad","broken"].includes(state)));
  const positive = [...events].reverse().find((event) => event.states.some((state) => ["calm","comfortable","delighted","excited","good","great","happy","joyful","peaceful","ready","relaxed","safe","thrilled","better"].includes(state)));
  if (negative && positive) {
    return {
      before: negative.states[0],
      after: positive.states.at(-1),
      triggerEventId: positive.id,
      confidence: 0.84,
    };
  }
  return { confidence: 0.35 };
}

function strongestConsequence(events: UniversalEvent[], relations: UniversalRelation[]): UniversalExperienceModel["strongestConsequence"] {
  const candidates = relations.filter((relation) => relation.kind === "consequence");
  if (!candidates.length) {
    const event = [...events].sort((a, b) => b.importance - a.importance)[0];
    return event ? { eventId: event.id, strength: event.importance, reason: "most distinctive observed event" } : undefined;
  }

  const best = [...candidates].sort((a, b) => b.strength - a.strength)[0]!;
  return { eventId: best.toEventId, strength: best.strength, reason: best.reason };
}

function buildModel(prompt: string): UniversalExperienceModel {
  const clauses = splitClauses(prompt).map(stripInstructionClause).filter(Boolean);
  const subject = detectSubject(prompt, clauses);
  const events = clauses.map((clause, index) => eventFromClause(clause, subject, index));
  const evidence = evidenceForEvents(events, subject);
  const relations = buildRelations(events);
  const change = findChange(events, relations);
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

function subjectMention(line: string, subject: string): boolean {
  return lower(line).includes(lower(subject));
}

function objectPhrase(event: UniversalEvent): string {
  return event.object ? clean(event.object).replace(/\b(?:because|while|after|before)\b.*$/i, "") : "";
}

function realizeConsequence(event: UniversalEvent, subject: string): string {
  const object = objectPhrase(event);
  const action = event.action ?? "did something";

  if (event.object && /^(?:stole|grabbed|took)\b/i.test(action)) {
    return `Then ${subject} ${action} ${object} like it was part of the deal.`;
  }
  if (event.object && /^(?:found|discovered|noticed)\b/i.test(action)) {
    return `Then ${subject} ${action} ${object}, and that changed what happened next.`;
  }
  if (event.object && /^(?:gave|shared|added|removed|fixed|repaired|changed|turned)\b/i.test(action)) {
    return `Then ${subject} ${action} ${object}, and the result became visible.`;
  }
  if (event.object) return `Then ${subject} ${action} ${object}, which changed the shape of the day.`;
  return `Then ${subject} ${action}, and that became the part that mattered.`;
}

function realizeEvent(event: UniversalEvent, subject: string): string {
  const object = objectPhrase(event);
  const action = event.action;

  if (event.states.length && action) {
    const state = event.states[0];
    return `${subject} ${action}${object ? ` ${object}` : ""}, still feeling ${state}.`;
  }
  if (action && object) return `${cap(subject)} ${action} ${object}.`;
  if (action) return `${cap(subject)} ${action}.`;
  if (event.details[0]) return `${cap(event.details[0])} entered the picture.`;
  return cap(event.sourceText);
}

function realizeChange(model: UniversalExperienceModel): string | undefined {
  const change = model.change;
  if (!change.before || !change.after) return undefined;
  if (model.events.length >= 2) {
    const trigger = model.events.find((event) => event.id === change.triggerEventId);
    const driver = trigger?.object || trigger?.action;
    if (driver) return `${cap(driver)} changed the mood.`;
  }
  return `The mood changed from ${change.before} to ${change.after}.`;
}

function realizePayoff(model: UniversalExperienceModel): string | undefined {
  const final = model.events.at(-1);
  if (!final) return undefined;
  const positive = final.states.find((state) => ["calm","comfortable","delighted","excited","good","great","happy","joyful","peaceful","ready","relaxed","safe","thrilled","better"].includes(state));
  if (positive) return `By the end, the whole ordeal had apparently been forgiven.`;
  if (final.states.length) return `By the end, the ${final.states.at(-1)} feeling was still there.`;
  return undefined;
}

function realize(model: UniversalExperienceModel): string[] {
  const lines: string[] = [];
  const first = model.events[0];
  const strongestId = model.strongestConsequence?.eventId;
  const strongest = strongestId ? model.events.find((event) => event.id === strongestId) : undefined;
  const changeLine = realizeChange(model);
  const payoff = realizePayoff(model);

  if (first) lines.push(realizeEvent(first, model.subject));
  if (changeLine) lines.push(changeLine);

  if (strongest && strongest.id !== first?.id) lines.push(realizeConsequence(strongest, model.subject));

  if (payoff && !lines.some((line) => line.toLowerCase() === payoff.toLowerCase())) lines.push(payoff);

  if (lines.length < 3) {
    for (const event of model.events.slice(1)) {
      const candidate = realizeEvent(event, model.subject);
      if (!lines.some((line) => line.toLowerCase() === candidate.toLowerCase())) lines.push(candidate);
      if (lines.length >= 3) break;
    }
  }

  // Subject repetition penalty: once the reader knows who is acting,
  // shift later sentences toward the consequence/detail rather than
  // starting every line with the same noun.
  return lines
    .map((line, index) => index === 0 ? line : line.replace(new RegExp(`^${model.subject}\\s+`, "i"), ""))
    .map(sentence)
    .filter(Boolean)
    .slice(0, 4);
}

export function compileUniversalExperience(prompt: string): UniversalExperienceResult {
  const normalized = clean(prompt);
  if (!normalized) {
    return {
      version: "universal-v1",
      prompt: "",
      model: {
        subject: "the subject",
        evidence: [],
        events: [],
        relations: [],
        change: { confidence: 0 },
        strongestDetails: [],
      },
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
