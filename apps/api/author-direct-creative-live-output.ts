import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AuthorDomainContext } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { discoverAuthorCreativeDirection } from "./src/services/authorCreativeDiscovery.js";
import { createAuthorExperience } from "./src/services/authorCreative.js";
import { verifyAuthorCreativeGrounding } from "./src/services/authorCreativeGroundingVerifier.js";

const DIRECT_AUTHOR_PROMPT_HASH =
  "b96580a5720514b3c3755ced9a5a75d69abe153f16d45f84c428e04ecccfe441";

const SUBJECT = "Coco";
const PROMPT = "Create the customer-facing memory from this grooming visit.";
const FACTS = [
  "Dropped off at 9:00 AM.",
  "Bath.",
  "Blue bows.",
  "Tried to remove the bows.",
  "Happy at pickup.",
];
const DOMAIN_CONTEXT: AuthorDomainContext = {
  experienceMode: "MEMORY",
  category: "SERVICE",
  serviceType: "GROOMING",
  subjectKind: "PET",
};

type DebugBlock = {
  label: string;
  text: string;
  parsed?: unknown;
};

type ProductionLetter = "A" | "B" | "C";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function captureQreDebugLogs(): {
  blocks: DebugBlock[];
  restore: () => void;
} {
  const blocks: DebugBlock[] = [];
  const originalLog = console.log.bind(console);

  console.log = (...args: unknown[]) => {
    const text = args.map((arg) =>
      typeof arg === "string" ? arg : JSON.stringify(arg, null, 2),
    ).join(" ");
    const match = text.match(/^\n--- QRE ([^\n]+) ---\n([\s\S]*)\n--- END QRE \1 ---\n?$/);
    if (match) {
      blocks.push({
        label: match[1]!,
        text: match[2]!,
        parsed: parseJson(match[2]!),
      });
      return;
    }

    originalLog(...args);
  };

  return {
    blocks,
    restore: () => {
      console.log = originalLog;
    },
  };
}

function debugBlock(blocks: readonly DebugBlock[], label: string): DebugBlock | undefined {
  return blocks.find((block) => block.label === label);
}

function currentDirectAuthorPromptHash(): string {
  const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
  const start = source.indexOf("export function buildDirectAuthorMemoryMessages");
  const end = source.indexOf("function buildDeterministicMouthFallback", start);
  if (start < 0 || end <= start) {
    throw new Error("Direct Creative Author prompt region not found");
  }
  return createHash("sha256").update(source.slice(start, end)).digest("hex");
}

function rawAttemptText(rawAuthor: unknown, letter: ProductionLetter): string {
  const index = ["A", "B", "C"].indexOf(letter);
  const attempts = array(record(rawAuthor).attempts);
  return clean(record(attempts[index]).text);
}

function productionsByLetter(value: unknown): Map<string, Record<string, unknown>> {
  const byLetter = new Map<string, Record<string, unknown>>();
  for (const item of array(value)) {
    const production = clean(record(item).production).toUpperCase();
    if (production) byLetter.set(production, record(item));
  }
  return byLetter;
}

function printHeader(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value ?? null, null, 2));
}

function printRawAuthors(rawAuthor: unknown): void {
  for (const letter of ["A", "B", "C"] as const) {
    printHeader(`RAW AUTHOR ${letter}`);
    console.log(rawAttemptText(rawAuthor, letter) || "(missing)");
  }
}

function printProvenance(realityEditorDebug: unknown): void {
  printHeader("PROVENANCE");
  const originalAuthorProductions = array(record(realityEditorDebug).originalAuthorProductions);
  for (const production of originalAuthorProductions) {
    const item = record(production);
    console.log(`\n${clean(item.production) || "?"}`);
    for (const line of array(item.lines)) {
      const lineRecord = record(line);
      console.log(JSON.stringify({
        order: lineRecord.order,
        text: lineRecord.text,
        sourceEventIds: lineRecord.sourceEventIds,
      }, null, 2));
    }
  }
}

