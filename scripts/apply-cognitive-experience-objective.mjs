import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  cognition: path.join(root, "apps/api/src/services/authorCognition.ts"),
  brain: path.join(root, "apps/api/src/services/authorBrainCanonical.ts"),
  movie: path.join(root, "apps/api/src/services/authorUniversalMovieSearch.ts"),
  objective: path.join(root, "apps/api/src/services/authorCognitiveExperienceObjective.ts"),
  mouth: path.join(root, "apps/api/src/services/authorMouthCandidateSearchCanonical.ts"),
  critic: path.join(root, "apps/api/src/services/authorExperienceCritic.ts"),
};

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, text) {
  fs.writeFileSync(file, text.replace(/\r\n/g, "\n"), "utf8");
}

const cognition = read(files.cognition);
const brain = read(files.brain);
const movie = read(files.movie);
let objective = read(files.objective);
let mouth = read(files.mouth);
const critic = read(files.critic);

const required = [
  ["Cognition → experience objective", cognition.includes("buildCognitiveExperienceObjective")],
  ["Cognition → structured experience viewer state", cognition.includes("experienceViewerBefore") && cognition.includes("experienceViewerAfter")],
  ["Author → canonical viewer state owner", brain.includes("./authorViewerStateCut.js")],
  ["Author → experience-driven completeness", brain.includes("experienceJobsComplete")],
  ["Experience search → sequence optimization", objective.includes("selectExperienceTrajectory")],
  ["Experience objective → ADDITION", objective.includes("addition")],
  ["Experience objective → ATTENTION", objective.includes("attentionMovement")],
  ["Experience objective → CURIOSITY", objective.includes("curiosity")],
  ["Mouth → experience critic", mouth.includes("evaluateAuthorExperienceCut")],
  ["Critic → first-class addition", critic.includes("addition")],
  ["Critic → first-class curiosity", critic.includes("curiosity")],
];
for (const [label, ok] of required) if (!ok) throw new Error(`Canonical experience wiring missing: ${label}`);

const start = objective.indexOf("function sequenceScore(");
const end = objective.indexOf("function buildTrajectory(", start);
if (start < 0 || end < 0 || end <= start) throw new Error("Experience trajectory search boundary not found");

