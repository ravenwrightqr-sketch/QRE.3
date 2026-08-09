import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL PREMISE REALIZER
 *
 * The realization layer turns cognition into observable events.
 * It is deliberately noun-agnostic: no subject gets a hard-coded story.
 *
 * Core invariant:
 *   semantic forces + concrete evidence + beat stage
 *   -> observable realization that still belongs to the user's premise.
 *
 * The important upgrade here is PREMISE BUNDLING. A prompt can contain
 * several coupled facts (for example event + medium + human outcome).
 * Realization must carry the bundle, not merely mention one convenient noun.
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The premise";
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "can",
  "could", "create", "do", "does", "doing", "for", "from", "get", "give",
  "gives", "given", "has", "have", "how", "i", "if", "in", "into", "is",
  "it", "its", "make", "makes", "making", "me", "my", "of", "on", "or",
  "our", "people", "please", "that", "the", "their", "this", "those", "to",
  "turn", "up", "was", "we", "what", "when", "where", "which", "who", "with",
  "you", "your", "something", "someone", "thing", "experience", "story",
  "about", "through", "into", "just", "more", "than", "then", "now", "will",
]);

const DEAD_PROSE = [
  /is the thing the experience puts into focus/i,
  /has become more meaningful through the interaction/i,
  /something about .* deserves a closer look/i,
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
  /the next move follows from the state reached here/i,
];

