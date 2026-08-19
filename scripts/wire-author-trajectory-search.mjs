import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorCognition.ts");

if (!fs.existsSync(target)) {
  throw new Error(`Missing target: ${target}`);
}

const original = fs.readFileSync(target, "utf8");

if (original.includes('from "./authorTrajectorySearch.js"')) {
  console.log("Trajectory search wiring already present.");
  process.exit(0);
}

const importAnchor = 'import { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";';
const importReplacement = `${importAnchor}\nimport { searchBestMovieTrajectories } from "./authorTrajectorySearch.js";`;

if (!original.includes(importAnchor)) {
  throw new Error("Could not find latent movie import anchor; refusing to patch.");
}

const movieBlock = `  const latentMovieCandidates = input.realityGraph\n    ? searchLatentMovieCandidates({\n        graph: input.realityGraph,\n        subject: input.subject,\n        lens: input.lens,\n        limit: 6,\n      })\n    : [];\n\n  if (input.realityGraph) {\n    input.realityGraph.latentMovieCandidates = latentMovieCandidates;\n  }`;

const movieReplacement = `  const explicitDataMode = clean(input.lens).toLowerCase() === "data";\n\n  const discoveredMovieCandidates =\n    input.realityGraph && !explicitDataMode\n      ? searchLatentMovieCandidates({\n          graph: input.realityGraph,\n          subject: input.subject,\n          lens: input.lens,\n          limit: 8,\n        })\n      : [];\n\n  const latentMovieCandidates =\n    input.realityGraph && !explicitDataMode\n      ? searchBestMovieTrajectories(\n          input.realityGraph,\n          discoveredMovieCandidates,\n          {\n            endpointEventId:\n              input.realityGraph.events.at(-1)?.id ?? "",\n            beamWidth: 6,\n            maxSteps: 5,\n            requireEndpoint: Boolean(input.realityGraph.events.length),\n          },\n        )\n      : [];\n\n  if (input.realityGraph) {\n    input.realityGraph.latentMovieCandidates = latentMovieCandidates;\n  }`;

if (!original.includes(movieBlock)) {
  throw new Error("Could not find the canonical latent-movie block; refusing to patch.");
}

const backup = `${target}.pre-trajectory-${new Date().toISOString().replace(/[:.]/g, "-")}.bak`;
fs.writeFileSync(backup, original, "utf8");

const patched = original
  .replace(importAnchor, importReplacement)
  .replace(movieBlock, movieReplacement);

if (patched === original) {
  throw new Error("Patch produced no change; refusing to write.");
}

fs.writeFileSync(target, patched, "utf8");

console.log(`Trajectory search wired into ${target}`);
console.log(`Backup created at ${backup}`);
console.log("DATA MODE: explicit lens=\"data\" bypasses latent-movie search.");
console.log("CREATIVE MODE: latent candidates are expanded into whole-trajectory search before Beat Graph planning.");
