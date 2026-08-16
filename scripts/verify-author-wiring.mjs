import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const checks = [];
const check = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name}: ${detail}`);
};
const read = (path) => readFileSync(join(root, path), "utf8");

const truth = "packages/contracts/src/experience/authorBrain.ts";
const graphContract = "packages/contracts/src/experience/realityGraph.ts";
const graphBuilder = "apps/api/src/services/authorRealityGraph.ts";
const master = "apps/api/src/services/authorBrainUniversal.ts";
const cognition = "apps/api/src/services/authorCognition.ts";
const mouth = "apps/api/src/services/localModelRuntime.ts";
const cutPolicy = "apps/api/src/services/authorCutPolicy.ts";
const acceptance = "apps/api/author-acceptance-suite.ts";
const wiringMap = "docs/AUTHOR_WIRING_MAP.md";

for (const path of [truth, graphContract, graphBuilder, master, cognition, mouth, cutPolicy, acceptance, wiringMap]) {
  check(`exists:${path}`, existsSync(join(root, path)), existsSync(join(root, path)) ? "canonical file present" : "required canonical file missing");
}

if (existsSync(join(root, truth))) {
  check("truth:realityGraph", /realityGraph\??:\s*RealityGraph/.test(read(truth)), "AuthorBrainTruth exposes RealityGraph");
}
if (existsSync(join(root, graphBuilder))) {
  const body = read(graphBuilder);
  check("graph:typed", /RealityGraph/.test(body), "graph builder uses the canonical RealityGraph contract");
  check("graph:provenance", /provenance/.test(body) && /sourceIds/.test(body), "graph events retain source provenance");
  check("graph:relations", /relations/.test(body) && /contrasts/.test(body), "graph builder emits relations/contrasts");
}
if (existsSync(join(root, master))) {
  const body = read(master);
  check("master:cognition", /authorCognition\.js/.test(body) && /buildAuthorCognitivePlan\s*\(/.test(body), "Master Author executes canonical cognition");
  check("master:cutPolicy", /authorCutPolicy\.js/.test(body) && /evaluateCut\s*\(/.test(body), "Master Author executes canonical cut policy");
  check("master:graph-consumer", /realityGraph/.test(body), "Master Author consumes RealityGraph");
  check("master:graph-builder", /authorRealityGraph\.js/.test(body), "Master Author wires deterministic RealityGraph compiler");
}
if (existsSync(join(root, cognition))) {
  const body = read(cognition);
  check("cognition:graph-input", /RealityGraph/.test(body), "authorCognition accepts/derives canonical graph");
  check("cognition:relationship-use", /relations|unresolvedTensions|recurringSignals/.test(body), "cognition uses graph relationships/tensions/signals");
}
if (existsSync(join(root, mouth))) {
  const body = read(mouth);
  check("mouth:one-beat", /MOUTH-BEAT|realizeMouthOneBeat/.test(body), "mouth realizes beats individually");
  check("mouth:short", /7 words maximum|words? > 7|wordCount/.test(body), "mouth enforces compact sequence text");
}
if (existsSync(join(root, cutPolicy))) {
  const body = read(cutPolicy);
  check("policy:short", /wordCount > 7/.test(body), "cut policy enforces seven-word default ceiling");
  check("policy:invention", /inventionRisk/.test(body), "cut policy measures invention risk");
}
if (existsSync(join(root, acceptance))) {
  const body = read(acceptance);
  check("acceptance:master", /authorBrainUniversal/.test(body), "acceptance invokes the Master Author");
  check("acceptance:same-reality-lenses", /COUPLE-FUNNY/.test(body) && /COUPLE-HORROR/.test(body), "acceptance exercises same truth through multiple lenses");

  const acceptsArgv = /process\.argv\.slice\(2\)/.test(body) || /process\.argv\[\d+\]/.test(body);
  const hasArbitraryFallback = /splitReality\s*\(/.test(body) && /\?\?\s*\(\(\)\s*=>/.test(body);
  check(
    "acceptance:arbitrary-input",
    acceptsArgv && hasArbitraryFallback,
    "acceptance supports arbitrary user reality input"
  );
}

console.log("=== QRE AUTHOR WIRING GUARD ===");
for (const item of checks) console.log(`${item.ok ? "GREEN" : "FAIL"}: ${item.name} · ${item.detail}`);
if (failures.length) {
  console.error(`AUTHOR WIRING GUARD FAILED · ${failures.length} wiring gap(s)`);
  process.exit(1);
}
console.log("AUTHOR WIRING GUARD GREEN · REALITY → COGNITION → MAGNET → SEQUENCE → MOUTH → CUT POLICY → ACCEPTANCE");
