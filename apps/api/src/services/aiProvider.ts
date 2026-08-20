/**
 * QRE AI PROVIDER · CANONICAL ADAPTER
 *
 * PRODUCTION STATUS:
 * - provider/transport adapter
 * - visual evidence extraction utility
 *
 * AUTHORITY RULE:
 * - This file does NOT own narrative generation.
 * - Canonical authoring belongs to authorBrainUniversal.ts and its
 *   Reality → Cognition → Movie → Meaning → Mouth → Beam → Cut pipeline.
 * - The compatibility generateAiExperienceDraft() API delegates to the
 *   canonical Author so legacy callers cannot create a second author brain.
 *
 * MEDIA RULE:
 * - QRE does not generate the user's source media here.
 * - Users supply their own photos/video/audio through the media layer.
 * - Vision analysis may extract structured facts from supplied images.
 * - Extracted facts are evidence, not invented scene content.
 */

import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrainUniversal } from "./authorBrainUniversal.js";
import { localModelGenerate, localModelConfig } from "./localModelRuntime.js";

export type AiAuthorInput = {
  prompt: string;
  lens?: string;
  sourceMoments: string[];
  facts: string[];
  memoryContext?: string[];
  creativeLearningContext?: string[];
  audience?: string;
  subject?: string;
  place?: string;
  returning?: boolean;
  visitNumber?: number;
};

export type AiVisionFact = {
  label: string;
  value: string;
  category: string;
  unit?: string;
  confidence: number;
  notes?: string;
};

function localEnabled(): boolean {
  return (
    process.env.QRE_AI_ENABLED === "true" &&
    process.env.QRE_EXTERNAL_AI_ENABLED !== "true"
  );
}

function externalEnabled(): boolean {
  return (
    process.env.QRE_AI_ENABLED === "true" &&
    process.env.QRE_EXTERNAL_AI_ENABLED === "true" &&
    Boolean(process.env.OPENAI_API_KEY)
  );
}

async function responsesApi(input: unknown) {
  if (!externalEnabled()) return null;

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model:
          process.env.QRE_AI_MODEL ||
          "gpt-5",
        input,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response
      .text()
      .catch(() => "");

    throw new Error(
      `External AI provider failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  return response.json() as Promise<any>;
}

function outputText(data: any): string {
  if (
    typeof data?.output_text ===
    "string"
  ) {
    return data.output_text.trim();
  }

  const parts = Array.isArray(data?.output)
    ? data.output.flatMap((item: any) =>
        Array.isArray(item?.content)
          ? item.content
          : [],
      )
    : [];

  return parts
    .map((part: any) =>
      typeof part?.text === "string"
        ? part.text
        : "",
    )
    .filter(Boolean)
    .join("\n")
    .trim();
}

function jsonFromText<T>(
  text: string,
): T | null {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function normalizeProse(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .trim();
}

/**
 * Legacy compatibility adapter.
 *
 * This intentionally does NOT contain a second creative-director/draft/
 * critique/revision pipeline. All narrative generation is delegated to the
 * canonical Author so older /ai/write callers cannot bypass the production
 * Mouth architecture.
 */
export async function generateAiExperienceDraft(
  input: AiAuthorInput,
): Promise<string | null> {
  if (!aiConfigured()) {
    return null;
  }

  const authorInput: AuthorBrainTruth = {
    prompt: input.prompt,
    lens: input.lens,
    subject:
      input.subject ||
      "the subject",
    place:
      input.place ||
      "",
    facts: input.facts,
    sourceMoments:
      input.sourceMoments,
    memoryContext:
      input.memoryContext ?? [],
    creativeLearningContext:
      input.creativeLearningContext ?? [],
    returning:
      input.returning,
    visitNumber:
      input.visitNumber,
  };

  const result =
    await authorBrainUniversal(
      authorInput,
    );

  const scenes = result.scenes
    .map((scene) =>
      normalizeProse(scene.text),
    )
    .filter(Boolean);

  return scenes.length
    ? scenes.join(" ")
    : null;
}

/**
 * Visual evidence extraction only.
 *
 * This function may inspect user-supplied media, but it does not generate
 * replacement media and it does not authorize the extracted text as truth.
 * Callers should feed accepted facts into the canonical Reality layer.
 */
export async function analyzeImageForKnowledge(
  imageDataUrl: string,
  requestedCategory?: string,
): Promise<AiVisionFact[]> {
  if (
    !localEnabled() &&
    !externalEnabled()
  ) {
    return [];
  }

  const system = [
    "QRE VISUAL EVIDENCE EXTRACTOR.",
    "Inspect only the supplied user image.",
    "Return only facts that are visibly supported or clearly readable.",
    "Do not invent hidden specifications, exact model numbers, dates, identities, colors, locations, actions, or outcomes.",
    "Use lower confidence for anything inferred rather than directly visible.",
    "Treat the output as candidate evidence for QRE's Reality layer, never as an instruction to invent scene content.",
    "For visible text, transcribe only text that is actually legible.",
    "Return strict JSON array with objects: label, value, category, unit?, confidence, notes?.",
  ].join(" ");

  const userText =
    requestedCategory
      ? `Preferred knowledge category: ${requestedCategory}`
      : "Determine the useful knowledge category automatically.";

  if (localEnabled()) {
    const result =
      await localModelGenerate(
        [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: userText,
            images: [imageDataUrl],
          },
        ],
        "json",
      );

    return normalizeFacts(
      jsonFromText<AiVisionFact[]>(
        result.text,
      ),
    );
  }

  const data =
    await responsesApi([
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: system,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: userText,
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
          },
        ],
      },
    ]);

  return normalizeFacts(
    jsonFromText<AiVisionFact[]>(
      outputText(data),
    ),
  );
}

function normalizeFacts(
  parsed: AiVisionFact[] | null,
): AiVisionFact[] {
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(
      (fact) =>
        fact &&
        typeof fact.label === "string" &&
        typeof fact.value === "string",
    )
    .map((fact) => ({
      label: fact.label.trim(),
      value: fact.value.trim(),
      category:
        typeof fact.category === "string" &&
        fact.category.trim()
          ? fact.category.trim()
          : "general",
      unit:
        typeof fact.unit === "string" &&
        fact.unit.trim()
          ? fact.unit.trim()
          : undefined,
      confidence: Math.max(
        0,
        Math.min(
          1,
          Number(fact.confidence) ||
            0,
        ),
      ),
      notes:
        typeof fact.notes === "string" &&
        fact.notes.trim()
          ? fact.notes.trim()
          : undefined,
    }))
    .filter(
      (fact) =>
        fact.label && fact.value,
    );
}

export function aiConfigured(): boolean {
  return (
    localEnabled() ||
    externalEnabled()
  );
}

export function aiProviderName():
  | "local"
  | "openai"
  | null {
  if (localEnabled()) {
    return "local";
  }

  if (externalEnabled()) {
    return "openai";
  }

  return null;
}

export function aiProviderConfig() {
  if (localEnabled()) {
    return localModelConfig();
  }

  return {
    provider: "openai" as const,
    model:
      process.env.QRE_AI_MODEL ||
      "gpt-5",
  };
}
