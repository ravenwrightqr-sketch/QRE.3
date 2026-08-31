
import "dotenv/config";

import { Prisma, db } from "@qre/db";
import { scanEngine } from "@qre/engine";

import { createAssetRepository } from "./src/repositories/assetRepository.js";
import { createSessionRepository } from "./src/repositories/sessionRepository.js";
import { createAccessRepository } from "./src/repositories/accessRepository.js";
import { createAnalyticsRepository } from "./src/repositories/analyticsRepository.js";
import { createStoryDeliveryRepository } from "./src/repositories/storyDeliveryRepository.js";
import { createPresenceRepository } from "./src/repositories/presenceRepository.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Find a real active asset whose currently active flow contains
 * a production location step with geoMemory enabled.
 *
 * This is intentionally read-only discovery.
 */const locationAssetRows =
  await db.$queryRaw<
    Array<{
      asset_id: string;
      slug: string;
      paid: boolean;
      flow_id: string;
      flow_name: string;
      step_id: string;
    }>
  >(
    Prisma.sql`
      WITH selected_flows AS (
        SELECT DISTINCT ON (af."assetId")
          af."assetId",
          af."flowId",
          af.priority
        FROM "AssetFlow" af
        WHERE af.active = true
        ORDER BY
          af."assetId",
          af.priority DESC,
          af."createdAt" DESC
      )
      SELECT
        a.id AS asset_id,
        a.slug,
        a.paid,
        f.id AS flow_id,
        f.name AS flow_name,
        fs.id AS step_id
      FROM "Asset" a
      JOIN selected_flows sf
        ON sf."assetId" = a.id
      JOIN "Flow" f
        ON f.id = sf."flowId"
      JOIN "FlowStep" fs
        ON fs."flowId" = f.id
      WHERE a.status = 'active'
        AND a.paid = true
        AND fs.type = 'location'
        AND (fs.payload ->> 'geoMemory') = 'true'
      ORDER BY
        a.id,
        fs."order"
      LIMIT 1
    `,
  );

const locationAsset =
  locationAssetRows[0];

assert(
  locationAsset,
  "No active asset with an active location + geoMemory=true flow step is available for Scan Engine acceptance.",
);

const asset = {
  id: locationAsset.asset_id,
  slug: locationAsset.slug,
  paid: locationAsset.paid,
};

console.log(
  "SCAN ENGINE PRESENCE ACCEPTANCE TARGET",
);

console.log(
  `Asset=${asset.id}`,
);

console.log(
  `Slug=${asset.slug}`,
);

console.log(
  `Paid=${asset.paid}`,
);

console.log(
  `Flow=${locationAsset.flow_name}`,
);

console.log(
  `FlowId=${locationAsset.flow_id}`,
);

console.log(
  `LocationStep=${locationAsset.step_id}`,
);

const assetRepository =
  createAssetRepository();

const sessionRepository =
  createSessionRepository();

const analyticsRepository =
  createAnalyticsRepository();

const accessRepository =
  createAccessRepository();

const storyDeliveryRepository =
  createStoryDeliveryRepository();

const presenceRepository =
  createPresenceRepository();

