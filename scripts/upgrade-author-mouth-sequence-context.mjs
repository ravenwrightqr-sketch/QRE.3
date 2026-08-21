import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const sourceFile = "apps/api/src/services/authorMouthCandidateSearch.ts";
const sourcePath = path.join(root, sourceFile);

function headSource() {
  return execFileSync("git", ["show", `HEAD:${sourceFile}`], { cwd: root, encoding: "utf8" });
}

function findFunctionStart(text, name, exported = true) {
  const marker = `${exported ? "export " : ""}function ${name}(`;
  const asyncMarker = `${exported ? "export " : ""}async function ${name}(`;
  const index = text.indexOf(asyncMarker) >= 0 ? text.indexOf(asyncMarker) : text.indexOf(marker);
  if (index < 0) throw new Error(`AUTHOR MOUTH UPGRADE · missing function ${name}`);
  return index;
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
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
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function replaceFunction(text, name, replacement, exported = true) {
  const start = findFunctionStart(text, name, exported);
  const open = text.indexOf("{", start);
  const close = findMatchingBrace(text, open);
  if (open < 0 || close < 0) throw new Error(`AUTHOR MOUTH UPGRADE · malformed ${name}`);
  return text.slice(0, start) + replacement + text.slice(close + 1);
}

function sequenceFunction() {
  return [
    "function expressionTargetFor(beat: MouthCandidateBeat, index: number): string {",
    "  if (isPayoffBeat(beat)) return \"EXACT ENDPOINT ONLY.\";",
    "  const strategy = clean(beat.creativeRealization?.strategy || beat.realizationStrategies?.[0]).toLowerCase();",
    "  if (index === 0) return strategy === \"status_inversion\" ? \"ESTABLISH STATUS: make the subject feel unexpectedly self-possessed without explaining why.\" : \"ESTABLISH: reveal the most interesting attitude or tension without reporting the event.\";",
    "  if (index === 1) return strategy === \"contrast\" ? \"CONTRAST: make two supplied truths collide in as few words as possible.\" : \"SHIFT: change the reading created by the previous line.\";",
    "  if (index === 2) return strategy === \"double_meaning\" ? \"ESCALATE: let one supplied detail carry a second meaning.\" : \"ESCALATE: turn a supplied detail into evidence of the emerging attitude.\";",
    "  if (strategy === \"understatement\") return \"UNDERSTATE: say less than the facts while making the attitude unmistakable.\";",
    "  if (strategy === \"recontextualization\" || strategy === \"callback\") return \"RECONTEXTUALIZE: make an earlier signal mean something new.\";",
    "  return \"IMPLY: make the audience infer the interesting part; do not explain it.\";",
    "}",
    "",
    "function buildSequenceMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: \"system\" | \"user\"; content: string }> {",
    "  const beats = [...input.beats].sort((a, b) => a.order - b.order);",
    "  const sequence = beats.map((beat, index) => ({",
    "    order: beat.order,",
    "    role: beat.role,",
    "    expressionTarget: expressionTargetFor(beat, index),",
    "    strategy: beat.creativeRealization?.strategy || beat.realizationStrategies?.[0] || \"implication\",",
    "    desiredEffect: beat.creativeRealization?.viewerEffect || \"curiosity / attitude / surprise\",",
    "    truthAnchors: (beat.eventIds ?? []).map((id) => id),",
    "    payoff: isPayoffBeat(beat),",
    "    endpoint: endpointText(beat),",
    "  }));",
    "",
    "  const system = [",
    "    \"QRE CANONICAL MOUTH · LANGUAGE REALIZATION.\",",
    "    \"Write the whole sequence as short, addictive viewer-facing beats.\",",
    "    \"Do not write analysis. Do not write explanations. Do not narrate the receipt.\",",
    "    \"SOURCE FACTS ARE TRUTH CONSTRAINTS ONLY. They tell you what may be true, not what sentence to write.\",",
    "    \"The upstream Author already decided what matters. Your job is to make that meaning FELT.\",",
    "    \"\",",
    "    \"TARGET FEEL: the reader should finish each line wanting the next line. The sequence should create curiosity, surprise, attitude, escalation, and a changed reading.\",",
    "    \"\",",
    "    \"FORM LAW:\",",
    "    \"Prefer 2-7 words. One dominant thought. One move. Strong verbs or loaded fragments are better than explanatory sentences.\",",
    "    \"Use fragments, contrasts, implication, status, understatement, double meaning, escalation, and callbacks.\",",
    "    \"Do not default to subject + trait + explanation.\",",
    "    \"Do not use phrases such as ‘X was a contrast’, ‘X demonstrated’, ‘this shows’, ‘which meant’, ‘was a precursor’, ‘was a juxtaposition’, or ‘in other words’.\",",
    "    \"Never explain the creative move. Perform it.\",",
    "    \"\",",
    "    \"FIGURATIVE FRAMING IS LEGAL WHEN IT DOES NOT ASSERT NEW REALITY:\",",
    "    \"Metaphor, simile, personification, status framing, irony, and double meaning are allowed.\",",
    "    \"Example shape: ‘Walked in like a lawyer already notified.’ This is framing, not a claim that a lawyer exists in the scene.\",",
    "    \"Example shape: ‘Mirror approved.’ This is personification, not a literal event.\",",
    "    \"\",",
    "    \"SEQUENCE PROGRESSION:\",",
    "    \"ESTABLISH → CONTRAST/SHIFT → ESCALATE → IMPLY/RECONTEXTUALIZE → PAYOFF.\",",
    "    \"Every line must change the pressure, attitude, meaning, or expectation. A line that merely repeats a supplied fact is weak even when true.\",",
    "    \"\",",
    "    \"RETURN JSON ONLY. One variantsByBeat entry for EVERY beat. Five short candidates for every non-payoff beat.\",",
    "    '{\"variantsByBeat\":[{\"order\":1,\"variants\":[\"LINE 1\",\"LINE 2\",\"LINE 3\",\"LINE 4\",\"LINE 5\"]}]}'",
    "  ].join(\"\\n\");",
    "",
    "  const user = {",
    "    task: \"realize_complete_author_sequence\",",
    "    subject: input.envelope.subject,",
    "    priorTexts: input.priorTexts ?? [],",
    "    truthConstraints: input.envelope.suppliedPhrases,",
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
    "  const messages = buildSequenceMouthCandidateMessages(input);",
    "  if (input.feedback) {",
    "    const last = messages[messages.length - 1];",
    "    if (last?.role === \"user\") last.content += \"\\n\\nQRE SEQUENCE FEEDBACK:\\n\" + input.feedback;",
    "  }",
    "  const result = await localModelGenerate(messages, \"json\", {",
    "    numPredict: Math.min(3072, Math.max(2048, ordered.length * 384)),",
    "    temperature: input.risk === \"safe\" ? 0.76 : 0.9,",
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

function figurativeRiskFunction() {
  return [
    "function forbiddenRisk(",
    "  text: string,",
    "  beat: MouthCandidateBeat,",
    "  envelope: RealityEnvelope,",
    "): number {",
    "  const lower = clean(text).toLowerCase();",
    "  const source = suppliedTerms(envelope);",
    "  const forbidden = unique(beat.forbiddenMoves ?? []).map((value) => value.toLowerCase());",
    "  let risk = 0;",
    "  if (META.test(lower)) risk = 1;",
    "  if (OPERATION_LANGUAGE.test(lower)) risk = 1;",
    "  if (GENERIC.test(lower)) risk = Math.max(risk, 0.8);",
    "  if (QUESTION.test(lower)) risk = Math.max(risk, 0.7);",
    "",
    "  const figurative = /\\b(?:like|as if|apparently|apparently|seemed|peace|terms|approved|not exactly|apparently)\\b/i.test(lower);",
    "  const personified = /^(?:[^.!?]+)\\b(?:approved|agreed|judged|negotiated|voted|complained|objected|had terms|was not having it)\\b/i.test(lower);",
    "",
    "  const concreteRules: Array<[string, RegExp]> = [",
    "    [\"new person\", /\\b(?:someone|man|woman|stranger|person|lawyer|judge|handler|owner|employee|customer|friend|enemy|guest)\\b/i],",
    "    [\"new object\", /\\b(?:table|door|window|chair|phone|bag|leash|scissors)\\b/i],",
    "    [\"new location\", /\\b(?:street|park|room|kitchen|salon|store|office|outside|inside)\\b/i],",
    "    [\"new action\", /\\b(?:walked|ran|jumped|grabbed|threw|opened|closed|smiled|laughed|cried|snatched|stalked|entered)\\b/i],",
    "    [\"new body reaction\", /\\b(?:trembled|blinked|sighed|stared|shrugged|winked|flinched|eyes|tail)\\b/i],",
    "    [\"new sound\", /\\b(?:roar|growl|bark|scream|whistle|buzz|bang)\\b/i],",
    "    [\"new outcome\", /\\b(?:won|lost|escaped|returned|disappeared|arrived|died|survived)\\b/i],",
    "    [\"new chronology\", /\\b(?:later|earlier|tomorrow|yesterday|the next day|years later)\\b/i],",
    "  ];",
    "",
    "  for (const [name, pattern] of concreteRules) {",
    "    if (!pattern.test(lower)) continue;",
    "    if ((name === \"new person\" || name === \"new object\") && (figurative || personified)) continue;",
    "    if (name === \"new outcome\" || name === \"new chronology\") { risk = Math.max(risk, 1); continue; }",
    "    const match = lower.match(pattern)?.[0] ?? \"\";",
    "    const unsupported = tokens(match).map(stem).some((word) => !source.has(word));",
    "    if (unsupported) risk = Math.max(risk, 1);",
    "  }",
    "",
    "  if (forbidden.includes(\"planner vocabulary\") && META.test(lower)) risk = 1;",
    "  if (forbidden.includes(\"analytic explanation\")) {",
    "    const analytic = /\\b(?:this means|this reveals|this shows|the point is|the reason is|the meaning is|which means|in other words|therefore|was a contrast|was a precursor|was a juxtaposition|was significant)\\b/i;",
    "    if (analytic.test(lower)) risk = 1;",
    "  }",
    "  return metric(risk);",
    "}",
  ].join("\n");
}

const canonical = headSource();
const parseMarker = "export function parseMouthCandidateBatch(";
const parseIndex = canonical.indexOf(parseMarker);
if (parseIndex < 0) throw new Error("AUTHOR MOUTH UPGRADE · parser anchor missing");

const forbiddenStart = findFunctionStart(canonical, "forbiddenRisk", false);
const forbiddenOpen = canonical.indexOf("{", forbiddenStart);
const forbiddenClose = findMatchingBrace(canonical, forbiddenOpen);
if (forbiddenOpen < 0 || forbiddenClose < 0) throw new Error("AUTHOR MOUTH UPGRADE · forbiddenRisk malformed");

let base = canonical.slice(0, forbiddenStart) + figurativeRiskFunction() + canonical.slice(forbiddenClose + 1);

const generateIndex = findFunctionStart(base, "generateMouthCandidatePools");
const newParseIndex = base.indexOf(parseMarker);
base = base.slice(0, newParseIndex) + sequenceFunction() + base.slice(newParseIndex, generateIndex);
const output = base + generationFunction() + "\n";

fs.writeFileSync(sourcePath, output, "utf8");
console.log("AUTHOR MOUTH CREATIVE EXPRESSION UPGRADE APPLIED");
console.log("SOURCE RESTORED FROM HEAD BEFORE PATCH");
console.log("ONE SEQUENCE MODEL CALL · NO PER-BEAT REPAIR LOOP");
console.log("ANALYST PROSE STRIPPED FROM MODEL WRITING CONTEXT");
console.log("FIGURATIVE FRAMING LEGALIZED AT TRUTH BOUNDARY");
console.log("CREATIVE GRAMMAR: ESTABLISH → CONTRAST → ESCALATE → IMPLY/RECONTEXTUALIZE → PAYOFF");
