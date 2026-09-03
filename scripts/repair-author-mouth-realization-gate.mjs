import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorMouth.ts");

if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);

let source = fs.readFileSync(file, "utf8");

const buildImport = 'import { buildMouthRealizationAuthority } from "./authorMouthRealizationAuthority.js";';
const boundaryImport = 'import { evaluateRealizationBoundary } from "./authorRealizationBoundary.js";';

// Normalize these imports first so this repair remains safe to run repeatedly,
// regardless of whether the local file already contains one or several copies.
source = source
  .replace(/^import \{ buildMouthRealizationAuthority \} from "\.\/authorMouthRealizationAuthority\.js";\r?\n?/gm, "")
  .replace(/^import \{ evaluateRealizationBoundary \} from "\.\/authorRealizationBoundary\.js";\r?\n?/gm, "");

const importAnchor = 'import { classifyLens } from "./authorCharacterLensEngine.js";';
if (!source.includes(importAnchor)) {
  throw new Error("Could not find classifyLens import anchor; no changes written.");
}
source = source.replace(importAnchor, `${importAnchor}\n${buildImport}\n${boundaryImport}`);

function replaceFunction(sourceText, name, replacement, nextAnchor) {
  const start = sourceText.indexOf(`export function ${name}(`);
  if (start < 0) throw new Error(`Could not find exported function ${name}; no changes written.`);
  const end = nextAnchor
    ? sourceText.indexOf(nextAnchor, start)
    : sourceText.length;
  if (end < 0) throw new Error(`Could not find next anchor ${nextAnchor}; no changes written.`);
  return sourceText.slice(0, start) + replacement + sourceText.slice(end);
}

const helper = `function annotateMouthRealizationBoundary(candidate: MouthCandidate, beat: MouthCandidateBeat, envelope: RealityEnvelope): MouthCandidate {\n  const authority =\n    beat.realizationAuthority ??\n    buildMouthRealizationAuthority({ beat, envelope });\n\n  const eventIds = new Set(beat.eventIds ?? []);\n  const localEvents = envelope.events.filter((event) => eventIds.has(event.id));\n  const localStructures = envelope.eventStructure.filter((structure) => eventIds.has(structure.eventId));\n\n  const localReality = uniqueStrings([\n    envelope.subject,\n    ...localEvents.flatMap((event) => [event.label, ...(event.entities ?? [])]),\n    ...localStructures.flatMap((structure) => [\n      ...structure.subjects,\n      ...structure.actions,\n      ...structure.objects,\n      ...structure.states,\n      ...structure.temporalMarkers,\n      ...structure.sensoryMarkers,\n    ]),\n    ...authority.reality.entities,\n    ...authority.reality.actions,\n    ...authority.reality.objects,\n    ...authority.reality.states,\n  ]);\n\n  const globalReality = uniqueStrings([\n    envelope.subject,\n    ...envelope.events.flatMap((event) => [event.label, ...(event.entities ?? [])]),\n    ...envelope.suppliedEntities,\n    ...envelope.suppliedActions,\n    ...envelope.suppliedStates,\n    ...envelope.suppliedPhrases,\n  ]);\n\n  const semantic = uniqueStrings([\n    ...Object.values(authority.meaning),\n    ...authority.earnedInterpretations,\n  ]);\n\n  const boundary = evaluateRealizationBoundary({\n    text: candidate.text,\n    subject: envelope.subject,\n    localReality,\n    globalReality,\n    semantic,\n    earnedInterpretations: authority.earnedInterpretations,\n    permittedRealizationModes: authority.permittedRealizationModes,\n    inferenceBudget: authority.inferenceBudget,\n  });\n\n  const reasons = candidate.reasons.filter(\n    (reason) =>\n      reason !== "realization-boundary-approved" &&\n      reason !== "realization-boundary-rejected",\n  );\n\n  reasons.push(\n    boundary.inventionRisk >= 0.9\n      ? "realization-boundary-rejected"\n      : "realization-boundary-approved",\n  );\n\n  return {\n    ...candidate,\n    reasons,\n  };\n}\n\n`;

const helperMarker = "function annotateMouthRealizationBoundary(";
if (!source.includes(helperMarker)) {
  const insertion = "export function isAuthorizedMouthCandidate(";
  const index = source.indexOf(insertion);
  if (index < 0) throw new Error("Could not find isAuthorizedMouthCandidate insertion point; no changes written.");
  source = source.slice(0, index) + helper + source.slice(index);
}

const authStart = source.indexOf("export function isAuthorizedMouthCandidate(");
const pathStart = source.indexOf("function pathIncrement(", authStart);
if (authStart < 0 || pathStart < 0) throw new Error("Could not locate authorization/path functions; no changes written.");

const newAuth = `export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {\n  const text = clean(candidate.text);\n  if (!text) return false;\n  if (candidate.reasons.includes("realization-boundary-rejected")) return false;\n  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;\n  if (candidate.reasons.includes("explicit-explanation-risk") && candidate.forbiddenMoveRisk >= 0.9) return false;\n  if (candidate.reasons.includes("required-anchor-missing")) return false;\n  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;\n  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;\n  if (candidate.reasons.includes("recovery-source")) return true;\n  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.28;\n}\n`;
source = source.slice(0, authStart) + newAuth + source.slice(pathStart);

const completeStart = source.indexOf("export function completeMouthPools(");
if (completeStart < 0) throw new Error("Could not find completeMouthPools; no changes written.");

const newComplete = `export function completeMouthPools(input: { envelope: RealityEnvelope; beats: readonly MouthCandidateBeat[]; generated?: MouthCandidateBatch }): MouthCandidatePool[] {\n  return input.beats.map((beat) => {\n    if (!beat.viewerState) throw new Error(\`Mouth beat \${beat.order} is missing viewerState\`);\n    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];\n    const generatedCandidates = generated\n      .map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }))\n      .map((candidate) => annotateMouthRealizationBoundary(candidate, beat, input.envelope));\n    const fallbackCandidates = deterministicCreativeFallback(beat, input.envelope)\n      .map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope, recovery: true }))\n      .map((candidate) => annotateMouthRealizationBoundary(candidate, beat, input.envelope));\n    return {\n      order: beat.order,\n      viewerState: beat.viewerState,\n      nextPromise: clean(beat.next),\n      frontier: clean(beat.frontier),\n      candidates: dedupe([...generatedCandidates, ...fallbackCandidates]),\n    };\n  });\n}\n`;

source = source.slice(0, completeStart) + newComplete;
fs.writeFileSync(file, source, "utf8");
console.log("AUTHOR MOUTH REALIZATION GATE REPAIR: APPLIED");
console.log(file);
console.log("idempotent: imports=unique, helper=unique, creative scoring permissive, realization boundary=hard concrete-world gate");
