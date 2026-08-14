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
    return cleaned
      .split(/\n+/)
      .map(cleanText)
      .filter(Boolean)
      .slice(0, 10)
      .map((text) => ({ text, kind: "development" }));
  }
}

function isInstructionOnly(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return /^(create|make|write|build|generate|turn|produce|give|tell|show)\b/.test(normalized)
    || /\b(create|make|write|generate)\s+(a|an|the)?\s*(video|story|experience|memory|movie)\b/.test(normalized);
}

function isPromotionalBrief(prompt: string, lens?: string): boolean {
  const normalized = `${prompt} ${lens ?? ""}`.toLowerCase();
  return /\b(create|make|build|generate|produce|write|turn)\b/.test(normalized)
    && /\b(video|ad|commercial|promo|promotion|marketing|business|brand|grooming|restaurant|salon|service)\b/.test(normalized);
}

function modeInstructions(prompt: string, lens?: string): string[] {
  if (isPromotionalBrief(prompt, lens)) {
    return [
      "MODE: CREATIVE PROMOTIONAL CONCEPT.",
      "This request is asking you to invent a compelling presentation, not document a verified historical event.",
      "You MAY invent fictional scene actions, comedic situations, visual beats, metaphors, and narrative devices that communicate the service experience.",
      "Do NOT invent real business claims, certifications, prices, guarantees, named customers, reviews, locations, awards, turnaround times, medical claims, or other factual claims about the business.",
      "Make the concept feel like a real cinematic advertisement without pretending invented details are true business facts.",
      "Default to attention-first pacing and a compact traversal. Prefer roughly 20–40 seconds of material unless the supplied brief clearly asks for something longer.",
      "Find a memorable premise rather than simply saying what the business does.",
    ];
  }

  return [
    "MODE: GROUNDED MEMORY / EXPERIENCE.",
    "Treat supplied facts as the factual world.",
    "Do not invent concrete real-world claims, people, places, objects, events, dates, physical actions, or outcomes.",
    "Creativity may come from interpretation, metaphor, personification, rhythm, contrast, escalation, understatement, callbacks, reversals, and earned payoff.",
  ];
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];

  const facts = [...new Set(input.facts.map(cleanText).filter(Boolean))].slice(0, 40);
  const sourceMoments = [...new Set(input.sourceMoments.map(cleanText).filter(Boolean))].slice(0, 24);
  const memory = [...new Set((input.memoryContext ?? []).map(cleanText).filter(Boolean))].slice(0, 20);
  const learning = [...new Set((input.creativeLearningContext ?? []).map(cleanText).filter(Boolean))].slice(0, 20);
  const promotional = isPromotionalBrief(input.prompt, input.lens);

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's cinematic author.",
        "Your output is NOT a paragraph. Your output is a sequence of separate viewer-facing cinematic messages that play one after another like a miniature movie.",
        ...modeInstructions(input.prompt, input.lens),
        "The original prompt is an instruction. NEVER put an instruction such as 'create a video', 'make it funny', or 'make a wedding memory cinematic' into a scene.",
        "Do not mechanically paraphrase the user's request.",
        "Do not make every scene start with the subject's name.",
        "Every scene should change the viewer's state: reveal something, escalate something, reframe something, create anticipation, create contrast, or land a payoff.",
        "A good sequence should feel like it is moving somewhere, not like a list of facts.",
        "Prefer sharp, specific, memorable language over generic cinematic language.",
        "Do not mention AI, QRE, prompts, compilers, lenses, cognition, metadata, or your instructions.",
        promotional
          ? "For promotional concepts, sell the feeling and transformation of the service through a memorable fictionalized mini-story; do not claim invented facts about the real business."
          : "For grounded experiences, stay faithful to the supplied world while using creative language and structure.",
        "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|setup|movement|discovery|escalation|transformation|payoff\"}] }.",
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
        mode: promotional ? "promotional_concept" : "grounded_experience",
        goal: promotional
          ? "Create a compact attention-grabbing sequence that makes a customer want to experience the service."
          : "Create the next meaningful cinematic traversal from the supplied reality.",
      }),
    },
  ], "json");

  const scenes = parseScenes(result.text)
    .filter((scene) => !isInstructionOnly(scene.text))
    .slice(0, promotional ? 7 : 10);

  return scenes.length >= 3 ? scenes : [];
}
