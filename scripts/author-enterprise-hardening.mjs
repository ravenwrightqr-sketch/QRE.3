import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function replaceOnce(file, pattern, replacement, label) {
  const target = path.join(root, file);
  const source = fs.readFileSync(target, "utf8");
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`PATCH FAILED: ${label}`);
  fs.writeFileSync(target, next, "utf8");
  console.log(`PATCHED: ${label}`);
}

replaceOnce(
  "apps/api/src/services/authorMouth.ts",
  /function unsupportedConcreteRisk\(\n  text: string,\n  envelope: RealityEnvelope,\n\): number \{[\s\S]*?\n\}\n\nfunction creativeEvidenceOverlap/m,
  `function unsupportedConcreteRisk(\n  text: string,\n  envelope: RealityEnvelope,\n): number {\n  const value = clean(text);\n  if (!value) return 1;\n  if (processRisk(value)) return 1;\n\n  const candidate = meaningful(value);\n  const source = meaningful(\n    [\n      envelope.subject,\n      ...envelope.events.map((event) => event.label),\n      ...envelope.suppliedEntities,\n      ...envelope.suppliedActions,\n      ...envelope.suppliedStates,\n      ...envelope.suppliedPhrases,\n    ].join(" "),\n  );\n\n  const sourceOverlap = overlap(candidate, source);\n  const eventOverlap = creativeEvidenceOverlap(value, {\n    order: 1,\n    role: "reveal",\n    change: "",\n    next: "",\n    attentionFunction: "",\n    eventIds: envelope.events.map((event) => event.id),\n  }, envelope);\n\n  /*\n   * Semantic authority is the important boundary. Once Brain has approved\n   * a semantic realization over supplied events, Mouth may use genuinely\n   * novel vocabulary without being punished merely because the words are not\n   * present in the source. Concrete invention is still rejected when there\n   * is neither semantic authority nor source grounding.\n   */\n  return semantic(beatForRisk) ? 0.15 : sourceOverlap >= 0.12 || eventOverlap >= 0.12 ? 0 : 0.95;\n}\n\nfunction creativeEvidenceOverlap`,
  "replace brittle unsupported-action vocabulary guard",
);

replaceOnce(
  "apps/api/src/services/authorMouth.ts",
  /  if \(\n    missingSubjectAnchor &&\n    candidate\.beatOrder === 1 &&\n    !candidate\.reasons\.includes\(\n      "approved-semantic-realization",\n    \)\n  \) \{\n    return false;\n  \}/m,
  `  if (\n    missingSubjectAnchor &&\n    candidate.beatOrder === 1\n  ) {\n    return false;\n  }`,
  "make opening subject identity a hard sequence invariant",
);

replaceOnce(
  "apps/api/src/services/authorMouth.ts",
  /    "Use only supplied reality\. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication\.",/,
  `    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",\n\n    "Treat every creator-supplied assertion as authoritative world reality, even when it is absurd, impossible, contradictory, or unexpected. Never normalize it into a more plausible version.",`,
  "make supplied absurdity explicitly authoritative",
);

replaceOnce(
  "apps/api/src/services/authorMouth.ts",
  /    "Never invent a physical action, object, person, setting, sound, reaction, dialogue, chronology, or outcome\.",/,
  `    "Never invent a new concrete event, object, person, setting, sound, reaction, dialogue, chronology, or outcome. Creative wording may be surprising; the underlying event must remain supplied.",`,
  "separate creative surprise from concrete invention",
);

console.log("AUTHOR ENTERPRISE HARDENING READY");
console.log("Next: pnpm --filter @qre/api build && pnpm author:universal-final");
