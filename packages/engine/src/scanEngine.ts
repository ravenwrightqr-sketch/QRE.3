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
import { buildGeoStory } from "./geo/geoStoryCompiler.js";
import { buildMemorySnapshot } from "./geo/buildMemorySnapshot.js";
import { cinematicRuntime } from "./runtime/cinematic/cinematicRuntime.js";
import { createStoryDelivery } from "./delivery/StoryDeliveryEngine.js";
import { getScanInsights } from "./analytics/analyticsService.js";
import { runFlowActions } from "./flowOrchestrator.js";
import { buildServiceReceipt } from "./receiptBuilder.js";
import type { FlowStepType, ExperienceMoment, Experience } from "@qre/contracts";

type ScanEngineInput = {
  slug: string;
  userId?: string;
  geo?: { lat: number; lng: number; accuracy?: number };
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
  const asset = await repos.assetRepository.findBySlug(input.slug);

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

  const session = await repos.sessionRepository.create({
    assetId: asset.id,
    flowId: asset.flow?.id ?? null,
  });

  const access = await resolveAccessEngine(
    { assetId: asset.id, userId: input.userId },
    repos.accessRepository,
  );

  const moments: ExperienceMoment[] = [];
  moments.push(...systemMoments(access.state));

  if (access.state !== "UNLOCKED") {
    moments.push(...purchaseMoments(access.state, asset.slug));
  }

  if (access.state === "UNLOCKED" && asset.flow?.steps?.length) {
    const flowMoments = flowToMoment(
      asset.flow.steps.map((step: FlowStepRecord) => ({
        id: step.id,
        order: step.order,
        type: step.type as FlowStepType,
        payload:
          typeof step.payload === "object" && step.payload !== null && !Array.isArray(step.payload)
            ? step.payload as Record<string, unknown>
            : {},
      })),
    );
    const offset = moments.length;
    moments.push(...flowMoments.map((moment) => ({ ...moment, order: moment.order + offset })));
  }

  moments.sort((a, b) => a.order - b.order);

  try {
    await runFlowActions(
      moments,
      session.id,
      asset.id,
      input.geo,
      input.userId,
      repos.analyticsRepository,
    );
  } catch (err) {
    console.warn("[FLOW ACTION FAILED]", err);
  }

  let geoStory = null;
  try {
    geoStory = await buildGeoStory(
      asset.id,
      input.geo ? [{ lat: input.geo.lat, lng: input.geo.lng, createdAt: new Date() }] : [],
    );
  } catch (err) {
    console.warn("[GEO STORY FAILED]", err);
  }

  const cinematicScenes = cinematicRuntime({ moments, geoStory });

  let memorySnapshot = null;
  if (access.state === "UNLOCKED") {
    memorySnapshot = buildMemorySnapshot({ assetId: asset.id, moments, geoStory, cinematicScenes });
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
      console.warn("[STORY DELIVERY FAILED]", err);
    }
  }

  const hasServiceCompletion = moments.some(
    (m) => m.type === "system" && m.meta?.event === "SERVICE_COMPLETE",
  );
  const isServiceAsset = asset.category === "service" || asset.category === "business";
  const receipt = access.state === "UNLOCKED" && isServiceAsset && hasServiceCompletion
    ? buildServiceReceipt({ asset, sessionId: session.id, moments })
    : null;

  const insights = await getScanInsights(asset.id, repos.analyticsRepository);

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
    access: access.state,
    preview: access.state !== "UNLOCKED",
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
      category: asset.category ?? undefined,
      accountId: asset.accountId,
      paid: asset.paid,
    },
  };
}
