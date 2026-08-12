import type {
  CognitiveExperiencePlan,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * UNIVERSAL CUSTOMER-LANGUAGE REALIZER
 *
 * This is the final linguistic boundary between the cognitive engine and
 * the human.
 *
 * The cognitive engine may think in:
 *
 *   premises
 *   mechanics
 *   directives
 *   hypotheses
 *   progression
 *   memory
 *   semantic arcs
 *
 * None of that is allowed to become customer prose.
 *
 * The realizer receives:
 *
 *   evidence + relations + trajectory + beat
 *
 * and turns it into:
 *
 *   attention + action + reaction + turn + transformation + payoff
 *
 * There are intentionally NO domain modes here.
 *
 * A dog, housekeeper, wedding, rave, surfboard, memorial, trip, restaurant,
 * real-estate property, product, business, family memory, or arbitrary object
 * all use the same machinery.
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

/**
 * Internal language is never customer language.
 *
 * This list is intentionally aggressive.
 *
 * If the cognitive engine accidentally produces one of these phrases,
 * the language boundary throws it away instead of laundering it into prose.
 */
const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|what happens next|trusted history|memory model|geographic model|social model|internal model|internal state|latent state|causal trajectory|story beat|beat kind|mechanic|mechanics|affordance model|content model|discovery model|future evolution|dynamic behavior)\b/i;

const META_PHRASE =
  /\b(?:new memories can change what later visitors discover|the situation has not been entered|the subject and situation are established|the result remains available for what comes next|the next step follows from what just happened|the moment became available for|this changes what later visitors|later visitors discover)\b/i;

/**
 * These are delivery concepts, not necessarily bad evidence.
 *
 * Notice that "business", "story", "experience", "client", and "customer"
 * are NOT banned. They can absolutely be real user evidence.
 */
const DELIVERY_META =
  /\b(?:customer-facing|internal output|system output|generated output|delivery pipeline|delivery layer|send pipeline|scan pipeline|qr pipeline|nfc pipeline)\b/i;

const SERIOUS =
  /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement)\b/i;

const PLAYFUL =
  /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute|silly|lighthearted|crazy|cheeky|comic)\b/i;

const ACTION =
  /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed|cleaned|repaired|polished|painted|cross|reach|arrive|return)\w*\b/i;

const GENERIC = new Set([
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
  "ready",
  "started",
  "happened",
  "made",
  "make",
  "create",
  "created",
  "creating",
  "began",
  "begin",
  "became",
  "become",
  "showed",
  "show",
  "clear",
  "important",
  "next",
  "final",
  "last",
]);

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

function usable(value: unknown): boolean {
  const text = clean(value);

  if (!text || text.length < 3) return false;
  if (META.test(text)) return false;
  if (META_PHRASE.test(text)) return false;
  if (DELIVERY_META.test(text)) return false;

  return true;
}

function evidence(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const directive = beat.directive;

  return unique([
    ...(beat.entities ?? []),

    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "social"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "temporal"),
    ...premiseValues(plan, "transformation"),

    directive?.subject,
    directive?.action,
    directive?.stateBefore,
    directive?.stateAfter,

    ...(directive?.relationalFocus ?? []),
  ]).filter(usable);
}

function atomWords(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/)
    .filter((word) => word.length > 2);
}

function concreteWordCount(value: string): number {
  return atomWords(value).filter(
    (word) => !GENERIC.has(word),
  ).length;
}

/**
 * Narrative salience.
 *
 * We want details that are:
 *
 *   specific
 *   visual
 *   physical
 *   unusual
 *   relational
 *   consequential
 *
 * But we do NOT want every detail.
 *
 * One memorable detail is usually stronger than twelve.
 */
function detailScore(
  value: string,
  plan?: CognitiveExperiencePlan,
): number {
  const words = atomWords(value);

  let score = 0;

  score += concreteWordCount(value) * 3;
  score += Math.min(words.length, 5);

  if (/\d/.test(value)) score += 3;

  if (
    /\b(?:red|blue|black|white|gold|silver|tiny|giant|little|big|old|new|warm|cold|bright|dark|broken|missing|full|empty|muddy|wet|wild|beautiful|ridiculous|strange)\b/i.test(
      value,
    )
  ) {
    score += 5;
  }

  if (/\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value)) {
    score += 6;
  }

  const salientRoles = [
    "artifact",
    "place",
    "outcome",
    "transformation",
    "event",
    "social",
  ];

  for (const role of salientRoles) {
    if (
      premiseValues(
        plan,
        role as CognitivePremiseRole,
      ).includes(value)
    ) {
      score += 5;
    }
  }

  /**
   * Physical nouns and concrete phrases get a strong preference.
   */
  if (
    /\b(?:door|shoe|hat|coat|bow|bows|coffee|cake|car|truck|board|wave|house|room|kitchen|garden|road|beach|water|dress|ring|photo|picture|food|table|chair|hair|fur|mud|rain|sun|moon|light|music|crowd)\b/i.test(
      value,
    )
  ) {
    score += 4;
  }

  return score;
}

