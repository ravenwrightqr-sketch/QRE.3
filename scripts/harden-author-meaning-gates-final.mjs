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

function ensureOnce(source, already, old, replacement, label) {
  if (source.includes(already)) return source;
  requireOnce(source, old, label);
  return source.replace(old, replacement);
}

// ---------------------------------------------------------------------------
// 1. CUT POLICY
// ---------------------------------------------------------------------------
{
  let source = next.cutPolicy;

  const alreadySoft = "// Repeated subject naming is editorial debt, not a truth violation.";
  const oldHard = '  if (referenceCost >= 0.5) reasons.push("wasted-subject-reference");';

  source = ensureOnce(
    source,
    alreadySoft,
    oldHard,
    [
      '  // Repeated subject naming is editorial debt, not a truth violation.',
      '  // Deliberate re-naming may improve emphasis, clarity, rhythm, or payoff.',
    ].join("\n"),
    "hard subject-reference rejection",
  );

  const scoreAlready = "referenceCost * 0.05";
  const scoreOld = '      cohesion * 0.08 -\n      invention * 0.24 -';
  if (!source.includes(scoreAlready)) {
    requireOnce(source, scoreOld, "cut score tail");
    source = source.replace(
      scoreOld,
      '      cohesion * 0.08 -\n      referenceCost * 0.05 -\n      invention * 0.24 -',
    );
  }

  next.cutPolicy = source;
}

// ---------------------------------------------------------------------------
// 2. AUTHOR BRAIN
// ---------------------------------------------------------------------------
{
  let source = next.authorBrain;
  const helperMarker = "function sourceLikeBeatChange(";

  if (!source.includes(helperMarker)) {
    const normalizeMarker = 'function normalizeBeatPlan(value: unknown): BeatPlan | undefined {';
    requireOnce(source, normalizeMarker, "normalizeBeatPlan");

    const helper = `function sourceLikeBeatChange(change: string, baselineFacts: string[]): boolean {
  const candidate = wordSet(change);
  if (!candidate.size) return true;

  return baselineFacts.some((fact) => {
    const source = wordSet(fact);
    if (!source.size) return false;
    const sourceCoverage = overlap(source, candidate);
    return sourceCoverage >= 0.9 && candidate.size <= source.size + 4;
  });
}

function meaningBearingBeat(item: Record<string, unknown>, change: string, baselineFacts: string[]): boolean {
  const role = clean(item.role).toLowerCase();
  if (["arrival", "hook", "setup", "opening"].includes(role)) return true;
  if (!sourceLikeBeatChange(change, baselineFacts)) return true;

  const attentionFunction = clean(item.attentionFunction).toLowerCase();
  const creativeMove = clean(item.creativeMove).toLowerCase();
  const interpretive = /\\b(?:but|yet|still|only|instead|apparently|already|now|then|again|different|same|defiant|defiance|rebellion|rebel|negotiat(?:e|ion|or)|status|power|upper hand|attitude|guarded|vulnerable|victory|evidence|case|terms|deal|means business|not impressed|ready to)\\b/i.test(change);

  return interpretive &&
    ["turn", "reframe", "escalation", "callback", "payoff", "release", "question"].includes(attentionFunction) &&
    creativeMove !== "none";
}

`;

    source = source.replace(normalizeMarker, helper + normalizeMarker);
  }

  const meaningValidation = "    if (!meaningBearingBeat(item, change, baselineFactsForBeat)) continue;";
  const validation = '    if (BAD_INTERNAL.test(change) || BAD_SUMMARY.test(change) || BAD_INTERPRETIVE_EXPLANATION.test(change)) continue;';
  if (!source.includes(meaningValidation)) {
    requireOnce(source, validation, "beat explanation validation");
    source = source.replace(
      validation,
      validation + '\n\n    const baselineFactsForBeat = normalizeFacts(record.baselineFacts);\n    if (!meaningBearingBeat(item, change, baselineFactsForBeat)) continue;',
    );
  }

  const placeholderRegex = '/^(?:pays off|release|contrast|callback|payoff|establish|none|event-\\d+)$/i';
  if (!source.includes(placeholderRegex)) {
    const placeholderAnchor = '    if (BAD_INTERNAL.test(frontier) || BAD_SUMMARY.test(frontier) || BAD_VAGUE.test(frontier)) continue;';
    requireOnce(source, placeholderAnchor, "frontier validation");
    source = source.replace(
      placeholderAnchor,
      placeholderAnchor + '\n    if (/^(?:pays off|release|contrast|callback|payoff|establish|none|event-\\d+)$/i.test(frontier)) continue;\n    if (/^(?:pays off|release|contrast|callback|payoff|establish|none|event-\\d+)$/i.test(next)) continue;\n    if (/^(?:establish|contrast|callback|payoff|release)$/i.test(necessity)) continue;',
    );
  }

  const meaningRule = "Facts are material, never the destination.";
  const promptMarker = '    "The beat change is the changed meaning, not the analyst\\\'s explanation of that meaning.",';
  if (!source.includes(meaningRule)) {
    requireOnce(source, promptMarker, "planner meaning rule");
    source = source.replace(
      promptMarker,
      promptMarker + '\n    "Facts are material, never the destination. \\"Coco got a bath\\" is raw material; discover what the bath reveals, changes, or makes inevitable.\",\n    "Every non-opening beat must carry forward an earlier signal and change its interpretation, consequence, status, relationship, or object meaning.\",\n    "Do not use the next chronological fact as the beat change unless the line itself expresses the meaning the fact acquires inside the movie.\",\n    "The final payoff must make the ending feel earned by earlier setup, not merely restate the final source moment.\",',
    );
  }

  next.authorBrain = source;
}

for (const [name] of Object.entries(target)) {
  if (next[name] === original[name]) {
    console.log(`ALREADY ALIGNED: ${name}`);
  }
}

const changed = Object.keys(target).filter((name) => next[name] !== original[name]);
if (!changed.length) {
  console.log("QRE MEANING GATES: already aligned; nothing to write.");
  process.exit(0);
}

const backups = [];
for (const [name, file] of Object.entries(target)) {
  if (next[name] === original[name]) continue;
  const backup = `${file}.before-meaning-gates-${Date.now()}`;
  fs.copyFileSync(file, backup);
  fs.writeFileSync(file, next[name], "utf8");
  backups.push(backup);
}

console.log("QRE MEANING GATES HARDENED.");
console.log(`Changed: ${changed.join(", ")}`);
console.log("  subject naming = soft continuity cost");
console.log("  later source-fact beats = require an actual meaning shift");
console.log("  placeholder planner metadata = rejected");
console.log("  planner prompt = facts are material, never destinations");
console.log("  migration = idempotent");
for (const backup of backups) console.log(`BACKUP: ${backup}`);
