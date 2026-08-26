import "dotenv/config";

import { db } from "@qre/db";
import { scanEngine } from "@qre/engine";

import { createAssetRepository } from "./src/repositories/assetRepository.js";
import { createSessionRepository } from "./src/repositories/sessionRepository.js";
import { createAccessRepository } from "./src/repositories/accessRepository.js";
import { createAnalyticsRepository } from "./src/repositories/analyticsRepository.js";
import { createStoryDeliveryRepository } from "./src/repositories/storyDeliveryRepository.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const asset = await db.asset.findFirst({
  where: {
    status: "active",
    paid: false,
  },
  select: {
    id: true,
    slug: true,
  },
});
assert(
  asset,
  "No active unpaid asset without a flow is available for Scan Engine acceptance.",
);

const assetRepository = createAssetRepository();
const sessionRepository = createSessionRepository();
const analyticsRepository = createAnalyticsRepository();
const accessRepository = createAccessRepository();
const storyDeliveryRepository = createStoryDeliveryRepository();

const result = await scanEngine(
  {
    slug: asset.slug,
  },
  {
    assetRepository,
    sessionRepository,
    analyticsRepository,
    accessRepository,
    storyDeliveryRepository,
  },
);

assert(
  result.sessionId,
  "Scan Engine did not create a session.",
);

assert(
  result.asset?.id === asset.id,
  `Returned asset mismatch: expected ${asset.id}, got ${result.asset?.id ?? "none"}`,
);

const session = await db.scanSession.findUnique({
  where: {
    id: result.sessionId,
  },
  select: {
    id: true,
    assetId: true,
    status: true,
    endedAt: true,
    moments: true,
    geoStory: true,
    cinematicScenes: true,
    memorySnapshot: true,
    receipt: true,
  },
});

assert(
  session,
  "ScanSession was not persisted.",
);

assert(
  session.assetId === asset.id,
  "ScanSession assetId mismatch.",
);

assert(
  session.status === "completed",
  `Expected completed ScanSession, got ${session.status}`,
);

assert(
  session.endedAt instanceof Date,
  "ScanSession endedAt was not persisted.",
);

const analyticsEvents = await db.analyticsEvent.findMany({
  where: {
    sessionId: result.sessionId,
  },
  orderBy: {
    createdAt: "asc",
  },
  select: {
    id: true,
    type: true,
    assetId: true,
    sessionId: true,
    flowId: true,
    stepIndex: true,
    meta: true,
  },
});

const eventTypes = analyticsEvents.map(
  (event) => event.type,
);

const requiredEvents = [
  "SESSION_START",
  "AI_DECISION",
  "AI_MEMORY_USED",
  "AI_CINEMATIC_DECISION",
  "SESSION_END",
] as const;

for (const type of requiredEvents) {
  assert(
    eventTypes.includes(type),
    `Missing required Scan Engine analytics event: ${type}`,
  );
}

assert(
  eventTypes[0] === "SESSION_START",
  `Expected first analytics event SESSION_START, got ${eventTypes[0] ?? "none"}`,
);

assert(
  eventTypes[eventTypes.length - 1] === "SESSION_END",
  `Expected final analytics event SESSION_END, got ${eventTypes[eventTypes.length - 1] ?? "none"}`,
);

assert(
  analyticsEvents.every(
    (event) => event.assetId === asset.id,
  ),
  "Analytics assetId mismatch.",
);

assert(
  analyticsEvents.every(
    (event) => event.sessionId === result.sessionId,
  ),
  "Analytics event points at the wrong session.",
);

assert(
  result.moments.length ===
    (session.moments &&
    Array.isArray(session.moments)
      ? session.moments.length
      : 0),
  "Persisted moments count does not match returned moments.",
);

assert(
  result.cinematicScenes.length ===
    (session.cinematicScenes &&
    Array.isArray(session.cinematicScenes)
      ? session.cinematicScenes.length
      : 0),
  "Persisted cinematic sequence count does not match returned sequence.",
);

console.log("SCAN ENGINE ACCEPTANCE: PASS");
console.log(`Asset=${asset.id}`);
console.log(`Slug=${asset.slug}`);
console.log(`Session=${result.sessionId}`);
console.log(`Access=${result.access}`);
console.log(`Moments=${result.moments.length}`);
console.log(`Sequence=${result.cinematicScenes.length}`);
console.log(
  `Analytics=${analyticsEvents.length}`,
);
console.log(
  `FirstAnalytics=${eventTypes[0]}`,
);
console.log(
  `LastAnalytics=${eventTypes[eventTypes.length - 1]}`,
);

await db.scanSession.delete({
  where: {
    id: result.sessionId,
  },
});

await db.$disconnect();