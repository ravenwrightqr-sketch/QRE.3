import type {
  RealityEntityContinuity,
  RealityEvent,
  RealityEventStructure,
  RealityEvidence,
  RealityGraph,
  RealityPattern,
  RealityRelation,
} from "@qre/contracts";
import { looksLikeIdentityAssertion } from "@qre/contracts";

/*
 * QRE FILE ROLE: RealityGraph construction.
 * AUTHORITY: supplied reality only.
 * ALLOWED: derive explainable semantic structure from explicit facts/moments.
 * FORBIDDEN: invented events, invented causality, generic predicates presented as truth.
 * MEDIA RULE: media is an artifact, not an inferred human action.
 *
 * The graph is intentionally rich. Truth stays in evidence/event labels;
 * everything below is derived scaffolding for cognition, movie search and
 * creative framing. Derived structure may suggest meaning, never assert it.
 */

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = (value: string): string => clean(value).toLowerCase();
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const STOP = new Set(["the","a","an","and","or","but","to","of","in","on","at","for","with","from","by","through","after","before","then","now","very","just","still","again","this","that","it","is","are","was","were","be","been","being","as","into","my","your","our","their","his","her","its","he","she","they","them","you","we","me"]);
const GENERIC = new Set(["likes","like","loves","love","is","are","was","were","be","been","has","have","had","does","do","did","gets","get","got","makes","make","made","goes","go","went","walks","walk","walked"]);
const ACTION_RE = /\b(?:arriv(?:e|ed|es|ing)|return(?:ed|s|ing)?|came|come|left|leave|went|go|met|meet|talk(?:ed|s|ing)?|spoke|said|did|made|make|gave|give|get|got|found|find|lost|lose|clean(?:ed|s|ing)?|finished|finish|started|start|opened|close(?:d|s|ing)?|walk(?:ed|s|ing)?|ran|run|drove|drive|ate|eat|drank|drink|kiss(?:ed|es|ing)?|married|celebrated|played|play|worked|work|visited|visit|bought|buy|sold|sell|built|build|fixed|fix|paint(?:ed|s|ing)?|wore|wear|used|use|shook|shake|chewed|chew|connected|connect|stayed|stay|wait(?:ed|s|ing)?|called|call|laughed|laugh(?:ed|s)?|cried|cry(?:ing|ied)?|look(?:ed|s|ing)?|felt|feel|seemed|seem|became|become|changed|change|repaired|repair|tested|test|selected|select|cut|shaped|polished|delivered|welcomed|checked|booked|arranged|recommended|guided|updated|reserved|approved|groomed|dyed|tailored|installed|picked)\b/gi;
const ACTIONS = new RegExp(ACTION_RE.source, "i");
const STATE_WORDS = /\b(?:happy|sad|angry|calm|excited|nervous|scared|proud|confident|fun|funny|wild|goofy|sweet|gentle|fierce|stubborn|tired|quiet|loud|beautiful|strange|weird|odd|dark|bright|new|old|young|male|female|single|married|late|early|ready|clean|dirty|broken|fixed|alive|gone|back|again|first|second|third|different|dapper|fabulous|cool|sharp|open|closed|working|prepared|available|restored|renewed)\b/i;
const STATE_RE = new RegExp(STATE_WORDS.source, "i");
const TIME_WORDS = /\b(?:today|yesterday|tomorrow|morning|afternoon|evening|night|later|earlier|first|again|second|third|last|next|at \d|\d{1,2}:\d{2})\b/i;
const RECURRENCE_WORDS = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|once more|weekly|daily|every|remember(?:ed|s|ing)?|same)\b/i;
const OPPOSITES: readonly [string, string][] = [
  ["nervous", "confident"], ["nervous", "calm"], ["broken", "working"], ["broken", "fixed"],
  ["dirty", "clean"], ["old", "new"], ["late", "early"], ["alone", "together"],
  ["lost", "found"], ["quiet", "loud"], ["sad", "happy"], ["scared", "safe"], ["closed", "open"],
];
const SEMANTIC_TAGS: readonly [RegExp, string][] = [
  [/\b(?:arrive|arrived|came|come|entered|check-?in)\b/i, "arrival"],
  [/\b(?:left|leave|depart|departure|checked out|check-?out)\b/i, "departure"],
  [/\b(?:return|returned|again|back|weekly|daily|every|remember(?:ed|s|ing)?|same)\b/i, "recurrence"],
  [/\b(?:start|started|began|begin|process|worked|working)\b/i, "process"],
  [/\b(?:finish|finished|complete|completed|done)\b/i, "completion"],
  [/\b(?:repair|repaired|fixed|restored|renewed)\b/i, "repair"],
  [/\b(?:clean|cleaned|groomed|washed|polished)\b/i, "care"],
  [/\b(?:approved|approval|accepted|confirmed)\b/i, "approval"],
  [/\b(?:reserved|reservation|booked|arranged|guided|access|keys?)\b/i, "access"],
  [/\b(?:cut|shaped|built|made|crafted|handmade|tailored)\b/i, "craft"],
  [/\b(?:before|after|changed|new|different|fabulous|working|restored|renewed)\b/i, "transformation"],
  [/\b(?:watch|watched|watching|looked|observed|noticed)\b/i, "observation"],
  [/\b(?:mirror|reflection|photo|picture|image|video)\b/i, "reflection"],
  [/\b(?:nervous|scared|uncertain|strange|weird|odd|quiet)\b/i, "uncertainty"],
];

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
  return unique(fragments);
}

