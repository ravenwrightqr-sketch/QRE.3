import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidatePath = path.join(
  root,
  "apps/api/src/services/authorMouthCandidateSearch.ts",
);
const runtimePath = path.join(
  root,
  "apps/api/src/services/localModelRuntime.ts",
);

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, value) {
  fs.writeFileSync(file, value, "utf8");
}

function salvageCandidateEntries(raw) {
  const marker = raw.indexOf("variantsByBeat");
  if (marker < 0) return [];

  const arrayStart = raw.indexOf("[", marker);
  if (arrayStart < 0) return [];

  const entries = [];
  let objectStart = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = arrayStart + 1; i < raw.length; i += 1) {
    const char = raw[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{" && depth === 0) {
      objectStart = i;
      depth = 1;
      continue;
    }

    if (char === "{" && depth > 0) {
      depth += 1;
      continue;
    }

    if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        const fragment = raw.slice(objectStart, i + 1);
        try {
          const value = JSON.parse(fragment);
          if (
            value &&
            typeof value === "object" &&
            Number(value.order) > 0 &&
            Array.isArray(value.variants)
          ) {
            const variants = value.variants
              .map((item) => String(item ?? "").replace(/\s+/g, " ").trim())
              .filter(Boolean)
              .slice(0, 8);
            if (variants.length) {
              entries.push({ order: Number(value.order), variants });
            }
          }
        } catch {
          // Ignore incomplete fragments and continue salvaging earlier entries.
        }
        objectStart = -1;
      }
    }
  }

  return entries;
}

let candidateSource = read(candidatePath);

const parserPattern = /export function parseMouthCandidateBatch\([\s\S]*?\n}\n\nexport async function generateAndSelectMouthCandidates/;

const replacement = [
  "export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {",
  "  const text = clean(raw)",
  "    .replace(/^```(?:json)?/i, \"\")",
  "    .replace(/```$/i, \"\")",
  "    .trim();",
  "",
  "  try {",
  "    const value = JSON.parse(text) as { variantsByBeat?: unknown };",
  "    if (!Array.isArray(value.variantsByBeat)) return undefined;",
  "",
  "    const variantsByBeat = value.variantsByBeat",
  "      .filter((entry) => entry && typeof entry === \"object\")",
  "      .map((entry) => {",
  "        const item = entry as Record<string, unknown>;",
  "        const variants = Array.isArray(item.variants)",
  "          ? item.variants.map(clean).filter(Boolean).slice(0, 8)",
  "          : [];",
  "        return {",
  "          order: Number(item.order ?? 0),",
  "          variants,",
  "        };",
  "      })",
  "      .filter((entry) => entry.order > 0 && entry.variants.length > 0);",
  "",
  "    return variantsByBeat.length ? { variantsByBeat } : undefined;",
  "  } catch {",
  "    const salvaged = salvageCandidateEntries(text);",
  "    return salvaged.length ? { variantsByBeat: salvaged } : undefined;",
  "  }",
  "}",
  "",
  "export async function generateAndSelectMouthCandidates",
].join("\n");

if (!parserPattern.test(candidateSource)) {
  throw new Error("Could not locate canonical mouth candidate parser.");
}

candidateSource = candidateSource.replace(parserPattern, replacement);
write(candidatePath, candidateSource);

let runtimeSource = read(runtimePath);
runtimeSource = runtimeSource.replace(
  /process\.env\.QRE_LOCAL_MODEL\s*\|\|\s*\"qre-local\"/,
  'process.env.QRE_LOCAL_MODEL ||\n    "qwen2.5vl:7b"',
);
write(runtimePath, runtimeSource);

console.log("Author production transport hardening applied.");
console.log("- canonical JSON parser now salvages complete beat entries from truncated output");
console.log("- local Ollama fallback resolves to qwen2.5vl:7b");
