import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyAuthorRealityEditorEdits,
  buildAuthorRealityEditorPayload,
  evaluateAuthorMemoryProductions,
} from "./dist/services/authorCreative.js";
import {
  applyAuthorGroundingVerifications,
  buildAuthorGroundingAtomicClauses,
} from "./dist/services/authorCreativeGroundingVerifier.js";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");

assert.match(source, /AUTHOR_REALITY_EDITOR_EXPERIMENT_FLAG\s*=\s*\n\s*"QRE_AUTHOR_REALITY_EDITOR_EXPERIMENT"/);
assert.match(
  source,
  /function authorRealityEditorExperimentEnabled\(\): boolean \{\s*\n\s*return process\.env\[AUTHOR_REALITY_EDITOR_EXPERIMENT_FLAG\] === "true";\s*\n\}/,
  "claim auditor experiment must be off unless its flag is explicitly true",
);
assert.match(
  source,
  /const directCreativeAuthorExperiment =\s*\n\s*isMemoryMode && directCreativeAuthorExperimentEnabled\(\);/,
  "direct creative experiment must remain memory-only",
);
assert.match(
  source,
  /const directAuthorRealityEditorExperiment =\s*\n\s*directCreativeAuthorExperiment && authorRealityEditorExperimentEnabled\(\);/,
  "claim auditor must require direct creative experiment plus its own flag",
);

const directAuthorStart = source.indexOf("async function generateDirectAuthorMemoryProductions");
const directAuthorEnd = source.indexOf("function buildDeterministicMouthFallback", directAuthorStart);
assert.ok(directAuthorStart >= 0, "direct creative Author helper not found");
assert.ok(directAuthorEnd > directAuthorStart, "direct creative Author helper end not found");
const directAuthorSource = source.slice(directAuthorStart, directAuthorEnd);
assert.match(directAuthorSource, /You are the Author\./);
assert.match(directAuthorSource, /Make something of it\./, "direct creative Author prompt must remain unchanged");
assert.match(directAuthorSource, /Return exactly three attempts using the required schema\./);
assert.doesNotMatch(directAuthorSource, /Claim Auditor|Evidence licenses only what it establishes|SUPPORTED_REALITY|UNSUPPORTED_REALITY/);

const auditorStart = source.indexOf("async function editDirectAuthorReality");
const auditorEnd = source.indexOf("async function assignDirectAuthorProductionProvenance", auditorStart);
assert.ok(auditorStart >= 0, "claim auditor helper not found");
assert.ok(auditorEnd > auditorStart, "claim auditor helper end not found");
const auditorSource = source.slice(auditorStart, auditorEnd);
const auditorSchemaStart = auditorSource.indexOf("jsonSchema:");
assert.ok(auditorSchemaStart >= 0, "claim auditor schema not found");
const auditorPrompt = auditorSource.slice(0, auditorSchemaStart);
const auditorSchema = auditorSource.slice(auditorSchemaStart);

