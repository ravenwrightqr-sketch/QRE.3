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
  `function unsupportedConcreteRisk(\n  text: string,\n  envelope: RealityEnvelope,\n): number {\n  const value = clean(text);\n  if (!value) return 1;\n  if (processRisk(value)) return 1;\n\n  const candidate = meaningful(value);\n  const source = meaningful(\n    [\n      envelope.subject,\n      ...envelope.events.map((event) => event.label),\n      ...envelope.suppliedEntities,\n      ...envelope.suppliedActions,\n      ...envelope.suppliedStates,\n      ...envelope.suppliedPhrases,\n    ].join(" "),\n  );\n\n  const sourceOverlap = overlap(candidate, source);\n  const eventOverlap = creativeEvidenceOverlap(\n    value,\n    {\n      order: 1,\n      role: "reveal",\n      change: "",\n      next: "",\n      attentionFunction: "",\n      eventIds: envelope.events.map((event) => event.id),\n    },\n    envelope,\n  );\n\n  /*\n   * Concrete-invention safety uses provenance, not an English verb dictionary.\n   * A novel line is welcome when it remains anchored to supplied reality.\n   * A line with no source grounding is rejected rather than guessed safe.\n   */\n  if (sourceOverlap >= 0.12 || eventOverlap >= 0.12) return 0;\n  return 0.95;\n}\n\nfunction creativeEvidenceOverlap`,
  "replace brittle unsupported-action vocabulary guard with provenance guard",
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
