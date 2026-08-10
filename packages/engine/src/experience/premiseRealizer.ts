import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRelation,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * UNIVERSAL PREMISE REALIZER
 *
 * Cognition owns meaning.
 * The universal compiler owns structure.
 * This layer turns that semantic structure into observable story language.
 *
 * Realization conserves:
 *
 *  1. semantic roles,
 *  2. explicit relationships among those roles,
 *  3. concrete lexical evidence extracted upstream,
 *  4. progression already selected by cognition/compiler structure.
 *
 * The renderer must describe what happens in the experience.
 * It must not describe the compiler's interpretation of what happens.
 *
 * No domain-specific rescue vocabulary belongs here.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string =>
  clean(value).toLowerCase().replace(/[’]/g, "'");

const sentence = (value: unknown): string =>
  clean(value).replace(/[.!?]+$/, "");

const cap = (value: unknown): string => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The premise";
};

const DEAD_PROSE = [
  /the experience puts into focus/i,
  /deserves a closer look/i,
  /gives the story somewhere concrete to begin/i,
  /the next layer/i,
  /the next move follows from the state reached here/i,
  /what the experience has revealed/i,
  /has become more meaningful through the interaction/i,
  /the experience leaves a meaning behind/i,
  /giving the moment a direction/i,
  /lands differently because of everything that happened/i,
  /the story starts pulling/i,
  /the experience moves forward through/i,
  /carries .* forward/i,
  /carries the current state/i,
  /the concrete detail is/i,
  /reaches the result established by the premise/i,
  /changes because of the preceding interaction/i,
  /the next concrete condition in the premise/i,
  /the supplied premise/i,
  /the supplied context/i,
];

const ROLES: CognitivePremiseRole[] = [
  "subject",
  "event",
  "medium",
  "artifact",
  "participants",
  "outcome",
  "emotion",
  "affordance",
  "temporal",
  "place",
  "social",
  "transformation",
  "constraint",
];

const STOP = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "by",
  "can",
  "could",
  "create",
  "do",
  "does",
  "doing",
  "for",
  "from",
  "get",
  "give",
  "gives",
  "given",
  "has",
  "have",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "make",
  "makes",
  "making",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "people",
  "please",
  "that",
  "the",
  "their",
  "this",
  "those",
  "to",
  "turn",
  "up",
  "was",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "with",
  "you",
  "your",
  "something",
  "someone",
  "thing",
  "experience",
  "story",
  "about",
  "through",
  "just",
  "more",
  "than",
  "then",
  "now",
  "will",
  "keep",
  "after",
  "before",
  "very",
  "really",
  "want",
  "needs",
  "need",
]);

function premise(plan?: CognitiveExperiencePlan): CognitivePremise | undefined {
  return plan?.premise;
}

