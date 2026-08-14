import { localModelGenerate } from "./localModelRuntime.js";

export type AiAuthorInput = {
  prompt: string;
  lens?: string;
  sourceMoments: string[];
  facts: string[];
  memoryContext?: string[];
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

function externalEnabled(): boolean {
  return process.env.QRE_EXTERNAL_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
}

function model(): string {
  return process.env.QRE_AI_MODEL || "gpt-5";
}

async function externalResponsesApi(input: unknown) {
  if (!externalEnabled()) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: model(), input }),
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

const authorSystem = [
  "You are QRE's senior narrative author.",
  "Write memorable customer-facing experience prose from grounded source facts.",
  "Do not invent people, places, dates, objects, actions, purchases, feelings, or outcomes that are not supported by the supplied facts.",
  "Do not mention prompts, models, AI, compilers, metadata, lenses, instructions, or writing techniques.",
  "Preserve concrete facts exactly when they matter.",
  "Prefer specificity, rhythm, subtext, surprise, restraint, and a meaningful final turn over generic inspirational language.",
  "The output should read like a finished human-written passage, not a summary.",
].join(" ");

export async function generateAiExperienceDraft(input: AiAuthorInput): Promise<string | null> {
  const userText = JSON.stringify({
    prompt: input.prompt,
    requestedLens: input.lens ?? "neutral",
    audience: input.audience ?? "customer",
    sourceMoments: input.sourceMoments,
    facts: input.facts,
    memoryContext: input.memoryContext ?? [],
  });

  try {
    const local = await localModelGenerate([
      { role: "system", content: authorSystem },
      { role: "user", content: userText },
    ]);
    if (local.text) return local.text;
  } catch {
    // QRE deterministic cognition remains the offline fallback.
  }

  if (!externalEnabled()) return null;

  const data = await externalResponsesApi([
    { role: "system", content: [{ type: "input_text", text: authorSystem }] },
    { role: "user", content: [{ type: "input_text", text: userText }] },
  ]);
  const text = outputText(data);
  return text || null;
}

const visionSystem = [
  "You are QRE's visual knowledge extractor.",
  "Inspect the image and return only facts that are visibly supported or clearly readable.",
  "Do not hallucinate hidden specifications, exact model numbers, paint colors, serial numbers, or dates.",
  "Use lower confidence when a fact is inferred rather than directly visible.",
  "Return strict JSON array with objects: label, value, category, unit?, confidence, notes?.",
  "For text in the image, transcribe only text that is actually legible.",
].join(" ");

export async function analyzeImageForKnowledge(imageDataUrl: string, requestedCategory?: string): Promise<AiVisionFact[]> {
  const userText = requestedCategory ? `Preferred knowledge category: ${requestedCategory}` : "Determine the useful knowledge category automatically.";
  try {
    const local = await localModelGenerate([
      { role: "system", content: visionSystem },
      { role: "user", content: userText, images: [imageDataUrl] },
    ], "json");
    const parsed = jsonFromText<AiVisionFact[]>(local.text);
    if (Array.isArray(parsed)) return normalizeVisionFacts(parsed);
  } catch {
    // External provider is optional; deterministic knowledge capture remains available.
  }

  if (!externalEnabled()) return [];
  const data = await externalResponsesApi([
    { role: "system", content: [{ type: "input_text", text: visionSystem }] },
    {
      role: "user",
      content: [
        { type: "input_text", text: userText },
        { type: "input_image", image_url: imageDataUrl },
      ],
    },
  ]);
  const parsed = jsonFromText<AiVisionFact[]>(outputText(data));
  return Array.isArray(parsed) ? normalizeVisionFacts(parsed) : [];
}

function normalizeVisionFacts(parsed: AiVisionFact[]): AiVisionFact[] {
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
  return true;
}
