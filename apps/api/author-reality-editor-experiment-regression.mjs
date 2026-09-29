import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyAuthorRealityEditorEdits,
  buildAuthorRealityEditorPayload,
  evaluateAuthorMemoryProductions,
} from "./dist/services/authorCreative.js";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");

assert.match(source, /AUTHOR_REALITY_EDITOR_EXPERIMENT_FLAG\s*=\s*\n\s*"QRE_AUTHOR_REALITY_EDITOR_EXPERIMENT"/);
assert.match(
  source,
  /function authorRealityEditorExperimentEnabled\(\): boolean \{\s*\n\s*return process\.env\[AUTHOR_REALITY_EDITOR_EXPERIMENT_FLAG\] === "true";\s*\n\}/,
  "reality editor experiment must be off unless its flag is explicitly true",
);
assert.match(
  source,
  /const directCreativeAuthorExperiment =\s*\n\s*isMemoryMode && directCreativeAuthorExperimentEnabled\(\);/,
  "direct creative experiment must remain memory-only",
);
assert.match(
  source,
  /const directAuthorRealityEditorExperiment =\s*\n\s*directCreativeAuthorExperiment && authorRealityEditorExperimentEnabled\(\);/,
  "reality editor must require direct creative experiment plus its own flag",
);

const editorStart = source.indexOf("async function editDirectAuthorReality");
const editorEnd = source.indexOf("async function assignDirectAuthorProductionProvenance", editorStart);
assert.ok(editorStart >= 0, "reality editor helper not found");
assert.ok(editorEnd > editorStart, "reality editor helper end not found");
const editorSource = source.slice(editorStart, editorEnd);
const editorSchemaStart = editorSource.indexOf("jsonSchema:");
assert.ok(editorSchemaStart >= 0, "reality editor schema not found");
const editorPrompt = editorSource.slice(0, editorSchemaStart);
const editorSchema = editorSource.slice(editorSchemaStart);

assert.match(editorPrompt, /You are the Reality Editor\./);
assert.match(editorPrompt, /The supplied reality controls what actually happened\./);
assert.match(editorPrompt, /The text has already been authored\. Do not author it again\./);
assert.match(editorPrompt, /Evidence licenses only what it establishes\./);
assert.match(
  editorPrompt,
  /Do not complete reality from common sense, likelihood, implication, association, or what would normally happen\./,
);
assert.match(
  editorPrompt,
  /A claim is unsupported if it requires any additional fact to be true beyond the supplied reality\./,
);
assert.match(editorPrompt, /Remove unsupported concrete or mental claims\./);
assert.match(editorPrompt, /Preserve authored language unchanged when it does not require an unsupported fact to be true\./);
assert.match(editorPrompt, /Do not replace deleted material with invented material\./);
assert.match(editorPrompt, /Do not summarize the supplied reality\./);
assert.match(editorPrompt, /Do not explain your edits\./);
assert.match(editorPrompt, /Do not improve the writing\./);
assert.match(editorPrompt, /Return only the edited text\./);
assert.doesNotMatch(editorPrompt, /Coco|bow|bath|dog|Thursday|example|metaphor|humor|wordplay|style|lens|genre/i);
assert.doesNotMatch(editorPrompt, /Remove concrete claims that are not supported by the supplied reality\./);
assert.doesNotMatch(editorPrompt, /Preserve supported authored language unchanged whenever possible\./);
assert.doesNotMatch(editorPrompt, /Expressive language may remain when it does not require a new concrete occurrence to be true\./);

const directAuthorStart = source.indexOf("async function generateDirectAuthorMemoryProductions");
const directAuthorEnd = source.indexOf("function buildDeterministicMouthFallback", directAuthorStart);
assert.ok(directAuthorStart >= 0, "direct creative Author helper not found");
assert.ok(directAuthorEnd > directAuthorStart, "direct creative Author helper end not found");
const directAuthorSource = source.slice(directAuthorStart, directAuthorEnd);
assert.match(directAuthorSource, /Make something of it\./, "direct creative Author prompt must remain unchanged");
assert.match(directAuthorSource, /Return exactly three attempts using the required schema\./);
assert.doesNotMatch(directAuthorSource, /Evidence licenses only what it establishes\./);
assert.doesNotMatch(directAuthorSource, /common sense, likelihood, implication, association/);

assert.match(editorSource, /content: JSON\.stringify\(buildAuthorRealityEditorPayload\(input\)\)/);
assert.match(editorSchema, /required:\s*\["edits"\]/);
assert.match(editorSchema, /minItems:\s*3,\s*\n\s*maxItems:\s*3,/);
assert.match(editorSchema, /required:\s*\["production", "text"\]/);
assert.match(editorSchema, /production:\s*\{\s*type:\s*"string",\s*enum:\s*\["A", "B", "C"\]\s*\}/);
assert.match(editorSchema, /text:\s*\{\s*type:\s*"string"\s*\}/);
assert.doesNotMatch(editorSchema, /\bsourceEventIds\b/, "editor response schema must not return provenance");
assert.doesNotMatch(editorSchema, /\b(?:winner|score|scores|reason|reasons|selection|D)\b/, "editor response schema must not expose selection data");

