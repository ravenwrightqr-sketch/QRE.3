import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { db } from "@qre/db";

/**
 * ROUTERS
 */
import userRouter from "./routes/user.js";
import adminRouter from "./routes/admin.js";
import analyticsRouter from "./routes/analytics.js";
import checkoutRouter from "./routes/checkout.js";
import scanRouter from "./routes/scan.js";
import productRouter from "./routes/product.js";
import claimRouter from "./routes/claim.js";
import stripeWebhookRouter from "./routes/stripeWebhook.js";
import stripeTestRouter from "./routes/stripeTest.js";
import dashboardRoutes from "./routes/dashboard.js";
/**
 * AUTH + FLOW
 */
import { authRoutes } from "./routes/auth.js";
import { flowRouter } from "./routes/flow.js";
import {
  requireAuth,
  AuthRequest,
} from "./middleware/requireAuth.js";

/**
 * =========================
 * INIT
 * =========================
 */
const app = express();

/**
 * =========================
 * ENV CHECK
 * =========================
 */
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

/**
 * =========================
 * MIDDLEWARE
 * =========================
 */
app.use(
  cors({
    origin: [
      "https://qre-3qre-web.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

/**
 * ⚠️ Stripe webhook raw body MUST come BEFORE json parser
 */
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);

app.use(express.json());

/**
 * =========================
 * AUTH SYSTEM
 * =========================
 */
authRoutes(app);

/**
 * =========================
 * ROUTERS
 * =========================
 */
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/scan", scanRouter);
app.use("/api/product", productRouter);
app.use("/api/claim", claimRouter);
app.use("/api/flow", flowRouter);


app.use("/api/dashboard", dashboardRoutes);
/**
 * DEV STRIPE TEST ROUTES
 */
app.use("/api/stripe", stripeTestRouter);

/**
 * REAL STRIPE WEBHOOK (PRODUCTION)
 */
app.use("/api/stripe", stripeWebhookRouter);

/**
 * =========================
 * FLOW
 * =========================
 */


/**
 * =========================
 * USER ASSETS (PROTECTED)
 * =========================

/**
 * =========================
 * DEV WEBHOOK SIMULATOR
 * =========================
 */
app.post(
  "/api/stripe/webhook/test",
  async (req: Request, res: Response) => {
    try {
      const { assetId, userId } = req.body;

      if (!assetId) {
        return res.status(400).json({
          error: "assetId required",
        });
      }

      const asset = await db.asset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        return res.status(404).json({
          error: "Asset not found",
        });
      }

      await db.asset.update({
        where: { id: assetId },
        data: {
          paid: true,
          status: "active",
          ownerId: userId ?? null,
          claimedAt: new Date(),
        },
      });

      return res.json({
        ok: true,
        message: "DEV webhook simulated unlock",
        assetId,
      });
    } catch (e: any) {
      return res.status(500).json({
        error: e.message,
      });
    }
  }
);

/**
 * =========================
 * HEALTH
 * =========================
 */
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "qre-api",
  });
});

/**
 * =========================
 * START SERVER
 * =========================
 */
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`⚡ QRE API running on port ${PORT}`);
});