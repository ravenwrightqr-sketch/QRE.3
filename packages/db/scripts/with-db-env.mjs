import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(packageRoot, "..", "..");

const envFiles = [
  resolve(workspaceRoot, ".env"),
  resolve(workspaceRoot, "apps", "api", ".env"),
  resolve(packageRoot, ".env"),
];

const explicitEnv = new Set(Object.keys(process.env));

function parseEnv(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

for (const envFile of envFiles) {
  if (!existsSync(envFile)) continue;

  const values = parseEnv(readFileSync(envFile, "utf8"));
  for (const [key, value] of Object.entries(values)) {
    if (!explicitEnv.has(key)) {
      process.env[key] = value;
    }
  }
}

if (process.env.SUPABASE_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.SUPABASE_DATABASE_URL;
}

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is missing. Set DATABASE_URL or SUPABASE_DATABASE_URL before running Prisma.",
  );
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node ./scripts/with-db-env.mjs <command> [...args]");
  process.exit(1);
}

const result = spawnSync(command, args, {
  cwd: packageRoot,
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
