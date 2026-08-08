import type {
  AssetRepository,
  SessionRepository,
  AccessRepository,
  FlowStepRecord,
  StoryDeliveryRepository,
  AnalyticsRepository,
} from "./repositories/index.js";

import { resolveAccessEngine } from "./accessEngine.js";
import { flowToMoment } from "./moments/flowToMoments.js";
import { systemMoments } from "./moments/systemMoments.js";
import { purchaseMoments } from "./moments/purchaseMoments.js";
import { projectGeoStory, projectMemorySnapshot } from "./runtimeProjection/index.js";
import { cinematicRuntime } from "./runtime/cinematicRuntime.js";
import { createStoryDelivery } from "./delivery/StoryDeliveryEngine.js";
import { getScanInsights } from "./analytics/analyticsService.js";
import { trackEvent } from "./analytics/trackEvent.js";
import { runFlowActions } from "./flowOrchestrator.js";
import { buildServiceReceipt } from "./receiptBuilder.js";

import type {
  Experience,
  ExperienceMoment,
  FlowStepType,
} from "@qre/contracts";

type ScanEngineInput = {
  slug: string;
  userId?: string;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
};

export async function scanEngine(
  input: ScanEngineInput,
  repos: {
    assetRepository: AssetRepository;
    sessionRepository: SessionRepository;
    analyticsRepository: AnalyticsRepository;
    accessRepository: AccessRepository;
    storyDeliveryRepository: StoryDeliveryRepository;
  },
): Promise<Experience> {
  const now = new Date();

  // -----------------------------------------------------
  // 1. Resolve the QR/NFC asset.
  // -----------------------------------------------------
  const asset = await repos.assetRepository.findBySlug(input.slug);

  if (!asset) {
    return {
      sessionId: null,
      accessState: "DEMO",
      asset: null,
      moments: [],
      cinematicScenes: [],
      geoStory: null,
      memorySnapshot: null,
      receipt: null,
      insights: [],
      runtimeVersion: "1.0",
      timestamp: now.toISOString(),
    };
  }

  // -----------------------------------------------------
  // 2. Session + access state.
  // -----------------------------------------------------
  const session = await repos.sessionRepository.create({
    assetId: asset.id,
    flowId: asset.flow?.id ?? null,
  });

  await trackEvent(repos.analyticsRepository, {
    assetId: asset.id,
    sessionId: session.id,
    flowId: asset.flow?.id ?? undefined,
    type: "SCAN",
    meta: {
      slug: asset.slug,
      hasGeo: Boolean(input.geo),
    },
  });

  await trackEvent(repos.analyticsRepository, {
    assetId: asset.id,
    sessionId: session.id,
    flowId: asset.flow?.id ?? undefined,
    type: "SESSION_START",
  });

  const access = await resolveAccessEngine(
    {
      assetId: asset.id,
      userId: input.userId,
    },
    repos.accessRepository,
  );

  // -----------------------------------------------------
  // 3. Semantic experience moments.
  // -----------------------------------------------------
  const moments: ExperienceMoment[] = [
    ...systemMoments(access.state),
  ];

  if (access.state !== "UNLOCKED") {
    moments.push(
      ...purchaseMoments(access.state, asset.slug),
    );

    await trackEvent(repos.analyticsRepository, {
      assetId: asset.id,
      sessionId: session.id,
      flowId: asset.flow?.id ?? undefined,
      type: "TEASER_VIEW",
      meta: { accessState: access.state },
    });
  }

  if (
    access.state === "UNLOCKED" &&
    asset.flow?.steps?.length
  ) {
    const flowMoments = flowToMoment(
      asset.flow.steps.map((step: FlowStepRecord) => ({
        id: step.id,
        order: step.order,
        type: step.type as FlowStepType,
        payload:
          typeof step.payload === "object" &&
          step.payload !== null &&
          !Array.isArray(step.payload)
            ? (step.payload as Record<string, unknown>)
            : {},
      })),
    );

    const offset = moments.length;

    moments.push(
      ...flowMoments.map(moment => ({
        ...moment,
        order: moment.order + offset,
      })),
    );

    await trackEvent(repos.analyticsRepository, {
      assetId: asset.id,
      sessionId: session.id,
      flowId: asset.flow.id,
      type: "FLOW_START",
      meta: {
        stepCount: asset.flow.steps.length,
        momentCount: flowMoments.length,
      },
    });
  }

  moments.sort((a, b) => a.order - b.order);

  // -----------------------------------------------------
  // 4. Execute flow actions. Execution remains separate from
  //    semantic Moments and from presentation Scenes.
  // -----------------------------------------------------
  try {
    await runFlowActions(
      moments,
      session.id,
      asset.id,
      input.geo,
      input.userId,
      repos.analyticsRepository,
    );
  } catch (error) {
    await trackEvent(repos.analyticsRepository, {
      assetId: asset.id,
      sessionId: session.id,
      flowId: asset.flow?.id ?? undefined,
      type: "ERROR",
      meta: {
        phase: "flow_actions",
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  // -----------------------------------------------------
  // 5. Presentation runtime.
  // -----------------------------------------------------
  const cinematicScenes = cinematicRuntime({ moments });

  // -----------------------------------------------------
  // 6. Geo is its own artifact.
  //    It can exist without memory and without persistence.
  // -----------------------------------------------------
  const geoStory = projectGeoStory({
    assetId: asset.id,
    geoPoints: input.geo
      ? [
          {
            lat: input.geo.lat,
            lng: input.geo.lng,
            createdAt: now,
          },
        ]
      : [],
  });

  if (input.geo) {
    await trackEvent(repos.analyticsRepository, {
      assetId: asset.id,
      sessionId: session.id,
      flowId: asset.flow?.id ?? undefined,
      type: "GEO_MARK",
      meta: {
        lat: input.geo.lat,
        lng: input.geo.lng,
        accuracy: input.geo.accuracy,
      },
    });
  }

  // -----------------------------------------------------
  // 7. Memory is a separate, explicit projection.
  //    Geo may be supplied as context, but memory creation is
  //    controlled independently by access state.
  // -----------------------------------------------------
  const memorySnapshot =
    access.state === "UNLOCKED"
      ? projectMemorySnapshot({
          assetId: asset.id,
          moments,
          geoStory,
          cinematicScenes,
        })
      : null;

  if (memorySnapshot) {
    await trackEvent(repos.analyticsRepository, {
      assetId: asset.id,
      sessionId: session.id,
      flowId: asset.flow?.id ?? undefined,
      type: "MEMORY_APPLIED",
      meta: {
        momentCount: moments.length,
        cinematicSceneCount: cinematicScenes.length,
      },
    });
  }

  // -----------------------------------------------------
  // 8. Story delivery is downstream of the artifacts.
  // -----------------------------------------------------
  if (access.state === "UNLOCKED") {
    try {
      await createStoryDelivery(
        {
          assetId: asset.id,
          sessionId: session.id,
          userId: input.userId ?? null,
          moments,
          geoStory,
          cinematicScenes,
        },
        repos.storyDeliveryRepository,
      );
    } catch (error) {
      await trackEvent(repos.analyticsRepository, {
        assetId: asset.id,
        sessionId: session.id,
        flowId: asset.flow?.id ?? undefined,
        type: "ERROR",
        meta: {
          phase: "story_delivery",
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  // -----------------------------------------------------
  // 9. Service receipt remains a domain-specific projection.
  // -----------------------------------------------------
  const hasServiceCompletion = false;
  const isServiceAsset =
    asset.category === "service" ||
    asset.category === "business";

  const receipt =
    access.state === "UNLOCKED" &&
    isServiceAsset &&
    hasServiceCompletion
      ? buildServiceReceipt({
          asset,
          sessionId: session.id,
          moments,
        })
      : null;

  // -----------------------------------------------------
  // 10. Analytics is a first-class runtime output, not compiler state.
  // -----------------------------------------------------
  const insights = await getScanInsights(
    asset.id,
    repos.analyticsRepository,
  );

  await trackEvent(repos.analyticsRepository, {
    assetId: asset.id,
    sessionId: session.id,
    flowId: asset.flow?.id ?? undefined,
    type: "SESSION_END",
    meta: {
      accessState: access.state,
      momentCount: moments.length,
      sceneCount: cinematicScenes.length,
      memoryCreated: Boolean(memorySnapshot),
      geoAvailable: Boolean(input.geo),
    },
  });

  // -----------------------------------------------------
  // 11. Persist the session envelope only.
  //     Geo, memory, scenes and moments remain distinct artifacts.
  // -----------------------------------------------------
  await repos.sessionRepository.update(session.id, {
    moments,
    geoStory,
    cinematicScenes,
    memorySnapshot,
    receipt,
    endedAt: new Date(),
    status: "completed",
  });

  return {
    sessionId: session.id,
    accessState: access.state,
    moments,
    geoStory,
    cinematicScenes,
    memorySnapshot,
    receipt,
    insights,
    runtimeVersion: "1.0",
    timestamp: new Date().toISOString(),
    asset: {
      id: asset.id,
      slug: asset.slug,
      title: asset.slug,
      category: asset.category ?? undefined,
      accountId: asset.accountId ?? undefined,
      paid: asset.paid,
    },
  };
}
