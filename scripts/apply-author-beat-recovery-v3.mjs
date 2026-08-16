#!/usr/bin/env node
/**
 * QRE CREATIVE ARCHITECTURE RULE · DETAILED REFERENCE
 *
 * NO HARD-CODED CREATIVE BEHAVIOR.
 *
 * Structure-safe one-time migration for semantic LatentMovie beat recovery.
 * This migrator only wires the existing recovery module into the canonical
 * execution path. It never inserts story prose, domain examples, or facts.
 *
 * CANONICAL PATH:
 * REALITY → MOVIE → DIFFERENTIATION → COGNITION → BEAT PLAN → MAGNET → MOUTH
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const importAnchor = 'import { localModelGenerate } from "./localModelRuntime.js";';
const importLine = 'import { recoverBeatPlanFromLatentMovie } from "./authorBeatPlanRecovery.js";';
const sequenceAnchor = '  const sequence = buildViewerMomentum(subject, beatPlan);';
const recoveryBlock = `  const recoveredBeatPlan = recoverBeatPlanFromLatentMovie(\n    cognition.latentMovieCandidates?.[0],\n    realityGraph,\n  );\n  if (!beatPlan && recoveredBeatPlan) {\n    beatPlan = normalizeBeatPlan(recoveredBeatPlan);\n  }\n\n  if (!beatPlan) {\n    return {\n      brief: brief(input, cognition.chosenAttentionStrategy), scenes: [], sequence: undefined, field,\n      diagnostics: { cognitionMode: cognition.mode, chosenAttentionStrategy: cognition.chosenAttentionStrategy, attentionCandidates: cognition.attentionCandidates, contradictions: cognition.contradictions, operatorMix: cognition.operatorMix, creativeRisk: risk, realityGraphEvents: realityGraph.events.length, realityGraphRelations: realityGraph.relations.length, realityGraphTensions: realityGraph.unresolvedTensions, beatCount: 0, beatPlan: [], beatPlanRetries, beatPlanParseFailed: true, beatPlanRecovered: Boolean(recoveredBeatPlan), sequenceCutsAttempted: 0, sequenceCutsRejected: 0, finalScenes: 0 },\n    };\n  }\n\n`;

if (!fs.existsSync(target)) throw new Error(`Missing canonical author file: ${target}`);
let source = fs.readFileSync(target, "utf8");

const alreadyWired = source.includes(importLine) && source.includes("const recoveredBeatPlan = recoverBeatPlanFromLatentMovie(");
if (alreadyWired) {
  console.log("AUTHOR BEAT RECOVERY ALREADY WIRED");
  process.exit(0);
}

if (!source.includes(importAnchor)) {
  throw new Error("Cannot find canonical local-model import anchor; refusing unsafe rewrite");
}
if (!source.includes(sequenceAnchor)) {
  throw new Error("Cannot find canonical sequence construction anchor; refusing unsafe rewrite");
}

source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
source = source.replace(sequenceAnchor, `${recoveryBlock}${sequenceAnchor}`);

if (!source.includes("beatPlanRecovered")) {
  source = source.replace(
    "beatPlanParseFailed: false,",
    "beatPlanParseFailed: false, beatPlanRecovered: Boolean(recoveredBeatPlan),",
  );
}

fs.writeFileSync(target, source);
console.log("AUTHOR BEAT RECOVERY WIRED");
console.log(target);
