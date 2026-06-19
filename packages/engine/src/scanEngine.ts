import { db } from "@qre/db";
import { createSession } from "./sessionManager.js";
import { runFlowActions } from "./flowOrchestrator.js";
import { logAnalyticsEvent } from "./analytics.js";

type AccessState = "UNCLAIMED" | "LOCKED" | "UNLOCKED";

export async function scanEngine(slug: string, userId?: string) {
  const asset = await db.asset.findUnique({
    where: { slug },
    include: { ownership: true },
  });

  if (!asset) throw new Error("Asset not found");

  // 1. SESSION (always first)
  const session = await createSession(asset.id, asset.flowId ?? undefined);

  // 2. LOG SCAN EVENT (CRITICAL FIX)
  await logAnalyticsEvent({
    assetId: asset.id,
    sessionId: session.id,
    type: "scan",
    meta: { slug },
  });

  // 3. Ownership check
  const isOwner = asset.ownership?.userId === userId;

  // 4. Payment state
  const isPaid = asset.paid === true;

  // 5. Access resolution
  const access: AccessState =
    !isPaid ? "UNCLAIMED" : isOwner ? "UNLOCKED" : "LOCKED";

  // 6. Teaser
  const teaserId =
    access === "UNCLAIMED"
      ? "unclaimed_default"
      : access === "LOCKED"
      ? "preview_mode"
      : "unlocked";

  // 7. FLOW EXECUTION ONLY WHEN UNLOCKED
  if (access === "UNLOCKED" && asset.flowId) {
    const flow = await db.flow.findUnique({
      where: { id: asset.flowId },
    });

    const actions = (flow as any)?.actions ?? [];

    if (Array.isArray(actions) && actions.length > 0) {
      await logAnalyticsEvent({
        assetId: asset.id,
        sessionId: session.id,
        flowId: asset.flowId,
        type: "flow_start",
        meta: {},
      });

      await runFlowActions(actions, session.id, asset.id);

      await logAnalyticsEvent({
        assetId: asset.id,
        sessionId: session.id,
        flowId: asset.flowId,
        type: "flow_end",
        meta: {},
      });
    }
  }

  return {
    mode: "prod",
    access,
    sessionId: session.id,
    flowId: asset.flowId ?? null,
    teaserId,
    preview: access !== "UNLOCKED",
    timestamp: new Date().toISOString(),
  };
}