function values(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string[] {
  return [
    ...new Set(
      premise(plan)
        ?.slots.filter((slot) => slot.role === role)
        .flatMap((slot) => slot.values)
        .map(clean)
        .filter(Boolean) ?? [],
    ),
  ];
}

function first(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string {
  return values(plan, role)[0] ?? "";
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function words(value: unknown): string[] {
  return clean(value)
    .replace(/[^\p{L}\p{N}'’-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter((word) => word.length > 2 && !STOP.has(lower(word)));
}

function generic(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

/**
 * centralSubject is useful semantic metadata but is not guaranteed to be
 * presentation-ready. A compiler-generated phrase such as
 * "Turn forgotten recipe can add" should never become the protagonist.
 *
 * Prefer an explicit subject slot, then concrete entity evidence, and only
 * then fall back to centralSubject.
 */
function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const explicit = first(plan, "subject");
  if (explicit) return explicit;

  const entity = clean(beat.entities?.[0]);
  if (entity) return entity;

  const central = clean(plan?.centralSubject);

  if (central) {
    const centralWords = words(central);

    if (centralWords.length <= 4) {
      return central;
    }

    const meaningful =
      centralWords.find((word) => !STOP.has(lower(word))) ?? centralWords[0];

    return meaningful || central;
  }

  return "the experience";
}

/**
 * Semantic evidence is different from filler prose.
 *
 * Keep values from cognition intact, but remove obvious duplicates and
 * presentation noise before using them in a sentence.
 */
function semanticEvidence(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const subjectValue = lower(subject(beat, plan));

  const candidates = ROLES.flatMap((role) => values(plan, role))
    .concat(beat.entities ?? [])
    .map(sentence)
    .filter(Boolean)
    .filter((value) => !generic(value))
    .filter((value) => lower(value) !== subjectValue)
    .filter((value) => !STOP.has(lower(value)));

  return unique(candidates);
}

function roleEvidence(
  plan: CognitiveExperiencePlan | undefined,
  roles: CognitivePremiseRole[],
): string[] {
  return unique(
    roles
      .flatMap((role) => values(plan, role))
      .map(sentence)
      .filter(Boolean),
  );
}

function firstDistinctEvidence(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  return semanticEvidence(beat, plan)[0] ?? "";
}

function evidenceForBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
  limit = 3,
): string[] {
  const subjectValue = lower(subject(beat, plan));

  const candidates = semanticEvidence(beat, plan)
    .filter((value) => lower(value) !== subjectValue)
    .filter((value) => value.length >= 2);

  const scored = candidates.map((value, index) => {
    const slot = premise(plan)?.slots.find((candidate) =>
      candidate.values.some((item) => lower(item) === lower(value)),
    );

    const roleBonus =
      slot?.role === "event"
        ? 1.4
        : slot?.role === "artifact"
          ? 1.3
          : slot?.role === "medium"
            ? 1.2
            : slot?.role === "outcome"
              ? 1.15
              : slot?.role === "transformation"
                ? 1.1
                : 0;

    return {
      value,
      score: (slot?.salience ?? 0) * 5 + roleBonus - index * 0.01,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((item) => item.value)
    .filter((value, index, all) =>
      all.findIndex((candidate) => lower(candidate) === lower(value)) === index,
    )
    .slice(0, limit);
}

function relationValues(
  plan: CognitiveExperiencePlan | undefined,
  from: CognitivePremiseRole,
  to: CognitivePremiseRole,
): Array<{
  relation: CognitivePremiseRelation;
  fromValue: string;
  toValue: string;
}> {
  const current = premise(plan);
  if (!current) return [];

  const fromValues = values(plan, from);
  const toValues = values(plan, to);

  return current.relations
    .filter(
      (item) =>
        item.from === from &&
        item.to === to &&
        item.confidence >= 0.72,
    )
    .flatMap((relation) =>
      fromValues.flatMap((fromValue) =>
        toValues.map((toValue) => ({
          relation,
          fromValue,
          toValue,
        })),
      ),
    );
}

/**
 * Turn an explicit semantic relation into an observable clause.
 *
 * This is intentionally relational rather than domain-specific.
 */
function semanticRelation(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const priority: Record<
    StoryBeat["kind"],
    Array<[CognitivePremiseRole, CognitivePremiseRole]>
  > = {
    orientation: [
      ["subject", "place"],
      ["subject", "event"],
      ["subject", "artifact"],
      ["event", "medium"],
    ],
    hook: [
      ["subject", "outcome"],
      ["event", "medium"],
      ["participants", "outcome"],
    ],
    need: [
      ["subject", "constraint"],
      ["subject", "outcome"],
    ],
    threshold: [
      ["subject", "medium"],
      ["event", "medium"],
      ["event", "place"],
    ],
    origin: [
      ["subject", "artifact"],
      ["subject", "temporal"],
      ["event", "place"],
    ],
    encounter: [
      ["participants", "outcome"],
      ["subject", "event"],
      ["subject", "artifact"],
    ],
    challenge: [
      ["subject", "constraint"],
      ["subject", "outcome"],
    ],
    discovery: [
      ["subject", "artifact"],
      ["subject", "medium"],
      ["event", "medium"],
    ],
    reveal: [
      ["subject", "outcome"],
      ["subject", "artifact"],
      ["subject", "medium"],
    ],
    instruction: [
      ["subject", "affordance"],
      ["subject", "medium"],
      ["subject", "constraint"],
    ],
    action: [
      ["subject", "affordance"],
      ["subject", "artifact"],
      ["subject", "medium"],
    ],
    feedback: [
      ["subject", "transformation"],
      ["subject", "outcome"],
    ],
    contribution: [
      ["participants", "outcome"],
      ["subject", "social"],
      ["subject", "artifact"],
    ],
    escalation: [
      ["subject", "transformation"],
      ["subject", "constraint"],
      ["subject", "outcome"],
    ],
    transformation: [
      ["transformation", "outcome"],
      ["subject", "transformation"],
      ["subject", "outcome"],
    ],
    reflection: [
      ["subject", "temporal"],
      ["subject", "outcome"],
      ["subject", "artifact"],
    ],
    provenance: [
      ["subject", "artifact"],
      ["subject", "event"],
      ["event", "place"],
    ],
    identity: [
      ["subject", "artifact"],
      ["subject", "social"],
      ["subject", "event"],
    ],
    milestone: [
      ["subject", "outcome"],
      ["subject", "transformation"],
    ],
    unlock: [
      ["subject", "outcome"],
      ["subject", "affordance"],
    ],
    earned_access: [
      ["subject", "outcome"],
      ["subject", "affordance"],
      ["subject", "constraint"],
    ],
    payoff: [
      ["subject", "outcome"],
      ["transformation", "outcome"],
      ["participants", "outcome"],
    ],
    next_step: [
      ["subject", "outcome"],
      ["subject", "temporal"],
      ["subject", "affordance"],
    ],
    continuation: [
      ["subject", "temporal"],
      ["subject", "outcome"],
      ["participants", "outcome"],
    ],
  };

  for (const [from, to] of priority[beat.kind]) {
    const match = relationValues(plan, from, to)[0];
    if (!match) continue;

    const { fromValue, toValue } = match;

    if (from === "event" && to === "medium") {
      return `${cap(fromValue)} reaches people through ${toValue}`;
    }

    if (from === "subject" && to === "medium") {
      return `${cap(fromValue)} uses ${toValue} to enter the experience`;
    }

    if (from === "subject" && to === "event") {
      return `${cap(fromValue)} enters ${toValue}`;
    }

    if (from === "subject" && to === "artifact") {
      return `${cap(fromValue)} is connected to ${toValue}`;
    }

    if (from === "subject" && to === "place") {
      return `${cap(fromValue)} arrives at ${toValue}`;
    }

    if (from === "subject" && to === "outcome") {
      return `${cap(fromValue)} moves toward ${sentence(toValue)}`;
    }

    if (from === "subject" && to === "constraint") {
      return `${cap(fromValue)} has to deal with ${sentence(toValue)}`;
    }

    if (from === "subject" && to === "temporal") {
      return `${cap(fromValue)} returns to ${sentence(toValue)}`;
    }

    if (from === "subject" && to === "affordance") {
      return `${cap(fromValue)} gives people a way to ${sentence(toValue)}`;
    }

    if (from === "subject" && to === "transformation") {
      return `${cap(fromValue)} changes through ${sentence(toValue)}`;
    }

    if (from === "subject" && to === "social") {
      return `${cap(fromValue)} connects with ${toValue}`;
    }

    if (from === "participants" && to === "outcome") {
      return `${cap(fromValue)} move the experience toward ${sentence(toValue)}`;
    }

    if (from === "transformation" && to === "outcome") {
      return `${cap(fromValue)} leads toward ${sentence(toValue)}`;
    }

    if (from === "event" && to === "place") {
      return `${cap(fromValue)} unfolds at ${toValue}`;
    }
  }

  return "";
}

/**
 * Build a concrete premise phrase without pretending that a noun is itself
 * an event.
 *
 * Example:
 *
 *   subject = "a billionaire"
 *   evidence = ["luxury", "spa", "absurd"]
 *
 * becomes:
 *
 *   "a billionaire enters a luxury spa built around absurd excess"
 *
 * rather than:
 *
 *   "The concrete detail is luxury."
 */
function concreteContext(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
  limit = 3,
): string {
  const evidence = evidenceForBeat(beat, plan, limit);

  if (!evidence.length) return "";

  if (evidence.length === 1) {
    return evidence[0];
  }

  if (evidence.length === 2) {
    return `${evidence[0]} and ${evidence[1]}`;
  }

  return `${evidence.slice(0, -1).join(", ")}, and ${evidence.at(-1)}`;
}

function transformationPair(
  plan?: CognitiveExperiencePlan,
): [string, string] | undefined {
  const transformation = values(plan, "transformation");

  if (transformation.length >= 2) {
    return [sentence(transformation[0]), sentence(transformation[1])];
  }

  return undefined;
}

function outcome(plan?: CognitiveExperiencePlan): string {
  return (
    first(plan, "outcome") ||
    plan?.whyInteract?.find(Boolean) ||
    ""
  );
}

function fallbackText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const name = cap(subject(beat, plan));
  const subjectValue = subject(beat, plan);
  const relation = semanticRelation(beat, plan);
  const evidence = evidenceForBeat(beat, plan, 3);
  const context = concreteContext(beat, plan, 3);
  const target = outcome(plan);
  const transformation = transformationPair(plan);
  const future =
    plan?.futureEvolution?.find(Boolean) ||
    first(plan, "temporal");
  const progression =
    plan?.progressionModel?.find(Boolean) || "";
  const interaction =
    plan?.interactionModel?.find(Boolean) || "";
  const content =
    plan?.contentModel?.find(Boolean) || "";

  switch (beat.kind) {
    case "orientation": {
      if (relation) return `${sentence(relation)}.`;

      if (context) {
        return `${name} enters a situation shaped by ${context}.`;
      }

      return `${name} enters the situation already established by the premise.`;
    }

    case "hook": {
      if (relation) {
        return `${sentence(relation)}, creating the first reason to continue.`;
      }

      if (target && context) {
        return `${name} encounters ${context}, setting up ${sentence(target)}.`;
      }

      if (target) {
        return `${name} has something concrete to pursue: ${sentence(target)}.`;
      }

      if (interaction && context) {
        return `${name} begins with ${sentence(interaction)}, involving ${context}.`;
      }

      if (context) {
        return `${name} encounters ${context}, and the experience takes its first active turn.`;
      }

      return `${name} encounters the first active condition of the experience.`;
    }

    case "need": {
      if (relation) return `${sentence(relation)}.`;

      if (target) {
        return `${name} needs to reach ${sentence(target)}.`;
      }

      if (context) {
        return `${name} has to work through ${context}.`;
      }

      return `${name} faces the immediate need created by the situation.`;
    }

    case "threshold": {
      if (relation) return `${sentence(relation)}.`;

      if (interaction) {
        return `${name} crosses into the next state by ${sentence(interaction)}.`;
      }

      if (context) {
        return `${name} moves deeper into ${context}.`;
      }

      return `${name} moves from the initial situation into action.`;
    }

    case "origin": {
      if (relation) return `${sentence(relation)}.`;

      if (context) {
        return `${name} brings ${context} into the present.`;
      }

      return `${name} brings the relevant history into the present.`;
    }

    case "encounter": {
      if (relation) {
        return `${sentence(relation)}, changing what happens next.`;
      }

      if (context) {
        return `${cap(context)} enters ${subjectValue}'s experience, changing what happens next.`;
      }

      return `${name} encounters a new condition that changes what happens next.`;
    }

    case "challenge": {
      if (relation) return `${sentence(relation)}.`;

      if (progression) {
        return `${name} has to deal with ${sentence(progression)}.`;
      }

      if (context) {
        return `${name} has to work through ${context}.`;
      }

      return `${name} meets a condition that requires a response.`;
    }

    case "discovery": {
      if (relation) return `${sentence(relation)}.`;

      if (context) {
        return `${name} discovers how ${context} changes the situation.`;
      }

      return `${name} discovers a new consequence of what has happened.`;
    }

    case "reveal": {
      if (relation) return `${sentence(relation)}.`;

      if (context) {
        return `${name} sees the significance of ${context} in what happens next.`;
      }

      return `${name} sees a consequence that was not visible at the beginning.`;
    }

    case "instruction": {
      if (relation) return `${sentence(relation)}.`;

      if (content) {
        return `${name} gets a usable next move: ${sentence(content)}.`;
      }

      if (interaction) {
        return `${name} can act next by ${sentence(interaction)}.`;
      }

      if (context) {
        return `${name} uses ${context} to determine the next move.`;
      }

      return `${name} receives a concrete next move.`;
    }

    case "action": {
      if (relation) return `${sentence(relation)}.`;

      if (interaction) {
        return `${name} acts through ${sentence(interaction)}.`;
      }

      if (context) {
        return `${name} acts on ${context}.`;
      }

      return `${name} takes the next concrete action.`;
    }

    case "feedback": {
      if (relation) return `${sentence(relation)}.`;

      if (target) {
        return `${name} gets a result that moves the experience toward ${sentence(target)}.`;
      }

      if (context) {
        return `${name} sees what ${context} changes about the situation.`;
      }

      return `${name} gets a result that changes the next decision.`;
    }

    case "contribution": {
      if (relation) {
        return `${sentence(relation)}, changing what becomes available next.`;
      }

      if (context) {
        return `${name} adds ${context}, changing what becomes available next.`;
      }

      return `${name} adds something that changes what becomes available next.`;
    }

    case "escalation": {
      if (relation) return `${sentence(relation)}.`;

      if (progression) {
        return `${name} pushes the experience further through ${sentence(progression)}.`;
      }

      if (context) {
        return `${name} pushes ${context} further than before.`;
      }

      return `${name} pushes the experience into a more intense state.`;
    }

    case "transformation": {
      if (transformation) {
        return `${name} moves from ${transformation[0]} toward ${transformation[1]}.`;
      }

      if (relation) return `${sentence(relation)}.`;

      if (target) {
        return `${name} changes through the experience and moves toward ${sentence(target)}.`;
      }

      if (context) {
        return `${name} is changed by what happens with ${context}.`;
      }

      return `${name} is changed by the accumulated experience.`;
    }

    case "reflection": {
      if (relation) return `${sentence(relation)}.`;

      if (context) {
        return `${name} looks back on what ${context} changed.`;
      }

      if (target) {
        return `${name} recognizes how the experience has moved toward ${sentence(target)}.`;
      }

      return `${name} recognizes the consequence of what happened.`;
    }

    case "provenance": {
      if (context) {
        return `${name} preserves the origin in ${context}.`;
      }

      return `${name} preserves where the experience came from.`;
    }

    case "identity": {
      if (relation) return `${sentence(relation)}.`;

      if (context) {
        return `${name} becomes identifiable through ${context}.`;
      }

      return `${name} becomes more distinct through what has happened.`;
    }

    case "milestone": {
      if (relation) return `${sentence(relation)}.`;

      if (progression) {
        return `${name} reaches a new state through ${sentence(progression)}.`;
      }

      if (target) {
        return `${name} reaches ${sentence(target)}.`;
      }

      if (context) {
        return `${name} reaches a new state marked by ${context}.`;
      }

      return `${name} reaches the next state of the experience.`;
    }

    case "unlock":
    case "earned_access": {
      if (relation) return `${sentence(relation)}.`;

      if (target) {
        return `${name} earns access to ${sentence(target)}.`;
      }

      if (context) {
        return `${name} unlocks what comes next through ${context}.`;
      }

      return `${name} earns access to the next state through what happened before it.`;
    }

    case "payoff": {
      if (relation) return `${sentence(relation)}.`;

      if (target && context) {
        return `${name} reaches ${sentence(target)}, with ${context} now part of the result.`;
      }

      if (target) {
        return `${name} reaches ${sentence(target)}.`;
      }

      if (context) {
        return `${name} reaches a result shaped by ${context}.`;
      }

      return `${name} reaches the result created by the experience.`;
    }

    case "next_step": {
      if (relation) return `${sentence(relation)}.`;

      if (progression) {
        return `${name} uses the current state to ${sentence(progression)}.`;
      }

      if (interaction) {
        return `${name} uses the current state to ${sentence(interaction)}.`;
      }

      if (context) {
        return `${name} uses ${context} to determine what happens next.`;
      }

      return `${name} uses the current state to determine the next action.`;
    }

    case "continuation": {
      if (relation) {
        return `${sentence(relation)}, leaving the next state open.`;
      }

      if (future) {
        return `${name} leaves room for ${sentence(future)}.`;
      }

      if (context) {
        return `${name} leaves the experience open through ${context}.`;
      }

      return `${name} leaves the experience open for another turn.`;
    }

    default:
      return context
        ? `${name} continues through ${context}.`
        : `${name} continues from the current state.`;
  }
}

function directive(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
) {
  const candidate = plan?.realization?.directives.find(
    (item) => item.kind === beat.kind,
  );

  if (
    !candidate ||
    candidate.confidence < 0.72 ||
    !clean(candidate.action)
  ) {
    return undefined;
  }

  return candidate;
}

/**
 * Directive actions are semantic material supplied by cognition.
 *
 * Do not bury the action inside compiler-language such as:
 * "The operative move is..."
 */
function directiveText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const item = directive(beat, plan);
  if (!item) return undefined;

  const name = cap(item.subject || subject(beat, plan));
  const action = sentence(item.action);
  const relation = semanticRelation(beat, plan);
  const target = outcome(plan);

  if (!action) return undefined;

  let text: string;

  switch (beat.kind) {
    case "orientation":
      text = `${name} enters the experience by ${action}.`;
      break;

    case "hook":
      text = `${name} encounters the first turn: ${action}.`;
      break;

    case "need":
      text = `${name} needs to ${action}.`;
      break;

    case "threshold":
      text = `${name} crosses into the next state by ${action}.`;
      break;

    case "origin":
      text = `${name} brings the relevant past into the present by ${action}.`;
      break;

    case "encounter":
      text = `${name} encounters a new condition when ${action}.`;
      break;

    case "challenge":
      text = `${name} has to respond by ${action}.`;
      break;

    case "discovery":
      text = `${name} discovers something important when ${action}.`;
      break;

    case "reveal":
      text = `${name} discovers the consequence: ${action}.`;
      break;

    case "instruction":
      text = `${name} gets a concrete next move: ${action}.`;
      break;

    case "action":
      text = `${name} acts: ${action}.`;
      break;

    case "feedback":
      text = `${name} sees the result when ${action}.`;
      break;

    case "contribution":
      text = `${name} changes the shared experience by ${action}.`;
      break;

    case "escalation":
      text = `${name} pushes the experience further by ${action}.`;
      break;

    case "transformation":
      text = `${name} changes as ${action}.`;
      break;

    case "reflection":
      text = `${name} recognizes what happened: ${action}.`;
      break;

    case "provenance":
      text = `${name} preserves the origin by ${action}.`;
      break;

    case "identity":
      text = `${name} becomes distinct through ${action}.`;
      break;

    case "milestone":
      text = `${name} reaches a new state when ${action}.`;
      break;

    case "unlock":
      text = `${name} unlocks the next state by ${action}.`;
      break;

    case "earned_access":
      text = `${name} earns the next state by ${action}.`;
      break;

    case "payoff":
      text = `${name} reaches the intended result: ${action}.`;
      break;

    case "next_step":
      text = `${name} uses the current state to ${action}.`;
      break;

    case "continuation":
      text = `${name} leaves the experience open by ${action}.`;
      break;

    default:
      text = `${name} advances by ${action}.`;
      break;
  }

  if (relation && !lower(text).includes(lower(relation))) {
    text = `${sentence(text)} ${sentence(relation)}.`;
  }

  if (
    target &&
    ["hook", "payoff", "continuation"].includes(beat.kind)
  ) {
    const targetWords = words(target);

    if (
      targetWords.length &&
      !targetWords.some((word) => lower(text).includes(lower(word)))
    ) {
      text = `${sentence(text)} This moves toward ${sentence(target)}.`;
    }
  }

  return text;
}

/**
 * Preserve multiple premise dimensions as part of the actual event.
 *
 * This replaces the old "The concrete detail is X" and
 * "It also carries X, Y forward" mechanism.
 *
 * The added clause must describe the relationship of the details to the
 * current beat, not merely enumerate them.
 */
function preserveConcreteEvidence(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const evidence = evidenceForBeat(beat, plan, 3);

  if (!evidence.length) {
    return text;
  }

  const normalized = lower(text);

  const missing = evidence.filter(
    (value) => !normalized.includes(lower(value)),
  );

  if (!missing.length) {
    return text;
  }

  const subjectValue = subject(beat, plan);
  const additions = missing.slice(0, 3);

  switch (beat.kind) {
    case "orientation":
      return `${sentence(text)} The situation includes ${additions.join(", ")}.`;

    case "hook":
      return `${sentence(text)} That turn involves ${additions.join(", ")}.`;

    case "encounter":
      return `${sentence(text)} The encounter brings in ${additions.join(", ")}.`;

    case "discovery":
    case "reveal":
      return `${sentence(text)} What becomes visible includes ${additions.join(", ")}.`;

    case "escalation":
      return `${sentence(text)} The escalation draws ${additions.join(", ")} deeper into the action.`;

    case "transformation":
      return `${sentence(text)} The change is expressed through ${additions.join(", ")}.`;

    case "reflection":
      return `${sentence(text)} The consequence is tied to ${additions.join(", ")}.`;

    case "payoff":
      return `${sentence(text)} The result is shaped by ${additions.join(", ")}.`;

    case "continuation":
      return `${sentence(text)} The next turn remains connected to ${additions.join(", ")}.`;

    case "contribution":
      return `${sentence(text)} The contribution adds ${additions.join(", ")} to ${subjectValue}.`;

    default:
      return `${sentence(text)} The action involves ${additions.join(", ")}.`;
  }
}

function preserveSemanticAction(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const item = directive(beat, plan);
  const action = sentence(item?.action);

  if (!item || !action || lower(text).includes(lower(action))) {
    return text;
  }

  return `${sentence(text)} ${cap(action)}.`;
}

function removeCompilerFiller(text: string): string {
  let result = sentence(text);

  for (const pattern of DEAD_PROSE) {
    result = result.replace(pattern, "").replace(/\s{2,}/g, " ").trim();
  }

  return sentence(result);
}

export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const directed = directiveText(beat, plan);

  let text = clean(directed ?? fallbackText(beat, plan));

  if (generic(text)) {
    text = clean(fallbackText(beat, plan));
  }

  text = removeCompilerFiller(text);
  text = preserveConcreteEvidence(text, beat, plan);
  text = preserveSemanticAction(text, beat, plan);
  text = removeCompilerFiller(text);

  return `${sentence(text)}.`;
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

/**
 * Diagnostic-only classification.
 * It never selects or realizes a story.
 */
export function classifyPremise(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): Record<string, boolean> {
  const text = lower(
    [
      beat.text,
      subject(beat, plan),
      ...ROLES.flatMap((role) => values(plan, role)),
      ...(plan?.emotionalIntent ?? []),
      ...(plan?.interactionModel ?? []),
      ...(plan?.futureEvolution ?? []),
    ].join(" "),
  );

  return {
    coupled: Boolean(plan?.premise?.relations.length),
    evidence: semanticEvidence(beat, plan).length > 0,
    outcome:
      Boolean(first(plan, "outcome")) ||
      /\b(remember|discover|return|connect|play|learn|change)\b/i.test(text),
    relationship: Boolean(
      plan?.premise?.relations.some(
        (item) => item.confidence >= 0.72,
      ),
    ),
    temporal: Boolean(
      first(plan, "temporal") ||
        plan?.futureEvolution?.length,
    ),
    social: Boolean(
      first(plan, "social") ||
        first(plan, "participants"),
    ),
    transformation: Boolean(first(plan, "transformation")),
    constraint: Boolean(first(plan, "constraint")),
  };
}