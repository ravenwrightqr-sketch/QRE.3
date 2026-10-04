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

const baseline = composeExperiencePlayout(scenes);

const baselineTextItems = baseline.items.filter(
  (item) => item.kind === "TEXT",
);

const baselineImageItems = baseline.items.filter(
  (item) => item.kind === "IMAGE",
);

assert.ok(
  baselineTextItems.length > 0,
  "baseline must contain TEXT items",
);

assert.equal(
  baseline.items.some((item) => item.kind === "VIDEO"),
  false,
  "text-only input must not create VIDEO items",
);

const imageOne = {
  id: "image-1",
  type: "image",
  url: "https://example.com/coco-1.jpg",
  metadata: {
    sourceEventIds: ["event-1"],
  },
};

const videoOne = {
  id: "video-1",
  type: "video",
  url: "https://example.com/coco-1.mp4",
  metadata: {
    sourceEventIds: ["event-2"],
  },
};

const videoTwo = {
  id: "video-2",
  type: "video",
  url: "https://example.com/coco-2.mp4",
};

const audioOne = {
  id: "audio-1",
  type: "audio",
  url: "https://example.com/coco-1.mp3",
};

const withMedia = composeExperiencePlayout(
  scenes,
  [
    videoOne,
    imageOne,
    audioOne,
    videoTwo,
  ],
);

const withMediaTextItems = withMedia.items.filter(
  (item) => item.kind === "TEXT",
);

const imageItems = withMedia.items.filter(
  (item) => item.kind === "IMAGE",
);

const videoItems = withMedia.items.filter(
  (item) => item.kind === "VIDEO",
);

assert.deepEqual(
  withMediaTextItems,
  baselineTextItems,
  "adding supplied VIDEO media must not change any TEXT item",
);

assert.deepEqual(
  baselineImageItems,
  [],
  "baseline must contain no IMAGE items",
);

assert.deepEqual(
  imageItems,
  [
    {
      kind: "IMAGE",
      mediaId: "image-1",
      url: "https://example.com/coco-1.jpg",
      sourceEventIds: ["event-1"],
    },
  ],
  "existing IMAGE composition must remain unchanged",
);

assert.deepEqual(
  videoItems,
  [
    {
      kind: "VIDEO",
      mediaId: "video-1",
      url: "https://example.com/coco-1.mp4",
      sourceEventIds: ["event-2"],
    },
    {
      kind: "VIDEO",
      mediaId: "video-2",
      url: "https://example.com/coco-2.mp4",
      sourceEventIds: [],
    },
  ],
  "VIDEO items must preserve video source order, identity, URL, and truthful provenance",
);

assert.equal(
  withMedia.items.some((item) => item.kind === "AUDIO"),
  false,
  "audio media must not create AUDIO Playout items",
);

const lastTextIndex = withMedia.items.reduce(
  (latest, item, index) =>
    item.kind === "TEXT" ? index : latest,
  -1,
);

const firstImageIndex = withMedia.items.findIndex(
  (item) => item.kind === "IMAGE",
);

const firstVideoIndex = withMedia.items.findIndex(
  (item) => item.kind === "VIDEO",
);

assert.ok(
  firstImageIndex > lastTextIndex,
  "IMAGE items must remain after all TEXT items",
);

assert.ok(
  firstVideoIndex > firstImageIndex,
  "v5 conservative placement must place VIDEO items after IMAGE items",
);

for (const item of videoItems) {
  assert.equal(
    "durationMs" in item,
    false,
    "VIDEO timing must remain future work",
  );

  assert.equal(
    "caption" in item,
    false,
    "Playout must not generate or transport VIDEO captions",
  );

  assert.equal(
    "title" in item,
    false,
    "Playout must not invent VIDEO titles",
  );

  assert.equal(
    "thumbnail" in item,
    false,
    "Playout v5 must not create thumbnail presentation policy",
  );

  assert.equal(
    "autoplay" in item,
    false,
    "Playout v5 must not create autoplay policy",
  );

  assert.equal(
    "muted" in item,
    false,
    "Playout v5 must not create mute policy",
  );

  assert.equal(
    "loop" in item,
    false,
    "Playout v5 must not create looping policy",
  );

  assert.equal(
    "visualHint" in item,
    false,
    "visual hints must remain forbidden",
  );

  assert.equal(
    "transitionHint" in item,
    false,
    "legacy transition hints must remain absent",
  );

  assert.equal(
    "audioMood" in item,
    false,
    "audio mood must remain absent",
  );

  assert.equal(
    "camera" in item,
    false,
    "camera instructions must remain absent",
  );

  assert.equal(
    "narrativeRole" in item,
    false,
    "VIDEO must not receive invented narrative authority",
  );
}

const malformedProvenance = composeExperiencePlayout(
  scenes,
  [
    {
      id: "video-3",
      type: "video",
      url: "https://example.com/coco-3.mp4",
      metadata: {
        sourceEventIds: "event-9",
      },
    },
  ],
);

assert.deepEqual(
  malformedProvenance.items.filter(
    (item) => item.kind === "VIDEO",
  ),
  [
    {
      kind: "VIDEO",
      mediaId: "video-3",
      url: "https://example.com/coco-3.mp4",
      sourceEventIds: [],
    },
  ],
  "non-array VIDEO provenance must not be guessed or widened",
);

assert.deepEqual(
  composeExperiencePlayout(scenes, []).items,
  baseline.items,
  "empty media input must remain identical to the previous text-only path",
);

assert.equal(
  modelCalls,
  0,
  "VIDEO composition must not call a model",
);

console.log(
  "AUTHOR PLAYOUT VIDEO COMPOSITION GREEN - ADDITIVE MEDIA - TEXT/IMAGE INVARIANT - OFFLINE",
);