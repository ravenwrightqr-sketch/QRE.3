import type {
  CognitiveExperiencePlan,
  StoryBeat,
} from "@qre/contracts";

/**
 * Language realization only.
 *
 * This layer does not choose a story, invent facts, or alter the cognitive
 * architecture. It improves cadence after cognition and narrative structure
 * have already been selected.
 *
 * Rules:
 * - preserve the semantic subject and beat intent
 * - preserve evidence-grounded claims
 * - prefer concrete nouns already present in the beat
 * - vary sentence rhythm without adding unsupported facts
 * - never turn realization into a second planning system
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

const lower = (value: string) => clean(value).toLowerCase();

const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The moment";

function subjectFromBeat(beat: StoryBeat): string {
  const candidate = beat.entities?.[0] ?? "the moment";
  return clean(candidate);
}

function planSignal(
  plan: CognitiveExperiencePlan | undefined,
  field:
    | "purpose"
    | "whyInteract"
    | "contentModel"
    | "discoveryModel"
    | "rewardModel"
    | "futureEvolution"
    | "creativePossibilities",
): string {
  if (!plan) return "";
  if (field === "purpose") return clean(plan.purpose ?? "");
  return clean(plan[field]?.[0] ?? "");
}

function removeRedundancy(value: string): string {
  return clean(value)
    .replace(/\bthe the\b/gi, "the")
    .replace(/\bmore meaningful through the interaction\b/gi, "more meaningful through what happened")
    .replace(/\bthe experience gives you the next useful piece of information\b/gi, "the next useful piece of information comes into view")
    .replace(/\bthe thing the experience puts into focus\b/gi, "what comes into focus")
    .replace(/\bcontains more than the first glance reveals\b/gi, "invites a second look")
    .replace(/\bthe hidden relationship around ([^.]+) becomes visible\b/gi, "a hidden relationship around $1 comes into view")
    .replace(/\bthe experience leaves a meaning behind, attached to ([^.]+)\b/gi, "what remains is a meaning carried by $1")
    .replace(/\bthe subject now means more because of what happened around it\b/gi, "what happened around it gives the subject another layer of meaning");
}

/**
 * Elevate a single beat without changing its semantic job.
 */
