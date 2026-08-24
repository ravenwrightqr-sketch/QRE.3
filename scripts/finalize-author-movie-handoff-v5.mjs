import fs from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), "apps/api/src/services/authorBrainUniversal.ts");
if (!fs.existsSync(target)) throw new Error(`Missing canonical author brain: ${target}`);

let text = fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n");

function replaceOnce(label, pattern, replacement) {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`PATCH FAILED: ${label}`);
  text = next;
  console.log(`PATCHED: ${label}`);
}

// Remove the old semantic recovery authority.
text = text.replace(/^import \{\s*recoverBeatPlanFromLatentMovie,\s*\} from "\.\/authorBeatPlanRecovery\.js";\n/m, "");
console.log("PATCHED: removed latent-movie recovery import");

replaceOnce(
  "import canonical latent-movie beat adapter",
  /import \{ localModelGenerate \} from "\.\/localModelRuntime\.js";\n/,
  'import { localModelGenerate } from "./localModelRuntime.js";\nimport { normalizeLatentMovieBeatPlan } from "./authorLatentMovieBeatAdapter.js";\n',
);

// The canonical Beat Plan must come directly from the selected movie.
replaceOnce(
  "selected latent movie is sole beat authority",
  /let beatPlan =\s*buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,\s*\);/m,
  'let beatPlan = normalizeLatentMovieBeatPlan(cognition.latentMovieCandidates?.[0]);',
);

// Do not invoke the old recovery helper anywhere else in this file.
if (/recoverBeatPlanFromLatentMovie/.test(text)) {
  throw new Error("PATCH FAILED: latent-movie recovery helper still referenced in authorBrainUniversal.ts");
}

// Preserve RealityGraph provenance through the existing BeatPlan -> SequenceCut path.
if (/sourceIds:\s*\[\],/.test(text)) {
  text = text.replace(/sourceIds:\s*\[\],/g, "sourceIds: beat.eventIds ?? [],");
  console.log("PATCHED: preserved beat eventIds into SequenceCut.sourceIds");
} else {
  console.log("ALREADY: no empty SequenceCut sourceIds initializer found");
}

fs.writeFileSync(target, text, "utf8");
console.log("AUTHOR MOVIE HANDOFF V5 COMPLETE");
console.log("  selected LatentMovieCandidate -> normalizeLatentMovieBeatPlan -> Beat Graph");
console.log("  old recovery path removed as semantic authority");
console.log("  RealityGraph provenance preserved");
