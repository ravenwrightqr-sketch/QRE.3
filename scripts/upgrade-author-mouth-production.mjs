import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function write(file, content) {
  fs.writeFileSync(path.join(root, file), content, "utf8");
}

function replaceExact(text, from, to, label) {
  if (!text.includes(from)) {
    throw new Error(`AUTHOR MOUTH UPGRADE · anchor missing: ${label}`);
  }
  return text.replace(from, to);
}

function insertBefore(text, marker, addition, label) {
  if (text.includes(addition.trim())) return text;
  const index = text.indexOf(marker);
  if (index < 0) {
    throw new Error(`AUTHOR MOUTH UPGRADE · anchor missing: ${label}`);
  }
  return text.slice(0, index) + addition + "\n" + text.slice(index);
}

function patchContracts() {
  const file = "packages/contracts/src/cogauthor/mouth.ts";
  let text = read(file);

  const diagnostics = `  /** Deterministic creative execution score used by Beam and diagnostics. */\n  creativeExecutionScore?: number;\n  /** Strategy-aware rhetorical-shape score. */\n  rhetoricalShapeScore?: number;\n  /** Continuous source-restatement pressure. */\n  sourceRestatementScore?: number;\n`;

  if (!text.includes("creativeExecutionScore?: number;")) {
    text = replaceExact(
      text,
      "  endpointExactness: number;\n",
      "  endpointExactness: number;\n" + diagnostics,
      "MouthCandidate creative diagnostics",
    );
  }

  write(file, text);
}

