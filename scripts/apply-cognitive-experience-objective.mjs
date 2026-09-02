import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cognitionPath = path.join(root, "apps/api/src/services/authorCognition.ts");
const moviePath = path.join(root, "apps/api/src/services/authorUniversalMovieSearch.ts");

function read(file) { return fs.readFileSync(file, "utf8"); }
function write(file, text) { fs.writeFileSync(file, text, "utf8"); }
function once(text, needle, replacement, label) {
  if (!text.includes(needle)) throw new Error(`Migration marker missing: ${label}`);
  return text.replace(needle, replacement);
}

let cognition = read(cognitionPath);
let movie = read(moviePath);

// Type-level connection: Cognition now exposes the actual experience objective,
// rather than only a list of trajectory captions.
cognition = once(
  cognition,
  'import { resolveLensPolicy } from "./authorLensPolicy.js";\n',
  'import { resolveLensPolicy } from "./authorLensPolicy.js";\nimport { buildCognitiveExperienceObjective } from "./authorCognitiveExperienceObjective.js";\n',
  "cognition objective import",
);

cognition = once(
  cognition,
  '  readoutPlan: CognitiveReadoutDecision[];\n',
  '  readoutPlan: CognitiveReadoutDecision[];\n  experienceObjective?: ReturnType<typeof buildCognitiveExperienceObjective>;\n',
  "experience objective plan field",
);

// Cognition's old source-led materialization is retained as a safety fallback,
// but the objective is now authoritative for viewer-facing readout selection.
const old = `  const selectedMovie = materialized.movie;\n  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>`;
const replacement = `  const objective = selectedMovieSeed && input.realityGraph\n    ? buildCognitiveExperienceObjective(input.realityGraph, selectedMovieSeed)\n    : undefined;\n\n  const objectiveMovie = selectedMovieSeed && objective?.trajectory.length\n    ? {\n        ...selectedMovieSeed,\n        trajectory: objective.trajectory.map((decision, index) => {\n          const sourceSteps = selectedMovieSeed.trajectory.filter((step) =>\n            step.eventIds.some((id) => decision.eventIds.includes(id)),\n          );\n          const source = sourceSteps[0] ?? selectedMovieSeed.trajectory[index] ?? selectedMovieSeed.trajectory[selectedMovieSeed.trajectory.length - 1];\n          return {\n            ...(source ?? { order: index + 1, operation: "reveal", eventIds: decision.eventIds, viewerChange: "attention advances", nextQuestion: decision.nextPressure }),\n            order: index + 1,\n            eventIds: decision.eventIds,\n            viewerChange: decision.viewerAfter.emotionalPosition || source?.viewerChange || "attention advances",\n            nextQuestion: decision.nextPressure,\n          };\n        }),\n      }\n    : materialized.movie;\n\n  const selectedMovie = objectiveMovie;\n  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>`;
cognition = once(cognition, old, replacement, "objective movie materialization");

cognition = once(
  cognition,
  '    readoutPlan: materialized.decisions,\n',
  '    readoutPlan: objective?.trajectory.map((decision) => ({\n      order: decision.order,\n      eventIds: decision.eventIds,\n      purpose: decision.purpose,\n      currentEvidence: decision.currentEvidence,\n      futureEvidence: decision.futureEvidence,\n      viewerStateBefore: JSON.stringify(decision.viewerBefore),\n      viewerStateAfter: JSON.stringify(decision.viewerAfter),\n      attentionTarget: decision.attentionTarget,\n      withheldInformation: decision.withheldInformation,\n      nextPressure: decision.nextPressure,\n      terminal: decision.terminal,\n    })) ?? materialized.decisions,\n    experienceObjective: objective,\n',
  "objective readout plan",
);

// TypeScript target compatibility: do not require ES2022 Array.prototype.at.
movie = movie.replace('structures.at(-1)', 'structures[structures.length - 1]');
movie = movie.replace('graph.events.at(-1)', 'graph.events[graph.events.length - 1]');

write(cognitionPath, cognition);
write(moviePath, movie);
console.log("COGNITIVE EXPERIENCE OBJECTIVE WIRED");
console.log("- Cognition now owns experience opportunities + viewer trajectory");
console.log("- viewer-facing readout count comes from the objective");
console.log("- RealityGraph remains immutable source truth");
console.log("- future evidence is explicit withheld material");
console.log("- Array.at compatibility fixed");
