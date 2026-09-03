import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorMouth.ts");
let source = fs.readFileSync(file, "utf8");

const old = `  return (\n    candidate.reasons.includes(\n      "approved-semantic-realization",\n    ) &&\n    candidate.reasons.includes(\n      "realization-lift",\n    ) &&\n    candidate.score >= 0.3\n  );`;

const next = `  const approvedMeaning =\n    candidate.reasons.includes(\n      "approved-semantic-realization",\n    );\n\n  const groundedRealization =\n    candidate.reasons.includes(\n      "realization-lift",\n    ) ||\n    candidate.reasons.includes(\n      "meaning-executed",\n    ) ||\n    candidate.reasons.includes(\n      "event-grounded",\n    );\n\n  return (\n    approvedMeaning &&\n    groundedRealization &&\n    candidate.score >= 0.3\n  );`;

if (!source.includes(old)) {
  throw new Error("PATCH FAILED: Mouth semantic authorization boundary not found");
}

source = source.replace(old, next);
fs.writeFileSync(file, source, "utf8");
console.log("AUTHOR MOUTH SEMANTIC AUTHORIZATION GREEN");
console.log("Grounded approved realizations no longer require lexical realization-lift.");
console.log("Recovery remains fallback-only.");
