import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { getDashboardMetrics, getRecentActivity } from "@qre/engine";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { analyzeImageForKnowledge } from "../services/aiProvider.js";
import { learnWebsiteWorld } from "../services/websiteLearning.js";
import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();
const analyticsRepository = createAnalyticsRepository();

async function resolveOwnedAsset(slug: string, userId: string) {
  const asset = await db.asset.findUnique({ where: { slug }, select: { id: true, slug: true, displayName: true, ownerId: true, accountId: true } });
  if (!asset) return null;
  if (asset.ownerId === userId) return asset;
  if (!asset.accountId) return null;
  const membership = await db.accountUser.findUnique({ where: { accountId_userId: { accountId: asset.accountId, userId } }, select: { userId: true } });
  return membership ? asset : null;
}

function normalizeValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return JSON.stringify(value);
}

router.get("/:slug", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });
    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const [rows, metrics, activity] = await Promise.all([
      db.insight.findMany({ where: { assetId: asset.id, type: "KNOWLEDGE" }, orderBy: { createdAt: "desc" }, take: 250 }),
      getDashboardMetrics(asset.id, analyticsRepository),
      getRecentActivity(asset.id, analyticsRepository, 30),
    ]);

    const knowledge: Array<Record<string, unknown> & { id: string; createdAt: Date }> = rows.map((row) => {
      try {
        const parsed = JSON.parse(row.message) as Record<string, unknown>;
        return { id: row.id, createdAt: row.createdAt, ...parsed };
      } catch {
        return { id: row.id, createdAt: row.createdAt, label: row.message, value: row.impact ?? "", category: "general", source: "legacy" };
      }
    });

    const categories = [...new Set(knowledge.map((item) => typeof item.category === "string" ? item.category : "general"))];
    return res.json({ asset, knowledge, categories, metrics, activity });
  } catch (error) {
    console.error("Knowledge load failed:", error);
    return res.status(500).json({ error: "Knowledge load failed." });
  }
});

router.post("/:slug", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });
    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const label = normalizeValue(req.body?.label);
    const value = normalizeValue(req.body?.value);
    const imageDataUrl = typeof req.body?.imageDataUrl === "string" ? req.body.imageDataUrl : "";
    const autoAnalyze = req.body?.autoAnalyze !== false;
    if (!label && !value && !imageDataUrl) return res.status(400).json({ error: "Add a fact or image." });

    const requestedCategory = normalizeValue(req.body?.category) || "general";
    const generatedFacts = autoAnalyze && imageDataUrl.startsWith("data:image/") && (!label || !value)
      ? await analyzeImageForKnowledge(imageDataUrl, requestedCategory)
      : [];
    const selectedFact = generatedFacts[0];
    const finalLabel = label || selectedFact?.label || "Image observation";
    const finalValue = value || selectedFact?.value || "Image captured for later reference";
    const finalCategory = normalizeValue(req.body?.category) || selectedFact?.category || "general";
    const finalNotes = normalizeValue(req.body?.notes) || selectedFact?.notes || "";

    const payload = {
      label: finalLabel,
      value: finalValue,
      category: finalCategory,
      unit: normalizeValue(req.body?.unit) || selectedFact?.unit || undefined,
      source: normalizeValue(req.body?.source) || (generatedFacts.length ? "vision" : "owner"),
      notes: finalNotes || undefined,
      imageDataUrl: imageDataUrl && imageDataUrl.length <= 2_500_000 ? imageDataUrl : undefined,
      confidence: typeof req.body?.confidence === "number" ? Math.max(0, Math.min(1, req.body.confidence)) : selectedFact?.confidence ?? 1,
      extractedFacts: generatedFacts,
      updatedBy: userId,
    };

    const row = await db.insight.create({ data: { assetId: asset.id, type: "KNOWLEDGE", message: JSON.stringify(payload), impact: finalValue } });
    await analyticsRepository.trackEvent({
      assetId: asset.id,
      type: generatedFacts.length ? "AI_MEMORY_LEARNED" : "MEMORY_CREATED",
      meta: { source: payload.source, category: finalCategory, label: finalLabel, confidence: payload.confidence },
    });
    return res.status(201).json({ success: true, item: { id: row.id, createdAt: row.createdAt, ...payload } });
  } catch (error) {
    console.error("Knowledge write failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Knowledge write failed." });
  }
});