const replacement = String.raw`
function pairRelationshipScore(graph: RealityGraph, leftIds: readonly string[], rightIds: readonly string[]): number {
  let best = 0;
  for (const left of leftIds) for (const right of rightIds) best = Math.max(best, relationScore(graph, left, right));
  return clamp(best);
}

function pairRelationshipKinds(graph: RealityGraph, leftIds: readonly string[], rightIds: readonly string[]): string[] {
  return uniq(leftIds.flatMap((left) => rightIds.flatMap((right) => relationKinds(graph, left, right))), 8);
}

function sequenceScore(
  graph: RealityGraph,
  steps: LatentMovieCandidate["trajectory"],
  opportunitiesById: Map<string, CognitiveExperienceOpportunity>,
): number {
  if (steps.length < 2) return 0;
  const states = initialState();
  let base = 0;
  let previous: LatentMovieCandidate["trajectory"][number] | undefined;

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const current = evidenceFor(graph, step.eventIds);
    const futureSteps = steps.slice(index + 1);
    const future = evidenceFor(graph, futureSteps.flatMap((item) => item.eventIds));
    const opportunity = step.eventIds.map((id) => opportunitiesById.get(id)).find(Boolean);
    const scored = candidateTransitionScore(graph, step, previous, states, future, opportunity, index, steps.length);
    base += scored.addition * 0.22 + scored.attention * 0.2 + scored.curiosity * 0.24 + scored.value * 0.14;
    states.hasSeen.push(...current);
    states.knows.push(...current);
    states.wonders = future.length ? [clean(step.nextQuestion) || "What changes next?"] : [];
    previous = step;
  }

  let interaction = 0;
  let dependency = 0;
  let retainedJobs = 0;
  for (let index = 1; index < steps.length - 1; index += 1) {
    const previousStep = steps[index - 1];
    const currentStep = steps[index];
    const nextStep = steps[index + 1];
    const currentOpportunity = currentStep.eventIds.map((id) => opportunitiesById.get(id)).find(Boolean);
    const previousToCurrent = pairRelationshipScore(graph, previousStep.eventIds, currentStep.eventIds);
    const currentToNext = pairRelationshipScore(graph, currentStep.eventIds, nextStep.eventIds);
    const currentToTerminal = pairRelationshipScore(graph, currentStep.eventIds, steps[steps.length - 1].eventIds);
    const kinds = pairRelationshipKinds(graph, currentStep.eventIds, nextStep.eventIds);
    const futureValue = currentOpportunity?.futurePotential ?? 0;
    const recontext = currentOpportunity?.recontextualizationPotential ?? 0;
    const causal = currentOpportunity?.causalImportance ?? 0;
    const bridge = clamp(
      previousToCurrent * 0.14 +
      currentToNext * 0.3 +
      currentToTerminal * 0.18 +
      futureValue * 0.16 +
      recontext * 0.14 +
      causal * 0.08 +
      (kinds.includes("recontextualizes") ? 0.2 : 0) +
      (kinds.includes("contrasts") ? 0.12 : 0),
    );
    const transition = candidateTransitionScore(
      graph,
      currentStep,
      previousStep,
      initialState(),
      evidenceFor(graph, steps.slice(index + 1).flatMap((item) => item.eventIds)),
      currentOpportunity,
      index,
      steps.length,
    );
    const job = clamp(transition.addition * 0.32 + transition.attention * 0.26 + transition.curiosity * 0.28 + bridge * 0.14);
    interaction += clamp(bridge * 0.52 + job * 0.48);
    dependency += clamp(
      currentToNext * 0.32 + currentToTerminal * 0.22 +
      futureValue * 0.18 + recontext * 0.18 +
      (kinds.length ? 0.1 : 0),
    );
    if (job >= 0.42 || bridge >= 0.42) retainedJobs += 1;
  }

  const interiorCount = Math.max(0, steps.length - 2);
  const interactionAverage = interiorCount ? interaction / interiorCount : 0;
  const dependencyAverage = interiorCount ? dependency / interiorCount : 0;
  const richness = interiorCount ? retainedJobs / interiorCount : 0;
  const terminal = steps[steps.length - 1];
  const terminalOpportunity = terminal.eventIds.map((id) => opportunitiesById.get(id)).find(Boolean);
  const terminalSetup = pairRelationshipScore(graph, steps.slice(0, -1).flatMap((step) => step.eventIds), terminal.eventIds);
  const payoffDependency = clamp(
    terminalSetup * 0.42 +
    dependencyAverage * 0.24 +
    (terminalOpportunity?.payoffPotential ?? 0) * 0.22 +
    (terminalOpportunity?.recontextualizationPotential ?? 0) * 0.12,
  );

  // Length is not rewarded by itself. A longer sequence wins only when its
  // intermediate beats create relationships/dependencies that disappear when removed.
  return round(
    base / steps.length +
    interactionAverage * 0.2 +
    dependencyAverage * 0.16 +
    richness * 0.08 +
    payoffDependency * 0.14,
  );
}

function selectExperienceTrajectory(
  graph: RealityGraph,
  movie: LatentMovieCandidate,
  opportunities: CognitiveExperienceOpportunity[],
): LatentMovieCandidate["trajectory"] {
  const source = movie.trajectory
    .filter((step) => step.eventIds.length || clean(step.viewerChange))
    .map((step) => ({ ...step, eventIds: [...step.eventIds] }));
  if (source.length <= 2) return source;

  const byId = new Map(opportunities.flatMap((item) => item.eventIds.map((id) => [id, item] as const)));
  const maxExactInterior = 12;
  const candidates: Array<{ steps: LatentMovieCandidate["trajectory"]; score: number }> = [];

  if (source.length <= maxExactInterior + 2) {
    const interior = source.slice(1, -1);
    const combinations = 1 << interior.length;
    for (let mask = 0; mask < combinations; mask += 1) {
      const steps = [source[0]];
      for (let index = 0; index < interior.length; index += 1) {
        if ((mask & (1 << index)) !== 0) steps.push(interior[index]);
      }
      steps.push(source[source.length - 1]);
      candidates.push({ steps, score: sequenceScore(graph, steps, byId) });
    }
  } else {
    const beam: Array<{ steps: LatentMovieCandidate["trajectory"]; score: number }> = [{ steps: [source[0]], score: 0 }];
    for (let index = 1; index < source.length - 1; index += 1) {
      const next: typeof beam = [];
      for (const candidate of beam) {
        next.push({ steps: [...candidate.steps], score: candidate.score });
        const included = [...candidate.steps, source[index]];
        next.push({ steps: included, score: sequenceScore(graph, included, byId) });
      }
      next.sort((a, b) => b.score - a.score);
      beam.splice(0, beam.length, ...next.slice(0, 48));
    }
    for (const candidate of beam) {
      const steps = [...candidate.steps, source[source.length - 1]];
      candidates.push({ steps, score: sequenceScore(graph, steps, byId) });
    }
  }

  candidates.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.035) return b.score - a.score;
    return b.steps.length - a.steps.length;
  });

  // Counterfactual rule: do not delete a supplied intermediate beat merely
  // because the shorter sequence averages better. If the beat creates a
  // meaningful dependency, it survives. Deletion must win decisively.
  const best = candidates[0]?.steps ?? source;
  const bestScore = candidates[0]?.score ?? 0;
  const fullScore = sequenceScore(graph, source, byId);
  if (fullScore >= bestScore - 0.035) return source;
  return best.length >= 2 ? best : [source[0], source[source.length - 1]];
}
`;

objective = objective.slice(0, start) + replacement + objective.slice(end);
write(files.objective, objective);

// The critic must not be fed serialized viewer state as an "attention target".
mouth = mouth.replace(
  "previousAttentionTarget: clean(beat.viewerState?.beforeState),",
  "previousAttentionTarget: undefined,",
);
write(files.mouth, mouth);

const normalizedMovie = movie
  .replaceAll("structures.at(-1)", "structures[structures.length - 1]")
  .replaceAll("graph.events.at(-1)", "graph.events[graph.events.length - 1]");
if (normalizedMovie !== movie) write(files.movie, normalizedMovie);

console.log("QRE EXPERIENCE SEARCH v2 APPLIED");
console.log("- exact bounded subsequence search for normal sequences");
console.log("- counterfactual deletion/dependency scoring");
console.log("- interaction and payoff dependency are sequence-level objectives");
console.log("- longer sequences win only when their beats do real experiential work");
console.log("- serialized viewer state is no longer misused as previous attention target");
console.log("- RealityGraph and canonical Author → Cognition → Mouth wiring unchanged");
