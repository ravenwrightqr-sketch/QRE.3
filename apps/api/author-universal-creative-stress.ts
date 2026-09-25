/*
 * QRE UNIVERSAL CREATIVE STRESS SUITE
 *
 * This harness exercises the current canonical Author path only:
 * supplied reality -> semantic understanding -> creative notice -> treatment
 * validation -> Mouth whole productions -> grounding -> final experience.
 *
 * It is intentionally a human-eye suite. It reports signals and patterns
 * without turning creative judgment into a single numeric score.
 */
import type { AuthorBrainTruth, AuthorDomainContext } from "@qre/contracts";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type StressCase = {
  name: string;
  prompt: string;
  subject: string;
  facts: string[];
  domainContext: AuthorDomainContext;
};

type CaseSummary = {
  name: string;
  completed: boolean;
  error?: string;
  generatedExpressiveCount: number;
  groundedExpressiveCount: number;
  creativeSetComplete: boolean;
  renderable: boolean;
  bareFallbackNeeded: boolean;
  selectedProduction: string;
  selectedKind: "EXPRESSIVE" | "BARE" | "NONE";
  fallbackReason: string;
  rejectedReasons: string[];
  concepts: string[];
  pressures: string[];
  relations: string[];
  deltas: string[];
  behaviors: string[];
  families: string[];
};

const CASES: StressCase[] = [
  {
    name: "HOUSEKEEPING",
    prompt: "Create the customer-facing memory from this completed housekeeping service.",
    subject: "housekeeping service",
    facts: [
      "Arrived at 9:04 AM",
      "Cleaned the kitchen",
      "Cleaned two bathrooms",
      "Finished at 11:47 AM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "HOUSEKEEPING",
    },
  },
  {
    name: "COCO / GROOMER",
    prompt: "Create the customer-facing memory from this grooming visit.",
    subject: "Coco",
    facts: [
      "Dropped off at 9:00 AM",
      "Bath",
      "Blue bows",
      "Tried to remove the bows",
      "Happy at pickup",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "GROOMING",
      subjectKind: "PET",
    },
  },
  {
    name: "DOG WALKER",
    prompt: "Create the customer-facing memory from this dog walk.",
    subject: "Milo",
    facts: [
      "Walk started at 5:00 PM",
      "Walk lasted 56 minutes",
      "Went to the park",
      "Saw squirrels",
      "Saw five dogs",
      "Two people said Milo was cute",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "DOG WALKING",
      subjectKind: "PET",
    },
  },
  {
    name: "MOVER",
    prompt: "Create the customer-facing memory from this moving service.",
    subject: "moving service",
    facts: [
      "Arrived at 8:20 AM",
      "Loaded sofa",
      "Loaded 14 boxes",
      "Desk would not fit through doorway",
      "Desk legs removed",
      "Finished at 11:06 AM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "MOVING",
    },
  },
  {
    name: "MOBILE CAR DETAILER",
    prompt: "Create the customer-facing memory from this mobile car detail.",
    subject: "mobile car detail",
    facts: [
      "Arrived at 1:15 PM",
      "Vacuumed interior",
      "Cleaned seats",
      "Washed exterior",
      "Finished at 3:02 PM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "MOBILE CAR DETAILING",
    },
  },
  {
    name: "PET SITTER",
    prompt: "Create the customer-facing memory from this pet sitting visit.",
    subject: "pet sitting visit",
    facts: [
      "Morning visit at 7:40 AM",
      "Fed dog",
      "Refilled water",
      "Dog stayed by the door",
      "Evening visit at 6:10 PM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "PET SITTING",
      subjectKind: "PET",
    },
  },
  {
    name: "HANDYMAN",
    prompt: "Create the customer-facing memory from this handyman service.",
    subject: "handyman service",
    facts: [
      "Arrived at 10:30 AM",
      "Replaced bathroom faucet",
      "Tightened kitchen cabinet hinge",
      "Tested faucet",
      "Finished at 12:05 PM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "HANDYMAN",
    },
  },
  {
    name: "LAWN SERVICE",
    prompt: "Create the customer-facing memory from this lawn service.",
    subject: "lawn service",
    facts: [
      "Arrived at 8:12 AM",
      "Front lawn cut",
      "Back lawn cut",
      "Edges trimmed",
      "Finished at 9:01 AM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "LAWN SERVICE",
    },
  },
  {
    name: "HOUSE CLEANOUT / HAULER",
    prompt: "Create the customer-facing memory from this cleanout and hauling service.",
    subject: "cleanout service",
    facts: [
      "Arrived at 11:20 AM",
      "Removed mattress",
      "Removed six bags",
      "Removed broken chair",
      "Finished at 12:48 PM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "HAULING",
    },
  },
  {
    name: "SECOND GROOMER / DIFFERENT SUBJECT",
    prompt: "Create the customer-facing memory from this grooming visit.",
    subject: "Pepper",
    facts: [
      "Pepper arrived at 10:15 AM",
      "Nail trim",
      "Bath",
      "Red bandana",
      "Pepper tried to pull the bandana off",
      "Pickup at 11:30 AM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "GROOMING",
      subjectKind: "PET",
    },
  },
];

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

