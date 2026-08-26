import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];

function fail(message) {
  failures.push(message);
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build"].includes(entry.name)) continue;

    const absolute = join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(absolute, out);
    } else if (entry.isFile()) {
      out.push(absolute);
    }
  }

  return out;
}

const sourceRoots = [
  join(root, "packages/contracts/src"),
  join(root, "packages/engine/src"),
  join(root, "apps/api/src"),
  join(root, "apps/web/src"),
];

const files = sourceRoots.flatMap((dir) => walk(dir));

for (const file of files) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");

  if (/SceneVisual\b/.test(body)) {
    fail(`Forbidden SceneVisual reference: ${rel}`);
  }

  if (/\bvisual\s*:/.test(body)) {
    fail(`Forbidden experience visual field: ${rel}`);
  }

  if (/\bvisual\?\s*:/.test(body)) {
    fail(`Forbidden optional experience visual field: ${rel}`);
  }

  if (/\bvisual\s*=\s*/.test(body)) {
    fail(`Forbidden authored visual assignment: ${rel}`);
  }
}

const momentPath = join(root, "packages/contracts/src/experience/moment.ts");
if (existsSync(momentPath)) {
  const momentSource = readFileSync(momentPath, "utf8");

  if (!/media\?:\s*MediaAsset\[\]/.test(momentSource)) {
    fail("Canonical ExperienceMoment must retain media?: MediaAsset[]");
  }
}

const mediaPath = join(root, "packages/contracts/src/media.ts");
if (existsSync(mediaPath)) {
  const mediaSource = readFileSync(mediaPath, "utf8");

  for (const type of ['"image"', '"video"', '"audio"']) {
    if (!mediaSource.includes(type)) {
      fail(`Canonical MediaAsset is missing ${type} media support`);
    }
  }
}

console.log("=== QRE SUPPLIED MEDIA BOUNDARY GUARD ===");
console.log("RULE: experience sequence contains playout + supplied/captured media.");
console.log("RULE: generated/abstract visual scene content is forbidden.");
console.log("RULE: ExperienceMoment.media is the canonical media path.");

for (const failure of failures) {
  console.error(`FAIL: ${failure}`);
}

if (failures.length > 0) {
  console.error(`\nSUPPLIED MEDIA BOUNDARY FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log(
  "SUPPLIED MEDIA BOUNDARY GREEN · NO VISUAL SCENE CONTRACT · MEDIA PATH INTACT",
);