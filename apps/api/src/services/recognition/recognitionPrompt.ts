import type { RecognitionBrief } from "@qre/contracts";

function list(values: string[] | undefined): string {
  return values?.length ? values.join(", ") : "(none supplied)";
}

export function buildRecognitionPrompt(brief: RecognitionBrief): string {
  const entities = (brief.knownEntities ?? []).slice(0, 200).map((entity) => ({
    id: entity.id,
    name: entity.name,
    brand: entity.brand,
    category: entity.category,
    attributes: entity.attributes,
  }));

  return [
    "QRE VISUAL RECOGNITION MODE.",
    `Business: ${brief.businessName || "unknown"}.`,
    `Business type: ${brief.businessType || "unknown"}.`,
    `Purpose: ${brief.purpose}.`,
    `Task: ${brief.task}`,
    "The image is evidence, not truth by itself. Extract what is visibly supported.",
    "Use the supplied business vocabulary as recognition context. Prefer a known entity when the visible evidence supports it, but never force a match.",
    "An unknown item may remain new or ambiguous. Never invent a product name, brand, flavor, model, SKU, size, or specification from general world knowledge.",
    "Legible printed text is stronger evidence than visual resemblance. Exact spelling matters.",
    "A shelf, row, fixture, sign, or background is not a product unless the task explicitly asks for it.",
    "Separate visible evidence from candidate identity. A candidate can be ambiguous or unreadable.",
    "Return strict JSON with this shape:",
    JSON.stringify({
      observations: [{
        observationId: "temporary-id",
        candidate: {
          state: "matched | new | ambiguous | unreadable | rejected",
          name: "visible or supported name",
          brand: "visible or supported brand",
          product: "visible or supported product",
          variant: "visible or supported variant",
          category: "supported category",
          attributes: { example: "value" },
          evidence: [{ kind: "printed_text | logo | shape | package | position | catalog_match | provided_context | unknown", value: "evidence", confidence: 0.0, source: "image" }],
          confidence: 0.0,
        },
        location: { section: "", shelf: "", row: "", position: "" },
        sourceId: "image",
      }],
      warnings: [],
    }),
    "Known brands:", list(brief.knownVocabulary?.brands),
    "Known products:", list(brief.knownVocabulary?.products),
    "Known variants:", list(brief.knownVocabulary?.variants),
    "Known categories:", list(brief.knownVocabulary?.categories),
    "Known attributes:", list(brief.knownVocabulary?.attributes),
    "Known entities:", JSON.stringify(entities),
  ].join("\n");
}
