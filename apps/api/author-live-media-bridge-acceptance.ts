import assert from "node:assert/strict";
import type { CognitiveAuthorMedia } from "@qre/contracts";
import { compileExperience } from "./src/services/experienceService.js";

const media: CognitiveAuthorMedia[] = [
  {
    id: "knowledge-before",
    type: "image",
    url: "data:image/jpeg;base64,before",
    role: "evidence",
    observedAt: "2026-08-21T17:10:00-07:00",
    source: "knowledge",
    metadata: { stage: "before" },
  },
  {
    id: "knowledge-after",
    type: "image",
    url: "data:image/jpeg;base64,after",
    role: "photo_beat",
    observedAt: "2026-08-21T18:10:00-07:00",
    source: "knowledge",
    metadata: { stage: "after" },
  },
];

const result = await compileExperience({
  prompt: "Create a short cinematic experience for Coco.",
  assetId: "author-live-media-acceptance",
  mediaLoader: async () => media,
});

const context = result.blueprint?.metadata?.cognitiveAuthorContext;
assert.ok(context, "live compile should expose the canonical cognitive author context");
assert.equal(context.media?.length, 2);
assert.deepEqual(context.media?.map((item: CognitiveAuthorMedia) => item.id), [
  "knowledge-before",
  "knowledge-after",
]);
assert.equal(context.media?.[0]?.provenance?.source, "memory");
assert.ok(context.media?.every((item: CognitiveAuthorMedia) => Boolean(item.provenance)));
assert.equal(context.photoBeatsAreSilent, true);

const photoBeats = (result.beats ?? []).filter((beat) => beat.kind === "photo");
if (photoBeats.length > 0) {
  assert.ok(photoBeats.every((beat) => beat.meta?.silent === true));
  assert.ok(photoBeats.every((beat) => Boolean(beat.media)));
}

console.log("AUTHOR LIVE MEDIA BRIDGE ACCEPTANCE: PASS");
console.log(`compileContextMedia=${context.media.length}`);
console.log(`chronological=${context.media.map((item: CognitiveAuthorMedia) => item.id).join(",")}`);
console.log(`provenance=${context.media.every((item: CognitiveAuthorMedia) => Boolean(item.provenance))}`);
console.log(`silentPhotoBeats=${photoBeats.length === 0 || photoBeats.every((beat) => beat.meta?.silent === true)}`);
