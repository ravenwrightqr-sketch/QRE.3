import { localModelGenerate } from "../localModelRuntime.js";
import type {
  RecognitionBrief,
  RecognitionCandidate,
  RecognitionEvidence,
  RecognitionObservation,
  RecognitionResult,
} from "@qre/contracts";
import { reconcileRecognitionResult } from "./recognitionReconciler.js";

function localEnabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function externalEnabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
}

function jsonFromText<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function boundedConfidence(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function evidence(value: unknown): RecognitionEvidence | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const kind = stringValue(record.kind);
  const confidence = boundedConfidence(record.confidence);
  if (!kind) return null;
  return {
    kind: kind as RecognitionEvidence["kind"],
    value: stringValue(record.value),
    confidence,
    source: stringValue(record.source),
  };
}

function candidate(value: unknown): RecognitionCandidate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const state = stringValue(record.state);
  if (!state) return null;
  const attributes = record.attributes && typeof record.attributes === "object" && !Array.isArray(record.attributes)
    ? Object.fromEntries(
        Object.entries(record.attributes)
          .filter(([, attributeValue]) => typeof attributeValue === "string" && attributeValue.trim())
          .map(([key, attributeValue]) => [key, String(attributeValue).trim()]),
      )
    : undefined;
  const evidenceItems = Array.isArray(record.evidence)
    ? record.evidence.map(evidence).filter((item): item is RecognitionEvidence => Boolean(item))
    : [];

  return {
    state: state as RecognitionCandidate["state"],
    name: stringValue(record.name),
    brand: stringValue(record.brand),
    product: stringValue(record.product),
    variant: stringValue(record.variant),
    category: stringValue(record.category),
    attributes,
    evidence: evidenceItems,
    confidence: boundedConfidence(record.confidence),
  };
}

function observation(value: unknown): RecognitionObservation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const observationId = stringValue(record.observationId);
  const candidateValue = candidate(record.candidate);
  if (!observationId || !candidateValue) return null;

  const rawLocation = record.location;
  const location = rawLocation && typeof rawLocation === "object" && !Array.isArray(rawLocation)
    ? (() => {
        const locationRecord = rawLocation as Record<string, unknown>;
        return {
          section: stringValue(locationRecord.section),
          shelf: stringValue(locationRecord.shelf),
          row: stringValue(locationRecord.row),
          position: stringValue(locationRecord.position),
          bbox: Array.isArray(locationRecord.bbox) && locationRecord.bbox.length === 4
            ? [
                Number(locationRecord.bbox[0]),
                Number(locationRecord.bbox[1]),
                Number(locationRecord.bbox[2]),
                Number(locationRecord.bbox[3]),
              ] as [number, number, number, number]
            : undefined,
        };
      })()
    : undefined;

  return {
    observationId,
    candidate: candidateValue,
    location,
    sourceId: stringValue(record.sourceId),
  };
}

function fallback(brief: RecognitionBrief): RecognitionResult {
  return {
    purpose: brief.purpose,
    observations: [],
    warnings: ["Recognition model is unavailable."],
  };
}

function promptFor(brief: RecognitionBrief): string {
  return [
    "QRE UNIVERSAL VISUAL RECOGNITION.",
    `PURPOSE: ${brief.purpose}`,
    `TASK: ${brief.task}`,
    brief.businessName ? `BUSINESS NAME: ${brief.businessName}` : "",
    brief.businessType ? `BUSINESS TYPE: ${brief.businessType}` : "",
    "Use the business context to narrow recognition, but never manufacture evidence.",
    "Known entities are candidates, not truth. Match them only when visible evidence supports the match.",
    "Visible printed text has priority over visual resemblance.",
    "If an item is not supported strongly enough, return an ambiguous or unreadable candidate rather than guessing.",
    brief.allowNewEntities ? "New entities are allowed when the image supports an item not present in the known entities." : "Do not create new entities; unresolved items must remain unresolved.",
    brief.allowOpenWorld ? "Open-world discovery is allowed, but unsupported specifics must remain unknown." : "Stay within the supplied business world whenever possible.",
    "Do not treat shelves, rows, signs, or scenes as products unless the task explicitly asks for them.",
    "Return strict JSON with keys observations and warnings.",
    "Each observation must contain observationId, candidate, and optional location/sourceId.",
    "Each candidate must contain state, evidence, confidence, and any supported name/brand/product/variant/category/attributes.",
    "Evidence kinds should describe actual support such as printed_text, logo, shape, package, position, catalog_match, provided_context, or unknown.",
    JSON.stringify({ knownVocabulary: brief.knownVocabulary ?? {}, knownEntities: brief.knownEntities ?? [] }),
  ].filter(Boolean).join(" ");
}

export async function recognizeImage(input: { imageDataUrl: string; brief: RecognitionBrief }): Promise<RecognitionResult> {
  const base = fallback(input.brief);
  if (!localEnabled() && !externalEnabled()) return base;

  if (localEnabled()) {
    const result = await localModelGenerate([
      { role: "system", content: promptFor(input.brief) },
      {
        role: "user",
        content: "Inspect the supplied image. Identify distinct visible objects and their evidence. Never infer unreadable text.",
        images: [input.imageDataUrl],
      },
    ], "json");
    const parsed = jsonFromText<{ observations?: unknown[]; warnings?: unknown[] }>(result.text);
    if (!parsed) {
      return {
        ...base,
        model: { provider: result.provider, model: result.model },
        warnings: ["Recognition model returned unreadable JSON."],
      };
    }

    const observations = (Array.isArray(parsed.observations) ? parsed.observations : [])
      .map(observation)
      .filter((value): value is RecognitionObservation => Boolean(value));
    const warnings = (Array.isArray(parsed.warnings) ? parsed.warnings : [])
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    return reconcileRecognitionResult({
      purpose: input.brief.purpose,
      observations,
      warnings,
      model: { provider: result.provider, model: result.model },
    });
  }

  return base;
}
