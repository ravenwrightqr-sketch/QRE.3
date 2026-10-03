import assert from "node:assert/strict";
import {
  composeExperiencePlayout,
  reconstructPlayoutSceneText,
} from "./src/services/experiencePlayout.ts";

let modelCalls = 0;

function playoutFor(text, sourceSceneIndex = 0, sourceEventIds = ["event-1"]) {
  return composeExperiencePlayout([
    {
      text,
      sourceEventIds,
    },
  ]).items.filter((item) => item.sourceSceneIndex === sourceSceneIndex);
}

function assertSceneReveals(text, expected, sourceEventIds = ["event-1"]) {
  const beforeModelCalls = modelCalls;
  const items = playoutFor(text, 0, sourceEventIds);

  assert.deepEqual(
    items.map((item) => item.text),
    expected,
    `Unexpected reveals for: ${text}`,
  );
  assert.equal(
    reconstructPlayoutSceneText(items.map((item) => item.text)),
    text,
    "reconstruction must exactly reproduce original source scene text",
  );
  assert.deepEqual(
    items.map((item) => item.sourceSceneIndex),
    expected.map(() => 0),
    "all reveals from one scene must retain the source scene index",
  );
  assert.deepEqual(
    items.map((item) => item.sourceEventIds),
    expected.map(() => sourceEventIds),
    "all reveals from one scene must retain identical source provenance",
  );
  assert.deepEqual(
    items.map((item) => item.revealIndex),
    expected.map((_, index) => index),
    "revealIndex must start at zero and increment deterministically",
  );
  assert.equal(modelCalls, beforeModelCalls, "reveal splitting must not call a model");

  for (const item of items) {
    assert.equal(item.kind, "TEXT", "Playout v2 reveal splitting must only create TEXT items");
    assert.equal("duration" in item, false, "no timing metadata may exist");
    assert.equal("durationHintMs" in item, false, "no timing metadata may exist");
    assert.equal("transition" in item, false, "no transition metadata may exist");
    assert.equal("transitionHint" in item, false, "no transition metadata may exist");
    assert.equal("audio" in item, false, "no audio metadata may exist");
    assert.equal("audioMood" in item, false, "no audio metadata may exist");
    assert.equal("visual" in item, false, "no visual metadata may exist");
    assert.equal("visualHint" in item, false, "no visual metadata may exist");
  }
}

assertSceneReveals("Peace was temporary.", ["Peace was temporary."]);

assertSceneReveals(
  "First the bow said hello. Coco said no. Then Coco left happy.",
  ["First the bow said hello. ", "Coco said no. ", "Then Coco left happy."],
);

assertSceneReveals(
  "Tiny ceremony. Big objection.",
  ["Tiny ceremony. ", "Big objection."],
);

assertSceneReveals(
  "That is not a snack; that is a ruling interest.",
  ["That is not a snack; that is a ruling interest."],
);

assertSceneReveals(
  "Well. Blue looks good on me.",
  ["Well. Blue looks good on me."],
);

assertSceneReveals(
  "Arrived at 9:04 a.m. Finished at 11:47 a.m.",
  ["Arrived at 9:04 a.m. ", "Finished at 11:47 a.m."],
);

assertSceneReveals(
  "The visit lasted 3.5 hours. Then it ended.",
  ["The visit lasted 3.5 hours. ", "Then it ended."],
);

assertSceneReveals(
  "Nervous first.\nThen came the bow.\nThe bow was not.",
  ["Nervous first.\n", "Then came the bow.\n", "The bow was not."],
);

const multiScene = composeExperiencePlayout([
  { text: "First scene. Still first.", sourceEventIds: ["event-a"] },
  { text: "Second scene. Still second.", sourceEventIds: ["event-b"] },
]);

assert.deepEqual(
  multiScene.items.map((item) => ({
    text: item.text,
    sourceSceneIndex: item.sourceSceneIndex,
    revealIndex: item.revealIndex,
    sourceEventIds: item.sourceEventIds,
    kind: item.kind,
  })),
  [
    {
      text: "First scene. ",
      sourceSceneIndex: 0,
      revealIndex: 0,
      sourceEventIds: ["event-a"],
      kind: "TEXT",
    },
    {
      text: "Still first.",
      sourceSceneIndex: 0,
      revealIndex: 1,
      sourceEventIds: ["event-a"],
      kind: "TEXT",
    },
    {
      text: "Second scene. ",
      sourceSceneIndex: 1,
      revealIndex: 0,
      sourceEventIds: ["event-b"],
      kind: "TEXT",
    },
    {
      text: "Still second.",
      sourceSceneIndex: 1,
      revealIndex: 1,
      sourceEventIds: ["event-b"],
      kind: "TEXT",
    },
  ],
  "multiple source scenes must preserve global scene order and reset revealIndex per scene",
);

assert.equal(
  multiScene.items.some((item) => item.kind === "IMAGE" || item.kind === "VIDEO"),
  false,
  "TEXT reveal splitting must not create IMAGE or VIDEO items",
);

console.log("AUTHOR PLAYOUT REVEAL SPLITTING GREEN - SEMANTIC SCENE TO REVEAL UNITS - OFFLINE");
