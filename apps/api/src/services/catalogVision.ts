import { analyzeImageForExactInventory } from "./exactIntake.js";

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

export async function analyzeImageForCatalog(imageDataUrl: string): Promise<CatalogVisionItem[]> {
  const items = await analyzeImageForExactInventory(imageDataUrl);
  return items.map((item) => {
    const attributes: CatalogVisionAttribute[] = [];
    const coreKeys = new Set(["brand", "product", "flavor", "variant", "model", "size", "category", "description", "printedText", "placement", "labels", "name", "notes", "confidence"]);

    for (const [key, value] of Object.entries(item)) {
      if (coreKeys.has(key) || value === undefined || value === null || value === "") continue;
      if (typeof value === "string" || typeof value === "number") attributes.push({ key, value: String(value).trim().slice(0, 1000) });
    }

    for (const label of item.labels ?? []) attributes.push({ key: "label", value: label.slice(0, 1000) });
    if (item.printedText) attributes.push({ key: "printed_text", value: item.printedText.slice(0, 4000) });
    if (item.placement) {
      for (const [key, value] of Object.entries(item.placement)) {
        if (value) attributes.push({ key: `placement.${key}`, value: String(value).trim().slice(0, 500) });
      }
    }

    const deduped = [...new Map(attributes.map((attribute) => [`${attribute.key}\u0000${attribute.value}`, attribute])).values()].slice(0, 96);
    return {
      name: item.name.slice(0, 240),
      brand: item.brand?.slice(0, 160),
      category: item.category?.slice(0, 160),
      description: item.description?.slice(0, 1000),
      attributes: deduped,
      confidence: Math.max(0, Math.min(1, item.confidence)),
      notes: item.notes?.slice(0, 1000),
    };
  }).slice(0, 500);
}