function inputFor(testCase: StressCase): AuthorBrainTruth {
  return {
    prompt: testCase.prompt,
    subject: testCase.subject,
    facts: testCase.facts,
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
    returning: false,
    visitNumber: 1,
    movieMode: true,
    domainContext: testCase.domainContext,
  };
}

function productionForTreatment(value: unknown): "A" | "B" | "C" | "D" {
  const item = record(value);
  if (clean(item.semanticMechanic).toUpperCase() === "NONE") return "D";
  const match = clean(item.id).match(/(\d+)/);
  const index = match ? Number(match[1]) : 1;
  if (index === 2) return "B";
  if (index === 3) return "C";
  return "A";
}

function treatmentSource(
  label: "A" | "B" | "C",
  treatments: unknown[],
  rejectedTreatments: unknown[],
): { source: Record<string, unknown>; valid: boolean; reason: string } {
  const valid = treatments.find((item) => productionForTreatment(item) === label);
  if (valid) return { source: record(valid), valid: true, reason: "" };

  const rejected = rejectedTreatments.find((item) =>
    productionForTreatment(record(item).treatment) === label,
  );
  return {
    source: record(record(rejected).treatment),
    valid: false,
    reason: clean(record(rejected).reason) || "not generated",
  };
}

function linesForProduction(production: unknown): string[] {
  return array(record(production).lines)
    .map((line) => clean(record(line).text))
    .filter(Boolean);
}

function printProduction(label: "A" | "B" | "C" | "D", productions: unknown[]): void {
  const production = productions.find((item) =>
    clean(record(item).production).toUpperCase() === label,
  );
  const item = record(production);
  const reasons = array(item.reasons).map(clean).filter(Boolean);
  console.log(`\n${label === "D" ? "BARE D" : `MOUTH PRODUCTION ${label}`}`);
  console.log(`accepted=${String(item.accepted ?? false)} score=${String(item.score ?? "")}`);
  if (reasons.length) console.log(`reasons: ${JSON.stringify(reasons)}`);
  const lines = linesForProduction(production);
  if (!lines.length) {
    console.log("(not available)");
    return;
  }
  for (const [index, line] of lines.entries()) {
    console.log(`[${index + 1}] ${line}`);
  }
}

function meaningfulTokens(value: string): string[] {
  const stop = new Set([
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "at", "as", "is",
    "are", "was", "were", "be", "being", "been", "with", "from", "this",
    "that", "these", "those", "into", "through", "for", "by", "it", "its",
    "same", "supplied", "reality", "sequence", "service", "work", "facts",
    "event", "events", "becomes", "become", "can", "without", "within",
  ]);
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stop.has(token));
}

function conceptKey(value: string): string {
  return meaningfulTokens(value).slice(0, 8).join(" ");
}

