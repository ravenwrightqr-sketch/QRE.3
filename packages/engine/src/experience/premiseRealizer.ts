import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * Universal premise realization.
 *
 * This layer is deliberately NOT a library of subjects, industries, or
 * story templates. It reads the semantic forces already present in the beat,
 * prompt-derived evidence, and cognitive plan, then turns those forces into
 * observable events.
 *
 * The compiler should learn HOW a premise behaves:
 *   accumulation, contrast, discovery, participation, escalation, suspense,
 *   humor, absurdity, indulgence, transformation, utility, etc.
 *
 * It should never need a branch for "dog groomer", "birthday", "spa", or any
 * other noun in order to make the experience feel native to the prompt.
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The experience";

const DEAD = [
  /is the thing the experience puts into focus/i,
  /has become more meaningful/i,
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
  /what remains is the meaning/i,
  /the next layer/i,
  /another layer of/i,
  /the hidden relationship around/i,
  /the useful information is here/i,
  /meaningful point has been reached/i,
  /keeps moving because the premise has consequences/i,
];

const FORCE_WORDS = {
  funny: ["fun", "funny", "humor", "humorous", "laugh", "joke", "comic", "ridiculous"],
  frightening: ["terrifying", "horror", "haunted", "scary", "fear", "dread", "creepy", "threat", "danger"],
  absurd: ["absurd", "surreal", "bizarre", "impossible", "wild", "ridiculous", "unreasonable"],
  luxurious: ["luxury", "luxurious", "billionaire", "indulgent", "exclusive", "opulent", "lavish", "pamper"],
  accumulating: ["keep adding", "add to", "adds", "accumulate", "accumulates", "grows", "growing", "each person", "next person", "again", "over time", "builds up"],
  participatory: ["everyone", "family", "friends", "group", "community", "shared", "together", "contribute", "contribution", "participate", "people can"],
  contrast: ["before", "after", "transform", "transformation", "changed", "change", "restore", "cleaning", "chaos", "difference", "compare"],
  process: ["clean", "cleaning", "groom", "groomer", "build", "repair", "restore", "prepare", "launch", "document", "process", "step", "room by room"],
  discovery: ["discover", "discovery", "hidden", "secret", "uncover", "find", "forgotten", "reveal", "clue", "mystery", "unknown"],
  temporal: ["again", "return", "future", "later", "next", "over time", "keeps", "continue", "continuation"],
};

type ForceName = keyof typeof FORCE_WORDS;
type PremiseForces = Record<ForceName, boolean>;

const hasAny = (text: string, words: string[]) =>
  words.some((word) => text.includes(word));

function planText(plan?: CognitiveExperiencePlan): string {
  if (!plan) return "";

  return lower(
    [
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
    ].join(" "),
  );
}

function sourceText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return lower([beat.text, ...(beat.entities ?? []), planText(plan)].join(" "));
}

function classifyForces(beat: StoryBeat, plan?: CognitiveExperiencePlan): PremiseForces {
  const text = sourceText(beat, plan);

  return Object.fromEntries(
    (Object.keys(FORCE_WORDS) as ForceName[]).map((name) => [name, hasAny(text, FORCE_WORDS[name])]),
  ) as PremiseForces;
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return clean(
    plan?.centralSubject ||
      beat.entities?.[0] ||
      beat.text.split(/\s+/).slice(0, 6).join(" ") ||
      "the premise",
  );
}

function evidence(beat: StoryBeat, subjectValue: string): string[] {
  const subjectTokens = new Set(lower(subjectValue).split(/\s+/));

  return (beat.entities ?? [])
    .map(clean)
    .filter(Boolean)
    .filter((value) => !subjectTokens.has(lower(value)))
    .filter((value) => value.length > 2)
    .slice(0, 8);
}

function signal(plan: CognitiveExperiencePlan | undefined, field: keyof CognitiveExperiencePlan): string {
  const value = plan?.[field];
  if (typeof value === "string") return sentence(value);
  if (Array.isArray(value)) return sentence(String(value[0] ?? ""));
  return "";
}

function planPurpose(plan?: CognitiveExperiencePlan): string {
  return sentence(plan?.purpose ?? "");
}

