import type { AuthorBrainTruth, AuthorCreativeBrief, AuthorRenderedScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { authorBrain } from "./authorBrain.js";

export type CinematicAuthorInput = AuthorBrainTruth;
export type AuthoredScene = AuthorRenderedScene;

type Critique = {
  score?: number;
  problems?: string[];
  repeats?: string[];
  unsupportedDetails?: string[];
  weakScenes?: number[];
  genericLanguage?: string[];
};

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const parseJson = <T>(text: string): T | null => {
  const value = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(value) as T; } catch { return null; }
};

function enabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function beatCount(prompt: string): number {
  return /living memory|chapter/i.test(prompt) ? 4 : 5;
}

function renderScenes(scenes: AuthorRenderedScene[]): AuthoredScene[] {
  return scenes.map((scene, index, all) => ({
    ...scene,
    kind: scene.kind ?? (index === 0 ? "hook" : index === all.length - 1 ? "payoff" : "line"),
    durationHintMs: scene.durationHintMs ?? Math.max(650, Math.min(2100, 720 + scene.text.split(/\s+/).length * 85)),
    transitionHint: scene.transitionHint ?? (index === 0 ? "none" : index === all.length - 1 ? "flash" : "fade"),
  }));
}

async function critiqueSequence(input: CinematicAuthorInput, brief: AuthorCreativeBrief, scenes: AuthorRenderedScene[]): Promise<Critique | null> {
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's ruthless creative editor.",
          "Judge the sequence as rapid attention cuts rather than prose.",
          "Ask whether the subject is the star, whether the lines belong to one movie, whether each line creates wanting for the next, whether the sequence discovers something rather than paraphrasing facts, and whether the ending lands.",
          "Reject invented concrete events, unsupported identity, provider-as-protagonist, generic emotional arcs, comma-packed multi-shot lines, AI cheese, and generic endings.",
          "Do not demand a specific beat formula. The author is allowed to surprise you.",
          "Return JSON: {score,problems,repeats,unsupportedDetails,weakScenes,genericLanguage}.",
        ].join(" "),
      },
      { role: "user", content: JSON.stringify({ input, brief, scenes }) },
    ], "json");
    return parseJson<Critique>(result.text);
  } catch {
    return null;
  }
}

async function repairSequence(input: CinematicAuthorInput, brief: AuthorCreativeBrief, scenes: AuthorRenderedScene[], critique: Critique): Promise<AuthorRenderedScene[]> {
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's senior repair author.",
          "Preserve the strongest idea already present. Replace only weak cuts.",
          "Do not restart into a generic emotional journey. Do not change the movie merely to make it prettier.",
          "The subject remains the star. Service or business remains the stage unless explicitly established as a character.",
          "One line equals one attention moment. No commas or semicolons in scene text. Short lines are welcome when they carry a strong idea. Longer lines are allowed when they earn their length.",
          "Do not invent identity, people, relationships, provider actions, dialogue, locations, object placement, physical events, timestamps, weather, or outcomes.",
          "Metaphor and perspective are allowed when they reinterpret supplied reality without creating a new factual event.",
          "Return JSON only: {scenes:[{text,kind}]}.",
          `CREATIVE BRIEF: ${JSON.stringify(brief)}`,
          `CRITIQUE: ${JSON.stringify(critique)}`,
        ].join(" "),
      },
      { role: "user", content: JSON.stringify({ input, scenes }) },
    ], "json");
    const parsed = parseJson<{ scenes?: AuthorRenderedScene[] }>(result.text);
    return Array.isArray(parsed?.scenes) ? parsed!.scenes! : [];
  } catch {
    return [];
  }
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];

  const target = beatCount(input.prompt);
  const brain = await authorBrain(input, { fast: process.env.QRE_AUTHOR_FAST === "true" });
  let scenes = renderScenes(brain.scenes);

  if (process.env.QRE_AUTHOR_FAST === "true") return scenes;

  if (scenes.length !== target) {
    const repaired = await repairSequence(input, brain.brief, scenes, {
      score: 4,
      problems: [`expected ${target} cuts but received ${scenes.length}`],
      repeats: [],
      unsupportedDetails: [],
      weakScenes: [],
      genericLanguage: [],
    });
    if (repaired.length) scenes = renderScenes(repaired).slice(0, target);
  }

  if (scenes.length < 3) return scenes;

  const critique = await critiqueSequence(input, brain.brief, scenes);
  const needsRepair = Boolean(
    critique && (
      Number(critique.score ?? 10) < 8 ||
      critique.problems?.length ||
      critique.repeats?.length ||
      critique.unsupportedDetails?.length ||
      critique.weakScenes?.length ||
      critique.genericLanguage?.length
    ),
  );

  if (needsRepair) {
    const repaired = await repairSequence(input, brain.brief, scenes, critique!);
    if (repaired.length >= 3) scenes = renderScenes(repaired).slice(0, target);
  }

  return scenes;
}
