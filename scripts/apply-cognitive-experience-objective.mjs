import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cognitionPath = path.join(root, "apps/api/src/services/authorCognition.ts");
const moviePath = path.join(root, "apps/api/src/services/authorUniversalMovieSearch.ts");
const objectivePath = path.join(root, "apps/api/src/services/authorCognitiveExperienceObjective.ts");

function read(file) { return fs.readFileSync(file, "utf8"); }
function write(file, text) { fs.writeFileSync(file, text, "utf8"); }
function once(text, needle, replacement, label) {
  if (!text.includes(needle)) throw new Error(`Migration marker missing: ${label}`);
  return text.replace(needle, replacement);
}

let cognition = read(cognitionPath);
let movie = read(moviePath);
let objective = read(objectivePath);

// The repository already contains the earlier readout materialization. Wire the
// new objective into THAT canonical path rather than assuming an older marker.
if (!cognition.includes('authorCognitiveExperienceObjective.js')) {
  cognition = once(
    cognition,
    'import { resolveLensPolicy } from "./authorLensPolicy.js";\n',
    'import { resolveLensPolicy } from "./authorLensPolicy.js";\nimport { buildCognitiveExperienceObjective } from "./authorCognitiveExperienceObjective.js";\n',
    "cognition objective import",
  );
}

if (!cognition.includes("experienceObjective?: ReturnType<typeof buildCognitiveExperienceObjective>")) {
  cognition = once(
    cognition,
    '  readoutPlan: CognitiveReadoutDecision[];\n',
    '  readoutPlan: CognitiveReadoutDecision[];\n  experienceObjective?: ReturnType<typeof buildCognitiveExperienceObjective>;\n',
    "experience objective plan field",
  );
}

const oldMaterialization = `  const selectedMovie = materialized.movie;\n  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>\n    candidate.id === selectedMovie?.id && selectedMovie ? selectedMovie : candidate,\n  );`;

if (!cognition.includes("const experienceObjective =")) {
  cognition = once(
    cognition,
    oldMaterialization,
    `  const experienceObjective = selectedMovieSeed && input.realityGraph\n    ? buildCognitiveExperienceObjective(input.realityGraph, selectedMovieSeed)\n    : undefined;\n\n  const objectiveMovie = selectedMovieSeed && experienceObjective?.trajectory.length\n    ? {\n        ...selectedMovieSeed,\n        trajectory: experienceObjective.trajectory.map((decision, index) => {\n          const source = selectedMovieSeed.trajectory.find((step) =>\n            step.eventIds.some((id) => decision.eventIds.includes(id)),\n          ) ?? selectedMovieSeed.trajectory[index];\n          return {\n            ...(source ?? { order: index + 1, operation: "reveal", eventIds: decision.eventIds, viewerChange: "attention advances" }),\n            order: index + 1,\n            eventIds: decision.eventIds,\n            viewerChange: decision.attentionTarget || source?.viewerChange || "attention advances",\n            nextQuestion: decision.nextPressure,\n          };\n        }),\n      }\n    : materialized.movie;\n\n  const selectedMovie = objectiveMovie;\n  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>\n    candidate.id === selectedMovie?.id && selectedMovie ? selectedMovie : candidate,\n  );`,
    "objective movie materialization",
  );
}

if (!cognition.includes("experienceObjective: experienceObjective")) {
  cognition = once(
    cognition,
    '    readoutPlan: materialized.decisions,\n',
    `    readoutPlan: experienceObjective?.trajectory.map((decision) => ({\n      order: decision.order,\n      eventIds: decision.eventIds,\n      purpose: decision.purpose,\n      currentEvidence: decision.currentEvidence,\n      futureEvidence: decision.futureEvidence,\n      viewerStateBefore: JSON.stringify(decision.viewerBefore),\n      viewerStateAfter: JSON.stringify(decision.viewerAfter),\n      attentionTarget: decision.attentionTarget,\n      withheldInformation: decision.withheldInformation,\n      nextPressure: decision.nextPressure,\n      terminal: decision.terminal,\n    })) ?? materialized.decisions,\n    experienceObjective: experienceObjective,\n`,
    "objective readout plan",
  );
}

// TypeScript target compatibility: do not require ES2022 Array.prototype.at.
movie = movie.replaceAll('structures.at(-1)', 'structures[structures.length - 1]');
movie = movie.replaceAll('graph.events.at(-1)', 'graph.events[graph.events.length - 1]');

// The objective must not merely mirror the old event list. It selects a
// viewer-facing trajectory from experiential value while retaining source truth.
if (!objective.includes("function selectExperienceSteps")) {
  objective = once(
    objective,
    'function buildTrajectory(graph: RealityGraph, movie: LatentMovieCandidate, opportunities: CognitiveExperienceOpportunity[]): CognitiveReadoutObjective[] {\n  const steps = movie.trajectory.filter((step) => step.eventIds.length || clean(step.viewerChange));',
    `function selectExperienceSteps(\n  graph: RealityGraph,\n  movie: LatentMovieCandidate,\n  opportunities: CognitiveExperienceOpportunity[],\n): LatentMovieCandidate["trajectory"] {\n  const source = movie.trajectory.filter((step) => step.eventIds.length || clean(step.viewerChange));\n  if (source.length <= 2) return source;\n  const byId = new Map(opportunities.flatMap((item) => item.eventIds.map((id) => [id, item] as const)));\n  const selected = new Set<string>();\n  const selectedSteps: LatentMovieCandidate["trajectory"] = [];\n\n  // The opening and terminal payoff are structural anchors. Everything between\n  // them must earn a viewer-facing place through experiential value, setup,\n  // recontextualization, consequence, or a strong graph relationship.\n  selected.add(source[0].eventIds[0] ?? "");\n  selected.add(source[source.length - 1].eventIds[0] ?? "");\n\n  for (const step of source) {\n    const ids = step.eventIds ?? [];\n    const score = ids.reduce((max, id) => Math.max(max, byId.get(id)?.experientialValue ?? 0), 0);\n    const disposition = ids.map((id) => byId.get(id)?.disposition).find(Boolean);\n    const isStructuralOperation = /reframe|contrast|consequence|converge|escalate|recur/i.test(clean(step.operation));\n    if (score >= 0.48 || disposition === "primary" || disposition === "setup" || disposition === "payoff" || isStructuralOperation) {\n      ids.forEach((id) => selected.add(id));\n    }\n  }\n\n  for (const step of source) {\n    if (step.eventIds.some((id) => selected.has(id))) selectedSteps.push({ ...step, eventIds: [...step.eventIds] });\n  }\n  return selectedSteps.length >= 2 ? selectedSteps : [source[0], source[source.length - 1]];\n}\n\nfunction buildTrajectory(graph: RealityGraph, movie: LatentMovieCandidate, opportunities: CognitiveExperienceOpportunity[]): CognitiveReadoutObjective[] {\n  const steps = selectExperienceSteps(graph, movie, opportunities);`,
    "experience trajectory selection",
  );
}

write(cognitionPath, cognition);
write(moviePath, movie);
write(objectivePath, objective);

console.log("COGNITIVE EXPERIENCE OBJECTIVE WIRED");
console.log("- canonical Cognition owns experience objective");
console.log("- viewer-facing readout count is selected, not source-event-count driven");
console.log("- reality remains immutable source truth");
console.log("- future evidence is explicit withheld material");
console.log("- experience trajectory filters low-value intermediate events");
console.log("- Array.at compatibility fixed");
