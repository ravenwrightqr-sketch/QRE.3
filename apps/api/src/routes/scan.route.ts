import { Response } from "express";

import { scanEngine } from "@qre/engine";

import {
  createAssetRepository,
} from "../repositories/assetRepository.js";

import {
  createSessionRepository,
} from "../repositories/sessionRepository.js";

import {
  createAccessRepository,
} from "../repositories/accessRepository.js";

import {
  createAnalyticsRepository,
} from "../repositories/analyticsRepository.js";

import {
  createStoryDeliveryRepository,
} from "../repositories/storyDeliveryRepository.js";

import {
  createMemoryRepository,
} from "../repositories/memoryRepository.js";

import { buildScanMemoryBatch } from "../services/memoryProjection.js";

import type {
  AuthRequest,
} from "../middleware/requireAuth.js";

function getString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export async function scanRoute(req: AuthRequest, res: Response) {
  try {
    const slug = getString(req.params.slug);

    if (!slug) {
      return res.status(400).json({ error: "Invalid slug" });
    }

    const lat = getNumber(req.query.lat);
    const lng = getNumber(req.query.lng);
    const accuracy = getNumber(req.query.accuracy);

    const geo =
      lat !== undefined && lng !== undefined
        ? { lat, lng, accuracy }
        : undefined;

    const userId = req.user?.userId;

    const assetRepository = createAssetRepository();
    const sessionRepository = createSessionRepository();
    const analyticsRepository = createAnalyticsRepository();
    const accessRepository = createAccessRepository();
    const storyDeliveryRepository = createStoryDeliveryRepository();

    const result = await scanEngine(
      { slug, userId, geo },
      {
        assetRepository,
        sessionRepository,
        analyticsRepository,
        accessRepository,
        storyDeliveryRepository,
      },
    );

    // Scans become immutable episodic memory. This is deliberately a separate
    // write path from factual memory so runtime behavior cannot masquerade as
    // a new truth about the world.
    if (result.asset?.id) {
      try {
        const memoryRepository = createMemoryRepository();
        await memoryRepository.writeBatch(
          buildScanMemoryBatch({
            assetId: result.asset.id,
            experience: result,
            userId,
          }),
        );
      } catch (memoryError) {
        // Memory must never make the scan itself unavailable.
        console.error("Scan memory consolidation failed:", memoryError);
      }
    }

    return res.json(result);
  } catch (e: any) {
    console.error("SCANNED EXPERIENCE FAILED", e);
    return res.status(500).json({ error: e.message });
  }
}