function contentTokens(text: string): string[] {
  return [...new Set(lower(text).replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3 && !STOP.has(token)))].slice(0, 24);
}

function meaningfulContentTokens(text: string, subject?: string): string[] {
  const subjectTokens = new Set(contentTokens(subject ?? ""));
  return contentTokens(text).filter((token) => !GENERIC.has(token) && !subjectTokens.has(token));
}

function capitalizedEntities(text: string): string[] {
  return unique(text.match(/\b[A-Z][A-Za-z0-9'’-]{1,}\b/g) ?? []).slice(0, 8);
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

function extractActions(label: string): string[] {
  return unique([...label.toLowerCase().matchAll(ACTION_RE)].map((match) => match[0])).slice(0, 8);
}

function extractStates(label: string): string[] {
  const candidates = [...label.toLowerCase().matchAll(new RegExp(STATE_WORDS.source, "gi"))].map((match) => match[0]);
  return unique(candidates).slice(0, 8);
}

function extractObjects(label: string, subject?: string): string[] {
  const actionMatches = [...label.matchAll(ACTION_RE)];
  const firstAction = actionMatches[0];
  if (!firstAction || firstAction.index === undefined) return meaningfulContentTokens(label, subject).slice(0, 6);
  const remainder = label.slice(firstAction.index + firstAction[0].length);
  return meaningfulContentTokens(remainder, subject)
    .filter((token) => !extractActions(token).length && !STATE_RE.test(token))
    .slice(0, 6);
}

function semanticTags(label: string): string[] {
  return unique(SEMANTIC_TAGS.filter(([pattern]) => pattern.test(label)).map(([, tag]) => tag));
}
const IMPLICIT_SUBJECT_PREDICATE =
  /^(?:likes?|loves?|hates?|prefers?|wants?|enjoys?|adores?)\b/i;

function hasImplicitSubjectPredicate(label: string): boolean {
  return IMPLICIT_SUBJECT_PREDICATE.test(clean(label));
}
/**
 * A global subject is the default referent only when the source event does
 * not explicitly introduce another grammatical actor/entity. This prevents
 * ambient session facts from becoming false subject facts.
 */
function subjectParticipates(label: string, subject?: string): boolean {
  const normalizedLabel = clean(label);
  const normalizedSubject = clean(subject);
  if (!normalizedSubject || !normalizedLabel) return false;
  if (normalizedLabel.toLowerCase().includes(normalizedSubject.toLowerCase())) return true;
  if (hasImplicitSubjectPredicate(normalizedLabel)) {
  return true;
  }
  if (/^(?:the|a|an)\s+[A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z][A-Za-z0-9'’-]*){0,2}\s+(?:arriv|return|came|come|left|leave|went|go|met|meet|talk|spoke|said|did|made|make|gave|give|get|got|found|find|lost|lose|clean|finished|finish|started|start|opened|closed|walk|ran|run|drove|drive|ate|eat|drank|drink|kiss|married|celebrated|played|worked|visited|bought|sold|built|fixed|painted|wore|used|shook|chewed|connected|stayed|waited|called|laughed|cried|looked|felt|seemed|became|changed|repaired|tested|selected|cut|shaped|polished|delivered|welcomed|checked|booked|arranged|recommended|guided|updated|reserved|approved|groomed|dyed|tailored|installed|picked)\b/i.test(normalizedLabel)) {
    return false;
  }

  if (/^(?:the|a|an)\s+.+\s+(?:is|are|was|were|being|been)\s+\w/i.test(normalizedLabel)) return false;

  if (/^(?:arrive|return|came|come|left|leave|went|go|met|meet|talk|spoke|said|did|made|make|gave|give|get|got|found|find|lost|lose|clean|finished|finish|started|start|opened|closed|walk|ran|run|drove|drive|ate|eat|drank|drink|kiss|married|celebrated|played|worked|visited|bought|sold|built|fixed|painted|wore|used|shook|chewed|connected|stayed|waited|called|laughed|cried|looked|felt|seemed|became|changed|repaired|tested|selected|cut|shaped|polished|delivered|welcomed|checked|booked|arranged|recommended|guided|updated|reserved|approved|groomed|dyed|tailored|installed|picked)\b/i.test(normalizedLabel)) return true;
  if (/^(?:they|he|she|we|you)\b/i.test(normalizedLabel)) return true;
  if (/^(?:is|are|was|were|feels?|felt|seems?|seemed|became|looks?|looked)\b/i.test(normalizedLabel)) return true;

  return false;
}

function implicitSubjectClue(label: string, subject?: string): boolean {
  const normalizedLabel = clean(label);
  if (!clean(subject) || !normalizedLabel) return false;
  if (subjectParticipates(normalizedLabel, subject)) return true;
  if (/^(?:he|she|they|we|you|someone|somebody|the|a|an)\b/i.test(normalizedLabel)) return false;
  if (/^[A-Z][A-Za-z0-9'’-]+\b/.test(normalizedLabel)) return false;
  const tokens = contentTokens(normalizedLabel);
  return tokens.length > 0 && tokens.length <= 6;
}

function objectPhrases(label: string, subject?: string): string[] {
  const candidates: string[] = [];
  const pattern = /\b(?:a|an|the|same)\s+([a-z][a-z0-9'’-]*(?:\s+[a-z][a-z0-9'’-]*){0,2})/gi;
  for (const match of label.matchAll(pattern)) {
    const words = clean(match[1]).split(/\s+/).filter((word) => {
      const token = word.toLowerCase();
      return token && !STOP.has(token) && !GENERIC.has(token) && !STATE_RE.test(token) && !ACTIONS.test(token);
    });
    const phrase = clean(words.join(" "));
    if (phrase && phrase.length > 2) candidates.push(phrase);
  }
  return unique(candidates.filter((value) => !subject || lower(value) !== lower(subject))).slice(0, 8);
}

function event(label: string, sourceIds: string[], subject: string | undefined, place: string | undefined, index: number): RealityEvent {
  const concepts = contentTokens(label);
  const subjectInEvent = implicitSubjectClue(label, subject);
  const entities = unique([
    ...(subjectInEvent && subject ? [clean(subject)] : []),
    ...capitalizedEntities(label),
    ...objectPhrases(label, subject),
    ...concepts.slice(0, 5),
  ].filter(Boolean)).slice(0, 12);
  const kind = eventKind(label);
  return {
    id: `event-${index + 1}`,
    label: clean(label),
    sourceIds,
    entities,
    place: clean(place) || undefined,
    emotionalState: kind === "state" ? clean(label) : extractStates(label)[0],
    salient: true,
    provenance: "explicit",
  };
}

function addRelation(relations: RealityRelation[], from: string, to: string, kind: RealityRelation["kind"], strength: number): void {
  if (from === to) return;
  if (relations.some((relation) => relation.from === from && relation.to === to && relation.kind === kind)) return;
  relations.push({ from, to, kind, strength: Math.max(0, Math.min(1, strength)) });
}

/** Explicit clocks are factual; all other order remains non-temporal. */
function buildTemporalRelations(events: RealityEvent[], relations: RealityRelation[]): void {
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
}
function buildStructuralRelations(
  events: RealityEvent[],
  subject: string | undefined,
): RealityRelation[] {
  const relations: RealityRelation[] = [];

  for (let i = 0; i < events.length; i += 1) {
    const current = events[i]!;
    const currentTokens = meaningfulContentTokens(
      current.label,
      subject,
    );
    const currentSet = new Set(currentTokens);
    const currentStates = extractStates(
      current.label,
    );
    const currentActions = extractActions(
      current.label,
    );
    const currentObjects = unique([
      ...extractObjects(
        current.label,
        subject,
      ),
      ...objectPhrases(
        current.label,
        subject,
      ),
    ]);

    const currentSubject =
      implicitSubjectClue(
        current.label,
        subject,
      );

    const currentPreference =
      hasImplicitSubjectPredicate(
        current.label,
      );

    const currentIdentity =
      looksLikeIdentityAssertion(
        current.label,
      );

    for (
      let j = i + 1;
      j < events.length;
      j += 1
    ) {
      const other = events[j]!;

      const otherTokens =
        meaningfulContentTokens(
          other.label,
          subject,
        );

      const otherSet =
        new Set(otherTokens);

      const otherStates =
        extractStates(
          other.label,
        );

      const otherActions =
        extractActions(
          other.label,
        );

      const otherObjects =
        unique([
          ...extractObjects(
            other.label,
            subject,
          ),
          ...objectPhrases(
            other.label,
            subject,
          ),
        ]);

      const otherSubject =
        implicitSubjectClue(
          other.label,
          subject,
        );

      const otherPreference =
        hasImplicitSubjectPredicate(
          other.label,
        );

      const otherIdentity =
        looksLikeIdentityAssertion(
          other.label,
        );

      const shared =
        currentTokens.filter(
          (token) =>
            otherSet.has(token),
        );

      const longShared =
        shared.filter(
          (token) =>
            token.length >= 5,
        );

      /*
       * Subject continuity is NOT convergence.
       * It only establishes that two clues can belong
       * to the same subject.
       */
      if (
        currentSubject &&
        otherSubject
      ) {
        addRelation(
          relations,
          current.id,
          other.id,
          "involves",
          0.8,
        );
      }

      /*
       * Strong lexical convergence:
       * the supplied clues genuinely share a
       * distinctive concept.
       */
      if (
        currentSubject &&
        otherSubject &&
        longShared.length >= 1
      ) {
        addRelation(
          relations,
          current.id,
          other.id,
          "converges",
          Math.min(
            0.88,
            0.5 +
              longShared.length *
                0.14,
          ),
        );
      }

      /*
       * Identity facts can legitimately connect:
       *
       * Coco is a dog
       * Coco is a poodle
       *
       * without requiring lexical overlap.
       */
      if (
        currentSubject &&
        otherSubject &&
        currentIdentity &&
        otherIdentity &&
        currentTokens.length > 0 &&
        otherTokens.length > 0
      ) {
        addRelation(
          relations,
          current.id,
          other.id,
          "converges",
          0.76,
        );
      }

      /*
       * Preference clues become related when their
       * supplied structure differs materially.
       *
       * Example:
       *   loves walks
       *   loves bacon
       *
       * But two arbitrary object-only preferences
       * such as:
       *   likes summer
       *   likes apples
       *
       * do not automatically converge.
       */
      const distinctObjects =
        currentObjects.some(
          (value) =>
            !otherObjects.includes(
              value,
            ),
        ) ||
        otherObjects.some(
          (value) =>
            !currentObjects.includes(
              value,
            ),
        );

      const structuralRoleChange =
        currentActions.length !==
          otherActions.length ||
        currentStates.length !==
          otherStates.length ||
        distinctObjects &&
          (
            currentActions.length > 0 ||
            otherActions.length > 0 ||
            currentStates.length > 0 ||
            otherStates.length > 0
          );

      if (
        currentSubject &&
        otherSubject &&
        currentPreference &&
        otherPreference &&
        structuralRoleChange &&
        currentTokens.length > 0 &&
        otherTokens.length > 0
      ) {
        addRelation(
          relations,
          current.id,
          other.id,
          "converges",
          0.68,
        );
      }

      const contrast =
        OPPOSITES.some(
          ([a, b]) =>
            (
              currentStates.includes(a) &&
              otherStates.includes(b)
            ) ||
            (
              currentStates.includes(b) &&
              otherStates.includes(a)
            ),
        );

      if (contrast) {
        addRelation(
          relations,
          current.id,
          other.id,
          "contrasts",
          0.9,
        );
      }

      const recurrenceLanguage =
        RECURRENCE_WORDS.test(
          other.label,
        );

      const explicitIdentity =
        looksLikeIdentityAssertion(
          other.label,
        ) ||
        /\b(?:same|remember(?:ed|s|ing)?)\b/i.test(
          other.label,
        );

      if (
        recurrenceLanguage &&
        currentSet.size &&
        otherTokens.some(
          (token) =>
            currentSet.has(token),
        )
      ) {
        addRelation(
          relations,
          current.id,
          other.id,
          "repeats",
          explicitIdentity
            ? 0.97
            : 0.88,
        );

        addRelation(
          relations,
          current.id,
          other.id,
          "recontextualizes",
          explicitIdentity
            ? 0.9
            : 0.72,
        );
      }

      const explicitCausal =
        /\b(?:because|caused|causes|resulted in|led to|due to)\b/i.test(
          `${current.label} ${other.label}`,
        );

      if (explicitCausal) {
        addRelation(
          relations,
          current.id,
          other.id,
          "causes",
          0.84,
        );
      }
    }
  }

  return relations;
}

function buildEventStructure(events: RealityEvent[], subject: string | undefined, recurringSignals: string[], sensorySignals: string[]): RealityEventStructure[] {
  const recurringTokens = new Set(recurringSignals.flatMap(contentTokens));
  const sensoryTokens = new Set(sensorySignals.flatMap(contentTokens));
  const tokenCounts = new Map<string, number>();
  for (const event of events) for (const token of meaningfulContentTokens(event.label, subject)) tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);

  return events.map((event) => {
    const tokens = meaningfulContentTokens(event.label, subject);
    const actions = extractActions(event.label);
    const states = extractStates(event.label);
    const objects = unique([...extractObjects(event.label, subject), ...objectPhrases(event.label, subject)]).slice(0, 8);
    const semantic = semanticTags(event.label);
    const recurrenceScore = Math.min(1, 0.18 * actions.filter((action) => recurringTokens.has(action)).length + 0.15 * tokens.filter((token) => (tokenCounts.get(token) ?? 0) > 1).length + (RECURRENCE_WORDS.test(event.label) ? 0.6 : 0));
    const transitionScore = Math.min(1, 0.18 * states.length + 0.2 * actions.filter((action) => /repair|fix|clean|groom|change|finish|complete|restore|renew/i.test(action)).length + (semantic.includes("transformation") ? 0.45 : 0));
    const anomalyScore = Math.min(1, (states.length >= 1 && actions.length >= 1 ? 0.35 : 0) + (semantic.length >= 3 ? 0.25 : 0) + (tokens.filter((token) => token.length >= 8).length * 0.08));
    const salienceScore = Math.min(1, 0.25 + Math.min(0.25, tokens.length * 0.04) + recurrenceScore * 0.2 + transitionScore * 0.2 + anomalyScore * 0.1 + tokens.filter((token) => sensoryTokens.has(token)).length * 0.05);
    const temporalMarkers = unique((event.label.match(TIME_WORDS) ?? []).map(lower));
    const sensoryMarkers = unique(tokens.filter((token) => sensoryTokens.has(token)));
    return {
      eventId: event.id,
      subjects: implicitSubjectClue(event.label, subject) && subject ? [clean(subject)] : capitalizedEntities(event.label),
      actions,
      objects,
      states,
      temporalMarkers,
      sensoryMarkers,
      semanticTags: semantic,
      recurrenceScore: Number(recurrenceScore.toFixed(3)),
      transitionScore: Number(transitionScore.toFixed(3)),
      anomalyScore: Number(anomalyScore.toFixed(3)),
      salienceScore: Number(salienceScore.toFixed(3)),
    };
  });
}

function buildEntityContinuity(events: RealityEvent[], subject: string | undefined, structures: readonly RealityEventStructure[]): RealityEntityContinuity[] {
  const map = new Map<string, { eventIds: string[]; kind: RealityEntityContinuity["kind"] }>();
  for (const event of events) {
    const structure = structures.find((item) => item.eventId === event.id);
    const subjectInEvent = Boolean(subject && structure?.subjects.some((value) => lower(value) === lower(subject)));
    const names = unique([
      ...(subjectInEvent && subject ? [subject] : []),
      ...capitalizedEntities(event.label),
      ...(structure?.objects ?? []).filter((value) => value.length > 2),
    ]);
    for (const name of names) {
      const key = lower(name);
      const item = map.get(key) ?? { eventIds: [], kind: "unknown" as const };
      if (!item.eventIds.includes(event.id)) item.eventIds.push(event.id);
      const normalized = lower(name);
      if (/\b(?:dog|cat|pet|puppy|horse|bird)\b/.test(normalized)) item.kind = "animal";
      else if (/\b(?:watch|table|car|keys?|room|photo|mirror|bow|gift)\b/.test(normalized)) item.kind = "object";
      else if (subject && normalized === lower(subject)) item.kind = "person";
      map.set(key, item);
    }
  }
  return [...map.entries()]
    .map(([name, value]) => {
      const scores = value.eventIds.map((eventId) => structures.find((item) => item.eventId === eventId)?.salienceScore ?? 0);
      return {
        name,
        mentionCount: value.eventIds.length,
        eventIds: value.eventIds,
        firstEventId: value.eventIds[0] ?? "",
        lastEventId: value.eventIds[value.eventIds.length - 1] ?? "",
        kind: value.kind,
        salienceScore: Number(Math.min(1, 0.25 + value.eventIds.length * 0.15 + Math.max(...scores, 0) * 0.35).toFixed(3)),
      };
    })
    .filter((item) => item.name.length > 1)
    .sort((a, b) => b.salienceScore - a.salienceScore)
    .slice(0, 24);
}

function buildPatterns(events: RealityEvent[], evidenceList: RealityEvidence[], structures: readonly RealityEventStructure[], relations: readonly RealityRelation[], recurringSignals: string[], unresolvedTensions: string[]): RealityPattern[] {
  const patterns: RealityPattern[] = [];
  const evidenceIdsFor = (eventIds: readonly string[]) => unique(events.filter((event) => eventIds.includes(event.id)).flatMap((event) => event.sourceIds));

  for (const structure of structures.filter((item) => item.transitionScore >= 0.45).sort((a, b) => b.transitionScore - a.transitionScore).slice(0, 6)) {
    patterns.push({ kind: "transition", label: `${structure.semanticTags.join(" + ") || "state"} transition`, eventIds: [structure.eventId], evidenceIds: evidenceIdsFor([structure.eventId]), strength: structure.transitionScore });
  }
  for (const relation of relations.filter((item) => item.kind === "repeats").slice(0, 6)) {
    const sourceEvents = [relation.from, relation.to];
    patterns.push({ kind: "recurrence", label: "supplied pattern returns", eventIds: sourceEvents, evidenceIds: evidenceIdsFor(sourceEvents), strength: relation.strength });
  }
  for (const signal of recurringSignals.slice(0, 8)) {
    const normalized = lower(signal);
    const eventIds = events.filter((event) => lower(event.label).includes(normalized) || contentTokens(event.label).includes(normalized)).map((event) => event.id);
    if (eventIds.length >= 1) patterns.push({ kind: "motif", label: signal, eventIds, evidenceIds: evidenceIdsFor(eventIds), strength: Math.min(1, 0.45 + eventIds.length * 0.12) });
  }
  for (const relation of relations.filter((item) => item.kind === "contrasts").slice(0, 6)) {
    const ids = [relation.from, relation.to];
    patterns.push({ kind: "tension", label: "contrasting supplied states", eventIds: ids, evidenceIds: evidenceIdsFor(ids), strength: relation.strength });
  }
  for (const tension of unresolvedTensions.slice(0, 8)) {
    patterns.push({ kind: "thread", label: tension, eventIds: events.filter((event) => semanticTags(event.label).length > 0).slice(0, 4).map((event) => event.id), evidenceIds: evidenceList.slice(0, 4).map((item) => item.id), strength: 0.58 });
  }
  for (const structure of structures.filter((item) => item.anomalyScore >= 0.5).sort((a, b) => b.anomalyScore - a.anomalyScore).slice(0, 6)) {
    const label = events.find((event) => event.id === structure.eventId)?.label ?? structure.eventId;
    patterns.push({ kind: "anomaly", label: `high-information supplied detail: ${label}`, eventIds: [structure.eventId], evidenceIds: evidenceIdsFor([structure.eventId]), strength: structure.anomalyScore });
  }
  return patterns.slice(0, 48);
}

function deriveTensions(events: RealityEvent[], relations: RealityRelation[], sourceText: string): string[] {
  const lowerSource = lower(sourceText);
  const tensions: string[] = [];
  if (RECURRENCE_WORDS.test(lowerSource)) tensions.push("recurrence can change the meaning of an earlier detail");
  if (/(?:happy|proud|confident|excited)/.test(lowerSource) && /(?:sad|angry|scared|nervous|tired)/.test(lowerSource)) tensions.push("current state conflicts with another supplied state");
  if (/\b(?:old|vintage|inherited)\b/.test(lowerSource) && /\b(?:new|first|brand new)\b/.test(lowerSource)) tensions.push("old meaning meets new context");
  if (events.some((item) => item.entities.length >= 3)) tensions.push("one observation contains multiple salient details that can be reframed together");
  if (relations.some((relation) => relation.kind === "contrasts")) tensions.push("supplied states contain a concrete contrast");
  if (relations.some((relation) => relation.kind === "recontextualizes")) tensions.push("a supplied return or recurrence can change the reading of an earlier detail");
  if (relations.some((relation) => relation.kind === "changes")) tensions.push("an observed state is linked to an observed action");
  return unique(tensions).slice(0, 10);
}

function deriveRecurringSignals(fragments: string[], memory: readonly string[] | undefined, trajectory: readonly string[] | undefined): string[] {
  const all = [...fragments, ...(memory ?? []), ...(trajectory ?? [])].map(clean).filter(Boolean);
  const normalized = all.map((item) => item.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
  const repeated = normalized.filter((item, index) => normalized.indexOf(item) !== index);
  const lexical = new Map<string, number>();
  for (const item of normalized) for (const token of contentTokens(item)) lexical.set(token, (lexical.get(token) ?? 0) + 1);
  const repeatedTokens = [...lexical.entries()].filter(([, count]) => count > 1).map(([token]) => token);
  const explicitRecurrence = fragments.filter((item) => RECURRENCE_WORDS.test(item)).map(clean);
  return unique([...explicitRecurrence, ...repeated, ...repeatedTokens]).slice(0, 16);
}

function deriveSensorySignals(fragments: string[]): string[] {
  const sensory = /\b(?:smell|scent|noise|sound|music|light|dark|bright|cold|hot|wet|dry|taste|sweet|salty|rough|soft|blue|red|green|yellow|white|black|lavender|bacon|apple|water|rain|wind|mirror|reflection)\b/i;
  return unique(fragments.filter((item) => sensory.test(item)).map(clean)).slice(0, 16);
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
  const recurringSignals = deriveRecurringSignals(fragments, input.memoryContext, input.trajectory);
  const sensorySignals = deriveSensorySignals(fragments);
  const eventStructure = buildEventStructure(events, input.subject, recurringSignals, sensorySignals);
  const relations = buildStructuralRelations(events, input.subject);
  buildTemporalRelations(events, relations);
  const unresolvedTensions = deriveTensions(events, relations, fragments.join(" | "));
  const entityContinuity = buildEntityContinuity(events, input.subject, eventStructure);
  const patterns = buildPatterns(events, sourceEvidence, eventStructure, relations, recurringSignals, unresolvedTensions);

  return {
    evidence: sourceEvidence,
    events,
    relations: relations.slice(0, 160),
    unresolvedTensions,
    recurringSignals,
    sensorySignals,
    eventStructure,
    entityContinuity,
    patterns,
  };
}
