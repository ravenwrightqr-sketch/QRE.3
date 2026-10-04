import assert from "node:assert/strict";
import { scanVisiblePlayout } from "./src/scanEngine.ts";

const persistedPlayout = {
  items: [
    {
      kind: "TEXT",
      text: "Coco arrived skeptical.",
      sourceSceneIndex: 0,
      revealIndex: 0,
      sourceEventIds: ["event-1"],
      durationMs: 1800,
    },
    {
      kind: "IMAGE",
      mediaId: "photo-1",
      url: "https://example.com/coco-before.jpg",
      sourceEventIds: ["event-1"],
    },
    {
      kind: "VIDEO",
      mediaId: "video-1",
      url: "https://example.com/coco-after.mp4",
      sourceEventIds: ["event-2"],
    },
  ],
};

const blueprint = {
  sourcePrompt: "Coco grooming",
  playout: persistedPlayout,
};

const unlocked = scanVisiblePlayout("UNLOCKED", blueprint);

assert.strictEqual(
  unlocked,
  persistedPlayout,
  "unlocked scan must return the exact persisted ExperiencePlayout object",
);

assert.deepEqual(
  unlocked,
  persistedPlayout,
  "unlocked scan must preserve TEXT/IMAGE/VIDEO content and ordering exactly",
);

assert.equal(
  scanVisiblePlayout("DEMO", blueprint),
  undefined,
  "demo scan must not expose persisted creation Playout",
);

assert.equal(
  scanVisiblePlayout("UNLOCKED", { sourcePrompt: "legacy creation" }),
  undefined,
  "legacy creation without persisted Playout must remain compatible",
);

assert.equal(
  scanVisiblePlayout("UNLOCKED", {
    playout: {
      items: [
        {
          kind: "IMAGE",
          mediaId: "broken",
          sourceEventIds: [],
        },
      ],
    },
  }),
  undefined,
  "malformed persisted Playout must not be exposed",
);

console.log(
  "SCAN PERSISTED PLAYOUT GREEN - SAME CREATION - UNLOCKED ONLY - OFFLINE",
);
