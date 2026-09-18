import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

function section(name: string, value: unknown): void {
  console.log(`\n${name}`);
  console.log(JSON.stringify(value, null, 2));
}

function check(
  failures: string[],
  condition: unknown,
  message: string,
): void {
  if (!condition) failures.push(message);
}

const facts = [
  "Mira arrived nervous for the first visit",
  "Mira completed the service",
  "Mira left approved",
  "Mira returned again a week later",
];

const result = await authorBrainCanonical({
  prompt:
    "Write a concise QRE-style living memory. Do not repeat the facts; realize the earned meaning.",
  lens: "dry comedy",
  subject: "Mira",
  place: "North Desk",
  movieMode: true,
  returning: true,
  visitNumber: 2,
  facts,
  sourceMoments: facts,
  memoryContext: ["Mira had been here once before."],
  trajectory: [],
  creativeLearningContext: [
    "prefer compact viewer-facing cuts",
    "avoid explaining the meaning",
  ],
});

const trace = result.diagnostics.trace as Record<string, any> | undefined;
const composedBeats = Array.isArray(trace?.composedBeats)
  ? trace.composedBeats
  : [];
const candidateScores = Array.isArray(trace?.candidateScores)
  ? trace.candidateScores
  : [];
const failures: string[] = [];

check(failures, result.diagnostics.modelCalls === 1, "Expected exactly one Mouth model call.");
check(failures, trace, "Expected canonical diagnostics trace.");
check(failures, Array.isArray(trace?.composedBeats), "Trace missing composed beats.");
check(
  failures,
  composedBeats.every((beat: any) => beat.realizationAuthority),
  "One or more beats missing structured MouthRealizationAuthority.",
);
check(
  failures,
  composedBeats.every((beat: any) => beat.viewerState),
  "One or more beats missing viewer-state progression.",
);
check(
  failures,
  Array.isArray(trace?.rawSequenceVariants) &&
    trace.rawSequenceVariants.length === 3,
  "Expected three raw whole-sequence model variants.",
);
check(failures, result.diagnostics.truthSafe === true, "Final sequence was not truth-safe.");
check(failures, result.diagnostics.authored === true, "Final sequence was truth-safe but not authored.");
check(
  failures,
  result.diagnostics.qualityStatus === "ACCEPTED",
  `Expected accepted quality verdict, got ${result.diagnostics.qualityStatus}`,
);

section("INPUT", trace?.input);
section("REALITY READOUT", trace?.realityReadout);
section("WHAT QRE NOTICED", {
  unresolvedTensions: trace?.realityReadout?.unresolvedTensions,
  recurringSignals: trace?.realityReadout?.recurringSignals,
  sensorySignals: trace?.realityReadout?.sensorySignals,
  relations: trace?.realityReadout?.relations,
});
section("SEMANTIC CANDIDATES", trace?.semanticCandidates);
section(
  "REJECTED SEMANTIC CANDIDATES + WHY",
  trace?.rejectedSemanticCandidates,
);
section("SELECTED THESIS / MEANING", trace?.selectedThesis);
section("SELECTED LENS", trace?.selectedLens);
section(
  "COMPOSED BEATS",
  composedBeats.map((beat: any) => ({
    order: beat.order,
    role: beat.role,
    eventIds: beat.eventIds,
    change: beat.change,
    semanticRealization: beat.semanticRealization,
  })),
);
section(
  "VIEWER-STATE PROGRESSION",
  composedBeats.map((beat: any) => ({
    order: beat.order,
    viewerState: beat.viewerState,
  })),
);
section(
  "MOUTH REALIZATION AUTHORITY",
  composedBeats.map((beat: any) => ({
    order: beat.order,
    realizationAuthority: beat.realizationAuthority,
  })),
);
section("RAW MODEL SEQUENCE VARIANTS", trace?.rawSequenceVariants);
section("SCORED CANDIDATES", candidateScores);
section(
  "CANDIDATE AUTHORIZATION",
  candidateScores.map((candidate: any) => ({
    beatOrder: candidate.beatOrder,
    selected: candidate.selected,
    text: candidate.text,
    authorization: candidate.authorization,
  })),
);
section(
  "REJECTED MOUTH CANDIDATES + EXACT REASONS",
  result.diagnostics.rejectedCandidates,
);
section("BEAM WINNER / PATH", trace?.beamWinner);
section("FINAL SCENES", result.scenes);
section("PROVENANCE", trace?.provenance);
section("QUALITY SIGNALS", result.diagnostics.qualitySignals);
section("SOURCE REPLAY SCORE", result.diagnostics.sourceReplay);
section("TRUTH SAFE", result.diagnostics.truthSafe);
section("AUTHORED", result.diagnostics.authored);
section("FINAL QUALITY VERDICT", {
  qualityStatus: result.diagnostics.qualityStatus,
  truthSafe: result.diagnostics.truthSafe,
  authored: result.diagnostics.authored,
  renderable: result.diagnostics.renderable,
  complete: result.diagnostics.complete,
});

if (failures.length) {
  console.error("\nAUTHOR CANONICAL HUMAN-EYE ACCEPTANCE: FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nAUTHOR CANONICAL HUMAN-EYE ACCEPTANCE: PASS");
}
