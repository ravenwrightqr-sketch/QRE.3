import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const sourceFile = "apps/api/src/services/authorMouthCandidateSearch.ts";
const sourcePath = path.join(root, sourceFile);

function headSource() {
  return execFileSync("git", ["show", `HEAD:${sourceFile}`], { cwd: root, encoding: "utf8" });
}

function findFunctionStart(text, name) {
  const marker = `export async function ${name}(`;
  const index = text.indexOf(marker);
  if (index < 0) throw new Error(`AUTHOR MOUTH UPGRADE · missing function ${name}`);
  return index;
}

function sequenceFunction() {
  return [
    "function buildSequenceMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: \"system\" | \"user\"; content: string }> {",
    "  const beats = [...input.beats].sort((a, b) => a.order - b.order);",
    "  const sequence = beats.map((beat) => ({",
    "    order: beat.order, role: beat.role, attentionFunction: beat.attentionFunction,",
    "    creativeMove: beat.creativeMove, realizationMode: beat.realizationMode,",
    "    realizationStrategies: beat.realizationStrategies ?? [],",
    "    creativeRealization: beat.creativeRealization ?? null,",
    "    change: beat.change, next: beat.next || beat.frontier,",
    "    obligations: beat.obligations ?? [], forbiddenMoves: beat.forbiddenMoves ?? [],",
    "    payoff: isPayoffBeat(beat), endpoint: endpointText(beat),",
    "  }));",
    "",
    "  const system = [",
    "    \"QRE CANONICAL MOUTH · SEQUENCE AUTHOR.\",",
    "    \"Write ONE complete creative sequence, not independent captions.\",",
    "    \"The upstream Author owns reality, meaning, relationships, trajectory, creative realization, and endpoint.\",",
    "    \"Your job is language realization: make the approved meaning felt.\",",
    "    \"SOURCE FACTS ARE RAW MATERIAL, NOT A SCRIPT.\",",
    "    \"Do not narrate the receipt. Do not list events. Do not paraphrase supplied moments.\",",
    "    \"Each non-payoff line must perform a distinct creative move and make the next line more desirable.\",",
    "    \"Later lines must recontextualize earlier material rather than summarize it.\",",
    "    \"Prefer status, implication, contrast, understatement, double meaning, escalation, callback, and recontextualization.\",",
    "    \"Vary syntax and rhythm. Do not repeat source nouns merely because they are available.\",",
    "    \"Do not invent concrete people, places, objects, actions, reactions, sounds, dialogue, chronology, outcomes, or props.\",",
    "    \"For the payoff beat, use the exact supplied endpoint phrase and nothing else.\",",
    "    \"RETURN JSON ONLY. Return one variantsByBeat entry for every beat.\",",
    "    \"Each non-payoff beat should contain 5 genuinely different candidate lines.\",",
    "    '{\"variantsByBeat\":[{\"order\":1,\"variants\":[\"LINE 1\",\"LINE 2\",\"LINE 3\",\"LINE 4\",\"LINE 5\"]}]}'",
    "  ].join(\"\\n\");",
    "",
    "  const user = { task: \"realize_complete_author_sequence\", subject: input.envelope.subject, lens: clean(input.lens), priorTexts: input.priorTexts ?? [], suppliedEvidence: input.envelope.suppliedPhrases, sequence };",
    "  return [{ role: \"system\", content: system }, { role: \"user\", content: JSON.stringify(user) }];",
    "}",
    "",
  ].join("\n");
}

function generationFunction() {
  return [
    "export async function generateMouthCandidatePools(input: MouthCandidateGenerationInput & { risk?: string; feedback?: string }): Promise<{ pools: MouthCandidatePool[]; rawText: string }> {",
    "  const ordered = [...input.beats].sort((a, b) => a.order - b.order);",
    "  const priorTexts = input.priorTexts ?? [];",
    "  const messages = buildSequenceMouthCandidateMessages(input);",
    "  if (input.feedback) {",
    "    const last = messages[messages.length - 1];",
    "    if (last?.role === \"user\") last.content += \"\\n\\nQRE REPAIR FEEDBACK:\\n\" + input.feedback;",
    "  }",
    "  const result = await localModelGenerate(messages, \"json\", {",
    "    numPredict: Math.min(3072, Math.max(2048, ordered.length * 384)),",
    "    temperature: input.risk === \"safe\" ? 0.72 : 0.84,",
    "  });",
    "  const parsed = parseMouthCandidateBatch(result.text);",
    "  const variantsByBeat = new Map((parsed?.variantsByBeat ?? []).map((entry) => [entry.order, entry.variants]));",
    "  const pools: MouthCandidatePool[] = [];",
    "  for (const beat of ordered) {",
    "    if (isPayoffBeat(beat) && endpointText(beat)) {",
    "      const exact = scoreMouthCandidate({ text: endpointText(beat), beat, envelope: input.envelope, priorTexts });",
    "      pools.push({ order: beat.order, candidates: [exact] });",
    "      continue;",
    "    }",
    "    const variants = variantsByBeat.get(beat.order) ?? [];",
    "    const selection = selectBestMouthCandidate({ texts: variants, beat, envelope: input.envelope, priorTexts });",
    "    pools.push({ order: beat.order, candidates: selection.candidates });",
    "  }",
    "  return { pools, rawText: result.text };",
    "}",
  ].join("\n");
}

const canonical = headSource();
const parseMarker = "export function parseMouthCandidateBatch(";
const parseIndex = canonical.indexOf(parseMarker);
if (parseIndex < 0) throw new Error("AUTHOR MOUTH UPGRADE · parser anchor missing");

const generateIndex = findFunctionStart(canonical, "generateMouthCandidatePools");
const base = canonical.slice(0, parseIndex) + sequenceFunction() + canonical.slice(parseIndex, generateIndex);
const output = base + generationFunction() + "\n";

fs.writeFileSync(sourcePath, output, "utf8");
console.log("AUTHOR MOUTH SEQUENCE GENERATION UPGRADE APPLIED");
console.log("SOURCE RESTORED FROM HEAD BEFORE PATCH");
console.log("ONE SEQUENCE MODEL CALL · NO PER-BEAT REPAIR LOOP");
