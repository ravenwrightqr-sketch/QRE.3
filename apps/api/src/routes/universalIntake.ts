import { Router } from "express";
import { Prisma } from "@prisma/client";
import { db } from "@qre/db";
import { requireAuth } from "../middleware/requireAuth.js";
import { buildCreativeSeedPlan } from "../services/creativeSeedEngine.js";
import { loadEntityMemory } from "../services/entityMemoryService.js";

const router = Router();

router.post("/plan", requireAuth, async (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "Creation intent required." });
    return res.json({ plan: await buildCreativeSeedPlan(prompt) });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "Creation planning failed." });
  }
});

router.get("/contexts/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const userId = req.user?.userId;
    if (!assetId || !userId) return res.status(400).json({ error: "Asset context required." });

    const asset = await db.asset.findFirst({
      where: {
        id: assetId,
        OR: [
          { ownerId: userId },
          { account: { AccountUser: { some: { userId } } } },
        ],
      },
      select: { id: true },
    });
    if (!asset) return res.status(403).json({ error: "Asset access denied." });

    const entities = await db.$queryRaw<any[]>(Prisma.sql`
      SELECT e.id, e.kind, e.name, e.canonical_key, e.updated_at,
             COUNT(DISTINCT f.id)::int AS fact_count,
             COUNT(DISTINCT ev.id)::int AS event_count
      FROM "qre_memory_entity" e
      LEFT JOIN "qre_memory_fact" f
        ON f."entity_id" = e.id AND f."asset_id" = e."asset_id" AND f."status" = 'active'
      LEFT JOIN "qre_memory_event" ev
        ON ev."asset_id" = e."asset_id" AND ev."entity_ids" @> jsonb_build_array(e.id)
      WHERE e."asset_id" = ${assetId}
      GROUP BY e.id
      ORDER BY e.updated_at DESC
      LIMIT 100
    `);

    const experiences = await db.experience.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, createdAt: true, blueprint: true },
    });

    return res.json({
      contexts: entities.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        canonicalKey: entity.canonical_key,
        updatedAt: new Date(entity.updated_at).toISOString(),
        factCount: Number(entity.fact_count ?? 0),
        eventCount: Number(entity.event_count ?? 0),
        experienceCount: experiences.filter((experience) => {
          const blueprint = experience.blueprint as any;
          return blueprint?.memory?.entity?.id === entity.id || blueprint?.memory?.entity?.canonicalKey === entity.canonical_key;
        }).length,
      })),
    });
  } catch (error) {
    console.error("Universal context load failed", error);
    return res.status(500).json({ error: "Creation contexts unavailable." });
  }
});

router.get("/contexts/:assetId/:entityName", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const entityName = String(req.params.entityName ?? "").trim();
    if (!assetId || !entityName) return res.status(400).json({ error: "Context required." });
    const entity = await loadEntityMemory({ assetId, entityName });
    if (!entity) return res.status(404).json({ error: "Context not found." });
    return res.json({ context: entity });
  } catch (error) {
    console.error("Universal entity context failed", error);
    return res.status(500).json({ error: "Context unavailable." });
  }
});

export default router;