const result =
  await scanEngine(
    {
      slug: asset.slug,

      /*
       * Real location input.
       *
       * The purpose here is not to assert that this
       * particular coordinate is meaningful. It exists
       * to exercise the production geo/check-in path.
       */
      geo: {
        lat: 34.052235,
        lng: -118.243683,
        accuracy: 25,
      },
    },
    {
      assetRepository,
      sessionRepository,
      analyticsRepository,
      accessRepository,
      presenceRepository,
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

const session =
  await db.scanSession.findUnique({
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

/**
 * The scan and presence systems intentionally use the
 * same production session identity.
 */
const presenceSession =
  await db.presenceSession.findUnique({
    where: {
      id: result.sessionId,
    },
    select: {
      id: true,
      assetId: true,
      status: true,
      enteredAt: true,
      exitedAt: true,
      geoLat: true,
      geoLng: true,
      accuracy: true,
    },
  });

assert(
  presenceSession,
  "Production scan did not persist a PresenceSession for its scan session.",
);

assert(
  presenceSession.assetId === asset.id,
  "PresenceSession assetId mismatch.",
);

assert(
  presenceSession.id === result.sessionId,
  "PresenceSession id does not match the production scan session.",
);

assert(
  presenceSession.status === "ENTERED" ||
    presenceSession.status === "LEFT",
  `Unexpected PresenceSession status: ${presenceSession.status}`,
);

assert(
  presenceSession.enteredAt instanceof Date,
  "PresenceSession enteredAt was not persisted.",
);

assert(
  presenceSession.geoLat === 34.052235,
  `PresenceSession geoLat mismatch: expected 34.052235, got ${presenceSession.geoLat ?? "null"}`,
);

assert(
  presenceSession.geoLng === -118.243683,
  `PresenceSession geoLng mismatch: expected -118.243683, got ${presenceSession.geoLng ?? "null"}`,
);

const geoProof =
  await db.geoProof.findFirst({
    where: {
      assetId: asset.id,
      sessionId: result.sessionId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      assetId: true,
      sessionId: true,
      lat: true,
      lng: true,
      accuracy: true,
      source: true,
      label: true,
      city: true,
      region: true,
      country: true,
    },
  });

assert(
  geoProof,
  "Production scan supplied geo but did not persist GeoProof.",
);

assert(
  geoProof.assetId === asset.id,
  "GeoProof assetId mismatch.",
);

assert(
  geoProof.sessionId === result.sessionId,
  "GeoProof sessionId mismatch.",
);

assert(
  geoProof.lat === 34.052235,
  `GeoProof lat mismatch: expected 34.052235, got ${geoProof.lat}`,
);

assert(
  geoProof.lng === -118.243683,
  `GeoProof lng mismatch: expected -118.243683, got ${geoProof.lng}`,
);

assert(
  geoProof.source === "checkin",
  `GeoProof source mismatch: expected checkin, got ${geoProof.source}`,
);

const analyticsEvents =
  await db.analyticsEvent.findMany({
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

const eventTypes =
  analyticsEvents.map(
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
  eventTypes[0] ===
    "SESSION_START",
  `Expected first analytics event SESSION_START, got ${eventTypes[0] ?? "none"}`,
);

assert(
  eventTypes[eventTypes.length - 1] ===
    "SESSION_END",
  `Expected final analytics event SESSION_END, got ${eventTypes[eventTypes.length - 1] ?? "none"}`,
);

assert(
  analyticsEvents.every(
    (event) =>
      event.assetId === asset.id,
  ),
  "Analytics assetId mismatch.",
);

assert(
  analyticsEvents.every(
    (event) =>
      event.sessionId ===
      result.sessionId,
  ),
  "Analytics event points at the wrong session.",
);

assert(
  result.moments.length ===
    (
      session.moments &&
      Array.isArray(
        session.moments,
      )
        ? session.moments.length
        : 0
    ),
  "Persisted moments count does not match returned moments.",
);

assert(
  result.cinematicScenes.length ===
    (
      session.cinematicScenes &&
      Array.isArray(
        session.cinematicScenes,
      )
        ? session.cinematicScenes.length
        : 0
    ),
  "Persisted cinematic sequence count does not match returned sequence.",
);

/**
 * Verify the location action was actually present in the
 * executable production moment set.
 */
const locationMoments =
  result.moments.filter(
    (moment) =>
      moment.type === "location" &&
      moment.meta?.geoMemory === true,
  );

assert(
  locationMoments.length > 0,
  "Production scan selected a location-enabled flow but no executable geoMemory location moment reached the runtime.",
);

console.log(
  "SCAN ENGINE PRESENCE ACCEPTANCE: PASS",
);

console.log(
  `Asset=${asset.id}`,
);

console.log(
  `Slug=${asset.slug}`,
);

console.log(
  `Flow=${locationAsset.flow_name}`,
);

console.log(
  `Session=${result.sessionId}`,
);

console.log(
  `Access=${result.access}`,
);

console.log(
  `Moments=${result.moments.length}`,
);

console.log(
  `LocationMoments=${locationMoments.length}`,
);

console.log(
  `Sequence=${result.cinematicScenes.length}`,
);

console.log(
  `Analytics=${analyticsEvents.length}`,
);

console.log(
  `PresenceSession=${presenceSession.id}`,
);

console.log(
  `PresenceStatus=${presenceSession.status}`,
);

console.log(
  `GeoProof=${geoProof.id}`,
);

console.log(
  `GeoSource=${geoProof.source}`,
);

console.log(
  `GeoLabel=${geoProof.label ?? "none"}`,
);

console.log(
  `GeoCity=${geoProof.city ?? "none"}`,
);

console.log(
  `GeoRegion=${geoProof.region ?? "none"}`,
);

console.log(
  `GeoCountry=${geoProof.country ?? "none"}`,
);

console.log(
  `FirstAnalytics=${eventTypes[0]}`,
);

console.log(
  `LastAnalytics=${
    eventTypes[
      eventTypes.length - 1
    ]
  }`,
);

/*
 * Clean only the records created by this
 * acceptance test.
 *
 * ScanSession deletion is intentionally last so
 * the presence and geo rows can be removed first.
 */
await db.geoProof.deleteMany({
  where: {
    sessionId:
      result.sessionId,
  },
});

await db.presenceSession.delete({
  where: {
    id:
      result.sessionId,
  },
});

await db.scanSession.delete({
  where: {
    id:
      result.sessionId,
  },
});

await db.$disconnect();
