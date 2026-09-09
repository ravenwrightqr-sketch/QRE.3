import { analyzeImageForKnowledge, type AiVisionFact } from "./aiProvider.js";
import { exactInventoryPrompt } from "./exactIntake.js";

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

  const name = typeof value?.name === "string" && value.name.trim()
    ? value.name.trim()
    : typeof value?.product === "string" && value.product.trim()
      ? value.product.trim()
      : fact.label.trim();
  if (!name) return null;

  const brand = typeof value?.brand === "string" && value.brand.trim() ? value.brand.trim() : undefined;
  const category = typeof value?.category === "string" && value.category.trim() ? value.category.trim() : fact.category || undefined;
  const description = typeof value?.description === "string" && value.description.trim() ? value.description.trim() : fact.notes;

  const attributes: CatalogVisionAttribute[] = [];
  if (value) {
    for (const [key, item] of Object.entries(value)) {
      if (["name", "brand", "category", "description", "placement", "labels"].includes(key)) continue;
      if (typeof item === "string" && item.trim()) {
        attributes.push({ key, value: item.trim().slice(0, 1000) });
      } else if (typeof item === "number" && Number.isFinite(item)) {
        attributes.push({ key, value: String(item) });
      }
    }

    const labels = Array.isArray(value.labels)
      ? value.labels.filter((item): item is string => typeof item === "string" && item.trim())
      : [];
    for (const label of labels) {
      attributes.push({ key: "label", value: label.trim().slice(0, 1000) });
    }

    if (value.placement && typeof value.placement === "object" && !Array.isArray(value.placement)) {
      for (const [key, item] of Object.entries(value.placement as Record<string, unknown>)) {
        if (typeof item === "string" && item.trim()) {
          attributes.push({ key: `placement.${key}`, value: item.trim().slice(0, 500) });
        }
      }
    }
  }

  const deduped = [...new Map(attributes.map((item) => [`${item.key}\u0000${item.value}`, item])).values()].slice(0, 64);

  return {
    name: name.slice(0, 240),
    brand: brand?.slice(0, 160),
    category: category?.slice(0, 160),
    description: description?.slice(0, 1000),
    attributes: deduped,
    confidence: Math.max(0, Math.min(1, fact.confidence)),
    notes: fact.notes?.slice(0, 1000),
  };
}

export async function analyzeImageForCatalog(imageDataUrl: string): Promise<CatalogVisionItem[]> {
  const facts = await analyzeImageForKnowledge(imageDataUrl, exactInventoryPrompt());
  return facts.map(fromFact).filter((item): item is CatalogVisionItem => Boolean(item)).slice(0, 250);
}
