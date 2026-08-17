import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = {
  cutPolicy: path.join(root, "apps/api/src/services/authorCutPolicy.ts"),
  authorBrain: path.join(root, "apps/api/src/services/authorBrainUniversal.ts"),
};

for (const [name, file] of Object.entries(target)) {
  if (!fs.existsSync(file)) throw new Error(`MEANING GATE ABORTED: missing ${name}: ${file}`);
}

const original = Object.fromEntries(
  Object.entries(target).map(([name, file]) => [name, fs.readFileSync(file, "utf8")]),
);
const next = { ...original };

function requireOnce(source, needle, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) throw new Error(`MEANING GATE ABORTED: expected exactly one ${label}; found ${count}`);
}

// Subject naming is a soft continuity cost, not a hard truth failure.
{
  let source = next.cutPolicy;
  const hardReject = '  if (referenceCost >= 0.5) reasons.push("wasted-subject-reference");';
  requireOnce(source, hardReject, "hard subject-reference rejection");
  source = source.replace(
    hardReject,
    [
      '  // Repeated subject naming is editorial debt, not a truth violation.',
      '  // Deliberate re-naming may improve emphasis, clarity, rhythm, or payoff.',
    ].join("\n"),
  );

  const scoreTail = '      cohesion * 0.08 -\n      invention * 0.24 -';
  requireOnce(source, scoreTail, "cut score tail");
  source = source.replace(
    scoreTail,
    '      cohesion * 0.08 -\n      referenceCost * 0.05 -\n      invention * 0.24 -',
  );

  next.cutPolicy = source;
}

// Later planner beats must carry meaning, not merely restate the next receipt item.
{
  let source = next.authorBrain;
  const normalizeMarker = 'function normalizeBeatPlan(value: unknown): BeatPlan | undefined {';
  requireOnce(source, normalizeMarker, "normalizeBeatPlan");

  const helper = `function sourceLikeBeatChange(change: string, baselineFacts: string[]): boolean {\n  const candidate = wordSet(change);\n  if (!candidate.size) return true;\n\n  return baselineFacts.some((fact) => {\n    const source = wordSet(fact);\n    if (!source.size) return false;\n\n    // Compare the source fact against the candidate, allowing extra words such\n    // as a subject name or a compact interpretive modifier. If the entire fact\n    // is already present, the planner must contribute a meaning shift as well.\n    const sourceCoverage = overlap(source, candidate);\n    return sourceCoverage >= 0.9 && candidate.size <= source.size + 4;\n  });\n}\n\nfunction meaningBearingBeat(item: Record<string, unknown>, change: string, baselineFacts: string[]): boolean {\n  const role = clean(item.role).toLowerCase();\n  if (["arrival", "hook", "setup", "opening"].includes(role)) return true;\n  if (!sourceLikeBeatChange(change, baselineFacts)) return true;\n\n  const attentionFunction = clean(item.attentionFunction).toLowerCase();\n  const creativeMove = clean(item.creativeMove).toLowerCase();\n  const interpretive = /\\b(?:but|yet|still|only|instead|apparently|already|now|then|again|different|same|defiant|defiance|rebellion|rebel|negotiat(?:e|ion|or)|status|power|upper hand|attitude|guarded|vulnerable|victory|evidence|case|terms|deal|means business|not impressed|ready to)\\b/i.test(change);\n\n  // Metadata cannot rescue a literal receipt line. The line itself must carry\n  // the changed relationship, status, consequence, or interpretation.\n  return interpretive &&\n    ["turn", "reframe", "escalation", "callback", "payoff", "release", "question"].includes(attentionFunction) &&\n    creativeMove !== "none";\n}\n\n`;

  source = source.replace(normalizeMarker, helper + normalizeMarker);

  const validation = '    if (BAD_INTERNAL.test(change) || BAD_SUMMARY.test(change) || BAD_INTERPRETIVE_EXPLANATION.test(change)) continue;';
  requireOnce(source, validation, "beat explanation validation");
  source = source.replace(
    validation,
    validation + '\n\n    const baselineFactsForBeat = normalizeFacts(record.baselineFacts);\n    if (!meaningBearingBeat(item, change, baselineFactsForBeat)) continue;',
  );

  const placeholderAnchor = '    if (BAD_INTERNAL.test(frontier) || BAD_SUMMARY.test(frontier) || BAD_VAGUE.test(frontier)) continue;';
  requireOnce(source, placeholderAnchor, "frontier validation");
  source = source.replace(
    placeholderAnchor,
    placeholderAnchor + '\n    if (/^(?:pays off|release|contrast|callback|payoff|establish|none|event-\\d+)$/i.test(frontier)) continue;\n    if (/^(?:pays off|release|contrast|callback|payoff|establish|none|event-\\d+)$/i.test(next)) continue;\n    if (/^(?:establish|contrast|callback|payoff|release)$/i.test(necessity)) continue;',
  );

  const promptMarker = '    "The beat change is the changed meaning, not the analyst\'s explanation of that meaning.",';
  requireOnce(source, promptMarker, "planner meaning rule");
  source = source.replace(
    promptMarker,
    promptMarker + '\n    "Facts are material, never the destination. \\"Coco got a bath\\" is raw material; discover what the bath reveals, changes, or makes inevitable.\",\n    "Every non-opening beat must carry forward an earlier signal and change its interpretation, consequence, status, relationship, or object meaning.\",\n    "Do not use the next chronological fact as the beat change unless the line itself expresses the meaning the fact acquires inside the movie.\",\n    "The final payoff must make the ending feel earned by earlier setup, not merely restate the final source moment.\",',
  );

  next.authorBrain = source;
}

// Validate every transformation before touching a source file.
for (const [name] of Object.entries(target)) {
  if (next[name] === original[name]) throw new Error(`MEANING GATE ABORTED: no change generated for ${name}`);
}

const backups = [];
for (const [name, file] of Object.entries(target)) {
  const backup = `${file}.before-meaning-gates-${Date.now()}`;
  fs.copyFileSync(file, backup);
  fs.writeFileSync(file, next[name], "utf8");
  backups.push(backup);
}

console.log("QRE MEANING GATES HARDENED.");
console.log("  subject naming = soft continuity cost");
console.log("  later source-fact beats = require an actual meaning shift");
console.log("  placeholder planner metadata = rejected");
console.log("  planner prompt = facts are material, never destinations");
console.log("  atomic validation = passed before writes");
for (const backup of backups) console.log(`BACKUP: ${backup}`);
