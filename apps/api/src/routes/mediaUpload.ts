import express from "express";
import { nanoid } from "nanoid";
import { db } from "@qre/db";
import type { MediaAsset } from "@qre/contracts";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";

const router = express.Router();

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extensionFor(contentType: string): string | undefined {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };

  return extensions[contentType];
}

function mediaTypeFor(contentType: string): MediaAsset["type"] | undefined {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return undefined;
}

function storageConfig() {
  const url = clean(process.env.SUPABASE_URL).replace(/\/$/, "");
  const key =
    clean(process.env.SUPABASE_SECRET_KEY) ||
    clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = clean(process.env.SUPABASE_MEDIA_BUCKET) || "qre-media";

  if (!url || !key) {
    throw new Error(
      "Supabase media storage is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.",
    );
  }

  return { url, key, bucket };
}

function encodedObjectPath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

router.post(
  "/upload",
  requireAuth,
  express.raw({
    type: ["image/*", "video/*"],
    limit: MAX_UPLOAD_BYTES,
  }),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const assetId = clean(req.headers["x-qre-asset-id"]);
      const contentType = clean(req.headers["content-type"]).toLowerCase();
      const originalName = clean(req.headers["x-qre-file-name"]);
      const mediaType = mediaTypeFor(contentType);
      const extension = extensionFor(contentType);
      const bytes = Buffer.isBuffer(req.body) ? req.body : undefined;

      if (!userId || !assetId) {
        return res.status(400).json({
          success: false,
          error: "Asset and authenticated user are required.",
        });
      }

      if (!mediaType || !extension) {
        return res.status(415).json({
          success: false,
          error: "Unsupported media type.",
        });
      }

      if (!bytes?.length) {
        return res.status(400).json({
          success: false,
          error: "Media file is empty.",
        });
      }

      if (bytes.length > MAX_UPLOAD_BYTES) {
        return res.status(413).json({
          success: false,
          error: "Media file exceeds the 25 MB upload limit.",
        });
      }

      const accountIds = (
        await db.accountUser.findMany({
          where: { userId },
          select: { accountId: true },
        })
      ).map((row) => row.accountId);

      const asset = await db.asset.findFirst({
        where: {
          id: assetId,
          status: "active",
          OR: [
            { ownerId: userId },
            ...(accountIds.length
              ? [{ accountId: { in: accountIds } }]
              : []),
          ],
        },
        select: { id: true },
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: "Active QRE asset not found or not owned by this account.",
        });
      }

      const { url, key, bucket } = storageConfig();
      const mediaId = nanoid(18);
      const objectPath = `${asset.id}/${mediaId}.${extension}`;
      const encodedPath = encodedObjectPath(objectPath);

      const uploadResponse = await fetch(
        `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`,
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": contentType,
            "Cache-Control": "3600",
            "x-upsert": "false",
          },
          body: new Uint8Array(bytes),
        },
      );

      if (!uploadResponse.ok) {
        const detail = await uploadResponse.text().catch(() => "");
        console.error("Supabase media upload failed:", {
          status: uploadResponse.status,
          detail,
        });

        return res.status(502).json({
          success: false,
          error: "Media storage upload failed.",
        });
      }

      const publicUrl = `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
      const media: MediaAsset = {
        id: mediaId,
        type: mediaType,
        url: publicUrl,
        provider: "supabase-storage",
        metadata: {
          assetId: asset.id,
          storageBucket: bucket,
          storagePath: objectPath,
          ...(originalName ? { originalName } : {}),
        },
      };

      return res.status(201).json({
        success: true,
        media,
      });
    } catch (error) {
      console.error("Media upload failed:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Media upload failed.",
      });
    }
  },
);

export default router;
