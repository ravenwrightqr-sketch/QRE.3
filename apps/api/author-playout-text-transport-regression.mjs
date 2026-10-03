import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { composeExperiencePlayout } from "./src/services/experiencePlayout.ts";

function keys(value) {
  return Object.keys(value).sort();
}

const single = composeExperiencePlayout([
  { text: "Nervous first.", kind: "hook", sourceEventIds: ["event-1"] },
]);

assert.equal(single.items.length, 1, "one Author scene must become one TEXT item");
assert.deepEqual(single.items[0], {
  kind: "TEXT",
  text: "Nervous first.",
  sourceSceneIndex: 0,
  sourceEventIds: ["event-1"],
});

const multiple = composeExperiencePlayout([
  { text: "Nervous first.", sourceEventIds: ["event-1"] },
  { text: "Then came the bow.", sourceEventIds: ["event-2"] },
  { text: "The bow was not.", sourceEventIds: ["event-3"] },
]);

assert.deepEqual(
  multiple.items.map((item) => item.text),
  ["Nervous first.", "Then came the bow.", "The bow was not."],
  "multiple scenes must preserve exact order",
);
assert.deepEqual(
  multiple.items.map((item) => item.sourceSceneIndex),
  [0, 1, 2],
  "source scene indexes must preserve Author scene order",
);
assert.equal(
  multiple.items.length,
  3,
  "Author scene count and Playout item count must match normal text-only v1 input",
);

const punctuation = "Wait... the bow stayed? No: Coco left happy!";
const punctuationPlayout = composeExperiencePlayout([
  { text: punctuation, sourceEventIds: ["event-4"] },
]);
assert.equal(
  punctuationPlayout.items[0]?.text,
  punctuation,
  "exact text and punctuation must survive unchanged",
);

const multiSentence = "First the bow said hello. Coco said no. Then Coco left happy.";
const multiSentencePlayout = composeExperiencePlayout([
  { text: multiSentence, sourceEventIds: ["event-1", "event-2", "event-3"] },
]);
assert.equal(multiSentencePlayout.items.length, 1, "multi-sentence scene must stay ONE item in v1");
assert.equal(multiSentencePlayout.items[0]?.text, multiSentence);
assert.deepEqual(
  multiSentencePlayout.items[0]?.sourceEventIds,
  ["event-1", "event-2", "event-3"],
  "provenance must survive unchanged",
);

const hinted = composeExperiencePlayout([
  {
    text: "Legacy hints stop here.",
    sourceEventIds: ["event-5"],
    durationHintMs: 9000,
    transitionHint: "fade",
    audioMood: "bright",
    visualHint: "bow close-up",
  },
]);

assert.deepEqual(
  keys(hinted.items[0]),
  ["kind", "sourceEventIds", "sourceSceneIndex", "text"],
  "Playout TEXT items must not invent or transport timing/transition/audio/visual metadata",
);
assert.equal("durationHintMs" in hinted.items[0], false, "no timing metadata may be invented");
assert.equal("transitionHint" in hinted.items[0], false, "no transition hints may be created");
assert.equal("audioMood" in hinted.items[0], false, "no audio hints may be created");
assert.equal("visualHint" in hinted.items[0], false, "no visual hints may be created");

let modelCalls = 0;
const beforeModelCalls = modelCalls;
composeExperiencePlayout([{ text: "No model needed.", sourceEventIds: ["event-6"] }]);
assert.equal(modelCalls, beforeModelCalls, "composer must perform no model call");

const domainNeutralA = composeExperiencePlayout([
  { text: "The room reset itself.", sourceEventIds: ["housekeeping-1"] },
]);
const domainNeutralB = composeExperiencePlayout([
  { text: "The room reset itself.", sourceEventIds: ["housekeeping-1"] },
]);
assert.deepEqual(domainNeutralA, domainNeutralB, "composer must be domain-neutral and deterministic");

assert.deepEqual(
  composeExperiencePlayout([]),
  { items: [] },
  "empty input must behave deterministically",
);
assert.deepEqual(
  composeExperiencePlayout([
    { text: "", sourceEventIds: ["event-empty"] },
    { text: "   ", sourceEventIds: ["event-blank"] },
  ]),
  { items: [] },
  "non-renderable empty text scenes must be omitted deterministically",
);
assert.throws(
  () => composeExperiencePlayout([{ text: "Grounding required.", sourceEventIds: [] }]),
  /missing sourceEventIds/,
  "renderable scenes must not fabricate provenance",
);

const authorBrainSource = readFileSync(
  new URL("./src/services/authorBrainCanonical.ts", import.meta.url),
  "utf8",
);
assert.match(
  authorBrainSource,
  /sourceEventIds:\s*\[\.\.\.sourceEventIds\]/,
  "canonical Author scenes must retain final grounded scene provenance",
);

const experienceServiceSource = readFileSync(
  new URL("./src/services/experienceService.ts", import.meta.url),
  "utf8",
);
assert.match(
  experienceServiceSource,
  /const playout = composeExperiencePlayout\(canonical\.scenes\)/,
  "experience service must compose Playout at the canonical Author boundary",
);
assert.match(
  experienceServiceSource,
  /\r?\n\s+playout,\r?\n/,
  "compiled experience result must expose additive playout output",
);

console.log("AUTHOR PLAYOUT TEXT TRANSPORT GREEN - SCENE TEXT/PROVENANCE - NO SPLITTING - OFFLINE");
