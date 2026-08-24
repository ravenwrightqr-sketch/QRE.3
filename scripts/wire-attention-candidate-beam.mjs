import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
let source = fs.readFileSync(file, "utf8");

function replaceOnce(from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  source = source.replace(from, to);
}

const brokenTokens = `  const sourceTokens = new Set(\n    packet.reality\n      .flatMap(tokens)\n      .values(),\n  );`;
const fixedTokens = `  const sourceTokens = new Set<string>();\n  for (const fact of packet.reality) {\n    for (const token of tokens(fact)) sourceTokens.add(token);\n  }`;
if (source.includes(brokenTokens)) {
  source = source.replace(brokenTokens, fixedTokens);
} else if (!source.includes(fixedTokens)) {
  throw new Error("sourceTokens block not found in either broken or fixed form");
}

// Teach the Mouth to generate materially different realizations in ONE model call.
const returnNeedle = `    \`Return JSON only: {\\"lines\\":[\\"...\\"]}. Exactly ${packet.lineCount} lines.\`,`;
const returnReplacement = `    \`Return JSON only: {\\"candidates\\":[{\\"lines\\":[\\"...\\"]},{\\"lines\\":[\\"...\\"]},{\\"lines\\":[\\"...\\"]}]}. Exactly ${packet.lineCount} lines per candidate.\`,`;
replaceOnce(returnNeedle, returnReplacement, "candidate return format");

const promptNeedle = `    "ATTENTION IS THE TARGET. Do not write poetry. Do not make reality prettier. Make reality harder to stop watching.",`;
const promptAdd = [
`    "ATTENTION ARC: aim for status or a hook, an interruption, a turn, a consequence, and a continuation-worthy payoff. The language can be dry, funny, blunt, social, absurd, or clever; it should not be lyrical.",`,
`    "Generate THREE materially different candidate sequences in this one response. Each candidate uses the same supplied reality but a different creative realization. Do not merely swap adjectives.",`,
`    "Candidate A searches status-first. Candidate B searches contrast or reversal. Candidate C searches callback or continuation. These are search directions, not required words.",`,
`    "Use the Coco benchmark behavior as a structural target only: status -> interruption -> turn -> consequence -> future promise. Never copy Coco's wording and never invent unsupported facts.",`,
].join("\n") + "\n";
replaceOnce(promptNeedle, promptAdd + promptNeedle, "attention prompt");

// Parse multiple candidate sequences from the same model call; keep single-sequence compatibility.
const parseStart = source.indexOf("function parseSingle(raw: string): string[] {");
const parseEnd = source.indexOf("\nfunction worldViolation", parseStart);
if (parseStart < 0 || parseEnd < 0) throw new Error("parse function boundaries not found");
const parseReplacement = `function parseCandidates(raw: string): string[][] {\n  const text = clean(raw).replace(/^\\`\\`\\`(?:json)?/i, "").replace(/\\`\\`\\`$/i, "").trim();\n  if (!text) return [];\n  const parse = (value: string): string[][] => {\n    const parsed = JSON.parse(value) as unknown;\n    if (!parsed || typeof parsed !== "object") return [];\n    const record = parsed as Record<string, unknown>;\n    if (Array.isArray(record.candidates)) {\n      return record.candidates\n        .filter((candidate): candidate is Record<string, unknown> => Boolean(candidate) && typeof candidate === "object")\n        .map((candidate) => Array.isArray(candidate.lines) ? candidate.lines.map((line) => clean(line)).filter(Boolean) : [])\n        .filter((lines) => lines.length > 0);\n    }\n    if (Array.isArray(record.lines)) return [record.lines.map((line) => clean(line)).filter(Boolean)];\n    return [];\n  };\n  try { return parse(text); } catch {\n    const match = text.match(/\\{[\\s\\S]*\\}/);\n    if (!match) return [];\n    try { return parse(match[0]); } catch { return []; }\n  }\n}\n`;
source = source.slice(0, parseStart) + parseReplacement + source.slice(parseEnd + 1);

// Replace the one-sequence model selection with one-call candidate competition.
const selectionStart = source.indexOf("  const modelResult = await localModelGenerate");
const selectionEnd = source.indexOf("\n  const scenes: AuthorScene[]", selectionStart);
if (selectionStart < 0 || selectionEnd < 0) throw new Error("model selection boundaries not found");
const selectionReplacement = `  const modelResult = await localModelGenerate(modelMessage(packet), "json", { numPredict: Math.min(1800, Math.max(700, lineTotal * 120)), temperature: sensitive ? 0.36 : 0.82 });\n  const modelCandidates = parseCandidates(modelResult.text).slice(0, 3);\n  const evaluations = modelCandidates\n    .filter((lines) => lines.length === lineTotal)\n    .map((lines) => {\n      const validation = validate(lines, path, packet);\n      const attention = attentionSignals(lines, packet);\n      return { lines, validation, attention };\n    });\n  const accepted = evaluations.filter((candidate) => candidate.validation.ok);\n  const ranked = [...accepted].sort((a, b) =>\n    (b.validation.score + b.attention.score * 0.5) -\n    (a.validation.score + a.attention.score * 0.5),\n  );\n  const winner = ranked[0] ?? [...evaluations].sort((a, b) =>\n    (b.attention.score + b.validation.score * 0.5) -\n    (a.attention.score + a.validation.score * 0.5),\n  )[0];\n  const modelLines = winner?.lines ?? [];\n  const modelValidation = winner?.validation ?? { ok: false, reasons: ["no_complete_model_candidate"], score: 0, metrics: [], provenance: [] };\n\n  const attentionRequired = attentionRequested(packet);\n  let finalLines = modelValidation.ok ? modelLines : [];\n  let finalValidation = modelValidation;\n  const recoveryUsed = !modelValidation.ok;\n  if (!finalValidation.ok && !attentionRequired) {\n    finalLines = groundedRecovery(packet);\n    finalValidation = validate(finalLines, path, packet);\n  }\n  if (!finalValidation.ok && attentionRequired) {\n    finalLines = [];\n  }\n`;
source = source.slice(0, selectionStart) + selectionReplacement + source.slice(selectionEnd + 1);

replaceOnce(`      candidateSequences: 1,`, `      candidateSequences: modelCandidates.length,`, "candidateSequences");
replaceOnce(`      acceptedCandidates: finalValidation.ok ? 1 : 0,`, `      acceptedCandidates: accepted.length,`, "acceptedCandidates");
replaceOnce(`      rejectedCandidates: modelValidation.ok ? [] : [{ pathId: "selected", reasons: modelValidation.reasons, score: modelValidation.score, metrics: modelValidation.metrics }],`, `      rejectedCandidates: evaluations.filter((candidate) => !candidate.validation.ok).map((candidate, index) => ({ pathId: \`candidate-${index + 1}\`, reasons: candidate.validation.reasons, score: candidate.validation.score, metrics: candidate.validation.metrics })),`, "rejectedCandidates");

fs.writeFileSync(file, source, "utf8");
console.log("QRE ATTENTION CANDIDATE BEAM: APPLIED");
console.log(file);
