import type {
  CognitiveExperiencePlan,
  CognitiveExperienceState,
  ExperienceBlueprint,
  ExperienceGenome,
  StoryBeat,
} from "@qre/contracts";

import { understandExperience } from "../cognition/cognitiveEngine.js";
import {
  compileStoryExperience,
  type CompiledStoryExperience,
  type StoryCompilerContext,
} from "./universalStoryCompiler.js";

/**
 * ============================================================
 * QRE COGNITIVE EXPERIENCE COMPILER — ARCHITECTURE LOCK
 * ============================================================
 *
 * Canonical pipeline:
 *   PROMPT
 *     → COGNITIVE UNDERSTANDING
 *     → EVIDENCE
 *     → MEANING
 *     → HYPOTHESES
 *     → OPPORTUNITY SPACE
 *     → SELECTED EXPERIENCE DIRECTION
 *     → COGNITIVE PLAN
 *     → UNIVERSAL COMPILATION
 *     → SUPER COG LANGUAGE REALIZATION
 *     → BLUEPRINT
 *     → FLOW
 *     → MOMENTS
 *     → CINEMATIC SCENES
 *
 * Cognition is the semantic authority. The universal compiler is the
 * runtime-shape substrate. This file owns the final realization handoff.
 *
 * REALIZATION RULE:
 *   Do not describe the compiler.
 *   Do not flatten the prompt into an industry template.
 *   Lean into the subject, situation, genre, sensory world, escalation,
 *   transformation, and emotional payoff already supported by cognition.
 *
 * ============================================================
 */

export type CognitiveCompiledExperience = CompiledStoryExperience & {
  cognition: CognitiveExperienceState;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const cap = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "The story";

const GENERIC_WORDS = new Set([
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
  "this",
  "that",
]);

const FORBIDDEN_META_LANGUAGE = [
  /\bthe thing the experience puts into focus\b/i,
  /\bwhat the experience has revealed\b/i,
  /\bhas become more meaningful through the interaction\b/i,
  /\bturns observed detail into an evidence-aware experience\b/i,
  /\bthe subject now means more because of what happened around it\b/i,
];

function sentence(value: string): string {
  return clean(value).replace(/[.!?]+$/, "");
}

function subjectFromBeat(beat: StoryBeat): string {
  return clean(beat.entities?.[0] ?? "the subject");
}

function detailsFromBeat(beat: StoryBeat): string[] {
  const subjectWords = new Set(
    lower(subjectFromBeat(beat)).split(/\s+/).filter(Boolean),
  );

  return (beat.entities ?? [])
    .slice(1)
    .map(clean)
    .filter((value) => {
      const normalized = lower(value);
      return (
        normalized.length > 2 &&
        !GENERIC_WORDS.has(normalized) &&
        !subjectWords.has(normalized)
      );
    });
}

function primary(
  plan: CognitiveExperiencePlan | undefined,
  field:
    | "whyInteract"
    | "purpose"
    | "contentModel"
    | "discoveryModel"
    | "rewardModel"
    | "progressionModel"
    | "futureEvolution"
    | "creativePossibilities",
): string {
  if (!plan) return "";
  if (field === "purpose") return clean(plan.purpose ?? "");
  return clean(plan[field]?.[0] ?? "");
}

function subjectFlavor(subject: string, details: string[]): string {
  const text = lower([subject, ...details].join(" "));

  if (/\b(groomer|grooming|poodle|dog|pet|salon|spa|massage|facial)\b/.test(text)) {
    return "pampering";
  }

  if (/\b(horror|haunted|ghost|demon|murder|creepy|dark|nightmare)\b/.test(text)) {
    return "horror";
  }

  if (/\b(concert|musician|artist|band|guitar|festival|rave|nightclub)\b/.test(text)) {
    return "performance";
  }

  if (/\b(wedding|birthday|anniversary|party|celebration)\b/.test(text)) {
    return "celebration";
  }

  if (/\b(house|home|cleaning|cleaner|housekeeper|client)\b/.test(text)) {
    return "service";
  }

  return "general";
}

function storyMood(plan: CognitiveExperiencePlan | undefined):
  | "playful"
  | "dark"
  | "mysterious"
  | "warm"
  | "triumphant"
  | "luxurious"
  | "neutral" {
  const intent = lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
  ].join(" "));

  if (/\b(urgency|intensity|dark|horror|fear|dread)\b/.test(intent)) return "dark";
  if (/\b(curiosity|mystery|mysterious|reveal)\b/.test(intent)) return "mysterious";
  if (/\b(play|joy|fun|playful|delight|laugh)\b/.test(intent)) return "playful";
  if (/\b(pride|victory|achievement|triumph)\b/.test(intent)) return "triumphant";
  if (/\b(calm|luxury|indulgence|spa|serene)\b/.test(intent)) return "luxurious";
  if (/\b(connection|remembrance|nostalgia|love|affection)\b/.test(intent)) return "warm";
  return "neutral";
}

