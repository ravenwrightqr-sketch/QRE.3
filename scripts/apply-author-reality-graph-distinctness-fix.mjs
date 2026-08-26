import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorRealityGraph.ts");
const source = fs.readFileSync(file, "utf8");

const oldHelpers = `function sharedDistinctiveTokens(a: string, b: string): string[] {\n  const left = new Set(contentTokens(a));\n  const right = new Set(contentTokens(b));\n  return [...left].filter((token) => right.has(token));\n}\n\nfunction specificityScore(event: RealityEvent): number {`;

const newHelpers = `function sharedDistinctiveTokens(\n  a: string,\n  b: string,\n  blockedTokens: ReadonlySet<string> = new Set(),\n): string[] {\n  const left = new Set(contentTokens(a));\n  const right = new Set(contentTokens(b));\n  return [...left].filter((token) => right.has(token) && !blockedTokens.has(token));\n}\n\nfunction sharedTokenFrequency(events: readonly RealityEvent[]): Map<string, number> {\n  const frequency = new Map<string, number>();\n  for (const item of events) {\n    for (const token of new Set(contentTokens(item.label))) {\n      frequency.set(token, (frequency.get(token) ?? 0) + 1);\n    }\n  }\n  return frequency;\n}\n\nfunction specificityScore(event: RealityEvent): number {`;

if (!source.includes(oldHelpers)) {
  throw new Error("expected RealityGraph helper block was not found; refusing to patch");
}

let next = source.replace(oldHelpers, newHelpers);

const oldSetup = `function buildRelationships(events: RealityEvent[], subject?: string): RealityRelation[] {\n  const relations: RealityRelation[] = [];\n  const subjectText = lower(subject ?? "");`;

const newSetup = `function buildRelationships(events: RealityEvent[], subject?: string): RealityRelation[] {\n  const relations: RealityRelation[] = [];\n  const subjectText = lower(subject ?? "");\n  const subjectTokens = new Set(contentTokens(subjectText));\n  const tokenFrequency = sharedTokenFrequency(events);\n  const commonTokens = new Set(\n    [...tokenFrequency.entries()]\n      .filter(([, count]) => count >= Math.max(2, Math.ceil(events.length * 0.5)))\n      .map(([token]) => token),\n  );\n  const blockedConvergenceTokens = new Set([\n    ...subjectTokens,\n    ...commonTokens,\n  ]);`;

if (!next.includes(oldSetup)) {
  throw new Error("expected buildRelationships setup was not found; refusing to patch");
}
next = next.replace(oldSetup, newSetup);

const oldShared = `      const shared = sharedDistinctiveTokens(current.label, other.label);`;
const newShared = `      const shared = sharedDistinctiveTokens(\n        current.label,\n        other.label,\n        blockedConvergenceTokens,\n      );`;

if (!next.includes(oldShared)) {
  throw new Error("expected shared-token relation line was not found; refusing to patch");
}
next = next.replace(oldShared, newShared);

fs.writeFileSync(file, next, "utf8");
console.log(`Patched ${path.relative(root, file)}`);
console.log("RealityGraph convergence now ignores subject/common tokens when creating convergence relations.");
