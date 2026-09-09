import { localModelGenerate } from "./localModelRuntime.js";

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

function localEnabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}
function externalEnabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
}
function outputText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text.trim();
  const parts = Array.isArray(data?.output) ? data.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []) : [];
  return parts.map((part: any) => typeof part?.text === "string" ? part.text : "").filter(Boolean).join("\n").trim();
}
function parseJson(text: string): unknown[] {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { const parsed = JSON.parse(cleaned) as unknown; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function clamp(value: unknown): number {
  return Math.max(0, Math.min(1, typeof value === "number" && Number.isFinite(value) ? value : 0.6));
}
function normalize(items: unknown[]): CatalogVisionItem[] {
  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      name: typeof item.name === "string" ? item.name.trim().slice(0, 240) : "",
      brand: typeof item.brand === "string" ? item.brand.trim().slice(0, 160) || undefined : undefined,
      category: typeof item.category === "string" ? item.category.trim().slice(0, 160) || undefined : undefined,
      description: typeof item.description === "string" ? item.description.trim().slice(0, 1000) || undefined : undefined,
      attributes: Array.isArray(item.attributes)
        ? item.attributes.filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v)).map((v) => ({
            key: typeof v.key === "string" ? v.key.trim().slice(0, 120) : "",
            value: typeof v.value === "string" ? v.value.trim().slice(0, 1000) : "",
          })).filter((v) => v.key && v.value).slice(0, 24)
        : [],
      confidence: clamp(item.confidence),
      notes: typeof item.notes === "string" ? item.notes.trim().slice(0, 1000) || undefined : undefined,
    }))
    .filter((item) => item.name.length > 0)
    .slice(0, 250);
}

async function externalCatalogVision(imageDataUrl: string): Promise<CatalogVisionItem[]> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.QRE_AI_MODEL || "gpt-5",
      input: [
        { role: "system", content: [{ type: "input_text", text: [
          "You are QRE's catalog reality extractor.",
          "Identify every distinct catalog-worthy entity visibly supported by the image.",
          "Create ONE item object per distinct product or object. Never collapse a whole shelf or display into one fact.",
          "Preserve readable brand and item names. Extract useful visible arbitrary attributes such as flavor, size, pack, material, color, finish, model, type, and style.",
          "Do not invent hidden specifications, exact model numbers, dates, prices, quantities, or unseen facts.",
          "Return strict JSON array: [{name, brand?, category?, description?, attributes:[{key,value}], confidence, notes?}].",
        ].join(" ") }] },
        { role: "user", content: [
          { type: "input_text", text: "Build durable catalog entities from this image." },
          { type: "input_image", image_url: imageDataUrl, detail: "high" },
        ] },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`External catalog vision failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return normalize(parseJson(outputText(await response.json())));
}

export async function analyzeImageForCatalog(imageDataUrl: string): Promise<CatalogVisionItem[]> {
  if (!localEnabled() && !externalEnabled()) return [];
  const system = [
    "You are QRE's catalog reality extractor.",
    "Identify every distinct catalog-worthy entity visibly supported by the image.",
    "Create ONE item object per distinct product or object. Never collapse a whole shelf, display, receipt, or photo into one generic fact.",
    "Preserve readable brand and item names. Extract useful visible arbitrary attributes such as flavor, size, pack, material, color, finish, model, type, and style.",
    "Do not invent hidden specifications, exact model numbers, dates, prices, quantities, or unseen facts.",
    "Do not merge distinct visible products merely because they share a brand or category.",
    "Return strict JSON array: [{name, brand?, category?, description?, attributes:[{key,value}], confidence, notes?}].",
  ].join(" ");
  if (localEnabled()) {
    const result = await localModelGenerate([
      { role: "system", content: system },
      { role: "user", content: "Build durable catalog entities from this image.", images: [imageDataUrl] },
    ], "json");
    return normalize(parseJson(result.text));
  }
  return externalCatalogVision(imageDataUrl);
}
