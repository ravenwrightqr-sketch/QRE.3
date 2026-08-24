import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const source = fs.readFileSync(file, "utf8");

if (source.includes("const ATTENTION_LANGUAGE =")) {
  console.log("AUTHOR ATTENTION PATCH: already applied");
  process.exit(0);
}

const constantsNeedle = 'const CONTRAST = /\\b(?:but|yet|still|until|instead|rather|then|suddenly|except|however|despite|temporary|again|already|finally)\\b/i;';
const constantsInsert = `${constantsNeedle}\nconst ATTENTION_LANGUAGE = /\\b(?:then|next|again|until|still|but|yet|instead|before|after|finally|already|only|now|one more|not yet|this time|round|first|last)\\b/i;\nconst ATTENTION_POETRY = /\\b(?:gleam|gleams|glows|hums|breathes|whispers|dances|dreams|ritual|uncluttered|gracefully|magically|poetically|atmosphere|symphony|silent storm|quiet tremor)\\b/i;`;
if (!source.includes(constantsNeedle)) throw new Error("Could not find constants insertion point");

let out = source.replace(constantsNeedle, constantsInsert);

const metricNeedle = `function metrics(lines: string[], path: Path, packet: Packet): BeatMetrics[] {`;
const attentionFns = `function attentionSignals(lines: string[], packet: Packet): { score: number; signals: number; poetry: number } {\n  let signals = 0;\n  let poetry = 0;\n  lines.forEach((line, index) => {\n    const lower = line.toLowerCase();\n    if (ATTENTION_LANGUAGE.test(line)) signals += index === lines.length - 1 ? 0.7 : 1;\n    if (index < lines.length - 1 && /[:—-]/.test(line)) signals += 0.8;\n    if (index < lines.length - 1 && /^(?:then|next|still|but|yet|again|before|after|finally|already|only|now)\\b/i.test(lower)) signals += 0.9;\n    if (index === lines.length - 1 && /\\b(?:over|done|finished|complete|completed|settled|cleared|again|next|round|held|counted|back)\\b/i.test(lower)) signals += 1;\n    if (ATTENTION_POETRY.test(line)) poetry += 1;\n  });\n  const normalizedSignals = Math.min(1, signals / Math.max(4, lines.length));\n  const poetryPenalty = Math.min(1, poetry / Math.max(1, lines.length));\n  return { score: metric(normalizedSignals * 0.72 + (1 - poetryPenalty) * 0.28), signals: Math.round(signals), poetry };\n}\n\nfunction attentionRequested(packet: Packet): boolean {\n  return /\\b(?:attention|attention-grabbing|memorable|entertaining|clever|status|social|watch|engaging|viral|shareable)\\b/i.test(packet.prompt) || packet.movieCognition.selected.lens.id !== "neutral";\n}\n\n${metricNeedle}`;
if (!out.includes(metricNeedle)) throw new Error("Could not find metrics insertion point");
out = out.replace(metricNeedle, attentionFns);

const validateNeedle = `  const score = metric(ms.reduce((sum, item) => sum + item.attention, 0) / Math.max(1, ms.length) * 0.45 + ms.reduce((sum, item) => sum + item.cinematicity, 0) / Math.max(1, ms.length) * 0.25 + 0.2 + (packet.ending ? 0.1 : 0) + Math.min(0.08, creativeBeats * 0.02));\n  if (score < MIN_SCORE) reasons.push(`;
const validateReplacement = `  const attention = attentionSignals(lines, packet);\n  const attentionRequired = attentionRequested(packet);\n  if (attentionRequired && attention.signals < 4) reasons.push(`attention_floor:${attention.signals}`);\n  if (attentionRequired && attention.score < 0.68) reasons.push(`attention_quality:${attention.score}`);\n  if (attentionRequired && attention.poetry >= 2) reasons.push(`poetry_over_attention:${attention.poetry}`);\n  const score = metric(ms.reduce((sum, item) => sum + item.attention, 0) / Math.max(1, ms.length) * 0.34 + ms.reduce((sum, item) => sum + item.nextBeatPull, 0) / Math.max(1, ms.length) * 0.31 + ms.reduce((sum, item) => sum + item.cinematicity, 0) / Math.max(1, ms.length) * 0.15 + 0.2 + (packet.ending ? 0.08 : 0) + attention.score * 0.16);\n  if (score < MIN_SCORE) reasons.push(`;
if (!out.includes(validateNeedle)) throw new Error("Could not find validation score block");
out = out.replace(validateNeedle, validateReplacement);

