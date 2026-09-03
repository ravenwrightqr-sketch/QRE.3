import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(`AUTHOR BRAIN END-TO-END ACCEPTANCE FAILED: ${message}`);
  }
}

function finiteNumber(
  value: unknown,
  name: string,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `AUTHOR BRAIN END-TO-END ACCEPTANCE FAILED: ${name} is not a finite number.`,
    );
  }

  return value;
}

const sourceFacts = [
  "Coco was groomed at Elm Street Grooming.",
  "Coco got a bath.",
  "Coco stole the red bow.",
];

const result = await authorBrainCanonical({
  prompt:
    "Coco was groomed at Elm Street Grooming, then stole the red bow. Make the experience sharp and memorable.",
  lens: "comedy",
  subject: "Coco",
  place: "Elm Street Grooming",
  movieMode: true,
  returning: false,
  visitNumber: 1,
  facts: sourceFacts,
  sourceMoments: sourceFacts,
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [
    "preference:short",
    "accepted:sharp semantic turn",
    "behavior-preference:callback",
  ],
});

const diagnostics = result.diagnostics;

assert(
  diagnostics.complete === true,
  "canonical Author did not produce a complete result",
);

assert(
  diagnostics.qualityStatus === "ACCEPTED",
  `canonical Author quality status was ${diagnostics.qualityStatus}`,
);

assert(
  diagnostics.renderable === true,
  "canonical Author result was not renderable",
);

assert(
  result.sequence,
  "canonical Author did not produce a sequence",
);

assert(
  result.scenes.length > 0,
  "canonical Author did not produce scenes",
);

assert(
  result.scenes.length === result.sequence.cuts.length,
  `scene count ${result.scenes.length} does not match sequence cut count ${result.sequence.cuts.length}`,
);

assert(
  diagnostics.acceptedCandidates >= 1,
  `expected at least one accepted candidate, got ${diagnostics.acceptedCandidates}`,
);

assert(
  diagnostics.candidateSequences >= 1,
  `expected at least one candidate sequence, got ${diagnostics.candidateSequences}`,
);

finiteNumber(diagnostics.modelCalls, "modelCalls");
finiteNumber(diagnostics.selectedScore, "selectedScore");

const finalText = result.scenes
  .map((scene) => scene.text)
  .join(" ")
  .trim();

assert(
  finalText.length > 0,
  "final authored output is empty",
);

assert(
  /\bCoco\b/i.test(finalText),
  "subject identity disappeared from final authored output",
);

assert(
  /\bred bow\b/i.test(finalText),
  "source object 'red bow' disappeared from final authored output",
);

const forbiddenConcrete = [
  /\btable\b/i,
  /\bdoor\b/i,
  /\broom\b/i,
  /\bwindow\b/i,
  /\bsunset\b/i,
  /\bsunlight\b/i,
  /\bshadow\b/i,
  /\btears?\b/i,
];

for (const pattern of forbiddenConcrete) {
  assert(
    !pattern.test(finalText),
    `unsupported concrete detail reached final output: ${pattern}`,
  );
}

const sourceGrounded =
  /Coco/i.test(finalText) &&
  /red bow/i.test(finalText);

assert(
  sourceGrounded,
  "final authored output lost required supplied reality",
);

console.log("AUTHOR BRAIN END-TO-END ACCEPTANCE: PASS");
console.log(`Model=${diagnostics.model}`);
console.log(`ModelCalls=${diagnostics.modelCalls}`);
console.log(`CandidateSequences=${diagnostics.candidateSequences}`);
console.log(`AcceptedCandidates=${diagnostics.acceptedCandidates}`);
console.log(`RecoveryUsed=${diagnostics.recoveryUsed}`);
console.log(`QualityStatus=${diagnostics.qualityStatus}`);
console.log(`Renderable=${diagnostics.renderable}`);
console.log(`Complete=${diagnostics.complete}`);
console.log(`SelectedScore=${diagnostics.selectedScore}`);
console.log(`Scenes=${result.scenes.length}`);
console.log(`Cuts=${result.sequence.cuts.length}`);
console.log(`FinalText=${JSON.stringify(finalText)}`);