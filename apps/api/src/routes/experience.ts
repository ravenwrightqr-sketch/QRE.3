/**
 * QRE EXPERIENCE ROUTES
 *
 * API delivery boundary only.
 * Cognition owns interpretation and the WorldModel; API owns persistence.
 */

import { Router } from "express";

import { compileCognitiveExperience } from "@qre/engine";

import { requireAuth } from "../middleware/requireAuth.js";
import { compileExperience } from "../services/experienceService.js";
import {
  buildExperienceMemoryBatch,
  memoryContextToCognitiveSummary,
} from "../services/memoryProjection.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { loadEntityMemory } from "../services/entityMemoryService.js";

const router = Router();

router.post("/compile", requireAuth, async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId : undefined;

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Experience prompt is required.",
      });
    }

    const experience = await compileExperience({
      prompt,
      assetId,
      userId: req.user?.userId,
      memoryRepository: assetId ? createMemoryRepository() : undefined,
    });

    return res.json({
      success: true,
      experience,
    });
  } catch (error) {
    console.error("Experience compile failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to compile experience.",
    });
  }
});

/**
 * GET /experience/memory/:assetId
 *
 * Returns governed long-term memory for the authenticated asset.
 */
router.get("/memory/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    if (!assetId) {
      return res.status(400).json({ success: false, error: "Asset id required." });
    }

    const memory = await createMemoryRepository().loadContext({
      assetId,
      userId: req.user?.userId,
    });

    return res.json({ success: true, memory });
  } catch (error) {
    console.error("Memory load failed:", error);
    return res.status(500).json({ success: false, error: "Failed to load memory." });
  }
});

/**
 * GET /experience/entity/:assetId/:entityName
 *
 * Stable customer/entity memory surface for the future dashboard.
 * Memory remains tenant-scoped by asset; entity names are never global.
 */
router.get("/entity/:assetId/:entityName", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const entityName = String(req.params.entityName ?? "").trim();

    if (!assetId || !entityName) {
      return res.status(400).json({
        success: false,
        error: "Asset id and entity name required.",
      });
    }

    await createMemoryRepository().loadContext({
      assetId,
      userId: req.user?.userId,
    });

    const entity = await loadEntityMemory({ assetId, entityName });

    if (!entity) {
      return res.status(404).json({
        success: false,
        error: "Entity memory not found.",
      });
    }

    return res.json({ success: true, entity });
  } catch (error) {
    console.error("Entity memory load failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load entity memory.",
    });
  }
});

/**
 * POST /experience/memory/:assetId
 *
 * Explicit "remember this" path. The statement is interpreted by the same
 * universal cognition boundary, then projected into durable memory here.
 */
router.post("/memory/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

    if (!assetId || !prompt) {
      return res.status(400).json({
        success: false,
        error: "Asset id and memory prompt are required.",
      });
    }

    const repository = createMemoryRepository();
    const context = await repository.loadContext({
      assetId,
      userId: req.user?.userId,
    });

    const compiled = compileCognitiveExperience(prompt, {
      memorySummary: memoryContextToCognitiveSummary(context),
    });

    const batch = buildExperienceMemoryBatch({
      assetId,
      userId: req.user?.userId,
      world: compiled.world,
      source: "user",
    });

    await repository.writeBatch(batch);

    return res.status(201).json({
      success: true,
      memory: {
        entities: batch.entities.length,
        facts: batch.facts.length,
        relations: batch.relations.length,
        events: batch.events.length,
      },
    });
  } catch (error) {
    console.error("Memory write failed:", error);
    return res.status(500).json({ success: false, error: "Failed to write memory." });
  }
});

export default router;
