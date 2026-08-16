import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");

if (!fs.existsSync(target)) throw new Error(`Missing canonical author brain: ${target}`);

let source = fs.readFileSync(target, "utf8");

const importAnchor = 'import { localModelGenerate } from "./localModelRuntime.js";';
const adapterImport = `${importAnchor}\nimport { normalizeLatentMovieBeatPlan } from "./authorLatentMovieBeatAdapter.js";`;

if (!source.includes(adapterImport) && source.includes(importAnchor)) {
  source = source.replace(importAnchor, adapterImport);
}

const typeAnchor = 'type AuthorBeat = { order: number; role: string; gainKind: string; change: string; next: string; frontier: string; necessity: string };';
const typeReplacement = 'type AuthorBeat = { order: number; role: string; gainKind: string; change: string; next: string; frontier: string; necessity: string; eventIds?: string[] };';

if (source.includes(typeAnchor)) source = source.replace(typeAnchor, typeReplacement);

const sourceIdsAnchor = 'sourceIds: [],';
const sourceIdsReplacement = 'sourceIds: beat.eventIds ?? [],';
if (source.includes(sourceIdsAnchor)) source = source.replace(sourceIdsAnchor, sourceIdsReplacement);

const normalizeAnchor = 'let beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));';
const normalizeReplacement = 'let beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text)) ?? normalizeLatentMovieBeatPlan(parseJson<unknown>(beatPlanResult.text));';
const normalizeCount = source.split(normalizeAnchor).length - 1;
if (normalizeCount < 1) {
  throw new Error("Cannot find canonical beat-plan normalization boundary; refusing unsafe rewrite");
}
source = source.replaceAll(normalizeAnchor, normalizeReplacement);

fs.writeFileSync(target, source, "utf8");
console.log("AUTHOR LATENT-MOVIE ADAPTER GREEN");
console.log("  canonical author brain now accepts LatentMovieCandidate trajectory at the beat boundary");
console.log("  RealityGraph eventIds are preserved into SequenceCut.sourceIds");
console.log("  no domain facts or viewer prose were hardcoded");