export function elevateStoryBeat(
  beat: StoryBeat,
  index: number,
  plan?: CognitiveExperiencePlan,
): string {
  const original = removeRedundancy(beat.text);
  const subject = subjectFromBeat(beat);
  const subjectName = cap(subject);
  const purpose = planSignal(plan, "purpose");
  const why = planSignal(plan, "whyInteract");
  const content = planSignal(plan, "contentModel");
  const discovery = planSignal(plan, "discoveryModel");
  const reward = planSignal(plan, "rewardModel");
  const future = planSignal(plan, "futureEvolution");
  const creative = planSignal(plan, "creativePossibilities");
  const direction = lower(plan?.direction ?? "");

  // Keep strong, already-natural language. The compiler should not polish
  // merely for the sake of changing words.
  if (
    original.length >= 70 &&
    !/\b(the experience|the subject|the moment)\b/gi.test(original)
  ) {
    return original;
  }

  switch (beat.kind) {
    case "orientation":
      if (direction === "memory") {
        return `${subjectName} arrives with a history already attached to it.`;
      }
      if (direction === "social") {
        return `${subjectName} gives everyone a shared point of attention.`;
      }
      if (direction === "discovery") {
        return `${subjectName} is the visible surface; the interesting part begins just beyond it.`;
      }
      if (direction === "identity") {
        return `${subjectName} carries more than a name. It carries a point of view.`;
      }
      if (purpose) {
        return `${subjectName} comes into focus because ${purpose.replace(/[.!?]+$/, "")}.`;
      }
      return index % 2 === 0
        ? `${subjectName} comes into focus, giving the experience somewhere real to begin.`
        : `${subjectName} sets the scene. Everything that follows grows from what is already here.`;

    case "hook":
      if (why) {
        return `${cap(why.replace(/[.!?]+$/, ""))}. ${subjectName} gives that intention something tangible to engage with.`;
      }
      return index % 2 === 0
        ? `${subjectName} invites a closer look. The first impression is only the beginning.`
        : `There is a reason to stay with ${subject}: one detail leads naturally to the next.`;

    case "need":
      return why
        ? `${cap(why.replace(/[.!?]+$/, ""))}. That is the thread worth following first.`
        : `Begin with what ${subject} is asking for now, rather than adding more than the moment needs.`;

    case "threshold":
      return why
        ? `The threshold is simple: ${why.replace(/[.!?]+$/, "")}.` 
        : `${subjectName} marks the edge of the familiar. Step past the obvious layer and see what changes.`;

    case "origin":
      return plan?.memoryModel?.[0]
        ? `${subjectName} carries the past forward: ${clean(plan.memoryModel[0])}.`
        : `${subjectName} carries something from before this moment into the present.`;

    case "encounter":
      return beat.entities?.[1]
        ? `${cap(clean(beat.entities[1]))} enters the frame, giving ${subject} another relationship to hold.`
        : `${subjectName} meets another point of view, and the meaning of the moment begins to shift.`;

    case "challenge":
      return plan?.progressionModel?.[0]
        ? `The challenge has a purpose: ${clean(plan.progressionModel[0])}.`
        : `${subjectName} asks for a response before the next layer can open.`;

    case "discovery":
      return discovery
        ? `${subjectName} opens onto something deeper: ${discovery}.`
        : creative
          ? `${subjectName} reveals a possibility that was easy to miss: ${creative}.`
          : `${subjectName} gives up another layer. What looked simple now has context.`;

    case "reveal":
      return discovery
        ? `The hidden layer comes into view: ${discovery}.`
        : `A connection that was easy to overlook becomes visible around ${subject}.`;

    case "instruction":
      return content
        ? `Here is the useful part: ${content}.`
        : `${subjectName} narrows the next move to something clear and useful.`;

    case "action":
      return original.length > 45
        ? original
        : `Now the idea becomes action. Respond to what ${subject} has revealed.`;

    case "feedback":
      return `Watch what changes. The response becomes evidence for whatever comes next.`;

    case "contribution":
      return `Your contribution matters here; it changes what ${subject} can become for the next person.`;

    case "escalation":
      return plan?.progressionModel?.[0]
        ? `The experience gathers momentum through ${clean(plan.progressionModel[0])}.`
        : `${subjectName} raises the stakes without losing the thread that brought us here.`;

    case "transformation":
      return `${subjectName} is no longer quite the same after what has been uncovered.`;

    case "reflection":
      return plan?.emotionalIntent?.[0]
        ? `What remains is ${clean(plan.emotionalIntent[0])}; the moment has somewhere to settle.`
        : `${subjectName} leaves something behind to consider, not just something to remember.`;

    case "identity":
      return creative
        ? `${subjectName} becomes a clearer expression of ${creative}.`
        : `${subjectName} says something about the people and values gathered around it.`;

    case "milestone":
      return plan?.progressionModel?.[0]
        ? `This is a meaningful turn in the progression: ${clean(plan.progressionModel[0])}.`
        : `${subjectName} has reached a point worth recognizing.`;

    case "unlock":
    case "earned_access":
      return reward
        ? `The next layer is earned: ${reward}.`
        : `Something that was closed a moment ago is open now.`;

    case "payoff":
      return reward
        ? `${cap(reward.replace(/[.!?]+$/, ""))}. That is what the interaction has earned.`
        : purpose
          ? `${cap(purpose.replace(/[.!?]+$/, ""))}. What happened here gives ${subject} a reason to matter.`
          : `${subjectName} lands differently now because the interaction changed the way it is understood.`;

    case "next_step":
      return plan?.progressionModel?.[0]
        ? `From here, the next move is ${clean(plan.progressionModel[0])}.`
        : `Use what just happened to choose the next useful move.`;

    case "continuation":
      return future
        ? `The story remains open: ${future}.`
        : index % 2 === 0
          ? `${subjectName} does not have to end here. Another encounter can reveal something new.`
          : `What comes next can build on this moment without repeating it.`;

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
