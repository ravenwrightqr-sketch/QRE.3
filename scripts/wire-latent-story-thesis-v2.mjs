import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const backup = `${target}.latent-thesis-v2.bak`;

let source = fs.readFileSync(target, "utf8");

const importAnchor = 'import { buildAuthorCognitivePlan } from "./authorCognition.js";\n';
const importReplacement = `${importAnchor}import { deriveLatentStoryThesis } from "./authorLatentStoryThesis.js";\n`;

if (!source.includes(importAnchor)) {
  throw new Error("Could not find author cognition import anchor.");
}
if (!source.includes('from "./authorLatentStoryThesis.js"')) {
  source = source.replace(importAnchor, importReplacement);
}

const cognitionAnchor = '  const risk = inferRiskDial(input, cognition);\n';
const cognitionReplacement = `  const selectedLatentMovie = cognition.latentMovieCandidates?.[0];\n  const latentStoryThesis = selectedLatentMovie\n    ? deriveLatentStoryThesis(realityGraph, selectedLatentMovie)\n    : undefined;\n\n${cognitionAnchor}`;

if (!source.includes(cognitionAnchor)) {
  throw new Error("Could not find cognition-to-risk anchor.");
}
if (!source.includes("const latentStoryThesis")) {
  source = source.replace(cognitionAnchor, cognitionReplacement);
}

const oldSelectedMovieBlock = `const selectedLatentMovie =\n  cognition.latentMovieCandidates?.[0];\n\nconst recoveredBeatPlan =`;
const replacementBlock = `const recoveredBeatPlan =`;
if (source.includes(oldSelectedMovieBlock)) {
  source = source.replace(oldSelectedMovieBlock, replacementBlock);
}

const diagnosticAnchor = `      callbackTargets: cognition.callbackTargets,\n      sceneRules: cognition.sceneRules,\n`;
if (source.includes(diagnosticAnchor) && !source.includes('      latentStoryThesis,\n')) {
  source = source.replace(
    diagnosticAnchor,
    `${diagnosticAnchor}      latentStoryThesis,\n`,
  );
}

const mouthCognitionAnchor = `      latentMovieCandidates: cognition.latentMovieCandidates.slice(0, 4),\n`;
if (source.includes(mouthCognitionAnchor) && !source.includes('      latentStoryThesis,\n    };')) {
  source = source.replace(
    mouthCognitionAnchor,
    `${mouthCognitionAnchor}      latentStoryThesis,\n`,
  );
}

const beatContextAnchor = `      latentMovie: cognition.latentMovieCandidates?.[0] ?? null,\n      allowedMoves:`;
if (source.includes(beatContextAnchor)) {
  source = source.replace(
    beatContextAnchor,
    `      latentMovie: cognition.latentMovieCandidates?.[0] ?? null,\n      latentStoryThesis,\n      allowedMoves:`,
  );
}

fs.writeFileSync(backup, fs.readFileSync(target, "utf8"), "utf8");
fs.writeFileSync(target, source, "utf8");

console.log("LatentStoryThesis wiring applied to authorBrainUniversal.ts.");
console.log(`Backup: ${path.relative(root, backup)}`);
