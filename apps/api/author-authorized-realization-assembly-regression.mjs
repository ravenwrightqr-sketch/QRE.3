import assert from "node:assert/strict";
import {
  assembleAuthorizedRealizations,
  evaluateAuthorMemoryProductions,
  harvestAuthorizedRealizationPool,
  synthesizeAuthorizedRealizations,
  verifyAuthorizedAssemblyCandidate,
} from "./dist/services/authorCreative.js";

const suppliedReality = [
  { id: "event-1", text: "Dropped off at 9:00 AM." },
  { id: "event-2", text: "Bath." },
  { id: "event-3", text: "Blue bows." },
  { id: "event-4", text: "Tried to remove the bows." },
  { id: "event-5", text: "Happy at pickup." },
];

const productions = [
  {
    production: "A",
    lines: [{
      order: 1,
      text: "The day's small drama was Coco and the blue bows. A groomer laughed.",
      sourceEventIds: ["event-3", "event-4"],
    }],
  },
  {
    production: "B",
    lines: [{
      order: 1,
      text: "whatever protest the bows caused did not last. Coco won a trophy.",
      sourceEventIds: ["event-3", "event-4", "event-5"],
    }],
  },
  {
    production: "C",
    lines: [{
      order: 1,
      text: "Dropped off at 9:00 AM. Bath.",
      sourceEventIds: ["event-1", "event-2"],
    }],
  },
];

const diagnostics = [
  {
    production: "A",
    originalText: productions[0].lines[0].text,
    spans: [
      {
        exactText: "The day's small drama was Coco and the blue bows.",
        classification: "KEEP_EXPRESSION",
        sourceEventIds: ["event-3", "event-4"],
      },
      {
        exactText: "A groomer laughed.",
        classification: "UNSUPPORTED_REALITY",
        sourceEventIds: [],
      },
    ],
    removedSpans: ["A groomer laughed."],
    reconstructedText: "The day's small drama was Coco and the blue bows.",
    semanticClassificationValid: true,
    auditProtocolValid: true,
    exactSpanMappingValid: true,
    unsupportedDeletionRequired: true,
    survivorIntegrity: "INTACT",
  },
  {
    production: "B",
    originalText: productions[1].lines[0].text,
    spans: [
      {
        exactText: "whatever protest the bows caused did not last.",
        classification: "KEEP_EXPRESSION",
        sourceEventIds: ["event-3", "event-4", "event-5"],
      },
      {
        exactText: "Coco won a trophy.",
        classification: "UNSUPPORTED_REALITY",
        sourceEventIds: [],
      },
    ],
    removedSpans: ["Coco won a trophy."],
    reconstructedText: "whatever protest the bows caused did not last.",
    semanticClassificationValid: true,
    auditProtocolValid: true,
    exactSpanMappingValid: true,
    unsupportedDeletionRequired: true,
    survivorIntegrity: "INTACT",
  },
  {
    production: "C",
    originalText: productions[2].lines[0].text,
    spans: [
      {
        exactText: "Dropped off at 9:00 AM.",
        classification: "SUPPORTED_REALITY",
        sourceEventIds: ["event-1"],
      },
      {
        exactText: "Bath.",
        classification: "SUPPORTED_REALITY",
        sourceEventIds: ["event-2"],
      },
    ],
    removedSpans: [],
    reconstructedText: "Dropped off at 9:00 AM. Bath.",
    semanticClassificationValid: true,
    auditProtocolValid: true,
    exactSpanMappingValid: true,
    unsupportedDeletionRequired: false,
    survivorIntegrity: "NOT_REQUIRED",
  },
];

const plan = {
  thesis: "Use supplied reality directly.",
  beats: suppliedReality.map((event, index) => ({
    order: index + 1,
    role: index === 0 ? "HOOK" : index === suppliedReality.length - 1 ? "PAYOFF" : "BUILD",
    eventIds: [event.id],
    attention: event.text,
    change: event.text,
  })),
};

const treatmentAssignments = ["A", "B", "C"].map((production, index) => ({
  id: `treatment-${index + 1}`,
  production,
  semanticMechanic: "NONE",
  sourceCandidateId: `direct-author[${production}]`,
  sourceRelation: "line-owned sourceEventIds supply direct creative provenance",
  evidenceEventIds: suppliedReality.map((event) => event.id),
  creativePressure: "direct expression from supplied reality",
  hiddenInference: "",
  treatment: "direct expressive production",
  perceptionDelta: "perception authored directly in the production",
  expressiveBehaviors: ["direct author production"],
  intensity: "MEDIUM",
}));

const pool = harvestAuthorizedRealizationPool({
  diagnostics,
  productions,
  suppliedReality,
});

