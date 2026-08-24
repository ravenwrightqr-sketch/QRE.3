import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorMouthCandidateSearch.ts");

if (!fs.existsSync(target)) {
  throw new Error(`MOUTH PATCH FAILED: missing ${target}`);
}

let source = fs.readFileSync(target, "utf8");
const original = source;

function replaceOnce(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`MOUTH PATCH FAILED: ${label} expected exactly 1 match, found ${count}`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  "interpretive vocabulary",
  '  "oddly",\n]);',
  '  "oddly",\n  "absolutely",\n  "no",\n  "not",\n  "never",\n  "remain",\n  "remains",\n  "hard",\n  "pass",\n]);',
);

replaceOnce(
  "beat semantic mode",
  'const isPayoffBeat = (beat: MouthCandidateBeat): boolean => {',
  `const isPayoffBeat = (beat: MouthCandidateBeat): boolean => {\n  const mode = clean(beat.realizationMode).toLowerCase();\n  const role = clean(beat.role).toLowerCase();\n  const attention = clean(beat.attentionFunction).toLowerCase();\n  return mode.includes("payoff") || role === "payoff" || role === "release" || attention === "payoff" || attention === "release";\n};\n\nconst isStateOrRelationshipBeat = (beat: MouthCandidateBeat): boolean => {\n  const mode = clean(beat.realizationMode).toLowerCase();\n  const role = clean(beat.role).toLowerCase();\n  const move = clean(beat.creativeMove).toLowerCase();\n  return (\n    mode.includes("state") ||\n    mode.includes("relationship") ||\n    role === "reframe" ||\n    role === "relationship" ||\n    move.includes("recontext") ||\n    move.includes("status") ||\n    move.includes("contrast")\n  );\n};\n\nconst isHookBeat = (beat: MouthCandidateBeat): boolean => {\n  const role = clean(beat.role).toLowerCase();\n  const attention = clean(beat.attentionFunction).toLowerCase();\n  const mode = clean(beat.realizationMode).toLowerCase();\n  return attention === "hook" || role === "arrival" || role === "establish" || mode === "hook" || mode === "establish hook";\n};`,
);

replaceOnce(
  "state relationship fallback",
  '  if (isPayoffBeat(beat)) {\n    addVariant(out, endpointText(beat));\n    return out;\n  }',
  `  if (isPayoffBeat(beat)) {\n    addVariant(out, endpointText(beat));\n    return out;\n  }\n\n  if (isStateOrRelationshipBeat(beat)) {\n    if (first) {\n      addVariant(out, first);\n      addVariant(out, \\"${first}, apparently.\\");\n      addVariant(out, \\"Still ${first}.\\");\n      addVariant(out, \\"${first}? Absolutely.\\");\n      addVariant(out, \\"${first}? Not happening.\\");\n    }\n    if (first && second) {\n      addVariant(out, \\"${first}. Then ${second}.\\");\n      addVariant(out, \\"${first}, until ${second}.\\");\n      addVariant(out, \\"${second}, despite ${first}.\\");\n    }\n  }`,
);

replaceOnce(
  "hook fallback reason",
  '  if (!reasons.length && groundedFallbackTexts(input.beat, input.envelope).some((fallback) => normalizeLine(fallback) === text)) {\n    reasons.push("grounded-fallback");\n  }',
  `  if (!reasons.length && groundedFallbackTexts(input.beat, input.envelope).some((fallback) => normalizeLine(fallback) === text)) {\n    reasons.push("grounded-fallback");\n  }\n  if (isHookBeat(input.beat)) reasons.push("hook-scored-as-establishment");`,
);

replaceOnce(
  "state relationship prompt",
  '    "Make the next cut feel desirable without inventing a new event.",\n    "",\n    "REALITY LOCK:',
  `    "Make the next cut feel desirable without inventing a new event.",\n    "",\n    "STATE / RELATIONSHIP BEATS: if the approved beat is a supplied state, preference, attitude, or relationship, realize its meaning through wording, implication, status, contrast, compression, or rhetorical attitude. Do NOT invent a physical reaction or concrete action just to make the line vivid.",\n    "Examples of legal state/relationship realization: \\"Bows? Absolutely not.\\" \\"Still no bows.\\" \\"Nervous, at first.\\" \\"Peace was temporary.\\" These are examples of technique, not facts to copy.",\n    "",\n    "REALITY LOCK:`,
);

if (source === original) {
  throw new Error("MOUTH PATCH FAILED: file was unchanged");
}

fs.writeFileSync(target, source, "utf8");
console.log(`MOUTH PATCH APPLIED: ${path.relative(root, target)}`);
