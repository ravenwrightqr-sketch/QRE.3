import { compileStoryExperience as compileBaseStoryExperience } from "./universalStoryCompiler.js";
import { eventRealizationHint } from "./eventWorld.js";
import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * Final realization pass over the existing universal compiler.
 *
 * The architecture stays locked: observation → cognition → trajectory →
 * story → downstream projections. This wrapper only adds the missing event
 * world between trajectory selection and presentation, so semantic labels do
 * not survive as the final prose when concrete evidence is available.
 */

const lower = (value: unknown): string =>
  typeof value === "string" ? value.toLowerCase() : "";

const sentence = (value: string): string =>
  value.replace(/[.!?]+$/, "").trim();

function isThinRealization(text: string): boolean {
  const normalized = lower(text);

  const dead = [
    "the experience",
    "the interaction",
    "the premise",
    "the current state",
    "another concrete layer",
    "what happens next",
    "the result",
    "something previously unavailable",
    "the next state",
    "meaningful point",
    "meaningful state",
  ];

  const hits = dead.reduce(
    (count, phrase) => count + (normalized.includes(phrase) ? 1 : 0),
    0,
  );

  const words = normalized.split(/\s+/).filter(Boolean).length;
  return hits >= 1 && words <= 28;
}

function realizeBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): StoryBeat {
  const hint = sentence(eventRealizationHint(beat, plan));
  if (!hint) return beat;

  if (isThinRealization(beat.text)) {
    return { ...beat, text: hint };
  }

  // Preserve strong existing prose. If it already contains the concrete event
  // evidence, adding another sentence only creates repetition.
  const normalized = lower(beat.text);
  const hintWords = hint
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4);
  const overlap = hintWords.filter((word) => normalized.includes(word)).length;

  if (hintWords.length >= 3 && overlap / hintWords.length >= 0.55) {
    return beat;
  }

  if (
    [
      "orientation",
      "encounter",
      "discovery",
      "transformation",
      "payoff",
      "reflection",
    ].includes(beat.kind)
  ) {
    return {
      ...beat,
      text: `${sentence(beat.text)} ${hint}`,
    };
  }

  return beat;
}

export function compileSuperCognitiveStoryExperience(
  prompt: string,
  context: Parameters<typeof compileBaseStoryExperience>[1] = {},
) {
  const compiled = compileBaseStoryExperience(prompt, context);
  const plan = context.cognitivePlan;
  const beats = compiled.story.beats.map((beat) => realizeBeat(beat, plan));

  const story = {
    ...compiled.story,
    beats,
    hook: beats[0]?.text ?? compiled.story.hook,
    ending:
      beats.find((beat) => beat.kind === "payoff")?.text ??
      beats.at(-1)?.text ??
      compiled.story.ending,
    continuation:
      beats.find((beat) => beat.kind === "continuation")?.text,
  };

  const moments = compiled.moments.map((moment, index) => ({
    ...moment,
    text: beats[index]?.text ?? moment.text,
    meta: {
      ...moment.meta,
      beatId: beats[index]?.id ?? moment.meta?.beatId,
      beatKind: beats[index]?.kind ?? moment.meta?.beatKind,
      entities: beats[index]?.entities ?? moment.meta?.entities,
      provenance: beats[index]?.provenance ?? moment.meta?.provenance,
    },
  }));

  const flowSteps = compiled.flowSteps.map((step, index) => ({
    ...step,
    payload: {
      ...step.payload,
      beat: beats[index] ?? step.payload?.beat,
    },
  }));

  const scenePlan = compiled.scenePlan.map((scene, index) => ({
    ...scene,
    text: beats[index]?.text ?? scene.text,
    purpose: beats[index]?.purpose ?? scene.purpose,
    emotionalTarget:
      beats[index]?.emotionalTarget ?? scene.emotionalTarget,
    entities: beats[index]?.entities ?? scene.entities,
    provenance: beats[index]?.provenance ?? scene.provenance,
  }));

  const cinematicScenes = compiled.cinematicScenes.map((scene, index) => ({
    ...scene,
    moment: moments[index] ?? scene.moment,
    meta: {
      ...scene.meta,
      purpose: beats[index]?.purpose ?? scene.meta?.purpose,
      emotionalTarget:
        beats[index]?.emotionalTarget ?? scene.meta?.emotionalTarget,
      entities: beats[index]?.entities ?? scene.meta?.entities,
      provenance: beats[index]?.provenance ?? scene.meta?.provenance,
    },
  }));

  const blueprint = {
    ...compiled.blueprint,
    moments: compiled.blueprint.moments.map((moment, index) => ({
      ...moment,
      description:
        beats[index]?.text ?? moment.description,
      payload: {
        ...moment.payload,
        beatId: beats[index]?.id ?? moment.payload?.beatId,
        purpose: beats[index]?.purpose ?? moment.payload?.purpose,
        entities: beats[index]?.entities ?? moment.payload?.entities,
        provenance:
          beats[index]?.provenance ?? moment.payload?.provenance,
      },
    })),
  };

  const model = {
    ...compiled.model,
    description: story.logline,
    moments,
  };

  return {
    ...compiled,
    story,
    blueprint,
    flowSteps,
    moments,
    cinematicScenes,
    scenePlan,
    model,
    ending: story.ending,
  };
}
