import { compileCognitiveExperience, summarizeCognitiveAnalytics, classifyAnalyticsEvent } from "@qre/engine";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(classifyAnalyticsEvent("AI_CREATIVE_ACCEPTED").learningClass === "CREATIVE_PREFERENCE", "creative acceptance class is wrong");
assert(classifyAnalyticsEvent("FLOW_ABANDON").learningClass === "FRICTION_SIGNAL", "abandonment class is wrong");
assert(classifyAnalyticsEvent("MEMORY_UPDATED").learningClass === "MEMORY_SIGNAL", "memory class is wrong");
assert(classifyAnalyticsEvent("GEO_MARK").learningClass === "FACTUAL_WORLD", "geo class is wrong");
assert(classifyAnalyticsEvent("PAYMENT_COMPLETED").feedsAuthor === false, "business event must not silently feed Author taste");
assert(classifyAnalyticsEvent("ERROR").feedsAuthor === false, "runtime health must not silently feed Author taste");

const analytics = summarizeCognitiveAnalytics([
  {
    type: "AI_CREATIVE_ACCEPTED",
    meta: {
      feedback: "loves sharper reveals",
      trajectory: "reframe>contrast>payoff",
      styleTags: ["dry", "short", "attitude"],
      draft: "That changed everything.",
    },
  },
  {
    type: "AI_CREATIVE_REJECTED",
    meta: {
      feedback: "too explanatory",
      trajectory: "setup>setup>setup",
      styleTags: ["longform"],
      draft: "This is a detailed explanation.",
    },
  },
  {
    type: "AI_VARIATION_SELECTED",
    meta: {
      feedback: "preferred the punchier ending",
      trajectory: "reframe>payoff",
      styleTags: ["punchy"],
    },
  },
  { type: "SCAN" },
  { type: "FLOW_COMPLETE" },
  { type: "SESSION_END" },
  { type: "FLOW_ABANDON" },
  { type: "EXPERIENCE_REPLAY" },
  { type: "MEDIA_REPLAY" },
  { type: "PAYMENT_COMPLETED" },
  { type: "ERROR" },
]);

assert(analytics.accepted.some((value) => value.includes("sharper reveals")), "accepted creative learning did not enter analytics");
assert(analytics.accepted.some((value) => value.includes("punchier ending")), "selected variation did not enter analytics");
assert(analytics.rejected.some((value) => value.includes("too explanatory")), "rejected creative learning did not enter analytics");
assert(analytics.preferences.length === 0, "raw creative feedback should not masquerade as explicit preference metadata");
assert(analytics.completions === 1, "SESSION_END must not masquerade as completion");
assert(analytics.replays === 2, "experience/media replay events must reach cognitive analytics");
assert(analytics.abandons === 1, "flow abandonment must become friction learning");
assert(analytics.engagement > 0.4, "engagement should reflect real completion and replay behavior");
assert(analytics.friction > 0, "friction should reflect abandonment");

const result = compileCognitiveExperience("Coco returned happy and fun", {
  analytics,
  feedback: {
    accepted: analytics.accepted,
    rejected: analytics.rejected,
  },
});

assert(result.learningSignals.some((value) => value.includes("accepted:")), "accepted learning did not reach cognitive result");
assert(result.learningSignals.some((value) => value.includes("rejected:")), "rejected learning did not reach cognitive result");
assert(result.learningSignals.some((value) => value.includes("engagement:")), "engagement did not reach cognitive result");
assert(result.learningSignals.some((value) => value.includes("friction:")), "friction did not reach cognitive result");

console.log("AUTHOR LEARNING CLOSED LOOP ACCEPTANCE: PASS");
console.log(`Accepted=${analytics.accepted.length}`);
console.log(`Rejected=${analytics.rejected.length}`);
console.log(`Engagement=${analytics.engagement.toFixed(3)}`);
console.log(`Friction=${analytics.friction.toFixed(3)}`);
console.log(`LearningSignals=${result.learningSignals.length}`);
