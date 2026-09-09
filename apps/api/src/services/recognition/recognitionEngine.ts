import { randomUUID } from "node:crypto";
import type {
  RecognitionBrief,
  RecognitionCandidate,
  RecognitionEvidence,
  RecognitionObservation,
  RecognitionResult,
} from "@qre/contracts";
import { localModelGenerate } from "../localModelRuntime.js";
import { buildRecognitionPrompt } from "./recognitionPrompt.js";
import { reconcileRecognitionResult } from "./recognitionReconciler.js";

function jsonFromText<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)) as T; } catch { return null; }
    }
    return null;
  }
}

function clamp(value: unknown, fallback = 0): number {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(1, number));
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function candidate(value: unknown): RecognitionCandidate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const rawEvidence = Array.isArray(record.evidence) ? record.evidence : [];
  const evidence: RecognitionEvidence[] = rawEvidence.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const evidenceRecord = item as Record<string, unknown>;
    const kind = text(evidenceRecord.kind);
    const allowed = new Set(["printed_text", "logo", "shape", "package", "position", "catalog_match", "provided_context", "unknown"]);
    if (!kind || !allowed.has(kind)) return [];
    return [{
      kind: kind as RecognitionEvidence["kind"],
      value: text(evidenceRecord.value),
      confidence: clamp(evidenceRecord.confidence),
      source: text(evidenceRecord.source),
    }];
  }).slice(0, 64);
  const rawState = text(record.state);
  const states = new Set(["matched", "new", "ambiguous", "unreadable", "rejected"]);
  const state = rawState && states.has(rawState) ? rawState as RecognitionCandidate["state"] : "ambiguous";
  return {
    state,
    name: text(record.name),
    brand: text(record.brand),
    product: text(record.product),
    variant: text(record.variant),
    category: text(record.category),
    attributes: record.attributes && typeof record.attributes === "object" && !Array.isArray(record.attributes)
      ? Object.fromEntries(Object.entries(record.attributes).filter(([, value]) => typeof value === "string" && value.trim()).map(([key, value]) => [key, String(value).trim().slice(0, 1000)]))
      : undefined,
    evidence,
    confidence: clamp(record.confidence),
  };
}

function observation(value: unknown): RecognitionObservation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const parsedCandidate = candidate(record.candidate);
  if (!parsedCandidate) return null;
  const rawLocation = record.location;
  const location = rawLocation && typeof rawLocation === "object" && !Array.isArray(rawLocation)
    ? {
        section: text((rawLocation as Record<string, unknown>).section),
        shelf: text((rawLocation as Record<string, unknown>).shelf),
        row: text((rawLocation as Record<string, unknown>).row),
        position: text((rawLocation as Record<string, unknown>).position),
      }
    : undefined;
  return {
    observationId: text(record.observationId) || randomUUID(),
    candidate: parsedCandidate,
    location,
    sourceId: text(record.sourceId),
  };
}

export async function recognizeImage(input: {
  imageDataUrl: string;
  brief: RecognitionBrief;
}): Promise<RecognitionResult> {
  const fallback: RecognitionResult = {
    purpose: input.brief.purpose,
    observations: [],
    warnings: ["Visual recognition is unavailable because the local model is disabled."],
  };
  if (process.env.QRE_AI_ENABLED !== "true" || process.env.QRE_EXTERNAL_AI_ENABLED === "true") return fallback;

  const result = await localModelGenerate([
    {
      role: "system",
      content: buildRecognitionPrompt(input.brief),
    },
    {
      role: "user",
      content: "Inspect this image using the recognition brief. Return only the requested JSON.",
      images: [input.imageDataUrl],
    },
  ], "json", { numPredict: 2400, temperature: 0.1 });

  const parsed = jsonFromText<{ observations?: unknown[]; warnings?: unknown[] }>(result.text);
  if (!parsed) return { ...fallback, model: { provider: result.provider, model: result.model }, warnings: ["Recognition model returned unreadable JSON."] };

  const observations = (Array.isArray(parsed.observations) ? parsed.observations : [])
    .map(observation)
    .filter((value): value is RecognitionObservation => Boolean(value));
  const warnings = (Array.isArray(parsed.warnings) ? parsed.warnings : [])
    .filter((value): value is string => typeof value === "string" && value.trim())
    .map((value) => value.trim());

  return reconcileRecognitionResult({
    purpose: input.brief.purpose,
    observations,
    warnings,
    model: { provider: result.provider, model: result.model },
  });
}
