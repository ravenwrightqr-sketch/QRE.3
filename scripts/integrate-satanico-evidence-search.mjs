import fs from "node:fs";
import path from "node:path";

const file = path.resolve("apps/api/src/services/authorUniversalMovieSearch.ts");
const source = fs.readFileSync(file, "utf8");

const importNeedle = 'import { scoreSatanicoObserverInference } from "./authorSatanicoInference.js";';
const importReplacement = `${importNeedle}\nimport { searchSatanicoEvidenceSubsets } from "./authorSatanicoEvidenceSearch.js";`;

const helperNeedle = `function addTrajectoryCandidate(candidates: LatentMovieCandidate[], graph: RealityGraph, id: string, ids: readonly string[], lens?: string, subject?: string): void {\n  const built = buildTrajectory(graph, ids);\n  if (built.length < 3) return;\n  candidates.push({ id, lens: clean(lens) || "NONE", distinctiveness: 0, ...scoreCandidate(graph, built, lens, subject) });\n}\n`;

const helperReplacement = `${helperNeedle}\nfunction addSatanicoEvidenceCandidates(candidates: LatentMovieCandidate[], graph: RealityGraph, lens?: string, subject?: string, limit = 8): void {\n  const subsets = searchSatanicoEvidenceSubsets(graph, limit);\n  for (let index = 0; index < subsets.length; index += 1) {\n    addTrajectoryCandidate(\n      candidates,\n      graph,\n      \`movie-satanico-${index + 1}\`,\n      subsets[index]!,\n      lens,\n      subject,\n    );\n  }\n}\n`;

const callNeedle = `  for (let index = 0; index < relationSeeds.length; index += 1) {`;
const callReplacement = `  // Satanico searches for compact grounded evidence constellations before\n  // the ordinary chronology wins by default. These remain ordinary candidates\n  // and compete through the existing movie scorer/ranker.\n  addSatanicoEvidenceCandidates(candidates, input.graph, input.lens, input.subject, Math.max(4, limit));\n\n${callNeedle}`;

let next = source;
if (!next.includes('searchSatanicoEvidenceSubsets')) {
  if (!next.includes(importNeedle)) throw new Error("Universal movie search import anchor not found");
  next = next.replace(importNeedle, importReplacement);
}

if (!next.includes("function addSatanicoEvidenceCandidates")) {
  if (!next.includes(helperNeedle)) throw new Error("Universal movie search candidate helper anchor not found");
  next = next.replace(helperNeedle, helperReplacement);
}

if (!next.includes("addSatanicoEvidenceCandidates(candidates")) {
  if (!next.includes(callNeedle)) throw new Error("Universal movie search relation loop anchor not found");
  next = next.replace(callNeedle, callReplacement);
}

if (next === source) {
  console.log("Satanico universal search integration already present.");
  process.exit(0);
}

fs.writeFileSync(file, next, "utf8");
console.log(`Integrated Satanico evidence subsets into ${file}`);
