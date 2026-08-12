import type {
  CognitiveExperiencePlan,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * UNIVERSAL TRANSFORMATION REALIZER
 *
 * CUSTOMER-LANGUAGE EXPERIENCE ENGINE
 *
 * This layer sits at the final boundary between cognitive planning and
 * human-readable experience.
 *
 * The cognitive system may think in:
 *   - premises
 *   - roles
 *   - directives
 *   - semantic arcs
 *   - progression
 *   - affordances
 *   - future evolution
 *
 * The customer should never see any of that.
 *
 * The realizer converts supplied evidence into:
 *
 *   FACT
 *     ↓
 *   OBSERVATION
 *     ↓
 *   ATTENTION
 *     ↓
 *   REACTION
 *     ↓
 *   ESCALATION
 *     ↓
 *   TRANSFORMATION
 *     ↓
 *   PAYOFF
 *
 * Comedy is treated as a LENS, not as fabricated evidence.
 *
 * Example:
 *
 *   evidence:
 *     Coco
 *     grooming
 *     bows
 *     bubbles
 *     foot rubs
 *     ready to go home
 *
 * can become:
 *
 *   "Coco walked in looking like this deserved a formal review."
 *
 * rather than:
 *
 *   "The moment began with the new memories can change..."
 *
 * The joke is invented.
 * The evidence is not.
 *
 * HARD RULES
 *
 * 1. Concrete supplied evidence outranks semantic abstractions.
 * 2. Named subjects outrank generic nouns.
 * 3. Actions outrank abstract states.
 * 4. Transformations must be observable whenever evidence permits.
 * 5. Comedy must attach to something concrete.
 * 6. Serious material never receives playful treatment.
 * 7. Delivery mechanics never become story content.
 * 8. No cognitive/compiler vocabulary reaches customer prose.
 * 9. Deterministic output.
 * 10. No domain-specific story mode is required.
 * 11. Avoid repeating the same sentence architecture.
 * 12. Never confuse an affordance with an observed event.
 */

const clean = (value: unknown): string =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";

const lower = (value: unknown): string =>
  clean(value).toLowerCase();

const sentence = (value: unknown): string =>
  clean(value).replace(/[.!?]+$/, "");

const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const lowerSentence = (value: string): string =>
  sentence(value).toLowerCase();

const article = (value: string): string => {
  const text = sentence(value).toLowerCase();

  if (!text) return "";

  if (/^(?:the|a|an)\b/i.test(text)) {
    return text;
  }

  if (/^[aeiou]/i.test(text)) {
    return `an ${text}`;
  }

  return `a ${text}`;
};


/* -------------------------------------------------------------------------- */
/* FILTERS                                                                    */
/* -------------------------------------------------------------------------- */

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics)\b/i;

const DELIVERY = /\b(?:receipt|prompt|output|customer-facing|customer|client|audience|user|users|qr|nfc|scan|tag|code|send|sending|deliver|delivery|message|text message)\b/i;

const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement|accident|loss)\b/i;

const PLAYFUL = /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute|silly|lighthearted|crazy|cheeky|witty|comic)\b/i;

const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|deliver|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed|cleaned|repaired|polished|painted|shake|shook|chew|chewed|run|ran|call|called)\w*\b/i;

const ABSTRACTION = /\b(?:situation|circumstance|experience|process|journey|moment|thing|things|result|outcome|meaning|change|transformation|progress|development|interaction|dynamic|behavior|behaviour|possibility|potential|future|memory|memories|discovery)\b/i;

const GENERIC_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "for",
  "with",
  "about",
  "from",
  "into",
  "this",
  "that",
  "then",
  "there",
  "here",
  "moment",
  "situation",
  "thing",
  "things",
  "story",
  "experience",
  "result",
  "outcome",
  "part",
  "way",
  "time",
  "one",
  "something",
  "everything",
  "nothing",
  "really",
  "very",
  "just",
  "got",
  "getting",
  "looked",
  "looking",
  "started",
  "happened",
  "made",
  "make",
  "create",
  "created",
  "creating",
  "change",
  "changed",
  "changing",
  "ready",
]);


/* -------------------------------------------------------------------------- */
/* PREMISE ACCESS                                                             */
/* -------------------------------------------------------------------------- */

