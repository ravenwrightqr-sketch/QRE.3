import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
let source = fs.readFileSync(file, "utf8");

function replaceOnce(from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(label + ": expected exactly one match, found " + count);
  source = source.replace(from, to);
}

// Fix the token-set construction if attention work left the old Set<Set<string>> form.
const brokenTokens = [
  "  const sourceTokens = new Set(",
  "    packet.reality",
  "      .flatMap(tokens)",
  "      .values(),",
  "  );",
].join("\n");
const fixedTokens = [
  "  const sourceTokens = new Set<string>();",
  "  for (const fact of packet.reality) {",
  "    for (const token of tokens(fact)) sourceTokens.add(token);",
  "  }",
].join("\n");
if (source.includes(brokenTokens)) source = source.replace(brokenTokens, fixedTokens);

// Keep the model call singular, but make one call search three realizations.
const returnNeedle = [
  "    `Return JSON only: {\\\"lines\\\":[\\\"...\\\"]}. Exactly ${packet.lineCount} lines.`,",
].join("\n");
const returnReplacement = [
  "    `Return JSON only: {\\\"candidates\\\":[{\\\"lines\\\":[\\\"...\\\"]},{\\\"lines\\\":[\\\"...\\\"]},{\\\"lines\\\":[\\\"...\\\"]}]}. Exactly ${packet.lineCount} lines per candidate.`,",
].join("\n");
replaceOnce(returnNeedle, returnReplacement, "candidate return format");

const promptNeedle = [
  '    "ATTENTION IS THE TARGET. Do not write poetry. Do not make reality prettier. Make reality harder to stop watching.",',
].join("\n");
const promptAdd = [
  '    "ATTENTION ARC: target status or hook -> interruption -> turn -> consequence -> continuation-worthy payoff. Dry, funny, blunt, social, absurd, or clever is welcome; lyrical writing is not.",',
  '    "Generate THREE materially different candidate sequences in this one response. Same supplied reality, different creative realization. Do not merely swap adjectives.",',
  '    "Candidate A searches status-first. Candidate B searches contrast or reversal. Candidate C searches callback or continuation. These are search directions, not required words.",',
  '    "Use the Coco benchmark behavior only as structure: status -> interruption -> turn -> consequence -> future promise. Never copy Coco wording and never invent unsupported facts.",',
].join("\n") + "\n";
replaceOnce(promptNeedle, promptAdd + promptNeedle, "attention prompt");

// Replace the single-sequence parser with a multi-candidate parser, preserving legacy lines output.
const parseStart = source.indexOf("function parseSingle(raw: string): string[] {");
const parseEnd = source.indexOf("\nfunction worldViolation", parseStart);
if (parseStart < 0 || parseEnd < 0) throw new Error("parse function boundaries not found");
const parseReplacement = [
  "function parseCandidates(raw: string): string[][] {",
  "  const text = clean(raw).replace(/^```(?:json)?/i, \"\").replace(/```$/i, \"\").trim();",
  "  if (!text) return [];",
  "  const parse = (value: string): string[][] => {",
  "    const parsed = JSON.parse(value) as unknown;",
  "    if (!parsed || typeof parsed !== \"object\") return [];",
  "    const record = parsed as Record<string, unknown>;",
  "    if (Array.isArray(record.candidates)) {",
  "      return record.candidates",
  "        .filter((candidate): candidate is Record<string, unknown> => Boolean(candidate) && typeof candidate === \"object\")",
  "        .map((candidate) => Array.isArray(candidate.lines) ? candidate.lines.map((line) => clean(line)).filter(Boolean) : [])",
  "        .filter((lines) => lines.length > 0);",
  "    }",
  "    if (Array.isArray(record.lines)) return [record.lines.map((line) => clean(line)).filter(Boolean)];",
  "    return [];",
  "  };",
  "  try { return parse(text); } catch {",
  "    const match = text.match(/\\{[\\s\\S]*\\}/);",
  "    if (!match) return [];",
  "    try { return parse(match[0]); } catch { return []; }",
  "  }",
  "}",
].join("\n") + "\n";
source = source.slice(0, parseStart) + parseReplacement + source.slice(parseEnd + 1);

// Replace one-sequence model selection with one-call candidate competition.
const selectionStart = source.indexOf("  const modelResult = await localModelGenerate");
const selectionEnd = source.indexOf("\n  const scenes: AuthorScene[]", selectionStart);
if (selectionStart < 0 || selectionEnd < 0) throw new Error("model selection boundaries not found");
const selectionReplacement = [
  '  const modelResult = await localModelGenerate(modelMessage(packet), "json", { numPredict: Math.min(1800, Math.max(700, lineTotal * 120)), temperature: sensitive ? 0.36 : 0.82 });',
  "  const modelCandidates = parseCandidates(modelResult.text).slice(0, 3);",
  "  const evaluations = modelCandidates",
  "    .filter((lines) => lines.length === lineTotal)",
  "    .map((lines) => {",
  "      const validation = validate(lines, path, packet);",
  "      const attention = attentionSignals(lines, packet);",
  "      return { lines, validation, attention };",
  "    });",
  "  const accepted = evaluations.filter((candidate) => candidate.validation.ok);",
  "  const ranked = [...accepted].sort((a, b) =>",
  "    (b.validation.score + b.attention.score * 0.5) -",
  "    (a.validation.score + a.attention.score * 0.5),",
  "  );",
  "  const winner = ranked[0] ?? [...evaluations].sort((a, b) =>",
  "    (b.attention.score + b.validation.score * 0.5) -",
  "    (a.attention.score + a.validation.score * 0.5),",
  "  )[0];",
  "  const modelLines = winner?.lines ?? [];",
  '  const modelValidation = winner?.validation ?? { ok: false, reasons: ["no_complete_model_candidate"], score: 0, metrics: [], provenance: [] };',
  "",
  "  const attentionRequired = attentionRequested(packet);",
  "  let finalLines = modelValidation.ok ? modelLines : [];",
  "  let finalValidation = modelValidation;",
  "  const recoveryUsed = !modelValidation.ok;",
  "  if (!finalValidation.ok && !attentionRequired) {",
  "    finalLines = groundedRecovery(packet);",
  "    finalValidation = validate(finalLines, path, packet);",
  "  }",
  "  if (!finalValidation.ok && attentionRequired) {",
  "    finalLines = [];",
  "  }",
].join("\n") + "\n";
source = source.slice(0, selectionStart) + selectionReplacement + source.slice(selectionEnd + 1);

replaceOnce("      candidateSequences: 1,", "      candidateSequences: modelCandidates.length,", "candidateSequences");
replaceOnce("      acceptedCandidates: finalValidation.ok ? 1 : 0,", "      acceptedCandidates: accepted.length,", "acceptedCandidates");
replaceOnce(
  '      rejectedCandidates: modelValidation.ok ? [] : [{ pathId: "selected", reasons: modelValidation.reasons, score: modelValidation.score, metrics: modelValidation.metrics }],',
  "      rejectedCandidates: evaluations.filter((candidate) => !candidate.validation.ok).map((candidate, index) => ({ pathId: \"candidate-\" + (index + 1), reasons: candidate.validation.reasons, score: candidate.validation.score, metrics: candidate.validation.metrics })),",
  "rejectedCandidates",
);

fs.writeFileSync(file, source, "utf8");
console.log("QRE ATTENTION CANDIDATE BEAM: APPLIED");
console.log(file);