const runtimeStart = source.indexOf("let parsedMouth = parseJson(mouthResult.text);");
const provenanceCall = source.indexOf("assignDirectAuthorProductionProvenance", runtimeStart);
const editorCall = source.indexOf("editDirectAuthorReality", provenanceCall);
const parserStart = source.indexOf("const rawProductions = Array.isArray(parsedMouth?.productions)", editorCall);
const selectionCall = source.indexOf("selectMemoryProductionCandidate", parserStart);
assert.ok(runtimeStart >= 0, "runtime mouth parse not found");
assert.ok(provenanceCall > runtimeStart, "provenance must run after creative text exists");
assert.ok(editorCall > provenanceCall, "reality editor must run after provenance");
assert.ok(parserStart > editorCall, "edited productions must feed existing production parser");
assert.ok(selectionCall > parserStart, "selection must remain downstream of editor and production parsing");
assert.match(
  source.slice(provenanceCall, parserStart),
  /debug\("REALITY-EDITOR", \{\s*\n\s*enabled: true,[\s\S]*before: provenanceResult\.productions,[\s\S]*after: productionsAfterRealityEditor,/,
  "debug trace must preserve before and after editor text",
);
assert.match(
  source.slice(provenanceCall, parserStart),
  /catch\(\(error: unknown\) => \(\{\s*\n\s*productions: provenanceResult\.productions,[\s\S]*direct_author_reality_editor_failed/,
  "editor error must fall back to original pre-editor productions",
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
  "editor input must contain authored A/B/C only",
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
  assert.doesNotMatch(payloadText, new RegExp(`\\b${hiddenField}\\b`, "i"), `editor input must not expose ${hiddenField}`);
}

const edited = applyAuthorRealityEditorEdits({
  productions: originalProductions.slice(0, 3),
  editorResponse: {
    edits: [
      { production: "A", text: "The smallest detail mattered most.", sourceEventIds: ["event-1", "event-2", "event-3"] },
      { production: "B", text: "The last field changed the record." },
      { production: "C", text: "" },
    ],
  },
});
assert.equal(edited.applied, true);
assert.equal(edited.productions[0]?.lines[0]?.text, "The smallest detail mattered most.");
assert.deepEqual(
  edited.productions[0]?.lines[0]?.sourceEventIds,
  ["event-2"],
  "editor must not expand sourceEventIds even if response includes them",
);
assert.equal(edited.productions[2]?.lines.length, 0, "empty legitimate edit must not manufacture replacement prose");

for (const malformedResponse of [
  { edits: [{ production: "A", text: "A" }, { production: "B", text: "B" }] },
  { edits: [{ production: "A", text: "A" }, { production: "A", text: "again" }, { production: "C", text: "C" }] },
  { edits: [{ production: "A", text: "A" }, { production: "B", text: "B" }, { production: "C", text: 12 }] },
]) {
  const fallback = applyAuthorRealityEditorEdits({
    productions: originalProductions.slice(0, 3),
    editorResponse: malformedResponse,
  });
  assert.equal(fallback.applied, false);
  assert.deepEqual(
    fallback.productions,
    originalProductions.slice(0, 3),
    "malformed editor response must fall back to original pre-editor A/B/C",
  );
}

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

function directTreatment(production, id) {
  return {
    production,
    id,
    sourceCandidateId: `direct-author[${production}]`,
    sourceRelation: "line-owned sourceEventIds supply direct creative provenance",
    evidenceEventIds: suppliedReality.map((event) => event.id),
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
  expressiveProductions: edited.productions,
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
const productionC = evaluation.productions.find((production) => production.production === "C");
const productionD = evaluation.productions.find((production) => production.production === "D");
assert.ok(productionA, "edited A must reach existing downstream evaluation");
assert.equal(productionA.lines[0]?.text, "The smallest detail mattered most.");
assert.ok(productionC, "empty edited C should still be represented downstream");
assert.equal(productionC.accepted, false, "empty edited C should not be replaced by generated prose");
assert.ok(productionD, "D must remain present downstream");
assert.equal(productionD.lines.length, plan.beats.length, "D must remain complete supplied reality");
assert.ok(evaluation.selectedProduction, "winner selection must remain late after full production evaluation");

console.log("AUTHOR REALITY EDITOR EXPERIMENT GREEN - POST-PROVENANCE EDITOR - FALLBACK ORIGINAL - DOWNSTREAM SELECTION INTACT");