function premiseValues(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function allPremiseValues(
  plan?: CognitiveExperiencePlan,
): string[] {
  if (!plan?.premise) return [];

  return unique(
    plan.premise.slots.flatMap((slot) => slot.values),
  );
}


/* -------------------------------------------------------------------------- */
/* DETERMINISTIC CHOICE                                                       */
/* -------------------------------------------------------------------------- */

function choose<T>(
  values: readonly T[],
  seed: string,
): T {
  if (!values.length) {
    throw new Error("choose() requires at least one value");
  }

  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return values[(hash >>> 0) % values.length] ?? values[0]!;
}


/* -------------------------------------------------------------------------- */
/* TEXT SANITIZATION                                                          */
/* -------------------------------------------------------------------------- */

function stripDeliveryTail(value: string): string {
  return clean(
    value
      .replace(
        /\b(?:to|for)\s+(?:send|sending|share|deliver|give)\b.*$/i,
        "",
      )
      .replace(
        /\b(?:to|for)\s+(?:the|a|an)?\s*(?:client|customer|user|audience|business)\b.*$/i,
        "",
      )
      .replace(
        /\b(?:story|receipt|message|text)\s+(?:about|for)\b.*$/i,
        "",
      )
      .replace(
        /\bnew memories can change what later visitors discover\b.*$/i,
        "",
      ),
  );
}

function usable(value: string): boolean {
  const text = clean(value);

  return Boolean(text) &&
    !META.test(text) &&
    !DELIVERY.test(text);
}

function concrete(value: string): boolean {
  const text = clean(value);

  if (!usable(text)) return false;

  const words = text
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/)
    .filter(Boolean);

  return words.some(
    (word) =>
      !GENERIC_WORDS.has(word) &&
      word.length > 2,
  );
}


/* -------------------------------------------------------------------------- */
/* SUBJECT                                                                     */
/* -------------------------------------------------------------------------- */

function subjectCandidates(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  return unique([
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "social"),
    clean(plan?.centralSubject),
    ...(beat.entities ?? []),
    beat.directive?.subject,
  ])
    .map(stripDeliveryTail)
    .filter(usable);
}

function subject(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const candidates = subjectCandidates(beat, plan);

  const named = candidates.find(
    (value) =>
      /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value) &&
      !DELIVERY.test(value) &&
      !ACTION.test(value),
  );

  if (named) return named;

  const compact = candidates
    .filter(
      (value) =>
        !DELIVERY.test(value) &&
        !ACTION.test(value) &&
        !ABSTRACTION.test(value),
    )
    .sort((a, b) => a.length - b.length)[0];

  return compact ?? "the subject";
}


/* -------------------------------------------------------------------------- */
/* RAW EVIDENCE                                                                */
/* -------------------------------------------------------------------------- */

function rawEvidence(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  return unique([
    ...(beat.entities ?? []),

    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "social"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "temporal"),
    ...premiseValues(plan, "transformation"),

    beat.directive?.subject,
    beat.directive?.action,
    beat.directive?.stateBefore,
    beat.directive?.stateAfter,
    ...(beat.directive?.relationalFocus ?? []),
  ])
    .map(stripDeliveryTail)
    .filter(usable);
}


/* -------------------------------------------------------------------------- */
/* WORD / DETAIL ANALYSIS                                                      */
/* -------------------------------------------------------------------------- */

function atomWords(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/)
    .filter((word) => word.length > 2);
}

function detailScore(
  value: string,
  plan?: CognitiveExperiencePlan,
): number {
  const words = atomWords(value);

  const concreteWords = words.filter(
    (word) => !GENERIC_WORDS.has(word),
  ).length;

  const lengthBonus = Math.min(10, words.length * 2);

  const visualBonus =
    /\d|\b(?:red|blue|black|white|gold|silver|tiny|giant|old|new|little|big|long|short|warm|cold|bright|dark|soft|clean|fresh|shiny|messy|wild)\b/i.test(
      value,
    )
      ? 5
      : 0;

  const namedBonus =
    /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value)
      ? 8
      : 0;

  const actionBonus =
    ACTION.test(value)
      ? 5
      : 0;

  const roleBonus = [
    "artifact",
    "place",
    "outcome",
    "transformation",
    "event",
    "social",
  ].some((role) =>
    premiseValues(
      plan,
      role as CognitivePremiseRole,
    ).includes(value),
  )
    ? 6
    : 0;

  const abstractionPenalty =
    ABSTRACTION.test(value)
      ? 8
      : 0;

  return (
    concreteWords * 3 +
    lengthBonus +
    visualBonus +
    namedBonus +
    actionBonus +
    roleBonus -
    abstractionPenalty
  );
}

