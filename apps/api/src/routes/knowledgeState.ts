import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();

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

router.get("/:slug/state", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;

    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });

    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const [catalog, observations, patterns, jobs] = await Promise.all([
      db.catalogItem.findMany({
        where: { assetId: asset.id },
        orderBy: { updatedAt: "desc" },
        take: 500,
        select: {
          id: true,
          name: true,
          kind: true,
          category: true,
          brand: true,
          description: true,
          updatedAt: true,
        },
      }),
      db.knowledgeObservation.findMany({
        where: { assetId: asset.id },
        orderBy: { observedAt: "desc" },
        take: 500,
        select: {
          id: true,
          type: true,
          value: true,
          source: true,
          confidence: true,
          observedAt: true,
        },
      }),
      db.knowledgePattern.findMany({
        where: { assetId: asset.id, status: "active" },
        orderBy: { updatedAt: "desc" },
        take: 250,
        select: {
          id: true,
          type: true,
          statement: true,
          confidence: true,
          strength: true,
          firstObservedAt: true,
          lastObservedAt: true,
        },
      }),
      db.knowledgeIntakeJob.findMany({
        where: { assetId: asset.id },
        orderBy: { createdAt: "desc" },
        take: 25,
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
      }),
    ]);

    return res.json({
      asset,
      catalog,
      observations,
      patterns,
      jobs,
      counts: {
        catalog: catalog.length,
        observations: observations.length,
        patterns: patterns.length,
        jobs: jobs.length,
      },
    });
  } catch (error) {
    console.error("Knowledge state load failed:", error);
    return res.status(500).json({ error: "Knowledge state load failed." });
  }
});

export default router;
