#!/usr/bin/env node
/**
 * QRE CREATIVE ARCHITECTURE RULE
 *
 * NO HARD-CODED CREATIVE BEHAVIOR.
 *
 * Structure-safe one-time migration for LatentMovie beat recovery.
 * It only projects an already-selected semantic movie into the canonical
 * beat-plan execution path. It never adds domain-specific prose or facts.
 *
 * CANONICAL PATH:
 * REALITY → MOVIE → DIFFERENTIATION → COGNITION → BEAT PLAN → MAGNET → MOUTH
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const importLine = 'import { recoverBeatPlanFromLatentMovie } from "./authorBeatPlanRecovery.js";';
const recoveryBlock = `\n  const recoveredBeatPlan = recoverBeatPlanFromLatentMovie(\n    cognition.latentMovieCandidates?.[0],\n    realityGraph,\n  );\n  if (!beatPlan && recoveredBeatPlan) {\n    beatPlan = normalizeBeatPlan(recoveredBeatPlan);\n  }\n`;

if (!fs.existsSync(target)) throw new Error(`Missing canonical author file: ${target}`);
let source = fs.readFileSync(target, "utf8");

if (source.includes(importLine) && source.includes("const recoveredBeatPlan = recoverBeatPlanFromLatentMovie(")) {
  console.log("AUTHOR BEAT RECOVERY ALREADY WIRED");
  process.exit(0);
}

const importAnchor = 'import { localModelGenerate } from "./localModelRuntime.js";';
if (!source.includes(importAnchor)) throw new Error("Cannot find canonical local-model import anchor; refusing unsafe rewrite");
source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);

// Do not depend on indentation or the exact retry formatting. Locate the
// terminal beat-plan failure branch by its semantic shape and inject recovery
// immediately before it.
const terminalBranch = /\n\s*if \(!beatPlan\) \{\n\s*return \{\n\s*brief: brief\(input, cognition\.chosenAttentionStrategy\)/;
if (!terminalBranch.test(source)) {
  throw new Error("Cannot find canonical terminal beat-plan failure branch; refusing unsafe rewrite");
}
source = source.replace(
  terminalBranch,
  `${recoveryBlock}\n  if (!beatPlan) {\n    return {\n      brief: brief(input, cognition.chosenAttentionStrategy)`,
);

// Diagnostics are intentionally additive and are not required for execution.
// Only update them when their canonical keys exist.
if (source.includes("beatPlanParseFailed: true,")) {
  source = source.replace(
    "beatPlanParseFailed: true,",
    "beatPlanParseFailed: true, beatPlanRecovered: Boolean(recoveredBeatPlan),",
  );
}
if (source.includes("beatPlanParseFailed: false,")) {
  source = source.replace(
    "beatPlanParseFailed: false,",
    "beatPlanParseFailed: false,\n      beatPlanRecovered: Boolean(recoveredBeatPlan),",
  );
}

fs.writeFileSync(target, source);
console.log("AUTHOR BEAT RECOVERY WIRED");
console.log(target);
