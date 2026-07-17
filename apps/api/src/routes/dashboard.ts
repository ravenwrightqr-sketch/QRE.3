import express, { Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/requireAuth.js";
import { scanEngine } from "@qre/engine";

const router = express.Router();

/**
 * GET DASHBOARD STATE
 */
router.get(
  "/asset/:slug",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const slug = req.params.slug;

      if (typeof slug !== "string") {
        return res.status(400).json({
          error: "Invalid slug",
        });
      }

      const result = await scanEngine({
        slug,
        userId: req.user?.userId,
        tier: "BASIC",
      });

      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({
        error: e.message,
      });
    }
  }
);

export default router;