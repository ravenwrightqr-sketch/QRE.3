import type {
  CognitiveExperiencePlan,
  StoryBeat,
} from "@qre/contracts";

/**
 * Language realization only.
 *
 * Cognition has already selected the direction, subject, interaction model,
 * and story structure. This layer turns those semantics into readable prose.
 * It must not invent facts, re-plan the experience, or flatten every prompt
 * into the same narrative vocabulary.
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The moment";

const GENERIC_ENTITIES = new Set([
  "something",
  "completely",
  "weird",
  "involving",
  "create",
  "make",
  "experience",
  "story",
  "thing",
  "moment",
  "subject",
  "people",
  "someone",
  "everyone",
  "something",
]);

const GENERIC_PLAN_SIGNALS = [
  /^make .+ matter through /i,
  /^make the physical subject feel more alive/i,
  /^make .+ matter through /i,
  /^the experience can evolve through /i,
];

function subjectFromBeat(beat: StoryBeat): string {
  return clean(beat.entities?.[0] ?? "the moment");
}

function detailFromBeat(beat: StoryBeat): string {
  const subjectWords = new Set(
    subjectFromBeat(beat)
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean),
  );

  return (
    beat.entities?.slice(1).find((entity) => {
      const value = lower(entity);
      return (
        value.length > 3 &&
        !GENERIC_ENTITIES.has(value) &&
        !subjectWords.has(value)
      );
    }) ?? ""
  );
}

function planSignal(
  plan: CognitiveExperiencePlan | undefined,
  field:
    | "purpose"
    | "whyInteract"
    | "contentModel"
    | "discoveryModel"
    | "rewardModel"
    | "progressionModel"
    | "futureEvolution"
    | "creativePossibilities",
): string {
  if (!plan) return "";
  const value =
    field === "purpose" ? clean(plan.purpose ?? "") : clean(plan[field]?.[0] ?? "");

  if (!value) return "";
  if (GENERIC_PLAN_SIGNALS.some((pattern) => pattern.test(value))) return "";

  return value;
}

function sentence(value: string): string {
  return clean(value).replace(/[.!?]+$/, "");
}

function removeRedundancy(value: string): string {
  return clean(value)
    .replace(/\bthe the\b/gi, "the")
    .replace(/\bthe experience gives you the next useful piece of information\b/gi, "the next useful piece of information comes into view")
    .replace(/\bthe thing the experience puts into focus\b/gi, "what comes into focus")
    .replace(/\bcontains more than the first glance reveals\b/gi, "invites a second look")
    .replace(/\bthe hidden relationship around ([^.]+) becomes visible\b/gi, "a hidden relationship around $1 comes into view")
    .replace(/\bthe experience leaves a meaning behind, attached to ([^.]+)\b/gi, "what remains is a meaning carried by $1")
    .replace(/\bthe subject now means more because of what happened around it\b/gi, "what happened around it gives the subject another layer of meaning");
}

/**
 * Elevate a single beat without changing its semantic job.
 *
 * The important distinction is between semantic direction and surface
 * language. A memory plan should sound like memory; a game should feel like
 * play; a utility prompt should become useful rather than theatrical; and a
 * strange story should be allowed to remain strange.
 */