function planMaterial(plan?: CognitiveExperiencePlan): string {
  return sentence(
    primary(plan, "creativePossibilities") ||
      primary(plan, "discoveryModel") ||
      primary(plan, "contentModel") ||
      primary(plan, "whyInteract"),
  );
}

function realizeBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const subject = subjectFromBeat(beat);
  const name = cap(subject);
  const details = detailsFromBeat(beat);
  const detail = details.find((value) =>
    /\b(groomer|grooming|spa|salon|housekeeper|cleaning|concert|venue|studio)\b/i.test(value),
  ) ?? details[0] ?? "";
  const flavor = subjectFlavor(subject, details);
  const mood = storyMood(plan);
  const future = sentence(primary(plan, "futureEvolution"));
  const progression = sentence(primary(plan, "progressionModel"));
  const reward = sentence(primary(plan, "rewardModel"));
  const why = sentence(primary(plan, "whyInteract"));
  const material = planMaterial(plan);

  if (plan?.direction === "utility") {
    switch (beat.kind) {
      case "need":
        return why ? `${name}: ${why}.` : `Start with what ${subject} needs right now.`;
      case "instruction":
        return material
          ? `Here is the part that actually helps: ${material}.`
          : `Start with the clearest useful move, then let the result guide what comes next.`;
      case "action":
        return `Now use it. The next move should change something about ${subject}.`;
      case "feedback":
        return `Look at the result. What changed tells you what to do next.`;
      case "next_step":
        return future ? `From here, it can keep getting smarter: ${future}.` : `The next step follows from what just happened.`;
    }
  }

  if (plan?.direction === "game") {
    switch (beat.kind) {
      case "hook":
        return `${name} is where the trouble starts. There is something here worth chasing.`;
      case "challenge":
        return progression ? `The challenge tightens the screws: ${progression}.` : `The easy part is over. The next move has to be earned.`;
      case "discovery":
        return detail ? `The clue points toward ${detail}. That changes the hunt.` : `The clue opens a door that was not visible a moment ago.`;
      case "escalation":
        return `Now it gets harder. The game has enough information to stop being polite about it.`;
      case "payoff":
        return reward ? `You earned it: ${reward}.` : `The payoff lands because the player actually had to get there.`;
    }
  }

  if (plan?.direction === "memory") {
    switch (beat.kind) {
      case "orientation":
        return `${name} does not start empty. There is already a life attached to it.`;
      case "origin":
        return detail ? `It starts with ${detail}, then opens into everything that came after.` : `The first layer is where the story began.`;
      case "encounter":
        return detail ? `${cap(detail)} pulls another piece of ${subject} back into the room.` : `A remembered detail suddenly feels present again.`;
      case "reflection":
        return mood === "playful"
          ? `And then there is the part everyone remembers differently—which is usually where the best stories live.`
          : `The details are what keep the memory from becoming a monument. They make it feel lived in.`;
      case "payoff":
        return `The past is not being displayed like an artifact. It is being brought back into the present.`;
      case "continuation":
        return future ? `And it is not finished: ${future}.` : `There is room for another story the next time someone comes back.`;
    }
  }

  if (plan?.direction === "discovery") {
    switch (beat.kind) {
      case "threshold":
        return `${name} looks ordinary until you get close enough to notice the invitation.`;
      case "reveal":
        return detail ? `Then ${detail} changes the picture.` : `The first reveal changes what you thought you were looking at.`;
      case "discovery":
        return material ? `The deeper layer is where it gets interesting: ${material}.` : `One discovery leads naturally to another.`;
      case "payoff":
        return `The reveal earns its place because you cannot look at ${subject} quite the same way afterward.`;
      case "continuation":
        return future ? `There is still more beyond this layer: ${future}.` : `The door stays open for another discovery.`;
    }
  }

  if (plan?.direction === "social") {
    switch (beat.kind) {
      case "orientation":
        return `${name} gives everyone something to react to.`;
      case "encounter":
        return `Someone adds something. Someone else responds. Now ${subject} belongs to the room.`;
      case "contribution":
        return `The interesting part is that the next person inherits what the last person changed.`;
      case "payoff":
        return `The payoff is the room realizing it made something together.`;
      case "continuation":
        return future ? `And it keeps moving: ${future}.` : `The next person gets to change it again.`;
    }
  }

  if (plan?.direction === "commerce") {
    switch (beat.kind) {
      case "orientation":
        return `${name} starts with a relationship, not a points counter.`;
      case "identity":
        return `${name} starts to feel like something people can belong to rather than simply buy from.`;
      case "discovery":
        return detail ? `${cap(detail)} becomes part of the reason to come back.` : `The experience gives the relationship another layer.`;
      case "payoff":
        return reward ? `The return feels earned: ${reward}.` : `The reason to return comes from what happened here.`;
      case "continuation":
        return future ? `The relationship keeps evolving: ${future}.` : `The next visit can build on this one.`;
    }
  }

  if (plan?.direction === "journey") {
    switch (beat.kind) {
      case "orientation":
        return `${name} starts somewhere. It does not stay there.`;
      case "threshold":
        return `The next place changes the story because ${subject} now carries everything that came before it.`;
      case "discovery":
        return detail ? `${name} picks up another chapter around ${detail}.` : `The road supplies another chapter.`;
      case "transformation":
        return `By now, ${name} carries evidence of the distance it has traveled.`;
      case "continuation":
        return future ? `And the route is still open: ${future}.` : `There is another chapter waiting down the road.`;
    }
  }

  // General story mode is intentionally premise-forward. It does not narrate
  // the compiler or pretend every prompt is a memory, portal, or transaction.
  switch (beat.kind) {
    case "orientation":
      if (flavor === "pampering") {
        return `${name} arrived at the ${detail || "appointment"} with no obvious reason to believe this was going to become a big deal.`;
      }
      if (flavor === "horror" || mood === "dark") {
        return `${name} begins in a world that still looks ordinary. That will not last.`;
      }
      if (flavor === "performance") {
        return `${name} is already carrying the energy of a world that exists beyond the object itself.`;
      }
      if (flavor === "celebration") {
        return `${name} arrives with a room full of people, expectations, and the possibility of something worth remembering.`;
      }
      if (mood === "playful") return `${name} is where the fun starts.`;
      return `${name} is where this story starts.`;

    case "hook":
      if (flavor === "pampering") {
        return `At first, ${subject} seems perfectly content to treat the whole thing like another appointment. Then the pampering starts.`;
      }
      if (flavor === "horror" || mood === "dark") {
        return `Something is slightly wrong. Not enough to leave yet. Enough to notice.`;
      }
      if (flavor === "performance") {
        return `${name} turns out to be a doorway into something much bigger than the physical object.`;
      }
      if (mood === "mysterious") {
        return `There is one detail that does not quite fit. That is the detail worth following.`;
      }
      if (mood === "playful") {
        return `This is the point where ${subject} stops behaving like an ordinary ${detail || "thing"}.`;
      }
      return why ? `${cap(why)}. ${name} gives that idea somewhere real to happen.` : `${name} gives the story something worth following.`;

    case "encounter":
      if (flavor === "pampering") {
        return `What looked routine starts feeling suspiciously luxurious, and ${subject} is not exactly fighting it anymore.`;
      }
      if (flavor === "service") {
        return `${name} meets the little details that make the finished result feel personal instead of merely finished.`;
      }
      if (flavor === "horror" || mood === "dark") {
        return `Then the story gives ${subject} something it cannot politely ignore.`;
      }
      return detail
        ? `${cap(detail)} enters the scene, and suddenly ${subject} has a different problem—or possibility.`
        : `${name} meets the first thing that makes the story move.`;

    case "transformation":
      if (flavor === "pampering") {
        return `By the end, ${name} has crossed the line from merely tolerating the experience to looking like it owns the place.`;
      }
      if (flavor === "horror" || mood === "dark") {
        return `The ordinary explanation is gone. Whatever ${subject} was before this moment, it is not that anymore.`;
      }
      if (mood === "playful") {
        return `${name} comes out the other side changed enough to make the whole thing worth telling.`;
      }
      return `${name} does not come out of the experience exactly the way it went in.`;

    case "payoff":
      if (flavor === "pampering") {
        return `The payoff is the reveal: ${name} went in as a regular poodle and came out looking like a tiny celebrity with somewhere important to be.`;
      }
      if (flavor === "horror" || mood === "dark") {
        return `Now the truth lands. The worst part is realizing it was there before anyone noticed.`;
      }
      if (mood === "mysterious") {
        return `The answer is satisfying because it changes the meaning of everything that came before it.`;
      }
      if (mood === "playful") return `And that is the part people will retell.`;
      return `The payoff lands when the subject finally earns the story that has been building around it.`;

    case "reflection":
      return mood === "warm"
        ? `The small details are what make the moment feel like it belonged to real people.`
        : `What stays with you is the part that could not have been produced by a generic template.`;

    case "continuation":
      return future ? `And it does not have to end here: ${future}.` : `${name} can keep going. The next chapter can grow from what happened here.`;

    case "discovery":
    case "reveal":
      return detail ? `${cap(detail)} changes what ${subject} means in this story.` : `The next layer earns its place by changing what you thought you were seeing.`;

    case "challenge":
      return progression ? `The pressure builds: ${progression}.` : `Something has to give before ${subject} can move forward.`;

    case "milestone":
      return progression ? `This is the point where the story can feel the difference: ${progression}.` : `This is a point worth remembering because something actually changed.`;

    case "contribution":
      return `Someone adds something real, and ${subject} changes because of it.`;

    case "identity":
      return `${name} starts to feel unmistakably like itself.`;

    case "unlock":
    case "earned_access":
      return reward ? `The next layer opens because it was earned: ${reward}.` : `The next layer is open now.`;

    case "need":
      return why ? `${cap(why)}. That is where this story needs to begin.` : `${name} has a reason to move.`;

    case "instruction":
      return material ? `The useful part is concrete: ${material}.` : `Here is what matters next.`;

    case "action":
      return `Now something happens. ${name} has to respond.`;

    case "feedback":
      return `The result tells us what the story should do next.`;

    case "threshold":
      return `${name} is the threshold. Step closer.`;

    case "origin":
      return detail ? `It begins with ${detail}. Everything else grows from there.` : `It begins with what was already there.`;

    case "next_step":
      return future ? `Next: ${future}.` : `There is a clear next move.`;

    default:
      return clean(beat.text);
  }
}

