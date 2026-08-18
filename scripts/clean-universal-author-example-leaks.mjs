import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const backup = `${target}.pure-cognition.bak`;

const replacements = new Map([
  [
    '"\'Coco got a bath\' is material, not the destination.",',
    '"Supplied events are material, not automatically destinations.",',
  ],
  [
    '"The bath should make us wonder what it reveals, what changes because of it, or what later detail gives it new meaning.",',
    '"Ask what the supplied event reveals, changes, connects, or makes newly meaningful according to the selected movie and graph.",',
  ],
  [
    '"\'Coco stole a blue bow\' is material, not the destination.",',
    '"A supplied concrete detail can become a carrier of meaning when the evidence supports that role.",',
  ],
  [
    '"The bow should acquire significance through the character, contradiction, status shift, consequence, or callback already supported by the evidence.",',
    '"The meaning carrier must be discovered from selected relationships, character read, lens, trajectory, and endpoint rather than from an example-specific recipe.",',
  ],
]);

const source = fs.readFileSync(target, "utf8");
let updated = source;
let replacementsMade = 0;

for (const [from, to] of replacements) {
  if (updated.includes(from)) {
    updated = updated.replace(from, to);
    replacementsMade += 1;
  }
}

if (updated === source) {
  console.log("No example-leak replacements were necessary.");
  process.exit(0);
}

fs.writeFileSync(backup, source, "utf8");
fs.writeFileSync(target, updated, "utf8");
console.log(`Applied ${replacementsMade} universal-author example-leak replacements.`);
console.log(`Backup written to ${path.relative(root, backup)}.`);
