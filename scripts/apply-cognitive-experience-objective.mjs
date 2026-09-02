import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cognitionPath = path.join(root, "apps/api/src/services/authorCognition.ts");
const moviePath = path.join(root, "apps/api/src/services/authorUniversalMovieSearch.ts");
const objectivePath = path.join(root, "apps/api/src/services/authorCognitiveExperienceObjective.ts");
const mouthPath = path.join(root, "apps/api/src/services/authorMouthCandidateSearchCanonical.ts");

function read(file) { return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"); }
function write(file, text) { fs.writeFileSync(file, text.replace(/\r\n/g, "\n"), "utf8"); }
function once(text, needle, replacement, label) {
  const normalizedNeedle = needle.replace(/\r\n/g, "\n");
  if (!text.includes(normalizedNeedle)) throw new Error(`Migration marker missing: ${label}`);
  return text.replace(normalizedNeedle, replacement.replace(/\r\n/g, "\n"));
}
function importAfter(text, marker, importLine, label) {
  if (text.includes(importLine)) return text;
  return once(text, marker, `${marker}${importLine}\n`, label);
}

let cognition = read(cognitionPath);
let movie = read(moviePath);
let objective = read(objectivePath);
let mouth = read(mouthPath);

// Idempotent: do not key migration state off filenames or fragile line endings.
if (!cognition.includes('from "./authorCognitiveExperienceObjective.js"')) {
  const importMarker = 'import { resolveLensPolicy } from "./authorLensPolicy.js";';
  cognition = importAfter(cognition, `${importMarker}\n`, 'import { buildCognitiveExperienceObjective } from "./authorCognitiveExperienceObjective.js";', "cognition objective import");
}

if (!cognition.includes("experienceObjective?: ReturnType<typeof buildCognitiveExperienceObjective>")) {
  cognition = once(cognition, '  readoutPlan: CognitiveReadoutDecision[];\n', '  readoutPlan: CognitiveReadoutDecision[];\n  experienceObjective?: ReturnType<typeof buildCognitiveExperienceObjective>;\n', "experience objective plan field");
}

const oldMaterialization = `  const selectedMovie = materialized.movie;
  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>
    candidate.id === selectedMovie?.id && selectedMovie ? selectedMovie : candidate,
  );`;

if (!cognition.includes("const experienceObjective =")) {
  cognition = once(cognition, oldMaterialization, `  const experienceObjective = selectedMovieSeed && input.realityGraph
    ? buildCognitiveExperienceObjective(input.realityGraph, selectedMovieSeed)
    : undefined;

  const objectiveMovie = selectedMovieSeed && experienceObjective?.trajectory.length
    ? {
        ...selectedMovieSeed,
        trajectory: experienceObjective.trajectory.map((decision, index) => {
          const source = selectedMovieSeed.trajectory.find((step) =>
            step.eventIds.some((id) => decision.eventIds.includes(id)),
          ) ?? selectedMovieSeed.trajectory[index];
          return {
            ...(source ?? { order: index + 1, operation: "reveal", eventIds: decision.eventIds, viewerChange: "attention advances" }),
            order: index + 1,
            eventIds: decision.eventIds,
            viewerChange: decision.attentionTarget || source?.viewerChange || "attention advances",
            nextQuestion: decision.nextPressure,
          };
        }),
      }
    : materialized.movie;

  const selectedMovie = objectiveMovie;
  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>
    candidate.id === selectedMovie?.id && selectedMovie ? selectedMovie : candidate,
  );`, "objective movie materialization");
}

if (!cognition.includes("experienceObjective: experienceObjective")) {
  cognition = once(cognition, '    readoutPlan: materialized.decisions,\n', `    readoutPlan: experienceObjective?.trajectory.map((decision) => ({
      order: decision.order,
      eventIds: decision.eventIds,
      purpose: decision.purpose,
      currentEvidence: decision.currentEvidence,
      futureEvidence: decision.futureEvidence,
      viewerStateBefore: JSON.stringify(decision.viewerBefore),
      viewerStateAfter: JSON.stringify(decision.viewerAfter),
      attentionTarget: decision.attentionTarget,
      withheldInformation: decision.withheldInformation,
      nextPressure: decision.nextPressure,
      terminal: decision.terminal,
    })) ?? materialized.decisions,
    experienceObjective: experienceObjective,
`, "objective readout plan");
}

movie = movie.replaceAll('structures.at(-1)', 'structures[structures.length - 1]');
movie = movie.replaceAll('graph.events.at(-1)', 'graph.events[graph.events.length - 1]');

if (!objective.includes("function selectExperienceSteps")) {
  objective = once(objective, 'function buildTrajectory(graph: RealityGraph, movie: LatentMovieCandidate, opportunities: CognitiveExperienceOpportunity[]): CognitiveReadoutObjective[] {\n  const steps = movie.trajectory.filter((step) => step.eventIds.length || clean(step.viewerChange));', `function selectExperienceSteps(
  graph: RealityGraph,
  movie: LatentMovieCandidate,
  opportunities: CognitiveExperienceOpportunity[],
): LatentMovieCandidate["trajectory"] {
  const source = movie.trajectory.filter((step) => step.eventIds.length || clean(step.viewerChange));
  if (source.length <= 2) return source;
  const byId = new Map(opportunities.flatMap((item) => item.eventIds.map((id) => [id, item] as const)));
  const selected = new Set<string>();
  const selectedSteps: LatentMovieCandidate["trajectory"] = [];

  source[0].eventIds.forEach((id) => selected.add(id));
  source[source.length - 1].eventIds.forEach((id) => selected.add(id));

  for (const step of source) {
    const ids = step.eventIds ?? [];
    const score = ids.reduce((max, id) => Math.max(max, byId.get(id)?.experientialValue ?? 0), 0);
    const dispositions = ids.map((id) => byId.get(id)?.disposition).filter(Boolean);
    const structural = /reframe|contrast|consequence|converge|escalate|recur/i.test(clean(step.operation));
    if (score >= 0.48 || dispositions.some((item) => item === "primary" || item === "setup" || item === "payoff") || structural) {
      ids.forEach((id) => selected.add(id));
    }
  }

  for (const step of source) {
    if (step.eventIds.some((id) => selected.has(id))) selectedSteps.push({ ...step, eventIds: [...step.eventIds] });
  }
  return selectedSteps.length >= 2 ? selectedSteps : [source[0], source[source.length - 1]];
}

function buildTrajectory(graph: RealityGraph, movie: LatentMovieCandidate, opportunities: CognitiveExperienceOpportunity[]): CognitiveReadoutObjective[] {
  const steps = selectExperienceSteps(graph, movie, opportunities);`, "experience trajectory selection");
}

if (!mouth.includes('authorExperienceCritic.js')) {
  mouth = importAfter(
    mouth,
    'import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";\n',
    'import { evaluateAuthorExperienceCut } from "./authorExperienceCritic.js";',
    "mouth experience critic import",
  );
}

if (!mouth.includes("const experienceCritic = evaluateAuthorExperienceCut")) {
  mouth = once(mouth, '  const forbidden = Math.max(unsupportedConcrete(value, beat, envelope), interpretation.unsupportedConcreteRisk);\n', `  const forbidden = Math.max(unsupportedConcrete(value, beat, envelope), interpretation.unsupportedConcreteRisk);
  const experienceCritic = evaluateAuthorExperienceCut({
    text: value,
    currentEvidence: sourceLabels(beat, envelope),
    futureEvidence: beat.next ? [clean(beat.next)] : [],
    viewerBefore: { knows: [], expects: [], wonders: [], openQuestions: [] },
    viewerAfter: { knows: [clean(beat.change)], expects: beat.next ? [clean(beat.next)] : [], wonders: beat.next ? [clean(beat.next)] : [], openQuestions: beat.next ? [clean(beat.next)] : [] },
    attentionTarget: clean(beat.change || beat.attentionFunction),
    withheldInformation: beat.frontier ? [clean(beat.frontier)] : [],
    nextPressure: clean(beat.next || beat.frontier),
    terminal: Boolean(beat.paysOff?.length),
  });
`, "mouth experience critic scoring");
}

if (!mouth.includes('experience-quality-failed')) {
  mouth = once(mouth, '  if (forbidden >= 0.9 || explain >= 0.95) {\n', `  if (!experienceCritic.accepted) {
    return {
      text: value, beatOrder: beat.order, supportedEventIds: [], supportedRelationPairs: [], groundingScore: experienceCritic.concreteGrounding, meaningScore: experienceCritic.meaningAccumulation, observerDiscoveryScore: experienceCritic.attentionMovement, transitionScore: experienceCritic.predictionShift, obligationCoverage: 0, relationContractScore: 0, forbiddenMoveRisk: 0.96, cohesionScore: 0, noveltyScore: novelty, compressionScore: form, inventionRisk: 0.96, repetitionRisk: 1 - novelty, collageRisk: 0, endpointExactness: 0, score: 0, reasons: ["experience-quality-failed", ...experienceCritic.reasons],
    };
  }

  if (forbidden >= 0.9 || explain >= 0.95) {
`, "mouth experience hard gate");
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
