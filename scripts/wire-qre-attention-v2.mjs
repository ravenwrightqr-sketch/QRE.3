import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'apps/api/src/services/authorBrainUniversal.ts');
let source = fs.readFileSync(file, 'utf8');
const NL = String.fromCharCode(10);

function replaceOnce(from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(label + ': expected exactly one match, found ' + count);
  source = source.replace(from, to);
}

const tokenBroken = [
  '  const sourceTokens = new Set(',
  '    packet.reality',
  '      .flatMap(tokens)',
  '      .values(),',
  '  );',
].join(NL);
const tokenFixed = [
  '  const sourceTokens = new Set<string>();',
  '  for (const fact of packet.reality) {',
  '    for (const token of tokens(fact)) sourceTokens.add(token);',
  '  }',
].join(NL);
if (source.includes(tokenBroken)) source = source.replace(tokenBroken, tokenFixed);

const returnPattern = /    `Return JSON only: \{\\"lines\\":\[\\"\.\.\.\\"\]\}\. Exactly \$\{packet\.lineCount\} lines\.`,/;
const returnReplacement = '    `Return JSON only: {\\"candidates\\":[{\\"lines\\":[\\"...\\"]},{\\"lines\\":[\\"...\\"]},{\\"lines\\":[\\"...\\"]}]}. Exactly ${packet.lineCount} lines per candidate.`,';
if (returnPattern.test(source)) source = source.replace(returnPattern, returnReplacement);

const promptAnchor = '    "ATTENTION IS THE TARGET. Do not write poetry. Do not make reality prettier. Make reality harder to stop watching.",';
if (source.includes(promptAnchor) && !source.includes('FRAME SEARCH: before writing')) {
  const additions = [
    '    "FRAME SEARCH: infer the smallest familiar human mechanic that makes the supplied facts more watchable: mission, speedrun, heist, investigation, countdown, race, quest, boss fight, restoration, negotiation, backstage, courtroom, expedition, celebrity prep, or NONE.",',
    '    "The frame is a lens, not a template. It changes perspective only. Never inject game objects, weapons, rooms, people, relationships, scores, props, dialogue, or literal events because of the frame.",',
    '    "Generate three materially different movies in one response. A searches status-first, B searches contrast/reversal, C searches callback/continuation. These are search directions, not required words.",',
    '    "ATTENTION ARC: status or hook -> interruption -> turn -> consequence -> continuation-worthy payoff. Every beat must do attention work. Do not write a task list.",',
    '    "Use the Coco benchmark as behavioral structure only: attitude, interruption, turn, status change, future promise. Never copy Coco wording.",',
  ].join(NL);
  source = source.replace(promptAnchor, additions + NL + promptAnchor);
}

const parseStart = source.indexOf('function parseSingle(raw: string): string[] {');
const parseEnd = source.indexOf(NL + 'function worldViolation', parseStart);
if (parseStart >= 0 && parseEnd >= 0) {
  const parseReplacement = [
    'function parseCandidates(raw: string): string[][] {',
    '  const text = clean(raw).trim();',
    '  if (!text) return [];',
    '  const parse = (value: string): string[][] => {',
    '    const parsed = JSON.parse(value) as unknown;',
    '    if (!parsed || typeof parsed !== "object") return [];',
    '    const record = parsed as Record<string, unknown>;',
    '    if (Array.isArray(record.candidates)) {',
    '      return record.candidates',
    '        .filter((candidate): candidate is Record<string, unknown> => Boolean(candidate) && typeof candidate === "object")',
    '        .map((candidate) => Array.isArray(candidate.lines) ? candidate.lines.map((line) => clean(line)).filter(Boolean) : [])',
    '        .filter((lines) => lines.length > 0);',
    '    }',
    '    if (Array.isArray(record.lines)) return [record.lines.map((line) => clean(line)).filter(Boolean)];',
    '    return [];',
    '  };',
    '  try { return parse(text); } catch {',
    '    const match = text.match(/\\{[\\s\\S]*\\}/);',
    '    if (!match) return [];',
    '    try { return parse(match[0]); } catch { return []; }',
    '  }',
    '}',
    '',
  ].join(NL);
  source = source.slice(0, parseStart) + parseReplacement + source.slice(parseEnd + 1);
} else if (!source.includes('function parseCandidates(raw: string): string[][] {')) {
  throw new Error('parseSingle function not found');
}

