import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const read = (name) => fs.readFileSync(file(name), "utf8");
const write = (name, text) => fs.writeFileSync(file(name), text.replace(/\r\n/g, "\n"));

function replaceOnce(name, source, from, to, label) {
  if (!source.includes(from)) throw new Error(`${name}: anchor not found for ${label}`);
  return source.replace(from, to);
}

function replaceRegex(name, source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`${name}: regex anchor not found for ${label}`);
  return next;
}

// RealityGraph: same-subject overlap is continuity, not convergence.
{
  const name = "apps/api/src/services/authorRealityGraph.ts";
  let source = read(name);
  source = replaceRegex(
    name,
    source,
    /\n\s*if \(longShared\.length >= 1\) \{\n\s*addRelation\(relations, current\.id, other\.id, "converges", Math\.min\(0\.82, 0\.42 \+ longShared\.length \* 0\.12\)\);\n\s*\}\n/,
    "\n",
    "remove lexical convergence",
  );
  source = replaceRegex(
    name,
    source,
    /\n\s*if \(currentSubject && otherSubject\) \{[\s\S]*?\n\s*\}\n\n\s*const otherStates = extractStates\(other\.label\);/,
    `\n      if (currentSubject && otherSubject) {\n        addRelation(relations, current.id, other.id, "involves", 0.8);\n      }\n\n      const otherStates = extractStates(other.label);`,
    "remove same-subject inferred convergence",
  );
  write(name, source);
}

// Universal movie trajectory: greedy dramatic continuity instead of first-seven.
{
  const name = "apps/api/src/services/authorUniversalMovieSearch.ts";
  let source = read(name);
  source = replaceRegex(
    name,
    source,
    /function buildTrajectory\(graph: RealityGraph, ids: readonly string\[\]\): LatentMovieTrajectoryStep\[\] \{[\s\S]*?\n\}\n\nfunction callbackCoverage/,
    `function buildTrajectory(graph: RealityGraph, ids: readonly string[]): LatentMovieTrajectoryStep[] {\n  if (ids.length < 3) return [];\n\n  const candidates = ids.filter((id) => Boolean(event(graph, id)));\n  if (candidates.length < 3) return [];\n\n  const start = [...candidates].sort((a, b) => position(graph, a) - position(graph, b))[0]!;\n  const selected: string[] = [start];\n\n  while (selected.length < Math.min(7, candidates.length)) {\n    const previousId = selected[selected.length - 1]!;\n    const previousPosition = position(graph, previousId);\n    const used = new Set(selected);\n\n    const ranked = candidates\n      .filter((id) => !used.has(id))\n      .map((id) => {\n        const current = event(graph, id)!;\n        const relation = relationBetween(graph, previousId, id);\n        const structure = eventStructureFor(graph, id);\n        const forward = position(graph, id) > previousPosition ? 1 : 0;\n        const relationStrength = relation?.strength ?? 0;\n        const transition = structure?.transitionScore ?? 0;\n        const recurrence = structure?.recurrenceScore ?? 0;\n        const anomaly = structure?.anomalyScore ?? 0;\n        const salience = structure?.salienceScore ?? (current.salient ? 1 : 0);\n        const specificity = eventSpecificity(graph, id);\n        const shared = sharedTokenScore(label(graph, previousId), label(graph, id));\n        const callback = callbackPair(graph, previousId, id) ? 1 : 0;\n        const score =\n          relationStrength * 0.34 +\n          transition * 0.14 +\n          recurrence * 0.10 +\n          anomaly * 0.08 +\n          salience * 0.12 +\n          specificity * 0.10 +\n          shared * 0.05 +\n          callback * 0.07 +\n          forward * 0.06;\n        return { id, score };\n      })\n      .sort((a, b) => b.score - a.score || position(graph, a.id) - position(graph, b.id));\n\n    const next = ranked[0]?.id;\n    if (!next) break;\n    selected.push(next);\n  }\n\n  if (selected.length < 3) return [];\n\n  return selected.map((id, index) => {\n    const final = index === selected.length - 1;\n    const previousId = index > 0 ? selected[index - 1] : undefined;\n    const relation = previousId ? relationBetween(graph, previousId, id) : undefined;\n    const previousLabel = previousId ? label(graph, previousId) : "";\n    const currentLabel = label(graph, id);\n    const operation = operationFor(relation, previousLabel, currentLabel, final);\n    return {\n      order: index + 1,\n      operation,\n      eventIds: [id],\n      viewerChange: structuralViewerChange(graph, previousId, id, relation, final),\n      nextQuestion: questionFor(operation),\n    };\n  });\n}\n\nfunction callbackCoverage`,
    "replace first-seven trajectory",
  );
  source = replaceOnce(
    name,
    source,
    `const structuralMovement = metric(\n    (state?.score ?? 0) * 0.4 +\n      Math.min(1, relationKinds.length / 3) * 0.2 +`,
    `const structuralMovement = metric(\n    (state?.score ?? 0) * 0.15 +\n      Math.min(1, relationKinds.length / 3) * 0.3 +`,
    "demote state-pair dominance",
  );
  write(name, source);
}

