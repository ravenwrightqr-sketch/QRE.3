import express from "express";


import { createCheckout } from "./routes/checkout.js";
import stripeWebhook from "./routes/stripe.Webhook.js";
import adminRouter from "./routes/admin.js";
import scanRoute from "./routes/scan.route.js";
import { createFlow } from "./routes/flow.js";

const app = express();

/**
 * RAW BODY FOR STRIPE
 */
/**
 * JSON PARSER
 */
app.use(express.json());

/**
 * ROUTES
 */
app.use("/webhook/stripe", stripeWebhook);
app.use("/admin", adminRouter);
app.use(scanRoute);

/**
 * FLOW ROUTE (FIXED)
 */
app.post("/flow/create", createFlow);

/**
 * HEALTH CHECK
 */
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

/**
 * START SERVER
 */
app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});