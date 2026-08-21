import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const read = (name) => fs.readFileSync(file(name), "utf8");
const write = (name, content) => fs.writeFileSync(file(name), content, "utf8");

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

function replaceFunction(text, name, replacement) {
  const signature = `export async function ${name}(`;
  const start = text.indexOf(signature);
  if (start < 0) throw new Error(`AUTHOR MOUTH UPGRADE · missing function: ${name}`);
  const open = text.indexOf("{", start);
  if (open < 0) throw new Error(`AUTHOR MOUTH UPGRADE · missing body: ${name}`);
  const close = findMatchingBrace(text, open);
  if (close < 0) throw new Error(`AUTHOR MOUTH UPGRADE · malformed body: ${name}`);
  return text.slice(0, start) + replacement + text.slice(close + 1);
}

function patchMouth() {
  const name = "apps/api/src/services/authorMouthCandidateSearch.ts";
  let text = read(name);

  if (!text.includes("function buildSequenceMouthCandidateMessages(")) {
    const marker = "export function parseMouthCandidateBatch(";
    const index = text.indexOf(marker);
    if (index < 0) throw new Error("AUTHOR MOUTH UPGRADE · missing parser anchor");

    const sequenceBuilder = `
function buildSequenceMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{ role: "system" | "user"; content: string }> {
  const beats = [...input.beats].sort((a, b) => a.order - b.order);
  const realizationRows = beats.map((beat) => {
    const realization = beat.creativeRealization;
    return {
      order: beat.order,
      role: beat.role,
      attentionFunction: beat.attentionFunction,
      creativeMove: beat.creativeMove,
      strategy: realization?.strategy,
      opportunity: realization?.creativeOpportunity,
      intent: realization?.realizationIntent,
      viewerEffect: realization?.viewerEffect,
      premise: realization?.creativePremise,
      trajectory: realization?.creativeTrajectory ?? [],
      escalation: realization?.escalationMove,
      callbackPotential: realization?.callbackPotential ?? [],
      terminalMeaning: realization?.terminalMeaning,
      eventIds: beat.eventIds ?? [],
      change: beat.change,
      next: beat.next || beat.frontier,
      obligations: beat.obligations ?? [],
      forbiddenMoves: beat.forbiddenMoves ?? [],
      payoff: isPayoffBeat(beat),
      endpoint: endpointText(beat),
    };
  });

  const system = [
    "QRE CANONICAL MOUTH · SEQUENCE AUTHOR.",
    "You are writing ONE complete creative sequence, not five captions.",
    "The upstream Author owns reality, meaning, relationships, trajectory, creative realization, and the terminal endpoint.",
    "Your job is to turn that approved semantic trajectory into memorable viewer-facing language.",
    "",
    "CORE LAW:",
    "SUPPLIED FACTS ARE RAW MATERIAL, NOT A SCRIPT.",
    "Do not narrate the receipt.",
    "Do not list events in order.",
    "Do not paraphrase the supplied moments.",
    "Do not repeat the subject, trait, object, or action just because it is available.",
    "Each line must perform a creative move and make the next line more desirable.",
    "Later lines must recontextualize earlier material rather than summarize it.",
    "A line can be indirect, sharp, funny, dry, stylish, absurd, tender, or surprising when supported by the approved meaning.",
    "Creative language may transform perception, but may not invent concrete reality.",
    "",
    "SEQUENCE RHYTHM:",
    "Use short cinematic beats.",
    "Vary rhetorical shape across the sequence.",
    "Prefer implication over explanation.",
    "Prefer status, contrast, understatement, double meaning, escalation, callback, and recontextualization over factual reporting.",
    "Avoid making every line syntactically similar.",
    "Avoid repeating the same source nouns across adjacent lines unless the meaning changes.",
    "",
    "TRUTH:",
    "Do not invent people, places, concrete actions, reactions, sounds, dialogue, chronology, outcomes, or props.",
    "",
    "PAYOFF:",
    "The supplied terminal endpoint is sovereign.",
    "For the payoff beat, use the exact supplied endpoint phrase and nothing else.",
    "",
    "RETURN JSON ONLY:",
    '{"variantsByBeat":[{"order":1,"variants":["LINE 1","LINE 2","LINE 3","LINE 4","LINE 5"]}]}',
    "Return one variantsByBeat entry for EVERY requested beat.",
  ].join("\n");

  const user = {
    task: "realize_complete_author_sequence",
    subject: input.envelope.subject,
    lens: clean(input.lens),
    priorTexts: input.priorTexts ?? [],
    suppliedEvidence: input.envelope.suppliedPhrases,
    sequence: realizationRows,
  };

  return [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(user) },
  ];
}

`;

    text = text.slice(0, index) + sequenceBuilder + text.slice(index);
  }

  const generateReplacement = `export async function generateMouthCandidatePools(
  input: MouthCandidateGenerationInput & {
    risk?: string;
    feedback?: string;
  },
): Promise<{ pools: MouthCandidatePool[]; rawText: string }> {
  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const basePriorTexts = input.priorTexts ?? [];

  const messages = buildSequenceMouthCandidateMessages(input);
  if (input.feedback) {
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      last.content += `\\n\\nQRE REPAIR FEEDBACK:\\n${input.feedback}`;
    }
  }

  const result = await localModelGenerate(messages, "json", {
    numPredict: Math.max(2048, ordered.length * 512),
    temperature: input.risk === "safe" ? 0.72 : 0.84,
  });

  const parsed = parseMouthCandidateBatch(result.text);
  const variantsByBeat = new Map(
    (parsed?.variantsByBeat ?? []).map((entry) => [entry.order, entry.variants]),
  );

  const pools: MouthCandidatePool[] = [];
  const rawParts = [`SEQUENCE PRIMARY\\n${result.text}`];

  for (const beat of ordered) {
    if (isPayoffBeat(beat) && endpointText(beat)) {
      const exact = scoreMouthCandidate({
        text: endpointText(beat),
        beat,
        envelope: input.envelope,
        priorTexts: basePriorTexts,
      });
      pools.push({ order: beat.order, candidates: [exact] });
      continue;
    }

    let variants = variantsByBeat.get(beat.order) ?? [];

    if (variants.length < 2) {
      const repairMessages = buildMouthCandidateMessages({
        ...input,
        beats: [beat],
        priorTexts: basePriorTexts,
      });

      repairMessages[0]!.content += [
        "",
        "SEQUENCE REPAIR:",
        "The complete sequence already exists upstream.",
        "Write only this missing beat, but make it feel like it belongs to a larger accumulating experience.",
        "Do not restate the supplied event.",
        "Return 5 distinct short realizations.",
      ].join("\\n");

      const repair = await localModelGenerate(repairMessages, "json", {
        numPredict: 1536,
        temperature: 0.78,
      });

      rawParts.push(`BEAT ${beat.order} REPAIR\\n${repair.text}`);
      const repaired = parseMouthCandidateBatch(repair.text);
      variants = unique([
        ...variants,
        ...(repaired?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? []),
      ]).slice(0, MAX_CANDIDATES);
    }

    const selection = selectBestMouthCandidate({
      texts: variants,
      beat,
      envelope: input.envelope,
      priorTexts: basePriorTexts,
    });

    pools.push({ order: beat.order, candidates: selection.candidates });
  }

  return {
    pools,
    rawText: rawParts.join("\\n--- MOUTH GENERATION ---\\n"),
  };
}`;

  text = replaceFunction(text, "generateMouthCandidatePools", generateReplacement);
  write(name, text);
}

patchMouth();
console.log("AUTHOR MOUTH SEQUENCE GENERATION UPGRADE APPLIED");
`;

  write(file, sequenceBuilder);
}

patchMouth();
console.log("AUTHOR MOUTH SEQUENCE GENERATION UPGRADE APPLIED");
