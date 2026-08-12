import express from "express";
import { db } from "@qre/db";
import { nanoid } from "nanoid";
import QRCode from "qrcode";

import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * =====================================================
 * ASSET IDENTITY FACTORY
 * =====================================================
 *
 * Creates the physical/digital identity.
 *
 * Canonical ownership model:
 *
 * User
 *   |
 * AccountUser (membership / role)
 *   |
 * Account
 *   |
 * Asset
 *   |
 * QR / NFC Identity
 *
 * A user may belong to multiple Accounts. Therefore asset creation must use
 * an explicit accountId whenever membership is ambiguous; silently selecting
 * the first membership would place company assets in the wrong tenant.
 *
 * Does NOT create:
 *
 * ❌ Experience
 * ❌ Flow
 * ❌ AssetFlow
 * ❌ Ownership
 *
 * Ownership/payment remains a separate Stripe/claim concern.
 * =====================================================
 */

router.post(
  "/generate",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const { displayName } = req.body;
      const requestedAccountId =
        typeof req.body?.accountId === "string"
          ? req.body.accountId.trim()
          : "";

      const memberships = await db.accountUser.findMany({
        where: { userId },
        select: {
          accountId: true,
          role: true,
        },
        orderBy: {
          accountId: "asc",
        },
      });

      if (memberships.length === 0) {
        return res.status(400).json({
          error: "User has no account",
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
            error: "User is not a member of the requested account",
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
      const slug = nanoid(10);
      const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3000";
      const qrUrl = `${baseUrl}/s/${slug}`;

      const qrSvg = await QRCode.toString(qrUrl, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 1,
        scale: 6,
      });

      const asset = await db.asset.create({
        data: {
          slug,
          qrUrl,
          qrSvg,
          displayName:
            typeof displayName === "string" && displayName.trim().length > 0
              ? displayName.trim()
              : "Untitled Asset",
          accountId,
          status: "active",
          paid: false,
          priceCents: 599,
        },
      });

      return res.json({
        success: true,
        assetId: asset.id,
        accountId,
        slug: asset.slug,
        qrUrl: asset.qrUrl,
        qrSvg: asset.qrSvg,
        displayName: asset.displayName,
      });
    } catch (error: any) {
      console.error("[ASSET GENERATION ERROR]", error);

      return res.status(500).json({
        error: error.message,
      });
    }
  },
);

export default router;
