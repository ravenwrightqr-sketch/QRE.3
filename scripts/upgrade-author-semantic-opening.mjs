import fs from "node:fs";

function patch(path, replacements) {
  let source = fs.readFileSync(path, "utf8");
  for (const { from, to, label } of replacements) {
    if (!source.includes(from)) throw new Error(`PATCH FAILED: ${path} · ${label}`);
    source = source.replace(from, to);
  }
  fs.writeFileSync(path, source, "utf8");
}

patch("apps/api/src/services/authorMouth.ts", [
  {
    from: `  if (\n    missingSubjectAnchor &&\n    candidate.beatOrder === 1 &&\n    !candidate.reasons.includes(\n      "approved-semantic-realization",\n    )\n  ) {\n    return false;\n  }`,
    to: `  if (\n    missingSubjectAnchor &&\n    candidate.beatOrder === 1\n  ) {\n    return false;\n  }`,
    label: "opening identity becomes a hard authorization boundary",
  },
  {
    from: `    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",`,
    to: `    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",\n\n    "Treat the creator's supplied reality as authoritative even when it is strange, impossible, contradictory, comedic, or implausible. Never sanitize supplied reality because it seems unlikely.",`,
    label: "preserve absurd user reality as authoritative",
  },
]);

patch("apps/api/src/services/authorBrainCanonical.ts", [
  {
    from: `          clean(first?.viewerChange),\n          canonicalAuthority,`,
    to: `          groupIndex === 0\n            ? "OPENING IDENTITY OBLIGATION: explicitly name the supplied subject once. Identity is established here; do not make later cuts repeat the subject unless the supplied relationship requires it."\n            : clean(first?.viewerChange),\n          canonicalAuthority,`,
    label: "semantic spine opening identity job",
  },
  {
    from: `        clean(first?.viewerChange),\n        canonicalAuthority,\n        group.length > 1`,
    to: `        groupIndex === 0\n          ? "OPENING IDENTITY OBLIGATION: explicitly name the supplied subject once. Identity is established here; do not make later cuts repeat the subject unless the supplied relationship requires it."\n          : clean(first?.viewerChange),\n        canonicalAuthority,\n        group.length > 1`,
    label: "fallback sequence opening identity job",
  },
  {
    from: `    attentionFunction: [clean(step.viewerChange), canonicalAuthority].filter(Boolean).join(" "),`,
    to: `    attentionFunction: [\n      index === 0\n        ? "OPENING IDENTITY OBLIGATION: explicitly name the supplied subject once. Identity is established here; later cuts may compress it."\n        : clean(step.viewerChange),\n      canonicalAuthority,\n    ].filter(Boolean).join(" "),`,
    label: "single-step opening identity job",
  },
]);

fs.unlinkSync(new URL("./upgrade-author-semantic-opening.mjs", import.meta.url));
console.log("AUTHOR SEMANTIC OPENING UPGRADE APPLIED");
console.log("Opening identity is now a hard Mouth authorization boundary.");
console.log("Canonical Brain now carries an explicit one-time identity obligation.");
console.log("Supplied absurd/impossible reality remains authoritative.");
console.log("Temporary patch script removed itself.");