function details(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  return unique(rawEvidence(beat, plan))
    .filter(concrete)
    .sort(
      (a, b) =>
        detailScore(b, plan) -
        detailScore(a, plan),
    );
}


/* -------------------------------------------------------------------------- */
/* ACTIONS                                                                     */
/* -------------------------------------------------------------------------- */

function actions(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  return unique([
    ...premiseValues(plan, "event"),
    beat.directive?.action,
    ...(beat.entities ?? []),
  ])
    .filter(usable)
    .filter((value) => ACTION.test(value));
}


/* -------------------------------------------------------------------------- */
/* STATES                                                                      */
/* -------------------------------------------------------------------------- */

function states(
  plan?: CognitiveExperiencePlan,
): {
  before?: string;
  after?: string;
} {
  const transformation = premiseValues(
    plan,
    "transformation",
  ).filter(usable);

  const directive = plan?.realization?.directives.find(
    (item) =>
      clean(item.stateBefore) ||
      clean(item.stateAfter),
  );

 const before = transformation[0] ?? clean(directive?.stateBefore);
const after = transformation[1] ?? clean(directive?.stateAfter);

return {
  before: before || undefined,
  after: after || undefined,
};
}

function outcome(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  return unique([
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "transformation"),
    beat.directive?.stateAfter,
  ])
    .filter(usable)
    .find(Boolean);
}


/* -------------------------------------------------------------------------- */
/* SIGNALS                                                                     */
/* -------------------------------------------------------------------------- */

function signalText(
  plan?: CognitiveExperiencePlan,
): string {
  return lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.realization?.semanticArc ?? []),

    ...(plan?.realization?.directives.flatMap(
      (item) => [
        item.action,
        item.intent,
        item.stateBefore,
        item.stateAfter,
      ],
    ) ?? []),

    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "emotion"),
  ].join(" "));
}

function playful(
  plan?: CognitiveExperiencePlan,
): boolean {
  const signal = signalText(plan);

  return (
    !SERIOUS.test(signal) &&
    PLAYFUL.test(signal)
  );
}


/* -------------------------------------------------------------------------- */
/* EXPERIENCE CLASSIFICATION                                                   */
/* -------------------------------------------------------------------------- */

type ExperienceClass =
  | "care"
  | "cleaning"
  | "repair"
  | "journey"
  | "creation"
  | "celebration"
  | "transformation"
  | "social"
  | "discovery"
  | "generic";

function experienceClass(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): ExperienceClass {
  const text = lower([
    ...actions(beat, plan),
    ...details(beat, plan).slice(0, 12),
    signalText(plan),
  ].join(" "));

  if (
    /\b(?:groom|wash|massage|pamper|style|trim|brush|dry|spoil|treat|bathe)\b/
      .test(text)
  ) {
    return "care";
  }

  if (
    /\b(?:clean|cleaning|kitchen|bathroom|laundry|vacuum|dust|polish|organize|organise)\b/
      .test(text)
  ) {
    return "cleaning";
  }

  if (
    /\b(?:repair|fix|brake|car|restore|broken|replace|install|test)\b/
      .test(text)
  ) {
    return "repair";
  }

  if (
    /\b(?:travel|drive|ride|journey|trip|road|route|turn|destination|sunset)\b/
      .test(text)
  ) {
    return "journey";
  }

  if (
    /\b(?:build|make|create|design|write|cook|bake|paint|craft|draw|decorate)\b/
      .test(text)
  ) {
    return "creation";
  }

  if (
    /\b(?:celebrate|celebration|wedding|marry|party|birthday|dance|ceremony|reception)\b/
      .test(text)
  ) {
    return "celebration";
  }

  if (
    /\b(?:discover|find|found|notice|realize|realised|realized|reveal|learn)\b/
      .test(text)
  ) {
    return "discovery";
  }

  if (
    /\b(?:friend|family|guest|partner|team|owner|customer|neighbor|neighbour)\b/
      .test(text)
  ) {
    return "social";
  }

  if (
    premiseValues(plan, "transformation").length ||
    premiseValues(plan, "outcome").length
  ) {
    return "transformation";
  }

  return "generic";
}


