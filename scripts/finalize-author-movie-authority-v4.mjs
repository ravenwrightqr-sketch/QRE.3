import fs from "node:fs";

const path = "apps/api/src/services/authorBrainUniversal.ts";
let text = fs.readFileSync(path, "utf8");

function replaceOnce(pattern, replacement, label) {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`PATCH FAILED: ${label}`);
  text = next;
  console.log(`PATCHED: ${label}`);
}

replaceOnce(
  /import \{\s*recoverBeatPlanFromLatentMovie,?\s*\} from "\.\/authorBeatPlanRecovery\.js";\s*/m,
  'import { normalizeLatentMovieBeatPlan } from "./authorLatentMovieBeatAdapter.js";\n',
  "remove recovery import and use canonical latent-movie adapter",
);

replaceOnce(
  /let beatPlan =\s*buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,?\s*\);/m,
  'const selectedLatentMovie = cognition.latentMovieCandidates?.[0];\n\n  let beatPlan = selectedLatentMovie\n    ? normalizeLatentMovieBeatPlan(selectedLatentMovie)\n    : undefined;',
  "selected latent movie is the sole Beat Plan authority",
);

replaceOnce(
  /\n\s*beatPlanRetries =\s*1;\s*\n\s*result =\s*await localModelGenerate\(/m,
  '\n      beatPlanRetries = 1;\n\n      result = await localModelGenerate(',
  "preserve serialization retry only",
);

fs.writeFileSync(path, text);
console.log("AUTHOR MOVIE AUTHORITY V4 COMPLETE");
console.log("Selected latent movie now compiles directly into the Beat Plan.");
