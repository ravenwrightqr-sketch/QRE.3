import express, { Request, Response } from "express";
import { db } from "@qre/db";
import crypto from "crypto";

const router = express.Router();

/**
 * =========================
 * SAFE SLUG HANDLER
 * =========================
 */
function getSlug(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

/**
 * =========================
 * GET SINGLE ASSET (LOOKUP / DEBUG / ADMIN)
 * =========================
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const slug = getSlug(req.query.slug);

    if (!slug) {
      return res.status(400).json({ error: "Missing or invalid slug" });
    }

    const asset = await db.asset.findUnique({
      where: { slug },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    return res.json({ asset });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * BULK PRODUCT CREATION (QR/NFC ITEMS)
 * =========================
 */
router.post("/create", async (req: Request, res: Response) => {
  try {
    const { quantity, priceCents, flowId } = req.body;

    // VALIDATION
    if (typeof quantity !== "number" || quantity <= 0 || quantity > 10000) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    if (typeof priceCents !== "number" || priceCents < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const assets = [];

    for (let i = 0; i < quantity; i++) {
      const slug = crypto.randomBytes(6).toString("hex");

      const asset = await db.asset.create({
        data: {
          slug,
          priceCents,
          flowId: flowId ?? null,
          paid: false,
          status: "active",
        },
      });

      assets.push(asset);
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || "https://qre.ink";

    const enriched = assets.map((a) => ({
      id: a.id,
      slug: a.slug,
      url: `${baseUrl}/scan/${a.slug}`,
      priceCents: a.priceCents,
    }));

    return res.json({
      success: true,
      created: enriched.length,
      assets: enriched,
      sampleUrl: enriched[0]?.url ?? null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;