assert.match(auditorPrompt, /You are the Claim Auditor\./);
assert.match(auditorPrompt, /Judge independently removable exact text spans from the authored productions\./);
assert.match(auditorPrompt, /First partition each authored production into atomicClaimSpans, then classify each atomicClaimSpan\./);
assert.match(auditorPrompt, /Each atomicClaimSpan must be the smallest exact, non-overlapping, semantically independently classifiable authored substring needed to distinguish SUPPORTED_REALITY, KEEP_EXPRESSION, and UNSUPPORTED_REALITY\./);
assert.match(auditorPrompt, /A mixed authored sentence must not be represented by one audit span when different semantic claim units inside it can receive different classifications\./);
assert.match(auditorPrompt, /A sentence or clause containing separable substantive material that one classification cannot truthfully describe is not a valid atomicClaimSpan\./);
assert.match(auditorPrompt, /Classify each span as exactly SUPPORTED_REALITY, KEEP_EXPRESSION, or UNSUPPORTED_REALITY\./);
assert.match(auditorPrompt, /Evidence licenses only what it establishes\./);
assert.match(auditorPrompt, /Classification is about what must be true for the authored span to be valid\./);
assert.match(auditorPrompt, /Expressiveness does not excuse an unsupported proposition\./);
assert.match(auditorPrompt, /REALITY STAYS FIXED\. MEANING MAY MOVE\./);
assert.match(auditorPrompt, /REALITY IS CLOSED\. DISCOURSE IS OPEN\./);
assert.match(auditorPrompt, /Mention is not participation\./);
assert.match(auditorPrompt, /POV licenses voice, not events\./);
assert.match(auditorPrompt, /A derived characterization of supplied reality is not automatically another fact in supplied reality\./);
assert.match(auditorPrompt, /Ask whether understanding the authored characterization requires believing that an additional concrete occurrence happened\./);
assert.match(auditorPrompt, /If no additional concrete occurrence is required, the span may qualify as KEEP_EXPRESSION even when the exact characterization was not supplied\./);
assert.match(auditorPrompt, /KEEP_EXPRESSION may characterize, interpret, reframe, compress, compare, intensify, abstract, or change the perceived significance of supplied material without becoming an additional occurrence\./);
assert.match(auditorPrompt, /Derived perception of intensity, density, significance, contrast, pattern, atmosphere, emphasis, relationship, progression, transformation, salience, or experiential character is allowed only when it does not require another concrete occurrence\./);
assert.match(auditorPrompt, /Do not treat experiential character or perceived density as an asserted mental state unless the span requires a specific experiencer's private state\./);
assert.match(auditorPrompt, /UNSUPPORTED_REALITY remains required for any additional participant, event, action, interaction, participant behavior, physical relation, location, object, chronology, causal occurrence, observed occurrence, mental state, or outcome\./);
assert.match(auditorPrompt, /Universal authority test: strip away rhetoric, metaphor, POV, personification, generalized reference, abstraction, comparison, implication, interpretation, attitude, and discovered significance; then ask what additional thing the viewer must believe actually happened\./);
assert.match(auditorPrompt, /First ask whether the span asserts or requires any additional concrete occurrence beyond supplied evidence\./);
assert.match(auditorPrompt, /If it requires additional reality that supplied evidence directly establishes, classify SUPPORTED_REALITY\./);
assert.match(auditorPrompt, /If it introduces no new concrete occurrence and can function as derived meaning, rhetoric, evaluation, metaphor, humor, attitude, or framing of supplied reality, classify KEEP_EXPRESSION\./);
assert.match(auditorPrompt, /If it requires additional concrete occurrence that supplied evidence does not directly establish, classify UNSUPPORTED_REALITY\./);
assert.match(auditorPrompt, /Otherwise classify UNSUPPORTED_REALITY\./);
assert.match(auditorPrompt, /Do not infer facts from common sense, world knowledge, domain familiarity, likelihood, typical consequences, implication, association, narrative convention, or what usually happens\./);
assert.match(auditorPrompt, /A supplied object, entity, event, action, state, or relationship licenses that supplied reality only\./);
assert.match(auditorPrompt, /It does not license unsupplied measurements, quantities, colors, temperatures, materials, sensory properties, physical attributes, physical manifestations, methods, components, environmental details, causes, outcomes, mental states, preferences, motives, or other concrete specifics\./);
assert.match(auditorPrompt, /An action does not establish its method, manner, tool, component, motive, preference, success, failure, resistance, ownership, or outcome unless supplied\./);
assert.match(auditorPrompt, /A state or emotion does not establish bodily behavior, visible manifestation, private thought, preference, cause, or later continuity unless supplied\./);
assert.match(auditorPrompt, /Chronology does not establish causality, resolution, transition mechanism, urgency, or duration beyond what is supplied\./);
assert.match(auditorPrompt, /A supplied specificity becomes usable reality: if the authored span uses the supplied exact specificity, classify that portion as SUPPORTED_REALITY when it is otherwise faithful\./);
assert.match(auditorPrompt, /Do not infer neighboring properties from a supplied property\./);
assert.match(auditorPrompt, /Missing specificity must redirect creative pressure onto supplied reality itself, not complete the missing attribute\./);
assert.match(auditorPrompt, /KEEP_EXPRESSION may amplify supplied reality through derived significance, relational meaning, attitude, absurdity, tension, contrast, metaphor, rhetorical role, emphasis, or evaluative framing only when the span introduces no new concrete occurrence\./);
assert.match(auditorPrompt, /Derived meaning may say a supplied event mattered, changed how another supplied event reads, became setup, became payoff, felt less accidental, or gained significance, provided it does not add an unsupplied event, action, participant, object, place, physical state, mental state, cause, chronology, outcome, property, measurement, sensory detail, or state change\./);
assert.match(auditorPrompt, /A rhetorical characterization of an established event may survive when it does not require another event, property, cause, state, motive, or outcome to be true\./);
assert.match(auditorPrompt, /Do not automatically treat a word as safe or unsafe based on vocabulary alone\./);
assert.match(auditorPrompt, /Judge what proposition the span requires in context\./);
assert.match(auditorPrompt, /If a phrase requires a literal unsupplied event, action, participant, object, place, property, measurement, quantity, sensory detail, manifestation, method, cause, outcome, physical state, mental state, or state change, classify that phrase UNSUPPORTED_REALITY\./);
assert.match(auditorPrompt, /If it is derived meaning or rhetorical framing of supplied reality and introduces no new concrete occurrence, classify KEEP_EXPRESSION\./);
assert.match(auditorPrompt, /Do not invent or assume participation, role participation, objects, places, actions, interactions, environments, observations, reactions, sensations, preferences, thoughts, causes, outcomes, or concrete history\./);
assert.match(auditorPrompt, /Do not rewrite, improve, summarize, paraphrase, replace, repair, or create prose\./);
assert.match(auditorPrompt, /Return only judgments tied to exact authored text\./);
assert.doesNotMatch(auditorPrompt, /Coco|dog|Thursday|example|style|lens|genre/i);

assert.match(auditorSource, /content: JSON\.stringify\(buildAuthorRealityEditorPayload\(input\)\)/);
assert.match(auditorSchema, /required:\s*\["audits"\]/);
assert.match(auditorSchema, /minItems:\s*3,\s*\n\s*maxItems:\s*3,/);
assert.match(auditorSchema, /required:\s*\["production", "atomicClaimSpans"\]/);
assert.match(auditorSchema, /production:\s*\{\s*type:\s*"string",\s*enum:\s*\["A", "B", "C"\]\s*\}/);
assert.match(auditorSchema, /atomicClaimSpans:\s*\{/);
assert.match(auditorSchema, /required:\s*\["exactText", "classification", "sourceEventIds", "atomicity"\]/);
assert.match(auditorSchema, /exactText:\s*\{\s*type:\s*"string"\s*\}/);
assert.match(auditorSchema, /enum:\s*\[\s*\n\s*"SUPPORTED_REALITY",\s*\n\s*"KEEP_EXPRESSION",\s*\n\s*"UNSUPPORTED_REALITY",/);
assert.match(auditorSchema, /atomicity:\s*\{[\s\S]*enum:\s*\["SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT"\]/);
assert.match(auditorSchema, /sourceEventIds:\s*\{/);
assert.doesNotMatch(auditorSchema, /required:\s*\["production", "spans"\]/, "auditor schema must require atomicClaimSpans, not generic spans");
assert.doesNotMatch(auditorSchema, /required:\s*\["production", "text"\]/, "auditor cannot return replacement prose");
assert.doesNotMatch(auditorSchema, /\b(?:winner|score|scores|reason|reasons|selection|D)\b/, "auditor response schema must not expose selection data");

const provenanceStart = source.indexOf("async function assignDirectAuthorProductionProvenance");
const provenanceEnd = source.indexOf("async function generateDirectAuthorMemoryProductions", provenanceStart);
assert.ok(provenanceStart >= 0, "direct provenance assignment helper not found");
assert.ok(provenanceEnd > provenanceStart, "direct provenance assignment helper end not found");
const provenanceSource = source.slice(provenanceStart, provenanceEnd);
assert.match(provenanceSource, /You are QRE Direct Author Provenance\./);
assert.match(provenanceSource, /Return evidence IDs only\./);
assert.doesNotMatch(provenanceSource, /Claim Auditor|SUPPORTED_REALITY|UNSUPPORTED_REALITY/);

const runtimeStart = source.indexOf("let parsedMouth = parseJson(mouthResult.text);");
const provenanceCall = source.indexOf("assignDirectAuthorProductionProvenance", runtimeStart);
const auditorCall = source.indexOf("editDirectAuthorReality", provenanceCall);
const parserStart = source.indexOf("const rawProductions = Array.isArray(parsedMouth?.productions)", auditorCall);
const selectionCall = source.indexOf("selectMemoryProductionCandidate", parserStart);
assert.ok(runtimeStart >= 0, "runtime mouth parse not found");
assert.ok(provenanceCall > runtimeStart, "provenance must run after creative text exists");
assert.ok(auditorCall > provenanceCall, "claim auditor must run after provenance");
assert.ok(parserStart > auditorCall, "audited productions must feed existing production parser");
assert.ok(selectionCall > parserStart, "selection must remain downstream of audit and production parsing");
assert.match(
  source.slice(provenanceCall, parserStart),
  /debug\("REALITY-EDITOR", \{[\s\S]*originalAuthorProductions: provenanceResult\.productions,[\s\S]*auditorSpans:[\s\S]*removedSpans:[\s\S]*reconstructedProductions:[\s\S]*after: productionsAfterRealityEditor,/,
  "debug trace must show original text, auditor spans, removals, reconstruction, and final productions",
);
assert.match(
  source.slice(provenanceCall, parserStart),
  /emptyAuditedProductions\(\{[\s\S]*direct_author_reality_auditor_failed/,
  "auditor error must fail closed instead of silently rewriting",
);

const suppliedReality = [
  { id: "event-1", text: "The request was received" },
  { id: "event-2", text: "A tiny mismatch appeared in the last field" },
  { id: "event-3", text: "The review ended" },
];
const originalProductions = [
  {
    production: "A",
    lines: [{ order: 1, text: "The smallest detail mattered most. Unsupported splash.", sourceEventIds: ["event-2"] }],
  },
  {
    production: "B",
    lines: [{ order: 1, text: "The last field changed the record.", sourceEventIds: ["event-2"] }],
  },
  {
    production: "C",
    lines: [{ order: 1, text: "The tiny mismatch became the point.", sourceEventIds: ["event-2"] }],
  },
  {
    production: "D",
    lines: [{ order: 1, text: "The request was received.", sourceEventIds: ["event-1"] }],
  },
];

const payload = buildAuthorRealityEditorPayload({
  suppliedReality,
  productions: originalProductions,
});
assert.deepEqual(payload.SUPPLIED_REALITY, suppliedReality);
assert.deepEqual(
  payload.AUTHORED_PRODUCTIONS.map((production) => production.production),
  ["A", "B", "C"],
  "auditor input must contain authored A/B/C only",
);
assert.equal(payload.AUTHORED_PRODUCTIONS[0]?.text, originalProductions[0].lines[0].text);
assert.deepEqual(payload.AUTHORED_PRODUCTIONS[0]?.sourceEventIds, ["event-2"]);
const payloadText = JSON.stringify(payload);
for (const hiddenField of [
  "winner",
  "selectedProduction",
  "score",
  "scores",
  "lens",
  "treatment",
  "semanticMechanic",
  "Story Gravity",
  "D",
]) {
  assert.doesNotMatch(payloadText, new RegExp(`\\b${hiddenField}\\b`, "i"), `auditor input must not expose ${hiddenField}`);
}

const semanticBoundaryProductions = [
  {
    production: "A",
    lines: [{ order: 1, text: "Coco got a bath. An indignity. The water felt strange. It clung.", sourceEventIds: ["event-2"] }],
  },
  {
    production: "B",
    lines: [{ order: 1, text: "Coco wriggled. Coco hated the water. The world smelled clean.", sourceEventIds: ["event-2"] }],
  },
  {
    production: "C",
    lines: [{ order: 1, text: "A happy dance followed. A satisfied tail wag.", sourceEventIds: ["event-3"] }],
  },
];

const semanticBoundaryAudit = applyAuthorRealityEditorEdits({
  productions: semanticBoundaryProductions,
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "Coco got a bath.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-2"] },
          { exactText: "An indignity.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
          { exactText: "The water felt strange.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
          { exactText: "It clung.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "B",
        spans: [
          { exactText: "Coco wriggled.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
          { exactText: "Coco hated the water.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
          { exactText: "The world smelled clean.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "C",
        spans: [
          { exactText: "A happy dance followed.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
          { exactText: "A satisfied tail wag.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
    ],
  },
});
assert.equal(semanticBoundaryAudit.applied, true);
assert.equal(semanticBoundaryAudit.diagnostics[0]?.semanticClassificationValid, true);
assert.equal(semanticBoundaryAudit.diagnostics[0]?.auditProtocolValid, true);
assert.equal(semanticBoundaryAudit.diagnostics[0]?.exactSpanMappingValid, true);
assert.equal(semanticBoundaryAudit.diagnostics[0]?.unsupportedDeletionRequired, true);
assert.equal(semanticBoundaryAudit.diagnostics[0]?.survivorIntegrity, "INTACT");
assert.deepEqual(
  semanticBoundaryAudit.diagnostics[0]?.spans.map((span) => [span.exactText, span.classification]),
  [
    ["Coco got a bath.", "SUPPORTED_REALITY"],
    ["An indignity.", "KEEP_EXPRESSION"],
    ["The water felt strange.", "UNSUPPORTED_REALITY"],
    ["It clung.", "UNSUPPORTED_REALITY"],
  ],
);
assert.deepEqual(
  semanticBoundaryAudit.diagnostics[1]?.spans.map((span) => [span.exactText, span.classification]),
  [
    ["Coco wriggled.", "UNSUPPORTED_REALITY"],
    ["Coco hated the water.", "UNSUPPORTED_REALITY"],
    ["The world smelled clean.", "UNSUPPORTED_REALITY"],
  ],
);
assert.deepEqual(
  semanticBoundaryAudit.diagnostics[2]?.spans.map((span) => [span.exactText, span.classification]),
  [
    ["A happy dance followed.", "UNSUPPORTED_REALITY"],
    ["A satisfied tail wag.", "UNSUPPORTED_REALITY"],
  ],
);
assert.equal(
  semanticBoundaryAudit.productions[0]?.lines[0]?.text,
  "Coco got a bath. An indignity.  ",
  "SUPPORTED_REALITY and KEEP_EXPRESSION should survive exact deterministic deletion without repair",
);
assert.equal(semanticBoundaryAudit.productions[1]?.lines.length, 0, "unsupported physical, mental, and sensory claims should be deleted");
assert.equal(semanticBoundaryAudit.productions[2]?.lines.length, 0, "unsupported happy-body/outcome claims should be deleted");

const allAllowablePreserved = applyAuthorRealityEditorEdits({
  productions: [
    {
      production: "A",
      lines: [{ order: 1, text: "First signal,  still exact.\nSecond signal stays.", sourceEventIds: ["event-1"] }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "Adjacent one.Adjacent two!", sourceEventIds: ["event-2"] }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "One allowable span. Another allowable span.", sourceEventIds: ["event-3"] }],
    },
  ],
  auditorResponse: {
    audits: [
      {
        production: "A",
        atomicClaimSpans: [
          {
            exactText: "First signal,  still exact.",
            classification: "KEEP_EXPRESSION",
            sourceEventIds: [],
            atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
          },
          {
            exactText: "Second signal stays.",
            classification: "SUPPORTED_REALITY",
            sourceEventIds: ["event-1"],
            atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
          },
        ],
      },
      {
        production: "B",
        atomicClaimSpans: [
          {
            exactText: "Adjacent one.",
            classification: "KEEP_EXPRESSION",
            sourceEventIds: [],
            atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
          },
          {
            exactText: "Adjacent two!",
            classification: "SUPPORTED_REALITY",
            sourceEventIds: ["event-2"],
            atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
          },
        ],
      },
      {
        production: "C",
        atomicClaimSpans: [
          {
            exactText: "One allowable span. Another allowable span.",
            classification: "KEEP_EXPRESSION",
            sourceEventIds: [],
            atomicity: "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
          },
        ],
      },
    ],
  },
});
assert.equal(allAllowablePreserved.applied, true);
assert.equal(
  allAllowablePreserved.productions[0]?.lines[0]?.text,
  "First signal,  still exact.\nSecond signal stays.",
  "all-allowable audited text must preserve original punctuation and whitespace exactly",
);
assert.equal(
  allAllowablePreserved.productions[1]?.lines[0]?.text,
  "Adjacent one.Adjacent two!",
  "adjacent allowable atomic spans must not reconstruct or normalize authored text",
);
assert.equal(
  allAllowablePreserved.productions[2]?.lines[0]?.text,
  "One allowable span. Another allowable span.",
  "an all-allowable multi-piece span must not be reclassified as unsupported by deterministic application",
);
assert.deepEqual(
  allAllowablePreserved.diagnostics.map((diagnostic) => ({
    semanticClassificationValidity: diagnostic.semanticClassificationValid,
    auditProtocolValidity: diagnostic.auditProtocolValid,
    exactSpanMappingValidity: diagnostic.exactSpanMappingValid,
    unsupportedDeletionRequired: diagnostic.unsupportedDeletionRequired,
    survivorIntegrityResult: diagnostic.survivorIntegrity,
    finalReconstructedOrPreservedText: diagnostic.reconstructedText,
    rejectionReason: diagnostic.rejectionReason,
  })),
  [
    {
      semanticClassificationValidity: true,
      auditProtocolValidity: true,
      exactSpanMappingValidity: true,
      unsupportedDeletionRequired: false,
      survivorIntegrityResult: "NOT_REQUIRED",
      finalReconstructedOrPreservedText: "First signal,  still exact.\nSecond signal stays.",
      rejectionReason: undefined,
    },
    {
      semanticClassificationValidity: true,
      auditProtocolValidity: true,
      exactSpanMappingValidity: true,
      unsupportedDeletionRequired: false,
      survivorIntegrityResult: "NOT_REQUIRED",
      finalReconstructedOrPreservedText: "Adjacent one.Adjacent two!",
      rejectionReason: undefined,
    },
    {
      semanticClassificationValidity: true,
      auditProtocolValidity: true,
      exactSpanMappingValidity: true,
      unsupportedDeletionRequired: false,
      survivorIntegrityResult: "NOT_REQUIRED",
      finalReconstructedOrPreservedText: "One allowable span. Another allowable span.",
      rejectionReason: undefined,
    },
  ],
  "fixture reporting must keep semantic, protocol, mapping, deletion, survivor, output, and rejection fields separate",
);

const malformedAtomicity = applyAuthorRealityEditorEdits({
  productions: originalProductions.slice(0, 3),
  auditorResponse: {
    audits: [
      {
        production: "A",
        atomicClaimSpans: [
          {
            exactText: "The smallest detail mattered most.",
            classification: "KEEP_EXPRESSION",
            sourceEventIds: [],
            atomicity: "TOO_BIG",
          },
        ],
      },
      { production: "B", atomicClaimSpans: [] },
      { production: "C", atomicClaimSpans: [] },
    ],
  },
});
assert.equal(malformedAtomicity.applied, false);
assert.equal(malformedAtomicity.reason, "malformed_reality_auditor_response");
assert.equal(malformedAtomicity.diagnostics[0]?.semanticClassificationValid, false);
assert.equal(malformedAtomicity.diagnostics[0]?.auditProtocolValid, false);
assert.equal(malformedAtomicity.diagnostics[0]?.rejectionReason, "malformed_reality_auditor_response");

const audited = applyAuthorRealityEditorEdits({
  productions: originalProductions.slice(0, 3),
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "The smallest detail mattered most.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
          { exactText: "Unsupported splash.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "B",
        spans: [
          { exactText: "The last field changed the record.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-2"] },
        ],
      },
      {
        production: "C",
        spans: [
          { exactText: "The tiny mismatch became the point.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
        ],
      },
    ],
  },
});
assert.equal(audited.applied, true);
assert.equal(audited.productions[0]?.lines[0]?.text, "The smallest detail mattered most. ");
assert.equal(audited.productions[1]?.lines[0]?.text, "The last field changed the record.");
assert.equal(audited.productions[2]?.lines[0]?.text, "The tiny mismatch became the point.");
assert.deepEqual(audited.diagnostics[0]?.removedSpans, ["Unsupported splash."]);
assert.equal(audited.diagnostics[0]?.unsupportedDeletionRequired, true);
assert.equal(audited.diagnostics[0]?.survivorIntegrity, "INTACT");
assert.deepEqual(
  audited.productions[0]?.lines[0]?.sourceEventIds,
  ["event-2"],
  "auditor must not expand sourceEventIds",
);

function lexicalTokens(text) {
  return new Set(String(text).toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

const originalTokens = lexicalTokens(originalProductions[0].lines[0].text);
for (const token of lexicalTokens(audited.productions[0]?.lines[0]?.text ?? "")) {
  assert.ok(originalTokens.has(token), `deterministic reconstruction introduced lexical material: ${token}`);
}

const nonExact = applyAuthorRealityEditorEdits({
  productions: originalProductions.slice(0, 3),
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "The smallest detail mattered.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
        ],
      },
      { production: "B", spans: [] },
      { production: "C", spans: [] },
    ],
  },
});
assert.equal(nonExact.applied, true);
assert.equal(nonExact.productions[0]?.lines.length, 0, "non-exact auditor span must make the production unusable");
assert.equal(nonExact.diagnostics[0]?.unusableReason, "reality_auditor_span_not_exact");
assert.equal(nonExact.diagnostics[0]?.semanticClassificationValid, true);
assert.equal(nonExact.diagnostics[0]?.exactSpanMappingValid, false);

const unauditedSubstantiveText = applyAuthorRealityEditorEdits({
  productions: [
    {
      production: "A",
      lines: [{ order: 1, text: "The request arrived. The hidden gauge read 42.", sourceEventIds: ["event-1"] }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "The review ended.", sourceEventIds: ["event-3"] }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "The field mattered.", sourceEventIds: ["event-2"] }],
    },
  ],
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "The request arrived.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-1"] },
        ],
      },
      {
        production: "B",
        spans: [
          { exactText: "The review ended.", classification: "SUPPORTED_REALITY", sourceEventIds: ["event-3"] },
        ],
      },
      {
        production: "C",
        spans: [
          { exactText: "The field mattered.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
        ],
      },
    ],
  },
});
assert.equal(
  unauditedSubstantiveText.productions[0]?.lines.length,
  0,
  "substantive authored text omitted by the auditor must fail closed rather than survive reconstruction",
);
assert.equal(unauditedSubstantiveText.diagnostics[0]?.unusableReason, "reality_auditor_unaudited_substantive_material");
assert.equal(unauditedSubstantiveText.diagnostics[0]?.auditProtocolValid, true);
assert.equal(unauditedSubstantiveText.diagnostics[0]?.exactSpanMappingValid, true);

const malformed = applyAuthorRealityEditorEdits({
  productions: originalProductions.slice(0, 3),
  auditorResponse: {
    audits: [
      { production: "A", spans: [] },
      { production: "B", spans: [] },
    ],
  },
});
assert.equal(malformed.applied, false);
assert.equal(malformed.reason, "malformed_reality_auditor_response");
assert.deepEqual(
  malformed.productions.map((production) => production.lines.length),
  [0, 0, 0],
  "malformed auditor response must fail closed, not silently rewrite or preserve A/B/C",
);

const plan = {
  thesis: "Use supplied reality directly.",
  beats: suppliedReality.map((event, index) => ({
    order: index + 1,
    role: index === 0 ? "HOOK" : index === suppliedReality.length - 1 ? "PAYOFF" : "BUILD",
    eventIds: [event.id],
    attention: event.text,
    change: "Advance supplied reality directly.",
  })),
};

function directTreatment(production, id, reality = suppliedReality) {
  return {
    production,
    id,
    sourceCandidateId: `direct-author[${production}]`,
    sourceRelation: "line-owned sourceEventIds supply direct creative provenance",
    evidenceEventIds: reality.map((event) => event.id),
    creativePressure: "direct expression from supplied reality",
    hiddenInference: "",
    treatment: production === "D"
      ? "NONE / Bare Reality. Present only the supplied facts in their natural sequence with minimal treatment."
      : "direct expressive production",
    perceptionDelta: production === "D"
      ? "No added perception; direct supplied reality remains visible as the control."
      : "perception authored directly in the production",
    expressiveBehaviors: [production === "D" ? "bare reality" : "direct author production"],
    intensity: production === "D" ? "LIGHT" : "MEDIUM",
  };
}

const evaluation = evaluateAuthorMemoryProductions({
  plan,
  suppliedReality,
  subject: "review",
  expressiveProductions: audited.productions,
  treatmentAssignments: [
    directTreatment("A", "treatment-1"),
    directTreatment("B", "treatment-2"),
    directTreatment("C", "treatment-3"),
    directTreatment("D", "treatment-4"),
  ],
  lensSearchEnabled: true,
  realityDirect: true,
});

const productionA = evaluation.productions.find((production) => production.production === "A");
const productionB = evaluation.productions.find((production) => production.production === "B");
const productionD = evaluation.productions.find((production) => production.production === "D");
assert.ok(productionA, "audited A must reach existing downstream evaluation");
assert.equal(productionA.lines[0]?.text, "The smallest detail mattered most.");
assert.ok(productionB, "audited B must reach existing downstream evaluation");
assert.equal(productionB.lines[0]?.text, "The last field changed the record.");
assert.ok(productionD, "D must remain present downstream");
assert.equal(productionD.lines.length, plan.beats.length, "D must remain complete supplied reality");
assert.ok(evaluation.selectedProduction, "winner selection must remain late after full production evaluation");
assert.ok(evaluation.scenes.length >= 1, "existing downstream grounding/scoring must still produce scenes");

const cocoReality = [
  { id: "event-1", text: "Coco was nervous" },
  { id: "event-2", text: "Coco got a bath" },
  { id: "event-3", text: "A bow was added" },
  { id: "event-4", text: "Coco tried to remove the bow" },
  { id: "event-5", text: "Coco left happy" },
];
const cocoPlan = {
  thesis: "Use supplied reality directly.",
  beats: cocoReality.map((event, index) => ({
    order: index + 1,
    role: index === 0 ? "HOOK" : index === cocoReality.length - 1 ? "PAYOFF" : "BUILD",
    eventIds: [event.id],
    attention: event.text,
    change: "Advance supplied reality directly.",
  })),
};
const allCocoEventIds = cocoReality.map((event) => event.id);
const cocoAudit = applyAuthorRealityEditorEdits({
  productions: [
    {
      production: "A",
      lines: [{ order: 1, text: "Unused A.", sourceEventIds: allCocoEventIds }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "Unused B.", sourceEventIds: allCocoEventIds }],
    },
    {
      production: "C",
      lines: [{
        order: 1,
        text: "She braced herself. A necessary ordeal. Then, a flourish. A brief rebellion. Finally, contentment.",
        sourceEventIds: allCocoEventIds,
      }],
    },
  ],
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "Unused A.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "B",
        spans: [
          { exactText: "Unused B.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "C",
        spans: [
          { exactText: "She braced herself.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
          { exactText: "A necessary ordeal.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
          { exactText: "Then, a flourish.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
          { exactText: "A brief rebellion.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-4"] },
          { exactText: "Finally, contentment.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
    ],
  },
});
const cocoDiagnosticC = cocoAudit.diagnostics.find((diagnostic) => diagnostic.production === "C");
assert.equal(
  cocoAudit.productions.find((production) => production.production === "C")?.lines[0]?.text,
  " A necessary ordeal.  A brief rebellion. ",
  "post-auditor reconstruction must delete unsupported ranges without repairing whitespace",
);
assert.deepEqual(
  cocoDiagnosticC?.spans
    .filter((span) => span.classification === "KEEP_EXPRESSION")
    .map((span) => [span.exactText, span.sourceEventIds]),
  [
    ["A necessary ordeal.", ["event-2"]],
    ["A brief rebellion.", ["event-4"]],
  ],
  "auditor KEEP_EXPRESSION source associations must remain inspectable at the post-auditor boundary",
);
assert.deepEqual(
  cocoDiagnosticC?.removedSpans,
  ["She braced herself.", "Then, a flourish.", "Finally, contentment."],
  "unsupported spans must already be removed before downstream grounding",
);

const cocoEvaluation = evaluateAuthorMemoryProductions({
  plan: cocoPlan,
  suppliedReality: cocoReality,
  subject: "Coco",
  expressiveProductions: cocoAudit.productions,
  treatmentAssignments: [
    directTreatment("A", "coco-treatment-1", cocoReality),
    directTreatment("B", "coco-treatment-2", cocoReality),
    directTreatment("C", "coco-treatment-3", cocoReality),
    directTreatment("D", "coco-treatment-4", cocoReality),
  ],
  lensSearchEnabled: true,
  realityDirect: true,
});
const cocoProductionC = cocoEvaluation.productions.find((production) => production.production === "C");
assert.ok(cocoProductionC, "reconstructed C must reach existing downstream evaluation");
assert.equal(cocoProductionC.lines[0]?.text, "A necessary ordeal. A brief rebellion.");
assert.equal(typeof cocoProductionC.lines[0]?.accepted, "boolean");
assert.equal(typeof cocoProductionC.lines[0]?.score, "number");
assert.ok(Array.isArray(cocoProductionC.lines[0]?.reasons));
assert.ok(
  !cocoProductionC.lines[0]?.reasons.includes("unsupported-temporal-comparison"),
  "A brief rebellion must not be rejected as a temporal comparison solely because of brief",
);
assert.deepEqual(cocoProductionC.lines[0]?.sourceEventIds, allCocoEventIds);
assert.equal(
  cocoProductionC.lines[0]?.classification,
  undefined,
  "auditor classifications are not carried into downstream production evaluation lines",
);

const pureJoyAudit = applyAuthorRealityEditorEdits({
  productions: [
    {
      production: "A",
      lines: [{ order: 1, text: "Unused A.", sourceEventIds: allCocoEventIds }],
    },
    {
      production: "B",
      lines: [{
        order: 1,
        text: "A bath. Unsupported tail wag. Pure joy.",
        sourceEventIds: allCocoEventIds,
      }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "Unused C.", sourceEventIds: allCocoEventIds }],
    },
  ],
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "Unused A.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "B",
        spans: [
          { exactText: "A bath.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
          { exactText: "Unsupported tail wag.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
          { exactText: "Pure joy.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
        ],
      },
      {
        production: "C",
        spans: [
          { exactText: "Unused C.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
    ],
  },
});
const pureJoyProductionB = pureJoyAudit.productions.find((production) => production.production === "B");
assert.equal(
  pureJoyProductionB?.lines[0]?.text,
  "A bath.  Pure joy.",
  "reconstructed presentation should remain one line while unsupported spans are deleted without whitespace repair",
);
assert.deepEqual(
  pureJoyProductionB?.lines[0]?.auditSpans,
  [
    { exactText: "A bath.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
    { exactText: "Pure joy.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
  ],
  "mixed surviving spans must retain separate audit metadata",
);

const pureJoyEvaluation = evaluateAuthorMemoryProductions({
  plan: cocoPlan,
  suppliedReality: cocoReality,
  subject: "Coco",
  expressiveProductions: pureJoyAudit.productions,
  treatmentAssignments: [
    directTreatment("A", "pure-joy-treatment-1", cocoReality),
    directTreatment("B", "pure-joy-treatment-2", cocoReality),
    directTreatment("C", "pure-joy-treatment-3", cocoReality),
    directTreatment("D", "pure-joy-treatment-4", cocoReality),
  ],
  selectedProduction: "B",
  lensSearchEnabled: true,
  realityDirect: true,
});
assert.equal(pureJoyEvaluation.selectedProduction, "B", "accepted audited B should remain selectable before final grounding");
assert.equal(pureJoyEvaluation.scenes.length, 1, "audit metadata must not split presentation into extra scenes");
assert.equal(pureJoyEvaluation.scenes[0]?.text, "A bath. Pure joy.");
assert.deepEqual(
  pureJoyEvaluation.scenes[0]?.auditSpans,
  pureJoyProductionB?.lines[0]?.auditSpans,
  "selected scene must retain exact surviving audit spans",
);

const pureJoyAtomicClauses = buildAuthorGroundingAtomicClauses(pureJoyEvaluation.scenes);
assert.deepEqual(
  pureJoyAtomicClauses.map((clause) => ({
    text: clause.text,
    priorAudit: clause.priorAudit,
  })),
  [
    {
      text: "A bath",
      priorAudit: { exactText: "A bath.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
    },
    {
      text: "Pure joy",
      priorAudit: { exactText: "Pure joy.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
    },
  ],
  "final grounding atomic clauses should receive exact span metadata when safely mapped",
);
assert.ok(
  pureJoyAtomicClauses.every((clause) => clause.text !== "Unsupported tail wag"),
  "deleted unsupported auditor spans must not reach final verifier clauses",
);

const fracturedStructuralA = applyAuthorRealityEditorEdits({
  productions: [
    {
      production: "A",
      lines: [{ order: 1, text: "The initial tremor washed away. Hidden bridge of a dog made new.", sourceEventIds: ["event-1"] }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "Clean B.", sourceEventIds: ["event-2"] }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "Clean C.", sourceEventIds: ["event-3"] }],
    },
  ],
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "The initial tremor washed away.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
          { exactText: "Hidden bridge", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
          { exactText: "of a dog made new.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
        ],
      },
      {
        production: "B",
        spans: [{ exactText: "Clean B.", classification: "KEEP_EXPRESSION", sourceEventIds: [] }],
      },
      {
        production: "C",
        spans: [{ exactText: "Clean C.", classification: "KEEP_EXPRESSION", sourceEventIds: [] }],
      },
    ],
  },
});
assert.equal(fracturedStructuralA.productions[0]?.lines.length, 0);
assert.equal(fracturedStructuralA.diagnostics[0]?.survivorIntegrity, "FRACTURED");
assert.equal(fracturedStructuralA.diagnostics[0]?.unusableReason, "reality_auditor_survivor_fractured");
assert.equal(
  fracturedStructuralA.diagnostics[0]?.reconstructedText,
  "",
  "malformed survivor equivalent to observed A must not continue downstream",
);

const fracturedStructuralC = applyAuthorRealityEditorEdits({
  productions: [
    {
      production: "A",
      lines: [{ order: 1, text: "The final caption was unsupported.", sourceEventIds: ["event-1"] }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "Clean B.", sourceEventIds: ["event-2"] }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "Clean C.", sourceEventIds: ["event-3"] }],
    },
  ],
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "The final caption was", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
          { exactText: "unsupported", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "B",
        spans: [{ exactText: "Clean B.", classification: "KEEP_EXPRESSION", sourceEventIds: [] }],
      },
      {
        production: "C",
        spans: [{ exactText: "Clean C.", classification: "KEEP_EXPRESSION", sourceEventIds: [] }],
      },
    ],
  },
});
assert.equal(fracturedStructuralC.productions[0]?.lines.length, 0);
assert.equal(fracturedStructuralC.diagnostics[0]?.survivorIntegrity, "FRACTURED");
assert.equal(fracturedStructuralC.diagnostics[0]?.unusableReason, "reality_auditor_survivor_fractured");
assert.equal(
  fracturedStructuralC.diagnostics[0]?.reconstructedText,
  "",
  "malformed survivor equivalent to observed C must not continue downstream",
);

const duplicateExactMapping = applyAuthorRealityEditorEdits({
  productions: [
    {
      production: "A",
      lines: [{ order: 1, text: "Echo. Echo.", sourceEventIds: ["event-1"] }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "Clean B.", sourceEventIds: ["event-2"] }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "Clean C.", sourceEventIds: ["event-3"] }],
    },
  ],
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "Echo.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
          { exactText: "Echo.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
        ],
      },
      {
        production: "B",
        spans: [{ exactText: "Clean B.", classification: "KEEP_EXPRESSION", sourceEventIds: [] }],
      },
      {
        production: "C",
        spans: [{ exactText: "Clean C.", classification: "KEEP_EXPRESSION", sourceEventIds: [] }],
      },
    ],
  },
});
assert.equal(duplicateExactMapping.productions[0]?.lines.length, 0);
assert.equal(duplicateExactMapping.diagnostics[0]?.unusableReason, "reality_auditor_span_ambiguous");
assert.equal(duplicateExactMapping.diagnostics[0]?.exactSpanMappingValid, false);

