import "dotenv/config";

import express, { Request, Response } from "express";
import cors from "cors";

/** ROUTERS */
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

/** AUTH + FLOW */
import { authRoutes } from "./routes/auth.js";
import { flowRouter } from "./routes/flow.js";
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);

/** Stripe webhook must receive the raw body before JSON parsing. */
app.use(
  "/api/stripe/webhook",
  express.raw({
    type: "application/json",
  }),
);

app.use(express.json());

authRoutes(app);

app.use(
  "/api/assets",
  requireAuth,
  assetGenerateRouter,
);

app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/scan", scanRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/product", productRouter);
app.use("/api/claim", claimRouter);
app.use("/api/flow", flowRouter);
app.use("/api/presence", presenceRoutes);
app.use("/api/debug", debugRouter);
app.use("/experience", experienceRouter);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/master-dashboard", masterDashboardRoutes);
app.use("/api/stripe", stripeWebhookRouter);
app.use("/api/stripe", stripeTestRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "qre-api",
  });
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`⚡ QRE API running on port ${PORT}`);
});