function details(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  return unique(evidence(beat, plan))
    .filter((value) =>
      atomWords(value).some(
        (word) => !GENERIC.has(word),
      ),
    )
    .sort(
      (a, b) =>
        detailScore(b, plan) -
        detailScore(a, plan),
    );
}

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

function outcome(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  return unique([
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "transformation"),
    beat.directive?.stateAfter,
  ]).find(usable);
}

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

  const directive =
    plan?.realization?.directives.find(
      (item) =>
        usable(item.stateBefore) ||
        usable(item.stateAfter),
    );

  return {
    before:
      transformation[0] ??
      (usable(directive?.stateBefore)
        ? clean(directive?.stateBefore)
        : undefined),

    after:
      transformation[1] ??
      (usable(directive?.stateAfter)
        ? clean(directive?.stateAfter)
        : undefined),
  };
}

function signal(plan?: CognitiveExperiencePlan): string {
  return lower([
    ...(plan?.emotionalIntent ?? []),
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
    ...premiseValues(plan, "emotion"),
  ].join(" "));
}

function isSerious(plan?: CognitiveExperiencePlan): boolean {
  return SERIOUS.test(signal(plan));
}

function isPlayful(plan?: CognitiveExperiencePlan): boolean {
  const text = signal(plan);

  return (
    !SERIOUS.test(text) &&
    PLAYFUL.test(text)
  );
}

function choose<T>(
  values: readonly T[],
  seed: string,
): T {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (
    values[(hash >>> 0) % values.length] ??
    values[0]!
  );
}

function cap(value: string): string {
  const text = sentence(value);

  return text
    ? text.charAt(0).toUpperCase() + text.slice(1)
    : text;
}

function article(value: string): string {
  const text = sentence(value).toLowerCase();

  if (/^(?:the|a|an)\b/i.test(text)) {
    return text;
  }

  return `the ${text}`;
}

/**
 * Determine whether the central subject is probably animate.
 *
 * This lets us vary:
 *
 * Coco
 * →
 * they
 *
 * while a house / car / surfboard can become:
 *
 * it
 *
 * without requiring domain-specific modes.
 */
function animate(
  plan?: CognitiveExperiencePlan,
): boolean {
  const values = [
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "social"),
  ];

  return values.some((value) =>
    /\b(?:person|people|man|woman|child|kid|family|dog|cat|pet|couple|bride|groom|friend|friends|guest|guests|owner|client|customer|team|crowd|everyone|someone|they|he|she)\b/i.test(
      value,
    ),
  );
}

function subject(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const candidates = unique([
    clean(plan?.centralSubject),
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...(beat.entities ?? []),
    beat.directive?.subject,
  ]).filter(usable);

  const named = candidates.find((value) =>
    /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value),
  );

  return (
    named ??
    candidates.sort(
      (a, b) => a.length - b.length,
    )[0] ??
    "it"
  );
}

function pronoun(
  plan?: CognitiveExperiencePlan,
): string {
  return animate(plan) ? "they" : "it";
}

/**
 * Avoid subject spam.
 *
 * The subject is strongest in the opening and transformation.
 * Middle beats should often begin with:
 *
 *   Then...
 *   For a moment...
 *   By then...
 *   And somehow...
 *   That...
 *   The detail...
 *
 * This is narrative attention control, not cosmetic variation.
 */
function subjectReference(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const name = subject(beat, plan);

  switch (beat.kind) {
    case "orientation":
    case "transformation":
    case "payoff":
      return name;

    default:
      return pronoun(plan);
  }
}

/**
 * Comedy pressure.
 *
 * No fixed props.
 * No "funny object generator."
 *
 * Comedy comes from the relationship between:
 *
 *   ordinary evidence
 *   + disproportionate reaction
 *   + tiny escalation
 *
 * That makes "bows" funny when bows are actually present.
 * It also makes a missed turn funny on a trip.
 * Or a burnt toast detail.
 * Or a ridiculous hat.
 * Or a giant truck.
 *
 * The engine does not need to know the domain.
 */
