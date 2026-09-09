import { db } from "@qre/db";
import { buildRecognitionBrief } from "./recognition/recognitionVocabulary.js";
import { recognizeImage } from "./recognition/recognitionEngine.js";

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

type RecognitionContext = {
  assetId?: string;
  businessName?: string;
  businessType?: string;
  templateData?: unknown;
  knownItems?: Array<{ id: string; name: string; brand?: string | null; category?: string | null; description?: string | null }>;
};

async function loadContext(assetId?: string): Promise<RecognitionContext> {
  if (!assetId) return {};
  const [asset, catalogItems] = await Promise.all([
    db.asset.findUnique({ where: { id: assetId }, select: { displayName: true, templateData: true } }),
    db.catalogItem.findMany({
      where: { assetId },
      select: { id: true, name: true, brand: true, category: true, description: true },
      orderBy: { createdAt: "asc" },
      take: 1000,
    }),
  ]);
  return {
    assetId,
    businessName: asset?.displayName || undefined,
    templateData: asset?.templateData,
    knownItems: catalogItems,
  };
}

export async function analyzeImageForCatalog(imageDataUrl: string, assetId?: string): Promise<CatalogVisionItem[]> {
  const context = await loadContext(assetId);
  const brief = buildRecognitionBrief({
    purpose: "catalog",
    task: "Identify distinct physical products visible in this business image and preserve exact visible product evidence for the catalog.",
    businessName: context.businessName,
    businessType: context.businessType,
    templateData: context.templateData,
    knownEntities: context.knownItems?.map((item) => ({
      id: item.id,
      name: item.name,
      brand: item.brand || undefined,
      category: item.category || undefined,
      attributes: item.description ? { description: item.description } : undefined,
    })),
  });

  const result = await recognizeImage({ imageDataUrl, brief });
  return result.observations
    .filter((item) => item.candidate.state !== "rejected")
    .map((item) => {
      const candidate = item.candidate;
      const attributes: CatalogVisionAttribute[] = [];
      for (const [key, value] of Object.entries(candidate.attributes ?? {})) {
        if (value.trim()) attributes.push({ key, value: value.trim().slice(0, 1000) });
      }
      for (const evidence of candidate.evidence) {
        if ((evidence.kind === "printed_text" || evidence.kind === "logo") && evidence.value?.trim()) {
          attributes.push({ key: evidence.kind, value: evidence.value.trim().slice(0, 4000) });
        }
      }
      if (item.location) {
        for (const [key, value] of Object.entries(item.location)) {
          if (value) attributes.push({ key: `placement.${key}`, value: String(value).trim().slice(0, 500) });
        }
      }
      const deduped = [...new Map(attributes.map((attribute) => [`${attribute.key}\u0000${attribute.value}`, attribute])).values()].slice(0, 96);
      return {
        name: (candidate.name || candidate.product || "Unresolved visual item").slice(0, 240),
        brand: candidate.brand?.slice(0, 160),
        category: candidate.category?.slice(0, 160),
        description: undefined,
        attributes: deduped,
        confidence: Math.max(0, Math.min(1, candidate.confidence)),
        notes: [candidate.state, ...result.warnings].filter(Boolean).join("; ").slice(0, 1000) || undefined,
      };
    })
    .slice(0, 500);
}