export function elevateStoryBeat(
  beat: StoryBeat,
  index: number,
  plan?: CognitiveExperiencePlan,
): string {
  const original = removeRedundancy(beat.text);
  const subject = subjectFromBeat(beat);
  const subjectName = cap(subject);
  const detail = detailFromBeat(beat);
  const purpose = planSignal(plan, "purpose");
  const why = planSignal(plan, "whyInteract");
  const content = planSignal(plan, "contentModel");
  const discovery = planSignal(plan, "discoveryModel");
  const reward = planSignal(plan, "rewardModel");
  const progression = planSignal(plan, "progressionModel");
  const future = planSignal(plan, "futureEvolution");
  const creative = planSignal(plan, "creativePossibilities");
  const direction = lower(plan?.direction ?? "");
  const interaction = sentence(plan?.interactionModel?.[0] ?? "");
  const emotionalIntent = sentence(plan?.emotionalIntent?.[0] ?? "");

  // Preserve prose that is already concrete and does not expose compiler
  // vocabulary. This keeps realization from becoming a thesaurus pass.
  if (
    original.length >= 90 &&
    !/\b(the experience|the subject|the moment)\b/gi.test(original)
  ) {
    return original;
  }

  if (direction === "utility") {
    switch (beat.kind) {
      case "need":
        return why
          ? `${cap(sentence(why))}. That is the useful problem to solve first.`
          : `Start with what ${subject} needs right now.`;
      case "instruction":
        return content
          ? `For ${subject}, begin with ${sentence(content)}.`
          : `Start with the clearest useful information for ${subject}.`;
      case "action":
        return interaction
          ? `Now put it into action: ${interaction}.`
          : `Turn the guidance into the next concrete action.`;
      case "feedback":
        return `Check the result. What changed tells you whether the next move is working.`;
      case "next_step":
        return progression
          ? `From there, continue through ${sentence(progression)}.`
          : future
            ? `The next move can adapt as new results accumulate: ${sentence(future)}.`
            : `Use the result to choose the next useful step.`;
    }
  }

  if (direction === "game") {
    switch (beat.kind) {
      case "hook":
        return why
          ? `${subjectName} is the starting point. The objective is to ${sentence(why)}.`
          : `${subjectName} is where the hunt begins. There is something here to solve.`;
      case "challenge":
        return progression
          ? `The challenge advances the hunt: ${sentence(progression)}.`
          : `A new obstacle stands between the player and the next discovery.`;
      case "discovery":
        return discovery
          ? `The clue opens another layer: ${sentence(discovery)}.`
          : detail
            ? `The clue points toward ${detail}. The hunt has another layer.`
            : `The clue reveals another layer of the hunt.`;
      case "escalation":
        return progression
          ? `The hunt becomes more demanding as ${sentence(progression)}.`
          : `The next challenge builds on what the player has already discovered.`;
      case "payoff":
        return reward
          ? `The reward is meaningful because it was earned: ${sentence(reward)}.`
          : `The discovery pays off. The next layer is now within reach.`;
    }
  }

  if (direction === "discovery") {
    switch (beat.kind) {
      case "threshold":
        return why
          ? `${subjectName} is the threshold. ${cap(sentence(why))}.`
          : `${subjectName} is only the visible layer. The interesting part begins beyond it.`;
      case "reveal":
        return discovery
          ? `A hidden layer comes into view: ${sentence(discovery)}.`
          : detail
            ? `A closer look reveals ${detail}.`
            : `Something hidden around ${subject} comes into view.`;
      case "discovery":
        return creative
          ? `The deeper discovery is what ${subject} can become in context: ${sentence(creative)}.`
          : `The deeper layer changes how ${subject} can be understood.`;
      case "payoff":
        return `The reveal earns its place by changing what ${subject} lets you see.`;
      case "continuation":
        return future
          ? `There is more beyond this reveal: ${sentence(future)}.`
          : `Another interaction can expose a different layer of ${subject}.`;
    }
  }

  if (direction === "memory") {
    switch (beat.kind) {
      case "orientation":
        return `${subjectName} arrives with a history already attached to it.`;
      case "origin":
        return plan?.memoryModel?.[0]
          ? `${subjectName} carries the past forward: ${sentence(plan.memoryModel[0])}.`
          : `${subjectName} carries something from before this moment into the present.`;
      case "encounter":
        return detail
          ? `${cap(detail)} brings another part of ${subject} into the present.`
          : `A remembered detail brings another part of ${subject} into the present.`;
      case "reflection":
        return creative
          ? `What remains is more than the memory itself: ${sentence(creative)}.`
          : emotionalIntent
            ? `What remains is ${emotionalIntent}; that feeling gives the memory its weight.`
            : `What remains is the meaning the memory still carries now.`;
      case "payoff":
        return detail
          ? `The history shared with ${detail} is still reachable through ${subject}.`
          : `The history held by ${subject} can be revisited instead of disappearing into the past.`;
      case "continuation":
        return future
          ? `The story can keep growing as new memories arrive: ${sentence(future)}.`
          : `New memories can change what later visitors discover.`;
    }
  }

  if (direction === "social") {
    switch (beat.kind) {
      case "orientation":
        return `${subjectName} gives people a reason to share the same moment.`;
      case "encounter":
        return interaction
          ? `${subjectName} becomes a shared interaction: ${interaction}.`
          : `${subjectName} becomes something people can respond to together.`;
      case "contribution":
        return `What one person adds changes what the next person encounters.`;
      case "payoff":
        return `What people add to ${subject} becomes part of what the next person inherits.`;
      case "continuation":
        return future
          ? `The shared experience stays open: ${sentence(future)}.`
          : `The next person can add to what the group has already created.`;
    }
  }

  if (direction === "commerce") {
    switch (beat.kind) {
      case "orientation":
        return `${subjectName} gives the relationship a reason to begin beyond the transaction itself.`;
      case "identity":
        return creative
          ? `${subjectName} expresses something distinctive: ${sentence(creative)}.`
          : `${subjectName} becomes part of an identity built through context, participation, and return.`;
      case "discovery":
        return discovery
          ? `There is more to discover around ${subject}: ${sentence(discovery)}.`
          : `The interaction reveals value that a transaction alone cannot provide.`;
      case "payoff":
        return reward
          ? `${cap(sentence(reward))}. The return feels earned rather than automatic.`
          : `The reason to return comes from the relationship, not just the purchase.`;
      case "continuation":
        return future
          ? `The relationship can keep evolving: ${sentence(future)}.`
          : `A future interaction can deepen the relationship with ${subject}.`;
    }
  }

  if (direction === "journey") {
    switch (beat.kind) {
      case "orientation":
        return `${subjectName} is where the journey begins.`;
      case "threshold":
        return why
          ? `The journey opens when you ${sentence(why)}.`
          : `${subjectName} moves beyond its starting point and into somewhere new.`;
      case "discovery":
        return discovery
          ? `Along the way, ${subject} reveals ${sentence(discovery)}.`
          : detail
            ? `Along the way, ${subject} connects with ${detail}.`
            : `The journey reveals what could not be understood from the starting point.`;
      case "transformation":
        return `By this point, ${subject} carries the evidence of where it has been.`;
      case "continuation":
        return future
          ? `The journey remains open: ${sentence(future)}.`
          : `There is another place, moment, or chapter waiting beyond this one.`;
    }
  }

  if (direction === "identity") {
    switch (beat.kind) {
      case "orientation":
        return `${subjectName} is the visible expression of something larger.`;
      case "identity":
        return creative
          ? `${subjectName} carries an identity shaped by ${sentence(creative)}.`
          : `${subjectName} becomes a marker of the people, values, and stories connected to it.`;
      case "reflection":
        return `What you recognize in ${subject} says something about the person encountering it.`;
      case "payoff":
        return `${subjectName} becomes part of the participant's own story through what they recognize, choose, and return to.`;
      case "continuation":
        return future
          ? `That identity can keep evolving: ${sentence(future)}.`
          : `The meaning of ${subject} can deepen with every return.`;
    }
  }

  // General story mode intentionally stays open-ended. It uses the prompt's
  // selected subject and plan rather than pretending every story is about a
  // hidden layer, a memory, or a transaction.
  switch (beat.kind) {
    case "orientation":
      return `${subjectName} comes into focus. This is where the story begins.`;
    case "hook":
      return why
        ? `${cap(sentence(why))}. ${subjectName} gives that intention something concrete to engage with.`
        : detail
          ? `${subjectName} invites a closer look, beginning with ${detail}.`
          : `${subjectName} gives the story something concrete to follow.`;
    case "encounter":
      return detail
        ? `${cap(detail)} enters the frame, changing the relationship with ${subject}.`
        : `${subjectName} meets something unexpected, and the story starts to move.`;
    case "escalation":
      return interaction
        ? `The story moves forward through ${interaction}.`
        : `What began with ${subject} now has consequences for what comes next.`;
    case "discovery":
      return discovery
        ? `${subjectName} reveals another layer: ${sentence(discovery)}.`
        : detail
          ? `A closer look at ${subject} brings ${detail} into view.`
          : `${subjectName} gives the story another layer to follow.`;
    case "transformation":
      return `${subjectName} is no longer quite the same after what has happened.`;
    case "payoff":
      return `${subjectName} lands differently now because the story changed what it lets you notice.`;
    case "reflection":
      return emotionalIntent
        ? `What remains is ${emotionalIntent}, carried forward from this moment.`
        : `What remains is the meaning carried forward from what happened.`;
    case "continuation":
      return future
        ? `The story stays open: ${sentence(future)}.`
        : `${subjectName} does not have to end here. What comes next can build on this moment.`;
    case "need":
      return why
        ? `${cap(sentence(why))}. That is where the story needs to begin.`
        : `Start with what ${subject} needs from this moment.`;
    case "threshold":
      return `${subjectName} marks the point where the ordinary view gives way to what comes next.`;
    case "origin":
      return plan?.memoryModel?.[0]
        ? `${subjectName} carries a past into the present: ${sentence(plan.memoryModel[0])}.`
        : `${subjectName} carries something from before this moment into the present.`;
    case "challenge":
      return progression
        ? `The challenge has a purpose: ${sentence(progression)}.`
        : `Something has to be solved before ${subject} can move forward.`;
    case "reveal":
      return discovery
        ? `A hidden connection comes into view: ${sentence(discovery)}.`
        : `Something that was easy to overlook becomes visible around ${subject}.`;
    case "instruction":
      return content
        ? `The useful information is here: ${sentence(content)}.`
        : `The next useful piece of information comes into view.`;
    case "action":
      return interaction
        ? `Now the idea becomes action: ${interaction}.`
        : `Act on what ${subject} has revealed.`;
    case "feedback":
      return `What changes next becomes evidence for the next move.`;
    case "contribution":
      return `Your contribution changes what ${subject} can become.`;
    case "identity":
      return `${subjectName} carries an identity that becomes clearer through interaction.`;
    case "milestone":
      return progression
        ? `A meaningful point has been reached: ${sentence(progression)}.`
        : `This is a point worth recognizing in the progression.`;
    case "unlock":
    case "earned_access":
      return reward
        ? `The next layer is earned: ${sentence(reward)}.`
        : `Something that was unavailable before is open now.`;
    case "next_step":
      return progression
        ? `The next step is clear: ${sentence(progression)}.`
        : `Use what happened here to choose what comes next.`;
    default:
      return original;
  }
}

export function elevateStoryBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat, index) => ({
    ...beat,
    text: elevateStoryBeat(beat, index, plan),
  }));
}