function comedyReaction(
  detail: string | undefined,
  subjectName: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!isPlayful(plan) || isSerious(plan)) {
    return undefined;
  }

  const detailText = detail
    ? article(detail)
    : "the situation";

  return choose(
    [
      `${cap(detailText)} suddenly seemed like a matter of principle.`,
      `For a moment, ${subjectName} looked personally offended.`,
      `That was enough to make ${subjectName} reconsider the entire arrangement.`,
      `Nobody said there was a problem. ${detailText} apparently disagreed.`,
      `At that point, a formal complaint felt almost reasonable.`,
      `Somewhere in there, the ordinary part quietly lost control of the situation.`,
      `And somehow, ${detailText} had become the main event.`,
    ],
    `${beat.id}|comedy|${detail ?? "none"}|${subjectName}`,
  );
}

function opening(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const name = subject(beat, plan);
  const detail = details(beat, plan)[0];

  if (isPlayful(plan)) {
    return choose(
      [
        `${name} walked in looking like this deserved a formal review.`,
        `${name} arrived with questions.`,
        `${name} showed up, and the day immediately had some explaining to do.`,
        `${name} arrived with the unmistakable energy of someone who had opinions.`,
        `${name} walked in as if the ordinary version of this was already beneath them.`,
      ],
      `${name}|opening|${beat.id}`,
    );
  }

  if (detail) {
    return `${name} arrived, and ${article(detail)} set things in motion.`;
  }

  return `${name} arrived, and things got underway.`;
}

function hook(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (!detail) {
    return "Then the day started to take shape.";
  }

  if (isPlayful(plan)) {
    return choose(
      [
        `Then came ${article(detail)}.`,
        `${cap(article(detail))} entered the picture.`,
        `At first, it seemed to be about ${article(detail)}.`,
        `Then ${article(detail)} started getting interesting.`,
        `Everything was normal until ${article(detail)} got involved.`,
      ],
      `${beat.id}|hook|${detail}`,
    );
  }

  return `The moment began with ${article(detail)}.`;
}

function need(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (detail) {
    return isPlayful(plan)
      ? `There was only one small problem: ${article(detail)}.`
      : `There was something to deal with: ${article(detail)}.`;
  }

  return "There was a reason to keep going.";
}

function threshold(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const action = actions(beat, plan)[0];
  const detail = details(beat, plan)[0];

  if (action) {
    return `Then ${sentence(action).toLowerCase()} became the next move.`;
  }

  if (detail) {
    return `Then ${article(detail)} pulled the moment forward.`;
  }

  return "The next part was underway.";
}

function origin(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const action = actions(beat, plan)[0];
  const place = premiseValues(plan, "place")[0];

  if (action) {
    return `It started with ${article(action)}.`;
  }

  if (place) {
    return `It started there, at ${sentence(place)}.`;
  }

  return "It started simply enough.";
}

function encounter(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (!detail) {
    return "Then something changed the rhythm.";
  }

  return choose(
    [
      `Then came ${article(detail)}.`,
      `${cap(article(detail))} got its turn.`,
      `Next came ${article(detail)}.`,
      `And then ${article(detail)} entered the scene.`,
    ],
    `${beat.id}|encounter|${detail}`,
  );
}

function challenge(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];
  const funny = comedyReaction(
    detail,
    subject(beat, plan),
    beat,
    plan,
  );

  if (funny) return funny;

  if (detail) {
    return `For a moment, ${article(detail)} slowed things down.`;
  }

  return "For a moment, the momentum broke.";
}

function actionBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const action = actions(beat, plan)[0];

  if (action) {
    return `${cap(action)}.`;
  }

  const detail = details(beat, plan)[0];

  return detail
    ? `${cap(article(detail))} moved things forward.`
    : "The moment kept moving.";
}

function discovery(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (!detail) {
    return "Then the important part came into focus.";
  }

  if (isPlayful(plan)) {
    return choose(
      [
        `That was when ${article(detail)} became impossible to ignore.`,
        `That was when everyone noticed ${article(detail)}.`,
        `And suddenly, ${article(detail)} mattered.`,
        `That was the point where ${article(detail)} stopped being a side detail.`,
      ],
      `${beat.id}|discovery|${detail}`,
    );
  }

  return `That was when ${article(detail)} stood out.`;
}

