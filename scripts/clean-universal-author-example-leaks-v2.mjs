import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const backup = `${target}.universal-cleanup-v2.bak`;

let source = fs.readFileSync(target, "utf8");
const original = source;

const replacements = [
  ["Coco got a bath", "the supplied event"],
  ["Coco stole a blue bow", "the supplied concrete detail"],
  ["'Coco got a bath'", "a supplied event"],
  ["'Coco stole a blue bow'", "a supplied concrete detail"],
  ["\"Coco got a bath\"", "\"a supplied event\""],
  ["\"Coco stole a blue bow\"", "\"a supplied concrete detail\""],
];

for (const [from, to] of replacements) {
  source = source.split(from).join(to);
}

source = source.replace(
  /const CONCRETE_CLAIM\s*=\s*\/\\b\(\?:wears\?[^;]+?\)\\b\/i;?/s,
  `const CONCRETE_CLAIM = /\\b(?:wears?|wearing|dances?|dancing|holds?|holding|walks?|walking|runs?|running|jumps?|jumping|leaps?|leaping|sits?|sitting|stands?|standing|ties?|tied|wrapping|wrapped|throws?|threw|laughs?|laughing|surprised|shocked|everyone|someone|nobody)\\b/i;`,
);

if (source === original) {
  throw new Error("No known universal-author example leaks were changed.");
}

fs.writeFileSync(backup, original, "utf8");
fs.writeFileSync(target, source, "utf8");

console.log("Removed universal-author example/domain leakage.");
console.log(`Backup: ${path.relative(root, backup)}`);
