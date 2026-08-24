import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
if (!fs.existsSync(target)) throw new Error(`Missing canonical author brain: ${target}`);

let source = fs.readFileSync(target, "utf8");

const localModelImport = 'import { localModelGenerate } from "./localModelRuntime.js";';
const adapterImport = 'import { normalizeLatentMovieBeatPlan } from "./authorLatentMovieBeatAdapter.js";';
const recoveryImport = /\r?\nimport \{\r?\n\s*recoverBeatPlanFromLatentMovie,?\r?\n\} from "\.\/authorBeatPlanRecovery\.js";\r?\n/;

if (recoveryImport.test(source)) {
  source = source.replace(recoveryImport, "\n");
  console.log("PATCHED: removed latent-movie recovery import");
} else {
  console.log("ALREADY: latent-movie recovery import absent");
}

if (!source.includes(adapterImport)) {
  if (!source.includes(localModelImport)) {
    throw new Error("PATCH FAILED: cannot find localModelGenerate import anchor");
  }
  source = source.replace(localModelImport, `${localModelImport}\n${adapterImport}`);
  console.log("PATCHED: imported canonical latent-movie beat adapter");
} else {
  console.log("ALREADY: canonical latent-movie beat adapter imported");
}

const beatAuthority = /let beatPlan\s*=\s*buildFallbackBeatPlan\([\s\S]*?\);\r?\n\s*\r?\n\s*let beatPlanRetries\s*=\s*0\s*;/m;
const replacement = `let beatPlan =\n    normalizeLatentMovieBeatPlan(\n      cognition.latentMovieCandidates?.[0],\n    );\n\n  let beatPlanRetries =\n    0;`;

if (beatAuthority.test(source)) {
  source = source.replace(beatAuthority, replacement);
  console.log("PATCHED: selected latent movie is sole initial beat authority");
} else if (source.includes("normalizeLatentMovieBeatPlan(\n      cognition.latentMovieCandidates?.[0],")) {
  console.log("ALREADY: selected latent movie is sole initial beat authority");
} else {
  throw new Error("PATCH FAILED: could not locate current beat-plan authority block");
}

const fallbackComment = /\/\/\s*latent movie recovery may be used as a fallback[^\n]*\r?\n/gi;
source = source.replace(fallbackComment, "");

fs.writeFileSync(target, source, "utf8");
console.log("AUTHOR MOVIE HANDOFF V6 COMPLETE");
console.log("  selected LatentMovieCandidate now enters the Beat Plan directly");
console.log("  recovery no longer owns semantic beat selection");
console.log("  graph eventIds remain attached to beats");
