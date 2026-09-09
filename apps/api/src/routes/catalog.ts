import express from "express";
import { db } from "@qre/db";
import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();

router.get("/:slug", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    if (!slug) return res.status(400).json({ error: "Missing asset." });

    const asset = await db.asset.findUnique({
      where: { slug },
      select: { id: true, slug: true, displayName: true },
    });
    if (!asset) return res.status(404).json({ error: "Catalog not found." });

    const items = await db.catalogItem.findMany({
      where: { assetId: asset.id },
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

    const products = items.map((item) => {
      const latest = item.observations[0];
      const value = latest?.value && typeof latest.value === "object" && !Array.isArray(latest.value)
        ? latest.value as Record<string, unknown>
        : {};

      return {
        id: item.id,
        kind: item.kind,
        name: item.name,
        category: item.category,
        status: item.status,
        availability: typeof value.value === "string" && value.value.toLowerCase().includes("available")
          ? "available"
          : "observed",
        confidence: latest?.confidence ?? 0,
        source: latest?.source ?? null,
        observedAt: latest?.observedAt ?? null,
      };
    });

    return res.json({
      asset,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Catalog load failed:", error);
    return res.status(500).json({ error: "Catalog load failed." });
  }
});

export default router;
