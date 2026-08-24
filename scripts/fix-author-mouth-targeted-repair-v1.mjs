import fs from "node:fs";

const path = "apps/api/src/services/authorBrainUniversal.ts";
const text = fs.readFileSync(path, "utf8");

function replaceOnce(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`PATCH FAILED: ${label}`);
  }
  return source.replace(pattern, replacement);
}

function replaceIfPresent(source, pattern, replacement, label) {
  if (!pattern.test(source)) return source;
  return source.replace(pattern, replacement);
}

let next = text;

// 1. Allow targeted candidate generation by beat order.
next = replaceOnce(
  next,
  /feedback\?: string,\r?\n\): Promise<\{/m,
  "feedback?: string,\r\n  requestedOrders?: readonly number[],\r\n): Promise<{",
  "generateCandidatePools signature",
);

// 2. Restrict the Mouth prompt to the requested weak beats during repair.
next = replaceOnce(
  next,
  /const messages =\r?\n    buildMouthCandidateMessages\(\{\r?\n      envelope,\r?\n      beats,\r?\n      priorTexts,\r?\n      lens,\r?\n    \}\);/m,
  "const promptBeats = requestedOrders?.length\n    ? beats.filter((beat) => requestedOrders.includes(beat.order))\n    : beats;\r\n\r\n  const messages =\r\n    buildMouthCandidateMessages({\r\n      envelope,\r\n      beats: promptBeats,\r\n      priorTexts,\r\n      lens,\r\n    });",
  "targeted Mouth prompt beats",
);

// 3. Build only the requested pools during targeted repair.
next = replaceOnce(
  next,
  /const pools:\r?\n    MouthCandidatePool\[\] =\r?\n    beats\.map\(/m,
  "const pools:\r\n    MouthCandidatePool[] =\r\n    (requestedOrders?.length\r\n      ? beats.filter((beat) => requestedOrders.includes(beat.order))\r\n      : beats\r\n    ).map(",
  "targeted Mouth pool construction",
);

// 4. Add a deterministic pool merge helper before endpoint enforcement.
const marker = "function ensureEndpointCandidate(\r\n";
if (!next.includes("function mergeMouthCandidatePools(")) {
  const helper = `function mergeMouthCandidatePools(\n  base: MouthCandidatePool[],\n  patch: MouthCandidatePool[],\n): MouthCandidatePool[] {\n  const byOrder = new Map<number, MouthCandidatePool>();\n\n  for (const pool of base) {\n    byOrder.set(pool.order, {\n      order: pool.order,\n      candidates: [...pool.candidates],\n    });\n  }\n\n  for (const pool of patch) {\n    const existing = byOrder.get(pool.order);\n    if (!existing) {\n      byOrder.set(pool.order, {\n        order: pool.order,\n        candidates: [...pool.candidates],\n      });\n      continue;\n    }\n\n    const seen = new Set(existing.candidates.map((candidate) => clean(candidate.text).toLowerCase()));\n    for (const candidate of pool.candidates) {\n      const key = clean(candidate.text).toLowerCase();\n      if (key && !seen.has(key)) {\n        existing.candidates.push(candidate);\n        seen.add(key);\n      }\n    }\n\n    existing.candidates.sort((a, b) => b.score - a.score);\n  }\n\n  return [...byOrder.values()].sort((a, b) => a.order - b.order);\n}\n\n`;
  if (!next.includes(marker)) throw new Error("PATCH FAILED: endpoint marker");
  next = next.replace(marker, helper + marker);
}

// 5. First generation remains full-sequence generation; initialize generatedPools separately for merges.
next = replaceOnce(
  next,
  /let generated =\r?\n    await generateCandidatePools\(/m,
  "let generated =\r\n    await generateCandidatePools(",
  "initial generate marker",
);

// 6. Attention repair: request only weak beats and merge them into the existing pools.
next = replaceOnce(
  next,
  /generated =\r?\n      await generateCandidatePools\(\r?\n        envelope,\r?\n        canonicalBeats,\r?\n        input\.lens,\r?\n        \[\],\r?\n        risk,\r?\n        feedback,\r?\n      \);/m,
  "const repairedAttention = await generateCandidatePools(\r\n      envelope,\r\n      canonicalBeats,\r\n      input.lens,\r\n      [],\r\n      risk,\r\n      feedback,\r\n      attentionEdit.weakBeats,\r\n    );\r\n\r\n    generated = {\r\n      pools: mergeMouthCandidatePools(generated.pools, repairedAttention.pools),\r\n      rawText: repairedAttention.rawText,\r\n    };",
  "attention targeted repair",
);

// 7. Cut repair: determine only missing pools; if every pool is present, repair all rejected beats conservatively.
const oldCutRepair = `generated =\r\n      await generateCandidatePools(\r\n        envelope,\r\n        canonicalBeats,\r\n        input.lens,\r\n        [],\r\n        risk,\r\n        repairFeedback,\r\n      );`;
const newCutRepair = `const missingOrders = generated.pools\r\n      .filter((pool) => pool.candidates.length === 0)\r\n      .map((pool) => pool.order);\r\n    const repairOrders = missingOrders.length\r\n      ? missingOrders\r\n      : canonicalBeats.map((beat) => beat.order);\r\n\r\n    const repairedCut =\r\n      await generateCandidatePools(\r\n        envelope,\r\n        canonicalBeats,\r\n        input.lens,\r\n        [],\r\n        risk,\r\n        repairFeedback,\r\n        repairOrders,\r\n      );\r\n\r\n    generated = {\r\n      pools: mergeMouthCandidatePools(generated.pools, repairedCut.pools),\r\n      rawText: repairedCut.rawText,\r\n    };`;
if (next.includes(oldCutRepair)) {
  next = next.replace(oldCutRepair, newCutRepair);
} else if (!next.includes("const repairedCut")) {
  throw new Error("PATCH FAILED: cut repair call");
}

fs.writeFileSync(path, next, "utf8");
console.log("PATCHED: authorBrainUniversal.ts · targeted weak-beat Mouth repair");
console.log("AUTHOR MOUTH TARGETED REPAIR V1 COMPLETE");
