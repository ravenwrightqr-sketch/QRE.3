import type { AuthorBrainTruth, AuthorResult, MovieBeatPlan } from "@qre/contracts";
import { authorBrainUniversal } from "./authorBrainUniversal.js";
import { isMemorialContext, resolveLearnedCreativeLens } from "./authorCreativeLearningPressure.js";
import { buildMovieBeatPlan } from "./authorMovieBeatPlan.js";

export async function authorMoviePipeline(input: AuthorBrainTruth & {
  cta?: { text: string; sourceIds?: string[] };
  presentationMode?: "auto" | "manual";
}): Promise<{ authored: AuthorResult; movieBeatPlan: MovieBeatPlan }> {
  const explicitLens = String(input.lens ?? "").trim().toLowerCase();
  const memorial = isMemorialContext([
    input.prompt,
    input.subject,
    input.place,
    ...(input.facts ?? []),
    ...(input.sourceMoments ?? []),
    ...(input.memoryContext ?? []),
    ...(input.trajectory ?? []),
    ...(input.presenceSummary ?? []),
  ]);

  // Memorial/tribute contexts are a hard semantic safety class. They must not
  // inherit an incompatible learned or explicitly requested genre lens.
  const learnedLens = memorial || (explicitLens && explicitLens !== "neutral")
    ? undefined
    : resolveLearnedCreativeLens(input.cognitiveContext);

  const authorInput: AuthorBrainTruth = memorial
    ? { ...input, lens: "neutral" }
    : learnedLens
      ? { ...input, lens: learnedLens }
      : input;

  const authored = await authorBrainUniversal(authorInput);
  const movieBeatPlan = buildMovieBeatPlan({
    textBeats: authored.scenes
      .filter((scene) => scene.kind !== "photo" && Boolean(scene.text.trim()))
      .map((scene, index) => ({
        id: `author-text-${index + 1}`,
        text: scene.text,
        sourceIds: [],
        attentionRole: scene.kind ?? "movement",
        durationHintMs: 1400,
      })),
    media: input.cognitiveContext?.media ?? [],
    textBeatTarget: input.cognitiveContext?.textBeatTarget ?? 5,
    mode: input.presentationMode ?? "auto",
    cta: input.cta,
  });

  return { authored, movieBeatPlan };
}
