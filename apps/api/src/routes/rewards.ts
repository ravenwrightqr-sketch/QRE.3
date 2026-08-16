import express from "express";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import {
  attributeScan,
  createRewardProgram,
  getRewardBalance,
  recordVerifiedPurchase,
} from "../services/rewardRail.js";

const router = express.Router();

router.post("/programs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    const sponsorName = typeof req.body?.sponsorName === "string" ? req.body.sponsorName.trim() : "";
    if (!assetId || !sponsorName) return res.status(400).json({ success: false, error: "assetId and sponsorName are required." });

    const program = await createRewardProgram({
      assetId,
      merchantId: req.user?.userId ?? "account-sponsor",
      sponsorName,
      regulated: req.body?.regulated === true,
      pointsPerCurrencyUnit: Number(req.body?.pointsPerCurrencyUnit ?? 1),
      attributionWindowHours: Number(req.body?.attributionWindowHours ?? 168),
      minimumAge: Number(req.body?.minimumAge ?? 21),
    });

    return res.status(201).json({ success: true, program });
  } catch (error) {
    console.error("Reward program creation failed:", error);
    return res.status(500).json({ success: false, error: "Failed to create reward program." });
  }
});

router.post("/attribute", async (req, res) => {
  try {
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    const programId = typeof req.body?.programId === "string" ? req.body.programId.trim() : "";
    if (!assetId || !programId) return res.status(400).json({ success: false, error: "assetId and programId are required." });

    const result = await attributeScan({
      assetId,
      sessionId: typeof req.body?.sessionId === "string" ? req.body.sessionId : undefined,
      userId: typeof req.body?.userId === "string" ? req.body.userId : undefined,
      programId,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Reward attribution failed:", error);
    return res.status(404).json({ success: false, error: error instanceof Error ? error.message : "Reward attribution failed." });
  }
});

router.post("/purchase", requireAuth, async (req: AuthRequest, res) => {
  try {
    const attributionToken = typeof req.body?.attributionToken === "string" ? req.body.attributionToken.trim() : "";
    const purchaseReference = typeof req.body?.purchaseReference === "string" ? req.body.purchaseReference.trim() : "";
    const amount = Number(req.body?.amount ?? 0);
    if (!attributionToken || !purchaseReference || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ success: false, error: "attributionToken, purchaseReference, and valid amount are required." });
    }

    const result = await recordVerifiedPurchase({
      attributionToken,
      purchaseReference,
      amount,
      currency: typeof req.body?.currency === "string" ? req.body.currency : undefined,
      userId: req.user?.userId,
      metadata: typeof req.body?.metadata === "object" ? req.body.metadata : undefined,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Reward purchase verification failed:", error);
    return res.status(409).json({ success: false, error: error instanceof Error ? error.message : "Reward purchase verification failed." });
  }
});

router.get("/balance/:assetId/:programId/:userId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const programId = String(req.params.programId ?? "").trim();
    const requestedUserId = String(req.params.userId ?? "").trim();
    const userId = req.user?.userId === requestedUserId ? requestedUserId : req.user?.userId ?? "";
    if (!assetId || !programId || !userId) return res.status(400).json({ success: false, error: "Reward balance parameters required." });
    return res.json({ success: true, balance: await getRewardBalance({ assetId, programId, userId }) });
  } catch (error) {
    console.error("Reward balance failed:", error);
    return res.status(500).json({ success: false, error: "Failed to load reward balance." });
  }
});

export default router;
