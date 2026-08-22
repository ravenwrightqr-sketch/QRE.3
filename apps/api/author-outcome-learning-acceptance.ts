import assert from "node:assert/strict";
import { AnalyticsEventTypes } from "@qre/contracts";
import { normalizeExperienceOutcome } from "./src/services/authorOutcomeLearning.js";

assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.FLOW_COMPLETE), "positive");
assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.EXPERIENCE_REPLAY), "positive");
assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.EXPERIENCE_SAVED), "positive");
assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.EXPERIENCE_SHARED), "positive");
assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.CTA_CLICK), "positive");
assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.FLOW_ABANDON), "negative");
assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.ERROR), "negative");
assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.SCAN), "neutral");
assert.equal(normalizeExperienceOutcome(AnalyticsEventTypes.SESSION_START), "neutral");

console.log("AUTHOR OUTCOME LEARNING ACCEPTANCE: PASS");
console.log("positive=complete,replay,save,share,cta");
console.log("negative=abandon,error");
console.log("neutral=scan,session_start");
