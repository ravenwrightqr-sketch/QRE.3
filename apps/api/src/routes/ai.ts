import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { aiConfigured, aiProviderName, analyzeImageForKnowledge, generateAiExperienceDraft } from "../services/aiProvider.js";
import { getCreativeLearningContext, learningContextLines, recordCreativeFeedback } from "../services/creativeLearning.js";
import { buildCreativeSeedPlan } from "../services/creativeSeedEngine.js";

const router = express.Router();

router.get("/status", requireAuth, async (_req, res) => {
  return res.json({ configured: aiConfigured(), provider: aiProviderName() });
});

router.post("/seeds", requireAuth, async (req: AuthRequest, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "Prompt required." });
    const plan = await buildCreativeSeedPlan(prompt);
    return res.json({ plan });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "Creative seed planning failed." });
  }
});

router.post("/write", requireAuth, async (req: AuthRequest, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "Prompt required." });
    if (!aiConfigured()) return res.status(503).json({ error: "Generative author is not configured." });

    let creativeLearningContext: string[] = [];
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId : "";
    if (assetId) {
      const learning = await getCreativeLearningContext({ assetId, userId: req.user?.userId });
      creativeLearningContext = learningContextLines(learning);
    }

    const draft = await generateAiExperienceDraft({
      prompt,
      lens: typeof req.body?.lens === "string" ? req.body.lens : undefined,
      sourceMoments: Array.isArray(req.body?.sourceMoments) ? req.body.sourceMoments.filter((value: unknown): value is string => typeof value === "string") : [],
      facts: Array.isArray(req.body?.facts) ? req.body.facts.filter((value: unknown): value is string => typeof value === "string") : [],
      memoryContext: Array.isArray(req.body?.memoryContext) ? req.body.memoryContext.filter((value: unknown): value is string => typeof value === "string") : [],
      creativeLearningContext,
      audience: typeof req.body?.audience === "string" ? req.body.audience : undefined,
    });
    return res.json({ draft, learningSignals: creativeLearningContext.slice(0, 30) });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "AI author failed." });
  }
});

router.post("/feedback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const draft = typeof req.body?.draft === "string" ? req.body.draft.trim() : "";
    const decision = req.body?.decision;
    if (!assetId || !prompt || !draft) return res.status(400).json({ error: "assetId, prompt, and draft required." });
    if (!["accepted", "rejected", "selected"].includes(decision)) {
      return res.status(400).json({ error: "decision must be accepted, rejected, or selected." });
    }

    const asset = await db.asset.findUnique({ where: { id: assetId }, select: { id: true, ownerId: true, accountId: true } });
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const ownsAsset = asset.ownerId === userId;
    const accountMembership = asset.accountId
      ? await db.accountUser.findFirst({ where: { accountId: asset.accountId, userId }, select: { id: true } })
      : null;
    if (!ownsAsset && !accountMembership) return res.status(403).json({ error: "Asset access denied." });

    await recordCreativeFeedback({
      assetId,
      userId,
      prompt,
      draft,
      decision,
      feedback: typeof req.body?.feedback === "string" ? req.body.feedback : undefined,
      styleTags: Array.isArray(req.body?.styleTags) ? req.body.styleTags.filter((value: unknown): value is string => typeof value === "string") : undefined,
      trajectory: typeof req.body?.trajectory === "string" ? req.body.trajectory : undefined,
      score: typeof req.body?.score === "number" ? req.body.score : undefined,
    });

    return res.json({ success: true, learned: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Creative feedback could not be recorded." });
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
