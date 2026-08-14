import express from "express";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { aiConfigured, analyzeImageForKnowledge, generateAiExperienceDraft } from "../services/aiProvider.js";

const router = express.Router();

router.get("/status", requireAuth, async (_req, res) => {
  return res.json({ configured: aiConfigured(), provider: aiConfigured() ? "openai" : null });
});

router.post("/write", requireAuth, async (req: AuthRequest, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "Prompt required." });
    if (!aiConfigured()) return res.status(503).json({ error: "Generative author is not configured." });
    const draft = await generateAiExperienceDraft({
      prompt,
      lens: typeof req.body?.lens === "string" ? req.body.lens : undefined,
      sourceMoments: Array.isArray(req.body?.sourceMoments) ? req.body.sourceMoments.filter((value: unknown): value is string => typeof value === "string") : [],
      facts: Array.isArray(req.body?.facts) ? req.body.facts.filter((value: unknown): value is string => typeof value === "string") : [],
      memoryContext: Array.isArray(req.body?.memoryContext) ? req.body.memoryContext.filter((value: unknown): value is string => typeof value === "string") : [],
      audience: typeof req.body?.audience === "string" ? req.body.audience : undefined,
    });
    return res.json({ draft });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "AI author failed." });
  }
});

router.post("/vision", requireAuth, async (req: AuthRequest, res) => {
  try {
    const imageDataUrl = typeof req.body?.imageDataUrl === "string" ? req.body.imageDataUrl : "";
    const category = typeof req.body?.category === "string" ? req.body.category : undefined;
    if (!imageDataUrl.startsWith("data:image/")) return res.status(400).json({ error: "A data:image/* URL is required." });
    if (imageDataUrl.length > 2_500_000) return res.status(413).json({ error: "Image is too large for direct analysis." });
    if (!aiConfigured()) return res.status(503).json({ error: "Vision analysis is not configured." });
    const facts = await analyzeImageForKnowledge(imageDataUrl, category);
    return res.json({ facts });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "Vision analysis failed." });
  }
});

export default router;
