#!/usr/bin/env node
/**
 * QRE CREATIVE ARCHITECTURE RULE
 *
 * NO HARD-CODED CREATIVE BEHAVIOR.
 *
 * This one-time migration wires semantic LatentMovie recovery into the
 * canonical Universal Author. It does not add domain-specific prose or
 * special-case subjects. It only prevents a model JSON formatting failure
 * from destroying an already-valid semantic movie trajectory.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const importLine = 'import { recoverBeatPlanFromLatentMovie } from "./authorBeatPlanRecovery.js";';
const recoveryBlock = `\n  const recoveredBeatPlan = recoverBeatPlanFromLatentMovie(\n    cognition.latentMovieCandidates[0],\n    realityGraph,\n  );\n  if (!beatPlan && recoveredBeatPlan) {\n    beatPlan = normalizeBeatPlan(recoveredBeatPlan);\n  }\n`;

if (!fs.existsSync(target)) throw new Error(`Missing canonical author file: ${target}`);

let source = fs.readFileSync(target, "utf8");
if (source.includes(importLine) && source.includes("const recoveredBeatPlan = recoverBeatPlanFromLatentMovie(")) {
  console.log("AUTHOR BEAT RECOVERY ALREADY WIRED");
  process.exit(0);
}

const importAnchor = 'import { localModelGenerate } from "./localModelRuntime.js";';
if (!source.includes(importAnchor)) throw new Error("Cannot find canonical local-model import anchor");
source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);

const retryAnchor = `    beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));\n  }\n\n  if (!beatPlan) {`;
if (!source.includes(retryAnchor)) throw new Error("Cannot find beat-plan retry anchor; refusing unsafe rewrite");
source = source.replace(
  retryAnchor,
  `    beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));\n  }\n${recoveryBlock}\n  if (!beatPlan) {`,
);

const diagnosticAnchor = 'beatPlanParseFailed: true, sequenceCutsAttempted: 0, sequenceCutsRejected: 0, finalScenes: 0';
if (!source.includes(diagnosticAnchor)) throw new Error("Cannot find beat-plan failure diagnostics anchor");
source = source.replace(
  diagnosticAnchor,
  'beatPlanParseFailed: true, beatPlanRecovered: false, sequenceCutsAttempted: 0, sequenceCutsRejected: 0, finalScenes: 0',
);

const successAnchor = 'beatPlanParseFailed: false,\n      sequenceCutsAttempted:';
if (!source.includes(successAnchor)) throw new Error("Cannot find beat-plan success diagnostics anchor");
source = source.replace(
  successAnchor,
  'beatPlanParseFailed: false,\n      beatPlanRecovered: Boolean(recoveredBeatPlan),\n      sequenceCutsAttempted:',
);

fs.writeFileSync(target, source);
console.log("AUTHOR BEAT RECOVERY WIRED");
console.log(target);
