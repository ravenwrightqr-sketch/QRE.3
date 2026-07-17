import express, { Request, Response } from "express";
import { db } from "@qre/db";
import { requireAuth, AuthRequest } from "../middleware/requireAuth.js";
import { compileFlow } from "@qre/engine";

    
export const flowRouter = express.Router();

/**
 * =========================
 * COMPILE FLOW ONLY (DEV + UI PREVIEW)
 * =========================
 */
flowRouter.post("/compile", async (req: Request, res: Response) => {
  try {
    const { input, tier } = req.body;

    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "input required" });
    }

    const result = compileFlow({
      input,
      tier: tier ?? "BASIC",
    });

    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * CREATE FLOW (LEGACY BUT STABLE)
 * =========================
 */
flowRouter.post("/create", async (req: Request, res: Response) => {
  try {
    const { name, actions } = req.body;

    if (!name || !Array.isArray(actions)) {
      return res.status(400).json({ error: "missing data" });
    }

    const flow = await db.flow.create({
      data: {
        name,
        actions,
      },
    });

    return res.json({
      success: true,
      flow,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * COMPILE + SAVE + ATTACH FLOW
 * =========================
 */
flowRouter.post(
  "/compile-and-save",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { assetId, input, tier } = req.body;

      if (!assetId || !input) {
        return res.status(400).json({
          error: "assetId and input required",
        });
      }

      const compiled = compileFlow({
        input,
        tier: tier ?? "BASIC",
      });

      const flow = await db.flow.create({
        data: {
          name: `Flow ${Date.now()}`,
          actions: compiled.actions,
        },
      });

      const asset = await db.asset.update({
        where: { id: assetId },
        data: { flowId: flow.id },
      });

      return res.json({
        success: true,
        flowId: flow.id,
        assetId: asset.id,
        actions: compiled.actions,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
);

/**
 * =========================
 * ASSIGN EXISTING FLOW (THIS IS YOUR DASHBOARD HOOK)
 * =========================
 */
flowRouter.post(
  "/assign-flow",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { assetId, flowId } = req.body;

      if (!assetId || !flowId) {
        return res.status(400).json({
          error: "missing assetId or flowId",
        });
      }

      // ownership guard (IMPORTANT FOR PRODUCTION)
      const asset = await db.asset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      if (
        asset.ownerId &&
        asset.ownerId !== req.user!.userId
      ) {
        return res.status(403).json({
          error: "Not authorized",
        });
      }

      const updated = await db.asset.update({
        where: { id: assetId },
        data: { flowId },
      });

      return res.json({
        success: true,
        asset: updated,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
);