/* -------------------------------------------------------------------------- */
/* COMEDY ENGINE                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Comedy strategies are not facts.
 *
 * They are rhetorical lenses attached to facts.
 */
type ComedyMove =
  | "suspicion"
  | "formalReview"
  | "dramaticReaction"
  | "mockAuthority"
  | "statusUpgrade"
  | "deadpan"
  | "escalation"
  | "understatement"
  | "celebratory";


function comedyMove(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): ComedyMove {
  const moves: ComedyMove[] = [
    "suspicion",
    "formalReview",
    "dramaticReaction",
    "mockAuthority",
    "statusUpgrade",
    "deadpan",
    "escalation",
    "understatement",
    "celebratory",
  ];

  return choose(
    moves,
    `${beat.id}|${beat.order}|comedy-move`,
  );
}


/* -------------------------------------------------------------------------- */
/* COMEDIC LENS                                                                */
/* -------------------------------------------------------------------------- */

function comicObservation(
  subjectName: string,
  detail: string,
  move: ComedyMove,
  seed: string,
): string {
  const d = article(detail);

  switch (move) {
    case "suspicion":
      return choose(
        [
          `${subjectName} noticed ${d} and immediately became suspicious.`,
          `${subjectName} approached ${d} like this required further investigation.`,
          `${subjectName} gave ${d} the kind of look usually reserved for questionable decisions.`,
        ],
        seed,
      );

    case "formalReview":
      return choose(
        [
          `${subjectName} treated ${d} like it deserved a formal review.`,
          `${subjectName} appeared ready to file a complaint about ${d}.`,
          `${subjectName} seemed to believe ${d} required legal representation.`,
        ],
        seed,
      );

    case "dramaticReaction":
      return choose(
        [
          `${d} produced a reaction that was difficult to ignore.`,
          `${subjectName} had feelings about ${d}. Several of them.`,
          `${d} became the kind of detail that demanded a reaction.`,
        ],
        seed,
      );

    case "mockAuthority":
      return choose(
        [
          `${subjectName} appeared to appoint themself supervisor of ${d}.`,
          `${d} was apparently now under serious management.`,
          `${subjectName} took personal responsibility for overseeing ${d}.`,
        ],
        seed,
      );

    case "statusUpgrade":
      return choose(
        [
          `${d} was no longer just a detail. It had become the main event.`,
          `Somehow, ${d} had promoted itself to headline status.`,
          `${d} quietly became the star of the operation.`,
        ],
        seed,
      );

    case "deadpan":
      return choose(
        [
          `${d} happened. Naturally, this changed everything.`,
          `${d} entered the picture. Nobody needed to explain why that mattered.`,
          `Then there was ${d}. Enough said.`,
        ],
        seed,
      );

    case "escalation":
      return choose(
        [
          `${d} started small and somehow became everybody's business.`,
          `${d} should have been a minor detail. It disagreed.`,
          `What started with ${d} escalated rather efficiently.`,
        ],
        seed,
      );

    case "understatement":
      return choose(
        [
          `${d} made things slightly more interesting.`,
          `${d} was, to put it mildly, memorable.`,
          `${d} did not exactly go unnoticed.`,
        ],
        seed,
      );

    case "celebratory":
      return choose(
        [
          `${d} deserved a little applause.`,
          `${d} had officially earned its moment.`,
          `${d} showed up and somehow stole the scene.`,
        ],
        seed,
      );
  }
}


/* -------------------------------------------------------------------------- */
/* SAFE FLOURISHES                                                             */
/* -------------------------------------------------------------------------- */

/**
 * These are deliberately non-factual.
 *
 * They describe attitude, framing, or rhetorical exaggeration.
 * They do not assert an invented physical event.
 */
