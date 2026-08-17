import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = {
  cutPolicy: path.join(root, "apps/api/src/services/authorCutPolicy.ts"),
  authorBrain: path.join(root, "apps/api/src/services/authorBrainUniversal.ts"),
};

for (const [name, file] of Object.entries(target)) {
  if (!fs.existsSync(file)) {
    throw new Error(`MEANING GATE ABORTED: missing ${name}: ${file}`);
  }
}

const original = Object.fromEntries(
  Object.entries(target).map(([name, file]) => [name, fs.readFileSync(file, "utf8")]),
);

const next = { ...original };

function requireOnce(source, needle, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`MEANING GATE ABORTED: expected exactly one ${label}; found ${count}`);
  }
}

// ---------------------------------------------------------------------------
// CUT POLICY
// ---------------------------------------------------------------------------
{
  let source = next.cutPolicy;

  const hardReject = '  if (referenceCost >= 0.5) reasons.push("wasted-subject-reference");';
  requireOnce(source, hardReject, "hard subject-reference rejection");
  source = source.replace(
    hardReject,
    [
      '  // Subject naming is a soft continuity cost, never a truth violation.',
      '  // A deliberate name repeat may improve emphasis, clarity, rhythm, or payoff.',
      '  // The actual line quality is decided by the surrounding editorial gates.',
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

// ---------------------------------------------------------------------------
// AUTHOR BRAIN
// ---------------------------------------------------------------------------
{
  let source = next.authorBrain;

  const normalizeMarker = 'function normalizeBeatPlan(value: unknown): BeatPlan | undefined {';
  requireOnce(source, normalizeMarker, "normalizeBeatPlan");

  const helper = `function sourceLikeBeatChange(change: string, baselineFacts: string[]): boolean {
  const candidate = wordSet(change);
  if (!candidate.size || candidate.size > 7) return false;

  return baselineFacts.some((fact) => {
    const source = wordSet(fact);
    if (!source.size) return false;
    return overlap(candidate, source) >= 0.85;
  });
}

function meaningBearingBeat(item: Record<string, unknown>, change: string, baselineFacts: string[]): boolean {
  const role = clean(item.role).toLowerCase();
  if (["arrival", "hook", "setup", "opening"].includes(role)) return true;

  if (!sourceLikeBeatChange(change, baselineFacts)) return true;

  const attentionFunction = clean(item.attentionFunction).toLowerCase();
  const creativeMove = clean(item.creativeMove).toLowerCase();
  const interpretive = /\\b(?:but|yet|still|only|instead|apparently|already|now|then|again|different|same|defiant|defiance|rebellion|rebel|negotiat(?:e|ion|or)|status|power|upper hand|attitude|guarded|vulnerable|victory|evidence|case|terms|deal|means business|not impressed|ready to)\\b/i.test(change);

  // A later beat that is essentially a source fact is acceptable only when the
  // line itself carries an interpretive/relational move. Metadata alone cannot
  // rescue a literal fact restatement.
  return interpretive &&
    ["turn", "reframe", "escalation", "callback", "payoff", "release", "question"].includes(attentionFunction) &&
    creativeMove !== "none";
}

`;

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
    promptMarker + '\n    "A source fact is material, never the destination. For example, \\"Coco got a bath\\" is raw material; the Beat Graph must discover what the bath reveals or changes.\",\n    "Every non-opening beat must carry forward at least one earlier signal and change its interpretation, consequence, status, relationship, or object meaning.\",\n    "Do not use a source fact as a beat change merely because it is the next chronological event. If the fact is necessary, express the meaning the fact acquires inside the movie.\",\n    "The final payoff must make the ending feel earned by earlier setup, not merely restate the final source moment.\",',
  );

  next.authorBrain = source;
}

// Atomic validation before any write.
for (const [name, file] of Object.entries(target)) {
  if (next[name] === original[name]) {
    throw new Error(`MEANING GATE ABORTED: no change generated for ${name}`);
  }
}

const backups = [];
for (const [name, file] of Object.entries(target)) {
  const backup = `${file}.before-meaning-gates-${Date.now()}`;
  fs.copyFileSync(file, backup);
  fs.writeFileSync(file, next[name], "utf8");
  backups.push(backup);
}

console.log("QRE MEANING GATES HARDENED.");
console.log("Cut policy: subject repetition is now a soft continuity cost.");
console.log("Beat planner: later beats must carry meaning, not merely restate source facts.");
console.log("Beat planner: placeholder metadata such as event-N / pays off / establish is rejected.");
console.log("Beat planner prompt: facts are material, not destinations.");
console.log("Atomic validation passed before writing files.");
for (const backup of backups) console.log(`BACKUP: ${backup}`);
