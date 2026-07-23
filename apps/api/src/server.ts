import "dotenv/config";
console.log(
  "DB HOST:",
  process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]
);

console.log(
  "CHANNEL:",
  process.env.DATABASE_URL?.match(/channel_binding=([^&]+)/)?.[1]
);
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
import scanRouter from "./routes/scan.index.js";
import productRouter from "./routes/product.js";
import claimRouter from "./routes/claim.js";
import stripeWebhookRouter from "./routes/stripeWebhook.js";
import stripeTestRouter from "./routes/stripeTest.js";
import dashboardRoutes from "./routes/dashboard.js";
import masterDashboardRoutes from "./routes/masterDashboard.js";
import presenceRoutes from "./routes/presence.js";
import debugRouter from "./routes/debug.js";
import experienceRouter from "./routes/experience.js";
import assetGenerateRouter from "./routes/assets.generate.js";
/**
 * AUTH + FLOW
 */
import { authRoutes } from "./routes/auth.js";
import { flowRouter } from "./routes/flow.js";
import { requireAuth } from "./middleware/requireAuth.js";
console.log("DATABASE_URL =", process.env.DATABASE_URL);
/**
 * INIT
 */
const app = express();

/**
 * ENV CHECK
 */
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

/**
 * CORS
 */
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

/**
 * =================================================
 * STRIPE WEBHOOK RAW BODY
 * MUST COME BEFORE express.json()
 * =================================================
 */
app.use(
  "/api/stripe/webhook",
  express.raw({
    type: "application/json",
  })
);

/**
 * NORMAL JSON BODY
 */
app.use(express.json());


/**
 * AUTH
 */
authRoutes(app);

app.use(
  "/api/assets",
  requireAuth,
  assetGenerateRouter
);



/**
 * API ROUTES
 */
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);

app.use("/api/analytics", analyticsRouter);
app.use("/api/scan", scanRouter);
app.use("/api/checkout", checkoutRouter);

app.use("/api/product", productRouter);
app.use("/api/claim", claimRouter);
app.use("/api/flow", flowRouter);

app.use("/api/presence", presenceRoutes);

app.use(
  "/api/debug",
  debugRouter
);

app.use(
  "/experience",
  experienceRouter
);
/**
 * DASHBOARD
 */
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/master-dashboard", masterDashboardRoutes);


/**
 * =================================================
 * STRIPE
 * =================================================
 *
 * REAL STRIPE:
 * /api/stripe/webhook/*
 *
 * DEV TEST:
 * /api/stripe/test-webhook
 *
 */
app.use("/api/stripe", stripeWebhookRouter);
app.use("/api/stripe", stripeTestRouter);


/**
 * HEALTH CHECK
 */
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "qre-api",
  });
});


/**
 * START
 */
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`⚡ QRE API running on port ${PORT}`);
});