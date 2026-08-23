
import type {
  AssetRepository,
  SessionRepository,
  AccessRepository,
  AnalyticsRepository,
  StoryDeliveryRepository,
  FlowStepRecord,
} from "./repositories/index.js";
import { emitSpineEvent } from "./spine/eventSpine.js";
import { resolveAccessEngine } from "./accessEngine.js";
import { flowToMoment } from "./moments/flowToMoments.js";
import { systemMoments } from "./moments/systemMoments.js";
import { purchaseMoments } from "./moments/purchaseMoments.js";
import { buildRuntimeGeoStory } from "./runtime/geo/buildRuntimeGeoStory.js";
import { buildRuntimeMemorySnapshot } from "./runtime/memory/buildRuntimeMemorySnapshot.js";
import { selectCinematicScenes } from "./runtime/cinematic/selectCinematicScenes.js";
import { createStoryDelivery } from "./delivery/StoryDeliveryEngine.js";
import { getScanInsights } from "./analytics/analyticsService.js";
import { runFlowActions } from "./flowOrchestrator.js";
import { buildServiceReceipt } from "./receiptBuilder.js";
import type {
  EngineEventType,
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

type RuntimeAccessState = Awaited<
  ReturnType<typeof resolveAccessEngine>
>["state"];

function buildRuntimeMoments(
  accessState: RuntimeAccessState,
  asset: {
    slug: string;
    flow?: {
      steps?: FlowStepRecord[];
    } | null;
  },
): ExperienceMoment[] {
  const moments: ExperienceMoment[] = [
    ...systemMoments(accessState),
  ];

  if (accessState !== "UNLOCKED") {
    moments.push(
      ...purchaseMoments(
        accessState,
        asset.slug,
      ),
    );
  }

  if (
    accessState === "UNLOCKED" &&
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
      steps as Parameters<
        typeof flowToMoment
      >[0],
    );

    const offset = moments.length;

    moments.push(
      ...flowMoments.map((moment) => ({
        ...moment,
        order: moment.order + offset,
      })),
    );
  }

  return moments.sort(
    (a, b) => a.order - b.order,
  );
}

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
  const asset =
    await repos.assetRepository.findBySlug(
      input.slug,
    );

  if (!asset) {
    return {
      sessionId: null,
      access: "DEMO",
      preview: true,
      asset: null,
      moments: [],
      geoStory: null,
      cinematicScenes: [],
      memorySnapshot: null,
      receipt: null,
      insights: [],
      timestamp: new Date().toISOString(),
    };
  }

  const session =
    await repos.sessionRepository.create({
      assetId: asset.id,
      flowId: asset.flow?.id ?? null,
    });

  const emitRuntimeEvent = (
    type: EngineEventType,
    meta?: Record<string, unknown>,
  ) =>
    emitSpineEvent({
      type,
      assetId: asset.id,
      sessionId: session.id,
      flowId: asset.flow?.id ?? undefined,
      meta,
    });

  await emitRuntimeEvent("SCAN_START", {
    slug: input.slug,
    hasUser: Boolean(input.userId),
    hasGeo: Boolean(input.geo),
  });

  await emitRuntimeEvent("SESSION_START", {
    access: "pending",
    authoredExperienceId:
      asset.experience?.id ?? null,
    experienceChapters:
      asset.experiences?.length ?? 0,
  });

  const access =
    await resolveAccessEngine(
      {
        assetId: asset.id,
        userId: input.userId,
      },
      repos.accessRepository,
    );

  await emitRuntimeEvent("AI_DECISION", {
    stage: "access",
    accessState: access.state,
    sponsorConfigured: Boolean(
      (
        asset.experience?.blueprint as
          | Record<string, unknown>
          | null
      )?.sponsor,
    ),
  });

  const moments = buildRuntimeMoments(
    access.state,
    asset,
  );

  await emitRuntimeEvent("AI_MEMORY_USED", {
    memoryAware: Boolean(
      asset.experience,
    ),
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
    );
  } catch (err) {
    console.warn(
      "[FLOW ACTION FAILED]",
      err,
    );

    await emitRuntimeEvent("ERROR", {
      stage: "flow-actions",
      error: String(err),
    });
  }

  let geoStory = null;

try {
  geoStory = buildRuntimeGeoStory(
    asset.id,
    input.geo,
  );
} catch (err) {

  await emitRuntimeEvent("ERROR", {
    stage: "geo-story",
    error: String(err),
  });
}
  const cinematicScenes =
    selectCinematicScenes({
      accessState: access.state,
      asset,
      moments,
      geoStory,
    });

  await emitRuntimeEvent(
    "AI_CINEMATIC_DECISION",
    {
      scenes: cinematicScenes.length,
      authoredChapters:
        asset.experiences?.length ?? 0,
      audioCapable: true,
    },
  );

  let memorySnapshot = null;

  if (access.state === "UNLOCKED") {
    memorySnapshot =
      buildRuntimeMemorySnapshot({
        assetId: asset.id,
        moments,
        geoStory,
        cinematicScenes,
      });

    await emitRuntimeEvent(
      "AI_MEMORY_LEARNED",
      {
        entities: (
          memorySnapshot?.entities ?? []
        ).length,
        highlights: (
          memorySnapshot?.highlights ?? []
        ).slice(0, 5),
        locationTags:
          memorySnapshot?.locationTags ?? [],
      },
    );
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
          cinematicScenes,
        },
        repos.storyDeliveryRepository,
      );
    } catch (err) {
      console.warn(
        "[STORY DELIVERY FAILED]",
        err,
      );

      await emitRuntimeEvent(
        "ERROR",
        {
          stage: "story-delivery",
          error: String(err),
        },
      );
    }
  }

  const hasServiceCompletion =
    moments.some(
      (moment) =>
        moment.type === "system" &&
        moment.meta?.event ===
          "SERVICE_COMPLETE",
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
    await emitRuntimeEvent(
      "AI_DECISION",
      {
        stage:
          "service-experience-delivery",
        receiptKind: receipt.kind,
        experienceId:
          receipt.experienceId,
        sponsorPresent: Boolean(
          (
            asset.experience
              ?.blueprint as
              | Record<string, unknown>
              | null
          )?.sponsor,
        ),
      },
    );
  }

  const insights =
    await getScanInsights(
      asset.id,
      repos.analyticsRepository,
    );

  await repos.sessionRepository.update(
    session.id,
    {
      moments,
      geoStory,
      cinematicScenes,
      memorySnapshot,
      receipt,
      endedAt: new Date(),
      status: "completed",
    },
  );

  await emitRuntimeEvent(
    "SESSION_END",
    {
      completed: true,
      moments: moments.length,
      cinematicScenes:
        cinematicScenes.length,
      memoryLearned:
        Boolean(memorySnapshot),
      serviceExperience:
        Boolean(receipt),
    },
  );

  return {
    sessionId: session.id,
    access: access.state,
    preview:
      access.state !== "UNLOCKED",
    timestamp: new Date().toISOString(),
    moments,
    geoStory,
    cinematicScenes,
    memorySnapshot,
    receipt,
    insights,
    asset: {
      id: asset.id,
      slug: asset.slug,
      category:
        asset.category ?? undefined,
      accountId: asset.accountId,
      paid: asset.paid,
    },
  };
}