function printAtomicAuditor(realityEditorDebug: unknown): void {
  printHeader("ATOMIC CLAIM AUDITOR");
  const auditorSpans = array(record(realityEditorDebug).auditorSpans);
  for (const audit of auditorSpans) {
    const item = record(audit);
    console.log(`\n${clean(item.production) || "?"}`);
    printJson({
      originalText: item.originalText,
      spans: item.spans,
      unusableReason: item.unusableReason,
    });
  }
}

function printRealityEditor(realityEditorDebug: unknown): void {
  printHeader("REALITY EDITOR");
  const editor = record(realityEditorDebug);
  console.log("meta");
  printJson({
    enabled: editor.enabled,
    applied: editor.applied,
    fallbackReason: editor.fallbackReason,
  });

  const reconstructedByLetter = productionsByLetter(editor.reconstructedProductions);
  const removedByLetter = productionsByLetter(editor.removedSpans);
  const auditorByLetter = productionsByLetter(editor.auditorSpans);
  const afterByLetter = productionsByLetter(editor.after);

  for (const letter of ["A", "B", "C"] as const) {
    console.log(`\n${letter}`);
    printJson({
      survivingText: record(reconstructedByLetter.get(letter)).text ?? "",
      removedSpans: record(removedByLetter.get(letter)).removedSpans ?? [],
      rejectionReason: record(auditorByLetter.get(letter)).unusableReason ?? "",
      survivingProduction: afterByLetter.get(letter) ?? null,
    });
  }
}

function printFinalGrounding(groundingResult: unknown): void {
  printHeader("FINAL GROUNDING");
  printJson(groundingResult);
}

function printAuthorizedRealizationPool(poolDebug: unknown): void {
  printHeader("AUTHORIZED REALIZATION POOL");
  for (const realization of array(poolDebug)) {
    const item = record(realization);
    console.log(`\n${clean(item.sourceProduction) || "?"} ${clean(item.id) || ""}`.trim());
    printJson({
      text: item.text,
      classification: item.classification,
      sourceEventIds: item.sourceEventIds,
      materialKind: item.materialKind,
      originalOrder: item.originalOrder,
    });
  }
}

function printAssemblerRawOutput(rawOutputDebug: unknown): void {
  printHeader("ASSEMBLER RAW OUTPUT");
  console.log(clean(rawOutputDebug) || "(none)");
}

function printAssemblerTruthResult(truthDebug: unknown): void {
  printHeader("ASSEMBLER TRUTH RESULT");
  printJson(truthDebug);
}

function printSynthesizerInput(inputDebug: unknown): void {
  printHeader("SYNTHESIZER INPUT");
  printJson(inputDebug);
}

function printRawSynthesizerOutput(rawOutputDebug: unknown): void {
  printHeader("RAW SYNTHESIZER OUTPUT");
  console.log(clean(rawOutputDebug) || "(none)");
}

function printSynthesizedFrom(synthesizedFromDebug: unknown): void {
  printHeader("SYNTHESIZED FROM");
  printJson(synthesizedFromDebug);
}

function printSynthesisClaimAuditor(claimAuditorDebug: unknown): void {
  printHeader("SYNTHESIS CLAIM AUDITOR");
  printJson(claimAuditorDebug);
}

function printSynthesisRealityEditor(realityEditorDebug: unknown): void {
  printHeader("SYNTHESIS REALITY EDITOR");
  printJson(realityEditorDebug);
}

function printSynthesisFinalGrounding(groundingResult: unknown): void {
  printHeader("SYNTHESIS FINAL GROUNDING");
  printJson(groundingResult);
}

function printSynthesisEligibility(eligibilityDebug: unknown): void {
  printHeader("SYNTHESIS ELIGIBILITY");
  printJson(eligibilityDebug);
}

function printOriginalScoring(memoryProductionsDebug: unknown, diagnosticsProductions: unknown): void {
  printHeader("ORIGINAL A/B/C/D SCORING");
  const debugRecord = record(memoryProductionsDebug);
  const productions = array(debugRecord.productions ?? diagnosticsProductions)
    .filter((production) => clean(record(production).production) !== "ASSEMBLED");
  printJson({
    modelNomination: debugRecord.modelNomination,
    modelSelectionReason: debugRecord.modelSelectionReason,
    productions,
  });
}

