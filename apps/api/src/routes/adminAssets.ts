import express, { Response } from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";

const router = express.Router();
const MANAGEMENT_ROLES = new Set(["OWNER", "ADMIN"]);

async function managementAccounts(userId: string) {
  return db.accountUser.findMany({
    where: { userId },
    select: { accountId: true, role: true },
  });
}

router.post(
  "/assets/:assetId/assign",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const assetId = String(req.params.assetId ?? "").trim();
      const userId = req.user?.userId;
      const requestedAccountId = typeof req.body?.accountId === "string"
        ? req.body.accountId.trim()
        : "";

      if (!assetId || !userId) {
        return res.status(400).json({ error: "assetId required" });
      }

      const memberships = await managementAccounts(userId);
      const manageable = memberships.filter((membership) =>
        MANAGEMENT_ROLES.has(String(membership.role ?? "").toUpperCase()),
      );

      if (!manageable.length) {
        return res.status(403).json({ error: "Account administration required." });
      }

      const accountId = requestedAccountId || (
        manageable.length === 1 ? manageable[0].accountId : ""
      );

      if (!accountId) {
        return res.status(400).json({
          error: "accountId required when administering multiple accounts.",
        });
      }

      if (!manageable.some((membership) => membership.accountId === accountId)) {
        return res.status(403).json({ error: "Not authorized for that account." });
      }

      const result = await db.$transaction(async (tx) => {
        const asset = await tx.asset.findUnique({
          where: { id: assetId },
          select: { id: true, accountId: true },
        });

        if (!asset) throw new Error("ASSET_NOT_FOUND");
        if (asset.accountId && asset.accountId !== accountId) {
          throw new Error("ASSET_ALREADY_ASSIGNED");
        }

        const updated = await tx.asset.update({
          where: { id: assetId },
          data: {
            accountId,
            claimedAt: new Date(),
          },
          select: { id: true, accountId: true },
        });

        await tx.ownership.updateMany({
          where: { assetId },
          data: { accountId },
        });

        return updated;
      });

      return res.json({
        success: true,
        assetId: result.id,
        accountId: result.accountId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
      console.error("[ADMIN ASSIGN FAILED]", message);

      if (message === "ASSET_NOT_FOUND") {
        return res.status(404).json({ error: "Asset not found" });
      }

      if (message === "ASSET_ALREADY_ASSIGNED") {
        return res.status(409).json({ error: "Asset already assigned" });
      }

      return res.status(500).json({ error: "Assignment failed" });
    }
  },
);

router.get(
  "/assets",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required." });

      const memberships = await db.accountUser.findMany({
        where: { userId },
        select: { accountId: true },
      });
      const accountIds = memberships.map((membership) => membership.accountId);

      const assets = await db.asset.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { ownership: { userId } },
            ...(accountIds.length ? [{ accountId: { in: accountIds } }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          token: true,
          displayName: true,
          accountId: true,
          merchantId: true,
          category: true,
          status: true,
          paid: true,
          activationMethod: true,
          priceCents: true,
          premiumPriceCents: true,
          totalRevenueCents: true,
          totalScans: true,
          totalUnlocks: true,
          claimedAt: true,
          createdAt: true,
          template: {
            select: { id: true, name: true, slug: true, category: true },
          },
          flows: {
            select: { id: true, flowId: true, createdAt: true },
          },
          ownership: {
            select: {
              id: true,
              status: true,
              accountId: true,
              claimedAt: true,
            },
          },
        },
      });

      return res.json({
        count: assets.length,
        assets,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[ADMIN ASSET LIST FAILED]", error);
      return res.status(500).json({ error: "Unable to load assets" });
    }
  },
);

export default router;
