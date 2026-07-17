import express from "express";
import {
  getPresenceTimeline,
  getPresenceReplay,
} from "@qre/engine";

const router = express.Router();

/**
 * RAW TIMELINE
 */
router.get("/presence/:assetId", async (req, res) => {
  try {
    const data = await getPresenceTimeline(req.params.assetId);

    res.json({
      assetId: req.params.assetId,
      points: data,
    });
  } catch (err) {
    console.error("[PRESENCE][TIMELINE]", err);
    res.status(500).json({ error: "timeline failed" });
  }
});

/**
 * REPLAY DATA (MAP READY)
 */
router.get("/presence/:assetId/replay", async (req, res) => {
  try {
    const data = await getPresenceReplay(req.params.assetId);

    res.json({
      assetId: req.params.assetId,
      replay: data,
    });
  } catch (err) {
    console.error("[PRESENCE][REPLAY]", err);
    res.status(500).json({ error: "replay failed" });
  }
});

export default router;