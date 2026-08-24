import fs from "node:fs";

const BRAIN = "apps/api/src/services/authorBrainUniversal.ts";
const MOVIE = "apps/api/src/services/authorLatentMovieSearch.ts";

function replaceOnce(path, pattern, replacement, label) {
  const text = fs.readFileSync(path, "utf8");
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`PATCH FAILED: ${label}`);
  fs.writeFileSync(path, next, "utf8");
  console.log(`PATCHED: ${label}`);
}

replaceOnce(
  BRAIN,
  /buildFallbackBeatPlan\(\s*cognition\s*,\s*realityGraph\s*\)/m,
  "buildFallbackBeatPlan(cognition)",
  "authorBrainUniversal.ts · use selected movie with current signature",
);

replaceOnce(
  MOVIE,
  /function endpointIdFor\(\s*graph:\s*RealityGraph,\s*_convergence:\s*LatentMovieConvergence,\s*\):\s*string\s*\{\s*return graph\.events\[graph\.events\.length\s*-\s*1\]\?\.id \?\? \"\";\s*\}/m,
  `function endpointIdFor(\n  _graph: RealityGraph,\n  convergence: LatentMovieConvergence,\n): string {\n  return convergence.endpointId;\n}`,
  "authorLatentMovieSearch.ts · honor explicit convergence endpoint",
);

console.log("AUTHOR MOVIE AUTHORITY V3 COMPLETE");