const selectStart = source.indexOf('  const modelResult = await localModelGenerate');
const selectEnd = source.indexOf(NL + '  const scenes: AuthorScene[]', selectStart);
if (selectStart < 0 || selectEnd < 0) throw new Error('model selection block not found');

const selectionReplacement = [
  '  const modelResult = await localModelGenerate(modelMessage(packet), "json", {',
  '    numPredict: Math.min(1800, Math.max(700, lineTotal * 120)),',
  '    temperature: sensitive ? 0.36 : 0.82,',
  '  });',
  '  const modelCandidates = parseCandidates(modelResult.text).slice(0, 3);',
  '  const evaluations = modelCandidates',
  '    .filter((lines) => lines.length === lineTotal)',
  '    .map((lines) => {',
  '      const validation = validate(lines, path, packet);',
  '      const attention = attentionSignals(lines, packet);',
  '      return { lines, validation, attention };',
  '    });',
  '  const attentionRequired = attentionRequested(packet);',
  '  const accepted = evaluations.filter((candidate) => candidate.validation.ok);',
  '  const rankedAccepted = [...accepted].sort((a, b) =>',
  '    (b.validation.score + b.attention.score * 0.6) - (a.validation.score + a.attention.score * 0.6),',
  '  );',
  '  const rankedAll = [...evaluations].sort((a, b) =>',
  '    (b.attention.score + b.validation.score * 0.4) - (a.attention.score + a.validation.score * 0.4),',
  '  );',
  '  const winner = attentionRequired ? rankedAccepted[0] : (rankedAccepted[0] ?? rankedAll[0]);',
  '  const modelLines = winner?.lines ?? [];',
  '  const modelValidation = winner?.validation ?? { ok: false, reasons: ["no_complete_model_candidate"], score: 0, metrics: [], provenance: [] };',
  '  let finalLines = modelValidation.ok ? modelLines : [];',
  '  let finalValidation = modelValidation;',
  '  const recoveryUsed = false;',
  '  if (!finalValidation.ok && !attentionRequired) {',
  '    finalLines = groundedRecovery(packet);',
  '    finalValidation = validate(finalLines, path, packet);',
  '  }',
  '  if (attentionRequired && (!finalValidation.ok || attentionSignals(finalLines, packet).signals < 4 || attentionSignals(finalLines, packet).poetry >= 2)) {',
  '    finalLines = [];',
  '    finalValidation = { ok: false, reasons: [...modelValidation.reasons, "attention_bar_not_reached"], score: 0, metrics: modelValidation.metrics, provenance: modelValidation.provenance };',
  '  }',
  '  const selectedScore = finalValidation.ok ? finalValidation.score : 0;',
  '',
].join(NL);
source = source.slice(0, selectStart) + selectionReplacement + source.slice(selectEnd + 1);

if (source.includes('      candidateSequences: 1,')) {
  replaceOnce('      candidateSequences: 1,', '      candidateSequences: modelCandidates.length,', 'candidate sequence count');
}
if (source.includes('      acceptedCandidates: finalValidation.ok ? 1 : 0,')) {
  replaceOnce('      acceptedCandidates: finalValidation.ok ? 1 : 0,', '      acceptedCandidates: accepted.length,', 'accepted candidate count');
}

const rejectedLine = '      rejectedCandidates: modelValidation.ok ? [] : [{ pathId: "selected", reasons: modelValidation.reasons, score: modelValidation.score, metrics: modelValidation.metrics }],';
if (source.includes(rejectedLine)) {
  replaceOnce(rejectedLine, '      rejectedCandidates: evaluations.filter((candidate) => !candidate.validation.ok).map((candidate, index) => ({ pathId: "candidate-" + (index + 1), reasons: candidate.validation.reasons, score: candidate.validation.score, metrics: candidate.validation.metrics })),', 'rejected candidate diagnostics');
}

fs.writeFileSync(file, source, 'utf8');
console.log('QRE ATTENTION V2 PATCH: APPLIED');
console.log(file);
