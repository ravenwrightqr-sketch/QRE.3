import "dotenv/config";
import express from "express";

import { db } from "@qre/db";
import { scanEngine } from "@qre/engine";

import { getAssetAnalytics } from "./routes/analytics.js";
import { createCheckout } from "./routes/checkout.js";
import adminRouter from "./routes/admin.js";
import { createFlow } from "./routes/flow.js";

const app = express();

/**
 * =========================
 * MIDDLEWARE
 * =========================
 */
app.use(express.json());

/**
 * =========================
 * HEALTH CHECK
 * =========================
 */
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "qre-api",
  });
});

/**
 * =========================
 * ADMIN ROUTES
 * =========================
 */
app.use("/admin", adminRouter);

app.get("/admin/assets", async (_req, res) => {
  try {
    const assets = await db.asset.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    res.json(assets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * FLOW
 * =========================
 */
app.post("/flow/create", createFlow);

/**
 * =========================
 * SCAN (IMPORTANT ROUTE)
 * =========================
 * FINAL URL:
 * /api/scan/:slug
 */
app.get("/api/scan/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await scanEngine(slug);

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * ANALYTICS
 * =========================
 */
app.get("/analytics/:assetId", async (req, res) => {
  try {
    const data = await getAssetAnalytics(req.params.assetId);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * CHECKOUT
 * =========================
 */
app.post("/checkout/:assetId", async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({ error: "plan is required" });
    }

    const result = await createCheckout(req.params.assetId, plan);

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * =========================
 * START SERVER
 * =========================
 */
app.listen(3000, () => {
  console.log("QRE running on http://localhost:3000");
});