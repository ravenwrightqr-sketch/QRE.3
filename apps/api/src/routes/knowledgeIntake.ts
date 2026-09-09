import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { retryKnowledgeIntake } from "../services/knowledgeIntake.js";
import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();

async function resolveOwnedAsset(slug: string, userId: string) {
  const asset = await db.asset.findUnique({
    where: { slug },
    select: { id: true, slug: true, ownerId: true, accountId: true },
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

router.get("/:slug/intake", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });

    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const jobs = await db.knowledgeIntakeJob.findMany({
      where: { assetId: asset.id },
      orderBy: { createdAt: "desc" },
      take: 50,
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

    return res.json({ jobs });
  } catch (error) {
    console.error("Knowledge intake history failed:", error);
    return res.status(500).json({ error: "Knowledge intake history failed." });
  }
});

router.post("/:slug/intake/:jobId/retry", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const jobId = safeStringParam(req.params.jobId);
    const userId = req.user?.userId;
    if (!slug || !jobId || !userId) return res.status(400).json({ error: "Missing identifier." });

    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const job = await retryKnowledgeIntake(jobId, asset.id);
    if (!job) return res.status(404).json({ error: "Intake job not found." });

    return res.status(job.status === "queued" ? 202 : 200).json({ job });
  } catch (error) {
    console.error("Knowledge intake retry failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Knowledge intake retry failed." });
  }
});

export default router;