function flourish(
  subjectName: string,
  detail: string | undefined,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!playful(plan)) return undefined;
  if (SERIOUS.test(signalText(plan))) return undefined;

  const chosenDetail =
    detail ??
    details(beat, plan)[0];

  if (!chosenDetail) return undefined;

  return comicObservation(
    subjectName,
    chosenDetail,
    comedyMove(beat, plan),
    `${subjectName}|${beat.id}|${chosenDetail}`,
  );
}


/* -------------------------------------------------------------------------- */
/* ACTION REALIZATION                                                          */
/* -------------------------------------------------------------------------- */

function observableAction(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const value = actions(beat, plan)[0];

  if (!value) return undefined;

  return sentence(value);
}

function actionLine(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const action = observableAction(beat, plan);
  const detail = details(beat, plan)[0];

  if (action) {
    return cap(action);
  }

  if (detail) {
    return `${cap(detail)} moved things forward.`;
  }

  return "Things kept moving.";
}


/* -------------------------------------------------------------------------- */
/* TRANSFORMATION REALIZATION                                                 */
/* -------------------------------------------------------------------------- */

function transformationLine(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const state = states(plan);

  if (state.before && state.after) {
    if (playful(plan)) {
      return choose(
        [
          `${subjectName} went from ${lowerSentence(state.before)} to ${lowerSentence(state.after)}. Quite the upgrade.`,
          `Somehow, ${subjectName} went from ${lowerSentence(state.before)} to ${lowerSentence(state.after)}.`,
          `The before-and-after was hard to miss: ${lowerSentence(state.before)} became ${lowerSentence(state.after)}.`,
        ],
        `${subjectName}|transform|${beat.id}|explicit`,
      );
    }

    return `${subjectName} went from ${lowerSentence(state.before)} to ${lowerSentence(state.after)}.`;
  }

  const result = outcome(beat, plan);

  if (result) {
    if (playful(plan)) {
      return choose(
        [
          `By the end, ${sentence(result).toLowerCase()}.`,
          `And somehow, ${sentence(result).toLowerCase()}.`,
          `By then, the result was impossible to miss: ${sentence(result).toLowerCase()}.`,
        ],
        `${subjectName}|transform|${beat.id}|outcome`,
      );
    }

    return `By the end, ${sentence(result)}.`;
  }

  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `${subjectName} came out the other side with ${article(detail)} and considerably more personality.`,
        `Somewhere along the way, ${subjectName} stopped looking ordinary.`,
        `By the end, ${subjectName} had clearly entered a different chapter.`,
      ],
      `${subjectName}|transform|${beat.id}|fallback`,
    );
  }

  return `${subjectName} was not quite the same as when this started.`;
}


/* -------------------------------------------------------------------------- */
/* BEAT-SPECIFIC REALIZATION                                                   */
/* -------------------------------------------------------------------------- */

function opening(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  if (playful(plan)) {
    return choose(
      [
        `${subjectName} walked in looking like this deserved a formal review.`,
        `${subjectName} arrived with opinions.`,
        `${subjectName} showed up looking suspiciously unconvinced.`,
        `${subjectName} walked in as if somebody had some explaining to do.`,
        `${subjectName} arrived with the unmistakable energy of a tiny executive reviewing operations.`,
      ],
      `${subjectName}|opening|${beat.id}`,
    );
  }

  return `${subjectName} arrived, and things got underway.`;
}


function hook(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];
  const action = observableAction(beat, plan);

  if (playful(plan) && detail) {
    return flourish(
      subjectName,
      detail,
      beat,
      plan,
    ) ?? `Things started with ${article(detail)}.`;
  }

  if (action) {
    return `${cap(action)}.`;
  }

  if (detail) {
    return `Things started with ${article(detail)}.`;
  }

  return "Things got underway.";
}


function need(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `There was only one small problem: ${article(detail)} had entered the picture.`,
        `The plan was simple enough. Then ${article(detail)} became important.`,
        `Naturally, there was something to deal with: ${article(detail)}.`,
      ],
      `${subjectName}|need|${beat.id}`,
    );
  }

  if (detail) {
    return `There was something to do about ${article(detail)}.`;
  }

  return "There was a reason to keep going.";
}


function threshold(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `Then ${article(detail)} officially became part of the operation.`,
        `That was the point where ${article(detail)} stopped being background.`,
        `And then came ${article(detail)}.`,
      ],
      `${subjectName}|threshold|${beat.id}`,
    );
  }

  return detail
    ? `Then came ${article(detail)}.`
    : "The next part was underway.";
}


