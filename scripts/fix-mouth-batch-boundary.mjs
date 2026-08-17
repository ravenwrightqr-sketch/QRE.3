import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/localModelRuntime.ts");
const backup = `${target}.before-mouth-batch-boundary-${Date.now()}`;

let text = fs.readFileSync(target, "utf8");
fs.copyFileSync(target, backup);

const oldParser = /function parseMouthBatch\(\n  raw: string,\n  expected: number,\n\): string\[\] \{[\s\S]*?\n\}\n\nasync function canonicalMouthRequest/;

const newParser = String.raw`function parseMouthBatch(
  raw: string,
  expected: number,
): string[] {
  const text = raw
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
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

async function canonicalMouthRequest`;

if (!oldParser.test(text)) {
  throw new Error("PATCH MISS: parseMouthBatch block not found");
}

text = text.replace(oldParser, newParser);

const oldFinal = /  return \{\n    text: JSON\.stringify\(\{\n      texts: Array\.from\(\n        \{ length: beats\.length \},\n        \(\) => "",\n      \),\n    \}\),\n    model: modelName\(\),\n    provider: "local",\n  \};/;

const newFinal = `  // Do not erase usable model output. The canonical author brain owns
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
  };`;

if (!oldFinal.test(text)) {
  throw new Error("PATCH MISS: canonical mouth empty fallback not found");
}

text = text.replace(oldFinal, newFinal);
fs.writeFileSync(target, text, "utf8");

console.log("PATCHED apps/api/src/services/localModelRuntime.ts");
console.log(`Backup: ${backup}`);
