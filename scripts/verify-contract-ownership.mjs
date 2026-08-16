import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const contracts = join(root, "packages/contracts/src");
const failures = [];

const coreSymbols = [
  "ServiceReceipt", "MemorySnapshot", "CinematicScene", "SequencePlay",
  "ViewerMomentum", "MagnetCircle", "CutNecessity", "InformationFrontier",
  "SubjectContinuity", "Moment", "ExperienceMoment",
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build"].includes(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (entry.isFile() && absolute.endsWith(".ts")) out.push(absolute);
  }
  return out;
}

if (!existsSync(contracts)) failures.push("Missing packages/contracts/src");

const owners = new Map();
for (const file of walk(contracts)) {
  if (file.endsWith("/index.ts")) continue;
  const body = readFileSync(file, "utf8");
  for (const symbol of coreSymbols) {
    const declaration = new RegExp(`export\\s+(?:type|interface|class|const|enum)\\s+${symbol}\\b`);
    if (!declaration.test(body)) continue;
    const rel = relative(root, file).replaceAll("\\", "/");
    const prior = owners.get(symbol);
    if (prior && prior !== rel) failures.push(`Duplicate canonical contract: ${symbol} in ${prior} and ${rel}`);
    else owners.set(symbol, rel);
  }
}

const boundaryPath = join(contracts, ".qre-canonical-boundary");
if (existsSync(boundaryPath)) {
  const boundary = readFileSync(boundaryPath, "utf8");
  const retired = [...boundary.matchAll(/^RETIRED:\s*(.+)$/gm)].map((m) => m[1].trim());
  for (const file of walk(join(root, "packages"))) {
    const body = readFileSync(file, "utf8");
    for (const path of retired) {
      const base = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
      if (base && new RegExp(`from\\s+[\"'][^\"']*${base}\\.js[\"']`).test(body)) {
        failures.push(`Retired contract import: ${relative(root, file).replaceAll("\\", "/")} -> ${path}`);
      }
    }
  }
}

console.log("=== QRE CONTRACT OWNERSHIP GUARD ===");
for (const symbol of coreSymbols) console.log(`${symbol}: ${owners.get(symbol) ?? "MISSING"}`);

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`CONTRACT OWNERSHIP GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("CONTRACT OWNERSHIP GUARD GREEN · ONE OWNER PER CORE CONTRACT · NO RETIRED IMPORTS");
