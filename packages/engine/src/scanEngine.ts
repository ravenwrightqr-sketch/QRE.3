import type { AssetRepository, SessionRepository, AccessRepository, FlowStepRecord, StoryDeliveryRepository, AnalyticsRepository } from "./repositories/index.js";
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

type ScanEngineInput = { slug: string; userId?: string; geo?: { lat: number; lng: number; accuracy?: number } };

export async function scanEngine(input: ScanEngineInput, repos: { assetRepository: AssetRepository; sessionRepository: SessionRepository; analyticsRepository: AnalyticsRepository; accessRepository: AccessRepository; storyDeliveryRepository: StoryDeliveryRepository }): Promise<Experience> {
  const asset = await repos.assetRepository.findBySlug(input.slug);
  if (!asset) return { sessionId: null, access: "DEMO", preview: true, asset: null, moments: [], geoStory: null, cinematicScenes: [], memorySnapshot: null, receipt: null, insights: [], timestamp: new Date().toISOString() };

  const session = await repos.sessionRepository.create({ assetId: asset.id, flowId: asset.flow?.id ?? null });
  const track = (type: string, meta?: unknown) => repos.analyticsRepository.trackEvent({ assetId: asset.id, sessionId: session.id, flowId: asset.flow?.id ?? null, type, meta });
  await track("SESSION_START", { access: "pending", authoredExperienceId: asset.experience?.id ?? null });

  const access = await resolveAccessEngine({ assetId: asset.id, userId: input.userId }, repos.accessRepository);
  await track("AI_DECISION", { stage: "access", accessState: access.state, authoredExperienceId: asset.experience?.id ?? null, sponsorConfigured: Boolean((asset.experience?.blueprint as any)?.sponsor) });

  const moments: ExperienceMoment[] = [...systemMoments(access.state)];
  if (access.state !== "UNLOCKED") moments.push(...purchaseMoments(access.state, asset.slug));
  if (access.state === "UNLOCKED" && asset.flow?.steps?.length) {
    const flowMoments = flowToMoment(asset.flow.steps.map((step: FlowStepRecord) => ({ id: step.id, order: step.order, type: step.type as FlowStepType, payload: typeof step.payload === "object" && step.payload !== null && !Array.isArray(step.payload) ? step.payload as Record<string, unknown> : {} })));
    const offset = moments.length;
    moments.push(...flowMoments.map((moment) => ({ ...moment, order: moment.order + offset })));
  }
  moments.sort((a, b) => a.order - b.order);
  await track("AI_MEMORY_USED", { memoryAware: Boolean(asset.experience), momentCount: moments.length, locations: moments.map((moment) => moment.location?.label ?? moment.meta?.label).filter(Boolean) });

  try {
    await runFlowActions(moments, session.id, asset.id, input.geo, input.userId, repos.analyticsRepository);
  } catch (err) {
    console.warn("[FLOW ACTION FAILED]", err);
    await track("ERROR", { stage: "flow-actions", error: String(err) });
  }

  let geoStory = null;
  try { geoStory = await buildGeoStory(asset.id, input.geo ? [{ lat: input.geo.lat, lng: input.geo.lng, createdAt: new Date() }] : []); }
  catch (err) { console.warn("[GEO STORY FAILED]", err); await track("ERROR", { stage: "geo-story", error: String(err) }); }

  const cinematicScenes = cinematicRuntime({ moments, geoStory });
  await track("AI_CINEMATIC_DECISION", { scenes: cinematicScenes.length, audioCapable: true, visualThemes: cinematicScenes.map((scene) => scene.visual?.theme).filter(Boolean) });

  let memorySnapshot = null;
  if (access.state === "UNLOCKED") {
    memorySnapshot = buildMemorySnapshot({ assetId: asset.id, moments, geoStory, cinematicScenes });
    await track("AI_MEMORY_LEARNED", { entities: (memorySnapshot?.entities ?? []).length, highlights: (memorySnapshot?.highlights ?? []).slice(0, 5), locationTags: memorySnapshot?.locationTags ?? [] });
  }

  if (access.state === "UNLOCKED") {
    try { await createStoryDelivery({ assetId: asset.id, sessionId: session.id, userId: input.userId ?? null, moments, geoStory, cinematicScenes }, repos.storyDeliveryRepository); }
    catch (err) { console.warn("[STORY DELIVERY FAILED]", err); await track("ERROR", { stage: "story-delivery", error: String(err) }); }
  }

  const hasServiceCompletion = moments.some((m) => m.type === "system" && m.meta?.event === "SERVICE_COMPLETE");
  const isServiceAsset = asset.category === "service" || asset.category === "business";
  const receipt = access.state === "UNLOCKED" && isServiceAsset && hasServiceCompletion
    ? buildServiceReceipt({ asset, sessionId: session.id, moments })
    : null;
  if (receipt) await track("AI_DECISION", { stage: "service-experience-delivery", receiptKind: receipt.kind, experienceId: receipt.experienceId, sponsorPresent: Boolean((asset.experience?.blueprint as any)?.sponsor) });

  const insights = await getScanInsights(asset.id, repos.analyticsRepository);
  await repos.sessionRepository.update(session.id, { moments, geoStory, cinematicScenes, memorySnapshot, receipt, endedAt: new Date(), status: "completed" });
  await track("SESSION_END", { completed: true, moments: moments.length, cinematicScenes: cinematicScenes.length, memoryLearned: Boolean(memorySnapshot), serviceExperience: Boolean(receipt) });

  return { sessionId: session.id, access: access.state, preview: access.state !== "UNLOCKED", timestamp: new Date().toISOString(), moments, geoStory, cinematicScenes, memorySnapshot, receipt, insights, asset: { id: asset.id, slug: asset.slug, category: asset.category ?? undefined, accountId: asset.accountId, paid: asset.paid } };
}
