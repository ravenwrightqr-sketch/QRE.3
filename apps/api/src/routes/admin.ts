import express, { Response } from "express";
import { db } from "@qre/db";
import { authMiddleware, type AuthRequest } from "./authMiddleware.js";

const router = express.Router();

/**
 * =========================
 * AUTH PROTECTION
 * =========================
 */
router.use(authMiddleware);

/**
 * =========================
 * CREATE ASSET (OWNED BY USER)
 * =========================
 */
router.post("/assets", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { slug, flowId, priceCents } = req.body;

    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    const asset = await db.asset.create({
      data: {
        slug,
        flowId: flowId ?? null,
        priceCents: priceCents ?? 299,

        ownerId: userId,
        paid: false,
        status: "active",
      },
    });

    return res.json(asset);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * GET USER OWN ASSETS ONLY
 * =========================
 */
router.get("/assets", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const assets = await db.asset.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(assets);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * GET SINGLE ASSET (OWNED ONLY)
 * =========================
 */
router.get("/assets/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : req.params.id?.[0];

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const asset = await db.asset.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!asset) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(asset);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * UPDATE ASSET (OWNERS ONLY)
 * =========================
 */
router.post("/asset/update", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const { id, flowId, status, paid } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const asset = await db.asset.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found or not owned" });
    }

    const updated = await db.asset.update({
      where: { id },
      data: {
        flowId,
        status,
        paid,
      },
    });

    return res.json(updated);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;