function sanitize(text: string, subject: string): string {
  const value = clean(text);
  return FORBIDDEN_META_LANGUAGE.some((pattern) => pattern.test(value))
    ? `${cap(subject)} gives the story somewhere real to begin.`
    : value;
}

function realizeLanguage(
  compiled: CompiledStoryExperience,
  cognition: CognitiveExperienceState,
): CompiledStoryExperience {
  const beats = compiled.story.beats.map((beat) => ({
    ...beat,
    text: sanitize(realizeBeat(beat, cognition.plan), subjectFromBeat(beat)),
  }));

  const beatById = new Map(beats.map((beat) => [beat.id, beat]));

  const story = {
    ...compiled.story,
    beats,
    hook: beats[0]?.text ?? compiled.story.hook,
    ending:
      beats.find((beat) => beat.kind === "payoff")?.text ??
      beats.at(-1)?.text ??
      compiled.story.ending,
    continuation:
      beats.find((beat) => beat.kind === "continuation")?.text ??
      compiled.story.continuation,
  };

  const blueprint = {
    ...compiled.blueprint,
    moments: compiled.blueprint.moments.map((moment) => {
      const beatId = String(
        (moment.payload as { beatId?: unknown } | undefined)?.beatId ?? "",
      );
      const beat = beatById.get(beatId);
      return beat ? { ...moment, description: beat.text } : moment;
    }),
  };

  const flowSteps = compiled.flowSteps.map((step) => {
    const payload = step.payload as { beat?: { id?: string } } | undefined;
    const beatId = payload?.beat?.id;
    const beat = beatId ? beatById.get(beatId) : undefined;

    return beat
      ? { ...step, payload: { ...step.payload, beat } }
      : step;
  });

  const moments = compiled.moments.map((moment) => {
    const beatId = String(
      (moment.meta as { beatId?: unknown } | undefined)?.beatId ?? "",
    );
    const beat = beatById.get(beatId);
    return beat ? { ...moment, text: beat.text } : moment;
  });

  const scenePlan = compiled.scenePlan.map((scene) => {
    const beat = beatById.get(scene.beatId);
    return beat ? { ...scene, text: beat.text } : scene;
  });

  const cinematicScenes = compiled.cinematicScenes.map((scene, index) => ({
    ...scene,
    moment: moments[index] ?? scene.moment,
  }));

  return {
    ...compiled,
    story,
    blueprint,
    flowSteps,
    moments,
    scenePlan,
    cinematicScenes,
  };
}

