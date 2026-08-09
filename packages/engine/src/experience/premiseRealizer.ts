import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL PREMISE REALIZER
 *
 * This layer is deliberately domain-neutral. It does not contain a catalog of
 * subjects, industries, or noun-specific stories. It turns the evidence that
 * cognition has already extracted into observable events.
 *
 * Design law:
 *
 *   prompt evidence + cognitive signals + beat role
 *     -> concrete realization
 *
 * The realizer must preserve the user's premise bundle. If a prompt contains
 * an event, a medium, a person, an action, and an intended human outcome, the
 * realization should carry several of those dimensions instead of selecting
 * one convenient noun and falling back to generic significance prose.
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const cap = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "The premise";
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "can", "could",
  "create", "do", "does", "doing", "for", "from", "get", "give", "gives", "given",
  "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "make", "makes",
  "making", "me", "my", "of", "on", "or", "our", "people", "please", "that", "the",
  "their", "this", "those", "to", "turn", "up", "was", "we", "what", "when", "where",
  "which", "who", "with", "you", "your", "something", "someone", "thing", "experience",
  "story", "about", "through", "just", "more", "than", "then", "now", "will", "into",
]);

const DEAD_PROSE = [
  /is the thing the experience puts into focus/i,
  /has become more meaningful through the interaction/i,
  /something about .* deserves a closer look/i,
  /deserves a closer look/i,
  /the experience leaves a meaning behind/i,
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
  /the next move follows from the state reached here/i,
];

const FORCE_WORDS = {
  humor: ["fun", "funny", "humor", "humorous", "laugh", "laughter", "joke", "comic", "playful", "ridiculous"],
  suspense: ["terrifying", "terror", "horror", "haunted", "scary", "fear", "dread", "creepy", "threat", "danger", "suspense", "unease"],
  absurdity: ["absurd", "surreal", "bizarre", "impossible", "wild", "ridiculous", "unreasonable", "excessive"],
  indulgence: ["luxury", "luxurious", "billionaire", "indulgent", "exclusive", "opulent", "lavish", "pamper", "extravagant"],
  accumulation: ["keep adding", "add to", "adds", "adding", "accumulate", "accumulates", "grows", "growing", "each person", "next person", "again", "over time", "keeps growing", "builds up"],
  participation: ["everyone", "family", "friends", "group", "community", "shared", "together", "contribute", "contribution", "participate", "members"],
  contrast: ["before", "after", "transform", "transformation", "changed", "change", "restore", "difference", "compare", "compared", "old state", "new state"],
  process: ["build", "building", "repair", "repairing", "restore", "restoring", "prepare", "preparing", "process", "processing", "step", "steps", "work through", "one by one", "room by room", "cleaning"],
  discovery: ["discover", "discovery", "hidden", "secret", "uncover", "find", "forgotten", "reveal", "clue", "mystery", "unknown", "look for", "search", "document", "documents"],
  temporal: ["again", "return", "future", "later", "next", "over time", "keeps", "continue", "continuation", "comes back", "keeps going"],
  memory: ["memory", "remember", "remembered", "past", "history", "childhood", "keepsake", "folklore", "legacy", "preserve", "preserved", "rememberable", "remembering"],
  social: ["everyone", "family", "friends", "group", "community", "together", "shared", "people", "relationship", "collective", "members"],
  utility: ["useful", "help", "solve", "answer", "instruction", "guide", "fix", "need", "practical", "task", "how to"],
  media: ["qr", "nfc", "photo", "image", "video", "film", "music", "song", "voice", "recording", "scan", "scanned"],
} as const;

type ForceName = keyof typeof FORCE_WORDS;
type PremiseForces = Record<ForceName, boolean>;

type SignalField = keyof CognitiveExperiencePlan;

function planValue(plan: CognitiveExperiencePlan | undefined, field: SignalField): string[] {
  const value = plan?.[field];
  if (typeof value === "string") return value.trim() ? [sentence(value)] : [];
  if (Array.isArray(value)) return value.map(String).map(sentence).filter(Boolean);
  return [];
}

function planText(plan?: CognitiveExperiencePlan): string {
  if (!plan) return "";
  const fields: SignalField[] = [
    "direction", "centralSubject", "purpose", "whyInteract", "storyStructure",
    "interactionModel", "memoryModel", "geographicModel", "socialModel",
    "discoveryModel", "rewardModel", "progressionModel", "contentModel",
    "dynamicBehavior", "futureEvolution", "creativePossibilities", "emotionalIntent",
  ];
  return lower(fields.flatMap((field) => planValue(plan, field)).join(" "));
}