function origin(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const action = observableAction(beat, plan);
  const detail = details(beat, plan)[0];

  if (action) {
    return `It started with ${lowerSentence(action)}.`;
  }

  if (detail) {
    return `It started with ${article(detail)}.`;
  }

  return "That was where things got moving.";
}


function encounter(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return flourish(
      subjectName,
      detail,
      beat,
      plan,
    ) ?? `Then came ${article(detail)}.`;
  }

  const action = observableAction(beat, plan);

  if (action) {
    return `Then came ${lowerSentence(action)}.`;
  }

  return detail
    ? `Then came ${article(detail)}.`
    : "Then something changed the rhythm.";
}


function challenge(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `${cap(detail)} was not exactly prepared to cooperate.`,
        `For a moment, ${article(detail)} had other ideas.`,
        `${cap(detail)} suddenly became everybody's problem.`,
        `Apparently, ${article(detail)} had opinions.`,
      ],
      `${subjectName}|challenge|${beat.id}`,
    );
  }

  return detail
    ? `${cap(detail)} slowed things down for a moment.`
    : "For a moment, the momentum broke.";
}


function discovery(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (!detail) {
    return "That was when the important part finally came into focus.";
  }

  if (playful(plan)) {
    return choose(
      [
        `That was when ${article(detail)} suddenly became the detail worth watching.`,
        `And there it was: ${article(detail)} had been hiding in plain sight.`,
        `${cap(detail)} finally got the attention it had apparently been waiting for.`,
        `That was when ${article(detail)} stopped being a detail and became the story.`,
      ],
      `${subjectName}|discovery|${beat.id}`,
    );
  }

  return `That was when ${article(detail)} stood out.`;
}


function reveal(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const result = outcome(beat, plan);
  const detail = details(beat, plan)[0];

  if (result) {
    return playful(plan)
      ? `And there it was: ${lowerSentence(result)}.`
      : `And there it was: ${sentence(result)}.`;
  }

  if (detail) {
    return playful(plan)
      ? `And there it was: ${article(detail)}.`
      : `And there it was: ${article(detail)}.`;
  }

  return "The result finally came into view.";
}


function feedback(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `${subjectName} had feelings about ${article(detail)}.`,
        `${article(detail)} received an immediate and very clear reaction.`,
        `${subjectName} reviewed ${article(detail)} and apparently had notes.`,
        `${article(detail)} got a reaction. A memorable one.`,
      ],
      `${subjectName}|feedback|${beat.id}`,
    );
  }

  if (detail) {
    return `${cap(detail)} showed what had changed.`;
  }

  return "The result started to show itself.";
}


function contribution(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `${article(detail)} changed the rhythm.`,
        `That put ${article(detail)} firmly in the spotlight.`,
        `And somehow, ${article(detail)} became important.`,
      ],
      `${subjectName}|contribution|${beat.id}`,
    );
  }

  return detail
    ? `${cap(detail)} changed the rhythm of what followed.`
    : "That changed the rhythm of what followed.";
}


function escalation(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `${cap(detail)} was no longer a side detail. It had become the whole mood.`,
        `By then, ${article(detail)} had somehow become the main event.`,
        `And somehow, ${article(detail)} kept getting more important.`,
        `${cap(detail)} had officially outgrown its supporting role.`,
      ],
      `${subjectName}|escalation|${beat.id}`,
    );
  }

  return detail
    ? `${cap(detail)} carried the moment into its final stretch.`
    : "The moment moved into its final stretch.";
}


function reflection(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `Looking back, ${article(detail)} was the giveaway.`,
        `In retrospect, ${article(detail)} had been telling the story all along.`,
        `Looking back, ${article(detail)} was doing a lot of heavy lifting.`,
      ],
      `${subjectName}|reflection|${beat.id}`,
    );
  }

  return detail
    ? `Looking back, ${article(detail)} made the change easy to see.`
    : "Looking back, the difference was clear.";
}


