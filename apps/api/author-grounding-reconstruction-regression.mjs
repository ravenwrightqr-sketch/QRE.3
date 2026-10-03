import assert from "node:assert/strict";
import { applyAuthorGroundingVerifications } from "./src/services/authorCreativeGroundingVerifier.ts";

const suppliedReality = [
  { id: "event-1", text: "Milo loves walks" },
  { id: "event-2", text: "Milo loves bacon" },
  { id: "event-3", text: "Milo loves small dogs" },
];

const semicolonPreserved = applyAuthorGroundingVerifications({
  scenes: [{
    text: "That is not a snack; that is a ruling interest.",
    kind: "line",
    sourceEventIds: ["event-1", "event-2", "event-3"],
  }],
  suppliedReality,
  verifications: [
    {
      sceneIndex: 0,
      clauseIndex: 0,
      supported: true,
      supportKind: "FIGURATIVE",
      sourceEventIds: ["event-1", "event-2", "event-3"],
      concreteClaims: [],
      unsupportedClaims: [],
    },
    {
      sceneIndex: 0,
      clauseIndex: 1,
      supported: true,
      supportKind: "FIGURATIVE",
      sourceEventIds: ["event-1", "event-2", "event-3"],
      concreteClaims: [],
      unsupportedClaims: [],
    },
  ],
});

assert.equal(
  semicolonPreserved[0]?.text,
  "That is not a snack; that is a ruling interest.",
  "accepted grounded clauses must preserve authored semicolon separator",
);

const unsupportedRemoved = applyAuthorGroundingVerifications({
  scenes: [{
    text: "This part survives. Unsupported material goes away. This also survives.",
    kind: "line",
    sourceEventIds: ["event-1", "event-2"],
  }],
  suppliedReality,
  verifications: [
    {
      sceneIndex: 0,
      clauseIndex: 0,
      supported: true,
      supportKind: "FIGURATIVE",
      sourceEventIds: ["event-1"],
      concreteClaims: [],
      unsupportedClaims: [],
    },
    {
      sceneIndex: 0,
      clauseIndex: 1,
      supported: false,
      supportKind: "UNSUPPORTED",
      sourceEventIds: [],
      concreteClaims: ["unsupported material goes away"],
      unsupportedClaims: ["unsupported material goes away"],
    },
    {
      sceneIndex: 0,
      clauseIndex: 2,
      supported: true,
      supportKind: "FIGURATIVE",
      sourceEventIds: ["event-2"],
      concreteClaims: [],
      unsupportedClaims: [],
    },
  ],
});

assert.equal(
  unsupportedRemoved[0]?.text,
  "This part survives. This also survives.",
  "unsupported clause removal should keep surviving authored punctuation without inventing replacement text",
);

console.log("AUTHOR GROUNDING RECONSTRUCTION GREEN");