function printAssembledCandidateScoring(assembledScoringDebug: unknown): void {
  printHeader("ASSEMBLED CANDIDATE SCORING");
  printJson(assembledScoringDebug);
}

function printLateSelection(memoryProductionsDebug: unknown): void {
  printHeader("LATE SELECTION");
  const debugRecord = record(memoryProductionsDebug);
  printJson({
    modelNomination: debugRecord.modelNomination,
    modelSelectionReason: debugRecord.modelSelectionReason,
    winner: debugRecord.winner,
  });
}

function printScoringDLateSelection(
  memoryProductionsDebug: unknown,
  assembledScoringDebug: unknown,
): void {
  printHeader("SCORING / D / LATE SELECTION");
  const debugRecord = record(memoryProductionsDebug);
  printJson({
    modelNomination: debugRecord.modelNomination,
    modelSelectionReason: debugRecord.modelSelectionReason,
    winner: debugRecord.winner,
    assembled: assembledScoringDebug,
    productions: debugRecord.productions,
  });
}

function printFinalSelectedProduction(groundingResult: unknown): void {
  printHeader("FINAL SELECTED PRODUCTION");
  const scenes = array(record(groundingResult).scenes);
  if (!scenes.length) {
    console.log("(none)");
    return;
  }
  scenes.forEach((scene, index) => {
    console.log(`[${index + 1}] ${clean(record(scene).text)}`);
  });
}

const FACT_MATCHERS: Array<{ fact: string; pattern: RegExp }> = [
  { fact: FACTS[0]!, pattern: /\b(dropped off|9:00|9 am|9:00 am)\b/i },
  { fact: FACTS[1]!, pattern: /\bbath\b/i },
  { fact: FACTS[2]!, pattern: /\bblue\b|\bbows?\b/i },
  { fact: FACTS[3]!, pattern: /\btried\b|\bremove\b|\bbows?\b/i },
  { fact: FACTS[4]!, pattern: /\bhappy\b|\bpickup\b/i },
];

function unsupportedSpansFor(
  realityEditorDebug: unknown,
  letter: ProductionLetter,
): string[] {
  const audit = array(record(realityEditorDebug).auditorSpans)
    .find((item) => clean(record(item).production).toUpperCase() === letter);
  return array(record(audit).spans)
    .filter((span) => clean(record(span).classification).toUpperCase() === "UNSUPPORTED_REALITY")
    .map((span) => clean(record(span).exactText))
    .filter(Boolean);
}

function lineTexts(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?])\s+/g)
    .map(clean)
    .filter(Boolean);
}

function printDiagnostics(rawAuthor: unknown, realityEditorDebug: unknown, memoryProductionsDebug: unknown): void {
  printHeader("TEST-ONLY OBSERVATIONAL DIAGNOSTICS");
  const scoringByLetter = productionsByLetter(record(memoryProductionsDebug).productions);

  for (const letter of ["A", "B", "C"] as const) {
    const text = rawAttemptText(rawAuthor, letter);
    const expressed = FACT_MATCHERS
      .filter((item) => item.pattern.test(text))
      .map((item) => item.fact);
    const omitted = FACT_MATCHERS
      .filter((item) => !item.pattern.test(text))
      .map((item) => item.fact);
    const unsupported = unsupportedSpansFor(realityEditorDebug, letter);
    const cuts = lineTexts(text);
    const scoring = record(scoringByLetter.get(letter));

    console.log(`\n${letter}`);
    printJson({
      explicitlyExpressedSuppliedFacts: expressed,
      omittedSuppliedFacts: omitted,
      didProductionRequireAnyNewConcreteOccurrence: unsupported.length
        ? "review unsupported atomic spans below"
        : "no unsupported atomic spans reported by Claim Auditor",
      unsupportedAtomicSpans: unsupported,
      apparentDisproportionateAttention: expressed.length
        ? expressed
        : "none detected by simple supplied-fact matcher",
      replayOrNewPerspective: expressed.length >= FACTS.length
        ? "appears closer to fact replay by explicit coverage"
        : "appears selective; inspect raw text for perspective movement",
      viewerUnderstandingMovementAcrossCuts: cuts.length > 1
        ? cuts.map((cut, index) => ({ cut: index + 1, text: cut }))
        : "single cut / no multi-line progression",
      laterLineRecontextualizesEarlierLine: cuts.length > 1
        ? "human review required from raw cuts"
        : "not applicable",
      evidenceAuthorTreatedFactCountAsMoveCount: cuts.length >= FACTS.length || expressed.length >= FACTS.length,
      evidenceAmplificationByInventedEventRatherThanAttention: unsupported.length > 0,
      didTruthEnforcementPossiblyPunishPerspectiveRatherThanNewReality: {
        acceptedAfterScoring: scoring.accepted,
        scoringReasons: scoring.reasons ?? [],
        removedOrUnsupportedSpans: unsupported,
        note: "Observational only. Use auditor classifications and editor removals above for the actual truth-enforcement record.",
      },
    });
  }
}

