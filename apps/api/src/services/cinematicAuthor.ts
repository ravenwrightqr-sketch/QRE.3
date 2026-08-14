import { localModelGenerate } from "./localModelRuntime.js";

export type CinematicAuthorInput = {
  prompt: string;
  lens?: string;
  sourceMoments: string[];
  facts: string[];
  memoryContext?: string[];
  creativeLearningContext?: string[];
  trajectory?: string[];
  subject?: string;
  place?: string;
};

export type CinematicAuthorScene = {
  text: string;
  kind?: "intro" | "setup" | "development" | "discovery" | "escalation" | "turn" | "payoff" | "memory" | "ending";
};

function enabled() {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function cleanSceneText(value: unknown): string {
  return String(value ?? "")
    .replace(/^\s*(?:scene\s*\d+\s*[:.-]?|[-•*])\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function parseScenes(text: string): CinematicAuthorScene[] {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { scenes?: unknown };
    if (!Array.isArray(parsed?.scenes)) return [];
    return parsed.scenes
      .map((scene: any) => ({
        text: cleanSceneText(scene?.text),
        kind: typeof scene?.kind === "string" ? scene.kind : undefined,
      }))
      .filter((scene) => scene.text.length >= 4)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<CinematicAuthorScene[]> {
  if (!enabled()) return [];

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's cinematic author.",
        "Your output becomes the exact sequence of viewer-facing scene messages in a short cinematic experience.",
        "The user must feel a sequence unfolding, not a paragraph and not a report.",
        "Create 4 to 8 distinct scenes. Each scene should be a purposeful beat that changes, reveals, escalates, reframes, or pays off something.",
        "When sourceMoments contains multiple lines, preserve their order and treat them as separate sequence intentions. You may strengthen their wording and add connective cinematic beats, but do not flatten them into one paragraph.",
        "When the prompt is a creative instruction with sparse or no factual details, treat it as a creative brief and invent a clearly generalized/fictional cinematic concept without pretending invented specifics are real customer facts.",
        "When concrete facts are supplied, preserve them. Do not invent specific people, places, dates, purchases, props, rooms, weather, physical events, or other concrete real-world facts unless supported by the source.",
        "You may invent figurative language, metaphor, personification, rhythm, implication, tension, comic framing, romance, suspense, transformation, and other non-literal creative treatment.",
        "Do not echo the instruction itself. Never output phrases such as 'create a video', 'make it funny', 'make it cinematic', 'the prompt says', or technical wording.",
        "Do not mention AI, QRE, compilers, cognition, metadata, lenses, scene numbers, or internal reasoning.",
        "Avoid generic cinematic filler such as moonlight, soft glow, ethereal, magical journey, beautiful moment, or stock inspirational language unless the source specifically calls for it.",
        "Prefer short, memorable, spoken-on-screen lines. Vary sentence openings. Use the strongest detail early and earn the ending.",
        "For comedy, favor situation-specific irony and escalation. For horror, withhold and escalate. For romance, use restraint and implication. For service stories, make the ordinary task feel consequential. For memory, make recurrence or a small detail matter.",
        "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"setup|development|discovery|escalation|turn|payoff|memory|ending\"}]}.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        prompt: input.prompt,
        lens: input.lens ?? "neutral",
        subject: input.subject ?? "",
        place: input.place ?? "",
        sourceMoments: input.sourceMoments,
        facts: input.facts,
        memoryContext: input.memoryContext ?? [],
        learnedCreativePreferences: input.creativeLearningContext ?? [],
        trajectory: input.trajectory ?? [],
      }),
    },
  ], "json");

  return parseScenes(result.text);
}
