import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { safeStringParam } from "../lib/safeParam.js";
import { createAndProcessKnowledgeIntake } from "../services/universalKnowledgeIngest.js";

const router = express.Router();

async function resolveOwnedAsset(slug: string, userId: string) {
  const asset = await db.asset.findUnique({ where: { slug }, select: { id: true, slug: true, displayName: true, ownerId: true, accountId: true } });
  if (!asset) return null;
  if (asset.ownerId === userId) return asset;
  if (!asset.accountId) return null;
  const membership = await db.accountUser.findUnique({ where: { accountId_userId: { accountId: asset.accountId, userId } }, select: { userId: true } });
  return membership ? asset : null;
}

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  return result || undefined;
}

router.post("/:slug/intake", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });
    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const sourceType = clean(req.body?.sourceType) || "upload";
    const originalName = clean(req.body?.originalName);
    const mimeType = clean(req.body?.mimeType);
    const content = typeof req.body?.content === "string" ? req.body.content : undefined;
    const imageDataUrl = typeof req.body?.imageDataUrl === "string" ? req.body.imageDataUrl : undefined;
    const text = typeof req.body?.text === "string" ? req.body.text : undefined;
    if (!content && !imageDataUrl && !text) return res.status(400).json({ error: "No intake content supplied." });

    const result = await createAndProcessKnowledgeIntake({ assetId: asset.id, userId, sourceType, originalName, mimeType, content, imageDataUrl, text });
    return res.status(result.job.status === "completed" ? 200 : 500).json({ accepted: true, duplicate: result.duplicate, jobId: result.job.id, status: result.job.status });
  } catch (error) {
    console.error("Unified knowledge intake failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Knowledge intake failed." });
  }
});

router.get("/:slug/state", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });
    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const [catalog, observations, patterns, jobs] = await Promise.all([
      db.catalogItem.findMany({ where: { assetId: asset.id }, orderBy: { updatedAt: "desc" }, take: 500, select: { id: true, name: true, kind: true, category: true, brand: true, description: true, updatedAt: true } }),
      db.knowledgeObservation.findMany({ where: { assetId: asset.id }, orderBy: { observedAt: "desc" }, take: 500, select: { id: true, type: true, value: true, source: true, confidence: true, observedAt: true } }),
      db.knowledgePattern.findMany({ where: { assetId: asset.id, status: "active" }, orderBy: { updatedAt: "desc" }, take: 250, select: { id: true, type: true, statement: true, confidence: true, strength: true, firstObservedAt: true, lastObservedAt: true } }),
      db.knowledgeIntakeJob.findMany({ where: { assetId: asset.id }, orderBy: { createdAt: "desc" }, take: 25, select: { id: true, status: true, sourceType: true, originalName: true, result: true, error: true, createdAt: true, startedAt: true, completedAt: true } }),
    ]);

    return res.json({ asset, catalog, observations, patterns, jobs, counts: { catalog: catalog.length, observations: observations.length, patterns: patterns.length, jobs: jobs.length } });
  } catch (error) {
    console.error("Knowledge state load failed:", error);
    return res.status(500).json({ error: "Knowledge state load failed." });
  }
});

export default router;
