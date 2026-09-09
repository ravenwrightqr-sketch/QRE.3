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

async function readCatalog(assetId: string) {
  const items = await db.catalogItem.findMany({
    where: { assetId },
    orderBy: { name: "asc" },
    include: {
      observations: {
        orderBy: { observedAt: "desc" },
        take: 1,
        select: {
          value: true,
          confidence: true,
          source: true,
          observedAt: true,
        },
      },
    },
  });

  return items.map((item) => {
    const latest = item.observations[0];
    const value = latest?.value && typeof latest.value === "object" && !Array.isArray(latest.value)
      ? latest.value as Record<string, unknown>
      : {};
    const rawAvailability = typeof value.value === "string" ? value.value.toLowerCase().trim() : "";

    // Check the negative state first: "unavailable" contains the substring
    // "available", so checking for availability first misclassified MARK OUT.
    const availability = rawAvailability === "unavailable" || rawAvailability.includes("sold")
      ? "unavailable"
      : rawAvailability === "available"
        ? "available"
        : "observed";

    return {
      id: item.id,
      kind: item.kind,
      name: item.name,
      category: item.category,
      brand: item.brand,
      description: item.description,
      status: item.status,
      availability,
      confidence: latest?.confidence ?? 0,
      source: latest?.source ?? null,
      observedAt: latest?.observedAt ?? null,
    };
  });
}

router.get("/:slug", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    if (!slug) return res.status(400).json({ error: "Missing asset." });

    const asset = await db.asset.findUnique({
      where: { slug },
      select: { id: true, slug: true, displayName: true },
    });
    if (!asset) return res.status(404).json({ error: "Catalog not found." });

    const products = await readCatalog(asset.id);

    return res.json({
      asset,
      products,
      count: products.length,
      availableCount: products.filter((product) => product.availability === "available").length,
    });
  } catch (error) {
    console.error("Catalog load failed:", error);
    return res.status(500).json({ error: "Catalog load failed." });
  }
});

router.put("/:slug/:itemId/availability", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const itemId = safeStringParam(req.params.itemId);
    const userId = req.user?.userId;
    const requested = typeof req.body?.availability === "string" ? req.body.availability.trim().toLowerCase() : "";

    if (!slug || !itemId || !userId) return res.status(400).json({ error: "Missing identifier." });
    if (requested !== "available" && requested !== "unavailable") return res.status(400).json({ error: "Availability must be available or unavailable." });

    const asset = await resolveOwnedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const item = await db.catalogItem.findFirst({ where: { id: itemId, assetId: asset.id }, select: { id: true, name: true } });
    if (!item) return res.status(404).json({ error: "Catalog item not found." });

    const observation = await db.knowledgeObservation.create({
      data: {
        assetId: asset.id,
        catalogItemId: item.id,
        type: "AVAILABILITY_UPDATE",
        value: { label: item.name, value: requested, updatedBy: userId },
        source: "merchant",
        confidence: 1,
        observedAt: new Date(),
      },
    });

    await db.catalogAttribute.create({
      data: {
        catalogItemId: item.id,
        key: "availability",
        value: requested,
        normalizedValue: requested,
        confidence: 1,
        evidenceId: undefined,
      },
    });

    return res.json({
      success: true,
      itemId: item.id,
      availability: requested,
      observationId: observation.id,
    });
  } catch (error) {
    console.error("Catalog availability update failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Catalog availability update failed." });
  }
});

export default router;