const FORCE_WORDS = {
  humor: ["fun", "funny", "humor", "humorous", "laugh", "laughter", "joke", "comic", "playful", "ridiculous"],
  suspense: ["terrifying", "terror", "horror", "haunted", "scary", "fear", "dread", "creepy", "threat", "danger", "suspense", "unease"],
  absurdity: ["absurd", "surreal", "bizarre", "impossible", "wild", "ridiculous", "unreasonable", "excessive"],
  indulgence: ["luxury", "luxurious", "billionaire", "indulgent", "exclusive", "opulent", "lavish", "pamper", "extravagant"],
  accumulation: ["keep adding", "add to", "adds", "adding", "accumulate", "accumulates", "grows", "growing", "each person", "next person", "again", "over time", "builds up", "keeps growing"],
  participation: ["everyone", "family", "friends", "group", "community", "shared", "together", "contribute", "contribution", "participate", "members"],
  contrast: ["before", "after", "transform", "transformation", "changed", "change", "restore", "difference", "compare", "compared", "old state", "new state"],
  process: ["build", "building", "repair", "repairing", "restore", "restoring", "prepare", "preparing", "process", "processing", "step", "steps", "work through", "one by one", "room by room", "cleaning"],
  discovery: ["discover", "discovery", "hidden", "secret", "uncover", "find", "forgotten", "reveal", "clue", "mystery", "unknown", "look for", "search", "document", "documents"],
  temporal: ["again", "return", "future", "later", "next", "over time", "keeps", "continue", "continuation", "comes back", "keeps going"],
  memory: ["memory", "remember", "remembered", "past", "history", "keepsake", "folklore", "legacy", "preserve", "preserved", "rememberable", "remembering"],
  social: ["everyone", "family", "friends", "group", "community", "together", "shared", "people", "relationship", "collective", "members"],
  utility: ["useful", "help", "solve", "answer", "instruction", "guide", "fix", "need", "practical", "task", "how to"],
  media: ["qr", "nfc", "photo", "image", "video", "film", "music", "song", "voice", "recording", "scan", "scanned"],
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

function sourceText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return lower([
    beat.text,
    ...(beat.entities ?? []),
    plan?.centralSubject ?? "",
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
 * Concrete evidence is deliberately gathered before prose is selected.
 * This prevents a semantic branch from winning while dropping the prompt's
 * distinctive nouns.
 */
function anchorWords(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectTokens = new Set(tokens(lower(subject(beat, plan))));
  const raw = [
    ...(beat.entities ?? []),
    beat.text,
    plan?.centralSubject ?? "",
    plan?.purpose ?? "",
    ...(plan?.whyInteract ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.memoryModel ?? []),
  ].join(" "));

  const words = tokens(raw)
    .filter((word) => word.length > 2)
    .filter((word) => !STOP.has(lower(word)))
    .filter((word) => !subjectTokens.has(lower(word)));

  return [...new Map(words.map((word) => [lower(word), word])).values()].slice(0, 10);
}

function anchor(anchors: string[], index = 0): string {
  return anchors[index] ?? "the situation";
}

function evidencePhrase(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const anchors = anchorWords(beat, plan);
  if (!anchors.length) return "the current state";
  if (anchors.length === 1) return anchors[0];
  return anchors.slice(0, 2).join(" and ");
}

function evidencePair(beat: StoryBeat, plan?: CognitiveExperiencePlan): [string, string] | undefined {
  const anchors = anchorWords(beat, plan);
  return anchors.length >= 2 ? [anchors[0], anchors[1]] : undefined;
}

function hasForce(anchors: string[], force: ForceName): boolean {
  return anchors.some((anchorValue) =>
    FORCE_WORDS[force].some((word) => lower(anchorValue).includes(word)),
  );
}

function firstForceAnchor(anchors: string[], force: ForceName): string | undefined {
  return anchors.find((anchorValue) =>
    FORCE_WORDS[force].some((word) => lower(anchorValue).includes(word)),
  );
}

/**
 * Composite realization is where the universal compiler gets its "brain".
 * The combinations are semantic, not subject-specific. New nouns inherit
 * the same behavior automatically.
 */
function compositeRealization(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan | undefined,
  anchors: string[],
  forces: PremiseForces,
): string | undefined {
  const subjectValue = subject(beat, plan);
  const name = cap(subjectValue);
  const media = firstForceAnchor(anchors, "media");
  const memory = firstForceAnchor(anchors, "memory");
  const social = firstForceAnchor(anchors, "social");
  const future = signal(plan, "futureEvolution");
  const purpose = signal(plan, "purpose");
  const interaction = signal(plan, "interactionModel");
  const reward = signal(plan, "rewardModel");

  // Event/context + medium + memory/social outcome.
  // This is the important QR/concert class, but it is deliberately generic.
  if (forces.media && (forces.memory || forces.social)) {
    const context = anchors.find(
      (value) => lower(value) !== lower(media ?? "") &&
        lower(value) !== lower(memory ?? "") &&
        lower(value) !== lower(social ?? ""),
    ) ?? anchor(anchors);

    switch (beat.kind) {
      case "orientation":
        return `${cap(context)} gives ${subjectValue} a live moment to capture through ${media ?? "the medium"}.`;
      case "hook":
      case "encounter":
      case "action":
        return `${cap(media ?? "The interaction")} turns ${context} into something people can participate in and carry forward.`;
      case "discovery":
      case "reveal":
        return `${cap(media ?? "The captured moment")} surfaces ${context} with ${memory ?? social ?? "a human trace"} attached.`;
      case "reflection":
        return `${cap(context)} now carries a record of what people shared, crossed, or remembered through ${media ?? "the experience"}.`;
      case "payoff":
        return reward || `${name} becomes a concrete record of ${context}, not just a moment that disappeared when the event ended.`;
      case "continuation":
        return future || `The next interaction can add another person, crossing, detail, or memory to the record.`;
    }
  }

  // Accumulation + participation is the general shared-memory engine.
  if (forces.accumulation && (forces.participation || forces.social)) {
    const pair = evidencePair(beat, plan);
    switch (beat.kind) {
      case "orientation":
        return `${name} begins with one version already in circulation, and another person can change it.`;
      case "encounter":
      case "contribution":
        return pair
          ? `${cap(pair[0])} is added to ${subjectValue}, giving the next person something new to react to.`
          : `A new contribution changes ${subjectValue}, giving the next person something to react to.`;
      case "reflection":
        return `The original version now carries the additions, reactions, corrections, and details people left behind.`;
      case "payoff":
        return reward
          ? `${cap(reward)} because the shared version now contains what each person added.`
          : `${name} has become a shared artifact rather than a version controlled by one person.`;
      case "continuation":
        return future || `The next contribution can change what everyone encounters later.`;
    }
  }

  // Process + transformation keeps concrete work from becoming generic meaning.
  if (forces.contrast && forces.process) {
    switch (beat.kind) {
      case "orientation": return `${name} starts in its before-state, with the work still ahead.`;
      case "hook":
      case "encounter": return anchors.length ? `The first pass works on ${subjectValue}, exposing ${anchor(anchors)}.` : `The first pass makes the starting state concrete.`;
      case "escalation": return signal(plan, "progressionModel") || `Each completed part makes the remaining difference more visible.`;
      case "transformation": return `${name} crosses from its starting state into the state the work created.`;
      case "payoff": return `${name} can now be compared with the version that existed before the work began.`;
      case "continuation": return future || `The changed state becomes the starting point for the next pass.`;
    }
  }

  // Suspense + discovery makes evidence drive the escalation.
  if (forces.suspense) {
    const discovery = signal(plan, "discoveryModel");
    switch (beat.kind) {
      case "orientation": return `${name} appears ordinary just long enough for one detail to feel wrong.`;
      case "hook": return anchors.length ? `${cap(anchor(anchors))} is the first evidence that the harmless explanation is failing.` : `${name} supplies the first evidence that the harmless explanation is failing.`;
      case "encounter":
      case "discovery":
      case "reveal": return discovery ? `The evidence turns darker: ${discovery}.` : `${cap(anchor(anchors))} makes the safe explanation harder to believe.`;
      case "escalation":
      case "challenge": return signal(plan, "progressionModel") || `The safe explanation loses another piece of ground.`;
      case "transformation":
      case "payoff": return reward ? `The reveal pays off with ${reward}.` : `The final evidence makes the earlier warning impossible to dismiss.`;
      case "continuation": return future || `One unresolved detail keeps the danger active.`;
    }
  }

  // Absurdity and indulgence are forces that change scale, not subjects.
  if (forces.absurdity || forces.indulgence) {
    switch (beat.kind) {
      case "orientation": return forces.indulgence ? `${name} begins at an unreasonable level of indulgence.` : `${name} begins normally, then takes a turn that ignores ordinary limits.`;
      case "hook": return anchors.length ? `${cap(anchor(anchors))} pushes ${subjectValue} past ordinary limits.` : `The first move pushes ${subjectValue} past ordinary logic.`;
      case "encounter":
      case "discovery": return anchors.length > 1 ? `${cap(anchor(anchors, 1))} raises the scale again.` : `The next detail makes the situation more excessive.`;
      case "escalation": return signal(plan, "progressionModel") ? `Then it escalates through ${signal(plan, "progressionModel")}.` : `Each new step has to outdo the last one.`;
      case "transformation": return `${name} is now operating beyond the scale it started with.`;
      case "payoff": return reward ? `The payoff goes all the way: ${reward}.` : `The premise reaches the excessive state it kept building toward.`;
      case "continuation": return future || `There is still room to push the premise farther.`;
    }
  }

  return undefined;
}

function forceRealization(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const subjectValue = subject(beat, plan);
  const name = cap(subjectValue);
  const anchors = anchorWords(beat, plan);
  const forces = classifyForces(beat, plan);
  const why = signal(plan, "whyInteract");
  const purpose = signal(plan, "purpose");
  const interaction = signal(plan, "interactionModel");
  const content = signal(plan, "contentModel");
  const discovery = signal(plan, "discoveryModel");
  const reward = signal(plan, "rewardModel");
  const progression = signal(plan, "progressionModel");
  const future = signal(plan, "futureEvolution");
  const emotional = signal(plan, "emotionalIntent");
  const memory = signal(plan, "memoryModel");

  const composite = compositeRealization(beat, plan, anchors, forces);
  if (composite) return composite;

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
      case "orientation": return anchors.length ? `${name} begins with ${evidencePhrase(beat, plan)} visible; the important evidence has not surfaced yet.` : `${name} begins with the known part visible and the missing evidence still out of reach.`;
      case "origin": return memory ? `${name} carries ${memory} into the present.` : `${name} brings an earlier version into the present.`;
      case "hook": return anchors.length ? `Start with ${cap(anchor(anchors))}; it is the first concrete thread worth following.` : `One concrete thread becomes worth following.`;
      case "discovery":
      case "reveal": return discovery ? `The evidence opens: ${discovery}.` : `${cap(anchor(anchors))} points to another piece of evidence.`;
      case "reflection": return emotional ? `What remains carries ${emotional}.` : `The discovered details change the account that can now be told about ${subjectValue}.`;
      case "payoff": return reward || purpose || `The pieces now line up around ${subjectValue}.`;
      case "continuation": return future || `Enough remains unresolved to keep looking.`;
    }
  }

  if (forces.temporal && beat.kind === "continuation") {
    return future || `The next return starts with everything that happened before.`;
  }

  if (forces.utility) {
    switch (beat.kind) {
      case "need": return why || `${name} has a concrete problem to solve.`;
      case "instruction": return content || interaction || `${name} gets a concrete next move.`;
      case "action": return interaction || `A participant makes a move that changes ${subjectValue}.`;
      case "feedback": return `The result of that move determines what happens next.`;
      case "next_step": return progression || `The next step follows from the result just produced.`;
    }
  }

  if (forces.social && beat.kind === "orientation") {
    return `${name} starts with a shared point of attention around ${evidencePhrase(beat, plan)}.`;
  }

  if (forces.media && beat.kind === "encounter") {
    return anchors.length ? `${cap(anchor(anchors))} changes what ${subjectValue} can reveal next.` : `${name} produces a new piece of material that changes what can happen next.`;
  }

  return undefined;
}

