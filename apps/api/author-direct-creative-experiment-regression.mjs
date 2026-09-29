import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  attachDirectAuthorProvenanceToProductions,
  directCreativeRealityText,
  evaluateAuthorMemoryProductions,
} from "./dist/services/authorCreative.js";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");

const flagName = "QRE_AUTHOR_DIRECT_CREATIVE_EXPERIMENT";
assert.match(source, new RegExp(`DIRECT_CREATIVE_AUTHOR_EXPERIMENT_FLAG\\s*=\\s*\\n\\s*"${flagName}"`));
assert.match(
  source,
  /const directCreativeAuthorExperiment =\s*\n\s*isMemoryMode && directCreativeAuthorExperimentEnabled\(\);/,
  "direct author experiment must activate only behind the flag in memory mode",
);
assert.match(
  source,
  /\? directAuthorTreatmentSearchResult\(/,
  "direct path must bypass Creative Search through an isolated result builder",
);
assert.match(
  source,
  /\? await generateDirectAuthorMemoryProductions\(/,
  "direct path must bypass Mouth with direct expressive production generation",
);

const directStart = source.indexOf("async function generateDirectAuthorMemoryProductions");
const directEnd = source.indexOf("function buildDeterministicMouthFallback", directStart);
assert.ok(directStart >= 0, "direct author generator not found");
assert.ok(directEnd > directStart, "direct author generator end not found");

const directSource = source.slice(directStart, directEnd);
const schemaStart = directSource.indexOf("jsonSchema:");
assert.ok(schemaStart >= 0, "direct author schema not found");
const prompt = directSource.slice(0, schemaStart);
const schema = directSource.slice(schemaStart);

assert.match(prompt, /The expressive production itself is the creative discovery\./);
assert.match(prompt, /return only the productions/i);
assert.match(prompt, /Do not output sourceEventIds, conception, attention, interpretation, rationale, theme, semantic mechanic, lens name, meaning, explanation, winner selection, or D\./);
assert.match(prompt, /The number of lines has no relationship to the number of supplied facts\./);
assert.match(prompt, /Do not construct a line for each fact\./);
assert.match(prompt, /A production may be one line\./);
assert.match(prompt, /One small supplied detail may carry the entire production\./);
assert.match(prompt, /Most supplied facts may remain unused\./);
assert.match(
  directSource,
  /REALITY:\s*directCreativeRealityText\(input\.suppliedReality\)/,
  "direct creative input must use continuous REALITY text",
);
assert.doesNotMatch(
  directSource,
  /SUPPLIED_REALITY:\s*input\.suppliedReality/,
  "direct creative input must not expose event-object supplied reality",
);
assert.match(prompt, /Reality is closed/i);

assert.match(schema, /required:\s*\["productions"\]/);
assert.match(schema, /minItems:\s*3,\s*\n\s*maxItems:\s*3,/);
assert.match(schema, /production:\s*\{\s*type:\s*"string",\s*enum:\s*\["A", "B", "C"\]\s*\}/);
assert.match(schema, /required:\s*\["production", "lines"\]/);
assert.match(schema, /lines:\s*\{\s*\n\s*type:\s*"array",\s*\n\s*minItems:\s*1,\s*\n\s*maxItems:\s*12,/);
assert.match(schema, /required:\s*\["order", "text"\]/);
assert.doesNotMatch(schema, /\bsourceEventIds\b/, "direct creative schema must not contain sourceEventIds");
assert.doesNotMatch(schema, /enum:\s*\["A", "B", "C", "D"\]/, "direct author schema must not ask model for D");

for (const field of [
  "sourceEventIds",
  "conception",
  "attention",
  "interpretation",
  "rationale",
  "theme",
  "mechanic",
  "lens",
  "meaning",
  "explanation",
  "selectedProduction",
  "selectionReason",
]) {
  assert.doesNotMatch(
    schema,
    new RegExp(`\\b${field}\\b`, "i"),
    `direct author schema must not contain ${field}`,
  );
}

const provenanceStart = source.indexOf("async function assignDirectAuthorProductionProvenance");
const provenanceEnd = source.indexOf("async function generateDirectAuthorMemoryProductions", provenanceStart);
assert.ok(provenanceStart >= 0, "direct provenance assignment helper not found");
assert.ok(provenanceEnd > provenanceStart, "direct provenance assignment helper end not found");
const provenanceSource = source.slice(provenanceStart, provenanceEnd);
const provenanceSchemaStart = provenanceSource.indexOf("jsonSchema:");
const provenanceSchemaEnd = provenanceSource.indexOf("const parsed = parseJson", provenanceSchemaStart);
assert.ok(provenanceSchemaEnd > provenanceSchemaStart, "direct provenance schema end not found");
const provenanceSchema = provenanceSource.slice(provenanceSchemaStart, provenanceSchemaEnd);

assert.match(
  source,
  /let parsedMouth = parseJson\(mouthResult\.text\);[\s\S]*assignDirectAuthorProductionProvenance\(/,
  "provenance must be attached only after creative text exists",
);
assert.match(provenanceSource, /Do not rewrite text\./, "provenance must not rewrite creative text");
assert.match(provenanceSource, /Do not repair text\./, "provenance must not repair creative text");
assert.match(provenanceSource, /Do not assign evidence by line position\./, "provenance must not be positional");
assert.match(provenanceSource, /Do not require full coverage\./, "provenance must not require full coverage");
assert.match(provenanceSource, /Do not assign every event to every line\./, "provenance must not assign all events to all lines");
assert.match(provenanceSource, /Return evidence IDs only\./, "provenance mapper must return IDs only");
assert.match(provenanceSchema, /required:\s*\["order", "sourceEventIds"\]/);
assert.doesNotMatch(provenanceSchema, /\btext\b/, "provenance schema must not allow text rewrites");

assert.match(source, /export async function searchAuthorCreativeLensTreatments/, "normal Creative Search must remain present");
assert.match(source, /"You are QRE Mouth\."/u, "normal Mouth must remain present");
assert.match(source, /Production D is the deterministic truth control\./, "D must remain deterministic downstream");

const suppliedReality = [
  { id: "event-1", text: "The request was received" },
  { id: "event-2", text: "A normal review started" },
  { id: "event-3", text: "The record stayed ordinary" },
  { id: "event-4", text: "A tiny mismatch appeared in the last field" },
  { id: "event-5", text: "The review ended" },
];

const realityText = directCreativeRealityText(suppliedReality);
assert.equal(
  realityText,
  "The request was received. A normal review started. The record stayed ordinary. A tiny mismatch appeared in the last field. The review ended.",
  "continuous REALITY rendering should deterministically preserve supplied text order",
);
assert.doesNotMatch(realityText, /\bevent-\d+\b/, "creative REALITY text must not contain event IDs");
assert.doesNotMatch(realityText, /[\[\]{}]/, "creative REALITY text must not be an array/object serialization");

const plan = {
  thesis: "Use supplied reality directly.",
  beats: suppliedReality.map((event, index) => ({
    order: index + 1,
    role: index === 0 ? "HOOK" : index === suppliedReality.length - 1 ? "PAYOFF" : "BUILD",
    eventIds: [event.id],
    attention: event.text,
    change: "Advance the supplied reality directly; the creative work is perceptual rather than factual.",
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
    treatment: "direct expressive production",
    perceptionDelta: "perception authored directly in the production",
    expressiveBehaviors: ["direct author production"],
    intensity: "MEDIUM",
  };
}

const authoredProductions = [
    {
      production: "A",
      lines: [{ order: 1, text: "The smallest detail mattered most." }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: "The last field changed the record." }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: "The tiny mismatch became the point." }],
    },
  ];

const expressiveProductions = attachDirectAuthorProvenanceToProductions({
  authoredProductions,
  provenanceAssignments: [
    { production: "A", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
    { production: "B", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
    { production: "C", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
  ],
  suppliedReality,
});

assert.equal(expressiveProductions[0]?.lines[0]?.text, authoredProductions[0]?.lines[0]?.text);
assert.deepEqual(expressiveProductions[0]?.lines[0]?.sourceEventIds, ["event-4"]);
assert.notDeepEqual(
  expressiveProductions[0]?.lines[0]?.sourceEventIds,
  suppliedReality.map((event) => event.id),
  "provenance helper must not assign every event to every line",
);
assert.notEqual(
  expressiveProductions[0]?.lines[0]?.sourceEventIds[0],
  "event-1",
  "provenance helper must not infer evidence from line position",
);

const evaluation = evaluateAuthorMemoryProductions({
  plan,
  suppliedReality,
  subject: "review",
  expressiveProductions,
  treatmentAssignments: [
    directTreatment("A", "treatment-1"),
    directTreatment("B", "treatment-2"),
    directTreatment("C", "treatment-3"),
    {
      production: "D",
      id: "treatment-4",
      semanticMechanic: "NONE",
      sourceCandidateId: "bare",
      sourceRelation: "bare supplied reality",
      evidenceEventIds: suppliedReality.map((event) => event.id),
      creativePressure: "BARE",
      hiddenInference: "",
      treatment: "NONE / Bare Reality. Present only the supplied facts in their natural sequence with minimal treatment.",
      perceptionDelta: "No added perception; direct supplied reality remains visible as the control.",
      expressiveBehaviors: ["bare reality"],
      intensity: "LIGHT",
    },
  ],
  lensSearchEnabled: true,
  realityDirect: true,
});

const productionA = evaluation.productions.find((production) => production.production === "A");
const productionB = evaluation.productions.find((production) => production.production === "B");
const productionC = evaluation.productions.find((production) => production.production === "C");
const productionD = evaluation.productions.find((production) => production.production === "D");

assert.ok(productionA, "A should reach downstream evaluation");
assert.ok(productionB, "B should reach downstream evaluation");
assert.ok(productionC, "C should reach downstream evaluation");
assert.ok(productionD, "D should be attached downstream");
assert.equal(productionA.accepted, true, productionA.reasons.join("; "));
assert.equal(productionB.accepted, true, productionB.reasons.join("; "));
assert.equal(productionC.accepted, true, productionC.reasons.join("; "));
assert.equal(productionA.lines.length, 1, "one event may support an entire A production");
assert.deepEqual(productionA.lines[0]?.sourceEventIds, ["event-4"]);
assert.deepEqual(productionB.lines[0]?.sourceEventIds, ["event-4"], "B may reuse A evidence");
assert.deepEqual(productionC.lines[0]?.sourceEventIds, ["event-4"], "C may reuse A evidence");
assert.equal(productionD.accepted, true, productionD.reasons.join("; "));
assert.equal(productionD.lines.length, plan.beats.length, "D must remain complete factual control");
assert.deepEqual(
  productionD.lines.flatMap((line) => line.sourceEventIds),
  suppliedReality.map((event) => event.id),
);
assert.ok(evaluation.selectedProduction, "late selection should choose only after productions are evaluated");
assert.ok(evaluation.scenes.length >= 1, "winner scenes should be built after late selection");

console.log("AUTHOR DIRECT CREATIVE EXPERIMENT GREEN - TEXT-ONLY CREATION - POST-CREATIVE PROVENANCE - D DETERMINISTIC - LATE SELECTION");
