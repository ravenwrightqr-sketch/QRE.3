import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "apps/api/src/services/authorMouth.ts");
let source = fs.readFileSync(file, "utf8");

function replaceOnce(needle, replacement, label) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`PATCH FAILED: ${label}`);
  source = source.slice(0, index) + replacement + source.slice(index + needle.length);
}

// 1. Opening identity is a sequence invariant. Semantic creativity never bypasses it.
const oldOpeningGate = `  if (\n    missingSubjectAnchor &&\n    candidate.beatOrder === 1 &&\n    !candidate.reasons.includes(\n      "approved-semantic-realization",\n    )\n  ) {\n    return false;\n  }`;
const newOpeningGate = `  if (missingSubjectAnchor && candidate.beatOrder === 1) {\n    return false;\n  }`;
if (source.includes(oldOpeningGate)) replaceOnce(oldOpeningGate, newOpeningGate, "opening identity gate");

// 2. Recovery is an explicit last-resort path, never a reason to return zero cuts.
const oldEligible = `    const eligible =\n      dedupe([\n        ...creative,\n        ...openingLiteral,\n      ]);`;
const newEligible = `    const recovery =\n      dedupe(pool.candidates)\n        .filter((candidate) =>\n          candidate.reasons.includes("recovery-source"),\n        );\n\n    const eligible =\n      dedupe([\n        ...creative,\n        ...openingLiteral,\n        ...recovery,\n      ]);`;
if (source.includes(oldEligible)) replaceOnce(oldEligible, newEligible, "selector recovery floor");

// 3. The model must realize the semantic contract, not flatten it into an event caption.
const oldJob = `    creativeJob:\n      "Make the approved relationship FELT in one short line. Do not paraphrase the source sentence.",`;
const newJob = `    creativeJob:\n      "REALIZE THE APPROVED EXPERIENCE, not the source sentence. Use the full semantic contract: mechanism, relation, before/after meaning, realization move, creative opportunity, observer experience, and viewer-state change. Seek the sharpest memorable expression supported by those signals. Prefer implication, status, irony, compression, juxtaposition, personification, callback, reversal, or consequence when supported. Do not flatten a semantic turn into an event caption.",`;
if (source.includes(oldJob)) replaceOnce(oldJob, newJob, "creative job");

const oldPrompt = `    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",\n\n    "Every non-opening beat must make the approved relationship FELT: reframe, contrast, collision, implication, callback, status reversal, understatement, or another supplied semantic turn.",`;
const newPrompt = `    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",\n\n    "The structured job is the AUTHORING CONTRACT. Use its event structure, relations, continuity, patterns, semantic mechanism, before/after meaning, realization move, creative opportunity, observer objective, surprise, curiosity, landing, and viewer-state dynamics as active inputs to wording.",\n\n    "The aesthetic ceiling is high. Do not confuse grounding with literalness. Grounding constrains concrete reality; creativity operates freely in syntax, rhythm, implication, metaphor, irony, status, juxtaposition, compression, callbacks, and double meaning when those forms are supported by the contract.",\n\n    "Do not write event-report language when a richer semantic realization is approved. Avoid lines shaped like 'Then, X happened' unless literal reporting is the only truthful realization available.",\n\n    "Generate materially different realization angles. One may be direct-sharp, one compressed/recontextualized, and one the boldest approved implication. They must not be three cautious paraphrases.",\n\n    "Every non-opening beat must make the approved relationship FELT: reframe, contrast, collision, implication, callback, status reversal, understatement, or another supplied semantic turn.",`;
if (source.includes(oldPrompt)) replaceOnce(oldPrompt, newPrompt, "enterprise Mouth prompt");

// 4. Replace the brittle finite action dictionary with semantic/provenance grounding.
const actionBlockStart = `  const unsupportedActions =\n    /\\b(?:walk(?:ed|s)?|run(?:ning|s)?|jump(?:ed|s|ing)?|grab(?:bed|s|bing)?|kiss(?:ed|es|ing)?|hug(?:ged|s|ging)?|smil(?:ed|es|ing)?|laugh(?:ed|s|ing)?|talk(?:ed|s|ing)?|open(?:ed|s|ing)?|clos(?:ed|es|ing)?|enter(?:ed|s|ing)?|look(?:ed|s|ing)?|move(?:d|s|ing)?|touch(?:ed|es|ing)?|throw|threw|catch|caught|dance(?:d|s|ing)?|drive|drove|push(?:ed|es|ing)?|pull(?:ed|s|ing)?|vanish(?:ed|s|ing)?|disappear(?:ed|s|ing)?|blink(?:ed|s|ing)?|wave(?:d|s|ing)?)\\b/i;\n\n  if (\n    unsupportedActions.test(\n      value,\n    ) &&\n    grounding < 0.45\n  ) {\n    return 1;\n  }`;
const actionBlockReplacement = `  /*\n   * No finite English action vocabulary belongs in universal Author.\n   * Concrete invention is controlled by provenance/grounding and the\n   * approved semantic contract, not by a growing word list.\n   *\n   * A highly novel but semantically authorized realization can therefore\n   * use vocabulary unseen elsewhere in the product without being rejected.\n   */\n  if (grounding < 0.08 && !semantic(beat)) {\n    return 0.95;\n  }\n\n  if (grounding < 0.12 && semantic(beat)) {\n    return 0.35;\n  }`;
if (source.includes(actionBlockStart)) replaceOnce(actionBlockStart, actionBlockReplacement, "finite action dictionary");

fs.writeFileSync(file, source, "utf8");
console.log("AUTHOR ENTERPRISE ALIGNMENT: APPLIED");
console.log("Rich semantic contract -> Mouth, hard opening identity, recovery floor, high-variance realization, graph/provenance grounding.");
