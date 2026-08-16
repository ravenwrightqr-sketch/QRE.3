import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, normalize } from "node:path";

const root = resolve(process.cwd());
const failures = [];

const boundaryPath = "packages/contracts/src/.qre-canonical-boundary";
const contractsRoot = join(root, "packages/contracts/src");

const coreSymbols = [
  "ServiceReceipt", "MemorySnapshot", "CinematicScene", "ExperienceMoment", "ExperienceBeat",
  "LatentMovie", "SequencePlay", "ViewerMomentum", "MagnetCircle", "CutNecessity",
  "SequenceTransition", "InformationFrontier", "SubjectContinuity", "AuthorBrainTruth",
  "AuthorCreativeBrief", "AuthorScene",
];

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
function rel(path) { return relative(root, path).replaceAll("\\", "/"); }
function resolveImport(importer, specifier) {
  if (!specifier.startsWith(".")) return undefined;
  const raw = normalize(join(dirname(importer), specifier));
  const candidates = [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}.js`.replace(/\.js$/, ".ts"), join(raw, "index.ts")];
  return candidates.find((candidate) => existsSync(candidate));
}
function hasTrueOwner(body, symbol) {
  return new RegExp(`export\\s+(?:type|interface|class|const|enum)\\s+${symbol}\\b`).test(body)
    && !new RegExp(`export\\s+type\\s+${symbol}\\s*=\\s*import\\(`).test(body);
}
function reachableBarrels() {
  const rootIndex = join(contractsRoot, "index.ts");
  const queue = [rootIndex, join(contractsRoot, "experience", "index.ts")].filter(existsSync);
  const seen = new Set();
  while (queue.length) {
    const file = queue.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const body = readFileSync(file, "utf8");
    for (const match of body.matchAll(/export\s+(?:type\s+)?(?:\{[^}]+\}|\*)\s+from\s+["']([^"']+)["']/g)) {
      const target = resolveImport(file, match[1]);
      if (target && target.startsWith(contractsRoot)) queue.push(target);
    }
  }
  return seen;
}
function barrelSurfacesSymbol(barrel, symbol) {
  const body = readFileSync(barrel, "utf8");
  if (new RegExp(`export\\s+(?:type\\s+)?\\{[^}]*\\b${symbol}\\b[^}]*\\}\\s+from`).test(body)) return true;
  if (/export\s+\*\s+from/.test(body)) {
    // Star barrels are handled transitively by reachableBarrels().
    return true;
  }
  return false;
}

if (!existsSync(contractsRoot)) {
  fail("Missing contracts root: packages/contracts/src");
} else {
  const contractFiles = walk(contractsRoot).filter((file) => /\.ts$/.test(file) && !file.endsWith("/index.ts"));
  const owners = new Map();

  for (const file of contractFiles) {
    const body = readFileSync(file, "utf8");
    for (const symbol of coreSymbols) {
      if (!hasTrueOwner(body, symbol)) continue;
      const owner = rel(file);
      const prior = owners.get(symbol);
      if (prior && prior !== owner) fail(`Duplicate canonical contract symbol ${symbol}: ${prior} and ${owner}`);
      else owners.set(symbol, owner);
    }
  }

  const barrels = reachableBarrels();
  for (const symbol of coreSymbols) {
    const owner = owners.get(symbol);
    if (!owner) {
      fail(`No canonical contract owner found for ${symbol}`);
      continue;
    }
    const ownerFile = join(root, owner);
    const surfaced = [...barrels].some((barrel) => {
      if (barrelSurfacesSymbol(barrel, symbol)) return true;
      return barrel === ownerFile && hasTrueOwner(readFileSync(barrel, "utf8"), symbol);
    });
    if (!surfaced) fail(`Core contract is not publicly surfaced through @qre/contracts index: ${symbol}`);
  }

  if (existsSync(join(root, boundaryPath))) {
    const boundary = read(boundaryPath);
    const retiredPaths = [...boundary.matchAll(/^RETIRED:\s*(.+)$/gm)].map((match) => normalize(join(root, match[1].trim())));
    const sourceFiles = walk(contractsRoot).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
    for (const retiredAbsolute of retiredPaths) {
      for (const file of sourceFiles) {
        const body = readFileSync(file, "utf8");
        for (const match of body.matchAll(/from\s+["']([^"']+)["']/g)) {
          const resolved = resolveImport(file, match[1]);
          if (resolved && normalize(resolved) === retiredAbsolute) {
            fail(`Retired contract dependency imported from ${rel(file)}: ${rel(retiredAbsolute)}`);
          }
        }
      }
    }
  }
}

console.log("=== QRE CONTRACT OWNERSHIP GUARD ===");
for (const message of failures) console.error(`FAIL: ${message}`);
if (failures.length) {
  console.error(`CONTRACT OWNERSHIP GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}
console.log("CONTRACT OWNERSHIP GUARD GREEN · ONE OWNER PER CORE SYMBOL · RETIRED BOUNDARIES CLEAN");
