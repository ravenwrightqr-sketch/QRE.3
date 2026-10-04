import assert from "node:assert/strict";
import { composeExperiencePlayout } from "./src/services/experiencePlayout.ts";

let modelCalls = 0;

const scenes = [
  {
    text: "First the bow said hello. Coco said no.",
    sourceEventIds: ["event-1", "event-2"],
  },
  {
    text: "Then Coco left happy.",
    sourceEventIds: ["event-3"],
  },
];

const textOnly = composeExperiencePlayout(scenes);
const baselineTextItems = textOnly.items.filter((item) => item.kind === "TEXT");

assert.ok(baselineTextItems.length > 0, "baseline must contain TEXT items");
assert.equal(
  textOnly.items.some((item) => item.kind === "IMAGE"),
  false,
  "text-only input must not create IMAGE items",
);

const imageOne = {
  id: "image-1",
  type: "image",
  url: "https://example.com/coco-1.jpg",
  metadata: {
    sourceEventIds: ["event-2"],
  },
};

const imageTwo = {
  id: "image-2",
  type: "image",
  url: "https://example.com/coco-2.jpg",
};

const video = {
  id: "video-1",
  type: "video",
  url: "https://example.com/coco.mp4",
};

const audio = {
  id: "audio-1",
  type: "audio",
  url: "https://example.com/coco.mp3",
};

const withMedia = composeExperiencePlayout(
  scenes,
  [imageOne, video, imageTwo, audio],
);

const withMediaTextItems = withMedia.items.filter((item) => item.kind === "TEXT");
const imageItems = withMedia.items.filter((item) => item.kind === "IMAGE");

assert.deepEqual(
  withMediaTextItems,
  baselineTextItems,
  "adding supplied media must not change any TEXT item",
);

assert.equal(imageItems.length, 2, "only supplied image media may become IMAGE items");

assert.deepEqual(
  imageItems,
  [
    {
      kind: "IMAGE",
      mediaId: "image-1",
      url: "https://example.com/coco-1.jpg",
      sourceEventIds: ["event-2"],
    },
    {
      kind: "IMAGE",
      mediaId: "image-2",
      url: "https://example.com/coco-2.jpg",
      sourceEventIds: [],
    },
  ],
  "IMAGE items must preserve image source order, identity, URL, and truthful provenance",
);

const firstImageIndex = withMedia.items.findIndex((item) => item.kind === "IMAGE");
const lastTextIndex = withMedia.items.reduce(
  (latest, item, index) => item.kind === "TEXT" ? index : latest,
  -1,
);

assert.ok(
  firstImageIndex > lastTextIndex,
  "v4 conservative placement must append IMAGE items after all TEXT items",
);

for (const item of imageItems) {
  assert.equal("durationMs" in item, false, "IMAGE timing must remain future work");
  assert.equal("caption" in item, false, "Playout must not generate or transport captions");
  assert.equal("title" in item, false, "Playout must not invent media titles");
  assert.equal("visualHint" in item, false, "visual hints must remain forbidden");
  assert.equal("transition" in item, false, "transition metadata must remain absent");
  assert.equal("transitionHint" in item, false, "legacy transition hints must remain absent");
  assert.equal("audioMood" in item, false, "audio hints must remain absent");
  assert.equal("camera" in item, false, "camera instructions must remain absent");
  assert.equal("narrativeRole" in item, false, "media must not receive invented narrative authority");
}

assert.deepEqual(
  composeExperiencePlayout(scenes, []).items,
  textOnly.items,
  "empty media input must be deterministic and identical to v3 text-only output",
);

const malformedProvenance = composeExperiencePlayout(
  scenes,
  [
    {
      id: "image-3",
      type: "image",
      url: "https://example.com/coco-3.jpg",
      metadata: {
        sourceEventIds: "event-9",
      },
    },
  ],
);

assert.deepEqual(
  malformedProvenance.items.filter((item) => item.kind === "IMAGE"),
  [
    {
      kind: "IMAGE",
      mediaId: "image-3",
      url: "https://example.com/coco-3.jpg",
      sourceEventIds: [],
    },
  ],
  "non-array media provenance must not be guessed or widened",
);

assert.equal(modelCalls, 0, "IMAGE composition must not call a model");

console.log(
  "AUTHOR PLAYOUT IMAGE COMPOSITION GREEN - ADDITIVE MEDIA - TEXT INVARIANT - OFFLINE",
);
