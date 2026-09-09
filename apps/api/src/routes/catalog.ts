import express from "express";
import { db } from "@qre/db";
import { recordCatalogFavorite, deriveCatalogRecommendations, getVisitorFavorites, recordCatalogTryFeedback } from "../services/catalogRecommendation.js";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();

async function resolveOwnedAsset(slug: string, userId: string) {
  const asset = await db.asset.findUnique({ where: { slug }, select: { id: true, slug: true, displayName: true, ownerId: true, accountId: true } });
  if (!asset) return null;
  if (asset.ownerId === userId) return asset;
  if (!asset.accountId) return null;
  const membership = await db.accountUser.findUnique({ where: { accountId_userId: { accountId: asset.accountId, userId } }, select: { userId: true } });
  return membership ? asset : null;
}

async function readCatalog(assetId: string) {
  const items = await db.catalogItem.findMany({
    where: { assetId }, orderBy: { name: "asc" },
    include: { observations: { orderBy: { observedAt: "desc" }, take: 1, select: { value: true, confidence: true, source: true, observedAt: true } } },
  });

  return items.map((item) => {
    const latest = item.observations[0];
    const value = latest?.value && typeof latest.value === "object" && !Array.isArray(latest.value) ? latest.value as Record<string, unknown> : {};
    const rawAvailability = typeof value.value === "string" ? value.value.toLowerCase().trim() : "";
    const availability = rawAvailability === "unavailable" || rawAvailability.includes("sold") ? "unavailable" : rawAvailability === "available" ? "available" : "observed";
    return { id: item.id, kind: item.kind, name: item.name, category: item.category, brand: item.brand, description: item.description, status: item.status, availability, confidence: latest?.confidence ?? 0, source: latest?.source ?? null, observedAt: latest?.observedAt ?? null };
  });
}

async function resolveAssetBySlug(slug: string) {
  return db.asset.findUnique({ where: { slug }, select: { id: true, slug: true, displayName: true } });
}

router.get("/:slug", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug); if (!slug) return res.status(400).json({ error: "Missing asset." });
    const asset = await resolveAssetBySlug(slug); if (!asset) return res.status(404).json({ error: "Catalog not found." });
    const products = await readCatalog(asset.id);
    return res.json({ asset, products, count: products.length, availableCount: products.filter((product) => product.availability === "available").length });
  } catch (error) { console.error("Catalog load failed:", error); return res.status(500).json({ error: "Catalog load failed." }); }
});

router.get("/:slug/customer", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug); if (!slug) return res.status(400).json({ error: "Missing asset." });
    const asset = await resolveAssetBySlug(slug); if (!asset) return res.status(404).json({ error: "Catalog not found." });
    const products = (await readCatalog(asset.id)).filter((product) => product.availability === "available").map(({ availability: _availability, ...product }) => product);
    return res.json({ asset, products, count: products.length });
  } catch (error) { console.error("Customer catalog load failed:", error); return res.status(500).json({ error: "Customer catalog load failed." }); }
});

router.post("/:slug/favorite", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const itemId = typeof req.body?.itemId === "string" ? req.body.itemId.trim() : "";
    const visitorId = typeof req.body?.visitorId === "string" ? req.body.visitorId.trim() : "";
    if (!slug || !itemId || !visitorId) return res.status(400).json({ error: "slug, itemId, and visitorId are required." });
    if (visitorId.length > 128) return res.status(400).json({ error: "visitorId is too long." });
    const asset = await resolveAssetBySlug(slug); if (!asset) return res.status(404).json({ error: "Catalog not found." });
    return res.json(await recordCatalogFavorite({ assetId: asset.id, itemId, visitorId }));
  } catch (error) { console.error("Catalog favorite failed:", error); return res.status(400).json({ error: error instanceof Error ? error.message : "Catalog favorite failed." }); }
});

router.post("/:slug/try-feedback", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const itemId = typeof req.body?.itemId === "string" ? req.body.itemId.trim() : "";
    const visitorId = typeof req.body?.visitorId === "string" ? req.body.visitorId.trim() : "";
    const reaction = req.body?.reaction === "positive" || req.body?.reaction === "negative" ? req.body.reaction : "";
    if (!slug || !itemId || !visitorId || !reaction) return res.status(400).json({ error: "slug, itemId, visitorId, and reaction are required." });
    if (visitorId.length > 128) return res.status(400).json({ error: "visitorId is too long." });
    const asset = await resolveAssetBySlug(slug); if (!asset) return res.status(404).json({ error: "Catalog not found." });
    return res.json(await recordCatalogTryFeedback({ assetId: asset.id, itemId, visitorId, reaction }));
  } catch (error) { console.error("Catalog try feedback failed:", error); return res.status(400).json({ error: error instanceof Error ? error.message : "Catalog try feedback failed." }); }
});

router.get("/:slug/recommendations", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const favoriteItemId = typeof req.query.favoriteItemId === "string" ? req.query.favoriteItemId.trim() : "";
    const visitorId = typeof req.query.visitorId === "string" ? req.query.visitorId.trim() : "";
    if (!slug) return res.status(400).json({ error: "Missing asset." });
    const asset = await resolveAssetBySlug(slug); if (!asset) return res.status(404).json({ error: "Catalog not found." });
    let resolvedFavoriteId = favoriteItemId;
    if (!resolvedFavoriteId && visitorId) {
      const favorites = await getVisitorFavorites(asset.id, visitorId);
      resolvedFavoriteId = favorites[0]?.itemId ?? "";
    }
    if (!resolvedFavoriteId) return res.status(400).json({ error: "favoriteItemId or visitorId is required." });
    return res.json(await deriveCatalogRecommendations({ assetId: asset.id, favoriteItemId: resolvedFavoriteId, visitorId: visitorId || undefined, limit: 50 }));
  } catch (error) { console.error("Catalog recommendation failed:", error); return res.status(400).json({ error: error instanceof Error ? error.message : "Catalog recommendation failed." }); }
});

router.put("/:slug/:itemId/availability", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug); const itemId = safeStringParam(req.params.itemId); const userId = req.user?.userId;
    const requested = typeof req.body?.availability === "string" ? req.body.availability.trim().toLowerCase() : "";
    if (!slug || !itemId || !userId) return res.status(400).json({ error: "Missing identifier." });
    if (requested !== "available" && requested !== "unavailable") return res.status(400).json({ error: "Availability must be available or unavailable." });
    const asset = await resolveOwnedAsset(slug, userId); if (!asset) return res.status(404).json({ error: "Asset not found." });
    const item = await db.catalogItem.findFirst({ where: { id: itemId, assetId: asset.id }, select: { id: true, name: true } });
    if (!item) return res.status(404).json({ error: "Catalog item not found." });
    const observation = await db.knowledgeObservation.create({ data: { assetId: asset.id, catalogItemId: item.id, type: "AVAILABILITY_UPDATE", value: { label: item.name, value: requested, updatedBy: userId }, source: "merchant", confidence: 1, observedAt: new Date() } });
    await db.catalogAttribute.create({ data: { catalogItemId: item.id, key: "availability", value: requested, normalizedValue: requested, confidence: 1, evidenceId: undefined } });
    return res.json({ success: true, itemId: item.id, availability: requested, observationId: observation.id });
  } catch (error) { console.error("Catalog availability update failed:", error); return res.status(500).json({ error: error instanceof Error ? error.message : "Catalog availability update failed." }); }
});

export default router;
