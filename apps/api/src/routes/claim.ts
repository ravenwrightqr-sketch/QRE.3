import express from "express";
import { db } from "@qre/db";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * =====================================================
 * CLAIM ASSET TO ACCOUNT
 * =====================================================
 *
 * Inventory assignment boundary.
 *
 * A user may belong to multiple accounts, so accountId is required when the
 * membership set is ambiguous. OWNER/ADMIN membership is required because
 * claiming inventory changes tenant ownership/control.
 *
 * This does not create paid ownership. Stripe/payment remains separate.
 * =====================================================
 */

router.post(
  "/:slug",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const slug = Array.isArray(req.params.slug)
        ? req.params.slug[0]
        : req.params.slug;
      const userId = req.user?.userId;
      const requestedAccountId =
        typeof req.body?.accountId === "string"
          ? req.body.accountId.trim()
          : "";

      if (!slug || !userId) {
        return res.status(400).json({
          error: "slug and authentication required",
        });
      }

      const memberships = await db.accountUser.findMany({
        where: {
          userId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
        select: {
          accountId: true,
          role: true,
        },
        orderBy: {
          accountId: "asc",
        },
      });

      if (memberships.length === 0) {
        return res.status(403).json({
          error: "No account permission",
        });
      }

      const membership = requestedAccountId
        ? memberships.find((item) => item.accountId === requestedAccountId)
        : memberships.length === 1
          ? memberships[0]
          : undefined;

      if (!membership) {
        if (requestedAccountId) {
          return res.status(403).json({
            error: "User does not have claim permission for the requested account",
          });
        }

        return res.status(409).json({
          error: "Account selection required",
          accounts: memberships.map((item) => ({
            accountId: item.accountId,
            role: item.role,
          })),
        });
      }

      const accountId = membership.accountId;

      const asset = await db.asset.findUnique({
        where: { slug },
        select: {
          id: true,
          accountId: true,
        },
      });

      if (!asset) {
        return res.status(404).json({
          error: "Asset not found",
        });
      }

      if (asset.accountId) {
        return res.status(409).json({
          error: "Asset already assigned",
        });
      }

      const updated = await db.asset.update({
        where: { id: asset.id },
        data: { accountId },
      });

      return res.json({
        success: true,
        assetId: updated.id,
        accountId: updated.accountId,
      });
    } catch (error: any) {
      console.error("[ASSET CLAIM FAILED]", error);

      return res.status(500).json({
        error: "Claim failed",
      });
    }
  },
);

export default router;
