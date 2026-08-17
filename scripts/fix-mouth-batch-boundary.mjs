import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "apps/api/src/services/localModelRuntime.ts",
);
const backup = `${target}.before-mouth-batch-boundary-${Date.now()}`;

let text = fs.readFileSync(target, "utf8");
fs.copyFileSync(target, backup);

function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) {
    throw new Error(`PATCH MISS [${label}]: start marker not found`);
  }

  const end = source.indexOf(endMarker, start);
  if (end < 0) {
    throw new Error(`PATCH MISS [${label}]: end marker not found`);
  }

  return (
    source.slice(0, start) +
    replacement +
    source.slice(end)
  );
}

const newParser = `function parseMouthBatch(
  raw: string,
  expected: number,
): string[] {
  const text = raw
    .replace(/^(?:\\u0060\\u0060\\u0060)(?:json)?/i, "")
    .replace(/(?:\\u0060\\u0060\\u0060)$/i, "")
    .trim();

  try {
    const value = JSON.parse(text) as {
      texts?: unknown;
    };

    if (!Array.isArray(value.texts)) {
      return [];
    }

    return value.texts
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .slice(0, expected);
  } catch {
    return [];
  }
}

`;

text = replaceBetween(
  text,
  "function parseMouthBatch(",
  "async function canonicalMouthRequest(",
  newParser,
  "parseMouthBatch",
);

const fallbackStart = text.indexOf(
  "  return {\n    text: JSON.stringify({\n      texts: Array.from(",
);

if (fallbackStart < 0) {
  throw new Error(
    "PATCH MISS [canonical mouth fallback]: old empty fallback not found",
  );
}

const fallbackEndMarker =
  "  };\n}\n\nexport async function localModelGenerate(";
const fallbackEnd = text.indexOf(
  fallbackEndMarker,
  fallbackStart,
);

if (fallbackEnd < 0) {
  throw new Error(
    "PATCH MISS [canonical mouth fallback]: end marker not found",
  );
}

const newFallback = `  // Preserve any usable model output. The canonical author brain
  // remains responsible for exact-count repair and final acceptance.
  return {
    text: JSON.stringify({
      texts:
        retryParsed.length > 0
          ? retryParsed
          : parsed.length > 0
            ? parsed
            : [],
    }),
    model: modelName(),
    provider: "local",
`;

text =
  text.slice(0, fallbackStart) +
  newFallback +
  text.slice(fallbackEnd);

fs.writeFileSync(target, text, "utf8");

console.log("PATCHED localModelRuntime.ts: preserve usable mouth output");
console.log(`BACKUP: ${backup}`);
console.log("MOUTH BATCH BOUNDARY PATCH COMPLETE.");
