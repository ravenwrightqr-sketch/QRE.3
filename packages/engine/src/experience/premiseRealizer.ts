import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * Universal premise realization.
 *
 * The realizer is deliberately subject-agnostic. It does not know industries,
 * nouns, or story templates. Cognition supplies semantic forces and the beat
 * supplies evidence; this layer turns those signals into concrete events.
 *
 * Design rule:
 *   semantic force + evidence + beat stage -> observable realization
 *
 * Not:
 *   subject name -> canned story.
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The premise";
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "can",
  "create", "do", "for", "from", "get", "give", "has", "have", "how",
  "i", "in", "into", "is", "it", "its", "make", "my", "of", "on", "or",
  "people", "that", "the", "their", "this", "to", "turn", "up", "was",
  "we", "what", "when", "where", "who", "with", "you", "your",
]);

const DEAD_PROSE = [
  /is the thing the experience puts into focus/i,
  /has become more meaningful through the interaction/i,
  /deserves a closer look/i,
  /the experience leaves a meaning behind/i,
  /the next interaction can change what/i,
  /giving the moment a direction/i,
  /what the experience has revealed/i,
  /lands differently because of everything that happened/i,
  /enters the story through/i,
  /gives the story somewhere concrete to begin/i,
  /the story starts pulling/i,
  /the experience moves forward through/i,
  /the subject now means more/i,
  /another layer of/i,
  /hidden relationship around/i,
  /meaningful point has been reached/i,
  /continues to develop through the interaction/i,
  /the next layer/i,
];

const FORCE_WORDS = {
  humor: ["fun", "funny", "humor", "humorous", "laugh", "joke", "comic", "ridiculous"],
  suspense: ["terrifying", "horror", "haunted", "scary", "fear", "dread", "creepy", "threat", "danger", "suspense"],
  absurdity: ["absurd", "surreal", "bizarre", "impossible", "wild", "ridiculous", "unreasonable"],
  indulgence: ["luxury", "luxurious", "billionaire", "indulgent", "exclusive", "opulent", "lavish", "pamper"],
  accumulation: ["keep adding", "add to", "adds", "accumulate", "accumulates", "grows", "growing", "each person", "next person", "again", "over time", "builds up"],
  participation: ["everyone", "family", "friends", "group", "community", "shared", "together", "contribute", "contribution", "participate", "people can"],
  contrast: ["before", "after", "transform", "transformation", "changed", "change", "restore", "cleaning", "chaos", "difference", "compare"],
  process: ["clean", "cleaning", "groom", "groomer", "build", "repair", "restore", "prepare", "launch", "document", "process", "step", "room by room"],
  discovery: ["discover", "discovery", "hidden", "secret", "uncover", "find", "forgotten", "reveal", "clue", "mystery", "unknown"],
  temporal: ["again", "return", "future", "later", "next", "over time", "keeps", "continue", "continuation"],
  memory: ["memory", "remember", "remembered", "grandmother", "grandma", "past", "history", "story", "keepsake", "folklore"],
  social: ["everyone", "family", "friends", "group", "community", "together", "shared", "people", "relationship"],
  utility: ["useful", "help", "solve", "answer", "instruction", "guide", "fix", "need", "practical"],
} as const;

type ForceName = keyof typeof FORCE_WORDS;
type PremiseForces = Record<ForceName, boolean>;

function planText(plan?: CognitiveExperiencePlan): string {
  if (!plan) return "";
  return lower([
    plan.direction ?? "",
    plan.centralSubject ?? "",
    plan.purpose ?? "",
    ...(plan.whyInteract ?? []),
    ...(plan.storyStructure ?? []),
    ...(plan.interactionModel ?? []),
    ...(plan.memoryModel ?? []),
    ...(plan.geographicModel ?? []),
    ...(plan.socialModel ?? []),
    ...(plan.discoveryModel ?? []),
    ...(plan.rewardModel ?? []),
    ...(plan.commerceModel ?? []),
    ...(plan.progressionModel ?? []),
    ...(plan.contentModel ?? []),
    ...(plan.dynamicBehavior ?? []),
    ...(plan.futureEvolution ?? []),
    ...(plan.creativePossibilities ?? []),
    ...(plan.emotionalIntent ?? []),
  ].join(" "));
}

