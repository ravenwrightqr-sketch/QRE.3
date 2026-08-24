import fs from "node:fs";

const BRAIN = "apps/api/src/services/authorBrainUniversal.ts";
const MOVIE = "apps/api/src/services/authorLatentMovieSearch.ts";

function replaceOnce(path, pattern, replacement, label) {
  const text = fs.readFileSync(path, "utf8");
  if (!pattern.test(text)) throw new Error(`PATCH FAILED: ${label}`);
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`PATCH FAILED: ${label}`);
  fs.writeFileSync(path, next, "utf8");
  console.log(`PATCHED: ${label}`);
}

replaceOnce(
  BRAIN,
  /import \{\n  recoverBeatPlanFromLatentMovie,\n\} from "\.\/authorBeatPlanRecovery\.js";/m,
  'import { normalizeLatentMovieBeatPlan } from "./authorLatentMovieBeatAdapter.js";',
  "authorBrainUniversal.ts · replace recovery authority with latent-movie adapter",
);

replaceOnce(
  BRAIN,
  /function buildFallbackBeatPlan\([\s\S]*?\n}\n\nfunction buildBeatMessages/m,
  `function buildFallbackBeatPlan(\n  cognition: ReturnType<typeof buildAuthorCognitivePlan>,\n): BeatPlan | undefined {\n  const selected = cognition.latentMovieCandidates?.[0];\n  if (!selected) return undefined;\n  return normalizeBeatPlan(normalizeLatentMovieBeatPlan(selected));\n}\n\nfunction buildBeatMessages`,
  "authorBrainUniversal.ts · selected latent movie is sole beat authority",
);

replaceOnce(
  MOVIE,
  /  const ordered = unique\(\n    convergence\.forwardPath\.length \? convergence\.forwardPath : anchors,\n  \);/m,
  `  const seed = unique(\n    convergence.forwardPath.length ? convergence.forwardPath : anchors,\n  ).filter((id) => id !== endpointId);\n  const ordered: string[] = [];\n  const opening = seed[0] ?? graph.events.find((event) => event.id !== endpointId)?.id;\n  if (opening) ordered.push(opening);\n\n  const relationKindScore = (kind: RealityRelation["kind"]): number => {\n    switch (kind) {\n      case "contrasts": return 1;\n      case "recontextualizes": return 0.96;\n      case "changes": return 0.9;\n      case "repeats": return 0.84;\n      case "converges": return 0.74;\n      case "before":\n      case "after": return 0.68;\n      default: return 0.5;\n    }\n  };\n\n  const targetLength = Math.min(5, Math.max(3, graph.events.length - 1));\n  while (ordered.length < targetLength) {\n    const used = new Set(ordered);\n    const candidate = graph.events\n      .filter((event) => !used.has(event.id) && event.id !== endpointId)\n      .map((event) => {\n        const direct = ordered.length\n          ? Math.max(...ordered.map((id) => relationBetween(graph, id, event.id)?.strength ?? 0), 0)\n          : 0;\n        const endpoint = relationBetween(graph, event.id, endpointId)?.strength ?? 0;\n        const relation = ordered.length\n          ? ordered\n              .map((id) => relationBetween(graph, id, event.id))\n              .filter(Boolean)\n              .sort((a, b) => (b?.strength ?? 0) - (a?.strength ?? 0))[0]\n          : undefined;\n        const structural = relation ? relationKindScore(relation.kind) : 0;\n        const specificity = specificityScore(graph, event.id);\n        return {\n          id: event.id,\n          score: direct * 0.42 + endpoint * 0.28 + structural * 0.18 + specificity * 0.12,\n        };\n      })\n      .sort((a, b) => b.score - a.score)[0];\n\n    if (!candidate) break;\n    ordered.push(candidate.id);\n  }\n\n  ordered.push(endpointId);`,
  "authorLatentMovieSearch.ts · expand graph into a whole-movie trajectory",
);

console.log("AUTHOR MOVIE AUTHORITY V2 COMPLETE");
