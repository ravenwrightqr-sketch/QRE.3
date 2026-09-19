import type {
  AuthorDomainContext,
  AuthorPlayoutMode,
} from "@qre/contracts";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type UniversalCase = {
  id: string;
  label: string;
  subject: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  lens?: string;
  playoutMode?: AuthorPlayoutMode;
  returning?: boolean;
  visitNumber?: number;
  domainContext?: AuthorDomainContext;
  forbiddenOutputTerms?: string[];
};

type RecordValue = Record<string, unknown>;

const PROMPT =
  "Create a QRE experience from this supplied reality.";

const CASES: UniversalCase[] = [
  {
    id: "milo-profile",
    label: "DAY-ONE PET PROFILE",
    subject: "Milo",
    facts: ["Milo loves walks, bacon, small dogs"],
    sourceMoments: ["Milo loves walks, bacon, small dogs"],
  },
  {
    id: "milo-walk-event",
    label: "CURRENT PET EVENT",
    subject: "Milo",
    facts: [],
    sourceMoments: [
      "5 PM Milo walked to the park",
      "Milo saw squirrels",
      "Milo saw five dogs",
      "Milo came home after 56 minutes",
    ],
  },
  {
    id: "living-memory",
    label: "DAY-ONE LIVING MEMORY",
    subject: "Our relationship",
    facts: [],
    sourceMoments: [
      "We met at The Underground, hit it off right away, didn't expect it",
    ],
    forbiddenOutputTerms: [
      "bartender",
      "staff",
      "crowd",
      "dj",
      "security",
      "promoter",
      "waiter",
      "waitress",
    ],
  },
  {
    id: "service",
    label: "MUNDANE SERVICE",
    subject: "Maria",
    facts: [],
    sourceMoments: [
      "9:04 AM Maria started the housekeeping service",
      "Maria cleaned the kitchen",
      "Maria cleaned bathroom one",
      "Maria cleaned bathroom two",
      "11:47 AM Maria finished the housekeeping service",
    ],
    domainContext: {
      category: "business",
      businessType: "housekeeping",
      businessName: "Example Housekeeping",
      serviceType: "housekeeping",
      serviceName: "home cleaning",
      knownCapabilities: [
        "clean kitchens",
        "clean bathrooms",
        "clean living areas",
      ],
      contextualSignals: [
        "service completion can be sent as a moving receipt or QRE experience",
      ],
    },
  },
  {
    id: "service-receipt",
    label: "HOUSEKEEPING OPERATIONAL RECEIPT",
    subject: "Maria",
    facts: [],
    sourceMoments: [
      "9:04 AM Maria started the housekeeping service",
      "Maria cleaned the kitchen",
      "Maria cleaned bathroom one",
      "Maria cleaned bathroom two",
      "11:47 AM Maria finished the housekeeping service",
    ],
    playoutMode: "operational",
    domainContext: {
      category: "business",
      businessType: "housekeeping",
      serviceType: "housekeeping",
      serviceName: "cleaning service",
      subjectKind: "service job",
    },
  },
  {
    id: "service-noir",
    label: "HOUSEKEEPING EXPERIENCE FROM SAME REALITY",
    subject: "Maria",
    facts: [],
    sourceMoments: [
      "9:04 AM Maria started the housekeeping service",
      "Maria cleaned the kitchen",
      "Maria cleaned bathroom one",
      "Maria cleaned bathroom two",
      "11:47 AM Maria finished the housekeeping service",
    ],
    playoutMode: "experience",
    lens: "noir",
    domainContext: {
      category: "business",
      businessType: "housekeeping",
      serviceType: "housekeeping",
      serviceName: "cleaning service",
      subjectKind: "service job",
    },
  },
  {
    id: "service-battle",
    label: "HOUSEKEEPING EXPERIENCE · BATTLE TREATMENT",
    subject: "Maria",
    facts: [],
    sourceMoments: [
      "9:04 AM Maria started the housekeeping service",
      "Maria cleaned the kitchen",
      "Maria cleaned bathroom one",
      "Maria cleaned bathroom two",
      "11:47 AM Maria finished the housekeeping service",
    ],
    playoutMode: "experience",
    lens: "battle",
    domainContext: {
      category: "business",
      businessType: "housekeeping",
      serviceType: "housekeeping",
      serviceName: "cleaning service",
      subjectKind: "service job",
    },
  },
  {
    id: "service-cyberpunk",
    label: "HOUSEKEEPING EXPERIENCE · CYBERPUNK TREATMENT",
    subject: "Maria",
    facts: [],
    sourceMoments: [
      "9:04 AM Maria started the housekeeping service",
      "Maria cleaned the kitchen",
      "Maria cleaned bathroom one",
      "Maria cleaned bathroom two",
      "11:47 AM Maria finished the housekeeping service",
    ],
    playoutMode: "experience",
    lens: "cyberpunk",
    domainContext: {
      category: "business",
      businessType: "housekeeping",
      serviceType: "housekeeping",
      serviceName: "cleaning service",
      subjectKind: "service job",
    },
  },
  {
    id: "housekeeping-battle",
    label: "BORING SERVICE / BATTLE PLAYOUT",
    subject: "Maria",
    facts: [],
    sourceMoments: [
      "Maria arrived",
      "Maria cleaned the kitchen",
      "Maria cleaned two bathrooms",
      "Maria cleaned the living room",
      "Maria finished the service",
    ],
    lens: "battle",
  },
  {
    id: "housekeeping-noir",
    label: "BORING SERVICE / NOIR PLAYOUT",
    subject: "Maria",
    facts: [],
    sourceMoments: [
      "Maria arrived",
      "Maria cleaned the kitchen",
      "Maria cleaned two bathrooms",
      "Maria cleaned the living room",
      "Maria finished the service",
    ],
    lens: "noir",
  },
  {
    id: "housekeeping-cyberpunk",
    label: "BORING SERVICE / CYBERPUNK PLAYOUT",
    subject: "Maria",
    facts: [],
    sourceMoments: [
      "Maria arrived",
      "Maria cleaned the kitchen",
      "Maria cleaned two bathrooms",
      "Maria cleaned the living room",
      "Maria finished the service",
    ],
    lens: "cyberpunk",
  },
  {
    id: "rave-closed-world",
    label: "RAVE / CLOSED-WORLD EXPERIENCE",
    subject: "Raven",
    facts: [],
    sourceMoments: [
      "Raven checked in at Warehouse 9",
      "Raven left at 2 AM",
    ],
    lens: "cyberpunk",
  },
  {
    id: "coco",
    label: "METAMORPHIC PET EVENT",
    subject: "Coco",
    facts: [],
    sourceMoments: [
      "Coco was groomed",
      "Coco was clean",
      "Coco had a red bow",
      "Coco stole the red bow",
    ],
  },
  {
    id: "groomer-context",
    label: "PET MEMORY · CONTEXT IS NOT A CHARACTER",
    subject: "Coco",
    facts: [],
    sourceMoments: [
      "Coco went to the groomer",
      "Coco came home clean",
      "Coco had a red bow",
    ],
    forbiddenOutputTerms: [
      "the groomer smiled",
      "the groomer laughed",
      "the groomer watched",
      "the groomer said",
      "the groomer handed",
      "stylist",
    ],
  },
  {
    id: "rave-minimal",
    label: "RAVE MEMORY · NO UNSUPPLIED PEOPLE",
    subject: "Raven",
    facts: [],
    sourceMoments: [
      "Raven arrived at Neon District",
      "Raven left at 2 AM",
    ],
    forbiddenOutputTerms: [
      "crowd",
      "bartender",
      "promoter",
      "dj",
      "security",
      "staff",
    ],
  },
  {
    id: "unknown-object",
    label: "OPEN-WORLD UNKNOWN OBJECT",
    subject: "Aster",
    facts: [],
    sourceMoments: [
      "Aster found the zenthra coil",
      "The zenthra coil was broken",
      "Aster fixed the zenthra coil",
    ],
  },
  {
    id: "property",
    label: "PERSISTENT PROPERTY",
    subject: "101 Elm",
    facts: [
      "101 Elm was built in 1928",
      "Raven's grandmother lived at 101 Elm",
    ],
    sourceMoments: [
      "101 Elm was renovated in 2014",
    ],
    forbiddenOutputTerms: [
      "homeowner",
      "home owner",
      "tenant",
      "renter",
      "landlord",
      "host",
      "guest",
      "client",
      "owner",
      "occupant",
    ],
  },
  {
    id: "single-fact",
    label: "ONE SUPPLIED TRUTH",
    subject: "Maria",
    facts: ["Maria collects matchbooks"],
    sourceMoments: ["Maria collects matchbooks"],
  },
  {
    id: "two-facts",
    label: "TWO-DETAIL JUXTAPOSITION",
    subject: "Bottle cap #1847",
    facts: [],
    sourceMoments: [
      "Bottle cap #1847 came from a concert",
      "Bottle cap #1847 was kept for eleven years",
    ],
  },
  {
    id: "milo-return",
    label: "PERSISTENT RETURN",
    subject: "Milo",
    facts: [],
    sourceMoments: [
      "5 PM, Milo went to the park, saw squirrels and five dogs, two people called him cute, home after 56 minutes",
    ],
    memoryContext: [
      "Milo is a dog",
      "Milo loves walks",
      "Milo loves bacon",
      "Milo likes small dogs",
    ],
    returning: true,
    visitNumber: 2,
  },
];

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function record(value: unknown): RecordValue {
  return isRecord(value) ? value : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

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

function semanticEvidenceCount(trace: RecordValue): number {
  const thesis = record(trace.selectedThesis);
  const semantic = record(thesis.semanticRealization);
  return list(semantic.evidenceEventIds).length;
}

async function runCase(testCase: UniversalCase): Promise<{
  id: string;
  label: string;
  failures: string[];
  scenes: string[];
  truthSafe: boolean;
  authored: boolean;
  qualityStatus: string;
}> {
  console.log("\n" + "=".repeat(96));
  console.log(`QRE UNIVERSAL HUMAN-EYE · ${testCase.label} · ${testCase.id}`);
  console.log("=".repeat(96));

  const result = await authorBrainCanonical({
    prompt: PROMPT,
    lens: testCase.lens ?? "let qre decide",
    subject: testCase.subject,
    movieMode: testCase.playoutMode === "operational" ? false : true,
    returning: testCase.returning,
    visitNumber: testCase.visitNumber,
    facts: testCase.facts,
    sourceMoments: testCase.sourceMoments,
    domainContext: testCase.domainContext,
    playoutMode: testCase.playoutMode ?? "experience",
    memoryContext: testCase.memoryContext ?? [],
    trajectory: [],
    creativeLearningContext: [],
  });

  const trace = record(result.diagnostics.trace);
  const reality = record(trace.realityReadout);
  const selectedThesis = record(trace.selectedThesis);
  const semanticRealization = record(selectedThesis.semanticRealization);
  const lensBrief = record(trace.creativeLensBrief);
  const rawVariants = list(trace.rawSequenceVariants);
  const scoredCandidates = list(trace.candidateScores);
  const composedBeats = list(trace.composedBeats);
  const failures: string[] = [];

  const operational =
    (testCase.playoutMode ?? "experience") === "operational";

  check(
    failures,
    operational
      ? result.diagnostics.modelCalls === 0
      : result.diagnostics.modelCalls >= 1 &&
        result.diagnostics.modelCalls <= 2,
    operational
      ? `Operational receipt should use zero model calls; got ${result.diagnostics.modelCalls}.`
      : `Expected one Mouth generation plus at most one clean creative reset; got ${result.diagnostics.modelCalls} calls.`,
  );
  check(failures, Object.keys(trace).length > 0, "Missing canonical diagnostics trace.");
  check(
    failures,
    list(reality.events).length > 0,
    "RealityGraph produced no usable reality.",
  );
  if (!operational) {
    check(
      failures,
      Object.keys(selectedThesis).length > 0,
      "No selected story thesis / meaning.",
    );
    check(
      failures,
      Object.keys(semanticRealization).length > 0,
      "Selected thesis has no semantic realization.",
    );
    check(
      failures,
      semanticEvidenceCount(trace) > 0,
      "Semantic realization has no grounded evidence IDs.",
    );
    check(
      failures,
      Object.keys(lensBrief).length > 0,
      "No downstream Creative Lens Brief.",
    );
    check(
      failures,
      composedBeats.length > 0,
      "No composed semantic beats.",
    );
    const mouthGeneration = record(trace.mouthGeneration);
    const rawMouthOutput = String(mouthGeneration.rawOutput ?? "").trim();
    check(
      failures,
      rawMouthOutput.length > 0,
      "Mouth model returned no text.",
    );
    check(
      failures,
      rawVariants.length > 0,
      rawMouthOutput
        ? "Mouth returned text, but the canonical parser accepted no whole-sequence variants."
        : "Mouth returned no whole-sequence variants.",
    );
    check(
      failures,
      scoredCandidates.length > 0,
      "No Mouth candidates were scored.",
    );
  }
  check(
    failures,
    result.scenes.length > 0,
    "No final scenes were produced.",
  );
  check(
    failures,
    result.diagnostics.truthSafe === true,
    "Final experience violated concrete reality.",
  );
  check(
    failures,
    operational
      ? result.diagnostics.authored === false
      : result.diagnostics.authored === true,
    operational
      ? "Operational receipt must remain factual rather than claim creative authorship."
      : "Final experience is truth-safe but materially source replay / not authored.",
  );
  check(
    failures,
    result.diagnostics.qualityStatus === "ACCEPTED",
    `Quality verdict was ${result.diagnostics.qualityStatus}, not ACCEPTED.`,
  );

  if (
    testCase.id === "service" ||
    testCase.id.startsWith("service-")
  ) {
    const visible = result.scenes
      .map((scene) => scene.text)
      .join(" ");
    check(
      failures,
      !/\b(?:homeowner|home owner|tenant|renter|landlord|occupant|resident|airbnb host|host|guest|client|customer|owner)\b/i.test(visible),
      `Service playout invented an unsupplied relationship role: ${visible}`,
    );
  }

  if (testCase.forbiddenOutputTerms?.length) {
    const visible = result.scenes
      .map((scene) => scene.text.toLowerCase())
      .join(" | ");
    const invented = testCase.forbiddenOutputTerms.filter((term) =>
      visible.includes(term.toLowerCase()),
    );

    check(
      failures,
      invented.length === 0,
      `Context was promoted into unsupplied concrete reality: ${invented.join(", ")} :: ${visible}`,
    );
  }

  section("INPUT", trace.input);
  section("REALITY READOUT", reality);
  section("WHAT QRE NOTICED", {
    actionMechanics: trace.actionMechanics,
    selectedActionMechanics:
      trace.selectedActionMechanics,
    inferenceHypotheses:
      trace.inferenceHypotheses,
    selectedInference:
      trace.selectedInference,
    unresolvedTensions: reality.unresolvedTensions,
    recurringSignals: reality.recurringSignals,
    sensorySignals: reality.sensorySignals,
    relations: reality.relations,
    eventStructure: reality.eventStructure,
  });
  section("INFERENCE HYPOTHESES", trace.inferenceHypotheses);
  section("SELECTED INFERENCE / HIDDEN READ", trace.selectedInference);
  section("SEMANTIC / MOVIE CANDIDATES", trace.semanticCandidates);
  section(
    "REJECTED SEMANTIC CANDIDATES + WHY",
    trace.rejectedSemanticCandidates,
  );
  section("SELECTED THESIS / METAMORPHIC RELATION", selectedThesis);
  section("SELECTED LENS", trace.selectedLens);
  section("LENS TREATMENT BRIEF", lensBrief);
  section("COMPOSED BEATS", composedBeats);
  section("MOUTH GENERATION DIAGNOSTICS", trace.mouthGeneration);
  section("RAW GEMMA SEQUENCE VARIANTS", rawVariants);
  section("SCORED MOUTH CANDIDATES", scoredCandidates);
  section(
    "REJECTED MOUTH CANDIDATES + EXACT REASONS",
    result.diagnostics.rejectedCandidates,
  );
  section("BEAM WINNER / PATH", trace.beamWinner);
  section("FINAL SCENES", result.scenes);
  section("PROVENANCE", trace.provenance);
  section("QUALITY SIGNALS", result.diagnostics.qualitySignals);
  section(
    "AUTHORSHIP QUALITY / VIEWER INFERENCE",
    result.diagnostics.authorshipQuality,
  );
  section("SOURCE REPLAY", result.diagnostics.sourceReplay);
  section("AUTHORSHIP / INFERENCE QUALITY", result.diagnostics.authorshipQuality);
  section("FINAL VERDICT", {
    truthSafe: result.diagnostics.truthSafe,
    authored: result.diagnostics.authored,
    qualityStatus: result.diagnostics.qualityStatus,
    renderable: result.diagnostics.renderable,
    complete: result.diagnostics.complete,
    failures,
  });

  return {
    id: testCase.id,
    label: testCase.label,
    failures,
    scenes: result.scenes.map((scene) => scene.text),
    truthSafe: result.diagnostics.truthSafe === true,
    authored: result.diagnostics.authored === true,
    qualityStatus: result.diagnostics.qualityStatus,
  };
}

const requested = String(process.argv[2] ?? "milo-profile")
  .trim()
  .toLowerCase();

const selectedCases =
  requested === "all"
    ? CASES
    : CASES.filter((item) => item.id.toLowerCase() === requested);

if (!selectedCases.length) {
  throw new Error(
    `Unknown case "${requested}". Available: ${CASES.map((item) => item.id).join(", ")}, all`,
  );
}

const results = [];
for (const testCase of selectedCases) {
  results.push(await runCase(testCase));
}

section(
  "UNIVERSAL HUMAN-EYE SUMMARY",
  results.map((result) => ({
    id: result.id,
    label: result.label,
    truthSafe: result.truthSafe,
    authored: result.authored,
    qualityStatus: result.qualityStatus,
    failures: result.failures,
    scenes: result.scenes,
  })),
);

const failed = results.filter((result) => result.failures.length > 0);

if (failed.length) {
  console.error("\nQRE UNIVERSAL HUMAN-EYE ACCEPTANCE: FAIL");
  for (const result of failed) {
    console.error(`- ${result.id}: ${result.failures.join(" | ")}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nQRE UNIVERSAL HUMAN-EYE ACCEPTANCE: PASS");
}
