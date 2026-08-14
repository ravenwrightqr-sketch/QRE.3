import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();

router.post("/:slug", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset or user" });

    const asset = await db.asset.findFirst({
      where: {
        slug,
        OR: [
          { ownerId: userId },
          { ownership: { userId } },
        ],
      },
      select: { id: true },
    });

    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const body = req.body ?? {};
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const proof = await db.geoProof.create({
      data: {
        assetId: asset.id,
        userId,
        lat,
        lng,
        source: "dashboard",
        label: typeof body.label === "string" && body.label.trim() ? body.label.trim() : null,
        city: typeof body.city === "string" && body.city.trim() ? body.city.trim() : null,
        region: typeof body.region === "string" && body.region.trim() ? body.region.trim() : null,
        country: typeof body.country === "string" && body.country.trim() ? body.country.trim() : null,
      },
      select: {
        id: true,
        lat: true,
        lng: true,
        label: true,
        city: true,
        region: true,
        country: true,
        source: true,
        createdAt: true,
      },
    });

    return res.json({ location: proof });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to save location" });
  }
});

export default router;
