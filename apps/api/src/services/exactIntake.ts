import { analyzeImageForKnowledge, type AiVisionFact } from "./aiProvider.js";

type ExactVisualItem = {
  name: string;
  brand?: string;
  product?: string;
  flavor?: string;
  variant?: string;
  model?: string;
  size?: string;
  labels: string[];
  category?: string;
  description?: string;
  placement?: {
    section?: string;
    shelf?: string;
    row?: string;
    position?: string;
  };
  confidence: number;
  notes?: string;
};

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseFact(fact: AiVisionFact): ExactVisualItem | null {
  let value: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(fact.value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) value = parsed as Record<string, unknown>;
  } catch {
    value = { name: fact.label, raw: fact.value };
  }

  const name = text(value.name) || text(value.product) || text(value.title) || text(value.label) || text(fact.label);
  if (!name) return null;

  const labels = [
    ...(Array.isArray(value.labels) ? value.labels.filter((v): v is string => typeof v === "string") : []),
    ...["flavor", "variant", "size", "model", "sku", "color", "nicotine", "puffs", "format", "strain", "strength", "series"].flatMap((key) => {
      const v = text(value[key]);
      return v ? [v] : [];
    }),
  ].map((v) => v.trim()).filter(Boolean).slice(0, 64);

  const placement = value.placement && typeof value.placement === "object" && !Array.isArray(value.placement)
    ? {
        section: text((value.placement as Record<string, unknown>).section),
        shelf: text((value.placement as Record<string, unknown>).shelf),
        row: text((value.placement as Record<string, unknown>).row),
        position: text((value.placement as Record<string, unknown>).position),
      }
    : undefined;

  return {
    name,
    brand: text(value.brand),
    product: text(value.product) || name,
    flavor: text(value.flavor),
    variant: text(value.variant),
    model: text(value.model),
    size: text(value.size),
    labels: [...new Set(labels)],
    category: text(value.category) || fact.category,
    description: text(value.description) || fact.notes,
    placement,
    confidence: Math.max(0, Math.min(1, number(value.confidence) ?? fact.confidence ?? 0)),
    notes: text(value.notes) || fact.notes,
  };
}

export async function analyzeImageForExactInventory(imageDataUrl: string): Promise<ExactVisualItem[]> {
  const facts = await analyzeImageForKnowledge(imageDataUrl, "exact product/inventory extraction");
  return facts.map(parseFact).filter((item): item is ExactVisualItem => Boolean(item));
}

export function exactInventoryPrompt(): string {
  return [
    "QRE EXACT INVENTORY MODE.",
    "This is an inventory reconstruction task, not a scene description task.",
    "Identify each distinct physical product/package visible in the supplied image.",
    "Return one object per product, not one object per shelf, row, or scene.",
    "Read the PACKAGE LABELS. Capture every legible product identity detail: exact brand, exact product name, exact flavor, exact variant, exact model, exact size, exact SKU, exact puffs/count/strength/nicotine/format when visible, and any other printed product label.",
    "Preserve spelling exactly as printed when legible. Do not normalize or creatively rewrite product names.",
    "If tiny text is unreadable, set that field to null. NEVER guess a flavor, variant, model, or SKU.",
    "Use labels as first-class data. Put useful product descriptors into labels as well as their specific fields when appropriate.",
    "Placement is separate from identity. Record section, shelf, row, and approximate left-to-right position only when the image supports it.",
    "A shelf is not a product identity. Do not return shelves as inventory items.",
    "A visible package can be an exact product only when enough evidence supports it; otherwise return it as an unresolved candidate with the readable text and low confidence.",
    "Do not invent specifications from brand knowledge. Only record what is visible or explicitly readable.",
    "Return strict JSON array. Each object must have: name, brand, product, flavor, variant, model, size, labels, category, description, placement, confidence, notes.",
    "For placement, use an object with optional section, shelf, row, position.",
    "Confidence reflects evidence quality, especially text legibility and identity certainty.",
  ].join(" ");
}
