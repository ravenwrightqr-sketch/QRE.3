import { localModelGenerate } from "./localModelRuntime.js";

export type CinematicAuthorInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  sourceMoments: string[];
  facts: string[];
  memoryContext?: string[];
  creativeLearningContext?: string[];
  trajectory?: string[];
};

export type AuthoredScene = {
  text: string;
  kind?: string;
};

function enabled() {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[-*\d.\s]+/, "")
    .trim();
}

function parseScenes(text: string): AuthoredScene[] {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const scenes = Array.isArray(parsed) ? parsed : parsed?.scenes;
    if (!Array.isArray(scenes)) return [];
    return scenes
      .map((scene: any) => ({ text: cleanText(scene?.text), kind: cleanText(scene?.kind) || "development" }))
      .filter((scene: AuthoredScene) => scene.text.length > 0);
  } catch {
    const lines = cleaned
      .split(/\n+/)
      .map(cleanText)
      .filter(Boolean);
    return lines.slice(0, 8).map((text) => ({ text, kind: "development" }));
  }
}

function instructionOnly(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return /^(create|make|write|build|generate|turn|produce|give|tell|show)\b/.test(normalized)
    || /\b(create|make|write|generate)\s+(a|an|the)?\s*(video|story|experience|memory|movie)\b/.test(normalized);
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];

  const facts = [...new Set(input.facts.map(cleanText).filter(Boolean))].slice(0, 40);
  const sourceMoments = [...new Set(input.sourceMoments.map(cleanText).filter(Boolean))].slice(0, 24);
  const memory = [...new Set((input.memoryContext ?? []).map(cleanText).filter(Boolean))].slice(0, 20);
  const learning = [...new Set((input.creativeLearningContext ?? []).map(cleanText).filter(Boolean))].slice(0, 20);

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are the cinematic author for QRE.",
        "Your output is NOT a paragraph. Your output is a sequence of separate viewer-facing cinematic messages that will play one after another like a miniature movie.",
        "Create 4 to 8 scenes when the material supports it.",
        "Each scene must feel complete enough to stand alone, but the sequence must create progression: setup, movement, discovery/escalation, change, payoff.",
        "The original prompt is an instruction. NEVER put an instruction such as 'create a video', 'make it funny', or 'make a wedding memory cinematic' into a scene.",
        "Use supplied facts as the factual world. Do not invent concrete people, places, objects, rooms, weather, clothing, props, sensory details, dates, purchases, physical actions, or outcomes.",
        "Creativity comes from interpretation, implication, metaphor, personification, rhythm, contrast, escalation, understatement, callbacks, reversals, and earned payoff.",
        "A metaphor like 'the house surrendered' is allowed when it is clearly figurative. A new factual room, object, person, or event is not.",
        "Do not repeat the same subject at the start of every scene.",
        "Do not explain the joke or explain the meaning after the fact.",
        "Prefer sharp, specific, memorable lines over generic cinematic language.",
        "Do not mention AI, QRE, prompts, compilers, lenses, cognition, metadata, or your instructions.",
        "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"setup|movement|discovery|escalation|transformation|payoff\"}]}.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        prompt: input.prompt,
        lens: input.lens ?? "neutral",
        subject: input.subject ?? "",
        place: input.place ?? "",
        trajectory: input.trajectory ?? [],
        sourceMoments,
        facts,
        memoryContext: memory,
        learnedCreativePreferences: learning,
        importantRule: "The viewer should see a movie sequence, not the instruction that produced it.",
      }),
    },
  ], "json");

  const scenes = parseScenes(result.text)
    .filter((scene) => !instructionOnly(scene.text))
    .slice(0, 8);

  if (scenes.length < 3) return [];
  return scenes;
}
