import { Router } from "express";
import { randomUUID } from "node:crypto";
import { compileExperience } from "../services/experienceService.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { createStoryDeliveryRepository } from "../repositories/storyDeliveryRepository.js";
import { buildServiceReceipt, createStoryDelivery } from "@qre/engine";
import { requireAuth } from "../middleware/requireAuth.js";
import { db } from "@qre/db";

const router = Router();

type JsonCompatible = string | number | boolean | null | JsonCompatible[] | { [key: string]: JsonCompatible };

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function stringList(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map(clean)
    .filter(Boolean)
    .slice(0, max);
}

function toJson(value: unknown): JsonCompatible {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(toJson);
  }
  if (typeof value === "object") {
    const output: Record<string, JsonCompatible> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = toJson(item);
    }
    return output;
  }
  return String(value);
}

function recipientFrom(value: string) {
  const recipient = clean(value);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return { email: recipient };
  if (/^[+\d][\d\s().-]{6,}$/.test(recipient)) return { phone: recipient };
  return undefined;
}

router.post("/create", requireAuth, async (req, res) => {
  try {
    const assetId = clean(req.body?.assetId);
    const recipient = clean(req.body?.recipient);
    const service = clean(req.body?.service);
    const facts = stringList(req.body?.facts, 12);
    const funny = clean(req.body?.funny);
    const odd = clean(req.body?.odd);
    const different = clean(req.body?.different);
    const notes = clean(req.body?.notes);
    const mediaUrls = stringList(req.body?.mediaUrls, 8);
    const geo = req.body?.geo && typeof req.body?.geo === "object"
      ? req.body.geo as Record<string, unknown>
      : undefined;
    const userId = req.user?.userId;

    if (!assetId || !recipient || !userId) {
      return res.status(400).json({ success: false, error: "Asset, recipient, and authenticated user are required." });
    }

    const accountIds = (await db.accountUser.findMany({
      where: { userId },
      select: { accountId: true },
    })).map((row) => row.accountId);

    const asset = await db.asset.findFirst({
      where: {
        id: assetId,
        status: "active",
        OR: [
          { ownerId: userId },
          ...(accountIds.length ? [{ accountId: { in: accountIds } }] : []),
        ],
      },
      select: { id: true, slug: true, category: true },
    });

    if (!asset) {
      return res.status(404).json({ success: false, error: "Active QRE asset not found or not owned by this account." });
    }

    const sessionId = randomUUID();
    const prompt = [
      service ? `Service: ${service}.` : "Service completed.",
      ...facts.map((value) => `Observed: ${value}.`),
      funny ? `Anything funny: ${funny}.` : "",
      odd ? `Anything odd: ${odd}.` : "",
      different ? `Anything different: ${different}.` : "",
      notes ? `Additional notes: ${notes}.` : "",
      mediaUrls.length ? `Media attached by the service provider: ${mediaUrls.join(" | ")}.` : "",
      "Create a short customer-facing cinematic service receipt film. Stay anchored to supplied reality. Discover the strongest memorable meaning without inventing concrete events.",
    ].filter(Boolean).join("\n");

    const experience = await compileExperience({
      assetId: asset.id,
      userId,
      prompt,
      sessionId,
      operationId: `service-receipt:${sessionId}`,
      memoryRepository: createMemoryRepository(),
      movieMode: true,
      geoAnchor: geo && typeof geo.latitude === "number" && typeof geo.longitude === "number"
        ? {
            latitude: geo.latitude,
            longitude: geo.longitude,
            label: typeof geo.label === "string" ? geo.label : undefined,
            city: typeof geo.city === "string" ? geo.city : undefined,
            region: typeof geo.region === "string" ? geo.region : undefined,
            country: typeof geo.country === "string" ? geo.country : undefined,
            role: "physical_site",
            source: "service-receipt",
          }
        : undefined,
    });

    const receipt = buildServiceReceipt({
      asset: { ...asset, experience: { title: experience.title, sourcePrompt: prompt } },
      sessionId,
      moments: experience.moments,
    });

    const delivery = await createStoryDelivery({
      assetId: asset.id,
      sessionId,
      userId,
      recipient: recipientFrom(recipient),
      moments: experience.moments as any,
      geoStory: experience.geoStory as any,
      cinematicScenes: experience.cinematicScenes as any,
    }, createStoryDeliveryRepository());

    await db.scanSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        endedAt: new Date(),
        moments: toJson(experience.moments) as any,
        geoStory: toJson(experience.geoStory) as any,
        cinematicScenes: toJson(experience.cinematicScenes) as any,
        memorySnapshot: toJson(experience.memorySnapshot) as any,
        receipt: toJson(receipt) as any,
      },
    });

    return res.status(201).json({
      success: true,
      sessionId,
      recipient,
      shareUrl: delivery.shareUrl,
      delivered: delivery.delivered,
      deliveryReason: delivery.reason,
      receipt,
      experience,
    });
  } catch (error) {
    console.error("Service receipt creation failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create service receipt.",
      details: process.env.NODE_ENV === "production" ? undefined : error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/share/:id", async (req, res) => {
  try {
    const id = clean(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Share id required." });

    const snapshot = await db.memorySnapshot.findUnique({
      where: { id },
      select: {
        id: true,
        assetId: true,
        sessionId: true,
        createdAt: true,
        dominantLayer: true,
        dropOffPoints: true,
        asset: { select: { slug: true, displayName: true } },
      },
    });

    if (!snapshot) return res.status(404).json({ success: false, error: "Experience not found." });
    return res.json({ success: true, share: snapshot });
  } catch (error) {
    console.error("Service receipt share lookup failed:", error);
    return res.status(500).json({ success: false, error: "Failed to load shared experience." });
  }
});

export default router;