function identity(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const result = outcome(beat, plan);

  if (playful(plan) && result) {
    return choose(
      [
        `${subjectName} now carried ${article(result)} like it had always belonged there.`,
        `${subjectName} had officially acquired ${article(result)}.`,
        `At this point, ${subjectName} was clearly operating with ${article(result)}.`,
      ],
      `${subjectName}|identity|${beat.id}`,
    );
  }

  return result
    ? `${subjectName} now carried ${article(result)}.`
    : `${subjectName} now carried the result of everything that came before.`;
}


function milestone(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `${cap(detail)} became the detail everybody would remember.`,
        `${cap(detail)} officially earned its place in the highlight reel.`,
        `That was the moment ${article(detail)} stole the scene.`,
      ],
      `${subjectName}|milestone|${beat.id}`,
    );
  }

  return detail
    ? `${cap(detail)} became the detail that marked the change.`
    : "That became the moment worth remembering.";
}


function payoff(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const result = outcome(beat, plan);
  const detail = details(beat, plan)[0];
  const classification = experienceClass(beat, plan);

  if (result) {
    if (playful(plan)) {
      return choose(
        [
          `And there it was: ${lowerSentence(result)}.`,
          `That was the payoff: ${lowerSentence(result)}.`,
          `By then, ${lowerSentence(result)}.`,
        ],
        `${subjectName}|payoff|${beat.id}|result`,
      );
    }

    return `The result was clear: ${sentence(result)}.`;
  }

  if (playful(plan)) {
    switch (classification) {
      case "care":
        return choose(
          [
            `${subjectName} left looking ready to paint the town red.`,
            `Out the door went a completely different attitude.`,
            `The look was excellent. The attitude was even better.`,
            `Whatever walked in at the beginning had clearly been upgraded.`,
          ],
          `${subjectName}|payoff|care|${beat.id}`,
        );

      case "cleaning":
        return choose(
          [
            "By the end, the place looked like it had its life together.",
            "The chaos had officially been put on notice.",
            "By then, even the stubborn details had surrendered.",
          ],
          `${subjectName}|payoff|cleaning|${beat.id}`,
        );

      case "repair":
        return choose(
          [
            "Everything behaved again. A satisfying development.",
            "The problem was behind them, and the road could have its turn.",
            "Whatever had been misbehaving had apparently received the message.",
          ],
          `${subjectName}|payoff|repair|${beat.id}`,
        );

      case "journey":
        return choose(
          [
            "They made it, and somehow the detour became part of the story.",
            "The trip had officially earned its story rights.",
            "And that was the kind of ending a trip likes to have.",
          ],
          `${subjectName}|payoff|journey|${beat.id}`,
        );

      case "creation":
        return choose(
          [
            "The finished result had officially entered the good part.",
            "And suddenly, all those little decisions made sense.",
            "The final version looked like the plan had known what it was doing.",
          ],
          `${subjectName}|payoff|creation|${beat.id}`,
        );

      case "celebration":
        return choose(
          [
            "By then, ordinary had officially left the building.",
            "The room had gone from normal to memorable.",
            "And just like that, the occasion had its moment.",
          ],
          `${subjectName}|payoff|celebration|${beat.id}`,
        );

      default:
        if (detail) {
          return `And somehow, ${article(detail)} became the detail worth remembering.`;
        }

        return choose(
          [
            "The ordinary part was gone. What remained was the good part.",
            "By the time it was over, the moment had earned its story.",
            "And somehow, an ordinary beginning had turned into something worth remembering.",
          ],
          `${subjectName}|payoff|generic|${beat.id}`,
        );
    }
  }

  return `The result was clear, and ${subjectName} carried it forward.`;
}


function nextStep(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (playful(plan)) {
    if (detail) {
      return choose(
        [
          `Naturally, there was only one thing left to do: deal with ${article(detail)}.`,
          `At that point, ${article(detail)} was the obvious next move.`,
          `There was only one thing left to do. Keep the story moving.`,
        ],
        `${subjectName}|next-step|${beat.id}`,
      );
    }

    return "Naturally, there was only one thing left to do: keep going.";
  }

  return "The next step followed from what had just happened.";
}