process.env.QRE_AUTHOR_DIRECT_CREATIVE_EXPERIMENT = "true";
process.env.QRE_AUTHOR_REALITY_EDITOR_EXPERIMENT = "true";
process.env.QRE_AUTHOR_DEBUG_RAW = "true";

const promptHash = currentDirectAuthorPromptHash();
if (promptHash !== DIRECT_AUTHOR_PROMPT_HASH) {
  throw new Error(`Direct Creative Author prompt hash changed: ${promptHash}`);
}

const capture = captureQreDebugLogs();

let creativeResult: Awaited<ReturnType<typeof createAuthorExperience>>;
let groundingResult: Awaited<ReturnType<typeof verifyAuthorCreativeGrounding>>;

try {
  const world = buildAuthorRealityGraph({
    prompt: PROMPT,
    subject: SUBJECT,
    facts: FACTS,
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
  });

  const events = world.events
    .map((event) => ({ id: event.id, text: clean(event.label) }))
    .filter((event) => event.text);

  const discoveryResult = await discoverAuthorCreativeDirection({
    events,
    relations: world.relations.map((relation) => ({
      from: relation.from,
      to: relation.to,
      kind: relation.kind,
      strength: relation.strength,
    })),
    memory: [],
    domainContext: DOMAIN_CONTEXT,
  });

  creativeResult = await createAuthorExperience({
    subject: SUBJECT,
    suppliedReality: events,
    creativeDiscovery: discoveryResult.discovery,
    memory: [],
    domainContext: DOMAIN_CONTEXT,
  });

  groundingResult = await verifyAuthorCreativeGrounding({
    scenes: creativeResult.scenes,
    suppliedReality: events,
    semanticAuthority: [
      discoveryResult.discovery.selected.perception,
      discoveryResult.discovery.selected.relationship,
    ].map(clean).filter(Boolean),
    domainContext: DOMAIN_CONTEXT,
  });
} finally {
  capture.restore();
}

const rawAuthor = debugBlock(capture.blocks, "DIRECT-CREATIVE-AUTHOR-PRODUCTIONS")?.parsed;
const realityEditorDebug = debugBlock(capture.blocks, "REALITY-EDITOR")?.parsed;
const authorizedRealizationPoolDebug = debugBlock(capture.blocks, "AUTHORIZED-REALIZATION-POOL")?.parsed;
const assemblerRawOutputDebug = debugBlock(capture.blocks, "ASSEMBLER-RAW-OUTPUT")?.text;
const assemblerTruthResultDebug = debugBlock(capture.blocks, "ASSEMBLER-TRUTH-RESULT")?.parsed;
const synthesizerInputDebug = debugBlock(capture.blocks, "SYNTHESIZER-INPUT")?.parsed;
const rawSynthesizerOutputDebug = debugBlock(capture.blocks, "RAW-SYNTHESIZER-OUTPUT")?.text;
const synthesizedFromDebug = debugBlock(capture.blocks, "SYNTHESIZED-FROM")?.parsed;
const synthesisClaimAuditorDebug = debugBlock(capture.blocks, "SYNTHESIS-CLAIM-AUDITOR")?.parsed;
const synthesisRealityEditorDebug = debugBlock(capture.blocks, "SYNTHESIS-REALITY-EDITOR")?.parsed;
const synthesisEligibilityDebug = debugBlock(capture.blocks, "SYNTHESIS-ELIGIBILITY")?.parsed;
const memoryProductionsDebug = debugBlock(capture.blocks, "MEMORY-PRODUCTIONS")?.parsed;
const assembledCandidateScoringDebug = debugBlock(capture.blocks, "ASSEMBLED-CANDIDATE-SCORING")?.parsed;

