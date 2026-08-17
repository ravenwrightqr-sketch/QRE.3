export type CreativeRealizationKind = "fact" | "interpretation";

export type CreativeRealization = {
  text: string;
  kind: CreativeRealizationKind;
  evidenceIds: string[];
  frame?: string;
  confidence: number;
};

export type CreativeRealizationInput = {
  text: string;
  evidenceIds: string[];
  frame?: string;
  confidence?: number;
};

/**
 * Universal authoring invariant:
 * a realization may reinterpret supplied reality, but may not introduce a
 * new concrete event. Evidence IDs are mandatory so the meaning remains
 * recoverable from source reality.
 */
export function validateCreativeRealization(
  input: CreativeRealizationInput,
): CreativeRealization | undefined {
  const text = input.text.trim().replace(/\s+/g, " ");
  const evidenceIds = [...new Set(input.evidenceIds.filter(Boolean))];
  if (!text || evidenceIds.length === 0) return undefined;

  return {
    text,
    kind: input.frame ? "interpretation" : "fact",
    evidenceIds,
    frame: input.frame,
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0.7)),
  };
}