function conceptualFamilies(value: string): string[] {
  const text = value.toLowerCase();
  const families: Array<[string, RegExp]> = [
    ["time-as-material", /\b(time|temporal|clock|minute|hour|timestamp|duration|arrival|finish)\b/],
    ["record-or-ledger", /\b(log|record|ledger|receipt|inventory|catalog|data|entry|entries)\b/],
    ["evidence-or-reconstruction", /\b(evidence|forensic|reconstruction|investigation|clue|case|proof)\b/],
    ["bounded-progression", /\b(beginning|middle|end|progression|bounded|corridor|start|finish|completed)\b/],
    ["obstacle-resolution", /\b(obstacle|problem|fit|removed|tested|resolved|turn|blocked)\b/],
    ["status-transformation", /\b(status|transforms|elevates|importance|significance|ceremony|formal)\b/],
    ["attention-validation", /\b(cute|praised|noticed|attention|approval|said|happy)\b/],
    ["absence-or-omission", /\b(absence|omission|missing|unseen|hidden|not cleaned|scope)\b/],
    ["repetition-or-callback", /\b(repetition|repeat|callback|return|refrain|again|echo)\b/],
    ["compression-or-minimalism", /\b(compressed|terse|minimal|withheld|spare|brief)\b/],
  ];
  return families
    .filter(([, pattern]) => pattern.test(text))
    .map(([family]) => family);
}

function collectSummary(
  name: string,
  result: Awaited<ReturnType<typeof authorBrainCanonical>>,
): CaseSummary {
  const diagnostics = record(result.diagnostics);
  const assessment = record(diagnostics.treatmentSetAssessment);
  const treatments = array(diagnostics.creativeTreatments);
  const rejectedTreatments = array(diagnostics.rejectedTreatments);
  const allTreatments = [
    ...treatments.filter((item) => productionForTreatment(item) !== "D"),
    ...rejectedTreatments.map((item) => record(item).treatment),
  ];
  const concepts = allTreatments
    .map((item) => clean(record(item).treatment))
    .filter(Boolean);
  const pressures = allTreatments
    .map((item) => clean(record(item).lensPressure))
    .filter(Boolean);
  const relations = allTreatments
    .map((item) => clean(record(item).relationUnderPressure))
    .filter(Boolean);
  const deltas = allTreatments
    .map((item) => clean(record(item).perceptionDelta))
    .filter(Boolean);
  const behaviors = allTreatments
    .flatMap((item) => array(record(item).expressiveBehaviors).map(clean))
    .filter(Boolean);
  const selectedProduction = clean(diagnostics.selectedProduction);
  const fallbackReason = [
    clean(diagnostics.creativeSearchFallbackReason),
    clean(record(diagnostics.mouthFallback).reason),
  ].filter(Boolean).join(" | ");

  return {
    name,
    completed: true,
    generatedExpressiveCount: Number(assessment.generatedExpressiveCount ?? 0),
    groundedExpressiveCount: Number(assessment.groundedExpressiveCount ?? 0),
    creativeSetComplete: assessment.creativeSetComplete === true,
    renderable: assessment.renderable === true || diagnostics.renderable === true,
    bareFallbackNeeded: assessment.bareFallbackRequired === true,
    selectedProduction,
    selectedKind: ["A", "B", "C"].includes(selectedProduction)
      ? "EXPRESSIVE"
      : selectedProduction === "D"
        ? "BARE"
        : "NONE",
    fallbackReason,
    rejectedReasons: rejectedTreatments
      .map((item) => clean(record(item).reason))
      .filter(Boolean),
    concepts,
    pressures,
    relations,
    deltas,
    behaviors,
    families: [...new Set([
      ...concepts.flatMap(conceptualFamilies),
      ...pressures.flatMap(conceptualFamilies),
      ...relations.flatMap(conceptualFamilies),
      ...deltas.flatMap(conceptualFamilies),
      ...behaviors.flatMap(conceptualFamilies),
    ])],
  };
}

