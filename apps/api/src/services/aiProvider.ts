import { localModelGenerate, localModelConfig } from "./localModelRuntime.js";

export type AiAuthorInput = {
  prompt: string;
  lens?: string;
  sourceMoments: string[];
  facts: string[];
  memoryContext?: string[];
  creativeLearningContext?: string[];
  audience?: string;
};

export type AiVisionFact = {
  label: string;
  value: string;
  category: string;
  unit?: string;
  confidence: number;
  notes?: string;
};

type CreativeBrief = {
  corePremise: string;
  emotionalEngine: string;
  strongestDetail: string;
  voice: string;
  endingMove: string;
  avoid: string[];
};

type DraftCritique = {
  strengths: string[];
  violations: string[];
  inventedClaims: string[];
  cliches: string[];
  weakLines: string[];
  revisionPlan: string[];
  score: number;
};

function localEnabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function externalEnabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
}

function model(): string {
  return process.env.QRE_LOCAL_MODEL || process.env.QRE_AI_MODEL || "qwen2.5vl:7b";
}

async function responsesApi(input: unknown) {
  if (!externalEnabled()) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: process.env.QRE_AI_MODEL || "gpt-5", input }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`External AI provider failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.json() as Promise<any>;
}

function outputText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text.trim();
  const parts = Array.isArray(data?.output)
    ? data.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
    : [];
  return parts.map((part: any) => typeof part?.text === "string" ? part.text : "").filter(Boolean).join("\n").trim();
}

function jsonFromText<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned) as T; } catch { return null; }
}

function normalizeProse(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .trim();
}

function authorSystem(): string {
  return [
    "You are QRE's senior narrative author and editor.",
    "Write finished customer-facing prose from grounded source facts.",
    "The source facts are the world truth. Never invent a person, place, brand, date, object, action, purchase, relationship, motive, physical setting, or outcome as if it were true.",
    "Do not turn a metaphor into a factual claim. Figurative language is allowed only when it is obviously figurative.",
    "Never mention prompts, models, AI, compilers, metadata, lenses, instructions, cognition, writing techniques, or internal reasoning.",
    "Do not mechanically restate the source sentence-by-sentence.",
    "Do not add generic filler, inspirational slogans, canned cinematic language, fake emotional conclusions, or stock internet humor.",
    "Prefer a concrete detail, a surprising implication, character-specific humor, precise emotional understatement, sensory consequence, or a clean turn over explanation.",
    "Use sentence length and openings deliberately. Avoid starting multiple sentences with the same subject when the prose can flow naturally without it.",
    "Trust the reader. Show the implication; do not explain the joke or announce the meaning.",
    "End on the strongest available beat. A final line may reframe an earlier detail, land a joke, reveal a realization, or leave a memorable image.",
    "Treat learned preferences as soft guidance, never as facts and never as permission to copy previous prose.",
    "Return only the prose requested by the caller.",
  ].join(" ");
}

function contextText(input: AiAuthorInput): string {
  return JSON.stringify({
    prompt: input.prompt,
    requestedLens: input.lens ?? "neutral",
    audience: input.audience ?? "customer",
    sourceMoments: input.sourceMoments,
    facts: input.facts,
    memoryContext: input.memoryContext ?? [],
    learnedCreativePreferences: input.creativeLearningContext ?? [],
  });
}

async function localCreativeBrief(input: AiAuthorInput): Promise<CreativeBrief> {
  const fallback: CreativeBrief = {
    corePremise: input.prompt,
    emotionalEngine: input.lens ?? "natural observation",
    strongestDetail: input.facts[0] ?? input.sourceMoments[0] ?? "the central detail",
    voice: input.lens ?? "specific, restrained, memorable",
    endingMove: "pay off the strongest concrete detail without explaining it",
    avoid: ["invented facts", "cliches", "generic setup", "explaining the joke"],
  };
  if (!localEnabled()) return fallback;
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's creative director.",
        "Plan a piece of prose before the writer drafts it.",
        "Use only the supplied facts. Find the strongest concrete detail, the emotional or comic engine, a distinctive voice, and the best ending move.",
        "Learn from the supplied accepted/rejected preferences, but never copy them and never treat them as facts.",
        "Do not invent facts. Do not write the prose yet.",
        "Return strict JSON with keys: corePremise, emotionalEngine, strongestDetail, voice, endingMove, avoid.",
      ].join(" "),
    },
    { role: "user", content: contextText(input) },
  ], "json");
  return jsonFromText<CreativeBrief>(result.text) ?? fallback;
}

async function localDraft(input: AiAuthorInput, brief: CreativeBrief): Promise<string> {
  const result = await localModelGenerate([
    { role: "system", content: authorSystem() },
    {
      role: "user",
      content: JSON.stringify({
        task: "Write the first serious draft.",
        creativeBrief: brief,
        learnedCreativePreferences: input.creativeLearningContext ?? [],
        source: {
          prompt: input.prompt,
          lens: input.lens ?? "neutral",
          audience: input.audience ?? "customer",
          sourceMoments: input.sourceMoments,
          facts: input.facts,
          memoryContext: input.memoryContext ?? [],
        },
        target: "Prefer 2-6 purposeful sentences unless the source clearly benefits from a different length.",
      }),
    },
  ]);
  return normalizeProse(result.text);
}

async function localCritique(input: AiAuthorInput, brief: CreativeBrief, draft: string): Promise<DraftCritique> {
  const fallback: DraftCritique = {
    strengths: [],
    violations: [],
    inventedClaims: [],
    cliches: [],
    weakLines: [],
    revisionPlan: ["preserve explicit facts", "remove unsupported details", "strengthen the final beat"],
    score: 0,
  };
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's ruthless literary and factual editor.",
        "Inspect a draft against the supplied source facts and learned preferences.",
        "Reject hallucinated world details, generic cliches, explanatory humor, repeated sentence openings, weak abstractions, filler, and obvious template language.",
        "Identify the single strongest concrete detail and the strongest possible ending move.",
        "Do not reject figurative language merely because it is non-literal; reject it only when it asserts an unsupported factual event or becomes generic filler.",
        "Return strict JSON with keys: strengths, violations, inventedClaims, cliches, weakLines, revisionPlan, score.",
        "Do not rewrite the prose in this step.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        creativeBrief: brief,
        learnedCreativePreferences: input.creativeLearningContext ?? [],
        prompt: input.prompt,
        facts: input.facts,
        sourceMoments: input.sourceMoments,
        draft,
      }),
    },
  ], "json");
  return jsonFromText<DraftCritique>(result.text) ?? fallback;
}

async function localRevision(input: AiAuthorInput, brief: CreativeBrief, draft: string, critique: DraftCritique): Promise<string> {
  const result = await localModelGenerate([
    { role: "system", content: authorSystem() },
    {
      role: "user",
      content: JSON.stringify({
        task: "Rewrite the draft into the final version. Do not discuss the critique.",
        rules: [
          "Keep every explicit source fact that is important to the experience.",
          "Remove every invented factual claim called out by the editor.",
          "Do not replace bad writing with generic adjectives or stock phrases.",
          "Use the strongest concrete detail as an anchor.",
          "Vary sentence openings and rhythm.",
          "Let humor or emotion emerge from the situation instead of explaining it.",
          "Make the final sentence earn its place.",
          "Use learned preferences as guidance about taste, not as material to copy.",
        ],
        creativeBrief: brief,
        learnedCreativePreferences: input.creativeLearningContext ?? [],
        facts: input.facts,
        sourceMoments: input.sourceMoments,
        draft,
        critique,
      }),
    },
  ]);
  return normalizeProse(result.text);
}

async function localPolish(input: AiAuthorInput, draft: string): Promise<string> {
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's final copy editor.",
        "Perform a surgical polish only.",
        "Preserve meaning and facts.",
        "Remove awkward wording, accidental repetition, generic filler, fake certainty, and explanatory endings.",
        "Keep distinctive lines that work.",
        "Never add new facts.",
        "Return only the finished prose.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        learnedCreativePreferences: input.creativeLearningContext ?? [],
        facts: input.facts,
        sourceMoments: input.sourceMoments,
        draft,
      }),
    },
  ]);
  return normalizeProse(result.text);
}

export async function generateAiExperienceDraft(input: AiAuthorInput): Promise<string | null> {
  if (!localEnabled() && !externalEnabled()) return null;
  if (localEnabled()) {
    const brief = await localCreativeBrief(input);
    const draft = await localDraft(input, brief);
    if (!draft) return null;
    const critique = await localCritique(input, brief, draft);
    const revised = await localRevision(input, brief, draft, critique);
    if (!revised) return draft;
    const polished = await localPolish(input, revised);
    return polished || revised || draft;
  }

  const userText = JSON.stringify({
    task: "Write the final customer-facing experience passage.",
    prompt: input.prompt,
    requestedLens: input.lens ?? "neutral",
    audience: input.audience ?? "customer",
    sourceMoments: input.sourceMoments,
    facts: input.facts,
    memoryContext: input.memoryContext ?? [],
    learnedCreativePreferences: input.creativeLearningContext ?? [],
  });
  const data = await responsesApi([
    { role: "system", content: [{ type: "input_text", text: authorSystem() }] },
    { role: "user", content: [{ type: "input_text", text: userText }] },
  ]);
  return outputText(data) || null;
}

export async function analyzeImageForKnowledge(imageDataUrl: string, requestedCategory?: string): Promise<AiVisionFact[]> {
  if (!localEnabled() && !externalEnabled()) return [];
  const system = [
    "You are QRE's visual knowledge extractor.",
    "Inspect the image and return only facts that are visibly supported or clearly readable.",
    "Do not hallucinate hidden specifications, exact model numbers, paint colors, serial numbers, or dates.",
    "Use lower confidence when a fact is inferred rather than directly visible.",
    "Return strict JSON array with objects: label, value, category, unit?, confidence, notes?.",
    "For text in the image, transcribe only text that is actually legible.",
  ].join(" ");
  const userText = requestedCategory
    ? `Preferred knowledge category: ${requestedCategory}`
    : "Determine the useful knowledge category automatically.";

  if (localEnabled()) {
    const result = await localModelGenerate([
      { role: "system", content: system },
      { role: "user", content: userText, images: [imageDataUrl] },
    ], "json");
    const parsed = jsonFromText<AiVisionFact[]>(result.text);
    return normalizeFacts(parsed);
  }

  const data = await responsesApi([
    { role: "system", content: [{ type: "input_text", text: system }] },
    {
      role: "user",
      content: [
        { type: "input_text", text: userText },
        { type: "input_image", image_url: imageDataUrl },
      ],
    },
  ]);
  return normalizeFacts(jsonFromText<AiVisionFact[]>(outputText(data)));
}

function normalizeFacts(parsed: AiVisionFact[] | null): AiVisionFact[] {
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((fact) => fact && typeof fact.label === "string" && typeof fact.value === "string")
    .map((fact) => ({
      label: fact.label.trim(),
      value: fact.value.trim(),
      category: typeof fact.category === "string" && fact.category.trim() ? fact.category.trim() : "general",
      unit: typeof fact.unit === "string" && fact.unit.trim() ? fact.unit.trim() : undefined,
      confidence: Math.max(0, Math.min(1, Number(fact.confidence) || 0)),
      notes: typeof fact.notes === "string" && fact.notes.trim() ? fact.notes.trim() : undefined,
    }))
    .filter((fact) => fact.label && fact.value);
}

export function aiConfigured(): boolean {
  return localEnabled() || externalEnabled();
}

export function aiProviderName(): "local" | "openai" | null {
  if (localEnabled()) return "local";
  if (externalEnabled()) return "openai";
  return null;
}

export function aiProviderConfig() {
  if (localEnabled()) return localModelConfig();
  return { provider: "openai" as const, model: process.env.QRE_AI_MODEL || "gpt-5" };
}
