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

function findMatchingBrace(text, openIndex) {
  if (text[openIndex] !== "{") return -1;

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function findFunctionBlock(text, functionName) {
  const signature = `function ${functionName}(`;
  const start = text.indexOf(signature);
  if (start < 0) return null;

  const open = text.indexOf("{", start);
  if (open < 0) return null;

  const close = findMatchingBrace(text, open);
  if (close < 0) return null;

  return {
    start,
    open,
    close,
    block: text.slice(start, close + 1),
  };
}

function findReturnObject(block) {
  const returnMatch = /\breturn\s*\{/m.exec(block);
  if (!returnMatch) return null;

  const returnStart = returnMatch.index;
  const open = block.indexOf("{", returnStart);
  const close = findMatchingBrace(block, open);
  if (open < 0 || close < 0) return null;

  return {
    returnStart,
    open,
    close,
  };
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

  const fn = findFunctionBlock(text, "candidateBeatFromSlot");
  if (!fn) {
    throw new Error("master candidateBeatFromSlot function not found");
  }

  const block = fn.block;
  if (block.includes("creativeRealization: realization")) {
    return text;
  }

  const object = findReturnObject(block);
  if (!object) {
    throw new Error("master candidate beat return object not found structurally");
  }

  const objectBody = block.slice(object.open + 1, object.close);
  const replacement = [
    `function candidateBeatFromSlot${block.slice(block.indexOf("(", "function candidateBeatFromSlot"), object.returnStart)}`,
    "const baseBeat: MouthCandidateBeat = {",
    objectBody,
    "  };",
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
    "}",
  ].join("\n");

  return text.slice(0, fn.start) + replacement + text.slice(fn.close + 1);
}

function patchMouth(text) {
  const directiveMarker = "  const creativeDirective = buildMouthCreativeLockDirective(creativeLock);";
  if (!text.includes(directiveMarker)) {
    throw new Error("mouth creative directive anchor not found");
  }

  if (!text.includes("  const creativeRealization = beat.creativeRealization;")) {
    text = text.replace(
      directiveMarker,
      directiveMarker + "\n  const creativeRealization = beat.creativeRealization;",
    );
  }

  const sourceRule = '    "Your only job is language realization.",';
  const rawMaterialRule = '    "SUPPLIED FACTS ARE RAW MATERIAL, NOT AUTOMATIC VIEWER LANGUAGE.",';
  if (text.includes(sourceRule) && !text.includes(rawMaterialRule)) {
    text = text.replace(
      sourceRule,
      [
        sourceRule,
        rawMaterialRule,
        '    "Do not simply restate a supplied fact when you can reveal what is interesting about it.",',
        '    "Never use a literal source sentence as a candidate unless it is an exact terminal endpoint.",',
        '    "Never use fact-collage captions such as subject + trait + action when a stronger creative realization is available.",',
      ].join("\n"),
    );
  }

  if (!text.includes('`CREATIVE REALIZATION: ${creativeRealization?.creativeOpportunity')) {
    const directiveLine = "    ...creativeDirective,";
    if (!text.includes(directiveLine)) {
      throw new Error("mouth creative directive spread anchor not found");
    }
    text = text.replace(
      directiveLine,
      [
        directiveLine,
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

  if (text.includes('"subject + trait + action when a stronger creative realization is available"')) {
    text = text.replace(
      '    "Never use a comma-chain or a subject/trait/action scaffold.",\n',
      '    "Never use a comma-chain or a subject/trait/action scaffold when a stronger realization exists.",\n',
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
  console.log("Master Author owns: character meaning → strategies → creative realization.");
  console.log("Strategy lattice remains strategy-only.");
  console.log("Mouth receives the approved realization and remains language-only.");
}

apply();
