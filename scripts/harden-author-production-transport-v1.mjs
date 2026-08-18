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

function hardenCandidateParser(source) {
  if (source.includes("salvageCandidateEntries")) {
    return source;
  }

  const startMarker = "export function parseMouthCandidateBatch";
  const endMarker = "export async function generateAndSelectMouthCandidates";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Could not locate canonical mouth candidate parser boundaries.");
  }

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
  ].join("\n");

  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function hardenRuntimeFallback(source) {
  if (source.includes('"qwen2.5vl:7b"')) {
    return source;
  }

  const startMarker = "function modelName(): string {";
  const start = source.indexOf(startMarker);
  const end = source.indexOf("\n}\n", start);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Could not locate modelName() in localModelRuntime.ts.");
  }

  const replacement = [
    "function modelName(): string {",
    "  return (",
    "    process.env.QRE_AUTHOR_FAST_MODEL ||",
    "    process.env.QRE_LOCAL_MODEL ||",
    '    "qwen2.5vl:7b"',
    "  );",
    "}",
  ].join("\n");

  return `${source.slice(0, start)}${replacement}${source.slice(end + 3)}`;
}

const candidateSource = hardenCandidateParser(read(candidatePath));
const runtimeSource = hardenRuntimeFallback(read(runtimePath));

write(candidatePath, candidateSource);
write(runtimePath, runtimeSource);

console.log("Author production transport hardening applied.");
console.log("- canonical JSON parser salvages complete beat entries from truncated output");
console.log("- missing beat orders remain recoverable by bounded orchestration recovery");
console.log("- local Ollama fallback resolves to qwen2.5vl:7b");