function signal(plan: CognitiveExperiencePlan | undefined, field: keyof CognitiveExperiencePlan): string {
  const value = plan?.[field];
  if (typeof value === "string") return sentence(value);
  if (Array.isArray(value)) return sentence(String(value[0] ?? ""));
  return "";
}

function classifyForces(beat: StoryBeat, plan?: CognitiveExperiencePlan): PremiseForces {
  const text = lower([beat.text, ...(beat.entities ?? []), planText(plan)].join(" "));
  return Object.fromEntries(
    (Object.keys(FORCE_WORDS) as ForceName[]).map((name) => [
      name,
      FORCE_WORDS[name].some((word) => text.includes(word)),
    ]),
  ) as PremiseForces;
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return clean(plan?.centralSubject || beat.entities?.[0] || "the premise");
}

function anchorWords(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectTokens = new Set(lower(subject(beat, plan)).split(/\s+/));
  const source = [beat.text, ...(beat.entities ?? [])].join(" ");
  const words = source
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter((word) => word.length > 2)
    .filter((word) => !STOP.has(lower(word)))
    .filter((word) => !subjectTokens.has(lower(word)));

  return [...new Map(words.map((word) => [lower(word), word])).values()].slice(0, 6);
}

function anchor(anchors: string[], index = 0): string {
  return anchors[index] ?? "the situation";
}

function premiseNoun(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const anchors = anchorWords(beat, plan);
  return anchors[0] ?? subject(beat, plan);
}

function realizeGenericStage(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subjectValue = subject(beat, plan);
  const name = cap(subjectValue);
  const anchors = anchorWords(beat, plan);
  const why = signal(plan, "whyInteract");
  const purpose = signal(plan, "purpose");
  const interaction = signal(plan, "interactionModel");
  const progression = signal(plan, "progressionModel");
  const future = signal(plan, "futureEvolution");
  const reward = signal(plan, "rewardModel");

  switch (beat.kind) {
    case "orientation":
      return anchors.length
        ? `${name} starts with ${anchors.slice(0, 2).join(" and ")} already in play.`
        : `${name} starts in its present state, before anything has changed.`;
    case "hook":
      return why
        ? `${cap(why)} puts ${name} under pressure to respond.`
        : anchors.length
          ? `${cap(anchor(anchors))} creates the first concrete reason to continue.`
          : `${name} meets the first event that can change the outcome.`;
    case "encounter":
      return anchors.length
        ? `${cap(anchor(anchors, 1))} enters the situation and changes what ${subjectValue} can do next.`
        : `${name} meets a new condition that changes the next move.`;
    case "escalation":
      return progression || `${name} faces a stronger consequence than the previous beat.`;
    case "discovery":
    case "reveal":
      return anchors.length
        ? `${cap(anchor(anchors))} becomes evidence for something that was not obvious at the start.`
        : `A new piece of evidence changes the working explanation.`;
    case "transformation":
      return `${name} moves from its starting state into a state created by what happened.`;
    case "reflection":
      return plan?.emotionalIntent?.length
        ? `What remains carries ${sentence(plan.emotionalIntent[0])}.`
        : `${name} leaves a concrete consequence behind.`;
    case "payoff":
      return reward || purpose || `${name} reaches the consequence earned by the events before it.`;
    case "continuation":
      return future || `${name} leaves a live thread for whatever happens next.`;
    case "need":
      return why || `${name} has a concrete problem that gives the interaction a job.`;
    case "threshold":
      return `${name} reaches the point where the ordinary version of the situation no longer holds.`;
    case "origin":
      return signal(plan, "memoryModel")
        ? `${name} brings ${signal(plan, "memoryModel")} into the present.`
        : `${name} carries an earlier state into this moment.`;
    case "challenge":
      return progression || `${name} has to overcome a concrete obstacle before the next state is possible.`;
    case "instruction":
      return interaction || `${name} gets a concrete next move rather than another explanation.`;
    case "action":
      return interaction || `The participant makes a move that changes ${subjectValue}.`;
    case "feedback":
      return `${name} produces a result, and that result determines the next move.`;
    case "contribution":
      return `A new contribution changes the next version of ${subjectValue}.`;
    case "identity":
      return `${name} becomes more specific through what people actually do with it.`;
    case "milestone":
      return progression || `${name} crosses a point that changes the next stage.`;
    case "unlock":
    case "earned_access":
      return reward || `A new capability becomes available because of what just happened.`;
    case "next_step":
      return progression || `The next move follows directly from the state reached here.`;
    default:
      return beat.text?.trim() || `${name} continues from the state created by the previous event.`;
  }
}

