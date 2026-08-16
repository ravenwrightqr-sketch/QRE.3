import assert from "node:assert/strict";
import type { ExperienceMoment, MemorySnapshot } from "@qre/contracts";
import { buildMemorySnapshot } from "../../geo/buildMemorySnapshot.js";
import { buildServiceReceipt } from "../../receiptBuilder.js";
import { evolveRuntimeMemory } from "../../cognition/serviceMemoryState.js";

const moment = (input: Partial<ExperienceMoment>): ExperienceMoment => ({
  type: "story",
  component: "story",
  text: input.text ?? "A captured moment.",
  description: input.description ?? input.text ?? "A captured moment.",
  editable: true,
  demo: false,
  order: input.order ?? 0,
  payload: input.payload ?? {},
  meta: input.meta ?? {},
  ...input,
});

const first = moment({
  text: "Maria arrived at 9:04 AM and the kitchen was spotless.",
  payload: { participants: ["Maria"], place: "Riverside", details: ["kitchen"], lens: "professional" },
  meta: { time: "9:04 AM", label: "Riverside" },
});
const second = moment({
  type: "system",
  text: "Service completed; the home was ready for the client.",
  payload: { label: "Kitchen and home cleaning" },
  meta: { event: "SERVICE_COMPLETE", time: "11:47 AM" },
  order: 1,
});

const prior: MemorySnapshot = buildMemorySnapshot({
  assetId: "asset-1",
  moments: [first],
  geoStory: null,
  cinematicScenes: [],
});

const evolved = evolveRuntimeMemory([second], prior);
assert.equal(evolved.meta?.evolutionCount, 2, "runtime memory must evolve instead of resetting");
assert.ok(evolved.highlights.some((value) => /service completed/i.test(value)), "new state must contribute a highlight");
assert.ok(evolved.entities?.some((value) => /kitchen/i.test(value)), "memory must retain contextual entities");

const snapshot = buildMemorySnapshot({
  assetId: "asset-1",
  moments: [first, second],
  geoStory: null,
  cinematicScenes: [],
  prior,
});
assert.equal(snapshot.id, prior.id, "memory identity must persist across evolution");
assert.equal(snapshot.meta?.evolutionCount, 2, "snapshot evolution count must persist");
assert.ok(snapshot.timeline.length === 2, "snapshot timeline must represent current experience moments");

const receipt = buildServiceReceipt({
  asset: { id: "asset-1", slug: "marias-cleaning", category: "service" },
  sessionId: "session-1",
  moments: [first, second],
});
assert.ok(/service completed/i.test(receipt.summary), "receipt should use the actual completion moment");
assert.ok(receipt.lineItems?.some((item) => /kitchen and home cleaning/i.test(item.label)), "receipt should expose service work");
assert.equal(receipt.metadata?.completedEvent, "SERVICE_COMPLETE", "receipt must preserve completion semantics");
assert.equal(receipt.metadata?.cognitiveSteps, 2, "receipt should expose cognitive step count");

console.log("RUNTIME COGNITION ACCEPTANCE: PASS");