router.post("/:slug/learn-website", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    const url = normalizeValue(req.body?.url);
    const ownerDescription = normalizeValue(req.body?.ownerDescription);
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });
    if (!url) return res.status(400).json({ error: "Website URL required." });
    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const learned = await learnWebsiteWorld({ url, ownerDescription });
    const world = learned.world;
    const payload = {
      label: "Business world learned from website",
      value: world.businessName || asset.displayName || "Business world",
      category: "business_world",
      source: "website",
      sourceUrl: learned.url,
      sourceTitle: learned.title || undefined,
      confidence: 0.9,
      ownerDescription: ownerDescription || undefined,
      businessName: world.businessName || undefined,
      businessType: world.businessType || undefined,
      businessDescription: world.description || undefined,
      services: world.services,
      differentiators: world.differentiators,
      signals: world.signals,
      subjectKinds: world.subjectKinds,
      importantFacts: world.importantFacts,
      sourceExcerpt: learned.sourceExcerpt,
      updatedBy: userId,
    };

    const row = await db.insight.create({
      data: { assetId: asset.id, type: "KNOWLEDGE", message: JSON.stringify(payload), impact: world.description || world.businessType || world.businessName || learned.title },
    });

    const current = await db.asset.findUnique({ where: { id: asset.id }, select: { templateData: true } });
    const currentData = current?.templateData && typeof current.templateData === "object" && !Array.isArray(current.templateData)
      ? current.templateData as Record<string, unknown>
      : {};
    await db.asset.update({
      where: { id: asset.id },
      data: {
        templateData: {
          ...currentData,
          businessName: world.businessName || currentData.businessName || asset.displayName,
          businessType: world.businessType || currentData.businessType,
          businessDescription: world.description || currentData.businessDescription || ownerDescription,
          services: world.services.length ? world.services : currentData.services,
          capabilities: world.services.length ? world.services : currentData.capabilities,
          contextualSignals: [...new Set([...(Array.isArray(currentData.contextualSignals) ? currentData.contextualSignals.filter((v): v is string => typeof v === "string") : []), ...world.signals, ...world.differentiators])].slice(0, 48),
          subjectKinds: world.subjectKinds.length ? world.subjectKinds : currentData.subjectKinds,
          websiteKnowledge: {
            sourceUrl: learned.url,
            sourceTitle: learned.title || undefined,
            businessName: world.businessName,
            businessType: world.businessType,
            description: world.description,
            services: world.services,
            differentiators: world.differentiators,
            signals: world.signals,
            subjectKinds: world.subjectKinds,
            importantFacts: world.importantFacts,
            learnedAt: new Date().toISOString(),
          },
        },
      },
    });

    await analyticsRepository.trackEvent({
      assetId: asset.id,
      type: "AI_MEMORY_LEARNED",
      meta: { source: "website", sourceUrl: learned.url, businessName: world.businessName, services: world.services.length, differentiators: world.differentiators.length },
    });

    return res.status(201).json({ success: true, item: { id: row.id, createdAt: row.createdAt, ...payload }, world });
  } catch (error) {
    console.error("Website learning failed:", error);
    return res.status(502).json({ error: error instanceof Error ? error.message : "Website learning failed." });
  }
});

router.delete("/:slug/:itemId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const itemId = safeStringParam(req.params.itemId);
    const userId = req.user?.userId;
    if (!slug || !itemId || !userId) return res.status(400).json({ error: "Missing identifier." });
    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });
    await db.insight.deleteMany({ where: { id: itemId, assetId: asset.id, type: "KNOWLEDGE" } });
    await analyticsRepository.trackEvent({ assetId: asset.id, type: "MEMORY_UPDATED", meta: { source: "knowledge_delete", itemId } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Knowledge delete failed:", error);
    return res.status(500).json({ error: "Knowledge delete failed." });
  }
});

export default router;
