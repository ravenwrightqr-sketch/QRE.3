import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);

function replaceOnce(name, pattern, replacement, label) {
  const target = file(name);
  const text = fs.readFileSync(target, "utf8");
  const match = text.match(pattern);
  if (!match) throw new Error(`PATCH MISS [${name}] ${label}`);
  const next = text.replace(pattern, replacement);
  fs.writeFileSync(target, next, "utf8");
  console.log(`PATCHED ${name}: ${label}`);
}

const brain = "apps/api/src/services/authorBrainUniversal.ts";
const runtime = "apps/api/src/services/localModelRuntime.ts";
const backupSuffix = `.before-author-path-alignment-${Date.now()}`;

for (const name of [brain, runtime]) {
  const target = file(name);
  fs.copyFileSync(target, `${target}${backupSuffix}`);
}

// Runtime: never erase a structurally valid mouth batch merely because the
// runtime's private style retry produced an invalid/empty batch. Downstream
// Attention Editor + Cut Policy are the authoritative editorial gates.
replaceOnce(
  runtime,
  /\n\s*return \{\s*text: JSON\.stringify\(\{\s*texts: Array\.from\(\s*\{ length: beats\.length \},\s*\(\) => \"\",\s*\),\s*\}\),\s*model: modelName\(\),\s*provider: \"local\",\s*\};/m,
  `\n  // Preserve the best structurally valid batch for downstream editorial gates.\n  return {\n    text: JSON.stringify({\n      texts: parsed.length === beats.length\n        ? parsed\n        : retryParsed.length === beats.length\n          ? retryParsed\n          : Array.from({ length: beats.length }, () => ""),\n    }),\n    model: modelName(),\n    provider: "local",\n  };`,
  "preserve valid parsed mouth batch",
);

// Planner: normalize "None" sentinels so they do not become fake frontier text.
replaceOnce(
  brain,
  /\s*const change = clean\(item\.change\);\s*const next = clean\(item\.next\);\s*const frontier = clean\(item\.frontier \|\| item\.informationFrontier\);\s*const necessity = clean\(item\.necessity \|\| item\.whyNext\);/m,
  `\n    const change = clean(item.change);\n    const rawNext = clean(item.next);\n    const rawFrontier = clean(item.frontier || item.informationFrontier);\n    const next = /^none$/i.test(rawNext) ? "" : rawNext;\n    const frontier = /^none$/i.test(rawFrontier) ? "" : rawFrontier;\n    const necessity = clean(item.necessity || item.whyNext);`,
  "normalize planner None sentinels",
);

// Planner: do not let bare facts or empty placeholders become movie beats.
replaceOnce(
  brain,
  /\s*if \(change\.split\(\\/\\s\\/\)\.length > 14 &&?[^\n]*\n/m,
  (m) => m[0],
  "planner length guard probe",
);

// The previous helper used an overly-specific length-guard replacement. Patch
// the actual canonical guard if it exists; otherwise leave that part untouched.
const brainText = fs.readFileSync(file(brain), "utf8");
const guardPattern = /\s*if \(change\.split\(\\s\+\*\/\.length > 14 \|\| next\.split\(\\s\+\*\/\.length > 12 \|\| frontier\.split\(\\s\+\*\/\.length > 10 \|\| necessity\.split\(\\s\+\*\/\.length > 12\) continue;/m;
if (guardPattern.test(brainText)) {
  replaceOnce(
    brain,
    guardPattern,
    `\n    const changeWords = change.split(/\\s+/).filter(Boolean);\n    const nextWords = next.split(/\\s+/).filter(Boolean);\n    const frontierWords = frontier.split(/\\s+/).filter(Boolean);\n    const necessityWords = necessity.split(/\\s+/).filter(Boolean);\n    if (changeWords.length < 3) continue;\n    if (next && nextWords.length < 2) continue;\n    if (frontier && frontierWords.length < 2) continue;\n    if (necessity && necessityWords.length < 2) continue;\n    if (changeWords.length > 14 || nextWords.length > 12 || frontierWords.length > 10 || necessityWords.length > 12) continue;`,
    "reject weak planner beats",
  );
}

// Repair: expose the previous candidate lines to the repair model and merge
// repaired lines with any lines that were already valid.
replaceOnce(
  brain,
  /\s*repairPlan\[repairPlan\.length - 1\] = \{\s*\.\.\.user,\s*content:\s*`\$\{user\.content\}\\n\\nQRE FINAL CUT REPAIR[\s\S]*?FINAL GATE DIAGNOSTICS: \$\{JSON\.stringify\(sequenceResult\.rejectionReasons\)\}`,\s*\};/m,
  `\n    const previousLines = texts.map((text, index) => ({ order: index + 1, text }));\n    repairPlan[repairPlan.length - 1] = {\n      ...user,\n      content:\n        \`${user.content}\\n\\nQRE FINAL CUT REPAIR. Preserve every valid line. Rewrite only failed lines. Return exactly one line per approved beat, in original order. Use the approved Beat Graph and supplied evidence only. Remove unsupported concrete actions, props, reactions, settings, or outcomes. Keep every line at 3-7 words. Never explain the beat.\\nPREVIOUS REALIZED LINES: ${JSON.stringify(previousLines)}\\nFINAL GATE DIAGNOSTICS: ${JSON.stringify(sequenceResult.rejectionReasons)}\`,\n    };`,
  "repair with previous lines",
);

replaceOnce(
  brain,
  /\s*if \(repairTexts\.length === sequence\.cuts\.length\) \{\s*const repairAttention = editAttentionSequence\(\{[\s\S]*?\s*\}\s*\}/m,
  `\n    if (repairTexts.length === sequence.cuts.length) {\n      const mergedTexts = sequence.cuts.map((_, index) =>\n        clean(repairTexts[index]) || clean(texts[index] ?? ""),\n      );\n      const repairAttention = editAttentionSequence({\n        beats: buildAttentionBeatInputs(sequence, mergedTexts, plan),\n        evidence,\n      });\n      const repairResult = scenesFromSequence(sequence, mergedTexts, input, cognition);\n      if (repairResult.rejected < sequenceResult.rejected) {\n        texts = mergedTexts;\n        attentionEdit = repairAttention;\n        sequenceResult = repairResult;\n      }\n    }`,
  "merge repaired lines with valid lines",
);

console.log(`AUTHOR PATH ALIGNMENT PATCH COMPLETE. Backups: ${backupSuffix}`);