const tooManyAtomicSpans = applyAuthorRealityEditorEdits({
  productions: originalProductions.slice(0, 3),
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: Array.from({ length: 65 }, () => ({
          exactText: "x",
          classification: "KEEP_EXPRESSION",
          sourceEventIds: [],
        })),
      },
      { production: "B", spans: [] },
      { production: "C", spans: [] },
    ],
  },
});
assert.equal(tooManyAtomicSpans.applied, false);
assert.equal(tooManyAtomicSpans.reason, "malformed_reality_auditor_response");

const ambiguousAuditClauses = buildAuthorGroundingAtomicClauses([
  {
    text: "Echo. Echo.",
    kind: "line",
    sourceEventIds: ["event-2"],
    auditSpans: [
      { exactText: "Echo.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-2"] },
      { exactText: "Echo.", classification: "KEEP_EXPRESSION", sourceEventIds: [] },
    ],
  },
]);
assert.equal(
  ambiguousAuditClauses.some((clause) => clause.priorAudit),
  false,
  "ambiguous duplicate exact spans must fall back to existing verifier behavior",
);

const finalGroundingRejectedDespiteKeepExpression = applyAuthorGroundingVerifications({
  scenes: [{
    text: "A satisfied tail wag.",
    kind: "line",
    sourceEventIds: ["event-5"],
    auditSpans: [{
      exactText: "A satisfied tail wag.",
      classification: "KEEP_EXPRESSION",
      sourceEventIds: ["event-5"],
    }],
  }],
  suppliedReality: cocoReality,
  verifications: [{
    sceneIndex: 0,
    clauseIndex: 0,
    supported: false,
    supportKind: "UNSUPPORTED",
    sourceEventIds: ["event-5"],
    concreteClaims: ["tail wag"],
    unsupportedClaims: ["tail wag"],
  }],
});
assert.deepEqual(
  finalGroundingRejectedDespiteKeepExpression,
  [],
  "final grounding must still reject unsupported concrete reality marked KEEP_EXPRESSION upstream",
);

