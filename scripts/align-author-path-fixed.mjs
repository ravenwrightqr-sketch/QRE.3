import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/localModelRuntime.ts");
const backup = `${target}.before-mouth-runtime-boundary-${Date.now()}`;

const text = fs.readFileSync(target, "utf8");
fs.copyFileSync(target, backup);

const pattern = /\n\s*return \{\s*text: JSON\.stringify\(\{\s*texts: Array\.from\(\s*\{ length: beats\.length \},\s*\(\) => "",\s*\),\s*\}\),\s*model: modelName\(\),\s*provider: "local",\s*\};/m;

if (!pattern.test(text)) {
  throw new Error(
    "PATCH MISS [localModelRuntime.ts] canonical mouth empty-batch fallback. No files changed.",
  );
}

const replacement = `
  // Runtime transport must not erase a structurally valid mouth batch.
  // The Attention Editor and Cut Policy are the downstream editorial gates.
  return {
    text: JSON.stringify({
      texts:
        parsed.length === beats.length
          ? parsed
          : retryParsed.length === beats.length
            ? retryParsed
            : Array.from({ length: beats.length }, () => ""),
    }),
    model: modelName(),
    provider: "local",
  };`;

fs.writeFileSync(target, text.replace(pattern, replacement), "utf8");
console.log("PATCHED localModelRuntime.ts: preserve valid mouth batch");
console.log(`BACKUP: ${path.basename(backup)}`);
console.log("AUTHOR PATH ALIGNMENT PATCH COMPLETE.");
