import type { AuthorBrainTruth, AuthorResult, MovieBeatPlan } from "@qre/contracts";
import { authorBrainUniversal } from "./authorBrainUniversal.js";
import { resolveLearnedCreativeLens } from "./authorCreativeLearningPressure.js";
import { buildMovieBeatPlan } from "./authorMovieBeatPlan.js";
import {
  classifyAuthorCreativeSafety,
  isProtectedCreativeContext as isSemanticProtectedContext,
} from "./authorCreativeSafetyContext.js";

export async function authorMoviePipeline(input: AuthorBrainTruth & {
  cta?: { text: string; sourceIds?: string[] };
  presentationMode?: "auto" | "manual";
}): Promise<{ authored: AuthorResult; movieBeatPlan: MovieBeatPlan }> {
  const explicitLens = String(input.lens ?? "").trim().toLowerCase();
  const safety = classifyAuthorCreativeSafety({
    cognitivePlan: input.cognitivePlan,
    premise: input.cognitivePlan?.premise,
    backstopText: [
      input.prompt,
      input.subject,
      input.place,
      ...(input.facts ?? []),
      ...(input.sourceMoments ?? []),
      ...(input.memoryContext ?? []),
      ...(input.trajectory ?? []),
      ...(input.presenceSummary ?? []),
    ],
  });
  const cognitiveContext = {
    ...(input.cognitiveContext ?? {}),
    creativeSafety: safety,
  };
  const protectedContext = isSemanticProtectedContext(cognitiveContext);

  const learnedLens = protectedContext || (explicitLens && explicitLens !== "neutral")
    ? undefined
    : resolveLearnedCreativeLens(cognitiveContext);

  const authorInput: AuthorBrainTruth = protectedContext
    ? { ...input, lens: "neutral", cognitiveContext }
    : learnedLens
      ? { ...input, lens: learnedLens, cognitiveContext }
      : { ...input, cognitiveContext };

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
