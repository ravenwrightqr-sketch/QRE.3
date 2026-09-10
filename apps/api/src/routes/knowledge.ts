import express from "express";
import { db } from "@qre/db";
import { getDashboardMetrics, getRecentActivity } from "@qre/engine";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { safeStringParam } from "../lib/safeParam.js";
import { enqueueKnowledgeIntake } from "../services/knowledgeIntake.js";

const router = express.Router();
const analyticsRepository = createAnalyticsRepository();

async function resolveOwnedAsset(slug: string, userId: string) {
  const asset = await db.asset.findUnique({
    where: { slug },
    select: { id: true, slug: true, displayName: true, ownerId: true, accountId: true },
  });
  if (!asset) return null;
  if (asset.ownerId === userId) return asset;
  if (!asset.accountId) return null;
  const membership = await db.accountUser.findUnique({
    where: { accountId_userId: { accountId: asset.accountId, userId } },
    select: { userId: true },
  });
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

    const knowledge = rows.map((row) => {
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

router.post("/:slug/intake", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });

    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const sourceType = normalizeValue(req.body?.sourceType) || "upload";
    const originalName = normalizeValue(req.body?.originalName) || undefined;
    const mimeType = normalizeValue(req.body?.mimeType) || undefined;
    const content = typeof req.body?.content === "string" ? req.body.content : undefined;
    const imageDataUrl = typeof req.body?.imageDataUrl === "string" ? req.body.imageDataUrl : undefined;
    const text = typeof req.body?.text === "string" ? req.body.text : undefined;

    if (!content && !imageDataUrl && !text) return res.status(400).json({ error: "No intake content supplied." });

    const queued = await enqueueKnowledgeIntake({
      assetId: asset.id,
      userId,
      sourceType,
      originalName,
      mimeType,
      content,
      imageDataUrl,
      text,
    });

    return res.status(202).json({
      accepted: true,
      duplicate: queued.duplicate,
      jobId: queued.job.id,
      status: queued.job.status,
    });
  } catch (error) {
    console.error("Knowledge intake enqueue failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Knowledge intake failed." });
  }
});

router.get("/:slug/intake/:jobId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const jobId = safeStringParam(req.params.jobId);
    const userId = req.user?.userId;
    if (!slug || !jobId || !userId) return res.status(400).json({ error: "Missing identifier." });

    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const job = await db.knowledgeIntakeJob.findFirst({
      where: { id: jobId, assetId: asset.id },
      select: {
        id: true,
        status: true,
        sourceType: true,
        originalName: true,
        result: true,
        error: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!job) return res.status(404).json({ error: "Intake job not found." });
    return res.json({ job });
  } catch (error) {
    console.error("Knowledge intake status failed:", error);
    return res.status(500).json({ error: "Knowledge intake status failed." });
  }
});

/**
 * Backward-compatible knowledge writer. It deliberately does not analyze or persist
 * directly anymore; every write goes through the same durable intake path as the
 * universal uploader so there is one learning pipeline.
 */
router.post("/:slug", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });

    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const label = normalizeValue(req.body?.label);
    const value = normalizeValue(req.body?.value);
    const notes = normalizeValue(req.body?.notes);
    const category = normalizeValue(req.body?.category);
    const source = normalizeValue(req.body?.source) || "owner";
    const imageDataUrl = typeof req.body?.imageDataUrl === "string" ? req.body.imageDataUrl : "";

    if (!label && !value && !imageDataUrl && !notes) return res.status(400).json({ error: "Add a fact or image." });

    const text = [
      label ? `${label}: ${value || ""}`.trim() : value,
      category ? `Category: ${category}` : "",
      notes ? `Notes: ${notes}` : "",
      source ? `Source: ${source}` : "",
    ].filter(Boolean).join("\n");

    const queued = await enqueueKnowledgeIntake({
      assetId: asset.id,
      userId,
      sourceType: imageDataUrl.startsWith("data:image/") ? "photo" : "text",
      originalName: "Legacy knowledge entry",
      mimeType: imageDataUrl.startsWith("data:image/") ? undefined : "text/plain",
      imageDataUrl: imageDataUrl.startsWith("data:image/") ? imageDataUrl : undefined,
      text: imageDataUrl.startsWith("data:image/") ? undefined : text,
      content: imageDataUrl.startsWith("data:image/") ? undefined : text,
    });

    return res.status(202).json({ accepted: true, duplicate: queued.duplicate, jobId: queued.job.id, status: queued.job.status });
  } catch (error) {
    console.error("Knowledge compatibility enqueue failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Knowledge write failed." });
  }
});

/** Backward-compatible website writer; website learning is also durable now. */
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

    const queued = await enqueueKnowledgeIntake({
      assetId: asset.id,
      userId,
      sourceType: "website",
      originalName: url,
      mimeType: "text/uri-list",
      content: url,
      text: ownerDescription ? `${url}\nOwner context: ${ownerDescription}` : url,
    });

    return res.status(202).json({ accepted: true, duplicate: queued.duplicate, jobId: queued.job.id, status: queued.job.status });
  } catch (error) {
    console.error("Website learning enqueue failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Website learning failed." });
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
