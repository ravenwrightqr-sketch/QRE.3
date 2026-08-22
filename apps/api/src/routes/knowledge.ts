import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { getDashboardMetrics, getRecentActivity } from "@qre/engine";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { analyzeImageForKnowledge } from "../services/aiProvider.js";
import { persistExplicitAuthorEvidence } from "../services/authorLearningLoop.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
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
    const learning = await persistExplicitAuthorEvidence(
      {
        assetId: asset.id,
        userId,
        text: `${finalLabel}: ${finalValue}`,
        predicate: finalLabel,
        value: finalValue,
        sourceRef: row.id,
        metadata: {
          category: finalCategory,
          source: payload.source,
          confidence: payload.confidence,
          hasMedia: Boolean(payload.imageDataUrl),
          mediaId: row.id,
        },
      },
      {
        memoryRepository: createMemoryRepository(),
        analyticsRepository,
      },
    );

    return res.status(201).json({
      success: true,
      item: { id: row.id, createdAt: row.createdAt, ...payload },
      learning: {
        analyticsType: learning.analyticsType,
        observedAt: learning.observedAt,
        memory: learning.memory,
      },
    });
  } catch (error) {
    console.error("Knowledge write failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Knowledge write failed." });
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
    await db.analyticsEvent.create({ data: { assetId: asset.id, type: "MEMORY_UPDATED", meta: { source: "knowledge_delete", itemId } } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Knowledge delete failed:", error);
    return res.status(500).json({ error: "Knowledge delete failed." });
  }
});

export default router;
