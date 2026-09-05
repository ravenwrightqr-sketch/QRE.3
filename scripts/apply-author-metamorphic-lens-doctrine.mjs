import fs from "node:fs";

const root = process.cwd();

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceOnce(source, needle, replacement, label) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`METAMORPHIC LENS PATCH FAILED: missing ${label}`);
  return `${source.slice(0, index)}${replacement}${source.slice(index + needle.length)}`;
}

const mouthPath = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
let mouth = read(mouthPath);

const doctrineAnchor = `"The source fact is material, not the destination.",`;
const doctrine = `"The source fact is material, not the destination.",\n    "METAMORPHIC REALIZATION: the selected movie has already discovered a supported relationship inside supplied reality. Realize that relationship, not a new event.",\n    "Ask what a concrete detail becomes in perception when placed against the character, relationship, or other supplied details already present.",\n    "A detail may become status inversion, mischief, ceremony, defiance, intimacy, absurdity, implication, suspicion, or another supported reading without changing the underlying fact.",\n    "LENS IS PRESSURE, NOT STORY: use lens treatment to alter attitude, status, relationship framing, outer-world perception, contrast, implication, distance, rhythm, or emotional temperature.",\n    "The same exact reality may support radically different perceptions. Do not make the different perception into a new concrete history.",\n    "NEVER literalize the metaphor. A bow can read like a promotion; that does not mean Coco literally received a promotion. A room can feel like it was left for someone; that does not mean staff intentionally closed it for them.",\n    "MOUTH MUST MAKE THE RELATION FELT THROUGH THE CUT. Do not explain the relation or report the facts.",`;

if (!mouth.includes("METAMORPHIC REALIZATION:")) {
  mouth = replaceOnce(mouth, doctrineAnchor, doctrine, "Mouth doctrine anchor");
  write(mouthPath, mouth);
}

const brainPath = "apps/api/src/services/authorBrainCanonical.ts";
let brain = read(brainPath);

const oldChange = "change: step.viewerChange,";
const newChange = `change: [\n        step.viewerChange,\n        movie.supportingRelationKinds?.length\n          ? \`Metamorphic material: \${movie.supportingRelationKinds.join(", ")}\`\n          : "",\n      ].filter(Boolean).join(" "),`;

if (!brain.includes("Metamorphic material:")) {
  brain = replaceOnce(brain, oldChange, newChange, "canonical Mouth beat change mapping");
  write(brainPath, brain);
}

console.log("AUTHOR METAMORPHIC LENS DOCTRINE APPLIED");
console.log("  Reality remains source truth");
console.log("  Movie relationship discovery precedes Lens treatment");
console.log("  Existing supportingRelationKinds carry metamorphic material to Mouth");
console.log("  No new contract / brain / domain-specific creative engine added");
