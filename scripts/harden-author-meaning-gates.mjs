import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  cutPolicy: path.join(root, "apps/api/src/services/authorCutPolicy.ts"),
  attentionEditor: path.join(root, "apps/api/src/services/authorAttentionEditor.ts"),
  authorBrain: path.join(root, "apps/api/src/services/authorBrainUniversal.ts"),
};

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(`MIGRATION ABORTED: missing ${name}: ${file}`);
  }
}

const originals = Object.fromEntries(
  Object.entries(files).map(([name, file]) => [name, fs.readFileSync(file, "utf8")]),
);

const next = { ...originals };
const changed = [];

function requireOnce(source, needle, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`MIGRATION ABORTED: expected exactly one ${label}; found ${count}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Cut policy: subject naming is a soft continuity cost, not a hard reject.
// ---------------------------------------------------------------------------
{
  const source = next.cutPolicy;
  const oldReason = '  if (referenceCost >= 0.5) reasons.push("wasted-subject-reference");';
  requireOnce(source, oldReason, "hard subject-reference rejection");

  const oldScore = '      - repeated * 0.04,\n';
  requireOnce(source, oldScore, "cut-policy score tail");

  let updated = source.replace(
    oldScore,
    '      - repeated * 0.04\n      - referenceCost * 0.06,\n',
  );

  updated = updated.replace(
    oldReason,
    '  // Repeating the subject name is a continuity cost, not an automatic failure.\n  // A later line may deliberately re-name the subject when emphasis, clarity,\n  // rhythm, or payoff improves. The Mouth/Attention layers decide whether the\n  // repetition is actually wasteful.\n',
  );

  const marker = '  if (wordCount === 1 && density < 0.5) {';
  requireOnce(updated, marker, "subject-policy insertion point");

  updated = updated.replace(
    marker,
    '  if (\n    referenceCost >= 0.5 &&\n    !statusMetaphor &&\n    !interpretationAllowed &&\n    !EXPLANATION.test(text) &&\n    wordCount <= 7\n  ) {\n    // Diagnostic only: repeated naming without a meaningful interpretive or\n    // structural reason is undesirable, but it is still not a truth violation.\n  }\n\n' + marker,
  );

  next.cutPolicy = updated;
  changed.push("authorCutPolicy.ts");
}

// ---------------------------------------------------------------------------
// 2. Attention editor: distinguish analytical explanation from valid
//    character interpretation and expose subject-reference cost softly.
// ---------------------------------------------------------------------------
{
  const source = next.attentionEditor;
  const oldType = '  sequenceCohesion: number;\n  score: number;';
  requireOnce(source, oldType, "attention score shape");

  let updated = source.replace(
    oldType,
    '  sequenceCohesion: number;\n  subjectReferenceCost: number;\n  score: number;',
  );

  const oldMarker = 'function setupValue(input: AttentionBeatInput, text: string): number {';
  requireOnce(updated, oldMarker, "attention helper insertion point");

  const helper = `function subjectReferenceCost(text: string, prior: string[]): number {\n  const explicit = /\\b(?:Coco|the subject)\\b/i.test(text);\n  if (!explicit || !prior.length) return 0;\n  const priorNames = prior.filter((line) => /\\b(?:Coco|the subject)\\b/i.test(line));\n  return priorNames.length ? 0.55 : 0.2;\n}\n\n`;

  updated = updated.replace(oldMarker, helper + oldMarker);

  const oldScoreInputs = '  const cohesion = sequenceCohesion(input, text, priorTexts);\n';
  requireOnce(updated, oldScoreInputs, "attention cohesion calculation");
  updated = updated.replace(
    oldScoreInputs,
    oldScoreInputs + '  const subjectCost = subjectReferenceCost(text, priorTexts);\n',
  );

  const oldAttentionTail = '      cohesion * 0.05 -\n      repeated * 0.08,\n';
  requireOnce(updated, oldAttentionTail, "attention score tail");
  updated = updated.replace(
    oldAttentionTail,
    '      cohesion * 0.05 -\n      repeated * 0.08 -\n      subjectCost * 0.03,\n',
  );

  const oldFinalScoreTail = '      cohesion * 0.08 -\n      invention * 0.24 -';
  requireOnce(updated, oldFinalScoreTail, "attention final score tail");
  updated = updated.replace(
    oldFinalScoreTail,
    '      cohesion * 0.08 -\n      subjectCost * 0.04 -\n      invention * 0.24 -',
  );

  const oldReturn = '    sequenceCohesion: cohesion,\n    score,';
  requireOnce(updated, oldReturn, "attention score return");
  updated = updated.replace(
    oldReturn,
    '    sequenceCohesion: cohesion,\n    subjectReferenceCost: subjectCost,\n    score,',
  );

  const oldReason = '  if (execution < 0.38) reasons.push("beat-execution-weak");';
  requireOnce(updated, oldReason, "attention execution reason anchor");
  updated = updated.replace(
    oldReason,
    oldReason + '\n  // Subject repetition is intentionally not a rejection reason. It is scored\n  // softly so a deliberate emphasis or payoff can survive editorial review.',
  );

  next.attentionEditor = updated;
  changed.push("authorAttentionEditor.ts");
}

// ---------------------------------------------------------------------------
// 3. Planner: force non-opening beats to carry meaning, not just source facts.
// ---------------------------------------------------------------------------
{
  const source = next.authorBrain;
  const oldFunction = 'function normalizeBeatPlan(value: unknown): BeatPlan | undefined {';
  requireOnce(source, oldFunction, "normalizeBeatPlan");

  const helper = `function sourceLikeChange(\n  change: string,\n  baselineFacts: string[],\n  sourceMoments: string[] = [],\n): boolean {\n  const candidate = wordSet(change);\n  if (!candidate.size) return true;\n\n  const sources = [...baselineFacts, ...sourceMoments]\n    .map((value) => wordSet(clean(value)))\n    .filter((value) => value.size);\n\n  if (!sources.length) return false;\n\n  return sources.some((source) => {\n    const overlapValue = overlap(candidate, source);\n    return overlapValue >= 0.85 && candidate.size <= 6;\n  });\n}\n\nfunction meaningBearingBeat(item: Record<string, unknown>, change: string, baselineFacts: string[], sourceMoments: string[]): boolean {\n  const role = clean(item.role).toLowerCase();\n  if (["arrival", "hook", "setup", "opening"].includes(role)) return true;\n\n  const creativeMove = clean(item.creativeMove).toLowerCase();\n  const attentionFunction = clean(item.attentionFunction).toLowerCase();\n  const sourceLike = sourceLikeChange(change, baselineFacts, sourceMoments);\n\n  if (!sourceLike) return true;\n\n  // A later beat cannot merely rename an already-known fact. It must carry an\n  // interpretive or structural move into the next cut.\n  return [\n    "turn",\n    "reframe",\n    "escalation",\n    "callback",\n    "payoff",\n    "release",\n    "question",\n  ].includes(attentionFunction) && creativeMove !== "none";\n}\n\n`;

  let updated = source.replace(oldFunction, helper + oldFunction);

  const oldBeatStart = '    if (!change) continue;\n    if (BAD_INTERNAL.test(change) || BAD_SUMMARY.test(change) || BAD_INTERPRETIVE_EXPLANATION.test(change)) continue;';
  requireOnce(updated, oldBeatStart, "beat normalization validation anchor");
  updated = updated.replace(
    oldBeatStart,
    '    if (!change) continue;\n    if (BAD_INTERNAL.test(change) || BAD_SUMMARY.test(change) || BAD_INTERPRETIVE_EXPLANATION.test(change)) continue;\n\n    const baselineFacts = normalizeFacts(record.baselineFacts);\n    if (!meaningBearingBeat(item, change, baselineFacts, [])) continue;',
  );

  // Normalize the canonical invalid planner labels that repeatedly appeared in
  // the monster runs, without banning legitimate natural-language frontiers.
  const oldFrontierCheck = '    if (BAD_INTERNAL.test(frontier) || BAD_SUMMARY.test(frontier) || BAD_VAGUE.test(frontier)) continue;';
  requireOnce(updated, oldFrontierCheck, "frontier validation anchor");
  updated = updated.replace(
    oldFrontierCheck,
    '    if (BAD_INTERNAL.test(frontier) || BAD_SUMMARY.test(frontier) || BAD_VAGUE.test(frontier)) continue;\n    if (/^(?:pays off|release|contrast|callback|payoff|establish|none|event-\\d+)$/i.test(frontier)) continue;\n    if (/^(?:pays off|release|contrast|callback|payoff|establish|none|event-\\d+)$/i.test(next)) continue;',
  );

  // Ensure `attentionArc` never becomes a prose sentence.
  const oldArc = '  if (supplied) {';
  requireOnce(updated, oldArc, "attentionArc normalizer");
  updated = updated.replace(
    oldArc,
    '  if (supplied && !/\\b(?:then|because|reveals?|means?|shows?|pays off|the viewer|the audience)\\b/i.test(supplied)) {',
  );

  next.authorBrain = updated;
  changed.push("authorBrainUniversal.ts");
}

// ---------------------------------------------------------------------------
// Atomic write: all source validation happened before touching disk.
// ---------------------------------------------------------------------------
for (const [name, file] of Object.entries(files)) {
  if (next[name] === originals[name]) {
    throw new Error(`MIGRATION ABORTED: no change produced for ${name}`);
  }
}

const backups = [];
for (const [name, file] of Object.entries(files)) {
  const backup = `${file}.before-meaning-gates-${Date.now()}`;
  fs.copyFileSync(file, backup);
  fs.writeFileSync(file, next[name], "utf8");
  backups.push(backup);
}

console.log("AUTHOR MEANING GATES HARDENED.");
console.log(`Changed: ${changed.join(", ")}`);
console.log("Rules added:");
console.log("  1. Subject naming is a soft continuity cost, not a hard reject.");
console.log("  2. Analyst explanation remains rejectable; interpretation stays allowed.");
console.log("  3. Non-opening Beat Graph changes must carry meaning, not merely restate a source fact.");
console.log("  4. Planner placeholder labels such as event-N / pays off / establish are rejected.");
console.log("Backups:");
for (const backup of backups) console.log(`  ${backup}`);
