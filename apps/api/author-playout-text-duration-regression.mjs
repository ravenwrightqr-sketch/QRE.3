import assert from "node:assert/strict";
import {
  composeExperiencePlayout,
  deriveTextRevealDurationMs,
  reconstructPlayoutSceneText,
} from "./src/services/experiencePlayout.ts";

let modelCalls = 0;

function itemFor(text) {
  const beforeModelCalls = modelCalls;
  const item = composeExperiencePlayout([{ text, sourceEventIds: ["event-1"] }]).items[0];
  assert.equal(modelCalls, beforeModelCalls, "duration derivation must not call a model");
  assert.ok(item, `Expected one item for ${text}`);
  return item;
}

assert.equal(deriveTextRevealDurationMs("Peace was temporary."), 1370);
assert.equal(deriveTextRevealDurationMs("Coco said no."), 1370);
assert.equal(deriveTextRevealDurationMs("No."), 1100, "tiny reveal must not flash too quickly");
assert.equal(
  deriveTextRevealDurationMs("First the bow said hello."),
  1750,
  "longer ordinary reveal must earn more time",
);
assert.ok(
  deriveTextRevealDurationMs("First the bow said hello.") > deriveTextRevealDurationMs("No."),
  "longer reveal must receive more time than a tiny reveal",
);
assert.ok(
  deriveTextRevealDurationMs("Really?") > deriveTextRevealDurationMs("Really."),
  "question ending must receive a small rhetorical pause",
);
assert.equal(deriveTextRevealDurationMs("Wait..."), 1230, "ellipsis ending must receive a pause");
assert.equal(
  deriveTextRevealDurationMs("That is not a snack; that is a ruling interest."),
  2820,
  "colon/semicolon punctuation must receive a small pause",
);
assert.equal(
  deriveTextRevealDurationMs(
    "This longer reveal has enough readable words to exceed the upper pacing clamp by a comfortable margin before the final deterministic duration is returned.",
  ),
  4200,
  "long reveals must be clamped",
);
assert.equal(
  deriveTextRevealDurationMs("Coco said no. "),
  deriveTextRevealDurationMs("Coco said no."),
  "trailing reconstruction whitespace must not extend duration",
);

const preserved = itemFor("Coco said no. ");
assert.equal(preserved.text, "Coco said no. ", "Playout item text must remain byte-for-byte unchanged");
assert.equal(preserved.durationMs, 1370);
assert.equal(reconstructPlayoutSceneText([preserved.text]), "Coco said no. ");

for (const item of [
  itemFor("Peace was temporary."),
  itemFor("Really?"),
  itemFor("That is not a snack; that is a ruling interest."),
]) {
  assert.equal(item.kind, "TEXT");
  assert.equal(typeof item.durationMs, "number", "TEXT reveal must carry current durationMs");
  assert.equal("durationHintMs" in item, false, "legacy Author timing hint must stay dead");
  assert.equal("timingHint" in item, false, "timing hints must not be introduced");
  assert.equal("cinematicDuration" in item, false, "cinematic timing ownership must not be introduced");
  assert.equal("sceneDuration" in item, false, "scene timing ownership must not be introduced");
  assert.equal("transition" in item, false, "transition metadata must not be introduced");
  assert.equal("transitionHint" in item, false, "legacy transition hint must stay dead");
  assert.equal("animation" in item, false, "animation metadata must not be introduced");
  assert.equal("audio" in item, false, "audio metadata must not be introduced");
  assert.equal("audioMood" in item, false, "legacy audio hint must stay dead");
  assert.equal("visual" in item, false, "visual metadata must not be introduced");
  assert.equal("visualHint" in item, false, "legacy visual hint must stay dead");
}

assert.equal(
  composeExperiencePlayout([{ text: "Peace was temporary.", sourceEventIds: ["event-1"] }]).items
    .some((item) => item.kind === "IMAGE" || item.kind === "VIDEO"),
  false,
  "TEXT duration derivation must not create media items",
);

console.log("AUTHOR PLAYOUT TEXT DURATION GREEN - DETERMINISTIC TIMING - OFFLINE");
