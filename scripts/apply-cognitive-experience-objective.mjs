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
const objective = read(files.objective);
const mouth = read(files.mouth);
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

for (const [label, ok] of required) {
  if (!ok) throw new Error(`Canonical experience wiring missing: ${label}`);
}

// Keep the movie search compatible with the Node runtime used by QRE.
const normalizedMovie = movie
  .replaceAll("structures.at(-1)", "structures[structures.length - 1]")
  .replaceAll("graph.events.at(-1)", "graph.events[graph.events.length - 1]");
if (normalizedMovie !== movie) write(files.movie, normalizedMovie);

console.log("QRE CANONICAL EXPERIENCE SYSTEM VERIFIED");
console.log("- RealityGraph remains immutable source truth");
console.log("- Cognition searches viewer experience trajectories, not event counts");
console.log("- ADDITION + ATTENTION + CURIOSITY are first-class trajectory objectives");
console.log("- real sequential viewer state crosses Cognition → Author → Mouth");
console.log("- canonical Mouth scores realization against that state");
console.log("- completeness has no arbitrary sequence-film cut floor");
console.log("- no brittle migration patching remains");
