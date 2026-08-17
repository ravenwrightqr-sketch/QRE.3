import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "apps/api/src/services/localModelRuntime.ts",
);
const backup = `${target}.before-mouth-batch-boundary-${Date.now()}`;

let text = fs.readFileSync(target, "utf8");

function replaceBlock(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`PATCH MISS [${label}]`);
  }
  return source.replace(pattern, replacement);
}

const parserPattern = /function parseMouthBatch\([\s\S]*?\n\}\n\nasync function canonicalMouthRequest\(/;
const parserReplacement = `function parseMouthBatch(
  raw: string,
  expected: number,
): string[] {
  const text = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const value = JSON.parse(text) as { texts?: unknown };
    if (!Array.isArray(value.texts)) return [];

    const texts = value.texts
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .slice(0, expected);

    return texts.length === expected ? texts : [];
  } catch {
    return [];
  }
}

async function canonicalMouthRequest(`;

text = replaceBlock(
  text,
  parserPattern,
  parserReplacement,
  "parseMouthBatch",
);

const validationPattern = /const valid = parsed\.every\(mouthAcceptable\);/;
if (validationPattern.test(text)) {
  text = text.replace(
    validationPattern,
    "const valid = parsed.length === beats.length && parsed.every(mouthAcceptable);",
  );
} else if (!text.includes("parsed.length === beats.length && parsed.every(mouthAcceptable)")) {
  throw new Error("PATCH MISS [canonical mouth validation]");
}

const emptyFallbackPattern = /\n  return \{\n    text: JSON\.stringify\(\{\n      texts: Array\.from\(\n        \{ length: beats\.length \},\n        \(\) => \"\",\n      \),\n    \}\),\n    model: modelName\(\),\n    provider: \"local\",\n  \};\n\}/;

const preservedFallback = `

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

if (emptyFallbackPattern.test(text)) {
  text = text.replace(emptyFallbackPattern, preservedFallback);
} else if (
  !text.includes("retryParsed.length > 0") ||
  !text.includes("parsed.length > 0")
) {
  throw new Error("PATCH MISS [canonical mouth fallback]");
}

if (!text.includes("parsed.length === beats.length && parsed.every(mouthAcceptable)")) {
  throw new Error("PATCH VERIFY [canonical mouth validation]");
}

if (text.includes("texts: Array.from(\n        { length: beats.length },")) {
  throw new Error("PATCH VERIFY [canonical mouth fallback]");
}

fs.copyFileSync(target, backup);
fs.writeFileSync(target, text, "utf8");

console.log("PATCHED localModelRuntime.ts: canonical mouth boundary aligned");
console.log(`BACKUP: ${backup}`);
console.log("MOUTH BATCH BOUNDARY PATCH COMPLETE.");
