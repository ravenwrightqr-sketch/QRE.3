import assert from "node:assert/strict";
import { buildMovieBeatPlan } from "./src/services/authorMovieBeatPlan.js";

const plan = buildMovieBeatPlan({
  textBeats: [
    { id: "text-1", text: "Coco arrived nervous.", attentionRole: "hook" },
    { id: "text-2", text: "The bath changed everything.", attentionRole: "turn" },
    { id: "text-3", text: "The blue bow became the incident.", attentionRole: "reveal" },
    { id: "text-4", text: "Coco left looking fabulous.", attentionRole: "payoff" },
    { id: "text-5", text: "Peace was temporary.", attentionRole: "afterglow" },
  ],
  media: [
    { id: "before", type: "image", url: "https://example.invalid/before.jpg", role: "evidence", observedAt: "2026-08-21T17:00:00Z", metadata: { stage: "before" } },
    { id: "moment", type: "image", url: "https://example.invalid/moment.jpg", role: "evidence", observedAt: "2026-08-21T17:20:00Z", metadata: { stage: "moment" } },
    { id: "after", type: "image", url: "https://example.invalid/after.jpg", role: "evidence", observedAt: "2026-08-21T18:00:00Z", metadata: { stage: "after" } },
  ],
  textBeatTarget: 5,
  mode: "auto",
  cta: { text: "Want to keep Coco's story?" },
});

assert.equal(plan.textBeatTarget, 5);
assert.equal(plan.manualOverride, false);
assert.equal(plan.beats.filter((beat) => beat.kind === "text").length, 5);
assert.equal(plan.beats.filter((beat) => beat.kind === "photo").length, 3);
assert.equal(plan.beats.at(-1)?.kind, "cta");
assert.equal(plan.beats.filter((beat) => beat.kind === "photo").every((beat) => beat.silent === true), true);
assert.deepEqual(plan.selectedMediaIds, ["before", "moment", "after"]);
assert.equal(plan.beats.find((beat) => beat.id === "movie-photo-before")?.reason, "before evidence");
assert.equal(plan.beats.find((beat) => beat.id === "movie-photo-after")?.reason, "after evidence");

const manual = buildMovieBeatPlan({
  textBeats: [{ id: "text-1", text: "Manual order." }],
  media: [],
  mode: "manual",
});
assert.equal(manual.manualOverride, true);
assert.equal(manual.mode, "manual");

console.log("AUTHOR MOVIE BEAT PLAN ACCEPTANCE: PASS");
console.log(`text=${plan.beats.filter((beat) => beat.kind === "text").length}`);
console.log(`photos=${plan.beats.filter((beat) => beat.kind === "photo").length}`);
console.log(`cta=${plan.beats.at(-1)?.kind}`);
console.log(`silentPhotos=${plan.beats.filter((beat) => beat.kind === "photo").every((beat) => beat.silent === true)}`);
console.log(`manualOverride=${manual.manualOverride}`);
