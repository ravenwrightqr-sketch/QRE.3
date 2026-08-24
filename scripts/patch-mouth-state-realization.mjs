import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorMouthCandidateSearch.ts");

if (!fs.existsSync(target)) throw new Error(`MOUTH PATCH FAILED: missing ${target}`);

let source = fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n");
const original = source;

function replaceOnce(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`MOUTH PATCH FAILED: ${label} expected exactly 1 match, found ${count}`);
  source = source.replace(before, after);
}

replaceOnce(
  "interpretive vocabulary",
  '  "oddly",\n]);',
  '  "oddly",\n  "absolutely",\n  "no",\n  "not",\n  "never",\n  "remain",\n  "remains",\n  "hard",\n  "pass",\n]);',
);

const payoffBlock = /const isPayoffBeat = \(beat: MouthCandidateBeat\): boolean => \{[\s\S]*?\n\};\n/;
if (!payoffBlock.test(source)) throw new Error("MOUTH PATCH FAILED: isPayoffBeat block not found");
source = source.replace(payoffBlock, `const isPayoffBeat = (beat: MouthCandidateBeat): boolean => {
  const mode = clean(beat.realizationMode).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  const attention = clean(beat.attentionFunction).toLowerCase();
  return mode.includes("payoff") || role === "payoff" || role === "release" || attention === "payoff" || attention === "release";
};

const isStateOrRelationshipBeat = (beat: MouthCandidateBeat): boolean => {
  const mode = clean(beat.realizationMode).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  const move = clean(beat.creativeMove).toLowerCase();
  return (
    mode.includes("state") ||
    mode.includes("relationship") ||
    role === "reframe" ||
    role === "relationship" ||
    move.includes("recontext") ||
    move.includes("status") ||
    move.includes("contrast")
  );
};

const isHookBeat = (beat: MouthCandidateBeat): boolean => {
  const role = clean(beat.role).toLowerCase();
  const attention = clean(beat.attentionFunction).toLowerCase();
  const mode = clean(beat.realizationMode).toLowerCase();
  return attention === "hook" || role === "arrival" || role === "establish" || mode === "hook" || mode === "establish hook";
};
`);

replaceOnce(
  "state relationship fallback",
  '  if (isPayoffBeat(beat)) {\n    addVariant(out, endpointText(beat));\n    return out;\n  }',
  `  if (isPayoffBeat(beat)) {
    addVariant(out, endpointText(beat));
    return out;
  }

  if (isStateOrRelationshipBeat(beat)) {
    if (first) {
      addVariant(out, first);
      addVariant(out, first + ", apparently.");
      addVariant(out, "Still " + first + ".");
      addVariant(out, first + "? Absolutely.");
      addVariant(out, first + "? Not happening.");
    }
    if (first && second) {
      addVariant(out, first + ". Then " + second + ".");
      addVariant(out, first + ", until " + second + ".");
      addVariant(out, second + ", despite " + first + ".");
    }
  }`,
);

replaceOnce(
  "hook fallback reason",
  '  if (!reasons.length && groundedFallbackTexts(input.beat, input.envelope).some((fallback) => normalizeLine(fallback) === text)) {\n    reasons.push("grounded-fallback");\n  }',
  `  if (!reasons.length && groundedFallbackTexts(input.beat, input.envelope).some((fallback) => normalizeLine(fallback) === text)) {
    reasons.push("grounded-fallback");
  }
  if (isHookBeat(input.beat)) reasons.push("hook-scored-as-establishment");`,
);

replaceOnce(
  "state relationship prompt",
  '    "Make the next cut feel desirable without inventing a new event.",\n    "",\n    "REALITY LOCK:',
  `    "Make the next cut feel desirable without inventing a new event.",
    "",
    "STATE / RELATIONSHIP BEATS: if the approved beat is a supplied state, preference, attitude, or relationship, realize its meaning through wording, implication, status, contrast, compression, or rhetorical attitude. Do NOT invent a physical reaction or concrete action just to make the line vivid.",
    "Examples of legal state/relationship realization: \\"Bows? Absolutely not.\\" \\"Still no bows.\\" \\"Nervous, at first.\\" \\"Peace was temporary.\\" These are examples of technique, not facts to copy.",
    "",
    "REALITY LOCK:`,
);

if (source === original) throw new Error("MOUTH PATCH FAILED: file was unchanged");

fs.writeFileSync(target, source, "utf8");
console.log(`MOUTH PATCH APPLIED: ${path.relative(root, target)}`);
