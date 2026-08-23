import assert from "node:assert/strict";
import { emitSpineEvent } from "@qre/engine";
import {
  startAnalyticsSpineSubscriber,
} from "./src/services/analyticsSpineSubscriber.js";
import type { AnalyticsEventType } from "@qre/contracts";
import {
  mapEngineEventToAnalytics,
} from "./src/services/analyticsSpineSubscriber.js";
import {
  ANALYTICS_EVENT_REGISTRY,
} from "@qre/contracts";

const events: Array<{
  assetId: string;
  sessionId?: string;
  flowId?: string;
  stepIndex?: number;
  type: AnalyticsEventType;
  meta?: Record<string, unknown>;
}> = [];

const repository = {
  async trackEvent(input: (typeof events)[number]) {
    events.push(input);
  },
  async findEvents() {
    return [];
  },
  async countByType() {
    return {};
  },
  async getDashboardMetrics() {
    return {};
  },
};

const unsubscribe = startAnalyticsSpineSubscriber(repository);
const mappedTypes = [
  mapEngineEventToAnalytics({
    type: "SCAN_START",
    assetId: "asset-test",
  }),
  mapEngineEventToAnalytics({
    type: "FLOW_STEP",
    assetId: "asset-test",
  }),
  mapEngineEventToAnalytics({
    type: "AI_MEMORY_LEARNED",
    assetId: "asset-test",
  }),
  mapEngineEventToAnalytics({
    type: "CHECK_IN",
    assetId: "asset-test",
  }),
];

for (const type of mappedTypes) {
  assert.ok(type);
  assert.ok(
    ANALYTICS_EVENT_REGISTRY[type],
    `${type} must exist in analytics registry`,
  );
}
await emitSpineEvent({
  type: "CHECK_IN",
  assetId: "asset-test",
  sessionId: "session-test",
  userId: "user-test",
  meta: {
    test: true,
  },
});

unsubscribe();

assert.equal(events.length, 1);
assert.equal(events[0]?.type, "CHECK_IN");
assert.equal(events[0]?.assetId, "asset-test");
assert.equal(events[0]?.sessionId, "session-test");
assert.equal(events[0]?.meta?.source, "engine-spine");
assert.equal(events[0]?.meta?.engineEventType, "CHECK_IN");

console.log("ANALYTICS SPINE ACCEPTANCE: PASS");