if (!rawAuthor) throw new Error("Missing DIRECT-CREATIVE-AUTHOR-PRODUCTIONS debug block");
if (!realityEditorDebug) throw new Error("Missing REALITY-EDITOR debug block");
if (!authorizedRealizationPoolDebug) throw new Error("Missing AUTHORIZED-REALIZATION-POOL debug block");
if (assemblerRawOutputDebug === undefined) throw new Error("Missing ASSEMBLER-RAW-OUTPUT debug block");
if (!assemblerTruthResultDebug) throw new Error("Missing ASSEMBLER-TRUTH-RESULT debug block");
if (synthesizerInputDebug === undefined) throw new Error("Missing SYNTHESIZER-INPUT debug block");
if (rawSynthesizerOutputDebug === undefined) throw new Error("Missing RAW-SYNTHESIZER-OUTPUT debug block");
if (synthesizedFromDebug === undefined) throw new Error("Missing SYNTHESIZED-FROM debug block");
if (synthesisClaimAuditorDebug === undefined) throw new Error("Missing SYNTHESIS-CLAIM-AUDITOR debug block");
if (synthesisRealityEditorDebug === undefined) throw new Error("Missing SYNTHESIS-REALITY-EDITOR debug block");
if (synthesisEligibilityDebug === undefined) throw new Error("Missing SYNTHESIS-ELIGIBILITY debug block");
if (!memoryProductionsDebug) throw new Error("Missing MEMORY-PRODUCTIONS debug block");
if (!assembledCandidateScoringDebug) throw new Error("Missing ASSEMBLED-CANDIDATE-SCORING debug block");

printHeader("DIRECT CREATIVE AUTHOR PROMPT HASH");
console.log(promptHash);

printHeader("SUPPLIED REALITY");
FACTS.forEach((fact, index) => {
  console.log(`event-${index + 1}: ${fact}`);
});

printRawAuthors(rawAuthor);
printProvenance(realityEditorDebug);
printAtomicAuditor(realityEditorDebug);
printRealityEditor(realityEditorDebug);
printAuthorizedRealizationPool(authorizedRealizationPoolDebug);
printAssemblerRawOutput(assemblerRawOutputDebug);
printAssemblerTruthResult(assemblerTruthResultDebug);
printSynthesizerInput(synthesizerInputDebug);
printRawSynthesizerOutput(rawSynthesizerOutputDebug);
printSynthesizedFrom(synthesizedFromDebug);
printSynthesisClaimAuditor(synthesisClaimAuditorDebug);
printSynthesisRealityEditor(synthesisRealityEditorDebug);
printSynthesisFinalGrounding(groundingResult);
printSynthesisEligibility(synthesisEligibilityDebug);
printFinalGrounding(groundingResult);
printOriginalScoring(memoryProductionsDebug, creativeResult.diagnostics.memoryProductions);
printAssembledCandidateScoring(assembledCandidateScoringDebug);
printLateSelection(memoryProductionsDebug);
printScoringDLateSelection(memoryProductionsDebug, assembledCandidateScoringDebug);
printFinalSelectedProduction(groundingResult);
printDiagnostics(rawAuthor, realityEditorDebug, memoryProductionsDebug);