function realizeByForces(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subjectValue = subject(beat, plan);
  const name = cap(subjectValue);
  const anchors = anchorWords(beat, plan);
  const forces = classifyForces(beat, plan);
  const why = signal(plan, "whyInteract");
  const progression = signal(plan, "progressionModel");
  const future = signal(plan, "futureEvolution");
  const reward = signal(plan, "rewardModel");
  const discovery = signal(plan, "discoveryModel");
  const emotional = signal(plan, "emotionalIntent");

  // Semantic force combinations are intentionally compositional. There are
  // no branches for nouns such as "dog", "birthday", "spa", etc.
  if (forces.accumulation && (forces.participation || forces.social)) {
    switch (beat.kind) {
      case "orientation": return `${name} starts with one version, and another person can alter it.`;
      case "encounter":
      case "contribution": return `A new contribution changes ${subjectValue}, leaving something for the next person to react to.`;
      case "reflection": return `The original version is now surrounded by additions, reactions, corrections, and new details.`;
      case "payoff": return reward || `${name} has become something shared rather than something controlled by one person.`;
      case "continuation": return future || `The next contribution can change what everyone finds later.`;
    }
  }

  if (forces.contrast && forces.process) {
    switch (beat.kind) {
      case "orientation": return `${name} starts in its before-state, with the work still ahead.`;
      case "hook":
      case "encounter": return anchors.length ? `The first pass works on ${subjectValue}, exposing ${anchor(anchors)}.` : `The first pass makes the starting state impossible to ignore.`;
      case "escalation": return progression || `Each completed section makes the remaining difference more visible.`;
      case "transformation": return `${name} crosses from its starting state into the state the work created.`;
      case "payoff": return `${name} can now be compared with the version that existed before the work began.`;
    }
  }

  if (forces.process) {
    switch (beat.kind) {
      case "orientation": return anchors.length ? `${name} starts with ${anchor(anchors)} ready to be worked on.` : `${name} starts with the work ready to begin.`;
      case "hook":
      case "encounter": return anchors.length ? `The first pass works directly on ${subjectValue}, exposing ${anchor(anchors)}.` : `The first pass changes something concrete about ${subjectValue}.`;
      case "escalation": return progression || `Each pass creates the condition for the next one.`;
      case "transformation": return `${name} changes as the work moves through it.`;
      case "payoff": return `${name} reaches the state the work was trying to create.`;
      case "continuation": return future || `The work leaves a clear starting point for whatever comes next.`;
    }
  }

  if (forces.suspense) {
    switch (beat.kind) {
      case "orientation": return `${name} looks ordinary just long enough for something to feel wrong.`;
      case "hook": return anchors.length ? `${cap(anchor(anchors))} is the first sign that the situation is not what it seems.` : `${name} gives the first sign that the safe explanation is failing.`;
      case "encounter":
      case "discovery":
      case "reveal": return discovery ? `The evidence turns darker: ${discovery}.` : `Another detail makes the harmless explanation harder to believe.`;
      case "escalation":
      case "challenge": return progression ? `The danger tightens: ${progression}.` : `The safe version of the situation disappears one detail at a time.`;
      case "transformation":
      case "payoff": return reward ? `The reveal pays off with ${reward}.` : `The final reveal makes the earlier clues impossible to dismiss.`;
      case "continuation": return future ? `The threat is still active: ${future}.` : `One unanswered clue remains, and it is enough to keep the danger alive.`;
    }
  }

  if (forces.absurdity || forces.indulgence) {
    switch (beat.kind) {
      case "orientation": return forces.indulgence ? `${name} begins at an unreasonable level of indulgence.` : `${name} begins normally, then takes a turn nobody sensible would have approved.`;
      case "hook": return anchors.length ? `${cap(anchor(anchors))} pushes ${subjectValue} past ordinary limits.` : `The first move pushes ${subjectValue} past ordinary logic.`;
      case "encounter":
      case "discovery": return anchors.length ? `${cap(anchor(anchors, 1))} raises the scale again.` : `The next detail makes the situation even more excessive.`;
      case "escalation": return progression ? `Then it escalates: ${progression}.` : `Each new step has to outdo the last one.`;
      case "transformation": return `${name} is no longer operating at an ordinary scale.`;
      case "payoff": return reward ? `The payoff goes all the way: ${reward}.` : `By the end, the premise has become gloriously excessive.`;
      case "continuation": return future || `There is still room to make it bigger.`;
    }
  }

  if (forces.humor) {
    switch (beat.kind) {
      case "orientation": return `${name} begins with a recognizable premise that is about to stop behaving normally.`;
      case "hook": return why || (anchors.length ? `${cap(anchor(anchors))} is where the joke starts.` : `The first move creates the joke.`);
      case "encounter":
      case "escalation": return progression ? `The situation gets funnier by escalating: ${progression}.` : `The next event makes the situation harder to take seriously.`;
      case "reflection": return emotional ? `The aftermath carries ${emotional}.` : `The aftermath gets funnier because everyone now has a version of what happened.`;
      case "payoff": return reward || `The payoff lands by pushing the premise farther than anyone expected.`;
      case "continuation": return future || `There is another opportunity to make the premise worse in the best possible way.`;
    }
  }

  if (forces.discovery || forces.memory) {
    switch (beat.kind) {
      case "orientation": return `${name} is the visible starting point; the useful evidence has not surfaced yet.`;
      case "origin": return signal(plan, "memoryModel") ? `${name} carries ${signal(plan, "memoryModel")} into the present.` : `${name} brings an earlier version into the present.`;
      case "hook": return anchors.length ? `Start with ${cap(anchor(anchors))}; it is the first thread worth pulling.` : `There is a concrete thread here worth pulling.`;
      case "discovery":
      case "reveal": return discovery ? `The evidence opens: ${discovery}.` : `One discovered detail points to another.`;
      case "reflection": return emotional ? `What remains carries ${emotional}.` : `The discovered details change the story that can be told about ${subjectValue}.`;
      case "payoff": return reward || `The pieces finally line up.`;
      case "continuation": return future || `Enough remains unresolved to keep looking.`;
    }
  }

  if (forces.temporal && beat.kind === "continuation") {
    return future || `The next return starts with everything that happened before.`;
  }

  return realizeGenericStage(beat, plan);
}

function isDeadProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const value = clean(realizeByForces(beat, plan));
  if (value && !isDeadProse(value)) return value;

  // Never restore the removed boilerplate. If a semantic realization somehow
  // trips a dead-prose guard, use the raw beat as the last evidence-bearing
  // fallback rather than manufacturing generic significance language.
  return clean(beat.text) || `${cap(subject(beat, plan))} continues from the current state.`;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat, index) => ({
    ...beat,
    order: index,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  return isDeadProse(value);
}

export type PremiseRealizationMode = PremiseForces;

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): PremiseRealizationMode {
  return classifyForces(beat, plan);
}