const keepExpressionNotBypassAudit = applyAuthorRealityEditorEdits({
  productions: [
    {
      production: "A",
      lines: [{ order: 1, text: "Unused A.", sourceEventIds: allCocoEventIds }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "Unused B.", sourceEventIds: allCocoEventIds }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "A satisfied tail wag.", sourceEventIds: ["event-5"] }],
    },
  ],
  auditorResponse: {
    audits: [
      {
        production: "A",
        spans: [
          { exactText: "Unused A.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "B",
        spans: [
          { exactText: "Unused B.", classification: "UNSUPPORTED_REALITY", sourceEventIds: [] },
        ],
      },
      {
        production: "C",
        spans: [
          { exactText: "A satisfied tail wag.", classification: "KEEP_EXPRESSION", sourceEventIds: ["event-5"] },
        ],
      },
    ],
  },
});
const keepExpressionNotBypassEvaluation = evaluateAuthorMemoryProductions({
  plan: cocoPlan,
  suppliedReality: cocoReality,
  subject: "Coco",
  expressiveProductions: keepExpressionNotBypassAudit.productions,
  treatmentAssignments: [
    directTreatment("A", "coco-keep-bypass-treatment-1", cocoReality),
    directTreatment("B", "coco-keep-bypass-treatment-2", cocoReality),
    directTreatment("C", "coco-keep-bypass-treatment-3", cocoReality),
    directTreatment("D", "coco-keep-bypass-treatment-4", cocoReality),
  ],
  lensSearchEnabled: true,
  realityDirect: true,
});
const keepExpressionNotBypassC = keepExpressionNotBypassEvaluation.productions.find((production) => production.production === "C");
assert.equal(keepExpressionNotBypassC?.lines[0]?.text, "A satisfied tail wag.");
assert.equal(keepExpressionNotBypassC?.lines[0]?.classification, undefined);
assert.equal(keepExpressionNotBypassC?.lines[0]?.accepted, false, "KEEP_EXPRESSION is not an automatic grounding bypass");
assert.deepEqual(keepExpressionNotBypassC?.lines[0]?.reasons, ["invented-concrete-reality"]);

console.log("AUTHOR REALITY AUDITOR EXPERIMENT GREEN - EXACT CLAIM AUDIT - DETERMINISTIC REMOVAL - DOWNSTREAM SELECTION INTACT");
