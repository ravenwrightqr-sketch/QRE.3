import "dotenv/config";

import { db } from "@qre/db";
import { AnalyticsEventTypes } from "@qre/contracts";

import { compileExperience } from "./src/services/experienceService.js";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";
import { getCreativeLearningContext } from "./src/services/creativeLearning.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(`AUTHOR FULL SYSTEM ACCEPTANCE FAILED: ${message}`);
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

const requestedAssetId =
  process.env.QRE_AUTHOR_FULL_SYSTEM_ASSET_ID?.trim();

const asset = requestedAssetId
  ? await db.asset.findUnique({
      where: { id: requestedAssetId },
      select: {
        id: true,
        status: true,
        displayName: true,
        category: true,
        templateData: true,
        account: { select: { name: true, type: true } },
      },
    })
  : await db.asset.findFirst({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        displayName: true,
        category: true,
        templateData: true,
        account: { select: { name: true, type: true } },
      },
    });

assert(
  asset,
  requestedAssetId
    ? `asset ${requestedAssetId} was not found`
    : "no active asset exists",
);

assert(
  asset.status === "active",
  `asset ${asset.id} is not active`,
);

const templateData = asRecord(asset.templateData);

const domainSignals = [
  asset.category,
  asset.account?.name,
  asset.account?.type,
  asset.displayName,
  templateData?.category,
  templateData?.businessType,
  templateData?.businessName,
  templateData?.businessDescription,
  templateData?.serviceType,
  templateData?.serviceName,
  templateData?.subjectKind,
  templateData?.services,
  templateData?.capabilities,
  templateData?.offerings,
  templateData?.serviceNames,
  templateData?.contextualSignals,
  templateData?.signals,
];

assert(
  domainSignals.some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  ),
  "selected asset has no saved business/domain context to exercise",
);

const sessionId = crypto.randomUUID();

const lens =
  process.env.QRE_AUTHOR_FULL_SYSTEM_LENS?.trim() || "fierce";

const userId =
  process.env.QRE_AUTHOR_FULL_SYSTEM_USER_ID?.trim() || undefined;

const prompt =
  process.env.QRE_AUTHOR_FULL_SYSTEM_PROMPT?.trim() ||
  "Coco came in nervous, the service went well, something unexpectedly memorable happened, and Coco left happy. Create a short QRE-style living memory receipt film.";

const memoryRepository = createMemoryRepository();

let scanSessionCreated = false;

