import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { getDashboardMetrics, getRecentActivity, createAnalyticsRepository } from "@qre/engine";
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

    const knowledge = rows.flatMap((row) => {
      try {
        const parsed = JSON.parse(row.message) as Record<string, unknown>;
        return [{ id: row.id, createdAt: row.createdAt, ...parsed }];
      } catch {
        return [{ id: row.id, createdAt: row.createdAt, label: row.message, value: row.impact ?? "", category: "general", source: "legacy" }];
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
    if (!label || !value) return res.status(400).json({ error: "Label and value are required." });

    const payload = {
      label,
      value,
      category: normalizeValue(req.body?.category) || "general",
      unit: normalizeValue(req.body?.unit) || undefined,
      source: normalizeValue(req.body?.source) || "owner",
      notes: normalizeValue(req.body?.notes) || undefined,
      imageDataUrl: typeof req.body?.imageDataUrl === "string" && req.body.imageDataUrl.length <= 2_500_000 ? req.body.imageDataUrl : undefined,
      confidence: typeof req.body?.confidence === "number" ? Math.max(0, Math.min(1, req.body.confidence)) : 1,
      updatedBy: userId,
    };

    const row = await db.insight.create({ data: { assetId: asset.id, type: "KNOWLEDGE", message: JSON.stringify(payload), impact: value } });
    return res.status(201).json({ success: true, item: { id: row.id, createdAt: row.createdAt, ...payload } });
  } catch (error) {
    console.error("Knowledge write failed:", error);
    return res.status(500).json({ error: "Knowledge write failed." });
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
    return res.json({ success: true });
  } catch (error) {
    console.error("Knowledge delete failed:", error);
    return res.status(500).json({ error: "Knowledge delete failed." });
  }
});

export default router;
