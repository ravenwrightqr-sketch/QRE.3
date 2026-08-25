import { buildAuthorBehaviorProfile, summarizeAuthorBehaviorProfile } from "./src/services/authorBehaviorProfile.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const neutral = buildAuthorBehaviorProfile([]);
assert(neutral.confidence === 0, "empty history must have zero profile confidence");
assert(neutral.learnedSignals.length === 0, "empty history must not invent preferences");

const learned = buildAuthorBehaviorProfile([
  "accepted:feedback:loves sharper reveals",
  "accepted:style:short",
  "accepted:style:attitude",
  "accepted:feedback:punchier ending",
  "accepted:trajectory:reframe>contrast>payoff",
  "rejected:feedback:too explanatory",
  "rejected:style:longform",
  "rejected:feedback:repetitive",
  "engagement:0.9",
  "friction:0.1",
  "revisit:event-3",
  "prior tempo: revisit",
]);

assert(learned.confidence > 0.5, "repeated evidence should build meaningful confidence");
assert(learned.compressionPreference >= 0.35, "short/punchy acceptance should raise compression preference");
assert(learned.explanationAversion >= 0.35, "rejected explanatory/longform work should raise explanation aversion");
assert(learned.callbackAffinity >= 0.35, "revisit history should raise callback affinity");
assert(learned.surprisePreference >= 0.35, "sharp reveal/reframe history should raise surprise preference");
assert(learned.accelerationPreference >= 0.35, "engagement and tempo evidence should raise acceleration preference");
assert(learned.revisitAffinity >= 0.35, "revisit history should raise revisit affinity");
assert(learned.learnedSignals.some((value) => value.includes("SHORT PUNCHY")), "profile should expose short/punchy signal");
assert(learned.learnedSignals.some((value) => value.includes("EXPLANATORY")), "profile should expose explanation aversion");
assert(learned.learnedSignals.some((value) => value.includes("CALLBACKS")), "profile should expose callback affinity");
assert(summarizeAuthorBehaviorProfile(learned).some((value) => value.includes("PREFERENCE ONLY")), "profile summary must preserve truth boundary");

console.log("AUTHOR BEHAVIOR PROFILE ACCEPTANCE: PASS");
console.log(`Confidence=${learned.confidence.toFixed(3)}`);
console.log(`Compression=${learned.compressionPreference.toFixed(3)}`);
console.log(`ExplanationAversion=${learned.explanationAversion.toFixed(3)}`);
console.log(`Callback=${learned.callbackAffinity.toFixed(3)}`);
console.log(`Surprise=${learned.surprisePreference.toFixed(3)}`);
console.log(`Acceleration=${learned.accelerationPreference.toFixed(3)}`);
console.log(`Revisit=${learned.revisitAffinity.toFixed(3)}`);