function sourceText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return lower([
    beat.text,
    ...(beat.entities ?? []),
    plan?.centralSubject ?? "",
    plan?.purpose ?? "",
    planText(plan),
  ].join(" "));
}

function classifyForces(beat: StoryBeat, plan?: CognitiveExperiencePlan): PremiseForces {
  const text = sourceText(beat, plan);
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

function tokens(value: string): string[] {
  return clean(value)
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter(Boolean);
}

/**
 * Preserve distinctive evidence, including short technical tokens such as
 * QR, NFC, AI, XR, etc. The old >2 character cutoff silently deleted these
 * and caused coupled prompts to collapse.
 */
function anchorWords(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectTokens = new Set(tokens(lower(subject(beat, plan))));
  const raw = [
    ...(beat.entities ?? []),
    beat.text,
    plan?.centralSubject ?? "",
    plan?.purpose ?? "",
    ...planValue(plan, "whyInteract"),
    ...planValue(plan, "creativePossibilities"),
    ...planValue(plan, "contentModel"),
    ...planValue(plan, "discoveryModel"),
    ...planValue(plan, "memoryModel"),
    ...planValue(plan, "socialModel"),
  ].join(" ");

  const words = tokens(raw)
    .filter((word) => word.length > 1)
    .filter((word) => !STOP.has(lower(word)))
    .filter((word) => !subjectTokens.has(lower(word)));

  return [...new Map(words.map((word) => [lower(word), word])).values()].slice(0, 14);
}

function anchor(anchors: string[], index = 0): string {
  return anchors[index] ?? "the situation";
}

function hasForce(anchors: string[], force: ForceName): boolean {
  return anchors.some((value) => FORCE_WORDS[force].some((word) => lower(value).includes(word)));
}

function firstForceAnchor(anchors: string[], force: ForceName): string | undefined {
  return anchors.find((value) => FORCE_WORDS[force].some((word) => lower(value).includes(word)));
}

function signal(plan: CognitiveExperiencePlan | undefined, field: SignalField): string {
  return planValue(plan, field)[0] ?? "";
}

function bundle(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const anchors = anchorWords(beat, plan);
  const forces = classifyForces(beat, plan);
  const result = [...anchors];

  for (const force of Object.keys(FORCE_WORDS) as ForceName[]) {
    if (forces[force]) {
      const value = firstForceAnchor(anchors, force);
      if (value) result.push(value);
    }
  }

  for (const field of ["purpose", "whyInteract", "interactionModel", "memoryModel", "futureEvolution", "rewardModel"] as SignalField[]) {
    result.push(...planValue(plan, field));
  }

  return [...new Map(result.map((value) => [lower(value), value])).values()].slice(0, 8);
}

/**
 * Composite realization is the universal intelligence layer. It reasons over
 * combinations of forces instead of hard-coding subjects. New nouns inherit
 * these operations automatically.
 */
function composite(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const subjectValue = subject(beat, plan);
  const name = cap(subjectValue);
  const anchors = bundle(beat, plan);
  const forces = classifyForces(beat, plan);
  const evidence = anchors.slice(0, 3).join(", ");
  const purpose = signal(plan, "purpose");
  const why = signal(plan, "whyInteract");
  const interaction = signal(plan, "interactionModel");
  const progression = signal(plan, "progressionModel");
  const future = signal(plan, "futureEvolution");
  const reward = signal(plan, "rewardModel");
  const memory = signal(plan, "memoryModel");
  const discovery = signal(plan, "discoveryModel");
  const emotional = signal(plan, "emotionalIntent");

  // Coupled medium/event/human-outcome premises.
  if (forces.media && (forces.memory || forces.social || forces.participation)) {
    switch (beat.kind) {
      case "orientation":
        return `${name} begins with ${evidence || "a live moment"} present and ready to be experienced.`;
      case "hook":
      case "encounter":
      case "action":
        return `${cap(anchor(anchors))} turns the moment into something people can participate in and carry forward.`;
      case "discovery":
      case "reveal":
        return `${cap(anchor(anchors))} surfaces another concrete part of the moment, leaving a human trace attached.`;
      case "reflection":
        return `${name} now contains a record of what people shared, crossed, noticed, or remembered.`;
      case "payoff":
        return reward || memory || `${name} becomes a concrete record of the event instead of a moment that disappears when it ends.`;
      case "continuation":
        return future || `Another interaction can add a person, crossing, detail, or memory without replacing what is already there.`;
    }
  }

  // Accumulation + social participation.
  if (forces.accumulation && (forces.social || forces.participation)) {
    switch (beat.kind) {
      case "orientation": return `${name} starts with one version already present, and another person can change it.`;
      case "encounter":
      case "contribution": return anchors.length ? `${cap(anchor(anchors))} is added to ${subjectValue}, giving the next person something concrete to react to.` : `A new contribution changes ${subjectValue}, giving the next person something concrete to react to.`;
      case "reflection": return `The original version now carries the additions, reactions, corrections, and details people left behind.`;
      case "payoff": return reward || `${name} has become a shared artifact rather than a version controlled by one person.`;
      case "continuation": return future || `The next contribution can change what everyone encounters later.`;
    }
  }

  // Process + contrast gives transformations a before/after state.
  if (forces.contrast && forces.process) {
    switch (beat.kind) {
      case "orientation": return `${name} starts in its before-state, with the work still ahead.`;
      case "hook":
      case "encounter": return anchors.length ? `The first pass works on ${subjectValue}, exposing ${anchor(anchors)}.` : `The first pass makes the starting state concrete.`;
      case "escalation": return progression || `Each completed part makes the remaining difference more visible.`;
      case "transformation": return `${name} crosses from its starting state into the state the work created.`;
      case "payoff": return `${name} can now be compared with the version that existed before the work began.`;
      case "continuation": return future || `The changed state becomes the starting point for the next pass.`;
    }
  }

  // Suspense + discovery makes evidence drive the escalation.
  if (forces.suspense) {
    switch (beat.kind) {
      case "orientation": return `${name} appears ordinary just long enough for one concrete detail to feel wrong.`;
      case "hook": return anchors.length ? `${cap(anchor(anchors))} is the first evidence that the harmless explanation is failing.` : `${name} supplies the first evidence that the harmless explanation is failing.`;
      case "encounter":
      case "discovery":
      case "reveal": return discovery ? `The evidence turns darker: ${discovery}.` : `${cap(anchor(anchors))} makes the safe explanation harder to believe.`;
      case "escalation":
      case "challenge": return progression || `The safe explanation loses another piece of ground.`;
      case "transformation":
      case "payoff": return reward || `The final evidence makes the earlier warning impossible to dismiss.`;
      case "continuation": return future || `One unresolved detail keeps the danger active.`;
    }
  }

  // Absurdity and indulgence alter scale rather than subject matter.
  if (forces.absurdity || forces.indulgence) {
    switch (beat.kind) {
      case "orientation": return forces.indulgence ? `${name} begins at an unreasonable level of indulgence.` : `${name} begins normally, then takes a turn that ignores ordinary limits.`;
      case "hook": return anchors.length ? `${cap(anchor(anchors))} pushes ${subjectValue} past ordinary limits.` : `${name} is pushed past ordinary logic.`;
      case "encounter":
      case "escalation": return progression || `The next move raises the scale again instead of settling it down.`;
      case "transformation": return `${name} is no longer operating at an ordinary scale.`;
      case "payoff": return reward || `By the end, the premise has become deliberately excessive.`;
      case "continuation": return future || `There is still room to make the premise even more extreme.`;
    }
  }

  if (forces.humor) {
    switch (beat.kind) {
      case "orientation": return `${name} starts with a recognizable setup that is about to stop behaving normally.`;
      case "hook": return why || (anchors.length ? `${cap(anchor(anchors))} is where the joke starts.` : `The first move creates the joke.`);
      case "encounter":
      case "escalation": return progression ? `The situation gets funnier by escalating through ${progression}.` : `The next event makes the setup harder to take seriously.`;
      case "reflection": return emotional ? `The aftermath carries ${emotional}.` : `The aftermath gets funnier because everyone now has a version of what happened.`;
      case "payoff": return reward || `The payoff lands by pushing the premise farther than the setup promised.`;
      case "continuation": return future || `The next interaction has room to make the premise worse in the best possible way.`;
    }
  }

  if (forces.discovery || forces.memory) {
    switch (beat.kind) {
      case "orientation": return anchors.length ? `${name} begins with ${evidence}; the important evidence has not surfaced yet.` : `${name} begins with the known part visible and the missing evidence still out of reach.`;
      case "origin": return memory ? `${name} carries ${memory} into the present.` : `${name} brings an earlier version into the present.`;
      case "hook": return anchors.length ? `Start with ${cap(anchor(anchors))}; it is the first concrete thread worth following.` : `One concrete thread becomes worth following.`;
      case "discovery":
      case "reveal": return discovery ? `The evidence opens: ${discovery}.` : `${cap(anchor(anchors))} points to another piece of evidence.`;
      case "reflection": return emotional ? `What remains carries ${emotional}.` : `The discovered details change the account that can now be told about ${subjectValue}.`;
      case "payoff": return reward || purpose || `The pieces now line up around ${subjectValue}.`;
      case "continuation": return future || `Enough remains unresolved to keep looking.`;
    }
  }

  if (forces.utility) {
    switch (beat.kind) {
      case "need": return why || `${name} has a concrete problem to solve.`;
      case "instruction": return signal(plan, "contentModel") || interaction || `${name} gets a concrete next move.`;
      case "action": return interaction || `A participant makes a move that changes ${subjectValue}.`;
      case "feedback": return `The result of that move determines what happens next.`;
      case "next_step": return progression || `The next step follows from the result just produced.`;
    }
  }

  if (forces.social && beat.kind === "orientation") {
    return `${name} starts with a shared point of attention around ${evidence || "the current moment"}.`;
  }

  return undefined;
}

function genericStage(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subjectValue = subject(beat, plan);
  const name = cap(subjectValue);
  const anchors = bundle(beat, plan);
  const why = signal(plan, "whyInteract");
  const purpose = signal(plan, "purpose");
  const interaction = signal(plan, "interactionModel");
  const progression = signal(plan, "progressionModel");
  const future = signal(plan, "futureEvolution");
  const reward = signal(plan, "rewardModel");
  const evidence = anchors.slice(0, 3).join(" and ");

  switch (beat.kind) {
    case "orientation":
      return evidence ? `${name} begins with ${evidence} already in play.` : `${name} begins in a concrete starting state.`;
    case "hook":
      return why || (evidence ? `${cap(anchor(anchors))} creates the first concrete reason to continue.` : `${name} presents the first reason to keep going.`);
    case "need":
      return why || purpose || `${name} has a concrete condition that needs an answer.`;
    case "threshold":
      return interaction || `${name} reaches the point where a participant must make a choice.`;
    case "origin":
      return evidence ? `${name} carries ${evidence} into the present.` : `${name} brings its starting evidence into the present.`;
    case "encounter":
    case "action":
      return interaction || (evidence ? `${cap(anchor(anchors))} changes what ${subjectValue} can do next.` : `${name} meets a concrete event that changes the next move.`);
    case "challenge":
      return progression || `${name} encounters resistance that requires another move.`;
    case "discovery":
    case "reveal":
      return evidence ? `${cap(anchor(anchors))} reveals a concrete detail that was not visible at the start.` : `A new piece of evidence changes the working explanation.`;
    case "instruction":
      return signal(plan, "contentModel") || interaction || `${name} receives a concrete next move.`;
    case "feedback":
      return `The result of the last move becomes evidence for what happens next.`;
    case "contribution":
      return evidence ? `${cap(anchor(anchors))} is added to ${subjectValue}, changing the version that follows.` : `A new contribution changes ${subjectValue}.`;
    case "escalation":
      return progression || (evidence ? `${cap(anchor(anchors))} raises the stakes for the next move.` : `${name} moves into a higher-stakes state.`);
    case "transformation":
      return `${name} is different because the events before this point produced a concrete change.`;
    case "reflection":
      return purpose || `What remains records the consequence of what happened.`;
    case "provenance":
      return evidence ? `${name} keeps the evidence that shows where this version came from: ${evidence}.` : `${name} keeps the evidence of how this version was produced.`;
    case "identity":
      return evidence ? `${name} is now identified by the evidence gathered around it.` : `${name} now has a concrete identity in the experience.`;
    case "milestone":
      return `${name} reaches a state that can be recognized as progress.`;
    case "unlock":
    case "earned_access":
      return reward || `${name} earns access because of what happened before this point.`;
    case "payoff":
      return reward || purpose || `${name} reaches the state earned by the events that came before it.`;
    case "next_step":
      return progression || `${name} gets a concrete next move from the state reached here.`;
    case "continuation":
      return future || `The next encounter starts from the state reached here.`;
    default:
      return evidence ? `${name} continues from ${evidence}.` : `${name} continues from the current state.`;
  }
}

function isDeadProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const value = clean(composite(beat, plan) ?? genericStage(beat, plan));
  if (value && !isDeadProse(value)) return value;

  const fallback = clean(beat.text);
  return fallback || `${cap(subject(beat, plan))} continues from the current state.`;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  return isDeadProse(value);
}

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): PremiseForces {
  return classifyForces(beat, plan);
}
