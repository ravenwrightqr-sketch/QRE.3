import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mouthPath = path.join(root, "apps/api/src/services/authorMouth.ts");
const brainPath = path.join(root, "apps/api/src/services/authorBrainCanonical.ts");

function read(file) { return fs.readFileSync(file, "utf8"); }
function write(file, source) { fs.writeFileSync(file, source); }
function replaceOnce(source, needle, replacement, label) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`AUTHOR FEELING ALIGN FAILED: missing ${label}`);
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}
function replaceRegex(source, regex, replacement, label) {
  if (!regex.test(source)) throw new Error(`AUTHOR FEELING ALIGN FAILED: missing ${label}`);
  return source.replace(regex, replacement);
}

let mouth = read(mouthPath);

// Carry the first-class felt semantic contract into Mouth without copying the whole thesis.
if (!mouth.includes("feltEffect: clean(")) {
  mouth = replaceOnce(
    mouth,
    '            forbidden:\n              beat\n                .observerExperience\n                .explanationForbidden ===\n              true,',
    '            forbidden:\n              beat\n                .observerExperience\n                .explanationForbidden ===\n              true,\n            feltEffect: clean(\n              beat\n                .observerExperience\n                .feltEffect,\n            ),\n            viewerShift: clean(\n              beat\n                .observerExperience\n                .viewerShift,\n            ),\n            realizationDirection: clean(\n              beat\n                .observerExperience\n                .realizationDirection,\n            ),',
    "Mouth observer felt fields",
  );
}

if (!mouth.includes('feltEffect: clean(\n        s?.feltEffect')) {
  mouth = replaceOnce(
    mouth,
    '      opportunity: clean(\n        s?.creativeOpportunity,\n      ),',
    '      opportunity: clean(\n        s?.creativeOpportunity,\n      ),\n      feltEffect: clean(\n        s?.feltEffect,\n      ),\n      viewerShift: clean(\n        s?.viewerShift,\n      ),\n      languageAim: clean(\n        s?.languageAim,\n      ),',
    "Mouth semantic felt fields",
  );
}

mouth = mouth.replace(
  '      "Make the approved relationship FELT in one short line. Do not paraphrase the source sentence.",',
  '      "Make the approved relationship FELT in one short line. The line should cause a perceptual or emotional click, not explain the relationship. Do not paraphrase the source sentence.",',
);

// Replace the non-universal verb dictionary with semantic authorization.
mouth = replaceRegex(
  mouth,
  /\n  \/\*\*\n   \* This is only a guard against concrete actions that have[\s\S]*?\n  \/\*\*[\s\S]*?\n  \*\/$/,
  "",
  "unsupported-action block",
);

// The exact block above varies between aligned Mouth revisions; use the stable dictionary anchor as a fallback.
const dictionaryAnchor = /\n  const unsupportedActions =\n    \/\\b\(\?:walk[\\s\\S]*?\n  if \(\n    unsupportedActions\.test\([\s\S]*?\n    return 1;\n  \}\n/;
if (dictionaryAnchor.test(mouth)) {
  mouth = mouth.replace(dictionaryAnchor, '\n');
}

const oldRisk = /function unsupportedConcreteRisk\(\n  text: string,\n  envelope: RealityEnvelope,\n\): number \{[\s\S]*?\n\}\n\nfunction creativeEvidenceOverlap/;
if (oldRisk.test(mouth)) {
  mouth = mouth.replace(oldRisk, `function unsupportedConcreteRisk(\n  text: string,\n  envelope: RealityEnvelope,\n  beat?: MouthCandidateBeat,\n): number {\n  const value = clean(text);\n  if (!value) return 1;\n  if (processRisk(value)) return 1;\n\n  // Semantic realization is authorized to use new language. Concrete reality\n  // remains protected by the upstream evidence/semantic contract, not an\n  // English action vocabulary.\n  if (beat?.semanticRealization) return 0;\n\n  const source = meaningful([\n    envelope.subject,\n    ...envelope.events.map((event) => event.label),\n    ...envelope.suppliedEntities,\n    ...envelope.suppliedActions,\n    ...envelope.suppliedStates,\n    ...envelope.suppliedPhrases,\n  ].join(" "));\n\n  const grounding = overlap(meaningful(value), source);\n  return grounding >= 0.28 ? 0 : 0.9;\n}\n\nfunction creativeEvidenceOverlap`);
}

mouth = mouth.replace(
  '      unsupportedConcreteRisk(\n        value,\n        envelope,\n      ),',
  '      unsupportedConcreteRisk(\n        value,\n        envelope,\n        beat,\n      ),',
);

// Push the model toward feeling/interpretation rather than scene narration.
const feelingPrompt = `\n    "The hardest and most valuable output is a FELT REALIZATION: compress the supplied semantic change into language that lets the reader experience the shift. Examples of form, not content: \\"Beauty. Then chaos.\\" or \\"Innocence, briefly. Then mischief.\\" or \\"Mischief's reward.\\" Do not copy those subjects into unrelated cases.",\n\n    "For each beat, silently attempt at least one fragment-level realization, one implication/reframe, and one bolder contrast or consequence. Prefer the line that changes how the supplied facts feel rather than the line that merely describes what happened.",\n\n`;
if (!mouth.includes('The hardest and most valuable output is a FELT REALIZATION')) {
  mouth = replaceOnce(
    mouth,
    '    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",\n\n',
    '    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",\n\n' + feelingPrompt,
    "felt realization system prompt",
  );
}

write(mouthPath, mouth);

// Carry the first-class felt contract into the canonical orchestration authority too.
let brain = read(brainPath);
if (!brain.includes("CANONICAL FELT EFFECT:")) {
  brain = replaceOnce(
    brain,
    '    `CANONICAL SEMANTIC TURN: ${semanticTurn}`,',
    '    `CANONICAL SEMANTIC TURN: ${semanticTurn}`,\n    ...(thesis.semanticRealization?.feltEffect\n      ? [`CANONICAL FELT EFFECT: ${thesis.semanticRealization.feltEffect}`]\n      : []),\n    ...(thesis.semanticRealization?.viewerShift\n      ? [`CANONICAL VIEWER SHIFT: ${thesis.semanticRealization.viewerShift}`]\n      : []),\n    ...(thesis.semanticRealization?.languageAim\n      ? [`CANONICAL LANGUAGE AIM: ${thesis.semanticRealization.languageAim}`]\n      : []),',
    "brain felt authority",
  );
}

write(brainPath, brain);

console.log("AUTHOR SEMANTIC FEELING ALIGNMENT: APPLIED");
console.log("Felt effect, viewer shift, and language aim now flow into orchestration and Mouth.");
console.log("Creative authorization no longer depends on a finite English action dictionary.");
