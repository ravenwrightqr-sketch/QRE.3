import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  attachDirectAuthorProvenanceToProductions,
  directAuthorAttemptsToProductions,
  directCreativeRealityText,
  evaluateAuthorMemoryProductions,
  normalizeDirectAuthorProvenanceAssignments,
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

assert.match(prompt, /You are the Author\./);
assert.match(prompt, /Here is supplied reality\./);
assert.match(prompt, /Make something of it\./);
assert.match(prompt, /Write three different attempts\./);
assert.match(prompt, /You do not need to use everything\./);
assert.match(prompt, /One detail may be enough\./);
assert.match(prompt, /Most of the supplied reality may remain unused\./);
assert.match(prompt, /Facts are material, not output slots\./);
assert.match(prompt, /Notice something worth saying\./);
assert.match(prompt, /Give disproportionate attention to the detail, relationship, implication, or contrast that changes the read\./);
assert.match(prompt, /Use no more language than the attempt earns\./);
assert.match(prompt, /Return only the authored attempts, without reasoning\./);
assert.match(prompt, /The supplied reality controls what actually happened\./);
assert.match(
  prompt,
  /Change perspective, not concrete occurrence\./,
);
assert.match(prompt, /Keep every concrete participant, event, action, interaction, object, place, physical behavior, observation, mental state, sensory fact, causality, and outcome inside supplied reality\./);
assert.match(prompt, /You may invent what to say about the supplied reality, but not more reality\./);
assert.doesNotMatch(prompt, /Do not invent something else happening\./);
assert.match(prompt, /Return only three attempts\./);
assert.doesNotMatch(prompt, /Say what you noticed\./);
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
assert.match(
  prompt,
  /Return exactly three attempts using the required schema\./,
  "direct user instruction must only communicate the output contract",
);
assert.doesNotMatch(prompt, /noticed/i, "direct creative user instruction must not contain noticed");
assert.doesNotMatch(prompt, /\bPRODUCTIONS\b/, "direct creative prompt must not expose PRODUCTIONS");
assert.doesNotMatch(prompt, /\["A", "B", "C"\]/, "direct creative prompt must not expose A/B/C labels");
assert.doesNotMatch(prompt, /Return only A, B, and C\./, "direct creative prompt must not expose A/B/C labels");
assert.doesNotMatch(prompt, /production objects/i, "direct creative prompt must not expose production objects");
assert.doesNotMatch(prompt, /\blines?\b/i, "direct creative prompt must not expose line containers");
assert.doesNotMatch(prompt, /\border\b/i, "direct creative prompt must not expose order containers");

for (const bannedPromptPattern of [
  /complete expressive productions/i,
  /expressive production itself/i,
  /invent perception/i,
  /Interpretation is open/i,
  /metaphorical thought/i,
  /recontextualization/i,
  /rhetorical exaggeration/i,
  /creative discovery/i,
  /expressive lines/i,
  /sourceEventIds/i,
]) {
  assert.doesNotMatch(
    prompt,
    bannedPromptPattern,
    `direct creative prompt must not contain ${bannedPromptPattern}`,
  );
}

assert.match(schema, /required:\s*\["attempts"\]/);
assert.match(schema, /minItems:\s*3,\s*\n\s*maxItems:\s*3,/);
assert.match(schema, /attempts:\s*\{/);
assert.match(schema, /required:\s*\["text"\]/);
assert.match(schema, /text:\s*\{\s*type:\s*"string"\s*\}/);
assert.doesNotMatch(schema, /\bproductions?\b/i, "direct creative schema must not contain production containers");
assert.doesNotMatch(schema, /\blines?\b/i, "direct creative schema must not contain line containers");
assert.doesNotMatch(schema, /\border\b/i, "direct creative schema must not contain order containers");
assert.doesNotMatch(schema, /\bsourceEventIds\b/, "direct creative schema must not contain sourceEventIds");
assert.doesNotMatch(schema, /\["A", "B", "C"\]/, "direct creative schema must not expose A/B/C labels");
assert.doesNotMatch(schema, /enum:\s*\["A", "B", "C", "D"\]/, "direct author schema must not ask model for D");
assert.match(
  source,
  /directAuthorAttemptsToProductions\(parsedMouth\)/,
  "direct path must deterministically convert attempts to internal productions after creative composition",
);

for (const field of [
  "production",
  "productions",
  "line",
  "lines",
  "order",
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

const authoredAttempts = {
  attempts: [
    { text: "The smallest detail mattered most." },
    { text: "The last field changed the record." },
    { text: "The tiny mismatch became the point." },
  ],
};

const authoredProductions = directAuthorAttemptsToProductions(authoredAttempts);
assert.deepEqual(
  authoredProductions.map((production) => production.production),
  ["A", "B", "C"],
  "attempts should become internal A/B/C only after creative text exists",
);
assert.deepEqual(
  authoredProductions.map((production) => production.lines.map((line) => line.order)),
  [[1], [1], [1]],
  "each direct attempt should become one internal line for provenance attachment",
);
assert.equal(
  authoredProductions[0]?.lines[0]?.text,
  authoredAttempts.attempts[0].text,
  "attempt text must remain unchanged during internal A conversion",
);
assert.equal(
  authoredProductions[1]?.lines[0]?.text,
  authoredAttempts.attempts[1].text,
  "attempt text must remain unchanged during internal B conversion",
);
assert.equal(
  authoredProductions[2]?.lines[0]?.text,
  authoredAttempts.attempts[2].text,
  "attempt text must remain unchanged during internal C conversion",
);

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

const validProvenanceAssignments = {
  assignments: [
    { production: "A", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
    { production: "B", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
    { production: "C", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
  ],
};

assert.deepEqual(
  normalizeDirectAuthorProvenanceAssignments(validProvenanceAssignments).map((assignment) => assignment.production),
  ["A", "B", "C"],
  "internal provenance validation must accept exactly one A/B/C set",
);

assert.throws(
  () => normalizeDirectAuthorProvenanceAssignments({
    assignments: validProvenanceAssignments.assignments.slice(0, 2),
  }),
  /malformed_direct_author_provenance_assignments_cardinality/,
  "internal provenance validation must reject fewer than three assignments",
);
assert.throws(
  () => normalizeDirectAuthorProvenanceAssignments({
    assignments: [
      ...validProvenanceAssignments.assignments,
      { production: "A", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
    ],
  }),
  /malformed_direct_author_provenance_assignments_cardinality/,
  "internal provenance validation must reject more than three assignments",
);
assert.throws(
  () => normalizeDirectAuthorProvenanceAssignments({
    assignments: [
      { production: "A", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
      { production: "B", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
      { production: "D", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
    ],
  }),
  /malformed_direct_author_provenance_productions/,
  "internal provenance validation must reject missing A/B/C coverage",
);
assert.throws(
  () => normalizeDirectAuthorProvenanceAssignments({
    assignments: [
      { production: "A", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
      { production: "B", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
      { production: "B", lines: [{ order: 1, sourceEventIds: ["event-4"] }] },
    ],
  }),
  /malformed_direct_author_provenance_productions/,
  "internal provenance validation must reject duplicate A/B/C assignments",
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
