import assert from "node:assert/strict";
import { checkIn } from "./src/presence/checkIn.js";
import { checkOut } from "./src/presence/checkOut.js";
import {
  subscribeSpine,
} from "./src/spine/eventSpine.js";
import type { PresenceRepository } from "./src/repositories/index.js";

const events: Array<{
  type: string;
  assetId: string;
  sessionId?: string;
  userId?: string;
}> = [];

const presenceRepository = {
  async upsertSession(input) {
    return {
      id: input.id,
      assetId: input.assetId,
      userId: input.userId ?? null,
      status: input.status,
    };
  },

  async createGeoProof() {},

  async checkOut(input) {
    return {
      id: input.sessionId,
      status: "LEFT",
    };
  },

  async getPresenceMap() {
    return [];
  },

  async getPresenceReplay() {
    return [];
  },

  async getPresenceTimeline() {
    return [];
  },
} as PresenceRepository;

const unsubscribe = subscribeSpine(async (event) => {
  events.push({
    type: event.type,
    assetId: event.assetId,
    sessionId: event.sessionId,
    userId: event.userId,
  });
});

await checkIn(
  {
    assetId: "asset-presence-test",
    sessionId: "session-presence-test",
    userId: "user-presence-test",
  },
  presenceRepository,
);

await checkOut(
  "session-presence-test",
  "asset-presence-test",
  "user-presence-test",
  presenceRepository,
);

unsubscribe();

assert.equal(events.length, 2);

assert.deepEqual(events[0], {
  type: "CHECK_IN",
  assetId: "asset-presence-test",
  sessionId: "session-presence-test",
  userId: "user-presence-test",
});

assert.deepEqual(events[1], {
  type: "CHECK_OUT",
  assetId: "asset-presence-test",
  sessionId: "session-presence-test",
  userId: "user-presence-test",
});

assert.equal(
  events.filter((event) => event.type === "CHECK_IN").length,
  1,
);

assert.equal(
  events.filter((event) => event.type === "CHECK_OUT").length,
  1,
);

console.log("ENGINE SPINE PRESENCE ACCEPTANCE: PASS");
