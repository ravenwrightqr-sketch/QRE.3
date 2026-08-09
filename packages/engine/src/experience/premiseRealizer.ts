import type { CognitiveExperiencePlan, StoryBeat, StoryBeatKind } from "@qre/contracts";

/**
 * Premise realization is the last semantic step before runtime prose.
 *
 * It does not own cognition and it does not invent a new architecture.
 * It takes the evidence cognition already surfaced and turns it into
 * experiential motion: escalation, discovery, participation, contrast,
 * suspense, indulgence, accumulation, transformation, or practical action.
 *
 * The important rule is simple: describe what happens, not what the
 * compiler thinks the happening means.
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The experience";

const BAD = [
  /\bis the thing the experience\b/i,
  /\bhas become more meaningful\b/i,
  /\bdeserves a closer look\b/i,
  /\bthe experience leaves a meaning behind\b/i,
  /\bthe next interaction can change what\b/i,
  /\bgiving the moment a direction\b/i,
  /\bwhat the experience has revealed\b/i,
  /\blands differently because of everything that happened\b/i,
  /\benters the story through\b/i,
  /\bgives the story somewhere concrete to begin\b/i,
  /\bthe story starts pulling\b/i,
  /\bthe experience moves forward through\b/i,
  /\bthe subject now means more\b/i,
  /\bwhat remains is the meaning\b/i,
  /\bthe next layer\b/i,
  /\banother layer of\b/i,
  /\bthe hidden relationship around\b/i,
  /\bthe useful information is here\b/i,
  /\bmeaningful point has been reached\b/i,
];

function signals(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return lower(
    [
      ...(beat.entities ?? []),
      beat.text,
      plan?.centralSubject ?? "",
      plan?.direction ?? "",
      plan?.purpose ?? "",
      ...(plan?.whyInteract ?? []),
      ...(plan?.interactionModel ?? []),
      ...(plan?.contentModel ?? []),
      ...(plan?.discoveryModel ?? []),
      ...(plan?.rewardModel ?? []),
      ...(plan?.progressionModel ?? []),
      ...(plan?.futureEvolution ?? []),
      ...(plan?.creativePossibilities ?? []),
      ...(plan?.emotionalIntent ?? []),
      ...(plan?.memoryModel ?? []),
    ].join(" "),
  );
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return clean(
    plan?.centralSubject ||
      beat.entities?.[0] ||
      beat.text.split(/\s+/).slice(0, 5).join(" ") ||
      "the experience",
  );
}

function evidence(beat: StoryBeat, subjectValue: string): string[] {
  const subjectWords = new Set(lower(subjectValue).split(/\s+/));
  return (beat.entities ?? [])
    .map(clean)
    .filter(Boolean)
    .filter((value) => !subjectWords.has(lower(value)))
    .filter((value) => value.length > 2)
    .slice(0, 8);
}

function planSignal(plan: CognitiveExperiencePlan | undefined, field: keyof CognitiveExperiencePlan): string {
  const value = plan?.[field];
  if (typeof value === "string") return sentence(value);
  if (Array.isArray(value)) return sentence(String(value[0] ?? ""));
  return "";
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function mode(text: string, plan?: CognitiveExperiencePlan): {
  direction: string;
  funny: boolean;
  frightening: boolean;
  absurd: boolean;
  luxurious: boolean;
  memory: boolean;
  social: boolean;
  accumulating: boolean;
  discovery: boolean;
  transformation: boolean;
  process: boolean;
  practical: boolean;
} {
  const direction = lower(plan?.direction ?? "");
  return {
    direction,
    funny: hasAny(text, ["fun", "funny", "humor", "humorous", "laugh", "ridiculous"]),
    frightening: hasAny(text, ["terrifying", "terrifying", "horror", "haunted", "scary", "dread", "creepy"]),
    absurd: hasAny(text, ["absurd", "surreal", "bizarre", "ridiculous", "wild"]),
    luxurious: hasAny(text, ["luxury", "luxurious", "billionaire", "indulgent", "exclusive", "opulent"]),
    memory: direction === "memory" || hasAny(text, ["memory", "remember", "history", "past", "grandmother", "grandfather", "keepsake"]),
    social: direction === "social" || hasAny(text, ["family", "friends", "everyone", "group", "people", "community", "shared"]),
    accumulating: hasAny(text, ["keep adding", "add to", "adds", "accumulate", "grows", "growing", "each person", "next person", "again"]),
    discovery: direction === "discovery" || hasAny(text, ["discover", "discovery", "hidden", "secret", "uncover", "find", "forgotten", "reveal"]),
    transformation: hasAny(text, ["transform", "transformation", "before", "after", "cleaning", "restore", "change", "changed", "launch"]),
    process: hasAny(text, ["clean", "cleaning", "groom", "groomer", "build", "repair", "restore", "prepare", "launch", "document", "process", "room by room"]),
    practical: direction === "utility" || hasAny(text, ["instruction", "guide", "how to", "fix", "repair", "solve"]),
  };
}

function premiseLine(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const subjectValue = subject(beat, plan);
  const subjectName = cap(subjectValue);
  const ev = evidence(beat, subjectValue);
  const text = signals(beat, plan);
  const m = mode(text, plan);
  const why = planSignal(plan, "whyInteract");
  const interaction = planSignal(plan, "interactionModel");
  const discovery = planSignal(plan, "discoveryModel");
  const progression = planSignal(plan, "progressionModel");
  const reward = planSignal(plan, "rewardModel");
  const future = planSignal(plan, "futureEvolution");

  if (m.practical) {
    if (beat.kind === "need") return why ? `${cap(why)}.` : `Start with the part of ${subjectValue} that actually needs solving.`;
    if (beat.kind === "instruction") return interaction || discovery || `The useful move is concrete: work directly on ${subjectValue}.`;
    if (beat.kind === "action") return interaction || `Now do the thing that changes ${subjectValue}.`;
    if (beat.kind === "feedback") return `The result decides the next move.`;
    if (beat.kind === "next_step") return progression || future || `Use the result to choose what happens next.`;
  }

  if (m.frightening) {
    if (beat.kind === "orientation" || beat.kind === "hook") return `${subjectName} looks ordinary just long enough for the unease to start.`;
    if (beat.kind === "encounter" || beat.kind === "discovery" || beat.kind === "reveal") return discovery ? `The first sign is ${discovery}. It is worse than it should be.` : `Something is wrong with ${subjectValue}, and the evidence keeps getting harder to explain.`;
    if (beat.kind === "escalation" || beat.kind === "challenge") return progression ? `The danger tightens: ${progression}.` : `The safe version of the situation disappears, one small detail at a time.`;
    if (beat.kind === "payoff" || beat.kind === "transformation") return reward ? `The payoff is the thing nobody wanted to find: ${reward}.` : `The final reveal makes the earlier clues impossible to dismiss.`;
    if (beat.kind === "continuation") return future ? `And it is not over: ${future}.` : `The last clue leaves one door open, and that is the worst part.`;
  }

  if (m.absurd || m.luxurious) {
    if (beat.kind === "orientation" || beat.kind === "hook") {
      if (m.luxurious) return `${subjectName} does not merely begin; it starts at an unreasonable level of indulgence.`;
      return `${subjectName} starts normally, then immediately takes a turn that nobody sensible would have approved.`;
    }
    if (beat.kind === "encounter" || beat.kind === "discovery") {
      return ev.length ? `${cap(ev[0])} enters the scene, and suddenly the scale of ${subjectValue} gets ridiculous.` : `The next detail pushes ${subjectValue} past ordinary logic.`;
    }
    if (beat.kind === "escalation") return progression ? `Then it escalates: ${progression}.` : `Every new step has to outdo the last one.`;
    if (beat.kind === "payoff") return reward ? `The payoff goes all the way: ${reward}.` : `By the end, the original premise has become gloriously excessive.`;
    if (beat.kind === "continuation") return future ? `There is obviously another escalation waiting: ${future}.` : `Nobody involved has learned the lesson, so there is room to make it even bigger.`;
  }

  if (m.funny && m.memory && m.social && (m.accumulating || beat.kind === "contribution" || beat.kind === "continuation")) {
    if (beat.kind === "orientation") return `${subjectName} starts with one version of the story. That is about to become a problem.`;
    if (beat.kind === "encounter") return `Someone remembers it differently, and now ${subjectValue} has competing versions.`;
    if (beat.kind === "contribution") return `Someone adds a new detail. Nobody agrees whether it happened, but it is now part of the story.`;
    if (beat.kind === "reflection") return `The original event is getting buried under exaggerations, corrections, and inside jokes.`;
    if (beat.kind === "payoff") return `${subjectName} has stopped being one birthday story and become family folklore.`;
    if (beat.kind === "continuation") return `The next person gets to add another version, which means the mythology is not remotely finished.`;
  }

  if (m.transformation && m.process && (beat.kind === "orientation" || beat.kind === "hook" || beat.kind === "encounter" || beat.kind === "escalation" || beat.kind === "transformation" || beat.kind === "payoff")) {
    if (beat.kind === "orientation") return `${subjectName} starts in its before-state, with the work still ahead.`;
    if (beat.kind === "hook") return ev.length ? `The first change exposes ${ev[0]}, and suddenly the starting state has a story.` : `The first change makes the difference visible.`;
    if (beat.kind === "encounter") return `As the work moves through ${subjectValue}, details that were hidden by the old state begin surfacing.`;
    if (beat.kind === "escalation") return progression ? `Room by room, step by step, the transformation builds: ${progression}.` : `The contrast keeps growing as one finished section reveals how much remains.`;
    if (beat.kind === "transformation") return `${subjectName} crosses from what it was into what the work has made possible.`;
    if (beat.kind === "payoff") return `${subjectName} can finally be seen against the version that existed before the work began.`;
  }

  if (m.social && m.accumulating) {
    if (beat.kind === "contribution") return `One person's addition becomes the next person's starting point.`;
    if (beat.kind === "continuation") return future || `The experience stays alive because the next person can change what is already there.`;
  }

  if (m.discovery) {
    if (beat.kind === "orientation") return `${subjectName} is the visible starting point. The interesting evidence has not surfaced yet.`;
    if (beat.kind === "hook") return ev.length ? `Start with ${ev[0]}; it is the first thread worth pulling.` : `There is a thread here worth pulling.`;
    if (beat.kind === "discovery" || beat.kind === "reveal") return discovery ? `The evidence opens: ${discovery}.` : `One discovered detail points to another.`;
    if (beat.kind === "payoff") return reward || `The pieces finally line up.`;
    if (beat.kind === "continuation") return future || `There is enough left unresolved to keep looking.`;
  }

  if (beat.kind === "orientation") return ev.length ? `${subjectName} begins with ${ev.slice(0, 2).join(" and ")}.` : `${subjectName} starts here.`;
  if (beat.kind === "hook") return why || (ev.length ? `The hook is ${ev[0]}, and it gives ${subjectValue} somewhere to go.` : `The first move creates a reason to keep going.`);
  if (beat.kind === "encounter") return interaction || (ev.length ? `${cap(ev[0])} changes what happens around ${subjectValue}.` : `${subjectName} runs into the next complication.`);
  if (beat.kind === "escalation") return progression || `The next beat raises the stakes instead of merely repeating the last one.`;
  if (beat.kind === "discovery" || beat.kind === "reveal") return discovery || (ev.length ? `${cap(ev[0])} turns out to matter more than expected.` : `A new piece of evidence appears.`);
  if (beat.kind === "transformation") return `${subjectName} is different because something actually happened to it.`;
  if (beat.kind === "reflection") return plan?.emotionalIntent?.[0] ? `What remains is ${sentence(plan.emotionalIntent[0])}, attached to what just happened.` : `What happened leaves a concrete consequence behind.`;
  if (beat.kind === "payoff") return reward || `${subjectName} gets the payoff earned by the events that came before it.`;
  if (beat.kind === "continuation") return future || `${subjectName} leaves a live thread for whatever happens next.`;
  if (beat.kind === "need") return why || `${subjectName} has a real problem to solve.`;
  if (beat.kind === "threshold") return `${subjectName} is the point where the ordinary version stops.`;
  if (beat.kind === "origin") return plan?.memoryModel?.[0] ? `${subjectName} carries forward ${sentence(plan.memoryModel[0])}.` : `${subjectName} brings something from before into the present.`;
  if (beat.kind === "challenge") return progression || `Something has to be overcome before ${subjectValue} can advance.`;
  if (beat.kind === "instruction") return interaction || `The next concrete move is clear.`;
  if (beat.kind === "action") return interaction || `Now make the move that changes ${subjectValue}.`;
  if (beat.kind === "feedback") return `The result tells us what to do next.`;
  if (beat.kind === "contribution") return `Someone adds something that changes the next version of ${subjectValue}.`;
  if (beat.kind === "identity") return `${subjectName} becomes more specific through what people actually do with it.`;
  if (beat.kind === "milestone") return progression || `The process has crossed a point that changes the next stage.`;
  if (beat.kind === "unlock" || beat.kind === "earned_access") return reward || `Something previously unavailable is now open.`;
  if (beat.kind === "next_step") return progression || `The next move follows directly from what just happened.`;

  return clean(beat.text);
}

function isDeadProse(value: string): boolean {
  return BAD.some((pattern) => pattern.test(value));
}

export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const value = clean(premiseLine(beat, plan));
  return isDeadProse(value) ? `${cap(subject(beat, plan))} keeps moving because the premise has consequences.` : value;
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat, index) => ({
    ...beat,
    order: index,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  return isDeadProse(value);
}

export type PremiseRealizationMode = ReturnType<typeof mode>;

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): PremiseRealizationMode {
  return mode(signals(beat, plan), plan);
}
