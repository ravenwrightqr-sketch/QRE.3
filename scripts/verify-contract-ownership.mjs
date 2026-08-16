import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];

const boundaryPath = "packages/contracts/src/.qre-canonical-boundary";
const contractsRoot = join(root, "packages/contracts/src");

function fail(message) { failures.push(message); }
function read(path) { return readFileSync(join(root, path), "utf8"); }

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (entry.isFile()) out.push(absolute);
  }
  return out;
}

if (!existsSync(contractsRoot)) {
  fail(`Missing contracts root: packages/contracts/src`);
} else {
  const contractFiles = walk(contractsRoot).filter((file) => /\.ts$/.test(file) && !file.endsWith("/index.ts"));
  const sourceFiles = walk(join(root, "packages"), []).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));

  const canonicalSymbols = [
    "ServiceReceipt",
    "MemorySnapshot",
    "CinematicScene",
    "SequencePlay",
    "SequenceCut",
    "ViewerState",
    "ViewerMomentum",
    "MagnetCircle",
    "CutNecessity",
    "SequenceTransition",
    "MemoryReentryMagnet",
    "InformationFrontier",
    "SubjectContinuity",
    "AuthorBrainTruth",
    "AuthorCreativeBrief",
    "AuthorScene",
    "ExperienceMoment",
    "ExperienceBeat",
    "LatentMovie",
    "LatentMovieEvent",
  ];

  const owners = new Map();
  for (const file of contractFiles) {
    const body = readFileSync(file, "utf8");
    const rel = relative(root, file).replaceAll("\\", "/");
    for (const symbol of canonicalSymbols) {
      const declaration = new RegExp(`export\\s+(?:type|interface|class|const|enum)\\s+${symbol}\\b`);
      if (!declaration.test(body)) continue;
      const prior = owners.get(symbol);
      if (prior && prior !== rel) {
        fail(`Duplicate canonical contract symbol ${symbol}: ${prior} and ${rel}`);
      } else {
        owners.set(symbol, rel);
      }
    }
  }

  if (existsSync(join(root, boundaryPath))) {
    const boundary = read(boundaryPath);
    const retiredPaths = [...boundary.matchAll(/^RETIRED:\s*(.+)$/gm)].map((match) => match[1].trim());
    for (const retiredPath of retiredPaths) {
      const normalized = retiredPath.replaceAll("\\", "/");
      const retiredBase = normalized.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
      if (!retiredBase) continue;
      for (const file of sourceFiles) {
        const body = readFileSync(file, "utf8");
        const rel = relative(root, file).replaceAll("\\", "/");
        const importPattern = new RegExp(`(?:from\\s+|import\\s*\\(\\s*)[\\"'][^\\"']*${retiredBase}(?:\\.js)?[\\"']`);
        if (importPattern.test(body)) {
          fail(`Retired contract dependency imported from ${rel}: ${normalized}`);
        }
      }
    }
  }

  const indexSource = existsSync(join(contractsRoot, "index.ts")) ? read("packages/contracts/src/index.ts") : "";
  for (const symbol of ["ServiceReceipt", "MemorySnapshot", "CinematicScene", "SequencePlay", "ViewerMomentum", "MagnetCircle", "CutNecessity", "InformationFrontier", "SubjectContinuity", "AuthorBrainTruth", "AuthorCreativeBrief", "AuthorScene", "ExperienceMoment", "ExperienceBeat", "LatentMovie"]) {
    if (!new RegExp(`\\b${symbol}\\b`).test(indexSource)) {
      fail(`Core contract is not publicly surfaced through @qre/contracts index: ${symbol}`);
    }
  }
}

console.log("=== QRE CONTRACT OWNERSHIP GUARD ===");
for (const message of failures) console.error(`FAIL: ${message}`);

if (failures.length) {
  console.error(`CONTRACT OWNERSHIP GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("CONTRACT OWNERSHIP GUARD GREEN · ONE CORE SYMBOL OWNER · NO RETIRED CONTRACT IMPORTS");
