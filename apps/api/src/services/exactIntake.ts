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
  printedText?: string;
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

function norm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "");
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
    printedText: text(value.printedText) || text(value.rawText),
    placement,
    confidence: Math.max(0, Math.min(1, number(value.confidence) ?? fact.confidence ?? 0)),
    notes: text(value.notes) || fact.notes,
  };
}

function sameCandidate(a: ExactVisualItem, b: ExactVisualItem): boolean {
  const brandA = norm(a.brand || "");
  const brandB = norm(b.brand || "");
  const nameA = norm(a.product || a.name);
  const nameB = norm(b.product || b.name);
  const modelA = norm(a.model || "");
  const modelB = norm(b.model || "");
  const flavorA = norm(a.flavor || "");
  const flavorB = norm(b.flavor || "");

  if (brandA && brandB && brandA !== brandB) return false;
  if (modelA && modelB && modelA === modelB) return true;
  if (nameA && nameB && nameA === nameB) return true;
  if (brandA && brandB && brandA === brandB && flavorA && flavorB && flavorA === flavorB) return true;
  return false;
}

function prefer(existing: string | undefined, incoming: string | undefined): string | undefined {
  if (!existing) return incoming;
  if (!incoming) return existing;
  return incoming.length > existing.length ? incoming : existing;
}

function mergeItems(existing: ExactVisualItem, incoming: ExactVisualItem): ExactVisualItem {
  const labels = [...new Set([...existing.labels, ...incoming.labels])].slice(0, 96);
  const placement = {
    section: prefer(existing.placement?.section, incoming.placement?.section),
    shelf: prefer(existing.placement?.shelf, incoming.placement?.shelf),
    row: prefer(existing.placement?.row, incoming.placement?.row),
    position: prefer(existing.placement?.position, incoming.placement?.position),
  };
  const hasPlacement = Object.values(placement).some(Boolean);
  return {
    name: prefer(existing.name, incoming.name) || existing.name,
    brand: prefer(existing.brand, incoming.brand),
    product: prefer(existing.product, incoming.product),
    flavor: prefer(existing.flavor, incoming.flavor),
    variant: prefer(existing.variant, incoming.variant),
    model: prefer(existing.model, incoming.model),
    size: prefer(existing.size, incoming.size),
    labels,
    category: prefer(existing.category, incoming.category),
    description: prefer(existing.description, incoming.description),
    printedText: prefer(existing.printedText, incoming.printedText),
    placement: hasPlacement ? placement : undefined,
    confidence: Math.max(existing.confidence, incoming.confidence),
    notes: prefer(existing.notes, incoming.notes),
  };
}

function mergeAll(items: ExactVisualItem[]): ExactVisualItem[] {
  const merged: ExactVisualItem[] = [];
  for (const item of items) {
    const index = merged.findIndex((candidate) => sameCandidate(candidate, item));
    if (index < 0) merged.push(item);
    else merged[index] = mergeItems(merged[index], item);
  }
  return merged;
}

export async function analyzeImageForExactInventory(imageDataUrl: string): Promise<ExactVisualItem[]> {
  const prompts = [
    "EXACT IDENTITY PASS: identify every distinct physical product/package. Read exact brand, product line, flavor, variant, model, size, SKU, puffs/count, strength/nicotine, and format. Preserve printed spelling. Never guess unreadable text.",
    "PACKAGE TEXT PASS: inspect the packaging text with maximum attention to tiny printed words. Transcribe every legible product label, especially flavor names, variant names, model names, SKU, puffs/count, nicotine/strength, size, and other identifying text. Keep exact spelling. Never fill unreadable text from brand knowledge.",
    "PRODUCT ATTRIBUTE PASS: inspect each package independently and extract all useful visible attributes and labels. Treat flavor and variant as critical fields. Also capture color, series, size, count, puffs, nicotine, strength, format, SKU, and other printed descriptors. Do not infer hidden specifications.",
    "PLACEMENT PASS: identify each distinct product/package and where it physically appears. Record section, shelf, row, and approximate left-to-right position only when supported by the image. Placement is separate from product identity. Do not turn shelves into products.",
  ];

  const passResults: AiVisionFact[][] = [];
  for (const prompt of prompts) {
    const facts = await analyzeImageForKnowledge(imageDataUrl, `${exactInventoryPrompt()} ${prompt}`);
    passResults.push(facts);
  }

  const items = passResults
    .flat()
    .map(parseFact)
    .filter((item): item is ExactVisualItem => Boolean(item));

  return mergeAll(items).slice(0, 500);
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
    "Return strict JSON array. Each object must have: name, brand, product, flavor, variant, model, size, labels, category, description, printedText, placement, confidence, notes.",
    "For placement, use an object with optional section, shelf, row, position.",
    "Confidence reflects evidence quality, especially text legibility and identity certainty.",
  ].join(" ");
}