function printCaseResult(
  testCase: StressCase,
  result: Awaited<ReturnType<typeof authorBrainCanonical>>,
): void {
  const diagnostics = record(result.diagnostics);
  const treatments = array(diagnostics.creativeTreatments);
  const rejectedTreatments = array(diagnostics.rejectedTreatments);
  const productions = array(diagnostics.memoryProductions);
  const assessment = record(diagnostics.treatmentSetAssessment);
  const notice = record(diagnostics.creativeNotice);
  const grounding = record(diagnostics.grounding);

  console.log("\n==================================================");
  console.log(`CASE: ${testCase.name}`);

  console.log("\nSUPPLIED REALITY");
  for (const event of result.world.events) {
    console.log(`- ${event.id}: ${clean(event.label)}`);
  }

  console.log("\nSEMANTIC MECHANIC");
  console.log(clean(record(treatments[0]).semanticMechanic) || "NONE");

  console.log("\nCREATIVE NOTICE");
  console.log("- observations");
  for (const observation of array(notice.observations).map(clean).filter(Boolean)) {
    console.log(`  - ${observation}`);
  }
  console.log("- perception opportunities");
  for (const opportunity of array(notice.perceptionOpportunities).map(clean).filter(Boolean)) {
    console.log(`  - ${opportunity}`);
  }

  for (const label of ["A", "B", "C"] as const) {
    const treatment = treatmentSource(label, treatments, rejectedTreatments);
    console.log(`\nTREATMENT ${label}`);
    console.log(`- relationUnderPressure: ${clean(treatment.source.relationUnderPressure) || "(none)"}`);
    console.log(`- lensPressure: ${clean(treatment.source.lensPressure) || "(none)"}`);
    console.log(`- conception: ${clean(treatment.source.treatment) || "(none)"}`);
    console.log(`- perceptionDelta: ${clean(treatment.source.perceptionDelta) || "(none)"}`);
    console.log(
      `- expressiveBehaviors: ${JSON.stringify(array(treatment.source.expressiveBehaviors).map(clean).filter(Boolean))}`,
    );
    console.log(`- ${treatment.valid ? "VALID" : "REJECTED"}`);
    if (!treatment.valid) console.log(`- rejection reason: ${treatment.reason}`);
  }

  console.log("\nBARE D");
  console.log(JSON.stringify(
    treatments.find((item) => productionForTreatment(item) === "D") ?? null,
    null,
    2,
  ));

  console.log("\nAVAILABLE PRODUCTIONS");
  for (const production of productions) {
    const item = record(production);
    console.log(
      `- ${clean(item.production) || "?"}: accepted=${String(item.accepted)} reasons=${JSON.stringify(array(item.reasons).map(clean).filter(Boolean))}`,
    );
  }

  printProduction("A", productions);
  printProduction("B", productions);
  printProduction("C", productions);
  printProduction("D", productions);

  console.log("\nMODEL NOMINATION");
  console.log(JSON.stringify({
    selectedProduction: diagnostics.selectedProduction,
    mouthFallback: diagnostics.mouthFallback,
  }, null, 2));

  console.log("\nGROUNDING");
  console.log(`- supported: ${String(grounding.acceptedScenes ?? 0)} / ${String(grounding.originalScenes ?? 0)}`);
  console.log(`- unsupported: ${Number(grounding.originalScenes ?? 0) - Number(grounding.acceptedScenes ?? 0)}`);
  console.log(`- rejection reasons: ${JSON.stringify(array(grounding.reasons).map(clean).filter(Boolean))}`);
  console.log(`- figurative support detail: ${clean(grounding.figurativeSupportDetail) || "(not exposed)"}`);

  console.log("\nFINAL SELECTED WHOLE PRODUCTION");
  result.scenes.forEach((scene, index) => {
    console.log(`[${index + 1}] ${clean(scene.text)}`);
  });

  console.log("\nPROVENANCE");
  for (const cut of result.sequence.cuts) {
    console.log(`[${cut.order}] ${cut.sourceIds.join(", ")} :: ${clean(cut.informationGain)}`);
  }

  console.log("\nRUNTIME STATUS");
  console.log(`- generatedExpressiveCount: ${String(assessment.generatedExpressiveCount ?? 0)}`);
  console.log(`- groundedExpressiveCount: ${String(assessment.groundedExpressiveCount ?? 0)}`);
  console.log(`- creativeSetComplete: ${String(assessment.creativeSetComplete === true)}`);
  console.log(`- renderable: ${String(assessment.renderable === true || diagnostics.renderable === true)}`);
  console.log(`- bareFallbackNeeded: ${String(assessment.bareFallbackRequired === true)}`);
  console.log(`- selectedProduction: ${clean(diagnostics.selectedProduction) || "NONE"}`);
  console.log(`- model fallback / timeout reason: ${[
    clean(diagnostics.creativeSearchFallbackReason),
    clean(record(diagnostics.mouthFallback).reason),
  ].filter(Boolean).join(" | ") || "none"}`);
  console.log("==================================================");
}