assert.deepEqual(
  pool.filter((realization) => realization.sourceProduction === "A").map((realization) => realization.text),
  ["The day's small drama was Coco and the blue bows."],
  "authorized material should be harvested from A even when A also had unsupported material",
);
assert.deepEqual(
  pool.filter((realization) => realization.sourceProduction === "B").map((realization) => realization.text),
  ["whatever protest the bows caused did not last."],
  "authorized material should be harvested from B even when B also had unsupported material",
);
assert.equal(
  pool.some((realization) => /groomer laughed|won a trophy/i.test(realization.text)),
  false,
  "UNSUPPORTED_REALITY material must not enter the assembly pool",
);
assert.ok(
  pool.some((realization) => realization.materialKind === "EXPRESSIVE_PERSPECTIVE"),
  "rhetorical expressive perspective should remain available",
);

const assembled = assembleAuthorizedRealizations({ pool, suppliedReality });
assert.ok(assembled, "authorized pool should produce an assembled candidate");

const assembledSources = new Set(
  assembled.sourceRealizationIds.map((id) => pool.find((realization) => realization.id === id)?.sourceProduction),
);
assert.ok(
  assembledSources.has("A") && assembledSources.has("B"),
  "source production identity must not prevent cross-production assembly",
);
assert.notEqual(
  assembled.rawText,
  assembled.sourceRealizationIds
    .map((id) => pool.find((realization) => realization.id === id)?.text ?? "")
    .join(" "),
  "assembly must perform a new verbal realization, not a mechanical span join",
);
assert.equal(assembled.lines.length, 1, "assembly must not be constrained to one move per supplied fact");
assert.ok(
  assembled.omittedSourceEventIds.includes("event-1") &&
    assembled.omittedSourceEventIds.includes("event-2"),
  "assembly may omit ordinary supplied facts",
);
assert.equal(/groomer laughed|won a trophy/i.test(assembled.rawText), false);

const truth = verifyAuthorizedAssemblyCandidate({
  candidate: assembled,
  pool,
  forbiddenTexts: diagnostics.flatMap((diagnostic) =>
    diagnostic.spans
      .filter((span) => span.classification === "UNSUPPORTED_REALITY")
      .map((span) => span.exactText),
  ),
  suppliedReality,
  subject: "Coco",
  realityDirect: true,
});

assert.equal(truth.eligible, true, truth.reasons.join("; "));
assert.equal(truth.scoring?.accepted, true);

const inventedCandidate = {
  ...assembled,
  rawText: `${assembled.rawText} Coco won a trophy.`,
  lines: [{
    ...assembled.lines[0],
    text: `${assembled.rawText} Coco won a trophy.`,
  }],
};
const inventedTruth = verifyAuthorizedAssemblyCandidate({
  candidate: inventedCandidate,
  pool,
  forbiddenTexts: ["Coco won a trophy."],
  suppliedReality,
  subject: "Coco",
  realityDirect: true,
});
assert.equal(inventedTruth.eligible, false, "invented concrete occurrence must fail closed");
assert.ok(
  inventedTruth.reasons.includes("resurrected-unsupported-realization") ||
    inventedTruth.scoring?.lines.some((line) => line.reasons.includes("invented-concrete-reality")),
  "assembly cannot resurrect rejected unsupported material",
);

const evaluation = evaluateAuthorMemoryProductions({
  plan,
  suppliedReality,
  subject: "Coco",
  expressiveProductions: productions,
  assembledProduction: truth.eligible ? { production: "ASSEMBLED", lines: assembled.lines } : undefined,
  treatmentAssignments,
  lensSearchEnabled: true,
  realityDirect: true,
});
const assembledDiagnostic = evaluation.productions.find((production) => production.production === "ASSEMBLED");
assert.equal(assembledDiagnostic?.accepted, true, "verified assembly should become eligible for late selection scoring");

