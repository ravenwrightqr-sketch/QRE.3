import type { AuthorBrainTruth, ExperienceBeat, ExperiencePresenceContext } from "@qre/contracts";
import { authorBrainUniversal } from "./authorBrainUniversal.js";

export type MicroBeatMouthInput = AuthorBrainTruth & {
  presence?: ExperiencePresenceContext;
  round?: number;
};

const MAX_CUTS = 6;

function kindFor(index: number, total: number): ExperienceBeat["kind"] {
  if (total <= 1 || index === total - 1) return "payoff";
  if (index === total - 2) return "turn";
  if (index === 1) return "reveal";
  return "jolt";
}

function sceneText(value: string): string {
  return value.replace(/[,;]/g, "").replace(/\s+/g, " ").trim();
}

export async function authorMicroBeats(input: MicroBeatMouthInput): Promise<ExperienceBeat[]> {
  if (process.env.QRE_AI_ENABLED !== "true" || process.env.QRE_EXTERNAL_AI_ENABLED === "true") return [];

  const brainInput: AuthorBrainTruth = {
    prompt: input.prompt,
    lens: input.lens,
    subject: input.subject,
    place: input.place,
    subjectTruth: input.subjectTruth,
    cognitivePlan: input.cognitivePlan,
    returning: input.presence?.isReturning ?? input.returning,
    visitNumber: input.presence?.visitNumber ?? input.visitNumber,
    presenceSummary: input.presence?.summary ?? input.presenceSummary,
    facts: input.facts,
    sourceMoments: [
      ...input.sourceMoments,
      ...(input.presence?.summary ?? []),
      ...(input.presence?.places ?? []).map((place) => `return location ${place}`),
    ],
    memoryContext: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
    creativeLearningContext: [
      ...(input.creativeLearningContext ?? []),
      input.presence?.isReturning
        ? "returning chapter: callback must evolve meaning rather than restart"
        : "first known chapter: plant one detail worth remembering",
    ],
  };

  const result = await authorBrainUniversal(brainInput);
  const scenes = result.scenes.slice(0, MAX_CUTS);
  if (!scenes.length) return [];

  return scenes.map((scene, index, all) => ({
    id: `micro-beat-${index + 1}`,
    text: sceneText(scene.text),
    kind: kindFor(index, all.length),
    order: index,
    attentionRole: index === all.length - 1 ? "payoff" : "next_cut_pressure",
    operator: index === 0 ? "reframe" : index === all.length - 1 ? "payoff" : "character_lens",
    callback: Boolean(input.presence?.isReturning || input.returning) && index === 0,
    durationHintMs: index === all.length - 1 ? 1800 : Math.max(850, Math.min(1700, 850 + sceneText(scene.text).split(/\s+/).length * 85)),
    meta: {
      source: "universal-author-brain",
      wordCount: sceneText(scene.text).split(/\s+/).filter(Boolean).length,
      returning: Boolean(input.presence?.isReturning || input.returning),
      visitNumber: input.presence?.visitNumber ?? input.visitNumber ?? null,
      creativeAngle: result.brief.angle,
      creativeEngine: result.brief.engine,
    },
  }));
}
