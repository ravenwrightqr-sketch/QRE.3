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

const newParser = `function parseMouthBatch(
  raw: string,
  expected: number,
): string[] {
  const text = raw
    .replace(/^(?:\u0060{3})(?:json)?/i, "")
    .replace(/(?:\u0060{3})$/i, "")
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

const oldFallback = `  return {
    text: JSON.stringify({
      texts: Array.from(
        { length: beats.length },
        () => "",
      ),
    }),
    model: modelName(),
    provider: "local",
  };
}`;

const preservedFallback = `  // Preserve usable model output. The canonical author brain owns
  // exact-count repair and final acceptance downstream.
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
  };
}`;

if (text.includes(oldFallback)) {
  text = text.replace(oldFallback, preservedFallback);
} else if (
  text.includes("retryParsed.length > 0") &&
  text.includes("parsed.length > 0")
) {
  console.log(
    "canonical mouth fallback already patched; preserving current state",
  );
} else {
  throw new Error(
    "PATCH MISS [canonical mouth fallback]: neither the known old fallback nor the already-patched fallback was found",
  );
}

fs.copyFileSync(target, backup);
fs.writeFileSync(target, text, "utf8");

console.log("PATCHED localModelRuntime.ts: preserve usable mouth output");
console.log(`BACKUP: ${backup}`);
console.log("MOUTH BATCH BOUNDARY PATCH COMPLETE.");
