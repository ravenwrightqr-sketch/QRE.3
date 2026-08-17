import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "apps/api/src/services/localModelRuntime.ts",
);
const backup = `${target}.before-mouth-batch-boundary-${Date.now()}`;

let text = fs.readFileSync(target, "utf8");

function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) {
    throw new Error(`PATCH MISS [${label}]: start marker not found`);
  }

  const end = source.indexOf(endMarker, start);
  if (end < 0) {
    throw new Error(`PATCH MISS [${label}]: end marker not found`);
  }

  return source.slice(0, start) + replacement + source.slice(end);
}

const newParser = [
  "function parseMouthBatch(",
  "  raw: string,",
  "  expected: number,",
  "): string[] {",
  "  const text = raw",
  "    .replace(/^```(?:json)?/i, \"\")",
  "    .replace(/```$/i, \"\")",
  "    .trim();",
  "",
  "  try {",
  "    const value = JSON.parse(text) as {",
  "      texts?: unknown;",
  "    };",
  "",
  "    if (!Array.isArray(value.texts)) {",
  "      return [];",
  "    }",
  "",
  "    return value.texts",
  "      .map((value) => String(value ?? \"\").trim())",
  "      .filter(Boolean)",
  "      .slice(0, expected);",
  "  } catch {",
  "    return [];",
  "  }",
  "}",
  "",
].join("\n");

if (
  text.includes("function parseMouthBatch(") &&
  text.includes("async function canonicalMouthRequest(")
) {
  text = replaceBetween(
    text,
    "function parseMouthBatch(",
    "async function canonicalMouthRequest(",
    newParser,
    "parseMouthBatch",
  );
} else {
  throw new Error(
    "PATCH MISS [parseMouthBatch]: canonical function boundaries not found",
  );
}

const oldValidation = "  const valid = parsed.every(mouthAcceptable);";
const newValidation =
  "  const valid = parsed.length === beats.length && parsed.every(mouthAcceptable);";

if (text.includes(oldValidation)) {
  text = text.replace(oldValidation, newValidation);
} else if (!text.includes(newValidation)) {
  throw new Error(
    "PATCH MISS [canonical mouth validation]: expected valid predicate not found",
  );
}

const fallbackStart =
  "  if (\n    retryParsed.length === beats.length\n  ) {";
const fallbackEnd = "\n}\n\nexport async function localModelGenerate(";

const start = text.indexOf(fallbackStart);
if (start < 0) {
  throw new Error(
    "PATCH MISS [canonical mouth fallback]: retry/fallback boundary not found",
  );
}

const end = text.indexOf(fallbackEnd, start);
if (end < 0) {
  throw new Error(
    "PATCH MISS [canonical mouth fallback]: canonicalMouthRequest end boundary not found",
  );
}

const retryAndFallback = [
  "  if (retryParsed.length === beats.length) {",
  "    return {",
  "      text: JSON.stringify({",
  "        texts: retryParsed,",
  "      }),",
  "      model: modelName(),",
  "      provider: \"local\",",
  "    };",
  "  }",
  "",
  "  // Never erase usable model output. The author brain owns exact-count",
  "  // acceptance downstream; this transport layer must preserve evidence",
  "  // for repair instead of manufacturing an array of empty strings.",
  "  return {",
  "    text: JSON.stringify({",
  "      texts:",
  "        retryParsed.length > 0",
  "          ? retryParsed",
  "          : parsed.length > 0",
  "            ? parsed",
  "            : [],",
  "    }),",
  "    model: modelName(),",
  "    provider: \"local\",",
  "  };",
].join("\n");

text =
  text.slice(0, start) +
  retryAndFallback +
  text.slice(end);

if (!text.includes(newValidation)) {
  throw new Error(
    "PATCH VERIFY [canonical mouth validation]: exact-count validation missing after patch",
  );
}

if (
  text.includes("texts: Array.from(\n        { length: beats.length },")
) {
  throw new Error(
    "PATCH VERIFY [canonical mouth fallback]: empty-string fallback still present",
  );
}

fs.copyFileSync(target, backup);
fs.writeFileSync(target, text, "utf8");

console.log("PATCHED localModelRuntime.ts: preserve usable mouth output");
console.log(`BACKUP: ${backup}`);
console.log("MOUTH BATCH BOUNDARY PATCH COMPLETE.");
