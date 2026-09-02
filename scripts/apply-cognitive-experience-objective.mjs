import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cognitionPath = path.join(root, "apps/api/src/services/authorCognition.ts");
const moviePath = path.join(root, "apps/api/src/services/authorUniversalMovieSearch.ts");
const objectivePath = path.join(root, "apps/api/src/services/authorCognitiveExperienceObjective.ts");
const mouthPath = path.join(root, "apps/api/src/services/authorMouthCandidateSearchCanonical.ts");

function read(file) { return fs.readFileSync(file, "utf8"); }
function write(file, text) { fs.writeFileSync(file, text, "utf8"); }
function once(text, needle, replacement, label) {
  if (!text.includes(needle)) throw new Error(`Migration marker missing: ${label}`);
  return text.replace(needle, replacement);
}

let cognition = read(cognitionPath);
let movie = read(moviePath);
let objective = read(objectivePath);
let mouth = read(mouthPath);

// The migration itself must be idempotent. The previous version checked for a
// filename-shaped marker that was never present in source, so a perfectly valid
// current Cognition file failed before any wiring could occur.
if (!cognition.includes('from "./authorCognitiveExperienceObjective.js"')) {
  cognition = once(cognition, 'import { resolveLensPolicy } from "./authorLensPolicy.js";\n', 'import { resolveLensPolicy } from "./authorLensPolicy.js";\nimport { buildCognitiveExperienceObjective } from "./authorCognitiveExperienceObjective.js";\n', "cognition objective import");
}

if (!cognition.includes("experienceObjective?: ReturnType<typeof buildCognitiveExperienceObjective>")) {
  cognition = once(cognition, '  readoutPlan: CognitiveReadoutDecision[];\n', '  readoutPlan: CognitiveReadoutDecision[];\n  experienceObjective?: ReturnType<typeof buildCognitiveExperienceObjective>;\n', "experience objective plan field");
}

const oldMaterialization = `  const selectedMovie = materialized.movie;\n  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>\n    candidate.id === selectedMovie?.id && selectedMovie ? selectedMovie : candidate,\n  );`;

if (!cognition.includes("const experienceObjective =")) {
  cognition = once(cognition, oldMaterialization, `  const experienceObjective = selectedMovieSeed && input.realityGraph\n    ? buildCognitiveExperienceObjective(input.realityGraph, selectedMovieSeed)\n    : undefined;\n\n  const objectiveMovie = selectedMovieSeed && experienceObjective?.trajectory.length\n    ? {\n        ...selectedMovieSeed,\n        trajectory: experienceObjective.trajectory.map((decision, index) => {\n          const source = selectedMovieSeed.trajectory.find((step) =>\n            step.eventIds.some((id) => decision.eventIds.includes(id)),\n          ) ?? selectedMovieSeed.trajectory[index];\n          return {\n            ...(source ?? { order: index + 1, operation: "reveal", eventIds: decision.eventIds, viewerChange: "attention advances" }),\n            order: index + 1,\n            eventIds: decision.eventIds,\n            viewerChange: decision.attentionTarget || source?.viewerChange || "attention advances",\n            nextQuestion: decision.nextPressure,\n          };\n        }),\n      }\n    : materialized.movie;\n\n  const selectedMovie = objectiveMovie;\n  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>\n    candidate.id === selectedMovie?.id && selectedMovie ? selectedMovie : candidate,\n  );`, "objective movie materialization");
}

if (!cognition.includes("experienceObjective: experienceObjective")) {
  cognition = once(cognition, '    readoutPlan: materialized.decisions,\n', `    readoutPlan: experienceObjective?.trajectory.map((decision) => ({\n      order: decision.order,\n      eventIds: decision.eventIds,\n      purpose: decision.purpose,\n      currentEvidence: decision.currentEvidence,\n      futureEvidence: decision.futureEvidence,\n      viewerStateBefore: JSON.stringify(decision.viewerBefore),\n      viewerStateAfter: JSON.stringify(decision.viewerAfter),\n      attentionTarget: decision.attentionTarget,\n      withheldInformation: decision.withheldInformation,\n      nextPressure: decision.nextPressure,\n      terminal: decision.terminal,\n    })) ?? materialized.decisions,\n    experienceObjective: experienceObjective,\n`, "objective readout plan");
}

movie = movie.replaceAll('structures.at(-1)', 'structures[structures.length - 1]');
movie = movie.replaceAll('graph.events.at(-1)', 'graph.events[graph.events.length - 1]');

