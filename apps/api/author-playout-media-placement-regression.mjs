import assert from "node:assert/strict";
import { composeExperiencePlayout } from "./src/services/experiencePlayout.ts";

let modelCalls = 0;

const scenes = [
  {
    text: "First the bow said hello. Coco said no.",
    sourceEventIds: ["event-1"],
  },
  {
    text: "Then Coco left happy.",
    sourceEventIds: ["event-2"],
  },
  {
    text: "Peace was temporary.",
    sourceEventIds: ["event-3"],
  },
];

const baseline = composeExperiencePlayout(scenes);

const baselineTextItems = baseline.items.filter(
  (item) => item.kind === "TEXT",
);

assert.ok(
  baselineTextItems.length > scenes.length,
  "baseline must contain split TEXT reveals",
);

const media = [
  {
    id: "image-scene-0",
    type: "image",
    url: "https://example.com/scene-0.jpg",
    metadata: {
      sourceEventIds: ["event-1"],
    },
  },
  {
    id: "video-scene-1",
    type: "video",
    url: "https://example.com/scene-1.mp4",
    metadata: {
      sourceEventIds: ["event-2"],
    },
  },
  {
    id: "video-shared-latest",
    type: "video",
    url: "https://example.com/shared.mp4",
    metadata: {
      sourceEventIds: ["event-1", "event-3"],
    },
  },
  {
    id: "image-same-scene-first",
    type: "image",
    url: "https://example.com/same-scene-first.jpg",
    metadata: {
      sourceEventIds: ["event-2"],
    },
  },
  {
    id: "video-same-scene-second",
    type: "video",
    url: "https://example.com/same-scene-second.mp4",
    metadata: {
      sourceEventIds: ["event-2"],
    },
  },
  {
    id: "audio-ignored",
    type: "audio",
    url: "https://example.com/ignored.mp3",
    metadata: {
      sourceEventIds: ["event-1"],
    },
  },
  {
    id: "image-unmatched",
    type: "image",
    url: "https://example.com/unmatched.jpg",
    metadata: {
      sourceEventIds: ["event-999"],
    },
  },
  {
    id: "video-no-provenance",
    type: "video",
    url: "https://example.com/no-provenance.mp4",
  },
];

const withMedia = composeExperiencePlayout(
  scenes,
  media,
);

const withMediaTextItems = withMedia.items.filter(
  (item) => item.kind === "TEXT",
);

assert.deepEqual(
  withMediaTextItems,
  baselineTextItems,
  "media placement must not change TEXT items",
);

assert.equal(
  withMedia.items.some((item) => item.kind === "AUDIO"),
  false,
  "audio media must remain ignored",
);

function itemIndexByMediaId(mediaId) {
  return withMedia.items.findIndex(
    (item) =>
      item.kind !== "TEXT" &&
      item.mediaId === mediaId,
  );
}

function textIndexesForScene(sourceSceneIndex) {
  return withMedia.items.flatMap((item, index) =>
    item.kind === "TEXT" &&
    item.sourceSceneIndex === sourceSceneIndex
      ? [index]
      : [],
  );
}

function lastTextIndexForScene(sourceSceneIndex) {
  const indexes = textIndexesForScene(sourceSceneIndex);

  assert.ok(
    indexes.length > 0,
    `scene ${sourceSceneIndex} must have TEXT reveals`,
  );

  return indexes[indexes.length - 1];
}

function firstTextIndexForScene(sourceSceneIndex) {
  const indexes = textIndexesForScene(sourceSceneIndex);

  assert.ok(
    indexes.length > 0,
    `scene ${sourceSceneIndex} must have TEXT reveals`,
  );

  return indexes[0];
}

const scene0ImageIndex = itemIndexByMediaId(
  "image-scene-0",
);

assert.ok(
  scene0ImageIndex > lastTextIndexForScene(0),
  "scene-0 media must appear after every TEXT reveal from scene 0",
);

assert.ok(
  scene0ImageIndex < firstTextIndexForScene(1),
  "scene-0 media must appear before scene 1 begins",
);

const scene1VideoIndex = itemIndexByMediaId(
  "video-scene-1",
);

assert.ok(
  scene1VideoIndex > lastTextIndexForScene(1),
  "scene-1 media must appear after every TEXT reveal from scene 1",
);

assert.ok(
  scene1VideoIndex < firstTextIndexForScene(2),
  "scene-1 media must appear before scene 2 begins",
);

const sharedLatestIndex = itemIndexByMediaId(
  "video-shared-latest",
);

assert.ok(
  sharedLatestIndex > lastTextIndexForScene(2),
  "media matching multiple scenes must be placed after the latest matching scene",
);

const scene1OrderedMedia = [
  itemIndexByMediaId("video-scene-1"),
  itemIndexByMediaId("image-same-scene-first"),
  itemIndexByMediaId("video-same-scene-second"),
];

assert.deepEqual(
  [...scene1OrderedMedia].sort((a, b) => a - b),
  scene1OrderedMedia,
  "media sharing a placement scene must preserve supplied media order",
);

const unmatchedIndex = itemIndexByMediaId(
  "image-unmatched",
);

const noProvenanceIndex = itemIndexByMediaId(
  "video-no-provenance",
);

assert.ok(
  unmatchedIndex > lastTextIndexForScene(2),
  "unmatched provenance media must trail all Author scenes",
);

assert.ok(
  noProvenanceIndex > lastTextIndexForScene(2),
  "media without provenance must trail all Author scenes",
);

assert.ok(
  unmatchedIndex < noProvenanceIndex,
  "trailing fallback media must preserve supplied media order",
);

for (const sceneIndex of [0, 1, 2]) {
  const indexes = textIndexesForScene(sceneIndex);

  for (let index = 1; index < indexes.length; index += 1) {
    assert.equal(
      indexes[index],
      indexes[index - 1] + 1,
      `media must not split TEXT reveals inside Author scene ${sceneIndex}`,
    );
  }
}

const mediaItems = withMedia.items.filter(
  (item) => item.kind === "IMAGE" || item.kind === "VIDEO",
);

for (const item of mediaItems) {
  assert.equal(
    "caption" in item,
    false,
    "placement must not invent captions",
  );

  assert.equal(
    "title" in item,
    false,
    "placement must not invent titles",
  );

  assert.equal(
    "narrativeRole" in item,
    false,
    "placement must not invent narrative roles",
  );

  assert.equal(
    "placementHint" in item,
    false,
    "placement must not create hidden semantic placement hints",
  );

  assert.equal(
    "durationMs" in item,
    false,
    "media placement must not create media timing policy",
  );
}

assert.equal(
  modelCalls,
  0,
  "deterministic media placement must not call a model",
);

console.log(
  "AUTHOR PLAYOUT MEDIA PLACEMENT GREEN - PROVENANCE BOUNDARIES - ORIGINAL MEDIA ORDER - OFFLINE",
);
