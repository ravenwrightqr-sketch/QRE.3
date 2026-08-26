/**
 * QRE FILE ROLE: Production Author projection.
 * AUTHORITY: the canonical Author brain is the only creative generator.
 * MUST NOT: invoke another planner, critic, or prose generator.
 */
import type {
  AuthorBrainTruth,
  ExperienceBeat,
  ExperiencePresenceContext,
} from "@qre/contracts";
import { authorBrainCanonical } from "./authorBrainCanonical.js";

export type MicroBeatMouthInput = AuthorBrainTruth & {
  presence?: ExperiencePresenceContext;
  round?: number;
};

function sceneText(value: string): string {
  return value.replace(/[,;]/g, "").replace(/\s+/g, " ").trim();
}

export async function authorMicroBeats(
  input: MicroBeatMouthInput,
): Promise<ExperienceBeat[]> {
  if (input.movieMode === false) return [];

  const sourceFacts = [
    ...input.facts,
    ...(input.memoryContext ?? []),
    ...(input.presence?.summary ?? []),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const result = await authorBrainCanonical({
    prompt: input.prompt,
    lens: input.lens,
    subject: input.subject,
    place: input.place,
    subjectTruth: input.subjectTruth,
    movieMode: input.movieMode,
    returning: input.presence?.isReturning ?? input.returning,
    visitNumber: input.presence?.visitNumber ?? input.visitNumber,
    presenceSummary: input.presence?.summary ?? input.presenceSummary,
    facts: [...new Set(sourceFacts)],
    sourceMoments: [...new Set(sourceFacts)],
    memoryContext: [...new Set((input.memoryContext ?? []).map(String).filter(Boolean))],
    creativeLearningContext: [...new Set((input.creativeLearningContext ?? []).map(String).filter(Boolean))],
  });

  return result.scenes.map((scene, index, scenes) => ({
    id: `micro-beat-${index + 1}`,
    text: sceneText(scene.text),
    kind:
      scene.kind === "payoff" || index === scenes.length - 1
        ? "payoff"
        : index === 0
          ? "hook"
          : scene.kind === "turn"
            ? "turn"
            : "jolt",
    order: index,
    attentionRole: index === scenes.length - 1 ? "payoff" : "next_cut_pressure",
    operator: index === 0 ? "reframe" : index === scenes.length - 1 ? "payoff" : "character_lens",
    callback: Boolean(input.presence?.isReturning || input.returning) && index === 0,
    durationHintMs: index === scenes.length - 1 ? 1800 : Math.max(850, Math.min(1700, 850 + sceneText(scene.text).split(/\s+/).length * 85)),
    meta: {
      source: "qre-canonical-author-brain",
      returning: Boolean(input.presence?.isReturning || input.returning),
      visitNumber: input.presence?.visitNumber ?? input.visitNumber ?? null,
      creativeAngle: result.brief.angle,
      creativeEngine: result.brief.engine,
    },
  }));
}