function patchMouth() {
  const file = "apps/api/src/services/authorMouthCandidateSearch.ts";
  let text = read(file);

  const helpers = `
function strategySignalScore(
  text: string,
  beat: MouthCandidateBeat,
): number {
  const strategy = clean(
    beat.creativeRealization?.strategy,
  ).toLowerCase();

  const move = clean(
    beat.creativeMove,
  ).toLowerCase();

  const lower = clean(text).toLowerCase();

  const signals: Record<string, RegExp[]> = {
    status_inversion: [
      /\\bas if\\b/,
      /\\balready\\b/,
      /\\bterms\\b/,
      /\\bapparently\\b/,
      /\\bapproved\\b/,
      /\\bdecided\\b/,
      /\\bin charge\\b/,
      /\\bupper hand\\b/,
      /\\bhad plans\\b/,
    ],
    contrast: [
      /\\banyway\\b/,
      /\\bstill\\b/,
      /\\byet\\b/,
      /\\bthough\\b/,
      /\\bdespite\\b/,
      /\\bbut\\b/,
    ],
    implication: [
      /\\bapparently\\b/,
      /\\bnaturally\\b/,
      /\\bno explanation\\b/,
      /\\benough said\\b/,
      /\\bso much for\\b/,
    ],
    understatement: [
      /\\bjust\\b/,
      /\\bnot exactly\\b/,
      /\\ba little\\b/,
      /\\bminor\\b/,
    ],
    recontextualization: [
      /\\bthen\\b/,
      /\\bsuddenly\\b/,
      /\\bmade sense\\b/,
      /\\bturns out\\b/,
      /\\bso that explained\\b/,
      /\\bapparently\\b/,
    ],
    callback: [
      /\\bagain\\b/,
      /\\bthere it is\\b/,
      /\\bthat part\\b/,
      /\\bturns out\\b/,
    ],
    reversal: [
      /\\bactually\\b/,
      /\\bexcept\\b/,
      /\\bnot\\b/,
      /\\bapparently\\b/,
    ],
    compression: [
      /^.{1,34}[.!?]$/,
    ],
    personification: [
      /\\bapproved\\b/,
      /\\bjudged\\b/,
      /\\bdecided\\b/,
      /\\bapparently\\b/,
    ],
    double_meaning: [
      /\\bterms\\b/,
      /\\bapproved\\b/,
      /\\bcase\\b/,
      /\\bsettled\\b/,
      /\\bpeace\\b/,
    ],
  };

  let score = 0;
  for (const pattern of signals[strategy] ?? signals[move] ?? []) {
    if (pattern.test(lower)) score += 0.18;
  }

  if (
    /\\bas if\\b|\\bapparently\\b|\\balready\\b|\\bmirror approved\\b|\\bpeace was temporary\\b/i.test(
      lower,
    )
  ) {
    score += 0.12;
  }

  return metric(score);
}

function sourceRestatementPressure(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const eventLabels = unique(
    (beat.eventIds ?? []).map((id) =>
      eventLabel(envelope, id),
    ),
  );

  const sourceOverlap = eventLabels.length
    ? Math.max(
        ...eventLabels.map((label) =>
          similarity(text, label),
        ),
      )
    : 0;

  const suppliedOverlap = overlap(
    setOf(text),
    suppliedTerms(envelope),
  );

  const collageLike =
    tokens(text).length >= 4 &&
    suppliedOverlap >= 0.65;

  return metric(
    Math.max(
      sourceOverlap * 0.65,
      collageLike
        ? suppliedOverlap * 0.7
        : 0,
    ),
  );
}

function creativeBeatExecutionScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): {
  execution: number;
  rhetorical: number;
  restatement: number;
} {
  const rhetorical = strategySignalScore(text, beat);
  const restatement = sourceRestatementPressure(
    text,
    beat,
    envelope,
  );

  const creative = beat.creativeRealization;
  const intentMatch = creative
    ? Math.max(
        similarity(
          text,
          creative.realizationIntent,
        ),
        similarity(
          text,
          creative.creativePremise ?? "",
        ),
        similarity(
          text,
          creative.escalationMove ?? "",
        ),
      )
    : 0;

  const operation = clean(
    beat.creativeMove ??
      beat.role,
  ).toLowerCase();

  const nonLiteralPenalty =
    restatement > 0.58
      ? 0.32
      : restatement > 0.42
        ? 0.18
        : 0;

  return {
    execution: metric(
      rhetorical * 0.58 +
      intentMatch * 0.12 +
      (restatement < 0.45 ? 0.2 : 0) +
      (operation === "payoff" ? 0 : 0.1) -
      nonLiteralPenalty,
    ),
    rhetorical,
    restatement,
  };
}
`;

  text = insertBefore(
    text,
    "function isPayoffBeat(",
    helpers,
    "Mouth creative scoring helpers",
  );

  const oldTransition = `function transitionScore(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  if (isPayoffBeat(beat)) return endpointExactness(text, beat);

  const change = clean(beat.change);
  const next = clean(beat.next || beat.frontier);
  const relations = supportedRelations(supportedEventIds(text, envelope), envelope).length;

  return metric(
    Math.min(1, relations / 2) * 0.4 +
    (change ? similarity(text, change) : 0.2) * 0.35 +
    (next ? similarity(text, next) : 0.2) * 0.25,
  );
}`;

  const newTransition = `function transitionScore(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  if (isPayoffBeat(beat)) return endpointExactness(text, beat);

  const relations = supportedRelations(
    supportedEventIds(text, envelope),
    envelope,
  ).length;

  const creative = creativeBeatExecutionScore(
    text,
    beat,
    envelope,
  );

  const next = clean(
    beat.next ||
      beat.frontier ||
      beat.creativeRealization?.escalationMove,
  );

  const forwardPull = next
    ? similarity(text, next)
    : 0.25;

  return metric(
    Math.min(1, relations / 2) * 0.2 +
    creative.execution * 0.58 +
    creative.rhetorical * 0.12 +
    forwardPull * 0.1,
  );
}`;

  text = replaceExact(
    text,
    oldTransition,
    newTransition,
    "Mouth transitionScore",
  );

  const oldCreativeScore = `  const creativeScore = realization
    ? metric(
        creativeExecution *
          0.65 +
        creativeIndependence *
          0.35,
      )
    : 0;
`;

  const newCreativeScore = `  const creativeBeat = creativeBeatExecutionScore(
    text,
    input.beat,
    input.envelope,
  );

  const creativeScore = realization
    ? metric(
        creativeBeat.execution * 0.55 +
        creativeBeat.rhetorical * 0.25 +
        creativeIndependence * 0.2,
      )
    : 0;
`;

  text = replaceExact(
    text,
    oldCreativeScore,
    newCreativeScore,
    "Mouth creative score",
  );

  text = replaceExact(
    text,
    `    collageRisk,
    endpointExactness:
      endpoint,
    score,
    reasons,
  };`,
    `    collageRisk,
    endpointExactness:
      endpoint,
    creativeExecutionScore:
      creativeBeat.execution,
    rhetoricalShapeScore:
      creativeBeat.rhetorical,
    sourceRestatementScore:
      creativeBeat.restatement,
    score,
    reasons,
  };`,
    "Mouth candidate diagnostics",
  );

  text = replaceExact(
    text,
    `  if (isPayoffBeat(beat)) return candidate.endpointExactness === 1;
  return true;`,
    `  if (isPayoffBeat(beat)) return candidate.endpointExactness === 1;

  if (
    beat.creativeRealization &&
    candidate.creativeExecutionScore !== undefined &&
    candidate.creativeExecutionScore < 0.28
  ) {
    return false;
  }

  if (
    beat.creativeRealization &&
    candidate.sourceRestatementScore !== undefined &&
    candidate.sourceRestatementScore > 0.72 &&
    candidate.rhetoricalShapeScore !== undefined &&
    candidate.rhetoricalShapeScore < 0.28
  ) {
    return false;
  }

  return true;`,
    "Mouth creative legality gate",
  );

  const oldPrompt = `    "WRITE:",
    "5 materially different viewer-facing realizations of the SAME approved creative meaning.",
    "Each line should earn its existence.",
    "Prefer 2-7 words.",
    "One dominant thought.",
    "One semantic move.",
    "Make the next cut feel desirable.",`;

  const newPrompt = `    "WRITE:",
    "Generate 5 genuinely different executions of the SAME approved creative beat.",
    "Do not generate 5 paraphrases of the source event.",
    "Across the five, actively explore different rhetorical families:",
    "1. STATUS — imply attitude, authority, terms, approval, or the upper hand.",
    "2. CONTRAST — put two supplied truths into sharp tension.",
    "3. IMPLICATION — make the viewer infer the interesting part.",
    "4. UNDERSTATEMENT / DOUBLE MEANING — say less while making more land.",
    "5. ESCALATION / RECONTEXTUALIZATION — make the next beat feel inevitable and change the reading of what came before.",
    "The five variants must not all name the same source object or event.",
    "Use supplied facts as hidden creative material, not as a checklist.",
    "A truthful line that merely reports the source is weak and should be replaced internally.",
    "Prefer quotable rhythm, sharp implication, attitude, and semantic movement.",
    "Prefer 2-7 words unless a slightly longer line creates a materially stronger hit.",
    "One dominant thought.",
    "One creative move.",
    "Make the next cut feel desirable.",`;

  text = replaceExact(
    text,
    oldPrompt,
    newPrompt,
    "Mouth rhetorical generation prompt",
  );

  write(file, text);
}

