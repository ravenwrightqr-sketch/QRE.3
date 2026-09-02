import fs from "node:fs";
import path from "node:path";

const fixes = [
  [
    "apps/api/src/services/authorSatanicoEvidenceSearch.ts",
    "const first = orderedEntityIds[0]; const last = orderedEntityIds.at(-1);",
    "const first = orderedEntityIds[0]; const last = orderedEntityIds[orderedEntityIds.length - 1];",
  ],
  [
    "apps/api/src/services/authorSatanicoInference.ts",
    'const finalDetail = preference.labels.at(-1) ?? "the final supplied preference";',
    'const finalDetail = preference.labels[preference.labels.length - 1] ?? "the final supplied preference";',
  ],
];

for (const [relativePath, from, to] of fixes) {
  const file = path.resolve(relativePath);
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes(from)) {
    if (source.includes(to)) continue;
    throw new Error(`Expected compatibility anchor not found: ${relativePath}`);
  }
  fs.writeFileSync(file, source.replace(from, to), "utf8");
  console.log(`Fixed ${relativePath}`);
}
