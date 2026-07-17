import { db } from "@qre/db";
import { createSession } from "./sessionManager.js";
import { runFlowActions } from "./flowOrchestrator.js";
import { logAnalyticsEvent } from "./analytics.js";
import { getAnalytics } from "./analytics/getAnalytics.js";
import { renderTeaser } from "./teaserRenderer.js";
import { resolveAccess } from "./resolveAccess.js";

import type { FlowAction, AccessState } from "@qre/contracts";

type Tier = "BASIC" | "PRO" | "BUSINESS";

type ScanEngineInput = {
  slug: string;
  userId?: string;
  tier?: Tier;
};

export async function scanEngine(input: ScanEngineInput) {
  const asset = await db.asset.findUnique({
    where: { slug: input.slug },
  });

  if (!asset) throw new Error("Asset not found");

  const ownership = await db.ownership.findUnique({
    where: { assetId: asset.id },
  });

  const ownedFinal =
    (!!input.userId &&
      ownership?.userId === input.userId &&
      ownership?.status === "ACTIVE") ||
    asset.ownerId === input.userId;

  const tier: Tier = input.tier ?? "BASIC";

  const access: AccessState = await resolveAccess({
    assetId: asset.id,
    userId: input.userId,
    paid: asset.paid,
    owned: ownedFinal,
  });

  const session = await createSession(asset.id, asset.flowId ?? undefined);

  await logAnalyticsEvent({
    assetId: asset.id,
    sessionId: session.id,
    type: "scan",
    stepIndex: 0,
    meta: { access, tier, owned: ownedFinal },
  });

  if (access === "UNLOCKED" && asset.flowId) {
    const flow = await db.flow.findUnique({
      where: { id: asset.flowId },
    });

    const actions = (flow?.actions ?? []) as FlowAction[];

    if (actions.length) {
      await runFlowActions(actions, session.id, asset.id);
    }
  }

  const teaser = renderTeaser(access, asset.slug);

  let analytics = null;

  try {
    analytics = await getAnalytics({
      assetId: asset.id,
      sessionId: session.id,
      tier,
    });
  } catch {}

  return {
    access,
    sessionId: session.id,
    flowId: asset.flowId ?? null,

    asset: {
      id: asset.id,
      slug: asset.slug,
      priceCents: asset.priceCents,
      status: asset.status,
      paid: asset.paid,
      ownerId: asset.ownerId,
    },

    teaser,
    preview: access !== "UNLOCKED",

    nextAction: access === "UNLOCKED" ? "RUN_FLOW" : "CHECKOUT",
    actionUrl: access === "UNLOCKED" ? null : `/checkout/${asset.slug}`,

    analytics,

    ownership: {
      status: ownedFinal ? "OWNED" : "NOT_OWNED",
      userId: input.userId ?? null,
    },

    timestamp: new Date().toISOString(),
  };
}