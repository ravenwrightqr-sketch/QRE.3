import assert from "node:assert/strict";
import { buildAuthorMediaContext } from "./src/services/authorMediaBridge.js";

const media = buildAuthorMediaContext([
  { id: "after", type: "image", url: "https://example.invalid/after.jpg", observedAt: "2026-08-21T18:10:00-07:00", role: "photo_beat" },
  { id: "before", type: "image", url: "https://example.invalid/before.jpg", observedAt: "2026-08-21T17:10:00-07:00" },
  { id: "detail", type: "image", url: "https://example.invalid/detail.jpg", observedAt: "2026-08-21T17:40:00-07:00" },
], { subject: "Coco" });

assert.equal(media.length, 3);
assert.deepEqual(media.map((item) => item.id), ["before", "detail", "after"]);
assert.equal(media[0]?.role, "evidence");
assert.equal(media[0]?.provenance?.source, "memory");
assert.equal(media[2]?.role, "photo_beat");
assert.ok(media.every((item) => item.provenance?.forbiddenExpansions.includes("invent_object")));

console.log("AUTHOR MEDIA CONTEXT ACCEPTANCE: PASS");
console.log(`media=${media.length}`);
console.log(`chronological=${media.map((item) => item.id).join(",")}`);
console.log(`silentReady=${media.every((item) => item.role === "evidence" || item.role === "photo_beat")}`);
console.log(`provenance=${media.every((item) => Boolean(item.provenance))}`);
