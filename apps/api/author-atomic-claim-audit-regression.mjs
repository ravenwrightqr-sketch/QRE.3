import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  applyAuthorRealityEditorEdits,
} from "./dist/services/authorCreative.js";
import {
  applyAuthorGroundingVerifications,
} from "./dist/services/authorCreativeGroundingVerifier.js";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
const directAuthorStart = source.indexOf("export function buildDirectAuthorMemoryMessages");
const directAuthorEnd = source.indexOf("function buildDeterministicMouthFallback", directAuthorStart);
assert.ok(directAuthorStart >= 0 && directAuthorEnd > directAuthorStart, "direct Author prompt region not found");
const directAuthorSource = source.slice(directAuthorStart, directAuthorEnd);
assert.equal(
  createHash("sha256").update(directAuthorSource).digest("hex"),
  "0d81899c9379fc1268f956d9d60a5a128a40c6ec6b67295c6f1bd42253c1349a",
  "Direct Creative Author prompt region must match the perception/amplification doctrine revision",
);

const auditorStart = source.indexOf("async function editDirectAuthorReality");
const auditorEnd = source.indexOf("async function assignDirectAuthorProductionProvenance", auditorStart);
const auditorSource = source.slice(auditorStart, auditorEnd);
const auditorSchemaStart = auditorSource.indexOf("jsonSchema:");
const auditorSchema = auditorSource.slice(auditorSchemaStart);
assert.match(
  auditorSource,
  /Audit at the smallest semantically independent claim unit that can be exactly identified in the authored text\./,
  "Claim Auditor prompt must carry the exact atomicity rule",
);
assert.match(
  auditorSource,
  /First partition each authored production into atomicClaimSpans, then classify each atomicClaimSpan\./,
  "Claim Auditor protocol must require partition before classification",
);
assert.match(
  auditorSchema,
  /required:\s*\["production", "atomicClaimSpans"\]/,
  "Claim Auditor schema must require atomicClaimSpans rather than generic spans",
);
assert.match(
  auditorSchema,
  /required:\s*\["exactText", "classification", "sourceEventIds", "atomicity"\]/,
  "Claim Auditor schema must require a span-level atomicity marker",
);
assert.match(
  auditorSchema,
  /SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT/,
  "Claim Auditor schema must make atomicity an enum value, not prose only",
);
assert.doesNotMatch(
  auditorSchema,
  /required:\s*\["production", "spans"\]/,
  "Claim Auditor schema must not treat sentence-sized generic spans as the live contract",
);
assert.match(auditorSource, /Do not substitute words, reorder words, or generate replacement prose\./);
assert.doesNotMatch(auditorSource, /required:\s*\["production", "text"\]/, "auditor schema must not accept replacement prose");

const suppliedReality = [
  { id: "event-1", text: "The sample was blue" },
  { id: "event-2", text: "The device was installed" },
  { id: "event-3", text: "The review ended" },
  { id: "event-4", text: "The transfer completed by hand" },
  { id: "event-5", text: "The batch contained 2.4 gallons" },
];

function production(production, text, sourceEventIds = suppliedReality.map((event) => event.id)) {
  return {
    production,
    lines: [{ order: 1, text, sourceEventIds }],
  };
}

function apply(productions, audits) {
  return applyAuthorRealityEditorEdits({
    productions,
    auditorResponse: { audits },
  });
}

