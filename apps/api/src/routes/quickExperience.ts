import express from "express";
import { db } from "@qre/db";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import type {
  CreationReceiver,
  MediaAsset,
} from "@qre/contracts";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { createExperience } from "../services/experienceCreationServices.js";

const router = express.Router();

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseReceiver(value: unknown): CreationReceiver | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const email = clean(record.email);
  const phone = clean(record.phone);

  if (!email && !phone) return undefined;

  return {
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

function parseMedia(value: unknown): MediaAsset[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((entry): MediaAsset[] => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return [];
      }

      const record = entry as Record<string, unknown>;
      const id = clean(record.id);
      const url = clean(record.url);
      const type = record.type;

      if (
        !id ||
        !url ||
        (type !== "image" && type !== "video")
      ) {
        return [];
      }

      const metadata =
        record.metadata &&
        typeof record.metadata === "object" &&
        !Array.isArray(record.metadata)
          ? (record.metadata as Record<string, unknown>)
          : undefined;

      return [
        {
          id,
          type,
          url,
          ...(typeof record.thumbnail === "string"
            ? { thumbnail: record.thumbnail }
            : {}),
          ...(typeof record.title === "string"
            ? { title: record.title }
            : {}),
          ...(typeof record.caption === "string"
            ? { caption: record.caption }
            : {}),
          ...(typeof record.duration === "number" &&
          Number.isFinite(record.duration)
            ? { duration: record.duration }
            : {}),
          ...(typeof record.provider === "string"
            ? { provider: record.provider }
            : {}),
          ...(metadata ? { metadata } : {}),
        },
      ];
    })
    .slice(0, 20);
}

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const prompt = clean(req.body?.prompt);
    const displayName = clean(req.body?.displayName) || "Quick Experience";
    const accountId = clean(req.body?.accountId);
    const receiver = parseReceiver(req.body?.receiver);
    const media = parseMedia(req.body?.media);
    const playoutMode =
      req.body?.playoutMode === "operational" ||
      req.body?.playoutMode === "receipt"
        ? "operational"
        : "experience";

    if (!userId || !prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt required.",
      });
    }

    const memberships = await db.accountUser.findMany({
      where: { userId },
      select: { accountId: true },
      orderBy: { accountId: "asc" },
    });

    if (!memberships.length) {
      return res.status(400).json({
        success: false,
        error: "User has no account.",
      });
    }

    const membership = accountId
      ? memberships.find((item) => item.accountId === accountId)
      : memberships.length === 1
        ? memberships[0]
        : undefined;

    if (!membership) {
      return res.status(409).json({
        success: false,
        error: "Account selection required.",
        accounts: memberships,
      });
    }

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
        displayName,
        accountId: membership.accountId,
        status: "active",
        paid: false,
        priceCents: 599,
      },
    });

    const creation = await createExperience({
      assetId: asset.id,
      prompt,
      title: clean(req.body?.title) || undefined,
      userId,
      playoutMode,
      sponsor: req.body?.sponsor,
      receiver,
      media,
    });

    return res.status(201).json({
      success: true,
      asset: {
        id: asset.id,
        slug: asset.slug,
        qrUrl: asset.qrUrl,
        qrSvg: asset.qrSvg,
        displayName: asset.displayName,
      },
      experience: creation,
      handoff: {
        scanUrl: qrUrl,
        shareUrl: creation.delivery.shareUrl,
        delivered: creation.delivery.delivered,
        deliveryReason: creation.delivery.reason,
        shareable: true,
        onePass: true,
      },
    });
  } catch (error) {
    console.error("Quick experience creation failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create quick experience.",
    });
  }
});

export default router;