function genericStage(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
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
    case "orientation": return anchors.length ? `${name} starts with ${evidencePhrase(beat, plan)} already present.` : `${name} starts in its current state, before the next event.`;
    case "hook": return why ? `${cap(why)} gives ${name} a concrete reason to respond.` : anchors.length ? `${cap(anchor(anchors))} creates the first event ${name} has to respond to.` : `${name} meets the first event that can change the outcome.`;
    case "need": return why || `${name} has a concrete problem that gives the interaction a job.`;
    case "threshold": return `${name} reaches the point where the current state cannot remain unchanged.`;
    case "origin": return signal(plan, "memoryModel") ? `${name} carries ${signal(plan, "memoryModel")} into the present.` : `${name} carries an earlier state into this moment.`;
    case "encounter": return anchors.length ? `${cap(anchor(anchors))} enters the situation and changes what ${subjectValue} can do next.` : `${name} meets a new condition that changes the next move.`;
    case "challenge": return progression || `${name} has to overcome a concrete obstacle before the next state is possible.`;
    case "discovery":
    case "reveal": return anchors.length ? `${cap(anchor(anchors))} becomes evidence for a new explanation.` : `A new piece of evidence changes the working explanation.`;
    case "instruction": return interaction || `${name} gets a concrete next move.`;
    case "action": return interaction || `A participant makes a move that changes ${subjectValue}.`;
    case "feedback": return `${name} produces a result, and that result determines the next move.`;
    case "contribution": return `A new contribution changes the next version of ${subjectValue}.`;
    case "escalation": return progression || `${name} faces a stronger consequence than the previous beat.`;
    case "transformation": return `${name} moves from its starting state into a state created by what happened.`;
    case "reflection": return plan?.emotionalIntent?.length ? `What remains carries ${sentence(plan.emotionalIntent[0])}.` : `${name} leaves a concrete consequence behind.`;
    case "identity": return `${name} becomes more specific through what people actually do with it.`;
    case "milestone": return progression || `${name} crosses a point that changes the next stage.`;
    case "unlock":
    case "earned_access": return reward || `A new capability becomes available because of what just happened.`;
    case "payoff": return reward || purpose || `${name} reaches the consequence earned by the events before it.`;
    case "next_step": return progression || `The next move follows from the state reached here.`;
    case "continuation": return future || `${name} leaves a live thread for whatever happens next.`;
    default: return beat.text?.trim() || `${name} continues from the state created by the previous event.`;
  }
}

