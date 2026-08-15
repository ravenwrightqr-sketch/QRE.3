import type { AuthorBrainTruth, AuthorRenderedScene } from "@qre/contracts";
import { authorBrainUniversal } from "./authorBrainUniversal.js";

export type CinematicAuthorInput = AuthorBrainTruth;
export type AuthoredScene = AuthorRenderedScene;

function enabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function renderScenes(scenes: Array<{ text: string; kind?: string }>): AuthoredScene[] {
  return scenes.map((scene, index, all) => ({
    text: scene.text,
    kind: scene.kind ?? (index === 0 ? "hook" : index === all.length - 1 ? "payoff" : "line"),
    durationHintMs: Math.max(650, Math.min(2100, 720 + scene.text.split(/\s+/).length * 85)),
    transitionHint: index === 0 ? "none" : index === all.length - 1 ? "flash" : "fade",
  }));
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];

  const result = await authorBrainUniversal(input);
  return renderScenes(result.scenes);
}
