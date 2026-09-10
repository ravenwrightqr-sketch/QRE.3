import { db } from "@qre/db";
import { buildRecognitionBrief } from "./recognition/recognitionVocabulary.js";
import { recognizeImage } from "./recognition/recognitionEngine.js";

export type CatalogVisionLocation = {
  section?: string;
  shelf?: string;
  row?: string;
  position?: string;
  bbox?: [number, number, number, number];
};

export type CatalogVisionEvidence = {
  kind: string;
  value?: string;
  confidence: number;
  source?: string;
};

export type CatalogVisionItem = {
  observationId: string;
  name: string;
  brand?: string;
  product?: string;
  variant?: string;
  category?: string;
  attributes?: Array<{ key: string; value: string }>;
  evidence?: CatalogVisionEvidence[];
  location?: CatalogVisionLocation;
  state: string;
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
    task: "Identify every distinct physical product unit or clearly separated product group visible in this business image. Preserve exact visible brand, product, variant, printed text, packaging clues, visibility state, and spatial placement. Do not collapse two physically separate items merely because they share the same product identity.",
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
      const attributes: Array<{ key: string; value: string }> = [];
      for (const [key, value] of Object.entries(candidate.attributes ?? {})) {
        if (value.trim()) attributes.push({ key, value: value.trim().slice(0, 1000) });
      }
      for (const evidence of candidate.evidence) {
        if ((evidence.kind === "printed_text" || evidence.kind === "logo") && evidence.value?.trim()) {
          attributes.push({ key: evidence.kind, value: evidence.value.trim().slice(0, 4000) });
        }
      }
      if (candidate.variant?.trim()) attributes.push({ key: "variant", value: candidate.variant.trim().slice(0, 500) });
      if (item.location) {
        for (const [key, value] of Object.entries(item.location)) {
          if (value) attributes.push({ key: `placement.${key}`, value: String(value).trim().slice(0, 500) });
        }
      }
      if (candidate.attributes?.visibility_state?.trim()) {
        attributes.push({ key: "visibility_state", value: candidate.attributes.visibility_state.trim().slice(0, 200) });
      }
      const deduped = [...new Map(attributes.map((attribute) => [`${attribute.key}\u0000${attribute.value}`, attribute])).values()].slice(0, 96);
      return {
        observationId: item.observationId,
        name: (candidate.name || candidate.product || "Unresolved visual item").slice(0, 240),
        brand: candidate.brand?.slice(0, 160),
        product: candidate.product?.slice(0, 240),
        variant: candidate.variant?.slice(0, 240),
        category: candidate.category?.slice(0, 160),
        attributes: deduped,
        evidence: candidate.evidence.map((evidence) => ({
          kind: evidence.kind,
          value: evidence.value?.trim().slice(0, 4000),
          confidence: Math.max(0, Math.min(1, evidence.confidence)),
          source: evidence.source,
        })),
        location: item.location,
        state: candidate.state,
        confidence: Math.max(0, Math.min(1, candidate.confidence)),
        notes: [candidate.state, ...result.warnings].filter(Boolean).join("; ").slice(0, 1000) || undefined,
      };
    })
    .slice(0, 500);
}