function printCaseError(testCase: StressCase, error: unknown): CaseSummary {
  const message = clean((error as { message?: unknown })?.message) || String(error);
  console.log("\n==================================================");
  console.log(`CASE: ${testCase.name}`);
  console.log("\nSUPPLIED REALITY");
  for (const [index, fact] of testCase.facts.entries()) {
    console.log(`- event-${index + 1}: ${fact}`);
  }
  console.log("\nRUNTIME STATUS");
  console.log("- renderable: false");
  console.log(`- model fallback / timeout reason: ${message}`);
  console.log("==================================================");

  return {
    name: testCase.name,
    completed: false,
    error: message,
    generatedExpressiveCount: 0,
    groundedExpressiveCount: 0,
    creativeSetComplete: false,
    renderable: false,
    bareFallbackNeeded: false,
    selectedProduction: "NONE",
    selectedKind: "NONE",
    fallbackReason: message,
    rejectedReasons: [],
    concepts: [],
    pressures: [],
    relations: [],
    deltas: [],
    behaviors: [],
    families: [],
  };
}

function addToIndex(index: Map<string, Set<string>>, key: string, caseName: string): void {
  if (!key) return;
  const existing = index.get(key) ?? new Set<string>();
  existing.add(caseName);
  index.set(key, existing);
}

function printRepeatedIndex(
  label: string,
  index: Map<string, Set<string>>,
  minimumCases = 2,
): void {
  const repeated = [...index.entries()]
    .filter(([, cases]) => cases.size >= minimumCases)
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));

  console.log(`\n${label}`);
  if (!repeated.length) {
    console.log("- none observed");
    return;
  }

  for (const [key, cases] of repeated) {
    console.log(`- ${key} :: ${[...cases].join(", ")}`);
  }
}

