import express, { Request, Response } from "express";
import { getAssetLiveMetrics } from "@qre/engine";

const router = express.Router();

/**
 * =========================
 * LIVE DASHBOARD STREAM (SSE)
 * =========================
 */
router.get("/live/:assetId", async (req: Request, res: Response) => {
  const assetId = req.params.assetId;

  if (!assetId || typeof assetId !== "string") {
    return res.status(400).json({ error: "Missing assetId" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = async () => {
    try {
      const data = await getAssetLiveMetrics(assetId);

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      res.write(
        `data: ${JSON.stringify({ error: "metrics_failed" })}\n\n`
      );
    }
  };

  await send();

  const interval = setInterval(send, 2000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;