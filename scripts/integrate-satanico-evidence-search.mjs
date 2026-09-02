import fs from "node:fs";
import path from "node:path";

const file = path.resolve("apps/api/src/services/authorUniversalMovieSearch.ts");
const source = fs.readFileSync(file, "utf8");

const importNeedle = 'import { scoreSatanicoObserverInference } from "./authorSatanicoInference.js";';
const importReplacement = `${importNeedle}\nimport { searchSatanicoEvidenceSubsets } from "./authorSatanicoEvidenceSearch.js";`;

const helperAnchor = `function addTrajectoryCandidate(candidates: LatentMovieCandidate[], graph: RealityGraph, id: string, ids: readonly string[], lens?: string, subject?: string): void {`;
const helperBody = `\n\nfunction addSatanicoEvidenceCandidates(\n  candidates: LatentMovieCandidate[],\n  graph: RealityGraph,\n  lens?: string,\n  subject?: string,\n  limit = 8,\n): void {\n  const subsets = searchSatanicoEvidenceSubsets(graph, limit);\n  for (let index = 0; index < subsets.length; index += 1) {\n    addTrajectoryCandidate(\n      candidates,\n      graph,\n      \`movie-satanico-\\${index + 1}\`,\n      subsets[index]!,\n      lens,\n      subject,\n    );\n  }\n}\n`;

const callNeedle = `  const relationSeeds = [...input.graph.relations]`;
const callReplacement = `  // Satanico searches for compact grounded evidence constellations before\n  // ordinary chronology wins by default. They remain ordinary competing movie candidates.\n  addSatanicoEvidenceCandidates(\n    candidates,\n    input.graph,\n    input.lens,\n    input.subject,\n    Math.max(4, limit),\n  );\n\n${callNeedle}`;

let next = source;

if (!next.includes('searchSatanicoEvidenceSubsets')) {
  if (!next.includes(importNeedle)) throw new Error("Universal movie search import anchor not found");
  next = next.replace(importNeedle, importReplacement);
}

if (!next.includes("function addSatanicoEvidenceCandidates")) {
  if (!next.includes(helperAnchor)) throw new Error("Universal movie search candidate helper anchor not found");
  const helperEnd = next.indexOf("}\n\nexport function searchUniversalMovieCandidates", next.indexOf(helperAnchor));
  if (helperEnd < 0) throw new Error("Universal movie search candidate helper boundary not found");
  next = next.slice(0, helperEnd + 1) + helperBody + next.slice(helperEnd + 1);
}

if (!next.includes("addSatanicoEvidenceCandidates(candidates")) {
  if (!next.includes(callNeedle)) throw new Error("Universal movie search relation seed anchor not found");
  next = next.replace(callNeedle, callReplacement);
}

if (next === source) {
  console.log("Satanico universal search integration already present.");
  process.exit(0);
}

fs.writeFileSync(file, next, "utf8");
console.log(`Integrated Satanico evidence subsets into ${file}`);
