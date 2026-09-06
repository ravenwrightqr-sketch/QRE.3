import express from "express";
import { db } from "@qre/db";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { aiConfigured, aiProviderName, analyzeImageForKnowledge } from "../services/aiProvider.js";
import { recordCreativeFeedback } from "../services/creativeLearning.js";
import { findNextInformation } from "../services/authorInformationFinder.js";

const router = express.Router();

router.get("/status", requireAuth, async (_req, res) => {
  return res.json({ configured: aiConfigured(), provider: aiProviderName() });
});

router.post("/feedback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const draft = typeof req.body?.draft === "string" ? req.body.draft.trim() : "";
    const decision = req.body?.decision;
    if (!assetId || !prompt || !draft) return res.status(400).json({ error: "assetId, prompt, and draft required." });
    if (!["accepted", "rejected", "selected"].includes(decision)) return res.status(400).json({ error: "decision must be accepted, rejected, or selected." });
    const asset = await db.asset.findUnique({ where: { id: assetId }, select: { id: true, ownerId: true, accountId: true } });
    if (!asset) return res.status(404).json({ error: "Asset not found." });
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const ownsAsset = asset.ownerId === userId;
    const accountMembership = asset.accountId ? await db.accountUser.findFirst({ where: { accountId: asset.accountId, userId }, select: { id: true } }) : null;
    if (!ownsAsset && !accountMembership) return res.status(403).json({ error: "Asset access denied." });
    await recordCreativeFeedback({
      assetId, userId, prompt, draft, decision,
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

router.post("/finder", requireAuth, async (req: AuthRequest, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "Prompt is required." });
    const accountType = req.body?.accountType === "business" ? "business" : "consumer";
    const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : undefined;
    const knownQuestions = Array.isArray(req.body?.knownQuestions)
      ? req.body.knownQuestions.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const result = await findNextInformation({ prompt, subject, accountType, knownQuestions });
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Information finder failed." });
  }
});

export default router;
