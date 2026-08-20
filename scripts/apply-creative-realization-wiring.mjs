import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(name) {
  return path.join(root, name);
}

function read(name) {
  return fs.readFileSync(file(name), "utf8");
}

function write(name, content) {
  fs.writeFileSync(file(name), content, "utf8");
}

function ensureImport(text, importLine, marker) {
  if (text.includes(importLine)) return text;
  if (!text.includes(marker)) {
    throw new Error(`import anchor not found: ${marker}`);
  }
  return text.replace(marker, marker + "\n" + importLine);
}

function patchMaster(text) {
  text = ensureImport(
    text,
    'import { buildCharacterProfile } from "./authorCharacterLensEngine.js";',
    'import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";',
  );
  text = ensureImport(
    text,
    'import { selectSafeStrategies } from "./authorRealizationStrategyLattice.js";',
    'import { buildCharacterProfile } from "./authorCharacterLensEngine.js";',
  );
  text = ensureImport(
    text,
    'import { buildCreativeRealization } from "./authorCreativeRealizationEngine.js";',
    'import { selectSafeStrategies } from "./authorRealizationStrategyLattice.js";',
  );

  const start = text.indexOf("function candidateBeatFromSlot(");
  const end = text.indexOf("\nfunction ensureEndpointCandidate(", start);
  if (start < 0 || end < 0) {
    throw new Error("master candidateBeatFromSlot block not found");
  }

  let block = text.slice(start, end);

  if (!block.includes("const baseBeat: MouthCandidateBeat = {")) {
    const returnAnchor = "\nreturn {\n  order: slot.order,";
    if (!block.includes(returnAnchor)) {
      throw new Error("master candidate beat return anchor not found");
    }

    block = block.replace(
      returnAnchor,
      "\nconst baseBeat: MouthCandidateBeat = {\n  order: slot.order,",
    );

    const close = block.lastIndexOf("\n};");
    if (close < 0) throw new Error("master candidate beat object close not found");

    const tail = [
      "",
      "  const character = buildCharacterProfile(envelope);",
      "  const strategyCandidates = selectSafeStrategies(baseBeat, envelope, 5);",
      "  const realization = buildCreativeRealization(",
      "    baseBeat,",
      "    envelope,",
      "    character,",
      "    strategyCandidates,",
      "  );",
      "",
      "  return {",
      "    ...baseBeat,",
      "    realizationStrategies: strategyCandidates.map(",
      "      (candidate) => candidate.strategy,",
      "    ),",
      "    creativeRealization: realization,",
      "  };",
    ].join("\n");

    block = block.slice(0, close) + "\n" + tail + block.slice(close + 3);
  }

  text = text.slice(0, start) + block + text.slice(end);
  return text;
}

function patchMouth(text) {
  const marker = "  const creativeDirective = buildMouthCreativeLockDirective(creativeLock);";
  if (!text.includes(marker)) {
    throw new Error("mouth creative directive anchor not found");
  }

  if (!text.includes("  const creativeRealization = beat.creativeRealization;")) {
    text = text.replace(
      marker,
      marker + "\n  const creativeRealization = beat.creativeRealization;",
    );
  }

  const systemMarker = '    "Do not simply restate a supplied fact when you can reveal what is interesting about it.",';
  if (!text.includes(systemMarker)) {
    throw new Error("mouth system creative anchor not found");
  }

  if (!text.includes('"CREATIVE REALIZATION:"')) {
    text = text.replace(
      systemMarker,
      [
        systemMarker,
        '    `CREATIVE REALIZATION: ${creativeRealization?.creativeOpportunity || "Find the most interesting safe interpretation of the approved semantic job."}`,',
        '    `REALIZATION INTENT: ${creativeRealization?.realizationIntent || "Express the approved meaning without literal fact restatement."}`,',
        '    `VIEWER EFFECT: ${creativeRealization?.viewerEffect || "Create curiosity, attitude, surprise, or satisfying payoff."}`,',
      ].join("\n"),
    );
  }

  const userMarker = "      realizationStrategies: strategies,";
  if (!text.includes(userMarker)) {
    throw new Error("mouth user realization strategies anchor not found");
  }

  if (!text.includes("      creativeRealization: creativeRealization ?? null,")) {
    text = text.replace(
      userMarker,
      userMarker + "\n      creativeRealization: creativeRealization ?? null,",
    );
  }

  return text;
}

function apply() {
  const masterName = "apps/api/src/services/authorBrainUniversal.ts";
  const mouthName = "apps/api/src/services/authorMouthCandidateSearch.ts";

  const master = patchMaster(read(masterName));
  const mouth = patchMouth(read(mouthName));

  write(masterName, master);
  write(mouthName, mouth);

  console.log("CREATIVE REALIZATION WIRING APPLIED");
  console.log("Master Author now computes character meaning → strategies → creative realization.");
  console.log("Mouth now receives the creative realization and remains language-only.");
}

apply();