function reveal(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const value =
    outcome(beat, plan) ??
    details(beat, plan)[0];

  if (!value) {
    return "And there it was: the change was visible.";
  }

  if (isPlayful(plan)) {
    return choose(
      [
        `And there it was: ${sentence(value).toLowerCase()}.`,
        `There it was. ${cap(value)}.`,
        `And somehow, ${sentence(value).toLowerCase()} was the answer.`,
      ],
      `${beat.id}|reveal|${value}`,
    );
  }

  return `And there it was: ${sentence(value).toLowerCase()}.`;
}

function feedback(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];
  const name = subject(beat, plan);

  if (detail && isPlayful(plan)) {
    return choose(
      [
        `The reaction was immediate.`,
        `${name} had clearly reached an opinion.`,
        `Apparently, ${article(detail)} had consequences.`,
        `That got a reaction.`,
        `Nobody needed to explain what that meant.`,
      ],
      `${beat.id}|feedback|${detail}|${name}`,
    );
  }

  if (detail) {
    return `${cap(article(detail))} showed what had changed.`;
  }

  return "The result started to show itself.";
}

function contribution(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (detail && isPlayful(plan)) {
    return choose(
      [
        `That changed the mood.`,
        `That shifted everything.`,
        `That was when the whole thing started to feel different.`,
        `And somehow, that mattered more than expected.`,
      ],
      `${beat.id}|contribution|${detail}`,
    );
  }

  return detail
    ? `That shifted the moment around ${article(detail)}.`
    : "That changed the rhythm of what followed.";
}

function escalation(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (!detail) {
    return "By then, the moment had gathered its own momentum.";
  }

  if (isPlayful(plan)) {
    return choose(
      [
        `${cap(article(detail))} was no longer a side detail. It was the mood.`,
        `By then, ${article(detail)} had somehow become the main event.`,
        `And somehow, ${article(detail)} kept getting more important.`,
        `At this point, ${article(detail)} had its own storyline.`,
      ],
      `${beat.id}|escalation|${detail}`,
    );
  }

  return `${cap(article(detail))} carried the moment forward.`;
}

function transformation(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const name = subject(beat, plan);
  const state = states(plan);

  if (state.before && state.after) {
    return `${name} went from ${sentence(state.before).toLowerCase()} to ${sentence(state.after).toLowerCase()}.`;
  }

  const value = outcome(beat, plan);

  if (value) {
    return isPlayful(plan)
      ? `${name} came out of it looking like the whole thing had been worth the trouble.`
      : `By the end, the result was clear: ${sentence(value)}.`;
  }

  if (isPlayful(plan)) {
    return choose(
      [
        `By the end, ${name} was not quite the same as when this started.`,
        `Somewhere along the way, ordinary turned into memorable.`,
        `The before-and-after was impossible to miss.`,
        `Whatever walked in was not quite what walked out.`,
      ],
      `${name}|transformation|${beat.id}`,
    );
  }

  return `By the end, ${name} was not quite in the same state as when this started.`;
}

function reflection(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (!detail) {
    return "Looking back, the difference was clear.";
  }

  if (isPlayful(plan)) {
    return choose(
      [
        `Looking back, ${article(detail)} was the giveaway.`,
        `In hindsight, ${article(detail)} had been telling the whole story.`,
        `Turns out, ${article(detail)} mattered.`,
      ],
      `${beat.id}|reflection|${detail}`,
    );
  }

  return `Looking back, ${article(detail)} made the change easy to see.`;
}

function provenance(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  return detail
    ? `And that detail stayed with the moment.`
    : `The moment stayed connected to what came before.`;
}

function identity(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const name = subject(beat, plan);
  const value = outcome(beat, plan);

  if (value) {
    return isPlayful(plan)
      ? `${name} left carrying ${article(value)} like it had always belonged there.`
      : `${name} now carried ${article(value)}.`;
  }

  return isPlayful(plan)
    ? `${name} came out of it with a completely different attitude.`
    : "The result had become part of the moment's identity.";
}

function milestone(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (!detail) {
    return "That became the moment worth remembering.";
  }

  return isPlayful(plan)
    ? `${cap(article(detail))} became the detail everyone would remember.`
    : `${cap(article(detail))} became the detail that marked the change.`;
}

