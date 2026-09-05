import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(name) {
  return path.join(root, name);
}

function read(name) {
  return fs.readFileSync(file(name), "utf8");
}

function write(name, text) {
  fs.writeFileSync(file(name), text.replace(/\r\n/g, "\n"));
}

function replaceOnce(name, source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`${name}: anchor not found for ${label}`);
  }
  return source.replace(from, to);
}

function replaceRegex(name, source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`${name}: regex anchor not found for ${label}`);
  return next;
}

// ---------------------------------------------------------------------------
// 1. REALITY GRAPH: shared subject/detail overlap is not a reality relation.
// ---------------------------------------------------------------------------
{
  const name = "apps/api/src/services/authorRealityGraph.ts";
  let source = read(name);

  source = replaceRegex(
    name,
    source,
    /\n\s*if \(longShared\.length >= 1\) \{\n\s*addRelation\(relations, current\.id, other\.id, "converges", Math\.min\(0\.82, 0\.42 \+ longShared\.length \* 0\.12\)\);\n\s*\}\n/,
    "\n",
    "remove lexical convergence relation",
  );

  source = replaceRegex(
    name,
    source,
    /\n\s*if \(currentSubject && otherSubject\) \{[\s\S]*?\n\s*\}\n\n\s*const otherStates = extractStates\(other\.label\);/,
    `\n      if (currentSubject && otherSubject) {\n        addRelation(relations, current.id, other.id, "involves", 0.8);\n      }\n\n      const otherStates = extractStates(other.label);`,
    "remove inferred convergence between same-subject events",
  );

  write(name, source);
}

// ---------------------------------------------------------------------------
// 2. UNIVERSAL MOVIE SEARCH: choose a dramatic trajectory, not first-seven.
// ---------------------------------------------------------------------------
{
  const name = "apps/api/src/services/authorUniversalMovieSearch.ts";
  let source = read(name);

  source = replaceRegex(
    name,
    source,
    /function buildTrajectory\(graph: RealityGraph, ids: readonly string\[\]\): LatentMovieTrajectoryStep\[\] \{[\s\S]*?\n\}\n\nfunction callbackCoverage/, 
    `function buildTrajectory(graph: RealityGraph, ids: readonly string[]): LatentMovieTrajectoryStep[] {\n  if (ids.length < 3) return [];\n\n  const candidates = ids.filter((id) => Boolean(event(graph, id)));\n  if (candidates.length < 3) return [];\n\n  const selected: string[] = [\n    [...candidates].sort((a, b) => position(graph, a) - position(graph, b))[0]!,\n  ];\n\n  while (selected.length < Math.min(7, candidates.length)) {\n    const used = new Set(selected);\n    const previousId = selected[selected.length - 1]!;\n    const previousPosition = position(graph, previousId);\n\n    const ranked = candidates\n      .filter((id) => !used.has(id))\n      .map((id) => {\n        const current = event(graph, id)!;\n        const relation = relationBetween(graph, previousId, id);\n        const structure = eventStructureFor(graph, id);\n        const forward = position(graph, id) > previousPosition ? 1 : 0;\n        const relationStrength = relation?.strength ?? 0;\n        const transition = structure?.transitionScore ?? 0;\n        const recurrence = structure?.recurrenceScore ?? 0;\n        const anomaly = structure?.anomalyScore ?? 0;\n        const salience = structure?.salienceScore ?? (current.salient ? 1 : 0);\n        const specificity = eventSpecificity(graph, id);\n        const shared = sharedTokenScore(label(graph, previousId), label(graph, id));\n        const callback = callbackPair(graph, previousId, id) ? 1 : 0;\n\n        const score =\n          relationStrength * 0.34 +\n          transition * 0.14 +\n          recurrence * 0.10 +\n          anomaly * 0.08 +\n          salience * 0.12 +\n          specificity * 0.10 +\n          shared * 0.05 +\n          callback * 0.07 +\n          forward * 0.06;\n\n        return { id, score };\n      })\n      .sort((a, b) => b.score - a.score || position(graph, a.id) - position(graph, b.id));\n\n    const next = ranked[0]?.id;\n    if (!next) break;\n    selected.push(next);\n  }\n\n  if (selected.length < 3) return [];\n\n  return selected.map((id, index) => {\n    const final = index === selected.length - 1;\n    const previousId = index > 0 ? selected[index - 1] : undefined;\n    const relation = previousId ? relationBetween(graph, previousId, id) : undefined;\n    const previousLabel = previousId ? label(graph, previousId) : \"\";\n    const currentLabel = label(graph, id);\n    const structure = eventStructureFor(graph, id);\n    const operation = operationFor(relation, previousLabel, currentLabel, final);\n\n    return {\n      order: index + 1,\n      operation,\n      eventIds: [id],\n      viewerChange: structuralViewerChange(graph, previousId, id, relation, final),\n      nextQuestion: questionFor(operation),\n    };\n  });\n}\n\nfunction callbackCoverage`,
    "replace first-seven trajectory selector",
  );

  source = replaceOnce(
    name,
    source,
    `const structuralMovement = metric(\n    (state?.score ?? 0) * 0.4 +\n      Math.min(1, relationKinds.length / 3) * 0.2 +`,
    `const structuralMovement = metric(\n    (state?.score ?? 0) * 0.15 +\n      Math.min(1, relationKinds.length / 3) * 0.3 +`,
    "demote lexical state-pair dominance",
  );

  write(name, source);
}

