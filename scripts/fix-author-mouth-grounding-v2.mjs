import fs from "node:fs";

const path = "apps/api/src/services/authorMouthCandidateSearch.ts";
const text = fs.readFileSync(path, "utf8");

const requiredBlock = /  const source = tokenSet\(sourceForBeat\(input\.beat, input\.envelope\)\.join\(" "\)\);\n  const current = tokenSet\(text\);\n  const required = unique\(input\.beat\.eventIds \?\? \[\]\);\n  const supportedEventIds = input\.envelope\.events[\\s\\S]*?\n    \.filter\(\(id\) => required\.length === 0 \|\| required\.includes\(id\)\);\n\n  const supportedRelationPairs = input\.envelope\.relations\n/;

const replacement = `  const sourceLabels = sourceForBeat(input.beat, input.envelope);\n  const source = tokenSet(sourceLabels.join(" "));\n  const current = tokenSet(text);\n  const required = unique(input.beat.eventIds ?? []);\n\n  const phraseSupported = (candidateText, label) => {\n    const candidate = clean(candidateText).toLowerCase();\n    const phrase = clean(label).toLowerCase();\n    return Boolean(phrase && candidate.includes(phrase));\n  };\n\n  const eventSupported = (event) => {\n    if (!current.size) return false;\n    if (phraseSupported(text, event.label)) return true;\n    const labelTokens = tokenSet(event.label);\n    if (!labelTokens.size) return false;\n    return overlap(current, labelTokens) >= 0.2;\n  };\n\n  const supportedEventIds = input.envelope.events\n    .filter((event) => eventSupported(event))\n    .map((event) => event.id)\n    .filter((id) => required.length === 0 || required.includes(id));\n\n  const requiredSupportedCount = required.filter((id) => {\n    const label = eventLabel(input.envelope, id);\n    return Boolean(label && (phraseSupported(text, label) || eventSupported({ id, label })));\n  }).length;\n\n  const supportedRelationPairs = input.envelope.relations\n`;

if (!requiredBlock.test(text)) {
  throw new Error("PATCH FAILED: Mouth required-event grounding block");
}

let next = text.replace(requiredBlock, replacement);

const groundingBlock = /  const groundingScore = Math\.max\(0\.35, overlap\(current, source\) \* 0\.7 \+ \(supportedEventIds\.length \? 0\.3 : 0\)\);\n/;

const groundingReplacement = `  const directSourceMatch = overlap(current, source);\n  const requiredCoverage = required.length\n    ? requiredSupportedCount / required.length\n    : supportedEventIds.length\n      ? 1\n      : 0;\n  const groundingScore = Math.max(\n    0.35,\n    Math.min(1, directSourceMatch * 0.7 + requiredCoverage * 0.4 + (supportedEventIds.length ? 0.15 : 0)),\n  );\n`;

if (!groundingBlock.test(next)) {
  throw new Error("PATCH FAILED: Mouth grounding score");
}

next = next.replace(groundingBlock, groundingReplacement);
fs.writeFileSync(path, next, "utf8");

console.log("PATCHED: authorMouthCandidateSearch.ts · required-event grounding v2");
console.log("AUTHOR MOUTH GROUNDING V2 COMPLETE");
