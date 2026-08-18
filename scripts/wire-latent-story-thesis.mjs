import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const backup = `${target}.latent-thesis.bak`;

let source = fs.readFileSync(target, "utf8");

const replacements = [
  [
    'import { buildAuthorCognitivePlan } from "./authorCognition.js";\n',
    'import { buildAuthorCognitivePlan } from "./authorCognition.js";\nimport { deriveLatentStoryThesis } from "./authorLatentStoryThesis.js";\n',
  ],
  [
    '  const selectedLatentMovie =\n  cognition.latentMovieCandidates?.[0];\n',
    '  const selectedLatentMovie =\n  cognition.latentMovieCandidates?.[0];\n\n  const latentStoryThesis = selectedLatentMovie\n    ? deriveLatentStoryThesis(realityGraph, selectedLatentMovie)\n    : undefined;\n',
  ],
  [
    '      callbackTargets: cognition.callbackTargets,\n      sceneRules: cognition.sceneRules,\n',
    '      callbackTargets: cognition.callbackTargets,\n      sceneRules: cognition.sceneRules,\n      latentStoryThesis,\n',
  ],
  [
    '      latentMovieCandidates: cognition.latentMovieCandidates.slice(0, 4),\n    };\n',
    '      latentMovieCandidates: cognition.latentMovieCandidates.slice(0, 4),\n      latentStoryThesis,\n    };\n',
  ],
  [
    '      latentMovie: cognition.latentMovieCandidates?.[0] ?? null,\n      allowedMoves:',
    '      latentMovie: cognition.latentMovieCandidates?.[0] ?? null,\n      latentStoryThesis,\n      allowedMoves:',
  ],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) {
    throw new Error(`Expected wiring anchor was not found:\n${from}`);
  }
  source = source.replace(from, to);
}

fs.writeFileSync(backup, fs.readFileSync(target, "utf8"), "utf8");
fs.writeFileSync(target, source, "utf8");

console.log("Wired LatentStoryThesis into authorBrainUniversal.ts.");
console.log(`Backup: ${path.relative(root, backup)}`);