function canonicalizeCognition(
  cognition: CognitiveExperienceState,
): CognitiveExperienceState {
  return {
    ...cognition,
    plan: {
      ...cognition.plan,
      direction: cognition.selectedHypothesis.kind,
    },
  };
}

function mergeGenome(
  genome: ExperienceGenome,
  cognition: CognitiveExperienceState,
): ExperienceGenome {
  const selected = cognition.selectedHypothesis;

  return {
    ...genome,
    intent: [...new Set([...genome.intent, selected.kind, ...cognition.motivations.value])],
    archetypes: [...new Set([...genome.archetypes, selected.kind, ...cognition.hypotheses.map((item) => item.kind)])],
    themes: [...new Set([...genome.themes, ...cognition.emotionalIntent, ...cognition.affordances, ...cognition.plan.interactionModel, ...cognition.plan.futureEvolution])],
    emotions: [...new Set([...genome.emotions, ...cognition.emotionalIntent])],
    memory: Math.max(genome.memory, selected.dimensions.memoryPotential),
    discovery: Math.max(genome.discovery, selected.dimensions.discoveryPotential),
    commerce: Math.max(genome.commerce, selected.dimensions.commercialPotential),
    interaction: Math.max(genome.interaction, selected.dimensions.interactionNaturalness),
    replay: Math.max(genome.replay, selected.dimensions.temporalPotential),
    entities: cognition.entities,
    audience: [...new Set([...genome.audience, ...cognition.participants.value, ...cognition.plan.audience])],
    dna: [
      ...new Set([
        ...genome.dna,
        "cognitive-experience-intelligence",
        "evidence-aware",
        "hypothesis-driven",
        "cognitive-plan-directed",
        "universal-compiler-substrate",
        "subject-native-realization",
        `hypothesis:${selected.kind}`,
        ...cognition.affordances.map((value) => `affordance:${value}`),
        ...cognition.plan.dynamicBehavior.map((value) => `dynamic:${value}`),
      ]),
    ],
  };
}

