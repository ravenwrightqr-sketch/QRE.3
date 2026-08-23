import assert from "node:assert/strict";
import { runFlowActions } from "./src/flowOrchestrator.js";
import { subscribeSpine } from "./src/spine/eventSpine.js";

const events: Array<{
  type: string;
  assetId: string;
  sessionId?: string;
  stepIndex?: number;
  meta?: Record<string, unknown>;
}> = [];

const unsubscribe = subscribeSpine(async (event) => {
  events.push({
    type: event.type,
    assetId: event.assetId,
    sessionId: event.sessionId,
    stepIndex: event.stepIndex,
    meta: event.meta,
  });
});

const moments = [
  {
    order: 0,
    type: "message",
    text: "First step",
    meta: {},
  },
  {
    order: 1,
    type: "message",
    text: "Second step",
    meta: {},
  },
  {
    order: 2,
    type: "message",
    text: "Third step",
    meta: {},
  },
];

await runFlowActions(
  moments as any,
  "session-flow-test",
  "asset-flow-test",
);

unsubscribe();

assert.equal(events.length, 4);

const stepEvents = events.filter(
  (event) => event.type === "FLOW_STEP",
);

const completeEvents = events.filter(
  (event) => event.type === "FLOW_COMPLETE",
);

assert.equal(stepEvents.length, 3);
assert.equal(completeEvents.length, 1);

assert.deepEqual(
  stepEvents.map((event) => event.stepIndex),
  [0, 1, 2],
);

assert.equal(completeEvents[0]?.meta?.steps, 3);

for (const event of events) {
  assert.equal(event.assetId, "asset-flow-test");
  assert.equal(event.sessionId, "session-flow-test");
}

console.log("ENGINE SPINE FLOW ACCEPTANCE: PASS");
