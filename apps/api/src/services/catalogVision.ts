import { analyzeImageForKnowledge, type AiVisionFact } from "./aiProvider.js";

export type CatalogVisionAttribute = { key: string; value: string };
export type CatalogVisionItem = {
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  attributes?: CatalogVisionAttribute[];
  confidence: number;
  notes?: string;
};

function fromFact(fact: AiVisionFact): CatalogVisionItem | null {
  let value: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(fact.value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) value = parsed as Record<string, unknown>;
  } catch {
    value = null;
  }

  const name = typeof value?.name === "string" && value.name.trim() ? value.name.trim() : fact.label.trim();
  if (!name) return null;

  const brand = typeof value?.brand === "string" && value.brand.trim() ? value.brand.trim() : undefined;
  const category = typeof value?.category === "string" && value.category.trim() ? value.category.trim() : fact.category || undefined;
  const description = typeof value?.description === "string" && value.description.trim() ? value.description.trim() : fact.notes;
  const attributes = value
    ? Object.entries(value)
        .filter(([key, item]) => !["name", "brand", "category", "description"].includes(key) && typeof item === "string" && item.trim())
        .map(([key, item]) => ({ key, value: String(item).trim().slice(0, 1000) }))
        .slice(0, 32)
    : [];

  return {
    name: name.slice(0, 240),
    brand: brand?.slice(0, 160),
    category: category?.slice(0, 160),
    description: description?.slice(0, 1000),
    attributes,
    confidence: Math.max(0, Math.min(1, fact.confidence)),
    notes: fact.notes?.slice(0, 1000),
  };
}

export async function analyzeImageForCatalog(imageDataUrl: string): Promise<CatalogVisionItem[]> {
  const facts = await analyzeImageForKnowledge(imageDataUrl);
  return facts.map(fromFact).filter((item): item is CatalogVisionItem => Boolean(item)).slice(0, 250);
}