function mergeBlueprint(
  blueprint: ExperienceBlueprint,
  cognition: CognitiveExperienceState,
): ExperienceBlueprint {
  return {
    ...blueprint,
    cognitivePlan: cognition.plan,
    metadata: {
      ...blueprint.metadata,
      archetypes: [...new Set([...(blueprint.metadata?.archetypes ?? []), cognition.selectedHypothesis.kind, ...cognition.hypotheses.slice(0, 3).map((item) => item.kind)])],
      themes: [...new Set([...(blueprint.metadata?.themes ?? []), ...cognition.emotionalIntent, ...cognition.affordances, ...cognition.plan.futureEvolution, ...cognition.plan.creativePossibilities])],
      dna: [...new Set([...(blueprint.metadata?.dna ?? []), "evidence-aware", "hypothesis-driven", "cognitive-plan", "adaptive-experience", "universal-compiler-substrate", "subject-native-realization", ...cognition.assumptions.map(() => "assumption-explicit")])],
    },
  };
}

function directModel(
  compiled: CompiledStoryExperience,
  cognition: CognitiveExperienceState,
): CompiledStoryExperience["model"] {
  return {
    ...compiled.model,
    title: compiled.title,
    description: cognition.plan.purpose,
    metadata: {
      ...compiled.model.metadata,
      tags: [
        ...((compiled.model.metadata?.tags ?? []) as string[]),
        "cognitive-experience-intelligence",
        "cognitive-plan-directed",
        "universal-compiler-substrate",
        "subject-native-realization",
        `selected:${cognition.selectedHypothesis.kind}`,
        `subject:${cognition.subject.value}`,
      ],
    },
  };
}

/** Canonical public compiler entry point. */
export function compileCognitiveExperience(
  prompt: string,
  context: StoryCompilerContext = {},
): CognitiveCompiledExperience {
  const cognition = canonicalizeCognition(understandExperience(prompt, context));

  const compiled = compileStoryExperience(prompt, {
    ...context,
    cognitivePlan: cognition.plan,
  });

  const realized = realizeLanguage(compiled, cognition);

  return {
    ...realized,
    cognition,
    genome: mergeGenome(realized.genome, cognition),
    blueprint: mergeBlueprint(realized.blueprint, cognition),
    model: directModel(realized, cognition),
  };
}
