import express from "express";
import { db } from "@qre/db";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { createExperience } from "../services/experienceCreationServices.js";

const router = express.Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "Quick Experience";
    const accountId = typeof req.body?.accountId === "string" ? req.body.accountId.trim() : "";

    if (!userId || !prompt) return res.status(400).json({ success: false, error: "Prompt required." });

    const memberships = await db.accountUser.findMany({ where: { userId }, select: { accountId: true }, orderBy: { accountId: "asc" } });
    if (!memberships.length) return res.status(400).json({ success: false, error: "User has no account." });
    const membership = accountId ? memberships.find((item) => item.accountId === accountId) : memberships.length === 1 ? memberships[0] : undefined;
    if (!membership) return res.status(409).json({ success: false, error: "Account selection required.", accounts: memberships });

    const slug = nanoid(10);
    const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3000";
    const qrUrl = `${baseUrl}/s/${slug}`;
    const qrSvg = await QRCode.toString(qrUrl, { type: "svg", errorCorrectionLevel: "H", margin: 1, scale: 6 });

    const asset = await db.asset.create({ data: { slug, qrUrl, qrSvg, displayName, accountId: membership.accountId, status: "active", paid: false, priceCents: 599 } });
    const experience = await createExperience({
      assetId: asset.id,
      prompt,
      title: typeof req.body?.title === "string" ? req.body.title.trim() : undefined,
      userId,
      sponsor: req.body?.sponsor,
    });

    return res.status(201).json({
      success: true,
      asset: { id: asset.id, slug: asset.slug, qrUrl: asset.qrUrl, qrSvg: asset.qrSvg, displayName: asset.displayName },
      experience,
      handoff: { scanUrl: qrUrl, shareable: true, onePass: true },
    });
  } catch (error) {
    console.error("Quick experience creation failed:", error);
    return res.status(500).json({ success: false, error: "Failed to create quick experience." });
  }
});

export default router;
