import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyAuthorRealityEditorEdits } from "./dist/services/authorCreative.js";
import {
  applyAuthorGroundingVerifications,
  buildAuthorGroundingAtomicClauses,
} from "./dist/services/authorCreativeGroundingVerifier.js";

const creativeSource = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
const groundingSource = readFileSync(new URL("./src/services/authorCreativeGroundingVerifier.ts", import.meta.url), "utf8");

assert.match(creativeSource, /A supplied object, entity, event, action, state, or relationship licenses that supplied reality only\./);
assert.match(creativeSource, /Missing specificity must redirect creative pressure onto supplied reality itself, not complete the missing attribute\./);
assert.match(groundingSource, /Existence does not establish properties\./);
assert.match(groundingSource, /A supplied specificity becomes usable reality, but it does not unlock neighboring properties\./);
assert.match(groundingSource, /FIGURATIVE, PARAPHRASE, and CONTEXTUAL_TEXTURE cannot sanitize an embedded unsupported concrete or mental proposition\./);
assert.match(groundingSource, /priorAudit is upstream Claim Auditor context attached to an exact surviving authored span when available\. It is not evidence, proof, support, or a bypass\./);

const suppliedReality = [
  { id: "event-1", text: "The device was installed" },
  { id: "event-2", text: "The pressure check happened" },
  { id: "event-3", text: "The batch contained 2.4 gallons" },
  { id: "event-4", text: "The sample was blue" },
  { id: "event-5", text: "The panel was active" },
  { id: "event-6", text: "The transfer completed by hand" },
];

function audit(productions, audits) {
  return applyAuthorRealityEditorEdits({
    productions,
    auditorResponse: { audits },
  });
}

const universalAudit = audit(
  [
    {
      production: "A",
      lines: [{
        order: 1,
        text: [
          "The device was steel.",
          "The pressure was 42 PSI.",
          "Three units waited.",
          "The sample smelled sharp.",
          "The check used a digital meter.",
          "The active panel flashed.",
          "The batch contained 2.4 gallons.",
          "The sample was blue.",
          "The sample was cold.",
          "The pressure check became the whole argument.",
          "A clean argument.",
          "A steel casing.",
        ].join(" "),
        sourceEventIds: suppliedReality.map((event) => event.id),
      }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "The device was installed. The casing was steel.", sourceEventIds: ["event-1"] }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "The transfer completed by hand.", sourceEventIds: ["event-6"] }],
    },
  ],
  [
    {
      production: "A",
      spans: [
        { exactText: "The device was steel.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        { exactText: "The pressure was 42 PSI.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        { exactText: "Three units waited.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        { exactText: "The sample smelled sharp.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        { exactText: "The check used a digital meter.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        { exactText: "The active panel flashed.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        { exactText: "The batch contained 2.4 gallons.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-3"] },
        { exactText: "The sample was blue.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-4"] },
        { exactText: "The sample was cold.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        { exactText: "The pressure check became the whole argument.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
        { exactText: "A clean argument.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
        { exactText: "A steel casing.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
      ],
    },
    {
      production: "B",
      spans: [
        { exactText: "The device was installed.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] },
      ],
    },
    {
      production: "C",
      spans: [
        { exactText: "The transfer completed by hand.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-6"] },
      ],
    },
  ],
);

const aLine = universalAudit.productions.find((production) => production.production === "A")?.lines[0];
assert.equal(
  aLine?.text,
  "      The batch contained 2.4 gallons. The sample was blue.  The pressure check became the whole argument. A clean argument. ",
  "only supplied specificity and fact-free amplification may survive exact unsupported deletion without whitespace repair",
);
assert.deepEqual(
  universalAudit.diagnostics.find((diagnostic) => diagnostic.production === "A")?.removedSpans,
  [
    "The device was steel.",
    "The pressure was 42 PSI.",
    "Three units waited.",
    "The sample smelled sharp.",
    "The check used a digital meter.",
    "The active panel flashed.",
    "The sample was cold.",
    "A steel casing.",
  ],
  "existence must not license property, measurement, quantity, sensory detail, method, manifestation, neighbor property, or mixed unsupported material",
);

const bLine = universalAudit.productions.find((production) => production.production === "B")?.lines[0];
assert.equal(
  universalAudit.productions.find((production) => production.production === "B")?.lines.length,
  0,
  "substantive unaudited text must fail closed",
);
assert.equal(bLine, undefined);
assert.equal(
  universalAudit.diagnostics.find((diagnostic) => diagnostic.production === "B")?.unusableReason,
  "reality_auditor_unaudited_substantive_material",
);

const cLine = universalAudit.productions.find((production) => production.production === "C")?.lines[0];
assert.equal(cLine?.text, "The transfer completed by hand.", "supplied method specificity must remain usable");

const atomic = buildAuthorGroundingAtomicClauses([{
  text: "The pressure check became the whole argument. The active panel flashed.",
  kind: "line",
  sourceEventIds: ["event-2", "event-5"],
  auditSpans: [
    { exactText: "The pressure check became the whole argument.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
    { exactText: "The active panel flashed.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-5"] },
  ],
}]);
assert.deepEqual(
  atomic.map((clause) => clause.priorAudit?.classification),
  ["KEEP_EXPRESSION", "KEEP_EXPRESSION"],
  "priorAudit metadata must remain available as context for exact surviving spans",
);

const finalGrounding = applyAuthorGroundingVerifications({
  scenes: [{
    text: "The pressure check became the whole argument. The active panel flashed.",
    kind: "line",
    sourceEventIds: ["event-2", "event-5"],
    auditSpans: [
      { exactText: "The pressure check became the whole argument.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
      { exactText: "The active panel flashed.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-5"] },
    ],
  }],
  suppliedReality,
  verifications: [
    {
      sceneIndex: 0,
      clauseIndex: 0,
      supported: true,
      supportKind: "FIGURATIVE",
      sourceEventIds: ["event-2"],
      concreteClaims: [],
      unsupportedClaims: [],
    },
    {
      sceneIndex: 0,
      clauseIndex: 1,
      supported: false,
      supportKind: "UNSUPPORTED",
      sourceEventIds: ["event-5"],
      concreteClaims: ["active panel flashed"],
      unsupportedClaims: ["flashed"],
    },
  ],
});
assert.equal(
  finalGrounding[0]?.text,
  "The pressure check became the whole argument.",
  "final verifier must independently reject unsupported concrete material even when priorAudit said KEEP_EXPRESSION",
);
assert.deepEqual(
  finalGrounding[0]?.auditSpans,
  [
    { exactText: "The pressure check became the whole argument.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
    { exactText: "The active panel flashed.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-5"] },
  ],
  "auditSpans transport remains intact as non-authoritative metadata",
);

console.log("AUTHOR UNIVERSAL SPECIFICITY GREEN - CLOSED SPECIFICITY - EXACT AUDIT SPANS - PRIOR AUDIT NON-AUTHORITY");
