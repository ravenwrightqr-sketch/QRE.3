import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);

function applyPatch(name, replacements) {
  const target = file(name);
  let text = fs.readFileSync(target, "utf8");
  for (const { label, from, to } of replacements) {
    if (!text.includes(from)) {
      throw new Error(`PATCH MISS [${name}] ${label}`);
    }
    text = text.replace(from, to);
  }
  fs.writeFileSync(target, text, "utf8");
  console.log(`PATCHED ${name}`);
}

const brain = "apps/api/src/services/authorBrainUniversal.ts";
const runtime = "apps/api/src/services/localModelRuntime.ts";
const backupSuffix = `.before-author-path-alignment-${Date.now()}`;

for (const name of [brain, runtime]) {
  const target = file(name);
  fs.copyFileSync(target, `${target}${backupSuffix}`);
}

applyPatch(runtime, [
  {
    label: "preserve valid parsed mouth batch",
    from: `  return {\n    text: JSON.stringify({\n      texts: Array.from(\n        { length: beats.length },\n        () => \"\",\n      ),\n    }),\n    model: modelName(),\n    provider: \"local\",\n  };`,
    to: `  // Runtime transport must not erase a usable model batch. Final style\n  // and truth decisions belong to the canonical editor/cut gate downstream.\n  return {\n    text: JSON.stringify({\n      texts: parsed.length === beats.length\n        ? parsed\n        : retryParsed.length === beats.length\n          ? retryParsed\n          : Array.from({ length: beats.length }, () => \"\"),\n    }),\n    model: modelName(),\n    provider: \"local\",\n  };`,
  },
]);

applyPatch(brain, [
  {
    label: "normalize planner None sentinels",
    from: `    const change = clean(item.change);\n    const next = clean(item.next);\n    const frontier = clean(item.frontier || item.informationFrontier);\n    const necessity = clean(item.necessity || item.whyNext);`,
    to: `    const change = clean(item.change);\n    const rawNext = clean(item.next);\n    const rawFrontier = clean(item.frontier || item.informationFrontier);\n    const next = /^none$/i.test(rawNext) ? \"\" : rawNext;\n    const frontier = /^none$/i.test(rawFrontier) ? \"\" : rawFrontier;\n    const necessity = clean(item.necessity || item.whyNext);`,
  },
  {
    label: "reject weak changes",
    from: `    if (change.split(/\\s+/).length > 14 || next.split(/\\s+/).length > 12 || frontier.split(/\\s+/).length > 10 || necessity.split(/\\s+/).length > 12) continue;`,
    to: `    const changeWords = change.split(/\\s+/).filter(Boolean);\n    const nextWords = next.split(/\\s+/).filter(Boolean);\n    const frontierWords = frontier.split(/\\s+/).filter(Boolean);\n    const necessityWords = necessity.split(/\\s+/).filter(Boolean);\n    if (changeWords.length < 3) continue;\n    if (next && nextWords.length < 2) continue;\n    if (frontier && frontierWords.length < 2) continue;\n    if (necessity && necessityWords.length < 2) continue;\n    if (changeWords.length > 14 || nextWords.length > 12 || frontierWords.length > 10 || necessityWords.length > 12) continue;`,
  },
  {
    label: "reject duplicate changes",
    from: `  if (!beats.length) return undefined;\n\n  return {`,
    to: `  if (!beats.length) return undefined;\n\n  const changeKeys = beats.map((beat) =>\n    beat.change\n      .toLowerCase()\n      .replace(/[^a-z0-9]+/g, " ")\n      .replace(/\\s+/g, " ")\n      .trim(),\n  );\n  if (changeKeys.length - new Set(changeKeys).size > 0) return undefined;\n\n  return {`,
  },
  {
    label: "repair with previous lines",
    from: `    repairPlan[repairPlan.length - 1] = {\n      ...user,\n      content:\n        \`${user.content}\\n\\nQRE FINAL CUT REPAIR. The previous lines failed the final truth/cut gate. \` +\n        \"Return exactly one line per approved beat. Rewrite only failed lines. \" +\n        \"Preserve every supplied fact. Remove unsupported concrete actions or nouns. \" +\n        \"Keep each line at 3-7 words. Never explain the beat.\\n\" +\n        \`FINAL GATE DIAGNOSTICS: ${JSON.stringify(sequenceResult.rejectionReasons)}\`,\n    };`,
    to: `    const previousLines = texts.map((text, index) => ({\n      order: index + 1,\n      text,\n    }));\n\n    repairPlan[repairPlan.length - 1] = {\n      ...user,\n      content:\n        \`${user.content}\\n\\nQRE FINAL CUT REPAIR. Some realized lines failed the final truth/cut gate.\` +\n        \"Preserve every line that can survive unchanged. Rewrite only failed lines. \" +\n        \"Return exactly one line per approved beat, in original order. \" +\n        \"Use the approved Beat Graph and supplied evidence only. Remove unsupported concrete actions, props, reactions, settings, or outcomes. \" +\n        \"Keep each line at 3-7 words. Never explain the beat.\\n\" +\n        \`PREVIOUS REALIZED LINES: ${JSON.stringify(previousLines)}\\n\` +\n        \`FINAL GATE DIAGNOSTICS: ${JSON.stringify(sequenceResult.rejectionReasons)}\`,\n    };`,
  },
  {
    label: "merge repairs instead of replacing good lines",
    from: `    if (repairTexts.length === sequence.cuts.length) {\n      const repairAttention = editAttentionSequence({\n        beats: buildAttentionBeatInputs(sequence, repairTexts, plan),\n        evidence,\n      });\n      const repairResult = scenesFromSequence(sequence, repairTexts, input, cognition);\n      if (repairResult.rejected < sequenceResult.rejected) {\n        texts = repairTexts;\n        attentionEdit = repairAttention;\n        sequenceResult = repairResult;\n      }\n    }`,
    to: `    if (repairTexts.length === sequence.cuts.length) {\n      const mergedTexts = sequence.cuts.map((_, index) =>\n        clean(repairTexts[index]) || clean(texts[index] ?? \"\"),\n      );\n      const repairAttention = editAttentionSequence({\n        beats: buildAttentionBeatInputs(sequence, mergedTexts, plan),\n        evidence,\n      });\n      const repairResult = scenesFromSequence(sequence, mergedTexts, input, cognition);\n      if (repairResult.rejected < sequenceResult.rejected) {\n        texts = mergedTexts;\n        attentionEdit = repairAttention;\n        sequenceResult = repairResult;\n      }\n    }`,
  },
]);

console.log("AUTHOR PATH ALIGNMENT PATCH COMPLETE.");
console.log(`Backups created with suffix ${backupSuffix}`);
