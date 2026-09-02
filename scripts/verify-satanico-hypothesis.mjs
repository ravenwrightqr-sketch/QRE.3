#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const read = (path) => readFileSync(join(root, path), "utf8");
const hypothesis = "apps/api/src/services/authorSatanicoHypothesis.ts";
const thesis = "apps/api/src/services/authorLatentStoryThesis.ts";

if (!existsSync(join(root, hypothesis))) failures.push(`missing:${hypothesis}`);
if (!existsSync(join(root, thesis))) failures.push(`missing:${thesis}`);

const hypothesisSource = existsSync(join(root, hypothesis)) ? read(hypothesis) : "";
const thesisSource = existsSync(join(root, thesis)) ? read(thesis) : "";

if (!/rankSatanicoHypotheses\s*\(/.test(hypothesisSource)) failures.push("hypothesis-ranking-missing");
if (!/strongestSatanicoHypothesis\s*\(/.test(hypothesisSource)) failures.push("hypothesis-winner-missing");
for (const symbol of ["counterEvidence", "unsupportedAssumptionRisk", "observerGap", "explanatoryCompression"]) {
  if (!new RegExp(symbol).test(hypothesisSource)) failures.push(`hypothesis-metric-missing:${symbol}`);
}
if (!/authorSatanicoHypothesis\.js/.test(thesisSource)) failures.push("latent-thesis-not-wired-to-satanico-hypothesis");
if (!/strongestSatanicoHypothesis\s*\(/.test(thesisSource)) failures.push("latent-thesis-does-not-consume-hypothesis-winner");
if (!/hypothesisAlignment/.test(thesisSource)) failures.push("interpretation-not-aligned-to-hypothesis");

console.log("=== QRE SATANICO HYPOTHESIS GUARD ===");
console.log(failures.length ? failures.map((item) => `FAIL: ${item}`).join("\n") : "HYPOTHESIS ENGINE GREEN\nTHESIS WIRING GREEN\nCOUNTER-EVIDENCE GREEN\nOBSERVER-GAP GREEN\nSATANICO HYPOTHESIS GUARD GREEN");
if (failures.length) process.exit(1);
