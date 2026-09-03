import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorMouth.ts");

if (!fs.existsSync(file)) {
  throw new Error(`Missing ${file}`);
}

let source = fs.readFileSync(file, "utf8");

function ensureImport(line, anchor) {
  if (source.includes(line)) return;
  source = source.replace(anchor, `${anchor}\n${line}`);
}

ensureImport(
  'import { buildMouthRealizationAuthority } from "./authorMouthRealizationAuthority.js";',
  'import { classifyLens } from "./authorCharacterLensEngine.js";'
);

ensureImport(
  'import { evaluateRealizationBoundary } from "./authorRealizationBoundary.js";',
  'import { buildMouthRealizationAuthority } from "./authorMouthRealizationAuthority.js";'
);

const helperMarker = "function annotateMouthRealizationBoundary(";
if (!source.includes(helperMarker)) {
  const helper = `function annotateMouthRealizationBoundary(candidate: MouthCandidate, beat: MouthCandidateBeat, envelope: RealityEnvelope): MouthCandidate {\n  const authority =\n    beat.realizationAuthority ??\n    buildMouthRealizationAuthority({ beat, envelope });\n\n  const eventIds = new Set(beat.eventIds ?? []);\n  const localEvents = envelope.events.filter((event) => eventIds.has(event.id));\n  const localStructures = envelope.eventStructure.filter((structure) => eventIds.has(structure.eventId));\n\n  const localReality = uniqueStrings([\n    envelope.subject,\n    ...localEvents.flatMap((event) => [event.label, ...(event.entities ?? [])]),\n    ...localStructures.flatMap((structure) => [\n      ...structure.subjects,\n      ...structure.actions,\n      ...structure.objects,\n      ...structure.states,\n      ...structure.temporalMarkers,\n      ...structure.sensoryMarkers,\n    ]),\n    ...authority.reality.entities,\n    ...authority.reality.actions,\n    ...authority.reality.objects,\n    ...authority.reality.states,\n  ]);\n\n  const globalReality = uniqueStrings([\n    envelope.subject,\n    ...envelope.events.flatMap((event) => [event.label, ...(event.entities ?? [])]),\n    ...envelope.suppliedEntities,\n    ...envelope.suppliedActions,\n    ...envelope.suppliedStates,\n    ...envelope.suppliedPhrases,\n  ]);\n\n  const semantic = uniqueStrings([\n    ...Object.values(authority.meaning),\n    ...authority.earnedInterpretations,\n  ]);\n\n  const boundary = evaluateRealizationBoundary({\n    text: candidate.text,\n    subject: envelope.subject,\n    localReality,\n    globalReality,\n    semantic,\n    earnedInterpretations: authority.earnedInterpretations,\n    permittedRealizationModes: authority.permittedRealizationModes,\n    inferenceBudget: authority.inferenceBudget,\n  });\n\n  const reasons = candidate.reasons.filter(\n    (reason) =>\n      reason !== "realization-boundary-approved" &&\n      reason !== "realization-boundary-rejected",\n  );\n\n  reasons.push(\n    boundary.inventionRisk >= 0.9\n      ? "realization-boundary-rejected"\n      : "realization-boundary-approved",\n  );\n\n  return {\n    ...candidate,\n    reasons,\n  };\n}\n\n`;
  source = source.replace("export function isAuthorizedMouthCandidate", helper + "export function isAuthorizedMouthCandidate");
}

const oldAuth = /export function isAuthorizedMouthCandidate\(candidate: MouthCandidate\): boolean \{[\s\S]*?\n\}\nfunction pathIncrement/;
const newAuth = `export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {\n  const text = clean(candidate.text);\n  if (!text) return false;\n  if (candidate.reasons.includes("realization-boundary-rejected")) return false;\n  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;\n  if (candidate.reasons.includes("explicit-explanation-risk") && candidate.forbiddenMoveRisk >= 0.9) return false;\n  if (candidate.reasons.includes("required-anchor-missing")) return false;\n  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;\n  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;\n  if (candidate.reasons.includes("recovery-source")) return true;\n  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.28;\n}\nfunction pathIncrement`;

if (!oldAuth.test(source)) {
  throw new Error("Could not find isAuthorizedMouthCandidate block; no changes written.");
}
source = source.replace(oldAuth, newAuth);

const oldComplete = /export function completeMouthPools\(input: \{ envelope: RealityEnvelope; beats: readonly MouthCandidateBeat\[\]; generated\?: MouthCandidateBatch \}\): MouthCandidatePool\[\] \{[\s\S]*?\n\}\n$/;
const newComplete = `export function completeMouthPools(input: { envelope: RealityEnvelope; beats: readonly MouthCandidateBeat[]; generated?: MouthCandidateBatch }): MouthCandidatePool[] {\n  return input.beats.map((beat) => {\n    if (!beat.viewerState) throw new Error(\`Mouth beat \${beat.order} is missing viewerState\`);\n    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];\n    const generatedCandidates = generated\n      .map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }))\n      .map((candidate) => annotateMouthRealizationBoundary(candidate, beat, input.envelope));\n    const fallbackCandidates = deterministicCreativeFallback(beat, input.envelope)\n      .map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope, recovery: true }))\n      .map((candidate) => annotateMouthRealizationBoundary(candidate, beat, input.envelope));\n    return {\n      order: beat.order,\n      viewerState: beat.viewerState,\n      nextPromise: clean(beat.next),\n      frontier: clean(beat.frontier),\n      candidates: dedupe([...generatedCandidates, ...fallbackCandidates]),\n    };\n  });\n}\n`;

if (!oldComplete.test(source)) {
  throw new Error("Could not find completeMouthPools block; no changes written.");
}
source = source.replace(oldComplete, newComplete);

fs.writeFileSync(file, source, "utf8");
console.log("AUTHOR MOUTH REALIZATION GATE REPAIR: APPLIED");
console.log(file);
console.log("creative scoring remains permissive; concrete safety is now enforced by the realization boundary after scoring");
