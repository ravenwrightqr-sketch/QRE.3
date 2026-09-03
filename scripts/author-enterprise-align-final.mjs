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

function replaceIfPresent(needle, replacement) {
  const index = source.indexOf(needle);
  if (index >= 0) {
    source = source.slice(0, index) + replacement + source.slice(index + needle.length);
    return true;
  }
  return false;
}

// 1. Opening identity is a sequence invariant.
const openingGate = `  if (\n    missingSubjectAnchor &&\n    candidate.beatOrder === 1 &&\n    !candidate.reasons.includes(\n      "approved-semantic-realization",\n    )\n  ) {\n    return false;\n  }`;
if (source.includes(openingGate)) {
  replaceOnce(openingGate, `  if (missingSubjectAnchor && candidate.beatOrder === 1) {\n    return false;\n  }`, "opening identity boundary");
}

// 2. Recovery must guarantee a renderable sequence rather than an empty selector result.
const eligible = `    const eligible =\n      dedupe([\n        ...creative,\n        ...openingLiteral,\n      ]);`;
if (source.includes(eligible)) {
  replaceOnce(eligible, `    const recovery =\n      dedupe(pool.candidates).filter((candidate) =>\n        candidate.reasons.includes("recovery-source"),\n      );\n\n    const eligible =\n      dedupe([\n        ...creative,\n        ...openingLiteral,\n        ...recovery,\n      ]);`, "recovery render floor");
}

// 3. Enterprise semantic realization job. Accept the already-rich job as idempotent.
const enterpriseJob = `    creativeJob:\n      "REALIZE THE APPROVED EXPERIENCE, not the source sentence. Use the full semantic contract: mechanism, relation, before/after meaning, realization move, creative opportunity, observer experience, and viewer-state change. Seek the sharpest memorable expression supported by those signals. Prefer implication, status, irony, compression, juxtaposition, personification, callback, reversal, or consequence when supported. Do not flatten a semantic turn into an event caption.",`;
if (!source.includes(enterpriseJob)) {
  const previousRichJob = `    creativeJob:\n      "REALIZE THE EXPERIENCE, not the source sentence. Find the sharpest, most memorable language that lets the approved semantic change be felt. Prefer implication, image, attitude, status, tension, irony, juxtaposition, compression, or comic pressure when supported. Do not flatten a rich semantic opportunity into a literal summary.",`;
  const originalJob = `    creativeJob:\n      "Make the approved relationship FELT in one short line. Do not paraphrase the source sentence.",`;
  if (!replaceIfPresent(previousRichJob, enterpriseJob)) {
    replaceOnce(originalJob, enterpriseJob, "enterprise creative job");
  }
}

// 4. Add the full authoring contract to the system prompt once.
if (!source.includes("The structured job is the AUTHORING CONTRACT")) {
  const promptAnchor = `    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",`;
  replaceOnce(promptAnchor, `${promptAnchor}\n\n    "The structured job is the AUTHORING CONTRACT. Use event structure, relations, continuity, patterns, semantic mechanism, before/after meaning, realization move, creative opportunity, observer objective, surprise, curiosity, landing, and viewer-state dynamics as active inputs to wording.",\n\n    "Grounding is a reality boundary, not an aesthetic ceiling. Be highly creative in syntax, rhythm, implication, metaphor, irony, status, juxtaposition, compression, callbacks, personification, and double meaning when the approved contract supports the form.",\n\n    "Do not turn a rich semantic turn into event-report language such as 'Then, X happened' unless literal reporting is genuinely the strongest truthful realization available.",\n\n    "Return materially different realization angles: direct-sharp, compressed/recontextualized, and boldest approved implication. Do not spend all three variants paraphrasing the source.",`, "enterprise realization prompt");
}

// 5. Replace the finite English action dictionary with provenance/semantic grounding.
const start = source.indexOf("  const unsupportedActions =");
if (start >= 0) {
  const conditionStart = source.indexOf("\n\n  if (\n    unsupportedActions.test", start);
  if (conditionStart < 0) throw new Error("PATCH FAILED: unsupported action guard boundary");
  const conditionEnd = source.indexOf("\n  }", conditionStart + 1);
  if (conditionEnd < 0) throw new Error("PATCH FAILED: unsupported action guard end");
  source = source.slice(0, start) + `  /* Universal Author grounding is ontology/provenance based, never a finite English verb list. */\n  if (grounding < 0.08 && !semantic(beat)) {\n    return 0.95;\n  }\n\n  if (grounding < 0.12 && semantic(beat)) {\n    return 0.35;\n  }` + source.slice(conditionEnd + "\n  }".length);
}

// 6. Preserve creator-authored absurdity explicitly.
const realityLine = `    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",`;
if (source.includes(realityLine) && !source.includes("creator's supplied reality as authoritative")) {
  replaceOnce(realityLine, `${realityLine}\n\n    "Treat the creator's supplied reality as authoritative even when it is strange, impossible, contradictory, comedic, or implausible. Never normalize it into a more plausible version.",`, "creator reality authority");
}

fs.writeFileSync(mouth, source, "utf8");
console.log("AUTHOR ENTERPRISE ALIGNMENT FINAL: APPLIED");
console.log("Rich contract -> Mouth | hard identity | recovery floor | provenance grounding | high creative ceiling | creator reality authoritative");
