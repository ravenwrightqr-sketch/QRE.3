import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorMouth.ts");

if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);

let source = fs.readFileSync(file, "utf8");

function insertOnce(anchor, insertion) {
  if (source.includes(insertion)) return;
  const index = source.indexOf(anchor);
  if (index < 0) throw new Error(`Could not find anchor: ${anchor}`);
  source = source.slice(0, index) + insertion + source.slice(index);
}

insertOnce(
  'export function isAuthorizedMouthCandidate',
  `import { buildMouthRealizationAuthority } from "./authorMouthRealizationAuthority.js";\nimport { evaluateRealizationBoundary } from "./authorRealizationBoundary.js";\n\nfunction annotateMouthRealizationBoundary(candidate: MouthCandidate, beat: MouthCandidateBeat, envelope: RealityEnvelope): MouthCandidate {\n  const authority = beat.realizationAuthority ?? buildMouthRealizationAuthority({ beat, envelope });\n  const eventIds = new Set(beat.eventIds ?? []);\n  const localEvents = envelope.events.filter((event) => eventIds.has(event.id));\n  const localStructures = envelope.eventStructure.filter((structure) => eventIds.has(structure.eventId));\n  const localReality = uniqueStrings([\n    envelope.subject,\n    ...localEvents.flatMap((event) => [event.label, ...(event.entities ?? [])]),\n    ...localStructures.flatMap((structure) => [\n      ...structure.subjects, ...structure.actions, ...structure.objects, ...structure.states,\n      ...structure.temporalMarkers, ...structure.sensoryMarkers,\n    ]),\n    ...authority.reality.entities, ...authority.reality.actions, ...authority.reality.objects, ...authority.reality.states,\n  ]);\n  const globalReality = uniqueStrings([\n    envelope.subject,\n    ...envelope.events.flatMap((event) => [event.label, ...(event.entities ?? [])]),\n    ...envelope.suppliedEntities, ...envelope.suppliedActions, ...envelope.suppliedStates, ...envelope.suppliedPhrases,\n  ]);\n  const semantic = uniqueStrings([\n    ...Object.values(authority.meaning),\n    ...authority.earnedInterpretations,\n  ]);\n  const boundary = evaluateRealizationBoundary({\n    text: candidate.text,\n    subject: envelope.subject,\n    place: "",\n    localReality,\n    globalReality,\n    semantic,\n    earnedInterpretations: authority.earnedInterpretations,\n    permittedRealizationModes: authority.permittedRealizationModes,\n    inferenceBudget: authority.inferenceBudget,\n  });\n  const reasons = candidate.reasons.filter(\n    (reason) => reason !== "realization-boundary-approved" && reason !== "realization-boundary-rejected",\n  );\n  reasons.push(boundary.inventionRisk >= 0.9 ? "realization-boundary-rejected" : "realization-boundary-approved");\n  return { ...candidate, reasons };\n}\n\n`,
);

function replaceBetween(startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Could not find start marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Could not find end marker: ${endMarker}`);
  source = source.slice(0, start) + replacement + source.slice(end);
}

const authStart = "export function isAuthorizedMouthCandidate";
const authEnd = "function pathIncrement";
replaceBetween(
  authStart,
  authEnd,
  `export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {\n  const text = clean(candidate.text);\n  if (!text) return false;\n  if (candidate.reasons.includes("realization-boundary-rejected")) return false;\n  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;\n  if (candidate.reasons.includes("explicit-explanation-risk") && candidate.forbiddenMoveRisk >= 0.9) return false;\n  if (candidate.reasons.includes("required-anchor-missing")) return false;\n  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;\n  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;\n  if (candidate.reasons.includes("recovery-source")) return true;\n  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.28;\n}\n`,
);

const completeStart = "export function completeMouthPools";
replaceBetween(
  completeStart,
  "\n",
  source.slice(source.lastIndexOf("export function completeMouthPools")),
);

const completeIndex = source.indexOf(completeStart);
if (completeIndex < 0) throw new Error("Could not find completeMouthPools block");
source = source.slice(0, completeIndex) + `export function completeMouthPools(input: { envelope: RealityEnvelope; beats: readonly MouthCandidateBeat[]; generated?: MouthCandidateBatch }): MouthCandidatePool[] {\n  return input.beats.map((beat) => {\n    if (!beat.viewerState) throw new Error(\`Mouth beat \${beat.order} is missing viewerState\`);\n    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];\n    const generatedCandidates = generated\n      .map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }))\n      .map((candidate) => annotateMouthRealizationBoundary(candidate, beat, input.envelope));\n    const fallbackCandidates = deterministicCreativeFallback(beat, input.envelope)\n      .map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope, recovery: true }))\n      .map((candidate) => annotateMouthRealizationBoundary(candidate, beat, input.envelope));\n    return {\n      order: beat.order,\n      viewerState: beat.viewerState,\n      nextPromise: clean(beat.next),\n      frontier: clean(beat.frontier),\n      candidates: dedupe([...generatedCandidates, ...fallbackCandidates]),\n    };\n  });\n}\n`;

// Opening literal recovery must remain available, but creative authorization is boundary-driven.
source = source.replace(
  /dedupe\(pool\.candidates\)\.filter\(\(candidate\) => candidate\.endpointExactness >= 0\.999 && candidate\.inventionRisk < 0\.9 /,
  "dedupe(pool.candidates).filter((candidate) => candidate.endpointExactness >= 0.999 ",
);

fs.writeFileSync(file, source, "utf8");
console.log("AUTHOR MOUTH REALIZATION GATE REPAIR: APPLIED");
console.log(file);
console.log("creative scoring remains permissive; realization boundary is the concrete-world gate");