function printCrossRunSummary(summaries: CaseSummary[]): void {
  const completed = summaries.filter((summary) => summary.completed);
  const conceptIndex = new Map<string, Set<string>>();
  const pressureIndex = new Map<string, Set<string>>();
  const relationIndex = new Map<string, Set<string>>();
  const deltaIndex = new Map<string, Set<string>>();
  const behaviorIndex = new Map<string, Set<string>>();
  const familyIndex = new Map<string, Set<string>>();

  for (const summary of completed) {
    for (const concept of summary.concepts) addToIndex(conceptIndex, conceptKey(concept), summary.name);
    for (const pressure of summary.pressures) addToIndex(pressureIndex, conceptKey(pressure), summary.name);
    for (const relation of summary.relations) addToIndex(relationIndex, conceptKey(relation), summary.name);
    for (const delta of summary.deltas) addToIndex(deltaIndex, conceptKey(delta), summary.name);
    for (const behavior of summary.behaviors) addToIndex(behaviorIndex, conceptKey(behavior), summary.name);
    for (const family of summary.families) addToIndex(familyIndex, family, summary.name);
  }

  console.log("\n==================================================");
  console.log("CROSS-RUN DIVERSITY SUMMARY");

  console.log("\nCASE OUTCOMES");
  for (const summary of summaries) {
    console.log(
      `- ${summary.name}: generated=${summary.generatedExpressiveCount} grounded=${summary.groundedExpressiveCount} selected=${summary.selectedProduction || "NONE"} kind=${summary.selectedKind} renderable=${String(summary.renderable)}${summary.error ? ` error=${summary.error}` : ""}`,
    );
  }

  printRepeatedIndex("REPEATED TREATMENT NAME / CONCEPTION KEYS", conceptIndex);
  printRepeatedIndex("REPEATED LENS PRESSURE KEYS", pressureIndex);
  printRepeatedIndex("REPEATED RELATION UNDER PRESSURE KEYS", relationIndex);
  printRepeatedIndex("REPEATED PERCEPTION DELTA KEYS", deltaIndex);
  printRepeatedIndex("REPEATED EXPRESSIVE BEHAVIOR KEYS", behaviorIndex);
  printRepeatedIndex("RECURRING CONCEPTUAL FAMILIES", familyIndex, 3);

  const bareSelections = summaries.filter((summary) => summary.selectedKind === "BARE");
  const expressiveSelections = summaries.filter((summary) => summary.selectedKind === "EXPRESSIVE");
  const runtimeErrors = summaries.filter((summary) => !summary.completed || !summary.renderable);
  const hiddenRealityReasons = new Map<string, Set<string>>();
  for (const summary of summaries) {
    for (const reason of summary.rejectedReasons) {
      addToIndex(hiddenRealityReasons, reason, summary.name);
    }
  }

  console.log("\nSELECTION SPREAD");
  console.log(`- expressive selected: ${expressiveSelections.map((summary) => summary.name).join(", ") || "none"}`);
  console.log(`- Bare selected: ${bareSelections.map((summary) => summary.name).join(", ") || "none"}`);

  printRepeatedIndex("HIDDEN-REALITY REJECTION PATTERNS", hiddenRealityReasons);

  const highFamilyRepeats = [...familyIndex.entries()]
    .filter(([, cases]) => cases.size >= Math.max(4, Math.ceil(completed.length * 0.5)))
    .map(([family, cases]) => `${family} (${cases.size}/${completed.length})`);

  console.log("\nLIKELY HOUSE-STYLE CONTAMINATION");
  if (!highFamilyRepeats.length) {
    console.log("- no broad cross-case conceptual convergence flagged by this descriptive pass");
  } else {
    for (const repeat of highFamilyRepeats) {
      console.log(`- review recurring conceptual family: ${repeat}`);
    }
  }

  console.log("\nVERTICAL DEPTH / HORIZONTAL DIVERSITY");
  console.log(
    `- completed cases: ${completed.length}/${summaries.length}`,
  );
  console.log(
    `- cases with at least one grounded expressive treatment: ${summaries.filter((summary) => summary.groundedExpressiveCount > 0).map((summary) => summary.name).join(", ") || "none"}`,
  );
  console.log(
    `- cases with zero grounded expressive treatments but still renderable: ${summaries.filter((summary) => summary.groundedExpressiveCount === 0 && summary.renderable).map((summary) => summary.name).join(", ") || "none"}`,
  );
  console.log(
    `- runtime/model timeout cases: ${summaries.filter((summary) => summary.fallbackReason || summary.error).map((summary) => `${summary.name}: ${summary.fallbackReason || summary.error}`).join(" | ") || "none"}`,
  );

  if (runtimeErrors.length) {
    process.exitCode = 1;
  }

  console.log("==================================================");
}

const summaries: CaseSummary[] = [];

for (const testCase of CASES) {
  try {
    const result = await authorBrainCanonical(inputFor(testCase));
    printCaseResult(testCase, result);
    summaries.push(collectSummary(testCase.name, result));
  } catch (error) {
    summaries.push(printCaseError(testCase, error));
  }
}

printCrossRunSummary(summaries);
