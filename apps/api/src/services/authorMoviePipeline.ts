import type { AuthorBrainTruth, AuthorResult, MovieBeatPlan } from "@qre/contracts";
import { authorBrainUniversal } from "./authorBrainUniversal.js";
import { resolveLearnedCreativeLens } from "./authorCreativeLearningPressure.js";
import { buildMovieBeatPlan } from "./authorMovieBeatPlan.js";
import {
  classifyAuthorCreativeSafety,
  isProtectedCreativeContext as isSemanticProtectedContext,
} from "./authorCreativeSafetyContext.js";

const INTERNAL_SOURCE_LABEL = /^(?:INTENT|DOMAIN|SUBJECT|TYPE|GOAL|OUTPUT|TONE|CURRENT FACTS|KNOWN ASSET FACTS|REAL FACTS|FIELDS|AUTHORING|COGNITIVE|LEARNING SIGNALS|PROVENANCE|DIAGNOSTICS)\s*:/i;
const INTERNAL_SOURCE_META = /\b(?:intent\s*:|domain\s*:|subject\s*:|goal\s*:|output\s*:|tone\s*:|current facts\s*:|known asset facts\s*:|fields\s*:|second meaning|gave the moment its shape|made the larger moment stay|next beat was|this was the hinge|according to qre|cognitive|provenance)\b/i;

function cleanSourceValue(value: unknown): string[] {
  return String(value ?? "")
    .split(/\s*\|\s*|\r?\n+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 3)
    .filter((item) => !INTERNAL_SOURCE_LABEL.test(item))
    .filter((item) => !INTERNAL_SOURCE_META.test(item));
}

function sanitizeAuthorInput(input: AuthorBrainTruth): AuthorBrainTruth {
  const sanitizeList = (values?: readonly string[]) => [...new Set((values ?? []).flatMap(cleanSourceValue))].slice(0, 120);
  return {
    ...input,
    facts: sanitizeList(input.facts),
    sourceMoments: sanitizeList(input.sourceMoments),
    memoryContext: sanitizeList(input.memoryContext),
    presenceSummary: sanitizeList(input.presenceSummary),
    trajectory: sanitizeList(input.trajectory),
  };
}

export async function authorMoviePipeline(input: AuthorBrainTruth & {
  cta?: { text: string; sourceIds?: string[] };
  presentationMode?: "auto" | "manual";
}): Promise<{ authored: AuthorResult; movieBeatPlan: MovieBeatPlan }> {
  const sanitizedInput = sanitizeAuthorInput(input);
  const explicitLens = String(sanitizedInput.lens ?? "").trim().toLowerCase();
  const safety = classifyAuthorCreativeSafety({
    cognitivePlan: sanitizedInput.cognitivePlan,
    premise: sanitizedInput.cognitivePlan?.premise,
    backstopText: [
      sanitizedInput.prompt,
      sanitizedInput.subject,
      sanitizedInput.place ?? "",
      ...(sanitizedInput.facts ?? []),
      ...(sanitizedInput.sourceMoments ?? []),
      ...(sanitizedInput.memoryContext ?? []),
      ...(sanitizedInput.trajectory ?? []),
      ...(sanitizedInput.presenceSummary ?? []),
    ],
  });
  const cognitiveContext = {
    ...(sanitizedInput.cognitiveContext ?? {}),
    creativeSafety: safety,
  };
  const protectedContext = isSemanticProtectedContext(cognitiveContext);

  const learnedLens = protectedContext || (explicitLens && explicitLens !== "neutral")
    ? undefined
    : resolveLearnedCreativeLens(cognitiveContext);

  const authorInput: AuthorBrainTruth = protectedContext
    ? { ...sanitizedInput, lens: "neutral", cognitiveContext }
    : learnedLens
      ? { ...sanitizedInput, lens: learnedLens, cognitiveContext }
      : { ...sanitizedInput, cognitiveContext };

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
    media: sanitizedInput.cognitiveContext?.media ?? [],
    textBeatTarget: sanitizedInput.cognitiveContext?.textBeatTarget ?? 5,
    mode: sanitizedInput.presentationMode ?? "auto",
    cta: sanitizedInput.cta,
  });

  return { authored, movieBeatPlan };
}
