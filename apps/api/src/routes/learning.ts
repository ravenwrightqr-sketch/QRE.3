import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { safeStringParam } from "../lib/safeParam.js";
import { getCreativeLearningContext, learningContextLines } from "../services/creativeLearning.js";
import { userHasAssetAccess } from "../services/assetAccess.js";

const router = express.Router();

async function ownedAsset(slug: string, userId: string) {
  const asset = await db.asset.findUnique({
    where: { slug },
    select: { id: true, slug: true, displayName: true },
  });
  if (!asset) return null;
  return (await userHasAssetAccess(asset.id, userId)) ? asset : null;
}

router.get("/:slug", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = safeStringParam(req.params.slug);
    const userId = req.user?.userId;
    if (!slug || !userId) return res.status(400).json({ error: "Missing asset." });

    const asset = await ownedAsset(slug, userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const [events, knowledge, geo, learning] = await Promise.all([
      db.analyticsEvent.findMany({
        where: { assetId: asset.id },
        orderBy: { createdAt: "desc" },
        take: 400,
        select: { id: true, type: true, meta: true, createdAt: true, sessionId: true, flowId: true },
      }),
      db.insight.findMany({
        where: { assetId: asset.id },
        orderBy: { createdAt: "desc" },
        take: 250,
        select: { id: true, type: true, message: true, impact: true, createdAt: true },
      }),
      db.geoProof.findMany({
        where: { assetId: asset.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, lat: true, lng: true, label: true, city: true, region: true, country: true, source: true, createdAt: true },
      }),
      getCreativeLearningContext({ assetId: asset.id, userId, limit: 120 }),
    ]);

    const eventCounts = Object.fromEntries(
      [...new Set(events.map((event) => event.type))].map((type) => [type, events.filter((event) => event.type === type).length]),
    );

    const creativeAccepted = eventCounts.AI_CREATIVE_ACCEPTED ?? 0;
    const creativeRejected = eventCounts.AI_CREATIVE_REJECTED ?? 0;
    const creativeSelected = eventCounts.AI_VARIATION_SELECTED ?? 0;
    const creativeDecisions = creativeAccepted + creativeRejected + creativeSelected;

    const memoryEvents = events.filter((event) => ["MEMORY_CREATED", "MEMORY_UPDATED", "AI_MEMORY_LEARNED", "AI_MEMORY_USED", "AI_MEMORY_RECOMMENDED", "MEMORY_RECOMMENDATION_VIEWED", "MEMORY_RECOMMENDATION_SELECTED"].includes(event.type));
    const experienceEvents = events.filter((event) => ["SCAN", "SESSION_START", "SESSION_END", "FLOW_START", "FLOW_STEP", "FLOW_COMPLETE", "FLOW_ABANDON", "EXPERIENCE_REPLAY", "EXPERIENCE_SHARED", "EXPERIENCE_SAVED"].includes(event.type));

    const days = new Map<string, { events: number; scans: number; completions: number; creative: number }>();
    for (const event of events) {
      const day = event.createdAt.toISOString().slice(0, 10);
      const row = days.get(day) ?? { events: 0, scans: 0, completions: 0, creative: 0 };
      row.events += 1;
      if (event.type === "SCAN") row.scans += 1;
      if (event.type === "FLOW_COMPLETE") row.completions += 1;
      if (["AI_CREATIVE_ACCEPTED", "AI_CREATIVE_REJECTED", "AI_VARIATION_SELECTED"].includes(event.type)) row.creative += 1;
      days.set(day, row);
    }

    return res.json({
      asset,
      overview: {
        eventCount: events.length,
        uniqueEventTypes: Object.keys(eventCounts).length,
        knowledgeCount: knowledge.length,
        locationCount: geo.length,
        memoryEventCount: memoryEvents.length,
        experienceEventCount: experienceEvents.length,
        creativeDecisions,
        creativeAccepted,
        creativeRejected,
        creativeSelected,
        creativeAcceptanceRate: creativeDecisions > 0 ? creativeAccepted / creativeDecisions : 0,
      },
      eventCounts,
      learned: {
        ...learning,
        lines: learningContextLines(learning),
      },
      knowledge,
      locations: geo,
      recentEvents: events.slice(0, 80),
      daily: [...days.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 60).map(([date, values]) => ({ date, ...values })),
    });
  } catch (error) {
    console.error("Learning dashboard load failed:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Learning dashboard failed." });
  }
});

export default router;