const recoveryNeedle = `function groundedRecovery(packet: Packet): string[] {`;
const recoveryInsert = `function attentionRecovery(packet: Packet): string[] {\n  const facts = uniq(packet.reality.filter((fact) => clean(fact).toLowerCase() !== packet.subject.toLowerCase()));\n  const compact = facts.slice(0, packet.lineCount).map((fact) => clean(fact).replace(new RegExp(`^${escapeRegex(packet.subject)}\\\\s*`, "i"), "").replace(/[.]+$/g, ""));\n  const lines: string[] = [];\n  compact.forEach((fact, index) => {\n    if (!fact) return;\n    if (index === 0) lines.push(capitalizeFact(fact));\n    else if (index === compact.length - 1) lines.push(capitalizeFact(`Then ${fact}`));\n    else if (index === compact.length - 2) lines.push(capitalizeFact(`Next: ${fact}`));\n    else lines.push(capitalizeFact(`And then: ${fact}`));\n  });\n  while (lines.length < packet.lineCount - 1) lines.push(capitalizeFact(`What came next was ${facts.at(Math.max(0, lines.length - 1)) ?? facts.at(-1) ?? "the next move"}`));\n  const callback = compact.at(-1) || facts.at(-1) || "the last move";\n  if (lines.length >= packet.lineCount) return lines.slice(0, packet.lineCount);\n  lines.push(capitalizeFact(`And that was the part that counted: ${callback}`));\n  return lines.slice(0, packet.lineCount);\n}\n\n${recoveryNeedle}`;
if (!out.includes(recoveryNeedle)) throw new Error("Could not find recovery insertion point");
out = out.replace(recoveryNeedle, recoveryInsert);

const finalRecoveryNeedle = `  let finalLines = modelValidation.ok ? modelLines : groundedRecovery(packet);`;
const finalRecoveryReplacement = `  const attentionModelValidation = modelValidation.ok && (!attentionRequested(packet) || (attentionSignals(modelLines, packet).signals >= 4 && attentionSignals(modelLines, packet).poetry < 2));\n  let finalLines = attentionModelValidation ? modelLines : attentionRecovery(packet);`;
if (!out.includes(finalRecoveryNeedle)) throw new Error("Could not find final recovery selection");
out = out.replace(finalRecoveryNeedle, finalRecoveryReplacement);

const recoveryUsedNeedle = `  const recoveryUsed = !modelValidation.ok;`;
const recoveryUsedReplacement = `  const recoveryUsed = !attentionModelValidation;`;
if (!out.includes(recoveryUsedNeedle)) throw new Error("Could not find recoveryUsed assignment");
out = out.replace(recoveryUsedNeedle, recoveryUsedReplacement);

const promptNeedle = `    "Do not spend the five beats merely copying the source facts. Transform phrasing, compress ordinary actions, use a selected creative frame, and make the last beat a memorable consequence. At most two beats may closely restate supplied facts; the sequence as a whole must feel written, not transcribed.",`;
const promptReplacement = `    "ATTENTION IS THE TARGET: create interruption, curiosity, escalation, contrast, callback, anticipation, and payoff. The viewer should need the next beat. Write action-forward attention language, not poetry, lyrical imagery, atmosphere, or decorative description.",\n    "Every non-final beat should either open a question, change the status, sharpen contrast, point forward, or make the next beat newly necessary. Do not use beauty words as a substitute for tension. Do not make every beat a descriptive sentence.",\n    "Prefer fragments such as a fact becoming a verdict, a sequence becoming a contest, a repeated detail becoming a callback, or an ordinary step becoming the setup for the next step. Clever wordplay is welcome when earned by supplied reality.",\n${promptNeedle}`;
if (!out.includes(promptNeedle)) throw new Error("Could not find model prompt insertion point");
out = out.replace(promptNeedle, promptReplacement);

fs.writeFileSync(file, out, "utf8");
console.log("AUTHOR ATTENTION PATCH: APPLIED");
console.log(file);