// ---------------------------------------------------------------------------
// 3. ONE MOUTH: creative candidates outrank recovery; prompts stay scoped.
// ---------------------------------------------------------------------------
{
  const name = "apps/api/src/services/authorMouth.ts";
  let source = read(name);

  source = replaceOnce(
    name,
    source,
    `  const compressed =\n    wordCount(value) >= 2 &&\n    wordCount(value) <= 10;`,
    `  const semanticPressure = metric(\n    semanticApproved\n      ? Math.max(\n          semanticScore,\n          lift,\n          feltAuthority ? 0.45 : 0,\n        )\n      : grounding,\n  );\n  const editorialCompression = metric(\n    Math.min(1,\n      0.55 +\n      semanticPressure * 0.25 +\n      (wordCount(value) > 0 ? 0.1 : 0) +\n      (wordCount(value) <= 18 ? 0.1 : 0),\n    ),\n  );`,
    "replace hard word-count compression boolean",
  );

  source = replaceOnce(
    name,
    source,
    `  const hasRelationalMove =\n    semanticApproved &&\n    (\n      lift >= 0.3 ||\n      semanticScore >= 0.05 ||\n      (\n        creativeEvidenceOverlap(\n          value,\n          beat,\n          envelope,\n        ) >= 0.2 &&\n        relationKind(beat).length > 0\n      )\n    );`,
    `  const hasRelationalMove =\n    semanticApproved &&\n    (\n      lift >= 0.3 ||\n      semanticScore >= 0.05 ||\n      (\n        creativeEvidenceOverlap(\n          value,\n          beat,\n          envelope,\n        ) >= 0.2 &&\n        relationKind(beat).length > 0\n      )\n    );\n\n  const establishingCreative =\n    beat.order === 1 &&\n    !literal &&\n    grounding >= 0.15 &&\n    subjectAnchorPreserved &&\n    anchorPreserved &&\n    generic === 0 &&\n    process === 0 &&\n    explanation === 0 &&\n    fragment < 0.9;`,
    "allow grounded creative establishing beat",
  );

  source = replaceOnce(
    name,
    source,
    `        (compressed\n          ? 0.06\n          : 0) +`,
    `        editorialCompression * 0.06 +\n        (establishingCreative\n          ? 0.18\n          : 0) +`,
    "make compression editorial and reward establishing creativity",
  );

  source = replaceOnce(
    name,
    source,
    `  if (compressed) {\n    reasons.push(\n      "compressed",\n    );\n  }`,
    `  if (editorialCompression >= 0.7) {\n    reasons.push("editorially-compressed");\n  }\n\n  if (establishingCreative) {\n    reasons.push("establishing-creative-realization");\n  }`,
    "replace compression reason",
  );

  source = replaceOnce(
    name,
    source,
    `    compressionScore:\n      compressed\n        ? 0.98\n        : 0.55,`,
    `    compressionScore: editorialCompression,`,
    "store editorial compression score",
  );

  source = replaceOnce(
    name,
    source,
    `    (candidate.reasons.includes("compressed") ? 0.04 : 0) +`,
    `    (candidate.reasons.includes("editorially-compressed") ? 0.04 : 0) +`,
    "rename sequence compression reason",
  );

  source = replaceOnce(
    name,
    source,
    `    (candidate.reasons.includes("recovery-source") ? 0.18 : 0) -`,
    `    (candidate.reasons.includes("recovery-source") ? -0.08 : 0) -`,
    "remove recovery reward",
  );

  source = replaceOnce(
    name,
    source,
    `  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;\n  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;\n  if (candidate.reasons.includes("recovery-source")) return true;\n  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.28;`,
    `  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;\n  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;\n  if (candidate.reasons.includes("recovery-source")) return true;\n\n  if (candidate.reasons.includes("establishing-creative-realization")) {\n    return candidate.score >= 0.22;\n  }\n\n  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.28;`,
    "role-aware candidate authorization",
  );

  source = replaceOnce(
    name,
    source,
    `    availableReality:\n      relatedFacts,`,
    `    // Mouth receives the beat-scoped decision window, not the whole world.\n    availableReality:\n      evidence.slice(0, 12),`,
    "scope Mouth reality packet",
  );

  source = replaceOnce(
    name,
    source,
    `    "Opening: naturally name the supplied subject. Later cuts may omit it.",\n    "Payoff: land the supplied endpoint without appending another event.",`,
    `    "Opening: establish the supplied subject and the first point of attention; do not invent an event to make the opening cinematic.",\n    "Reveal cuts: deepen the reading using supplied relationships, implication, juxtaposition, contrast, status, rhythm, or compression; never explain the relationship.",\n    "Payoff: land the supplied endpoint without appending another event.",\n    "A dramatic beat may combine multiple supplied facts when their relationship is the point.",\n    "A cut may be one phrase, one sentence, or several connected sentences. Do not shorten a line merely to make it short.",\n    "Compress language until further compression weakens relationship, tension, anticipation, or rhythm.",\n    "Use the minimum language that preserves the dramatic pressure.",\n    "Make connections felt through adjacency, timing, contrast, implication, rhythm, and selective detail.",`,
    "upgrade Mouth creative doctrine",
  );

  source = replaceRegex(
    name,
    source,
    /\n\s*const literalRecoveryCandidates =\n\s*deterministicCreativeFallback\([\s\S]*?\n\s*\);\n\n\s*return \{/,
    `\n    const generatedIsAuthorized = generatedCandidates.some(isAuthorizedMouthCandidate);\n\n    const literalRecoveryCandidates = generatedIsAuthorized\n      ? []\n      : deterministicCreativeFallback(beat, input.envelope)\n          .map((text) =>\n            scoreMouthCandidate({\n              text,\n              beat,\n              envelope: input.envelope,\n              recovery: true,\n            }),\n          )\n          .map((candidate) =>\n            annotateMouthRealizationBoundary(\n              candidate,\n              beat,\n              input.envelope,\n            ),\n          );\n\n    return {`,
    "make deterministic recovery true last resort",
  );

  write(name, source);
}

// ---------------------------------------------------------------------------
// 4. ATTENTION EDITOR: no lexical invention veto and no word-count bias.
// ---------------------------------------------------------------------------
{
  const name = "apps/api/src/services/authorAttentionEditor.ts";
  let source = read(name);

  source = replaceOnce(
    name,
    source,
    `const obviousInvention = /\\b(?:glares?|sniffs?|blinks?|stares?|smiles?|wags?|trembles?|runs?|jumps?|grabs?|bites?|walks?|enters?|leaves?)\\b/i;\n\nfunction softAttentionDensity(wordCount: number): number {\n  if (wordCount <= 0) return 0;\n  if (wordCount <= 7) return 0.95;\n  if (wordCount <= 12) return 0.9;\n  if (wordCount <= 18) return 0.82;\n  if (wordCount <= 28) return 0.72;\n  if (wordCount <= 40) return 0.6;\n  return 0.45;\n}`,
    `function softAttentionDensity(wordCount: number): number {\n  if (wordCount <= 0) return 0;\n  if (wordCount <= 18) return 0.9;\n  if (wordCount <= 40) return 0.82;\n  if (wordCount <= 70) return 0.72;\n  return 0.62;\n}`,
    "remove lexical invention veto and hard short-line bias",
  );

  source = replaceOnce(
    name,
    source,
    `  const invention = obviousInvention.test(text) ? 0.25 : 0;`,
    `  // Concrete invention is owned by the canonical realization boundary.\n  // This diagnostic layer must not reject valid language merely because a\n  // verb looks cinematic in isolation.\n  const invention = 0;`,
    "delegate invention authority to realization boundary",
  );

  source = replaceOnce(
    name,
    source,
    `  if (wc > 18) reasons.push("long-cut-soft-cost");`,
    `  if (wc > 70) reasons.push("long-cut-soft-cost");`,
    "remove normal-length penalty",
  );

  write(name, source);
}

console.log("UNIVERSAL AUTHOR CREATIVE CORE HARDENING: PASS");
console.log("graph=REALITY_RELATIONS_ONLY");
console.log("movie=DRAMATIC_TRAJECTORY");
console.log("mouth=CREATIVE_FIRST_RECOVERY_LAST");
console.log("compression=EDITORIAL");
console.log("attention=NON_GENERATIVE_DIAGNOSTIC");