function tokens(text) {
  return new Set(String(text).toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

const mixedAudit = apply(
  [
    production("A", "The sample was blue; the point stood."),
    production("B", "The device was installed, and the hidden gauge blinked.", ["event-2"]),
    production("C", "The review mattered, and the operator expected applause.", ["event-3"]),
  ],
  [
    {
      production: "A",
      spans: [
        { exactText: "The sample was blue;", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] },
        { exactText: "the point stood.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-1"] },
      ],
    },
    {
      production: "B",
      spans: [
        { exactText: "The device was installed", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-2"] },
        { exactText: "the hidden gauge blinked.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
      ],
    },
    {
      production: "C",
      spans: [
        { exactText: "The review mattered", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-3"] },
        { exactText: "the operator expected applause.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
      ],
    },
  ],
);

assert.equal(mixedAudit.applied, true);
assert.deepEqual(
  mixedAudit.diagnostics.find((diagnostic) => diagnostic.production === "A")?.spans.map((span) => span.classification),
  ["SUPPORTED_REALITY", "KEEP_EXPRESSION"],
  "one authored sentence can contain SUPPORTED_REALITY plus KEEP_EXPRESSION",
);
assert.deepEqual(
  mixedAudit.diagnostics.find((diagnostic) => diagnostic.production === "B")?.spans.map((span) => span.classification),
  ["SUPPORTED_REALITY", "UNSUPPORTED_REALITY"],
  "one authored sentence can contain SUPPORTED_REALITY plus UNSUPPORTED_REALITY",
);
assert.deepEqual(
  mixedAudit.diagnostics.find((diagnostic) => diagnostic.production === "C")?.spans.map((span) => span.classification),
  ["KEEP_EXPRESSION", "UNSUPPORTED_REALITY"],
  "one authored sentence can contain KEEP_EXPRESSION plus UNSUPPORTED_REALITY",
);
assert.equal(mixedAudit.productions.find((item) => item.production === "A")?.lines[0]?.text, "The sample was blue; the point stood.");
assert.equal(mixedAudit.productions.find((item) => item.production === "B")?.lines.length, 0);
assert.equal(mixedAudit.productions.find((item) => item.production === "C")?.lines.length, 0);
assert.equal(mixedAudit.diagnostics.find((diagnostic) => diagnostic.production === "B")?.unusableReason, "reality_auditor_unaudited_substantive_material");
assert.equal(mixedAudit.diagnostics.find((diagnostic) => diagnostic.production === "C")?.unusableReason, "reality_auditor_unaudited_substantive_material");

const allThreeAudit = apply(
  [
    production("A", "The sample was blue; the point stood; the hidden gauge blinked."),
    production("B", "The transfer completed by hand, not by crane.", ["event-4"]),
    production("C", "The batch contained 2.4 gallons and was cold.", ["event-5"]),
  ],
  [
    {
      production: "A",
      spans: [
        { exactText: "The sample was blue;", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] },
        { exactText: "the point stood", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-1"] },
        { exactText: "the hidden gauge blinked.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
      ],
    },
    {
      production: "B",
      spans: [
        { exactText: "The transfer completed by hand", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-4"] },
        { exactText: "by crane", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
      ],
    },
    {
      production: "C",
      spans: [
        { exactText: "The batch contained 2.4 gallons", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-5"] },
        { exactText: "and was cold.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
      ],
    },
  ],
);

assert.deepEqual(
  allThreeAudit.diagnostics.find((diagnostic) => diagnostic.production === "A")?.spans.map((span) => span.classification),
  ["SUPPORTED_REALITY", "KEEP_EXPRESSION", "UNSUPPORTED_REALITY"],
  "all three classifications can occur within one authored sentence",
);
assert.equal(
  allThreeAudit.productions.find((item) => item.production === "A")?.lines.length,
  0,
  "unsupported specificity must not produce a semicolon-fractured survivor",
);
assert.equal(
  allThreeAudit.productions.find((item) => item.production === "B")?.lines.length,
  0,
  "unsupported physical method must fail closed when deletion would require punctuation repair",
);
assert.equal(
  allThreeAudit.productions.find((item) => item.production === "C")?.lines.length,
  0,
  "supplied specificity does not survive when neighboring unsupported deletion fractures the expression",
);
assert.deepEqual(
  allThreeAudit.diagnostics.map((diagnostic) => [diagnostic.production, diagnostic.survivorIntegrity, diagnostic.unusableReason]),
  [
    ["A", "FRACTURED", "reality_auditor_survivor_fractured"],
    ["B", "NOT_REQUIRED", "reality_auditor_unaudited_substantive_material"],
    ["C", "FRACTURED", "reality_auditor_survivor_fractured"],
  ],
  "coverage failures and fractured survivors must remain distinct diagnostics",
);

const overBroadMixed = apply(
  [
    production("A", "The sample was blue; the hidden gauge blinked.", ["event-1"]),
    production("B", "The review mattered, and the operator expected applause.", ["event-3"]),
    production("C", "The batch contained 2.4 gallons and was cold.", ["event-5"]),
  ],
  [
    {
      production: "A",
      atomicClaimSpans: [{
        exactText: "The sample was blue; the hidden gauge blinked.",
        classification: "SUPPORTED_REALITY",
        sourceEventIds: ["event-1"],
        atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
      }],
    },
    {
      production: "B",
      atomicClaimSpans: [{
        exactText: "The review mattered, and the operator expected applause.",
        classification: "KEEP_EXPRESSION",
        sourceEventIds: ["event-3"],
        atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
      }],
    },
    {
      production: "C",
      atomicClaimSpans: [{
        exactText: "The batch contained 2.4 gallons and was cold.",
        classification: "SUPPORTED_REALITY",
        sourceEventIds: ["event-5"],
        atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
      }],
    },
  ],
);

for (const productionLetter of ["A", "B", "C"]) {
  assert.equal(
    overBroadMixed.productions.find((item) => item.production === productionLetter)?.lines[0]?.text,
    productionLetter === "A"
      ? "The sample was blue; the hidden gauge blinked."
      : productionLetter === "B"
        ? "The review mattered, and the operator expected applause."
        : "The batch contained 2.4 gallons and was cold.",
    `no-unsupported ${productionLetter} audit preserves authored text for final verification rather than reclassifying it`,
  );
  assert.equal(
    overBroadMixed.diagnostics.find((diagnostic) => diagnostic.production === productionLetter)?.unsupportedDeletionRequired,
    false,
    `no-unsupported ${productionLetter} audit must not manufacture unsupported deletion`,
  );
}

const missingAtomicityMarker = apply(
  [
    production("A", "The sample was blue.", ["event-1"]),
    production("B", "The device was installed.", ["event-2"]),
    production("C", "The review ended.", ["event-3"]),
  ],
  [
    {
      production: "A",
      atomicClaimSpans: [{ exactText: "The sample was blue.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] }],
    },
    {
      production: "B",
      atomicClaimSpans: [{ exactText: "The device was installed.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-2"] }],
    },
    {
      production: "C",
      atomicClaimSpans: [{ exactText: "The review ended.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-3"] }],
    },
  ],
);
assert.equal(missingAtomicityMarker.applied, false);
assert.equal(
  missingAtomicityMarker.reason,
  "malformed_reality_auditor_response",
  "live atomicClaimSpans contract must require explicit atomicity markers",
);

const excessiveAtomicClaimSpans = apply(
  [
    production("A", "The sample was blue.", ["event-1"]),
    production("B", "The device was installed.", ["event-2"]),
    production("C", "The review ended.", ["event-3"]),
  ],
  [
    {
      production: "A",
      atomicClaimSpans: Array.from({ length: 65 }, (_, index) => ({
        exactText: `Synthetic span ${index + 1}.`,
        classification: "KEEP_EXPRESSION",
        sourceEventIds: [],
        atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
      })),
    },
    {
      production: "B",
      atomicClaimSpans: [{
        exactText: "The device was installed.",
        classification: "SUPPORTED_REALITY",
        sourceEventIds: ["event-2"],
        atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
      }],
    },
    {
      production: "C",
      atomicClaimSpans: [{
        exactText: "The review ended.",
        classification: "SUPPORTED_REALITY",
        sourceEventIds: ["event-3"],
        atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
      }],
    },
  ],
);
assert.equal(excessiveAtomicClaimSpans.applied, false);
assert.equal(
  excessiveAtomicClaimSpans.reason,
  "malformed_reality_auditor_response",
  "internal Claim Auditor validation must still enforce atomicClaimSpans.maxItems:64",
);

const originalTokens = tokens("The sample was blue; the point stood; the hidden gauge blinked.");
for (const token of tokens(mixedAudit.productions.find((item) => item.production === "A")?.lines[0]?.text ?? "")) {
  assert.ok(originalTokens.has(token), `reconstruction introduced lexical material: ${token}`);
}

const damaged = apply(
  [
    production("A", "The device was made of steel.", ["event-2"]),
    production("B", "The review ended.", ["event-3"]),
    production("C", "The sample was blue.", ["event-1"]),
  ],
  [
    {
      production: "A",
      spans: [
        { exactText: "The device was", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-2"] },
        { exactText: "made of steel.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
      ],
    },
    {
      production: "B",
      spans: [{ exactText: "The review ended.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-3"] }],
    },
    {
      production: "C",
      spans: [{ exactText: "The sample was blue.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] }],
    },
  ],
);
assert.equal(damaged.productions.find((item) => item.production === "A")?.lines.length, 0);
assert.equal(
  damaged.diagnostics.find((diagnostic) => diagnostic.production === "A")?.unusableReason,
  "reality_auditor_survivor_fractured",
  "reconstruction must not grammatically repair damaged prose",
);

const unaudited = apply(
  [
    production("A", "The review ended. The hidden gauge blinked.", ["event-3"]),
    production("B", "The device was installed.", ["event-2"]),
    production("C", "The sample was blue.", ["event-1"]),
  ],
  [
    {
      production: "A",
      spans: [{ exactText: "The review ended.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-3"] }],
    },
    {
      production: "B",
      spans: [{ exactText: "The device was installed.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-2"] }],
    },
    {
      production: "C",
      spans: [{ exactText: "The sample was blue.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] }],
    },
  ],
);
assert.equal(
  unaudited.productions.find((item) => item.production === "A")?.lines.length,
  0,
  "unaudited substantive material must fail closed rather than survive reconstruction",
);
assert.equal(
  unaudited.diagnostics.find((diagnostic) => diagnostic.production === "A")?.unusableReason,
  "reality_auditor_unaudited_substantive_material",
);

const ambiguous = apply(
  [
    production("A", "Echo. Echo.", ["event-3"]),
    production("B", "The device was installed.", ["event-2"]),
    production("C", "The sample was blue.", ["event-1"]),
  ],
  [
    {
      production: "A",
      spans: [{ exactText: "Echo.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-3"] }],
    },
    {
      production: "B",
      spans: [{ exactText: "The device was installed.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-2"] }],
    },
    {
      production: "C",
      spans: [{ exactText: "The sample was blue.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] }],
    },
  ],
);
assert.equal(ambiguous.productions.find((item) => item.production === "A")?.lines.length, 0);
assert.equal(
  ambiguous.diagnostics.find((diagnostic) => diagnostic.production === "A")?.unusableReason,
  "reality_auditor_span_ambiguous",
  "ambiguous exact-span mapping must fail closed",
);

const nonExact = apply(
  [
    production("A", "The review ended.", ["event-3"]),
    production("B", "The device was installed.", ["event-2"]),
    production("C", "The sample was blue.", ["event-1"]),
  ],
  [
    {
      production: "A",
      spans: [{ exactText: "The review end.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-3"] }],
    },
    {
      production: "B",
      spans: [{ exactText: "The device was installed.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-2"] }],
    },
    {
      production: "C",
      spans: [{ exactText: "The sample was blue.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] }],
    },
  ],
);
assert.equal(nonExact.productions.find((item) => item.production === "A")?.lines.length, 0);
assert.equal(nonExact.diagnostics.find((diagnostic) => diagnostic.production === "A")?.unusableReason, "reality_auditor_span_not_exact");

const finalVerifierStillRejects = applyAuthorGroundingVerifications({
  scenes: [{
    text: "The hidden gauge blinked.",
    kind: "line",
    sourceEventIds: ["event-2"],
    auditSpans: [{
      exactText: "The hidden gauge blinked.",
      classification: "KEEP_EXPRESSION",
      sourceEventIds: ["event-2"],
    }],
  }],
  suppliedReality,
  verifications: [{
    sceneIndex: 0,
    clauseIndex: 0,
    supported: false,
    supportKind: "UNSUPPORTED",
    sourceEventIds: ["event-2"],
    concreteClaims: ["hidden gauge blinked"],
    unsupportedClaims: ["hidden gauge blinked"],
  }],
});
assert.deepEqual(
  finalVerifierStillRejects,
  [],
  "KEEP_EXPRESSION remains non-authoritative at final verification",
);

console.log("AUTHOR ATOMIC CLAIM AUDIT GREEN - GRANULAR SPANS - EXACT RECONSTRUCTION - FAIL CLOSED");
