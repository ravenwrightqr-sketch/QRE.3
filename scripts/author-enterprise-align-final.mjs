import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mouth = path.join(root, "apps/api/src/services/authorMouth.ts");
let source = fs.readFileSync(mouth, "utf8");

function replaceOnce(needle, replacement, label) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`PATCH FAILED: ${label}`);
  source = source.slice(0, index) + replacement + source.slice(index + needle.length);
}

// One-time opening identity invariant: creative realization never bypasses subject identity.
const oldOpeningGate = `  if (\n    missingSubjectAnchor &&\n    candidate.beatOrder === 1 &&\n    !candidate.reasons.includes(\n      "approved-semantic-realization",\n    )\n  ) {\n    return false;\n  }`;
if (source.includes(oldOpeningGate)) {
  replaceOnce(
    oldOpeningGate,
    `  if (missingSubjectAnchor && candidate.beatOrder === 1) {\n    return false;\n  }`,
    "opening identity invariant",
  );
}

// Recovery is an explicit render floor. Creative candidates always outrank it; it prevents zero-cut failure.
const oldEligible = `    const eligible =\n      dedupe([\n        ...creative,\n        ...openingLiteral,\n      ]);`;
if (source.includes(oldEligible)) {
  replaceOnce(
    oldEligible,
    `    const recovery =\n      dedupe(pool.candidates).filter((candidate) =>\n        candidate.reasons.includes("recovery-source"),\n      );\n\n    const eligible =\n      dedupe([\n        ...creative,\n        ...openingLiteral,\n        ...recovery,\n      ]);`,
    "selector recovery floor",
  );
}

// Rich-contract source already has this job; upgrade legacy wording only when encountered.
const legacyJob = `    creativeJob:\n      "Make the approved relationship FELT in one short line. Do not paraphrase the source sentence.",`;
const richJob = `    creativeJob:\n      "REALIZE THE APPROVED EXPERIENCE, not the source sentence. Use the full semantic contract: mechanism, relation, before/after meaning, realization move, creative opportunity, observer experience, and viewer-state change. Seek the sharpest memorable expression supported by those signals. Prefer implication, status, irony, compression, juxtaposition, personification, callback, reversal, or consequence when supported. Do not flatten a semantic turn into an event caption.",`;
if (!source.includes(richJob) && source.includes(legacyJob)) {
  replaceOnce(legacyJob, richJob, "rich semantic creative job");
}

const promptAnchor = `    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",`;
const promptExpansion = `${promptAnchor}\n\n    "The structured job is the AUTHORING CONTRACT. Use event structure, relations, continuity, patterns, semantic mechanism, before/after meaning, realization move, creative opportunity, observer objective, surprise, curiosity, landing, and viewer-state dynamics as active inputs to wording.",\n\n    "Grounding is a reality boundary, not an aesthetic ceiling. Be highly creative in syntax, rhythm, implication, metaphor, irony, status, juxtaposition, compression, callbacks, personification, and double meaning when the approved contract supports the form.",\n\n    "Do not turn a rich semantic turn into event-report language such as 'Then, X happened' unless literal reporting is genuinely the strongest truthful realization available.",\n\n    "Return materially different realization angles: direct-sharp, compressed/recontextualized, and boldest approved implication. Do not spend all three variants paraphrasing the source."`;
if (!source.includes("The structured job is the AUTHORING CONTRACT")) {
  replaceOnce(promptAnchor, promptExpansion, "enterprise realization prompt");
}

// Do not let universal Author's ontology depend on a finite English action dictionary.
// Preserve the existing semantic/provenance calculation; only remove the legacy word-list branch.
const actionStart = source.indexOf("  const unsupportedActions =");
if (actionStart >= 0) {
  const guardStart = source.indexOf("\n\n  if (\n    unsupportedActions.test", actionStart);
  if (guardStart < 0) throw new Error("PATCH FAILED: legacy action guard");
  const guardEnd = source.indexOf("\n  }", guardStart + 1);
  if (guardEnd < 0) throw new Error("PATCH FAILED: legacy action guard end");
  source = source.slice(0, actionStart) +
    `  /* Universal grounding is semantic/provenance based, never a finite English verb vocabulary. */\n  if (grounding < 0.08 && !semantic(beat)) {\n    return 0.95;\n  }\n\n  if (grounding < 0.12 && semantic(beat)) {\n    return 0.35;\n  }` +
    source.slice(guardEnd + "\n  }".length);
}

fs.writeFileSync(mouth, source, "utf8");
console.log("AUTHOR ENTERPRISE ALIGNMENT FINAL: APPLIED");
console.log("Rich contract -> Mouth | hard opening identity | recovery floor | provenance grounding | creative ceiling");
