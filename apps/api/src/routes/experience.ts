/** QRE EXPERIENCE ROUTES: authoring, memory, recommendation, cognition. */

import { Router } from "express";
import { randomUUID } from "node:crypto";
import { compileCognitiveExperience, recommendMemories, resolveGeoLabel } from "@qre/engine";
import { requireAuth } from "../middleware/requireAuth.js";
import { compileExperience, type GeoAnchorInput } from "../services/experienceService.js";
import { buildExperienceMemoryBatch, memoryContextToCognitiveSummary } from "../services/memoryProjection.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { createPresenceRepository } from "../repositories/presenceRepository.js";
import { loadEntityMemory } from "../services/entityMemoryService.js";

const router = Router();

function parseGeoAnchor(raw: unknown): GeoAnchorInput | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const value = raw as Record<string, unknown>;
  const latitude = typeof value.latitude === "number" ? value.latitude : undefined;
  const longitude = typeof value.longitude === "number" ? value.longitude : undefined;
  const label = typeof value.label === "string" ? value.label.trim() : undefined;
  const time = typeof value.time === "string" ? value.time.trim() : undefined;
  if (latitude === undefined || longitude === undefined) return undefined;
  const role = value.role === "physical_site" || value.role === "experience_place" || value.role === "event_venue" || value.role === "memory_place" || value.role === "reference_place"
    ? value.role
    : "experience_place";
  return {
    latitude,
    longitude,
    label,
    time,
    role,
    source: typeof value.source === "string" ? value.source : "dashboard",
  };
}

async function enrichGeo(anchor: GeoAnchorInput): Promise<GeoAnchorInput> {
  if (anchor.label && anchor.city) return anchor;
  const resolved = await resolveGeoLabel(anchor.latitude!, anchor.longitude!);
  return {
    ...anchor,
    label: anchor.label || resolved.label || undefined,
    city: anchor.city || resolved.city || undefined,
    region: anchor.region || resolved.region || undefined,
    country: anchor.country || resolved.country || undefined,
  };
}

router.post("/compile", requireAuth, async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId : undefined;
    const rawGeo = parseGeoAnchor(req.body?.geo);
    if (typeof prompt !== "string" || prompt.trim().length === 0) return res.status(400).json({ success: false, error: "Experience prompt is required." });

    const geo = rawGeo ? await enrichGeo(rawGeo) : undefined;
    const experience = await compileExperience({
      prompt,
      assetId,
      userId: req.user?.userId,
      memoryRepository: assetId ? createMemoryRepository() : undefined,
      geoAnchor: geo,
    });

    if (assetId && geo?.latitude !== undefined && geo.longitude !== undefined) {
      const sessionId = randomUUID();
      await createPresenceRepository().createGeoProof({
        assetId,
        sessionId,
        userId: req.user?.userId,
        lat: geo.latitude,
        lng: geo.longitude,
        source: `authoring:${geo.role ?? "experience_place"}`,
        label: geo.label,
        city: geo.city,
        region: geo.region,
        country: geo.country,
      });
    }

    return res.json({ success: true, experience, geo: geo ?? null });
  } catch (error) {
    console.error("Experience compile failed:", error);
    return res.status(500).json({ success: false, error: "Failed to compile experience." });
  }
});

router.get("/memory/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    if (!assetId) return res.status(400).json({ success: false, error: "Asset id required." });
    const memory = await createMemoryRepository().loadContext({ assetId, userId: req.user?.userId });
    return res.json({ success: true, memory });
  } catch (error) {
    console.error("Memory load failed:", error);
    return res.status(500).json({ success: false, error: "Failed to load memory." });
  }
});

router.get("/memory/:assetId/recommendations", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const prompt = typeof req.query?.prompt === "string" ? req.query.prompt : "";
    const repository = createMemoryRepository();
    const memory = await repository.loadContext({ assetId, userId: req.user?.userId });
    return res.json({ success: true, recommendations: recommendMemories(memory, prompt) });
  } catch (error) {
    console.error("Memory recommendation failed:", error);
    return res.status(500).json({ success: false, error: "Failed to recommend memories." });
  }
});

router.get("/entity/:assetId/:entityName", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const entityName = String(req.params.entityName ?? "").trim();
    if (!assetId || !entityName) return res.status(400).json({ success: false, error: "Asset id and entity name required." });
    await createMemoryRepository().loadContext({ assetId, userId: req.user?.userId });
    const entity = await loadEntityMemory({ assetId, entityName });
    if (!entity) return res.status(404).json({ success: false, error: "Entity memory not found." });
    return res.json({ success: true, entity });
  } catch (error) {
    console.error("Entity memory load failed:", error);
    return res.status(500).json({ success: false, error: "Failed to load entity memory." });
  }
});

router.post("/memory/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!assetId || !prompt) return res.status(400).json({ success: false, error: "Asset id and memory prompt are required." });

    const repository = createMemoryRepository();
    const context = await repository.loadContext({ assetId, userId: req.user?.userId });
    const compiled = compileCognitiveExperience(prompt, {
      memorySummary: memoryContextToCognitiveSummary(context),
      feedback: { accepted: ["memory-update"], rejected: [] },
    });
    const batch = buildExperienceMemoryBatch({ assetId, userId: req.user?.userId, world: compiled.world, source: "user" });
    await repository.writeBatch(batch);

    const updated = await repository.loadContext({ assetId, userId: req.user?.userId });
    return res.status(201).json({
      success: true,
      memory: { entities: batch.entities.length, facts: batch.facts.length, relations: batch.relations.length, events: batch.events.length },
      recommendations: recommendMemories(updated, prompt),
      interpretation: { prompt, places: compiled.world.places, participants: compiled.world.participants, events: compiled.world.events.length },
    });
  } catch (error) {
    console.error("Memory write failed:", error);
    return res.status(500).json({ success: false, error: "Failed to write memory." });
  }
});

export default router;