function concreteFallback(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subjectValue = subject(beat, plan);
  const ev = evidence(beat, subjectValue);
  const progression = signal(plan, "progressionModel");
  const future = signal(plan, "futureEvolution");
  const interaction = signal(plan, "interactionModel");

  switch (beat.kind) {
    case "orientation": return ev.length ? `${cap(subjectValue)} starts with ${ev.slice(0, 2).join(" and ")}.` : `${cap(subjectValue)} starts here.`;
    case "hook": return ev.length ? `${cap(ev[0])} is the first thing that changes what happens next.` : `The first move creates a reason to keep going.`;
    case "encounter": return ev.length ? `${cap(ev[0])} changes what happens around ${subjectValue}.` : `${cap(subjectValue)} meets the next complication.`;
    case "escalation": return progression || `The next beat raises the stakes instead of repeating the last one.`;
    case "discovery":
    case "reveal": return ev.length ? `${cap(ev[0])} turns out to matter more than expected.` : `A new piece of evidence appears.`;
    case "transformation": return `The state of ${subjectValue} changes because of what happened.`;
    case "reflection": return plan?.emotionalIntent?.[0] ? `What remains is ${sentence(plan.emotionalIntent[0])}.` : `What happened leaves a concrete consequence behind.`;
    case "payoff": return planPurpose(plan) || `${cap(subjectValue)} reaches the consequence earned by the events before it.`;
    case "continuation": return future || `${cap(subjectValue)} leaves a live thread for what happens next.`;
    case "need": return signal(plan, "whyInteract") || `${cap(subjectValue)} has a concrete problem to solve.`;
    case "threshold": return `The ordinary version of ${subjectValue} ends here.`;
    case "origin": return signal(plan, "memoryModel") ? `${cap(subjectValue)} carries forward ${signal(plan, "memoryModel")}.` : `${cap(subjectValue)} brings something from before into the present.`;
    case "challenge": return progression || `Something has to be overcome before ${subjectValue} can advance.`;
    case "instruction": return interaction || `The next concrete move is clear.`;
    case "action": return interaction || `Make the move that changes ${subjectValue}.`;
    case "feedback": return `The result determines the next move.`;
    case "contribution": return `Someone adds something that changes the next version of ${subjectValue}.`;
    case "identity": return `${cap(subjectValue)} becomes more specific through what people actually do with it.`;
    case "milestone": return progression || `The process has crossed a point that changes the next stage.`;
    case "unlock":
    case "earned_access": return signal(plan, "rewardModel") || `Something previously unavailable is now open.`;
    case "next_step": return progression || `The next move follows directly from what just happened.`;
    default: return clean(beat.text);
  }
}