const synthesizedText = "The bows became the day's tiny argument; pickup made the argument temporary.";
const synthesis = await synthesizeAuthorizedRealizations({
  subject: "Coco",
  suppliedReality,
  pool,
  forbiddenTexts: diagnostics.flatMap((diagnostic) =>
    diagnostic.spans
      .filter((span) => span.classification === "UNSUPPORTED_REALITY")
      .map((span) => span.exactText),
  ),
  realityDirect: true,
  generate: async (messages, format, options) => {
    assert.equal(format, "json", "synthesizer must use structured JSON through provider abstraction");
    assert.ok(options.jsonSchema, "synthesizer must request structured output");
    assert.ok(
      messages.some((message) => /Authorized Realization Synthesizer/i.test(message.content)),
      "synthesizer prompt should be narrow and separate from Direct Author",
    );
    const payload = JSON.parse(messages.at(-1).content);
    assert.deepEqual(
      Object.keys(payload).sort(),
      ["authorizedRealizationPool", "forbiddenTexts", "instruction", "subject", "suppliedReality"].sort(),
      "synthesizer input should stay narrow",
    );
    assert.equal(
      payload.authorizedRealizationPool.some((realization) => /groomer laughed|won a trophy/i.test(realization.text)),
      false,
      "UNSUPPORTED_REALITY material must not be supplied as creative material",
    );

    return {
      text: JSON.stringify({
        production: "ASSEMBLED",
        lines: [{
          order: 1,
          text: synthesizedText,
          synthesizedFrom: ["A:1", "B:1"],
          sourceEventIds: ["event-3", "event-4", "event-5"],
        }],
      }),
      model: "mock-synthesizer",
      provider: "local",
    };
  },
  auditReality: async ({ candidate }) => ({
    productions: [{
      production: "A",
      lines: [{
        order: 1,
        text: candidate.rawText,
        sourceEventIds: ["event-3", "event-4", "event-5"],
        auditSpans: [{
          exactText: candidate.rawText,
          classification: "KEEP_EXPRESSION",
          sourceEventIds: ["event-3", "event-4", "event-5"],
        }],
      }],
    }],
    applied: true,
    diagnostics: [{
      production: "A",
      originalText: candidate.rawText,
      spans: [{
        exactText: candidate.rawText,
        classification: "KEEP_EXPRESSION",
        sourceEventIds: ["event-3", "event-4", "event-5"],
      }],
      removedSpans: [],
      reconstructedText: candidate.rawText,
      semanticClassificationValid: true,
      auditProtocolValid: true,
      exactSpanMappingValid: true,
      unsupportedDeletionRequired: false,
      survivorIntegrity: "NOT_REQUIRED",
    }],
    model: "mock-claim-auditor",
    modelCalls: 0,
  }),
});

assert.equal(synthesis.truthResult.eligible, true, synthesis.truthResult.reasons.join("; "));
assert.ok(synthesis.candidate, "valid synthesized output should produce an ASSEMBLED candidate");
assert.equal(synthesis.candidate.rawText, synthesizedText);
assert.equal(
  pool.some((realization) => realization.text === synthesizedText),
  false,
  "cross-production synthesis may create new wording not present verbatim in A/B/C",
);
assert.deepEqual(
  synthesis.candidate.lines[0].synthesizedFrom,
  ["A:1", "B:1"],
  "valid synthesizedFrom IDs should be preserved",
);

const unknownSource = await synthesizeAuthorizedRealizations({
  subject: "Coco",
  suppliedReality,
  pool,
  realityDirect: true,
  generate: async () => ({
    text: JSON.stringify({
      production: "ASSEMBLED",
      lines: [{
        order: 1,
        text: "The bows became the day's tiny argument.",
        synthesizedFrom: ["A:404"],
        sourceEventIds: ["event-3", "event-4"],
      }],
    }),
    model: "mock-synthesizer",
    provider: "local",
  }),
  auditReality: async () => {
    throw new Error("audit should not run for invalid synthesizedFrom IDs");
  },
});
assert.equal(unknownSource.truthResult.eligible, false);
assert.ok(unknownSource.truthResult.reasons.includes("synthesizer-output-synthesizedFrom-invalid"));

const resurrected = await synthesizeAuthorizedRealizations({
  subject: "Coco",
  suppliedReality,
  pool,
  forbiddenTexts: ["Coco won a trophy."],
  realityDirect: true,
  generate: async () => ({
    text: JSON.stringify({
      production: "ASSEMBLED",
      lines: [{
        order: 1,
        text: "The bow argument ended. Coco won a trophy.",
        synthesizedFrom: ["A:1", "B:1"],
        sourceEventIds: ["event-3", "event-4", "event-5"],
      }],
    }),
    model: "mock-synthesizer",
    provider: "local",
  }),
  auditReality: async ({ candidate }) => ({
    productions: [],
    applied: true,
    diagnostics: [{
      production: "A",
      originalText: candidate.rawText,
      spans: [{
        exactText: candidate.rawText,
        classification: "KEEP_EXPRESSION",
        sourceEventIds: ["event-3", "event-4", "event-5"],
      }],
      removedSpans: [],
      reconstructedText: candidate.rawText,
      semanticClassificationValid: true,
      auditProtocolValid: true,
      exactSpanMappingValid: true,
      unsupportedDeletionRequired: false,
      survivorIntegrity: "NOT_REQUIRED",
    }],
    model: "mock-claim-auditor",
    modelCalls: 0,
  }),
});
assert.equal(resurrected.truthResult.eligible, false);
assert.ok(resurrected.truthResult.reasons.includes("resurrected-unsupported-realization"));