/**
 * Preserve a bundle, not merely one noun. If the prompt exposes several
 * concrete anchors, at least two should survive in the beat text whenever
 * the realization branch itself did not already carry them.
 */
function preserveEvidence(value: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const anchors = anchorWords(beat, plan);
  if (!anchors.length) return value;

  const normalized = lower(value);
  const missing = anchors.filter((word) => !normalized.includes(lower(word)));
  if (missing.length === 0) return value;

  const subjectValue = subject(beat, plan);
  const keep = missing.slice(0, anchors.length >= 3 ? 2 : 1);
  const evidence = keep.join(" and ");

  switch (beat.kind) {
    case "orientation": return `${value} ${cap(subjectValue)} is grounded in ${evidence}.`;
    case "hook":
    case "encounter": return `${value} The event is tied directly to ${evidence}.`;
    case "discovery":
    case "reveal": return `${value} The evidence is ${evidence}.`;
    case "reflection": return `${value} What remains is tied to ${evidence}.`;
    case "payoff": return `${value} The result is grounded in ${evidence}.`;
    case "continuation": return `${value} The next version still carries ${evidence}.`;
    default: return `${value} The concrete premise still includes ${evidence}.`;
  }
}

function isDeadProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const semantic = forceRealization(beat, plan) ?? genericStage(beat, plan);
  const evidenceBearing = preserveEvidence(clean(semantic), beat, plan);

  if (evidenceBearing && !isDeadProse(evidenceBearing)) return evidenceBearing;

  const raw = clean(beat.text);
  if (raw && !isDeadProse(raw)) return raw;

  const anchors = anchorWords(beat, plan);
  return `${cap(subject(beat, plan))} stays grounded in ${anchor(anchors)}.`;
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

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): PremiseRealizationMode {
  return classifyForces(beat, plan);
}

export type PremiseRealizationMode = PremiseForces;