// Mouth: repair authorization order, editorial compression, scoped context, recovery last.
{
  const name = "apps/api/src/services/authorMouth.ts";
  let source = read(name);

  source = replaceOnce(
    name,
    source,
    `  const compressed =\n    wordCount(value) >= 2 &&\n    wordCount(value) <= 10;`,
    `  const semanticApproved = Boolean(semantic(beat));\n\n  const explanationForbidden =\n    beat.realizationObligations?.explanationPolicy.forbidden ??\n    beat.observerExperience?.explanationForbidden ??\n    false;\n\n  const semanticPressure = metric(\n    semanticApproved\n      ? Math.max(semanticScore, lift, feltAuthority ? 0.45 : 0)\n      : grounding,\n  );\n\n  const editorialCompression = metric(\n    0.55 +\n    semanticPressure * 0.25 +\n    (wordCount(value) > 0 ? 0.1 : 0) +\n    (wordCount(value) <= 18 ? 0.1 : 0),\n  );`,
    "install editorial compression after authority variables",
  );

  // Remove the duplicate semanticApproved/explanationForbidden declarations later in the function.
  source = replaceOnce(
    name,
    source,
    `  const semanticApproved =\n    Boolean(\n      semantic(beat),\n    );\n\n  const paraphrase =`,
    `  const paraphrase =`,
    "remove duplicate semanticApproved",
  );

  source = replaceOnce(
    name,
    source,
    `  const explanationForbidden =\n    beat.realizationObligations\n      ?.explanationPolicy\n      .forbidden ??\n    beat.observerExperience\n      ?.explanationForbidden ??\n    false;\n\n  const explanationPenalty =`,
    `  const explanationPenalty =`,
    "remove duplicate explanation policy",
  );

  // Add establishingCreative only after anchor/felt variables exist.
  source = replaceOnce(
    name,
    source,
    `  const feltAuthority =\n    Boolean(\n      semantic(beat)?.feltEffect ||\n      semantic(beat)?.viewerShift ||\n      semantic(beat)?.languageAim ||\n      beat.observerExperience\n        ?.feltEffect ||\n      beat.observerExperience\n        ?.viewerShift ||\n      beat.observerExperience\n        ?.realizationDirection,\n    );`,
    `  const feltAuthority =\n    Boolean(\n      semantic(beat)?.feltEffect ||\n      semantic(beat)?.viewerShift ||\n      semantic(beat)?.languageAim ||\n      beat.observerExperience\n        ?.feltEffect ||\n      beat.observerExperience\n        ?.viewerShift ||\n      beat.observerExperience\n        ?.realizationDirection,\n    );\n\n  const establishingCreative =\n    beat.order === 1 &&\n    !literal &&\n    grounding >= 0.15 &&\n    subjectAnchorPreserved &&\n    anchorPreserved &&\n    generic === 0 &&\n    process === 0 &&\n    explanation === 0 &&\n    fragment < 0.9;`,
    "add establishing creative authorization",
  );

  source = replaceOnce(
    name,
    source,
    `        (compressed\n          ? 0.06\n          : 0) +`,
    `        editorialCompression * 0.06 +\n        (establishingCreative ? 0.18 : 0) +`,
    "reward editorial compression and valid opening creativity",
  );

  source = replaceOnce(
    name,
    source,
    `  if (compressed) {\n    reasons.push(\n      "compressed",\n    );\n  }`,
    `  if (editorialCompression >= 0.7) reasons.push("editorially-compressed");\n  if (establishingCreative) reasons.push("establishing-creative-realization");`,
    "replace compression reason",
  );

  source = replaceOnce(
    name,
    source,
    `    compressionScore:\n      compressed\n        ? 0.98\n        : 0.55,`,
    `    compressionScore: editorialCompression,`,
    "store editorial compression",
  );

  source = replaceOnce(
    name,
    source,
    `    (candidate.reasons.includes("compressed") ? 0.04 : 0) +`,
    `    (candidate.reasons.includes("editorially-compressed") ? 0.04 : 0) +`,
    "update sequence compression signal",
  );

  source = replaceOnce(
    name,
    source,
    `    (candidate.reasons.includes("recovery-source") ? 0.18 : 0) -`,
    `    (candidate.reasons.includes("recovery-source") ? -0.08 : 0) -`,
    "stop rewarding recovery",
  );

  source = replaceOnce(
    name,
    source,
    `  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;\n  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;\n  if (candidate.reasons.includes("recovery-source")) return true;\n  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.28;`,
    `  if (candidate.reasons.includes("subject-anchor-missing") && candidate.beatOrder === 1) return false;\n  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1 && !candidate.reasons.includes("recovery-source")) return false;\n  if (candidate.reasons.includes("recovery-source")) return true;\n  if (candidate.reasons.includes("establishing-creative-realization")) return candidate.score >= 0.22;\n  return candidate.reasons.includes("approved-semantic-realization") && candidate.reasons.includes("meaning-executed") && candidate.score >= 0.28;`,
    "allow role-aware opening realization",
  );

  source = replaceOnce(
    name,
    source,
    `    availableReality:\n      relatedFacts,`,
    `    availableReality:\n      evidence.slice(0, 12),`,
    "scope available reality",
  );

  source = replaceOnce(
    name,
    source,
    `    "Opening: naturally name the supplied subject. Later cuts may omit it.",\n    "Payoff: land the supplied endpoint without appending another event.",`,
    `    "Opening: establish the supplied subject and first point of attention. Never invent an event to make the opening cinematic.",\n    "Reveal cuts: deepen the supplied relationship through implication, juxtaposition, contrast, status, rhythm, callback, or compression; never explain the relationship.",\n    "Payoff: land the supplied endpoint without appending another event.",\n    "A dramatic beat may combine multiple supplied facts when their relationship is the point.",\n    "A cut may be a phrase, sentence, or several connected sentences. Shorter is not automatically better.",\n    "Compress language until further compression weakens relationship, tension, anticipation, or rhythm.",\n    "Use the minimum language that preserves dramatic pressure.",\n    "Make connections felt through adjacency, timing, contrast, implication, rhythm, and selective detail.",`,
    "upgrade Mouth system prompt",
  );

  source = replaceRegex(
    name,
    source,
    /\n\s*const literalRecoveryCandidates =\n\s*deterministicCreativeFallback\([\s\S]*?\n\s*\);\n\n\s*return \{/,
    `\n    const generatedIsAuthorized = generatedCandidates.some(isAuthorizedMouthCandidate);\n\n    const literalRecoveryCandidates = generatedIsAuthorized\n      ? []\n      : deterministicCreativeFallback(beat, input.envelope)\n          .map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope, recovery: true }))\n          .map((candidate) => annotateMouthRealizationBoundary(candidate, beat, input.envelope));\n\n    return {`,
    "make literal recovery last resort",
  );

  write(name, source);
}

// Attention editor: truth boundary owns invention; this layer evaluates attention shape only.
{
  const name = "apps/api/src/services/authorAttentionEditor.ts";
  let source = read(name);
  source = replaceOnce(
    name,
    source,
    `const obviousInvention = /\\b(?:glares?|sniffs?|blinks?|stares?|smiles?|wags?|trembles?|runs?|jumps?|grabs?|bites?|walks?|enters?|leaves?)\\b/i;\n\nfunction softAttentionDensity(wordCount: number): number {\n  if (wordCount <= 0) return 0;\n  if (wordCount <= 7) return 0.95;\n  if (wordCount <= 12) return 0.9;\n  if (wordCount <= 18) return 0.82;\n  if (wordCount <= 28) return 0.72;\n  if (wordCount <= 40) return 0.6;\n  return 0.45;\n}`,
    `function softAttentionDensity(wordCount: number): number {\n  if (wordCount <= 0) return 0;\n  if (wordCount <= 18) return 0.9;\n  if (wordCount <= 40) return 0.82;\n  if (wordCount <= 70) return 0.72;\n  return 0.62;\n}`,
    "remove lexical invention and short-line preference",
  );
  source = replaceOnce(name, source, `  const invention = obviousInvention.test(text) ? 0.25 : 0;`, `  const invention = 0;`, "delegate invention authority");
  source = replaceOnce(name, source, `  if (wc > 18) reasons.push("long-cut-soft-cost");`, `  if (wc > 70) reasons.push("long-cut-soft-cost");`, "soften length diagnostic");
  write(name, source);
}

console.log("UNIVERSAL AUTHOR CREATIVE CORE HARDENING V2: PASS");
console.log("graph=REALITY_RELATIONS_ONLY");
console.log("movie=DRAMATIC_TRAJECTORY");
console.log("mouth=CREATIVE_FIRST_RECOVERY_LAST");
console.log("compression=EDITORIAL");
console.log("attention=NON_GENERATIVE");
