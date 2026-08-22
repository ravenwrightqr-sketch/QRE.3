import assert from "node:assert/strict";
import { authorMoviePipeline } from "./src/services/authorMoviePipeline.js";

const input = {
  prompt: "Write a 5-line sequence about Coco. Final line: Peace was temporary.",
  subject: "Coco",
  facts: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  sourceMoments: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  cognitiveContext: {
    media: [
      { id: "before", type: "image" as const, url: "https://example.invalid/before.jpg", role: "evidence" as const, observedAt: "2026-08-21T17:00:00Z", metadata: { stage: "before" } },
      { id: "after", type: "image" as const, url: "https://example.invalid/after.jpg", role: "evidence" as const, observedAt: "2026-08-21T18:00:00Z", metadata: { stage: "after" } },
    ],
    textBeatTarget: 5,
    photoBeatsAreSilent: true,
  },
};

const { authored, movieBeatPlan } = await authorMoviePipeline(input);

assert.ok(authored);
assert.equal(movieBeatPlan.textBeatTarget, 5);
assert.equal(movieBeatPlan.mode, "auto");
assert.equal(movieBeatPlan.beats.filter((beat) => beat.kind === "text").length, Math.min(5, authored.scenes.length));
assert.equal(movieBeatPlan.beats.filter((beat) => beat.kind === "photo").length, 2);
assert.equal(movieBeatPlan.beats.filter((beat) => beat.kind === "photo").every((beat) => beat.silent === true), true);
assert.deepEqual(movieBeatPlan.selectedMediaIds, ["before", "after"]);

console.log("AUTHOR MOVIE PIPELINE ACCEPTANCE: PASS");
console.log(`authoredScenes=${authored.scenes.length}`);
console.log(`textBeats=${movieBeatPlan.beats.filter((beat) => beat.kind === "text").length}`);
console.log(`photoBeats=${movieBeatPlan.beats.filter((beat) => beat.kind === "photo").length}`);
console.log(`mode=${movieBeatPlan.mode}`);
console.log(`estimatedMs=${movieBeatPlan.estimatedDurationMs}`);
