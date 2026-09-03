import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mouthFile = path.join(root, "apps/api/src/services/authorMouth.ts");
const brainFile = path.join(root, "apps/api/src/services/authorBrainCanonical.ts");

function read(file) {
  if (!fs.existsSync(file)) throw new Error("Missing file: " + file);
  return fs.readFileSync(file, "utf8");
}
function write(file, value) {
  fs.writeFileSync(file, value.replace(/\r\n/g, "\n"), "utf8");
}
function insertOnce(source, marker, replacement, label) {
  if (source.includes(replacement.trim())) return { source, changed: false };
  if (!source.includes(marker)) throw new Error("Patch anchor not found: " + label);
  return { source: source.replace(marker, replacement + "\n" + marker), changed: true };
}

let mouth = read(mouthFile);
let brain = read(brainFile);

const mouthReady =
  mouth.includes("function explanationRisk(text: string): number") &&
  mouth.includes('reasons.push("approved-semantic-realization")') &&
  mouth.includes('reasons.push("discovery-preserving")');

if (!mouthReady) {
  throw new Error("Canonical Mouth is missing the discovery-preservation patch; repair the current Mouth first.");
}

const spineMarker = "  const groups: LatentMovieTrajectoryStep[][] = [];\n";
const spinePatch = `  // Preserve the semantic spine discovered by Cognition during composition.\n  // For a graph-backed turn, never let generic adjacent-event grouping swallow\n  // the carrier/turn material into a before→after summary.\n  const thesis = movie.storyThesis;\n  const semanticSpineIds = unique([\n    ...(thesis?.beforeEventIds ?? []),\n    ...(thesis?.semanticRealization?.evidenceEventIds ?? []),\n    ...(thesis?.afterEventIds ?? []),\n    ...(thesis?.semanticRealization?.callback?.eventIds ?? []),\n    ...(thesis?.sealingEventIds ?? []),\n  ]);\n  const semanticSpineResolved = semanticSpineIds.length >= 2 &&\n    semanticSpineIds.every((id) => steps.some((step) => (step.eventIds ?? []).includes(id)));\n  const preserveSemanticSpine = Boolean(\n    thesis?.semanticTurn &&\n    semanticSpineResolved &&\n    steps.length >= 4,\n  );\n`;

const anchor = "  const steps = [...movie.trajectory];\n  if (steps.length <= 1) {\n    return steps.map((step) => stepToBeat(movie, step, 0, 1));\n  }\n\n";
if (!brain.includes(spinePatch.trim())) {
  if (!brain.includes(anchor)) throw new Error("Patch anchor not found: semantic spine setup");
  brain = brain.replace(anchor, anchor + spinePatch);
}

const groupsLine = "  const groups: LatentMovieTrajectoryStep[][] = [];\n";
const groupedBranch = `  if (preserveSemanticSpine) {\n    groups.push([steps[0]!]);\n    const middle = steps.slice(1, -1);\n    if (middle.length) groups.push(middle);\n    groups.push([steps[steps.length - 1]!]);\n  }\n\n`;
if (!brain.includes(groupedBranch.trim())) {
  if (!brain.includes(groupsLine)) throw new Error("Patch anchor not found: semantic spine groups");
  brain = brain.replace(groupsLine, groupsLine + groupedBranch);
}

const whileMarker = "  while (index < total) {\n";
if (brain.includes(whileMarker) && !brain.includes("  if (preserveSemanticSpine) index = total;\n")) {
  brain = brain.replace(whileMarker, "  if (preserveSemanticSpine) index = total;\n\n" + whileMarker);
}

write(brainFile, brain);
write(mouthFile, mouth);

console.log("AUTHOR SEMANTIC SPINE PATCH GREEN");
console.log(`  authorMouth.ts: ${mouthReady ? "already contains discovery-preservation logic" : "patched"}`);
console.log("  authorBrainCanonical.ts: semantic spine preserved during composition");
console.log("  composition: BEFORE → CARRIER/TURN → PAYOFF when a graph-backed semantic turn exists");
