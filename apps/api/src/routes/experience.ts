/**
 * QRE EXPERIENCE COMPILE ROUTE
 *
 * Human Prompt
 *      ↓
 * Durable Memory Context
 *      ↓
 * Cognitive Compiler
 *      ↓
 * Experience Blueprint
 *      ↓
 * Memory Consolidation
 *
 * API delivery boundary only. The engine remains database-agnostic.
 */

import { Router } from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { compileExperience } from "../services/experienceService.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";

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

export default router;
