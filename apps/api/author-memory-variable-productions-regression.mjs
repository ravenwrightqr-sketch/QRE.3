import assert from "node:assert/strict";
import {
  authorMouthCreativeTreatmentPayload,
  evaluateAuthorMemoryProductions,
  sanitizeAuthorMouthTreatmentAssignments,
} from "./dist/services/authorCreative.js";

const suppliedReality = [
  { id: "event-1", text: "The request was received" },
  { id: "event-2", text: "A normal review started" },
  { id: "event-3", text: "The record stayed ordinary" },
  { id: "event-4", text: "A tiny mismatch appeared in the last field" },
  { id: "event-5", text: "The review ended" },
];

const plan = {
  thesis: "A small supplied detail can carry disproportionate meaning.",
  beats: suppliedReality.map((event, index) => ({
    order: index + 1,
    role: index === 0 ? "HOOK" : index === suppliedReality.length - 1 ? "PAYOFF" : "BUILD",
    eventIds: [event.id],
    attention: event.text,
    change: event.text,
  })),
};

function treatment(production, id, conception) {
  return {
    production,
    id,
    semanticMechanic: "status_tension",
    sourceCandidateId: `notice-${production}`,
    sourceRelation: "one small supplied detail can reorganize attention",
    evidenceEventIds: ["event-4"],
    creativePressure: conception,
    hiddenInference: "",
    treatment: conception,
    perceptionDelta: conception,
    expressiveBehaviors: ["disproportionate attention", "semantic escalation"],
    intensity: "MEDIUM",
  };
}

const treatments = [
  treatment("A", "treatment-1", "the smallest supplied detail becomes the point"),
  treatment("B", "treatment-2", "the ordinary record almost misses its own signal"),
  treatment("C", "treatment-3", "attention snaps toward the quietest supplied fact"),
];

const bareTreatment = {
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
};

const mouthTreatments = sanitizeAuthorMouthTreatmentAssignments([
  ...treatments,
  bareTreatment,
]);
const mouthPayload = authorMouthCreativeTreatmentPayload(mouthTreatments);

for (const production of ["A", "B", "C"]) {
  const payload = mouthPayload.find((item) => item.production === production);
  const source = treatments.find((item) => item.production === production);
  assert.ok(payload, `Mouth payload missing ${production}`);
  assert.ok(source, `source treatment missing ${production}`);
  assert.equal(
    Object.prototype.hasOwnProperty.call(payload, "semanticMechanic"),
    false,
    `${production} should not expose deterministic semanticMechanic to Mouth`,
  );
  assert.deepEqual(payload.evidenceEventIds, source.evidenceEventIds);
  assert.equal(payload.sourceRelation, source.sourceRelation);
  assert.equal(payload.creativePressure, source.creativePressure);
  assert.equal(payload.treatment, source.treatment);
  assert.equal(payload.perceptionDelta, source.perceptionDelta);
}

const barePayload = mouthPayload.find((item) => item.production === "D");
assert.equal(barePayload?.semanticMechanic, "NONE", "D should retain the bare control mechanic marker");
assert.deepEqual(
  new Set(mouthPayload.filter((item) => item.production !== "D").map((item) => item.creativePressure)).size,
  3,
  "three independent Creative Search conceptions should reach Mouth",
);

const variable = evaluateAuthorMemoryProductions({
  plan,
  suppliedReality,
  subject: "review",
  expressiveProductions: [
    {
      production: "A",
      lines: [{
        order: 1,
        text: "The smallest detail mattered most.",
        sourceEventIds: ["event-4"],
      }],
    },
    { production: "B", lines: [] },
    { production: "C", lines: [] },
  ],
  treatmentAssignments: mouthTreatments,
  selectedProduction: "A",
});

const productionA = variable.productions.find((production) => production.production === "A");
const productionD = variable.productions.find((production) => production.production === "D");

assert.ok(productionA, "A production missing");
assert.ok(productionD, "D production missing");
assert.equal(productionA.accepted, true, productionA.reasons.join("; "));
assert.equal(productionA.lines.length, 1, "A should not be forced to match beat count");
assert.deepEqual(productionA.lines[0]?.sourceEventIds, ["event-4"]);
assert.equal(variable.selectedProduction, "A", "accepted expressive production should beat D");
assert.equal(variable.scenes.length, 1, "A winner should construct scenes from A's own lines");
assert.deepEqual(variable.scenes[0]?.sourceEventIds, ["event-4"]);
assert.equal(productionD.accepted, true, productionD.reasons.join("; "));
assert.equal(productionD.lines.length, plan.beats.length, "D should remain complete factual control");
assert.deepEqual(
  productionD.lines.flatMap((line) => line.sourceEventIds),
  suppliedReality.map((event) => event.id),
);
assert.deepEqual(
  variable.productions.map((production) => production.production).sort(),
  ["A", "B", "C", "D"],
  "A/B/C/D late-production set should remain intact",
);

const inventedResult = evaluateAuthorMemoryProductions({
  plan,
  suppliedReality,
  subject: "review",
  expressiveProductions: [
    {
      production: "A",
      lines: [{
        order: 1,
        text: "The door opened.",
        sourceEventIds: ["event-4"],
      }],
    },
    { production: "B", lines: [] },
    { production: "C", lines: [] },
  ],
  treatmentAssignments: mouthTreatments,
  selectedProduction: "A",
});

const inventedA = inventedResult.productions.find((production) => production.production === "A");
assert.ok(inventedA, "invented A production missing");
assert.equal(inventedA.accepted, false, "invented concrete reality should still be rejected");
assert.ok(
  inventedA.lines.some((line) => line.sourceEventIds.includes("event-4")),
  "invented line should still report its attempted provenance",
);
assert.equal(inventedResult.selectedProduction, "D", "D should be truth-safe fallback");
assert.equal(inventedResult.scenes.length, plan.beats.length, "D fallback should remain complete");

console.log(
  "AUTHOR MEMORY VARIABLE PRODUCTIONS GREEN - A/B/C VARIABLE LENGTH - D COMPLETE - LATE SELECTION",
);
