import {
  AnalyticsEventTypes,
  type AnalyticsEventType,
} from "./src/analytics.js";

const contractEvents = Object.values(AnalyticsEventTypes).sort();
const unique = new Set(contractEvents);

const invalid = contractEvents.filter(
  (value): value is AnalyticsEventType =>
    typeof value !== "string" || value.trim().length === 0,
);

console.log("ANALYTICS CONTRACT REGISTRY CHECK");
console.log(`contractEvents=${contractEvents.length}`);
console.log(`duplicates=${contractEvents.length - unique.size}`);
console.log(`invalid=${invalid.length}`);

if (unique.size !== contractEvents.length) {
  throw new Error("Duplicate analytics event types detected.");
}

if (invalid.length > 0) {
  throw new Error(
    `Invalid analytics event types: ${invalid.join(", ")}`,
  );
}

console.log("ANALYTICS CONTRACT REGISTRY: PASS");