function patchBeam() {
  const file = "apps/api/src/services/authorMouthSequenceBeamSearch.ts";
  let text = read(file);

  const oldMovement = `  const movement = metric(
    candidate.meaningScore * 0.55 +
    candidate.transitionScore * 0.45,
  );
`;

  const newMovement = `  const creativeExecution =
    candidate.creativeExecutionScore ?? 0.5;

  const creativeShape =
    candidate.rhetoricalShapeScore ?? 0.5;

  const movement = metric(
    candidate.meaningScore * 0.4 +
    candidate.transitionScore * 0.3 +
    creativeExecution * 0.2 +
    creativeShape * 0.1,
  );
`;

  text = replaceExact(
    text,
    oldMovement,
    newMovement,
    "Beam movement score",
  );

  const intrinsicOld = `  return metric(
    candidate.groundingScore * 0.2 +
    candidate.meaningScore * 0.22 +
    candidate.transitionScore * 0.2 +
    candidate.obligationCoverage * 0.14 +
    candidate.relationContractScore * 0.12 +
    candidate.score * 0.12,
  );`;

  const intrinsicNew = `  return metric(
    candidate.groundingScore * 0.14 +
    candidate.meaningScore * 0.16 +
    candidate.transitionScore * 0.16 +
    candidate.obligationCoverage * 0.1 +
    candidate.relationContractScore * 0.08 +
    (candidate.creativeExecutionScore ?? 0.5) * 0.18 +
    (candidate.rhetoricalShapeScore ?? 0.5) * 0.08 +
    candidate.score * 0.1,
  );`;

  text = replaceExact(
    text,
    intrinsicOld,
    intrinsicNew,
    "Beam intrinsic creative weighting",
  );

  text = replaceExact(
    text,
    `  const sourceRestatementPenalty =
    isSourceRestatement(candidate) &&
    !isEndpoint(candidate) &&
    advance < 0.35 &&
    transition < 0.72
      ? 0.22
      : 0;`,
    `  const sourceRestatementPenalty =
    isSourceRestatement(candidate) &&
    !isEndpoint(candidate) &&
    advance < 0.35 &&
    transition < 0.72
      ? 0.22
      : (candidate.sourceRestatementScore ?? 0) > 0.72 &&
          !isEndpoint(candidate) &&
          (candidate.rhetoricalShapeScore ?? 0) < 0.28
        ? 0.3
        : 0;`,
    "Beam source-restatement penalty",
  );

  write(file, text);
}

function main() {
  console.log("=== QRE AUTHOR · PRODUCTION CREATIVE MOUTH UPGRADE ===");
  patchContracts();
  patchMouth();
  patchBeam();
  console.log("UPGRADE APPLIED · contracts → Mouth → Beam");
  console.log("Model remains language-only; QRE owns semantic quality and sequence selection.");
}

main();