if (!objective.includes("function selectExperienceSteps")) {
  objective = once(objective, 'function buildTrajectory(graph: RealityGraph, movie: LatentMovieCandidate, opportunities: CognitiveExperienceOpportunity[]): CognitiveReadoutObjective[] {\n  const steps = movie.trajectory.filter((step) => step.eventIds.length || clean(step.viewerChange));', `function selectExperienceSteps(\n  graph: RealityGraph,\n  movie: LatentMovieCandidate,\n  opportunities: CognitiveExperienceOpportunity[],\n): LatentMovieCandidate["trajectory"] {\n  const source = movie.trajectory.filter((step) => step.eventIds.length || clean(step.viewerChange));\n  if (source.length <= 2) return source;\n  const byId = new Map(opportunities.flatMap((item) => item.eventIds.map((id) => [id, item] as const)));\n  const selected = new Set<string>();\n  const selectedSteps: LatentMovieCandidate["trajectory"] = [];\n\n  // Opening and terminal payoff anchor the experience. Intermediate events must\n  // earn a viewer-facing place through experiential value or structural function.\n  source[0].eventIds.forEach((id) => selected.add(id));\n  source[source.length - 1].eventIds.forEach((id) => selected.add(id));\n\n  for (const step of source) {\n    const ids = step.eventIds ?? [];\n    const score = ids.reduce((max, id) => Math.max(max, byId.get(id)?.experientialValue ?? 0), 0);\n    const dispositions = ids.map((id) => byId.get(id)?.disposition).filter(Boolean);\n    const structural = /reframe|contrast|consequence|converge|escalate|recur/i.test(clean(step.operation));\n    if (score >= 0.48 || dispositions.some((item) => item === "primary" || item === "setup" || item === "payoff") || structural) {\n      ids.forEach((id) => selected.add(id));\n    }\n  }\n\n  for (const step of source) {\n    if (step.eventIds.some((id) => selected.has(id))) selectedSteps.push({ ...step, eventIds: [...step.eventIds] });\n  }\n  return selectedSteps.length >= 2 ? selectedSteps : [source[0], source[source.length - 1]];\n}\n\nfunction buildTrajectory(graph: RealityGraph, movie: LatentMovieCandidate, opportunities: CognitiveExperienceOpportunity[]): CognitiveReadoutObjective[] {\n  const steps = selectExperienceSteps(graph, movie, opportunities);`, "experience trajectory selection");
}

if (!mouth.includes('authorExperienceCritic.js')) {
  mouth = once(mouth, 'import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";\n', 'import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";\nimport { evaluateAuthorExperienceCut } from "./authorExperienceCritic.js";\n', "mouth experience critic import");
}

if (!mouth.includes("const experienceCritic = evaluateAuthorExperienceCut")) {
  mouth = once(mouth, '  const forbidden = Math.max(unsupportedConcrete(value, beat, envelope), interpretation.unsupportedConcreteRisk);\n', `  const forbidden = Math.max(unsupportedConcrete(value, beat, envelope), interpretation.unsupportedConcreteRisk);\n  const experienceCritic = evaluateAuthorExperienceCut({\n    text: value,\n    currentEvidence: sourceLabels(beat, envelope),\n    futureEvidence: beat.next ? [clean(beat.next)] : [],\n    viewerBefore: { knows: [], expects: [], wonders: [], openQuestions: [] },\n    viewerAfter: { knows: [clean(beat.change)], expects: beat.next ? [clean(beat.next)] : [], wonders: beat.next ? [clean(beat.next)] : [], openQuestions: beat.next ? [clean(beat.next)] : [] },\n    attentionTarget: clean(beat.change || beat.attentionFunction),\n    withheldInformation: beat.frontier ? [clean(beat.frontier)] : [],\n    nextPressure: clean(beat.next || beat.frontier),\n    terminal: Boolean(beat.paysOff?.length),\n  });\n`, "mouth experience critic scoring");
}

if (!mouth.includes('experienceCritic.reasons.includes("fails-delete-test")')) {
  mouth = once(mouth, '  if (forbidden >= 0.9 || explain >= 0.95) {\n', `  if (!experienceCritic.accepted) {\n    return {\n      text: value, beatOrder: beat.order, supportedEventIds: [], supportedRelationPairs: [], groundingScore: experienceCritic.concreteGrounding, meaningScore: experienceCritic.meaningAccumulation, observerDiscoveryScore: experienceCritic.attentionMovement, transitionScore: experienceCritic.predictionShift, obligationCoverage: 0, relationContractScore: 0, forbiddenMoveRisk: 0.96, cohesionScore: 0, noveltyScore: novelty, compressionScore: form, inventionRisk: 0.96, repetitionRisk: 1 - novelty, collageRisk: 0, endpointExactness: 0, score: 0, reasons: ["experience-quality-failed", ...experienceCritic.reasons],\n    };\n  }\n\n  if (forbidden >= 0.9 || explain >= 0.95) {\n`, "mouth experience hard gate");
}

write(cognitionPath, cognition);
write(moviePath, movie);
write(objectivePath, objective);
write(mouthPath, mouth);

console.log("COGNITIVE EXPERIENCE OBJECTIVE + CRITIC WIRED");
console.log("- Cognition owns experience opportunities, viewer trajectory, reveal and withholding");
console.log("- viewer-facing readout count is selected, not source-event-count driven");
console.log("- RealityGraph remains immutable source truth");
console.log("- canonical Mouth now has a hard experience-quality gate");
console.log("- low-grounding / low-information / abstraction-heavy cuts can no longer pass structural green checks");
console.log("- future evidence remains reserved for later cuts");
console.log("- Array.at compatibility fixed");