function unlock(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (detail) {
    return `And that opened the way for ${article(detail)}.`;
  }

  return "And that opened the next part.";
}

function payoff(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const name = subject(beat, plan);
  const value = outcome(beat, plan);
  const detail = details(beat, plan)[0];

  if (isPlayful(plan)) {
    if (value) {
      return choose(
        [
          `And there it was. ${cap(value)}.`,
          `That was the payoff: ${sentence(value).toLowerCase()}.`,
          `By then, ${sentence(value).toLowerCase()} was impossible to miss.`,
        ],
        `${name}|payoff|${value}`,
      );
    }

    if (detail) {
      return choose(
        [
          `And somehow, ${article(detail)} became the part worth keeping.`,
          `That was the bit nobody was going to forget.`,
          `And there it was: the part that made the whole thing worth remembering.`,
        ],
        `${name}|payoff|${detail}`,
      );
    }

    return "And somehow, the ordinary part had become the part worth remembering.";
  }

  if (value) {
    return `The result was clear: ${sentence(value)}.`;
  }

  return `The result was clear, and ${name} carried it forward.`;
}

function nextStep(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const detail = details(beat, plan)[0];

  if (isPlayful(plan)) {
    return detail
      ? `There was only one thing left to do: see what happened next.`
      : "There was only one thing left to do: keep going.";
  }

  return "There was only one thing left to do: keep going.";
}

function continuation(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  /**
   * IMPORTANT:
   *
   * Do not blindly print futureEvolution.
   *
   * That was the source of:
   *
   * "new memories can change what later visitors discover"
   *
   * We only continue from concrete evidence.
   */
  const detail = details(beat, plan)[0];

  if (isPlayful(plan)) {
    if (detail) {
      return choose(
        [
          `That probably was not the end of it.`,
          `And honestly, that felt like the beginning of another story.`,
          `Which, naturally, left room for whatever happened next.`,
          `Somehow, this did not feel finished.`,
        ],
        `${beat.id}|continuation|${detail}`,
      );
    }

    return "And that felt like a beginning, not an ending.";
  }

  return "The result remained available for what came next.";
}

/**
 * Main customer-language boundary.
 */
export function realizeSuperStoryBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) {
    return undefined;
  }

  const facts = evidence(beat, plan);

  if (!facts.length) {
    return undefined;
  }

  let text: string | undefined;

  switch (beat.kind) {
    case "orientation":
      text = opening(beat, plan);
      break;

    case "hook":
      text = hook(beat, plan);
      break;

    case "need":
      text = need(beat, plan);
      break;

    case "threshold":
      text = threshold(beat, plan);
      break;

    case "origin":
      text = origin(beat, plan);
      break;

    case "encounter":
      text = encounter(beat, plan);
      break;

    case "challenge":
      text = challenge(beat, plan);
      break;

    case "discovery":
      text = discovery(beat, plan);
      break;

    case "reveal":
      text = reveal(beat, plan);
      break;

    case "instruction": {
      const detail = details(beat, plan)[0];

      text = detail
        ? `The next move was ${article(detail)}.`
        : "The next move became clear.";

      break;
    }

    case "action":
      text = actionBeat(beat, plan);
      break;

    case "feedback":
      text = feedback(beat, plan);
      break;

    case "contribution":
      text = contribution(beat, plan);
      break;

    case "escalation":
      text = escalation(beat, plan);
      break;

    case "transformation":
      text = transformation(beat, plan);
      break;

    case "reflection":
      text = reflection(beat, plan);
      break;

    case "provenance":
      text = provenance(beat, plan);
      break;

    case "identity":
      text = identity(beat, plan);
      break;

    case "milestone":
      text = milestone(beat, plan);
      break;

    case "unlock":
    case "earned_access":
      text = unlock(beat, plan);
      break;

    case "payoff":
      text = payoff(beat, plan);
      break;

    case "next_step":
      text = nextStep(beat, plan);
      break;

    case "continuation":
      text = continuation(beat, plan);
      break;

    default:
      text = undefined;
      break;
  }

  if (!text) {
    return undefined;
  }

  const finalText = `${sentence(text)}.`;

  /**
   * FINAL SAFETY WALL.
   *
   * Even if an upstream cognitive value somehow escaped all filters,
   * it is not allowed to become customer prose.
   */
  if (
    META.test(finalText) ||
    META_PHRASE.test(finalText) ||
    DELIVERY_META.test(finalText)
  ) {
    return undefined;
  }

  return finalText;
}