function realizeByForces(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subjectValue = subject(beat, plan);
  const subjectName = cap(subjectValue);
  const ev = evidence(beat, subjectValue);
  const forces = classifyForces(beat, plan);
  const why = signal(plan, "whyInteract");
  const interaction = signal(plan, "interactionModel");
  const discovery = signal(plan, "discoveryModel");
  const progression = signal(plan, "progressionModel");
  const reward = signal(plan, "rewardModel");
  const future = signal(plan, "futureEvolution");

  if (forces.accumulating && forces.participatory) {
    if (beat.kind === "orientation") return `${subjectName} starts with one version, and the next person gets to change it.`;
    if (beat.kind === "encounter" || beat.kind === "contribution") return `Someone adds to ${subjectValue}, creating material for the next person to react to.`;
    if (beat.kind === "reflection") return `The original version is now surrounded by additions, reactions, corrections, and new details.`;
    if (beat.kind === "payoff") return reward || `${subjectName} has become a shared thing that no single person controls anymore.`;
    if (beat.kind === "continuation") return future || `The next contribution can change what everyone finds later.`;
  }

  if (forces.contrast && forces.process) {
    if (beat.kind === "orientation") return `${subjectName} starts in its before-state, with the work still ahead.`;
    if (beat.kind === "hook" || beat.kind === "encounter") return ev.length ? `The first pass exposes ${ev[0]}, making the difference visible.` : `The first pass makes the starting state impossible to ignore.`;
    if (beat.kind === "escalation") return progression || `The contrast keeps growing as one completed section reveals what remains.`;
    if (beat.kind === "transformation") return `${subjectName} crosses from its starting state into the state the work has created.`;
    if (beat.kind === "payoff") return `${subjectName} can finally be compared with the version that existed before the work began.`;
  }

  if (forces.process) {
    if (beat.kind === "orientation") return `${subjectName} starts with the work ready to begin.`;
    if (beat.kind === "hook" || beat.kind === "encounter") return ev.length ? `The first pass works directly on ${subjectValue}, exposing ${ev[0]}.` : `The first pass changes something concrete about ${subjectValue}.`;
    if (beat.kind === "escalation") return progression || `Each pass creates the condition for the next one.`;
    if (beat.kind === "transformation") return `${subjectName} changes as the work moves through it.`;
    if (beat.kind === "payoff") return `${subjectName} reaches the state the work was trying to create.`;
    if (beat.kind === "continuation") return future || `The work leaves a clear starting point for whatever comes next.`;
  }

  if (forces.frightening) {
    if (beat.kind === "orientation" || beat.kind === "hook") return `${subjectName} looks ordinary just long enough for something to feel wrong.`;
    if (beat.kind === "encounter" || beat.kind === "discovery" || beat.kind === "reveal") return discovery ? `The first sign is ${discovery}. It is worse than it should be.` : `Something is wrong with ${subjectValue}, and the evidence keeps getting harder to explain.`;
    if (beat.kind === "escalation" || beat.kind === "challenge") return progression ? `The danger tightens: ${progression}.` : `The safe version of the situation disappears one detail at a time.`;
    if (beat.kind === "payoff" || beat.kind === "transformation") return reward ? `The reveal pays off with ${reward}.` : `The final reveal makes the earlier clues impossible to dismiss.`;
    if (beat.kind === "continuation") return future ? `And it is not over: ${future}.` : `The last clue leaves one door open, which is the worst part.`;
  }

  if (forces.absurd || forces.luxurious) {
    if (beat.kind === "orientation" || beat.kind === "hook") return forces.luxurious ? `${subjectName} begins at an unreasonable level of indulgence.` : `${subjectName} starts normally, then takes a turn nobody sensible would have approved.`;
    if (beat.kind === "encounter" || beat.kind === "discovery") return ev.length ? `${cap(ev[0])} enters the scene and pushes the scale of ${subjectValue} further.` : `The next detail pushes ${subjectValue} past ordinary logic.`;
    if (beat.kind === "escalation") return progression ? `Then it escalates: ${progression}.` : `Each new step has to outdo the last one.`;
    if (beat.kind === "payoff") return reward ? `The payoff goes all the way: ${reward}.` : `By the end, the premise has become gloriously excessive.`;
    if (beat.kind === "continuation") return future ? `There is another escalation waiting: ${future}.` : `There is still room to make it bigger.`;
  }

  if (forces.funny) {
    if (beat.kind === "orientation") return `${subjectName} begins with a perfectly normal premise that is about to stop behaving normally.`;
    if (beat.kind === "hook") return why || (ev.length ? `${cap(ev[0])} is where the joke starts.` : `The first move creates the joke.`);
    if (beat.kind === "encounter" || beat.kind === "escalation") return progression ? `The situation gets funnier by escalating: ${progression}.` : `The next beat makes the situation harder to take seriously.`;
    if (beat.kind === "reflection") return plan?.emotionalIntent?.[0] ? `The aftermath carries ${sentence(plan.emotionalIntent[0])}.` : `The aftermath is funnier because everyone now has a version of what happened.`;
    if (beat.kind === "payoff") return reward || `The payoff lands by pushing the premise farther than anyone expected.`;
    if (beat.kind === "continuation") return future || `There is still another opportunity to make the premise worse in the best possible way.`;
  }

  if (forces.discovery) {
    if (beat.kind === "orientation") return `${subjectName} is the visible starting point; the useful evidence has not surfaced yet.`;
    if (beat.kind === "hook") return ev.length ? `Start with ${cap(ev[0])}; it is the first thread worth pulling.` : `There is a thread here worth pulling.`;
    if (beat.kind === "discovery" || beat.kind === "reveal") return discovery ? `The evidence opens: ${discovery}.` : `One discovered detail points to another.`;
    if (beat.kind === "payoff") return reward || `The pieces finally line up.`;
    if (beat.kind === "continuation") return future || `Enough remains unresolved to keep looking.`;
  }

  if (forces.temporal && beat.kind === "continuation") return future || `The next return starts with everything that happened before.`;

  return concreteFallback(beat, plan);
}

function isDeadProse(value: string): boolean {
  return DEAD.some((pattern) => pattern.test(value));
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const value = clean(realizeByForces(beat, plan));
  return !value || isDeadProse(value) ? clean(concreteFallback(beat, plan)) : value;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat, index) => ({ ...beat, order: index, text: realizePremiseBeat(beat, plan) }));
}

export function isGenericCompilerProse(value: string): boolean {
  return isDeadProse(value);
}

export type PremiseRealizationMode = PremiseForces;

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): PremiseRealizationMode {
  return classifyForces(beat, plan);
}
