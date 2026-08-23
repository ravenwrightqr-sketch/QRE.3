import { Router } from "express";
import { compileCognitiveExperience } from "@qre/engine";
import { requireAuth } from "../middleware/requireAuth.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { persistAuthorLearning } from "../services/authorLearningLoop.js";
import { memoryContextToCognitiveSummary } from "../services/memoryProjection.js";

const router = Router();
const analyticsRepository = createAnalyticsRepository();

router.get("/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    if (!assetId) return res.status(400).json({ success: false, error: "Asset id required." });
    const memoryRepository = createMemoryRepository();
    const memory = await memoryRepository.loadContext({ assetId, userId: req.user?.userId });
    return res.json({ success: true, memory });
  } catch (error) {
    console.error("[QRE][COLLECT] load failed", error);
    return res.status(500).json({ success: false, error: "Failed to load collected data." });
  }
});

router.post("/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const kind = typeof req.body?.kind === "string" ? req.body.kind.trim() : "event";
    if (!assetId || !text) return res.status(400).json({ success: false, error: "Asset id and data are required." });

    const prompt = `${kind}: ${text}`;
    const memoryRepository = createMemoryRepository();
    const context = await memoryRepository.loadContext({ assetId, userId: req.user?.userId });
    const compiled = compileCognitiveExperience(prompt, {
      memorySummary: memoryContextToCognitiveSummary(context),
      feedback: { accepted: ["memory-update"], rejected: [] },
    });

    const learning = await persistAuthorLearning(
      {
        assetId,
        userId: req.user?.userId,
        prompt,
        source: "user",
        world: compiled.world,
      },
      { memoryRepository, analyticsRepository },
    );

    const memory = await memoryRepository.loadContext({ assetId, userId: req.user?.userId });
    return res.status(201).json({ success: true, memory, learning: { analyticsType: learning.analyticsType, observedAt: learning.observedAt } });
  } catch (error) {
    console.error("[QRE][COLLECT] write failed", error);
    return res.status(500).json({ success: false, error: "Failed to collect data." });
  }
});

export default router;
