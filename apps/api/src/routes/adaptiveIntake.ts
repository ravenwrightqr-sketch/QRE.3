import express from "express";
import { randomUUID } from "node:crypto";
import { db } from "@qre/db";
import type {
  AdaptiveAnswer,
  AdaptiveExperienceBrief,
  AdaptiveStep,
} from "@qre/contracts";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import {
  applyAdaptiveAnswer,
  buildAuthorPrompt,
  createEmptyAdaptiveBrief,
  recordAdaptiveInteraction,
} from "../services/adaptiveIntakeEngine.js";
import { getAdaptiveCognitiveState } from "../services/adaptiveIntakeCognition.js";
import { createExperience } from "../services/experienceCreationServices.js";
import { recordCreativeFeedback } from "../services/creativeLearning.js";

const router = express.Router();

async function ownedAsset(assetId: string, userId: string) {
  if (!assetId || !userId) return null;
  return db.asset.findFirst({
    where: {
      id: assetId,
      OR: [
        { ownerId: userId },
        { account: { AccountUser: { some: { userId } } } },
      ],
    },
    select: { id: true, ownerId: true, accountId: true },
  });
}

router.post("/start", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : undefined;
    const intent = typeof req.body?.intent === "string" ? req.body.intent.trim() : "";
    if (!intent) return res.status(400).json({ success: false, error: "Intent is required." });
    if (assetId && !(await ownedAsset(assetId, req.user?.userId ?? ""))) {
      return res.status(403).json({ success: false, error: "Asset access denied." });
    }

    const sessionId = randomUUID();
    const brief = createEmptyAdaptiveBrief(sessionId, assetId, intent);
    const state = await getAdaptiveCognitiveState(brief, req.user?.userId);

    await recordAdaptiveInteraction(
      state.brief,
      { stepId: "intake-start", action: "submit", value: intent },
      state.step,
    );

    return res.status(201).json({ success: true, ...state });
  } catch (error) {
    console.error("Adaptive intake start failed:", error);
    return res.status(500).json({ success: false, error: "Adaptive intake could not start." });
  }
});

router.post("/next", requireAuth, async (req: AuthRequest, res) => {
  try {
    const brief = req.body?.brief as AdaptiveExperienceBrief | undefined;
    const answer = req.body?.answer as AdaptiveAnswer | undefined;
    if (!brief?.sessionId || !brief.originalIntent || !answer?.stepId) {
      return res.status(400).json({ success: false, error: "brief and answer are required." });
    }

    if (brief.assetId && !(await ownedAsset(brief.assetId, req.user?.userId ?? ""))) {
      return res.status(403).json({ success: false, error: "Asset access denied." });
    }

    const previousStep = req.body?.previousStep as AdaptiveStep | undefined;
    const updated = applyAdaptiveAnswer(brief, answer);
    if (previousStep) await recordAdaptiveInteraction(updated, answer, previousStep);

    const state = await getAdaptiveCognitiveState(updated, req.user?.userId);
    return res.json({ success: true, ...state });
  } catch (error) {
    console.error("Adaptive intake next-step failed:", error);
    return res.status(500).json({ success: false, error: "Adaptive intake could not advance." });
  }
});

router.post("/author", requireAuth, async (req: AuthRequest, res) => {
  try {
    const brief = req.body?.brief as AdaptiveExperienceBrief | undefined;
    if (!brief?.sessionId || !brief.assetId) return res.status(400).json({ success: false, error: "A session brief with assetId is required." });
    if (!brief.readyForAuthor) return res.status(409).json({ success: false, error: "The brief is not ready for Author yet." });

    const asset = await ownedAsset(brief.assetId, req.user?.userId ?? "");
    if (!asset) return res.status(403).json({ success: false, error: "Asset access denied." });

    const prompt = buildAuthorPrompt(brief);
    const created = await createExperience({
      assetId: brief.assetId,
      userId: req.user?.userId,
      prompt,
      title: brief.fields.name || undefined,
    });

    await recordCreativeFeedback({
      assetId: brief.assetId,
      userId: req.user?.userId,
      prompt,
      draft: JSON.stringify(created.compiled?.cinematicScenes ?? []).slice(0, 12000),
      decision: "selected",
      feedback: "adaptive_author_requested",
      styleTags: brief.tone,
    });

    return res.status(201).json({
      success: true,
      sessionId: brief.sessionId,
      experienceId: created.experience.id,
      flowId: created.flow.id,
      compiled: created.compiled,
      experience: created.experience,
    });
  } catch (error) {
    console.error("Adaptive Author failed:", error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Author failed." });
  }
});

router.post("/feedback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const draft = typeof req.body?.draft === "string" ? req.body.draft.trim() : "";
    const decision = req.body?.decision;
    if (!assetId || !prompt || !draft || !["accepted", "rejected", "selected"].includes(decision)) {
      return res.status(400).json({ success: false, error: "assetId, prompt, draft and valid decision are required." });
    }
    if (!(await ownedAsset(assetId, req.user?.userId ?? ""))) return res.status(403).json({ success: false, error: "Asset access denied." });

    await recordCreativeFeedback({
      assetId,
      userId: req.user?.userId,
      prompt,
      draft,
      decision,
      feedback: typeof req.body?.feedback === "string" ? req.body.feedback : undefined,
      styleTags: Array.isArray(req.body?.styleTags) ? req.body.styleTags : undefined,
      trajectory: typeof req.body?.trajectory === "string" ? req.body.trajectory : undefined,
      score: typeof req.body?.score === "number" ? req.body.score : undefined,
    });

    return res.json({ success: true, learned: true });
  } catch (error) {
    console.error("Adaptive feedback failed:", error);
    return res.status(500).json({ success: false, error: "Feedback could not be learned." });
  }
});

router.post("/publish", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    const flowId = typeof req.body?.flowId === "string" ? req.body.flowId.trim() : "";
    const experienceId = typeof req.body?.experienceId === "string" ? req.body.experienceId.trim() : "";
    if (!assetId || !flowId || !experienceId) return res.status(400).json({ success: false, error: "assetId, flowId and experienceId are required." });

    const asset = await ownedAsset(assetId, req.user?.userId ?? "");
    if (!asset) return res.status(403).json({ success: false, error: "Asset access denied." });

    const [flow, experience] = await Promise.all([
      db.flow.findUnique({ where: { id: flowId }, select: { id: true, merchantId: true } }),
      db.experience.findUnique({ where: { id: experienceId }, select: { id: true, assetId: true } }),
    ]);
    if (!flow || !experience || experience.assetId !== assetId) return res.status(404).json({ success: false, error: "Draft experience not found." });

    await db.assetFlow.updateMany({ where: { assetId }, data: { active: false } });
    const assetFlow = await db.assetFlow.upsert({
      where: { assetId_flowId: { assetId, flowId } },
      update: { active: true, priority: 0 },
      create: { assetId, flowId, active: true, priority: 0 },
    });

    await recordCreativeFeedback({
      assetId,
      userId: req.user?.userId,
      prompt: "adaptive_publish",
      draft: JSON.stringify({ experienceId, flowId }).slice(0, 12000),
      decision: "accepted",
      feedback: "adaptive_experience_published",
    });

    return res.json({ success: true, assetFlow, experienceId, flowId });
  } catch (error) {
    console.error("Adaptive publish failed:", error);
    return res.status(500).json({ success: false, error: "Experience could not be published." });
  }
});

export default router;
