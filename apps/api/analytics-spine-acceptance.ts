import "dotenv/config";

import { db } from "@qre/db";
import {
  checkIn,
  checkOut,
} from "@qre/engine";

import { startAnalyticsSpineSubscriber } from "./src/services/analyticsSpineSubscriber.js";
import { createPresenceRepository } from "./src/repositories/presenceRepository.js";

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
  },
  select: {
    id: true,
  },
});

assert(
  asset,
  "No active asset available for analytics spine acceptance.",
);

const presenceSessionId = crypto.randomUUID();
const stopSubscriber =
  startAnalyticsSpineSubscriber();

const presenceRepository =
  createPresenceRepository();

try {
  await checkIn(
    {
      assetId: asset.id,
      sessionId: presenceSessionId,
    },
    presenceRepository,
  );

  await checkOut(
    presenceSessionId,
    asset.id,
    undefined,
    presenceRepository,
  );

  const events =
    await db.analyticsEvent.findMany({
      where: {
        assetId: asset.id,
        type: {
          in: ["CHECK_IN", "CHECK_OUT"],
        },
        meta: {
          path: ["presenceSessionId"],
          equals: presenceSessionId,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  assert(
    events.length === 2,
    `Expected 2 presence analytics events, got ${events.length}`,
  );

  assert(
    events[0]?.type === "CHECK_IN",
    `Expected CHECK_IN, got ${events[0]?.type ?? "none"}`,
  );

  assert(
    events[1]?.type === "CHECK_OUT",
    `Expected CHECK_OUT, got ${events[1]?.type ?? "none"}`,
  );

  assert(
    events.every(
      (event) => event.sessionId === null,
    ),
    "Presence events must not populate AnalyticsEvent.sessionId with a PresenceSession ID.",
  );

  const presenceSession =
    await db.presenceSession.findUnique({
      where: {
        id: presenceSessionId,
      },
      select: {
        id: true,
        status: true,
      },
    });

  assert(
    presenceSession,
    "PresenceSession was not persisted.",
  );

  console.log(
    "ANALYTICS SPINE ACCEPTANCE: PASS",
  );
  console.log(`Asset=${asset.id}`);
  console.log(
    `PresenceSession=${presenceSessionId}`,
  );
  console.log("CHECK_IN=CHECK_IN");
  console.log("CHECK_OUT=CHECK_OUT");
  console.log(
    "AnalyticsSessionId=null for presence events",
  );
  console.log(
    "PresenceSessionId preserved in metadata",
  );
} finally {
  stopSubscriber();

  await db.analyticsEvent.deleteMany({
    where: {
      assetId: asset.id,
      meta: {
        path: ["presenceSessionId"],
        equals: presenceSessionId,
      },
    },
  });

  await db.presenceSession.delete({
    where: {
      id: presenceSessionId,
    },
  });

  await db.$disconnect();
}