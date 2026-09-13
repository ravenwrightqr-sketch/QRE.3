import type {
  AssetRepository,
  SessionRepository,
  AccessRepository,
  AnalyticsRepository,
  StoryDeliveryRepository,
  PresenceRepository,
  FlowStepRecord,
} from "./repositories/index.js";
import { resolveAccessEngine } from "./accessEngine.js";
import { flowToMoment } from "./moments/flowToMoments.js";
import { systemMoments } from "./moments/systemMoments.js";
import { purchaseMoments } from "./moments/purchaseMoments.js";
import { buildGeoStory } from "./geo/geoStoryCompiler.js";
import { buildMemorySnapshot } from "./geo/buildMemorySnapshot.js";

import { createStoryDelivery } from "./delivery/StoryDeliveryEngine.js";
import { getScanInsights } from "./analytics/analyticsService.js";
import { runFlowActions } from "./flowOrchestrator.js";
import { buildServiceReceipt } from "./receiptBuilder.js";
import type {
  AnalyticsEventType,
  FlowStepType,
  ExperienceMoment,
  Experience,

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

type BlueprintRecord = Record<string, unknown>;

export async function scanEngine(
  input: ScanEngineInput,
  repos: {
    assetRepository: AssetRepository;
    sessionRepository: SessionRepository;
    analyticsRepository: AnalyticsRepository;
    accessRepository: AccessRepository;
    presenceRepository: PresenceRepository;
    storyDeliveryRepository: StoryDeliveryRepository;
  },
): Promise<Experience> {
  const asset = await repos.assetRepository.findBySlug(input.slug);

  if (!asset) {
    return {
      sessionId: null,
      access: "DEMO",
      preview: true,
      asset: null,
      moments: [],
      geoStory: null,
      sequence: null,
      memorySnapshot: null,
      receipt: null,
      insights: [],
      timestamp: new Date().toISOString(),
    };
  }

  const session = await repos.sessionRepository.create({
    assetId: asset.id,
    flowId: asset.flow?.id ?? null,
  });

  const track = (
    type: AnalyticsEventType,
    meta?: unknown,
  ) =>
    repos.analyticsRepository.trackEvent({
      assetId: asset.id,
      sessionId: session.id,
      flowId: asset.flow?.id ?? null,
      type,
      meta,
    });

  await track("SESSION_START", {
    access: "pending",
    authoredExperienceId: asset.experience?.id ?? null,
    experienceChapters: asset.experiences?.length ?? 0,
  });

  const access = await resolveAccessEngine(
    {
      assetId: asset.id,
      userId: input.userId,
    },
    repos.accessRepository,
  );

  await track("AI_DECISION", {
    stage: "access",
    accessState: access.state,
    sponsorConfigured: Boolean(
      (
        asset.experience?.blueprint as
          | BlueprintRecord
          | null
          | undefined
      )?.sponsor,
    ),
  });

  const moments: ExperienceMoment[] = [
    ...systemMoments(access.state),
  ];

  if (access.state !== "UNLOCKED") {
    moments.push(
      ...purchaseMoments(access.state, asset.slug),
    );
  }

  if (
    access.state === "UNLOCKED" &&
    asset.flow?.steps?.length
  ) {
    const steps = asset.flow.steps.map(
      (step: FlowStepRecord) => ({
        id: step.id,
        order: step.order,
        type: step.type as FlowStepType,
        payload:
          typeof step.payload === "object" &&
          step.payload !== null &&
          !Array.isArray(step.payload)
            ? (step.payload as Record<string, unknown>)
            : {},
      }),
    );

    const flowMoments = flowToMoment(
      steps as Parameters<typeof flowToMoment>[0],
    );

    const offset = moments.length;

    moments.push(
      ...flowMoments.map((moment) => ({
        ...moment,
        order: moment.order + offset,
      })),
    );
  }

  moments.sort((a, b) => a.order - b.order);

  await track("AI_MEMORY_USED", {
    memoryAware: Boolean(asset.experience),
    momentCount: moments.length,
    locations: moments
      .map(
        (moment) =>
          moment.location?.label ??
          moment.meta?.label,
      )
      .filter(Boolean),
  });
try {
  await runFlowActions(
    moments,
    session.id,
    asset.id,
    input.geo,
    input.userId,
    repos.analyticsRepository,
    repos.presenceRepository,
  );
} catch (err) {
  console.warn("[FLOW ACTION FAILED]", err);

  await track("ERROR", {
    stage: "flow-actions",
    error: String(err),
  });
}
  let geoStory = null;

  try {
    geoStory = await buildGeoStory(
      asset.id,
      input.geo
        ? [
            {
              lat: input.geo.lat,
              lng: input.geo.lng,
              createdAt: new Date(),
            },
          ]
        : [],
    );
  } catch (err) {
    console.warn("[GEO STORY FAILED]", err);

    await track("ERROR", {
      stage: "geo-story",
      error: String(err),
    });
  }

  const sequence =
    access.state === "UNLOCKED"
      ? asset.experience?.sequence ?? null
      : null;
  let memorySnapshot = null;

  if (access.state === "UNLOCKED") {
    memorySnapshot = buildMemorySnapshot({
      assetId: asset.id,
      moments,
      geoStory,
    });

    await track("AI_MEMORY_LEARNED", {
      entities:
        (memorySnapshot?.entities ?? []).length,
      highlights:
        (memorySnapshot?.highlights ?? []).slice(0, 5),
      locationTags:
        memorySnapshot?.locationTags ?? [],
    });
  }

  if (access.state === "UNLOCKED") {
    try {
      await createStoryDelivery(
        {
          assetId: asset.id,
          sessionId: session.id,
          userId: input.userId ?? null,
          moments,
          geoStory,
          sequence,
        },
        repos.storyDeliveryRepository,
      );
    } catch (err) {
      console.warn(
        "[STORY DELIVERY FAILED]",
        err,
      );

      await track("ERROR", {
        stage: "story-delivery",
        error: String(err),
      });
    }
  }

  const hasServiceCompletion = moments.some(
    (moment) =>
      moment.type === "system" &&
      moment.meta?.event === "SERVICE_COMPLETE",
  );

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

  if (receipt) {
    await track("AI_DECISION", {
      stage: "service-experience-delivery",
      receiptKind: receipt.kind,
      experienceId: receipt.experienceId,
      sponsorPresent: Boolean(
        (
          asset.experience?.blueprint as
            | BlueprintRecord
            | null
            | undefined
        )?.sponsor,
      ),
    });
  }

  const insights = await getScanInsights(
    asset.id,
    repos.analyticsRepository,
  );

  await repos.sessionRepository.update(
    session.id,
    {
      moments,
      geoStory,
      sequence,
      memorySnapshot,
      receipt,
      endedAt: new Date(),
      status: "completed",
    },
  );

  await track("SESSION_END", {
    completed: true,
    moments: moments.length,
    sequenceCuts: sequence?.cuts?.length ?? 0,
    memoryLearned: Boolean(memorySnapshot),
    serviceExperience: Boolean(receipt),
  });

  return {
    sessionId: session.id,
    access: access.state,
    preview: access.state !== "UNLOCKED",
    timestamp: new Date().toISOString(),
    moments,
    geoStory,
    sequence,
    memorySnapshot,
    receipt,
    insights,
    asset: {
      id: asset.id,
      slug: asset.slug,
      category: asset.category ?? undefined,
      accountId: asset.accountId,
      paid: asset.paid,
    },
  };
}