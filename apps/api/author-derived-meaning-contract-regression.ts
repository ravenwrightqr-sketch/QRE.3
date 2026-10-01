import assert from "node:assert/strict";
import {
  validateAuthorDerivedMeaningStructure,
  type AuthorDerivedMeaning,
} from "./src/services/authorDerivedMeaning.js";

const suppliedEvents = [
  { id: "event-1" },
  { id: "event-2" },
  { id: "event-3" },
];

const emptyMeaning = validateAuthorDerivedMeaningStructure(
  { kind: "DERIVED_MEANING", relations: [] },
  [{ id: "event-1" }],
);
assert.equal(emptyMeaning.valid, true, "sparse reality may validly produce zero relations");
if (emptyMeaning.valid) assert.deepEqual(emptyMeaning.value.relations, []);

const multipleInterpretations: AuthorDerivedMeaning = {
  kind: "DERIVED_MEANING",
  relations: [
    {
      id: "relation-1",
      relation: "Two supplied particulars form a grounded pattern.",
      groundingEventIds: ["event-1", "event-2"],
      interpretations: [
        {
          id: "interpretation-1",
          interpretation: "One possible reading.",
          derivation: "It follows from the cited particulars considered together.",
        },
        {
          id: "interpretation-2",
          interpretation: "A distinct possible reading.",
          derivation: "The same relation supports another non-exclusive reading.",
        },
      ],
    },
  ],
};
const validMeaning = validateAuthorDerivedMeaningStructure(multipleInterpretations, suppliedEvents);
assert.equal(validMeaning.valid, true, "one relation may retain multiple interpretations");
if (validMeaning.valid) {
  assert.deepEqual(
    validMeaning.value.relations[0]?.interpretations.map(({ id }) => id),
    ["interpretation-1", "interpretation-2"],
    "validation must not choose or discard an interpretation",
  );
}

function expectIssue(
  value: unknown,
  code: string,
  events = suppliedEvents,
): void {
  const result = validateAuthorDerivedMeaningStructure(value, events);
  assert.equal(result.valid, false, `expected invalid result for ${code}`);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.code === code), `missing issue ${code}`);
  }
}

const baseRelation = multipleInterpretations.relations[0]!;
expectIssue(
  { kind: "SUPPLIED_REALITY", relations: [] },
  "invalid-kind",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: "not an array" },
  "expected-array",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [{ ...baseRelation, groundingEventIds: [] }] },
  "empty-grounding-event-ids",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [{ ...baseRelation, groundingEventIds: ["event-1"] }] },
  "relation-requires-two-distinct-events",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [{ ...baseRelation, groundingEventIds: ["event-1", "event-1"] }] },
  "duplicate-grounding-event-id",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [{ ...baseRelation, groundingEventIds: ["event-1", "event-404"] }] },
  "unknown-grounding-event-id",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [{ ...baseRelation, id: "relation id with spaces" }] },
  "invalid-relation-id",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [baseRelation, { ...baseRelation }] },
  "duplicate-relation-id",
);
expectIssue(
  {
    kind: "DERIVED_MEANING",
    relations: [{
      ...baseRelation,
      interpretations: [
        baseRelation.interpretations[0]!,
        { ...baseRelation.interpretations[1]!, id: "interpretation-1" },
      ],
    }],
  },
  "duplicate-interpretation-id",
);
expectIssue(
  {
    kind: "DERIVED_MEANING",
    relations: [{
      ...baseRelation,
      interpretations: [{ ...baseRelation.interpretations[0]!, id: "interpretation id with spaces" }],
    }],
  },
  "invalid-interpretation-id",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [{ ...baseRelation, relation: "   " }] },
  "invalid-relation-text",
);
expectIssue(
  {
    kind: "DERIVED_MEANING",
    relations: [{
      ...baseRelation,
      interpretations: [{ ...baseRelation.interpretations[0]!, interpretation: "" }],
    }],
  },
  "invalid-interpretation-text",
);
expectIssue(
  {
    kind: "DERIVED_MEANING",
    relations: [{
      ...baseRelation,
      interpretations: [{ ...baseRelation.interpretations[0]!, derivation: " " }],
    }],
  },
  "invalid-derivation-text",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [{ ...baseRelation, interpretations: [] }] },
  "empty-interpretations",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [baseRelation], events: [{ id: "invented-event" }] },
  "unexpected-key",
);
expectIssue(
  { kind: "DERIVED_MEANING", relations: [{ ...baseRelation, event: { id: "invented-event" } }] },
  "unexpected-key",
);

const duplicateReference = {
  kind: "DERIVED_MEANING",
  relations: [{ ...baseRelation, groundingEventIds: ["event-1", "event-1", "event-2"] }],
};
const duplicateReferenceFirstResult = validateAuthorDerivedMeaningStructure(duplicateReference, suppliedEvents);
const duplicateReferenceSecondResult = validateAuthorDerivedMeaningStructure(duplicateReference, suppliedEvents);
assert.deepEqual(
  duplicateReferenceFirstResult,
  duplicateReferenceSecondResult,
  "invalid references must be rejected deterministically",
);

const structuralOnly = validateAuthorDerivedMeaningStructure(
  {
    kind: "DERIVED_MEANING",
    relations: [{
      ...baseRelation,
      interpretations: [{
        id: "interpretation-1",
        interpretation: "A claim whose semantic support requires a separate judgment.",
        derivation: "This text is structurally present but entailment is not evaluated here.",
      }],
    }],
  },
  suppliedEvents,
);
assert.equal(
  structuralOnly.valid,
  true,
  "structural validation must not claim to prove semantic entailment",
);
if (structuralOnly.valid) {
  assert.deepEqual(Object.keys(structuralOnly.value), ["kind", "relations"]);
  assert.equal("events" in structuralOnly.value, false, "derived meaning is not an event collection");
}

console.log("AUTHOR DERIVED MEANING CONTRACT REGRESSION GREEN - STRUCTURE AND EVENT AUTHORITY ONLY");
