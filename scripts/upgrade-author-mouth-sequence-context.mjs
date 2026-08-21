import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const sourceFile = "apps/api/src/services/authorMouthCandidateSearch.ts";
const sourcePath = path.join(root, sourceFile);

function headSource() {
  return execFileSync("git", ["show", `HEAD:${sourceFile}`], {
    cwd: root,
    encoding: "utf8",
  });
}

function findFunctionStart(text, name) {
  const marker = `export async function ${name}(`;
  const index = text.indexOf(marker);
  if (index < 0) throw new Error(`AUTHOR MOUTH UPGRADE · missing function ${name}`);
  return index;
}

function sequenceFunction() {
  return [
    "function buildCompleteSequenceMouthMessages(input: MouthCandidateGenerationInput): Array<{ role: \"system\" | \"user\"; content: string }> {",
    "  const beats = [...input.beats].sort((a, b) => a.order - b.order);",
    "  const sequence = beats.map((beat, index) => ({",
    "    order: beat.order,",
    "    role: beat.role,",
    "    attentionFunction: beat.attentionFunction,",
    "    creativeMove: beat.creativeMove,",
    "    realizationMode: beat.realizationMode,",
    "    strategies: beat.realizationStrategies ?? [],",
    "    payoff: isPayoffBeat(beat),",
    "    endpoint: endpointText(beat),",
    "    job: isPayoffBeat(beat) ? \"EXACT PAYOFF\" : index === 0 ? \"ESTABLISH THE ATTITUDE\" : index === 1 ? \"CONTRAST / TURN\" : index === 2 ? \"ESCALATE THE ATTITUDE\" : \"IMPLY / RECONTEXTUALIZE\",",
    "    viewerEffect: beat.creativeRealization?.viewerEffect ?? \"make the next line irresistible\",",
    "    trajectory: beat.creativeRealization?.creativeTrajectory?.slice(0, 4) ?? [],",
    "    escalation: beat.creativeRealization?.escalationMove ?? \"increase implication without adding reality\",",
    "  }));",
    "",
    "  const system = [",
    "    \"QRE CANONICAL MOUTH · COMPLETE SEQUENCE WRITER.\",",
    "    \"Write complete alternate sequences, not independent captions.\",",
    "    \"The upstream Author owns truth, meaning, and endpoint. Your job is memorable language.\",",
    "    \"SOURCE FACTS ARE TRUTH CONSTRAINTS, NOT A SCRIPT.\",",
    "    \"Do not narrate the receipt. Do not list events. Do not paraphrase the supplied moments.\",",
    "    \"Each line must make the next line feel necessary or irresistible.\",",
    "    \"The sequence should feel like it discovered something, not like it reported something.\",",
    "    \"Use short beats, varied syntax, subtext, status, contrast, implication, understatement, double meaning, escalation, callback, and recontextualization.\",",
    "    \"Prefer lines that create a question in the reader's head without becoming confusing.\",",
    "    \"Do not explain the joke, attitude, contradiction, relationship, or meaning. Make it land.\",",
    "    \"Figurative framing is allowed: metaphor, simile, personification, status framing, and double meaning do not create literal new reality.\",",
    "    \"Do not invent literal people, locations, physical actions, physical reactions, sounds, dialogue, chronology, outcomes, or props.\",",
    "    \"If a line could be made by copying a source phrase and adding punctuation, reject it internally.\",",
    "    \"RHYTHM TARGET: the reader should want the next line and occasionally think ‘what the fuck is this?’ in a good way.\",",
    "    \"FORM TARGET: 2-7 words per beat when possible; one dominant thought; no summaries.\",",
    "    \"EXPRESSION SHAPES may include: \" +
      "\"Already had terms.\" | \"Fierce anyway.\" | \"Then came the bow.\" | \"Peace was temporary.\" | \"Mirror approved.\"",
    "    \"Those are shape references only. Never copy them as facts.\",",
    "    \"PAYOFF IS SACRED: use the supplied endpoint exactly and nothing else.\",",
    "    \"RETURN JSON ONLY.\",",
    "    \"Return exactly 4 complete sequence alternatives. Each alternative must contain one line for every beat in order.\",",
    "    '{\"candidateSequences\":[{\"lines\":[\"LINE FOR BEAT 1\",\"LINE FOR BEAT 2\",\"LINE FOR BEAT 3\",\"LINE FOR BEAT 4\",\"EXACT PAYOFF\"]}]}'",
    "  ].join(\"\\n\");",
    "",
    "  const user = {",
    "    task: \"write_complete_creative_sequences\",",
    "    subject: input.envelope.subject,",
    "    lens: clean(input.lens),",
    "    truthConstraints: input.envelope.suppliedPhrases,",
    "    priorTexts: input.priorTexts ?? [],",
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
}

function generationFunction() {
  return [
    "export async function generateMouthCandidatePools(input: MouthCandidateGenerationInput & { risk?: string; feedback?: string }): Promise<{ pools: MouthCandidatePool[]; rawText: string }> {",
    "  const ordered = [...input.beats].sort((a, b) => a.order - b.order);",
    "  const priorTexts = input.priorTexts ?? [];",
    "  const messages = buildCompleteSequenceMouthMessages(input);",
    "",
    "  if (input.feedback) {",
    "    const last = messages[messages.length - 1];",
    "    if (last?.role === \"user\") last.content += \"\\n\\nQRE SEQUENCE FEEDBACK:\\n\" + input.feedback;",
    "  }",
    "",
    "  const result = await localModelGenerate(messages, \"json\", {",
    "    numPredict: 3072,",
    "    temperature: input.risk === \"safe\" ? 0.74 : 0.88,",
    "  });",
    "",
    "  const raw = String(result.text ?? \"\").trim();",
    "  let sequences: string[][] = [];",
    "",
    "  try {",
    "    const parsed = JSON.parse(raw) as Record<string, unknown>;",
    "    if (Array.isArray(parsed.candidateSequences)) {",
    "      sequences = parsed.candidateSequences",
    "        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === \"object\")",
    "        .map((entry) => Array.isArray(entry.lines) ? entry.lines.map((line) => normalizeLine(line)).filter(Boolean) : [])",
    "        .filter((lines) => lines.length >= ordered.length)",
    "        .slice(0, 4);",
    "    }",
    "  } catch {",
    "    sequences = [];",
    "  }",
    "",
    "  const pools: MouthCandidatePool[] = ordered.map((beat) => ({ order: beat.order, candidates: [] }));",
    "",
    "  for (let sequenceIndex = 0; sequenceIndex < sequences.length; sequenceIndex += 1) {",
    "    const lines = sequences[sequenceIndex]!;",
    "    for (let index = 0; index < ordered.length; index += 1) {",
    "      const beat = ordered[index]!;",
    "      if (isPayoffBeat(beat) && endpointText(beat)) continue;",
    "      const text = lines[index];",
    "      if (!text) continue;",
    "      const candidate = scoreMouthCandidate({ text, beat, envelope: input.envelope, priorTexts });",
    "      if (candidateIsLegal(candidate, beat)) {",
    "        pools[index]!.candidates.push(candidate);",
    "      }",
    "    }",
    "  }",
    "",
    "  const finalizedPools = pools.map((pool) => ({",
    "    order: pool.order,",
    "    candidates: pool.candidates.sort((a, b) => b.score - a.score).slice(0, MAX_CANDIDATES),",
    "  }));",
    "",
    "  for (let index = 0; index < ordered.length; index += 1) {",
    "    const beat = ordered[index]!;",
    "    if (isPayoffBeat(beat) && endpointText(beat)) {",
    "      const exact = scoreMouthCandidate({ text: endpointText(beat), beat, envelope: input.envelope, priorTexts });",
    "      finalizedPools[index] = { order: beat.order, candidates: [exact] };",
    "    }",
    "  }",
    "",
    "  return { pools: finalizedPools, rawText: raw };",
    "}",
  ].join("\n");
}

const canonical = headSource();
const parseMarker = "export function parseMouthCandidateBatch(";
const parseIndex = canonical.indexOf(parseMarker);
if (parseIndex < 0) throw new Error("AUTHOR MOUTH UPGRADE · parser anchor missing");

const generateIndex = findFunctionStart(canonical, "generateMouthCandidatePools");
const output = canonical.slice(0, parseIndex) + sequenceFunction() + canonical.slice(parseIndex, generateIndex) + generationFunction() + "\n";

fs.writeFileSync(sourcePath, output, "utf8");
console.log("AUTHOR MOUTH COMPLETE-SEQUENCE GENERATION APPLIED");
console.log("SOURCE RESTORED FROM HEAD BEFORE PATCH");
console.log("ONE SEQUENCE MODEL CALL · FOUR COMPLETE ALTERNATIVES · NO REPAIR LOOP");