function continuation(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const future = plan?.futureEvolution?.find(
    (value) =>
      usable(value) &&
      !ABSTRACTION.test(value),
  );

  if (future) {
    return playful(plan)
      ? `And that left room for ${lowerSentence(future)}.`
      : `The result remained available for ${sentence(future)}.`;
  }

  const detail = details(beat, plan)[0];

  if (playful(plan) && detail) {
    return choose(
      [
        `That detail could have ended there. It probably won't.`,
        `And that is how ${article(detail)} gets a second life.`,
        `The story had no particular reason to stop there.`,
      ],
      `${subjectName}|continuation|${beat.id}`,
    );
  }

  return "The result remained available for what came next.";
}


/* -------------------------------------------------------------------------- */
/* REALIZER                                                                   */
/* -------------------------------------------------------------------------- */

function realizeBeat(
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  switch (beat.kind) {
    case "orientation":
      return opening(subjectName, beat, plan);

    case "hook":
      return hook(subjectName, beat, plan);

    case "need":
      return need(subjectName, beat, plan);

    case "threshold":
      return threshold(subjectName, beat, plan);

    case "origin":
      return origin(subjectName, beat, plan);

    case "encounter":
      return encounter(subjectName, beat, plan);

    case "challenge":
      return challenge(subjectName, beat, plan);

    case "discovery":
      return discovery(subjectName, beat, plan);

    case "reveal":
      return reveal(subjectName, beat, plan);

    case "instruction": {
      const detail = details(beat, plan)[0];

      if (playful(plan) && detail) {
        return `The next move was apparently ${article(detail)}.`;
      }

      return detail
        ? `The next move was ${article(detail)}.`
        : "The next move became clear.";
    }

    case "action":
      return actionLine(beat, plan);

    case "feedback":
      return feedback(subjectName, beat, plan);

    case "contribution":
      return contribution(subjectName, beat, plan);

    case "escalation":
      return escalation(subjectName, beat, plan);

    case "transformation":
      return transformationLine(subjectName, beat, plan);

    case "reflection":
      return reflection(subjectName, beat, plan);

    case "provenance": {
      const detail = details(beat, plan)[0];

      if (detail) {
        return playful(plan)
          ? `${cap(detail)} was part of what made this one memorable.`
          : `${cap(detail)} belonged to the moment.`;
      }

      return "The moment stayed connected to what came before.";
    }

    case "identity":
      return identity(subjectName, beat, plan);

    case "milestone":
      return milestone(subjectName, beat, plan);

    case "unlock":
    case "earned_access":
      return playful(plan)
        ? "The next part had been earned by everything that came before."
        : "The next part followed from what happened before.";

    case "payoff":
      return payoff(subjectName, beat, plan);

    case "next_step":
      return nextStep(subjectName, beat, plan);

    case "continuation":
      return continuation(subjectName, beat, plan);

    default:
      return undefined;
  }
}


/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                  */
/* -------------------------------------------------------------------------- */

export function realizeTransformationalBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) {
    return undefined;
  }

  const evidence = rawEvidence(beat, plan);

  if (!evidence.length) {
    return undefined;
  }

  const subjectName = subject(beat, plan);

  const text = realizeBeat(
    subjectName,
    beat,
    plan,
  );

  if (!text) {
    return undefined;
  }

  return `${sentence(text)}.`;
}


/* -------------------------------------------------------------------------- */
/* INSPECTION / DEBUG                                                         */
/* -------------------------------------------------------------------------- */

export function inspectTransformation(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
) {
  const explicit = premiseValues(
    plan,
    "transformation",
  );

  const evidence = unique([
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "social"),
    ...premiseValues(plan, "temporal"),
    ...premiseValues(plan, "transformation"),
    ...(beat.entities ?? []),
    ...actions(beat, plan),
    ...details(beat, plan),
  ])
    .filter(usable)
    .slice(0, 32);

  const state = states(plan);

  return {
    subject: subject(beat, plan),

    before:
      state.before ??
      explicit[0],

    after:
      state.after ??
      premiseValues(plan, "outcome")[0],

    evidence,

    strongestDetails:
      details(beat, plan).slice(0, 8),

    actions:
      actions(beat, plan),

    experienceClass:
      experienceClass(beat, plan),

    playful:
      playful(plan),

    serious:
      SERIOUS.test(signalText(plan)),

    comedyMove:
      playful(plan)
        ? comedyMove(beat, plan)
        : undefined,

    beatKind:
      beat.kind,

    beatOrder:
      beat.order,

    semanticSignal:
      signalText(plan),
  };
}