const inventedConcrete = await synthesizeAuthorizedRealizations({
  subject: "Coco",
  suppliedReality,
  pool,
  realityDirect: true,
  generate: async () => ({
    text: JSON.stringify({
      production: "ASSEMBLED",
      lines: [{
        order: 1,
        text: "The bow argument ended when Coco shook them onto the floor.",
        synthesizedFrom: ["A:1", "B:1"],
        sourceEventIds: ["event-3", "event-4", "event-5"],
      }],
    }),
    model: "mock-synthesizer",
    provider: "local",
  }),
  auditReality: async ({ candidate }) => ({
    productions: [],
    applied: true,
    diagnostics: [{
      production: "A",
      originalText: candidate.rawText,
      spans: [
        {
          exactText: "The bow argument ended",
          classification: "KEEP_EXPRESSION",
          sourceEventIds: ["event-3", "event-4", "event-5"],
        },
        {
          exactText: "when Coco shook them onto the floor.",
          classification: "UNSUPPORTED_REALITY",
          sourceEventIds: [],
        },
      ],
      removedSpans: ["when Coco shook them onto the floor."],
      reconstructedText: "",
      semanticClassificationValid: true,
      auditProtocolValid: true,
      exactSpanMappingValid: true,
      unsupportedDeletionRequired: true,
      survivorIntegrity: "FRACTURED",
      unusableReason: "reality_auditor_survivor_fractured",
    }],
    model: "mock-claim-auditor",
    modelCalls: 0,
  }),
});
assert.equal(inventedConcrete.truthResult.eligible, false);
assert.ok(
  inventedConcrete.truthResult.reasons.includes("reality_auditor_survivor_fractured") ||
    inventedConcrete.truthResult.reasons.includes("synthesis-reality-editor-rejected"),
  "new concrete occurrence should fail through synthesis truth authority",
);

const synthesisFailure = await synthesizeAuthorizedRealizations({
  subject: "Coco",
  suppliedReality,
  pool,
  realityDirect: true,
  generate: async () => {
    throw new Error("mock_synthesis_failure");
  },
}).catch((error) => ({
  truthResult: {
    eligible: false,
    reasons: [error.message],
  },
}));
assert.equal(synthesisFailure.truthResult.eligible, false);

const synthesizedEvaluation = evaluateAuthorMemoryProductions({
  plan,
  suppliedReality,
  subject: "Coco",
  expressiveProductions: productions,
  assembledProduction: synthesis.truthResult.eligible
    ? { production: "ASSEMBLED", lines: synthesis.candidate.lines }
    : undefined,
  treatmentAssignments,
  lensSearchEnabled: true,
  realityDirect: true,
});
const synthesizedAssembledDiagnostic = synthesizedEvaluation.productions.find(
  (production) => production.production === "ASSEMBLED",
);
assert.equal(
  synthesizedAssembledDiagnostic?.accepted,
  true,
  "re-authorized synthesized ASSEMBLED should enter existing scoring",
);

const highScoringA = evaluateAuthorMemoryProductions({
  plan,
  suppliedReality,
  subject: "Coco",
  expressiveProductions: [{
    production: "A",
    lines: [{
      order: 1,
      text: "Coco made the blue bows the whole appointment.",
      sourceEventIds: ["event-3", "event-4"],
      auditSpans: [{
        exactText: "Coco made the blue bows the whole appointment.",
        classification: "KEEP_EXPRESSION",
        sourceEventIds: ["event-3", "event-4"],
      }],
    }],
  }],
  assembledProduction: { production: "ASSEMBLED", lines: synthesis.candidate.lines },
  treatmentAssignments,
  selectedProduction: "A",
  lensSearchEnabled: true,
  realityDirect: true,
});
assert.notEqual(
  highScoringA.selectedProduction,
  "ASSEMBLED",
  "ASSEMBLED must not automatically win selection",
);

const fallbackEvaluation = evaluateAuthorMemoryProductions({
  plan,
  suppliedReality,
  subject: "Coco",
  expressiveProductions: productions,
  assembledProduction: undefined,
  treatmentAssignments,
  lensSearchEnabled: true,
  realityDirect: true,
});
assert.ok(
  fallbackEvaluation.productions.some((production) => production.production === "D"),
  "A/B/C/D fallback behavior remains available when assembly is absent or rejected",
);

console.log("AUTHOR AUTHORIZED REALIZATION ASSEMBLY GREEN - CROSS-PRODUCTION POOL - UNSUPPORTED EXCLUDED - VERIFIED BEFORE SELECTION");
