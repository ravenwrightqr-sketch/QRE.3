import fs from "node:fs";
import path from "node:path";

const target = path.join(
  process.cwd(),
  "apps/api/src/services/authorMouthCandidateSearch.ts",
);

function read() {
  return fs.readFileSync(target, "utf8");
}

function write(text) {
  fs.writeFileSync(target, text, "utf8");
}

function findMatchingBrace(text, openIndex) {
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
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
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

function replaceExportedAsyncFunction(text, name, replacement) {
  const signature = "export async function " + name + "(";
  const start = text.indexOf(signature);
  if (start < 0) throw new Error("Missing function: " + name);

  const open = text.indexOf("{", start);
  if (open < 0) throw new Error("Missing function body: " + name);

  const close = findMatchingBrace(text, open);
  if (close < 0) throw new Error("Malformed function body: " + name);

  return text.slice(0, start) + replacement + text.slice(close + 1);
}

function addSequenceBuilder(text) {
  if (text.includes("function buildSequenceMouthCandidateMessages(")) return text;

  const marker = "export function parseMouthCandidateBatch(";
  const index = text.indexOf(marker);
  if (index < 0) throw new Error("Missing parseMouthCandidateBatch anchor");

  const helper = [
    "function buildSequenceMouthCandidateMessages(",
    "  input: MouthCandidateGenerationInput,",
    "): Array<{ role: \"system\" | \"user\"; content: string }> {",
    "  const beats = [...input.beats].sort((a, b) => a.order - b.order);",
    "  const sequence = beats.map((beat) => {",
    "    const realization = beat.creativeRealization;",
    "    return {",
    "      order: beat.order,",
    "      role: beat.role,",
    "      attentionFunction: beat.attentionFunction,",
    "      creativeMove: beat.creativeMove,",
    "      realizationMode: beat.realizationMode,",
    "      strategy: realization?.strategy,",
    "      creativeOpportunity: realization?.creativeOpportunity,",
    "      realizationIntent: realization?.realizationIntent,",
    "      viewerEffect: realization?.viewerEffect,",
    "      creativePremise: realization?.creativePremise,",
    "      creativeTrajectory: realization?.creativeTrajectory ?? [],",
    "      escalationMove: realization?.escalationMove,",
    "      callbackPotential: realization?.callbackPotential ?? [],",
    "      terminalMeaning: realization?.terminalMeaning,",
    "      change: beat.change,",
    "      next: beat.next || beat.frontier,",
    "      obligations: beat.obligations ?? [],",
    "      forbiddenMoves: beat.forbiddenMoves ?? [],",
    "      eventIds: beat.eventIds ?? [],",
    "      payoff: isPayoffBeat(beat),",
    "      endpoint: endpointText(beat),",
    "    };",
    "  });",
    "",
    "  const system = [",
    "    \"QRE CANONICAL MOUTH · SEQUENCE AUTHOR.\",",
    "    \"Write ONE complete creative sequence. Do not write independent captions.\",",
    "    \"The upstream Author owns reality, meaning, semantic trajectory, creative realization, and the terminal endpoint.\",",
    "    \"Your job is to turn that approved meaning into memorable viewer-facing language.\",",
    "    \"\",",
    "    \"CORE LAW:\",",
    "    \"SUPPLIED FACTS ARE RAW MATERIAL, NOT A SCRIPT.\",",
    "    \"Do not narrate the receipt.\",",
    "    \"Do not list the events in order.\",",
    "    \"Do not paraphrase supplied moments.\",",
    "    \"Do not make every line repeat the subject, trait, object, or action.\",",
    "    \"Each beat must perform a distinct creative move.\",",
    "    \"Each line must change the viewer's reading, pressure, attitude, implication, or expectation.\",",
    "    \"Later beats should recontextualize earlier material rather than summarize it.\",",
    "    \"\",",
    "    \"CREATIVE RHYTHM:\",",
    "    \"Explore status, contrast, implication, understatement, double meaning, escalation, callback, and recontextualization.\",",
    "    \"Vary rhetorical shape across beats.\",",
    "    \"Prefer short, sharp, quotable language.\",",
    "    \"Use source facts as hidden material for the creative move.\",",
    "    \"\",",
    "    \"TRUTH:\",",
    "    \"Do not invent people, objects, places, concrete actions, body reactions, sounds, dialogue, chronology, or outcomes.\",",
    "    \"Creative framing is allowed. New concrete reality is not.\",",
    "    \"\",",
    "    \"PAYOFF:\",",
    "    \"The supplied terminal endpoint is sacred.\",",
    "    \"For the payoff beat, return the exact supplied endpoint phrase and nothing else.\",",
    "    \"\",",
    "    \"OUTPUT:\",",
    "    \"Return JSON only.\",",
    "    \"Return one variantsByBeat entry for every requested beat.\",",
    "    \"Provide 5 materially different realizations per non-payoff beat.\",",
    "    '{\"variantsByBeat\":[{\"order\":1,\"variants\":[\"LINE 1\",\"LINE 2\",\"LINE 3\",\"LINE 4\",\"LINE 5\"]}]}',",
    "  ].join(\"\\n\");",
    "",
    "  const user = {",
    "    task: \"realize_complete_author_sequence\",",
    "    subject: input.envelope.subject,",
    "    lens: clean(input.lens),",
    "    priorTexts: input.priorTexts ?? [],",
    "    suppliedEvidence: input.envelope.suppliedPhrases,",
    "    sequence,",
    "  };",
    "",
    "  return [",
    "    { role: \"system\", content: system },",
    "    { role: \"user\", content: JSON.stringify(user) },",
    "  ];",
    "}",
    "",
  ].join("\n");

  return text.slice(0, index) + helper + text.slice(index);
}

function replaceGenerator(text) {
  const replacement = [
    "export async function generateMouthCandidatePools(",
    "  input: MouthCandidateGenerationInput & {",
    "    risk?: string;",
    "    feedback?: string;",
    "  },",
    "): Promise<{ pools: MouthCandidatePool[]; rawText: string }> {",
    "  const ordered = [...input.beats].sort((a, b) => a.order - b.order);",
    "  const basePriorTexts = input.priorTexts ?? [];",
    "  const messages = buildSequenceMouthCandidateMessages(input);",
    "",
    "  if (input.feedback) {",
    "    const last = messages[messages.length - 1];",
    "    if (last?.role === \"user\") {",
    "      last.content += \"\\n\\nQRE REPAIR FEEDBACK:\\n\" + input.feedback;",
    "    }",
    "  }",
    "",
    "  const result = await localModelGenerate(messages, \"json\", {",
    "    numPredict: Math.max(3072, ordered.length * 640),",
    "    temperature: input.risk === \"safe\" ? 0.72 : 0.84,",
    "  });",
    "",
    "  const parsed = parseMouthCandidateBatch(result.text);",
    "  const variantsByBeat = new Map((parsed?.variantsByBeat ?? []).map((entry) => [entry.order, entry.variants]));",
    "  const pools: MouthCandidatePool[] = [];",
    "  const rawParts = [\"SEQUENCE PRIMARY\\n\" + result.text];",
    "",
    "  for (const beat of ordered) {",
    "    if (isPayoffBeat(beat) && endpointText(beat)) {",
    "      const exact = scoreMouthCandidate({",
    "        text: endpointText(beat),",
    "        beat,",
    "        envelope: input.envelope,",
    "        priorTexts: basePriorTexts,",
    "      });",
    "      pools.push({ order: beat.order, candidates: [exact] });",
    "      continue;",
    "    }",
    "",
    "    let variants = variantsByBeat.get(beat.order) ?? [];",
    "",
    "    if (variants.length < 2) {",
    "      const repairMessages = buildMouthCandidateMessages({",
    "        ...input,",
    "        beats: [beat],",
    "        priorTexts: basePriorTexts,",
    "      });",
    "",
    "      repairMessages[0].content += [",
    "        \"\",",
    "        \"SEQUENCE REPAIR:\",",
    "        \"The complete creative sequence already exists upstream.\",",
    "        \"Write only this missing beat, but make it belong to the accumulating experience.\",",
    "        \"Do not restate the supplied event.\",",
    "        \"Return 5 distinct short realizations.\",",
    "      ].join(\"\\n\");",
    "",
    "      const repair = await localModelGenerate(repairMessages, \"json\", {",
    "        numPredict: 1536,",
    "        temperature: 0.78,",
    "      });",
    "",
    "      rawParts.push(\"BEAT \" + beat.order + \" REPAIR\\n\" + repair.text);",
    "      const repaired = parseMouthCandidateBatch(repair.text);",
    "      variants = unique([",
    "        ...variants,",
    "        ...(repaired?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? []),",
    "      ]).slice(0, MAX_CANDIDATES);",
    "    }",
    "",
    "    const selection = selectBestMouthCandidate({",
    "      texts: variants,",
    "      beat,",
    "      envelope: input.envelope,",
    "      priorTexts: basePriorTexts,",
    "    });",
    "",
    "    pools.push({ order: beat.order, candidates: selection.candidates });",
    "  }",
    "",
    "  return {",
    "    pools,",
    "    rawText: rawParts.join(\"\\n--- MOUTH GENERATION ---\\n\"),",
    "  };",
    "}",
  ].join("\n");

  return replaceExportedAsyncFunction(
    text,
    "generateMouthCandidatePools",
    replacement,
  );
}

let source = read();
source = addSequenceBuilder(source);
source = replaceGenerator(source);
write(source);

console.log("AUTHOR MOUTH SEQUENCE GENERATION UPGRADE APPLIED");
