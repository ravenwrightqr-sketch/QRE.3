import { localModelGenerate } from "./localModelRuntime.js";

export type CatalogVisionAttribute = { key: string; value: string };
export type CatalogVisionItem = { name: string; brand?: string; category?: string; description?: string; attributes?: CatalogVisionAttribute[]; confidence: number; notes?: string };

function localEnabled() { return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true"; }
function clamp(v: unknown) { return Math.max(0, Math.min(1, typeof v === "number" && Number.isFinite(v) ? v : 0.6)); }
function parse(text: string): unknown[] { try { const v = JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()) as unknown; return Array.isArray(v) ? v : []; } catch { return []; } }
function normalize(items: unknown[]): CatalogVisionItem[] {
  return items.filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x)).map((item) => ({
    name: typeof item.name === "string" ? item.name.trim().slice(0,240) : "",
    brand: typeof item.brand === "string" ? item.brand.trim().slice(0,160) || undefined : undefined,
    category: typeof item.category === "string" ? item.category.trim().slice(0,160) || undefined : undefined,
    description: typeof item.description === "string" ? item.description.trim().slice(0,1000) || undefined : undefined,
    attributes: Array.isArray(item.attributes) ? item.attributes.filter((a): a is Record<string, unknown> => !!a && typeof a === "object" && !Array.isArray(a)).map((a) => ({ key: typeof a.key === "string" ? a.key.trim().slice(0,120) : "", value: typeof a.value === "string" ? a.value.trim().slice(0,1000) : "" })).filter((a) => a.key && a.value).slice(0,32) : [],
    confidence: clamp(item.confidence),
    notes: typeof item.notes === "string" ? item.notes.trim().slice(0,1000) || undefined : undefined,
  })).filter((x) => x.name).slice(0,250);
}

export async function analyzeImageForCatalog(imageDataUrl: string): Promise<CatalogVisionItem[]> {
  if (!localEnabled()) return [];
  const system = [
    "You are QRE's catalog reality extractor.",
    "Inspect the image and identify every distinct product, service, object, or other catalog-worthy entity that is visibly supported.",
    "Create ONE item object per distinct entity. Never collapse an entire shelf, display, receipt, or photo into one generic fact.",
    "For each item, use a readable name and preserve the visible brand when present.",
    "Infer category only when reasonably clear; lower confidence when inferred.",
    "Extract useful arbitrary attributes such as flavor, size, pack, material, color, finish, model, type, style, or other visible labels.",
    "Do not invent hidden specifications, exact model numbers, dates, prices, quantities, or facts not visible in the image.",
    "Do not merge distinct visible products merely because they share a brand or category.",
    "Return strict JSON array: [{name, brand?, category?, description?, attributes:[{key,value}], confidence, notes?}].",
  ].join(" ");
  const result = await localModelGenerate([
    { role: "system", content: system },
    { role: "user", content: "Build the durable catalog entities from this image.", images: [imageDataUrl] },
  ], "json");
  return normalize(parse(result.text));
}