try {
  /*
   * The Author acceptance uses one sessionId across the entire compile.
   *
   * AnalyticsEvent.sessionId is a real foreign key to ScanSession.id,
   * so the test must create the corresponding ScanSession first.
   */
  await db.scanSession.create({
    data: {
      id: sessionId,
      assetId: asset.id,
      userId: userId ?? null,
      status: "active",
    },
  });

  scanSessionCreated = true;

  const beforeMemory = await memoryRepository.loadContext({
    assetId: asset.id,
    userId,
  });

  const result = await compileExperience({
    prompt,
    assetId: asset.id,
    userId,
    sessionId,
    memoryRepository,
    lens,
  });

  assert(
    !result.warnings?.includes("domain_context_unavailable"),
    "saved domain context could not be loaded",
  );

  assert(
    !result.warnings?.includes("memory_context_unavailable"),
    "memory context could not be loaded",
  );

  assert(
    !result.warnings?.includes("creative_learning_context_unavailable"),
    "creative learning context could not be loaded",
  );

  assert(
    !result.warnings?.includes("author_memory_analytics_failed"),
    "AI_MEMORY_USED analytics persistence failed during compile",
  );

  assert(
    !result.warnings?.includes("author_decision_analytics_failed"),
    "AI_CINEMATIC_DECISION analytics persistence failed during compile",
  );

  assert(
    !result.warnings?.includes("author_learning_analytics_failed"),
    "AI_MEMORY_LEARNED analytics persistence failed during compile",
  );

  assert(
    result.authorDiagnostics &&
      typeof result.authorDiagnostics === "object",
    "Author diagnostics missing",
  );

  const diagnostics = result.authorDiagnostics as {
    qualityStatus?: unknown;
    complete?: unknown;
    renderable?: unknown;
    selectedScore?: unknown;
  };

  assert(
    diagnostics.qualityStatus === "ACCEPTED",
    `Author quality status was ${String(diagnostics.qualityStatus)}`,
  );

  assert(
    diagnostics.complete === true,
    "Author sequence was incomplete",
  );

  assert(
    diagnostics.renderable === true,
    "Author result was not renderable",
  );

  assert(
    typeof diagnostics.selectedScore === "number" &&
      Number.isFinite(diagnostics.selectedScore),
    "Author selected score was not finite",
  );

  assert(
    result.moments.length > 0,
    "no authored moments were produced",
  );

  assert(
    result.cinematicScenes.length === result.moments.length,
    "cinematic scene count does not match moment count",
  );

  assert(
    result.beats?.length === result.moments.length,
    "beat count does not match authored moment count",
  );

  const authoringMeta = asRecord(
    asRecord(result.blueprint.metadata)?.authoring,
  );

  assert(
    authoringMeta?.realizationPath === "authorBrainCanonical",
    "canonical Author path was not recorded in the compiled experience",
  );

  assert(
    String(authoringMeta?.lens ?? "").toLowerCase() === lens.toLowerCase(),
    `lens did not survive compile boundary: expected ${lens}, got ${String(authoringMeta?.lens)}`,
  );

  const afterMemory = await memoryRepository.loadContext({
    assetId: asset.id,
    userId,
  });

  assert(
    afterMemory.entities.length >= beforeMemory.entities.length ||
      afterMemory.events.length > beforeMemory.events.length,
    "compiled experience did not persist new memory material",
  );

  assert(
    result.authorExperienceState != null,
    "Author experience state was not produced/persisted",
  );

  const learningAfter = await getCreativeLearningContext({
    assetId: asset.id,
    userId,
  });

  assert(
    learningAfter && typeof learningAfter === "object",
    "creative learning context could not be reloaded after authoring",
  );

  const analyticsEvents = await db.analyticsEvent.findMany({
    where: {
      assetId: asset.id,
      sessionId,
      type: {
        in: [
          AnalyticsEventTypes.AI_MEMORY_USED,
          AnalyticsEventTypes.AI_CINEMATIC_DECISION,
          AnalyticsEventTypes.AI_MEMORY_LEARNED,
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    select: {
      type: true,
      sessionId: true,
      meta: true,
    },
  });

  const types = new Set(
    analyticsEvents.map((event) => event.type),
  );

  assert(
    types.has(AnalyticsEventTypes.AI_MEMORY_USED),
    "AI_MEMORY_USED analytics event was not persisted",
  );

  assert(
    types.has(AnalyticsEventTypes.AI_CINEMATIC_DECISION),
    "AI_CINEMATIC_DECISION analytics event was not persisted",
  );

  assert(
    types.has(AnalyticsEventTypes.AI_MEMORY_LEARNED),
    "AI_MEMORY_LEARNED analytics event was not persisted",
  );

  assert(
    analyticsEvents.every(
      (event) => event.sessionId === sessionId,
    ),
    "Author analytics events did not retain the compile session id",
  );

  const hasUserPreferenceEvent = analyticsEvents.some((event) =>
    [
      AnalyticsEventTypes.AI_CREATIVE_ACCEPTED,
      AnalyticsEventTypes.AI_CREATIVE_REJECTED,
      AnalyticsEventTypes.AI_VARIATION_SELECTED,
    ].includes(event.type as never),
  );

  assert(
    !hasUserPreferenceEvent,
    "Author compile incorrectly emitted user creative-preference feedback",
  );

  console.log("AUTHOR FULL SYSTEM ACCEPTANCE: PASS");
  console.log(`Asset=${asset.id}`);
  console.log(
    `Subject=${String(result.blueprint.sourcePrompt ?? prompt).slice(0, 120)}`,
  );
  console.log(`Lens=${lens}`);
  console.log(`Session=${sessionId}`);
  console.log(`Moments=${result.moments.length}`);
  console.log(`Scenes=${result.cinematicScenes.length}`);
  console.log(
    `MemoryBefore=${beforeMemory.entities}/${beforeMemory.facts}/${beforeMemory.relations}/${beforeMemory.events}`,
  );
  console.log(
    `MemoryAfter=${afterMemory.entities}/${afterMemory.facts}/${afterMemory.relations}/${afterMemory.events}`,
  );
  console.log(`LearningSignals=${learningAfter.signals.length}`);
  console.log(`Analytics=${[...types].sort().join(",")}`);
} finally {
  /*
   * Remove test analytics first because AnalyticsEvent.sessionId
   * references the ScanSession created above.
   */
  await db.analyticsEvent.deleteMany({
    where: {
      assetId: asset.id,
      sessionId,
    },
  });

  if (scanSessionCreated) {
    await db.scanSession.delete({
      where: {
        id: sessionId,
      },
    });
  }

  await db.$disconnect();
}