import express, { Response } from "express";

import { db } from "@qre/db";

import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { createExperience } from "../services/experienceCreationServices.js";

const router = express.Router();

router.use(requireAuth);

/**
 * Create an asset and compile its first experience.
 *
 * Authentication/account authorization stays at the API boundary. The
 * creation service receives the authenticated user id so durable memory
 * writes are attributable to, and governed by, that same principal.
 */
router.post(
  "/assets/create-experience",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { displayName, slug, prompt, priceCents } = req.body;

      if (!slug || !prompt) {
        return res.status(400).json({ error: "slug and prompt required" });
      }

      const membership = await db.accountUser.findFirst({
        where: {
          userId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
        select: {
          accountId: true,
        },
      });

      if (!membership) {
        return res.status(403).json({ error: "No account available" });
      }

      const accountId = membership.accountId;

      const asset = await db.asset.create({
        data: {
          accountId,
          displayName,
          slug,
          status: "active",
          paid: false,
          saleChannel: "ADMIN",
          priceCents: priceCents ?? 999,
        },
      });

      const result = await createExperience({
        assetId: asset.id,
        prompt,
        userId,
      });

      return res.json({
        success: true,
        accountId,
        assetId: asset.id,
        experienceId: result.experience.id,
        flowId: result.flow.id,
        slug: asset.slug,
        scanUrl: `/api/scan/${asset.slug}`,
      });
    } catch (error: any) {
      console.error("CREATE EXPERIENCE ERROR", error);

      return res.status(500).json({
        error: error.message,
      });
    }
  },
);

export default router;
