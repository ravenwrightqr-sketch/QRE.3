import fs from "node:fs";

const path = "apps/api/src/services/authorBrainUniversal.ts";
let source = fs.readFileSync(path, "utf8");

if (source.includes("authorizedCreativeInstructions: string[]") && source.includes("isAuthorizedEndpoint")) {
  console.log(`Already patched ${path}: explicit endpoint authority enabled.`);
  process.exit(0);
}

const replacements = [
  [
    'type Packet = { subject: string; reality: string[]; ending: string; lineCount: number; maxWords: number; lock: MovieLock; path: Path; thesis: string; movieCognition: ReturnType<typeof buildMovieCognition>; provenanceFacts: ProvenanceFact[] };',
    'type Packet = { subject: string; reality: string[]; ending: string; authorizedCreativeInstructions: string[]; lineCount: number; maxWords: number; lock: MovieLock; path: Path; thesis: string; movieCognition: ReturnType<typeof buildMovieCognition>; provenanceFacts: ProvenanceFact[] };',
  ],
  [
    'function provenanceViolations(lines: string[], packet: Packet): ProvenanceViolation[] {\n  return validateAuthorProvenance(lines, packet.provenanceFacts);\n}',
    'function provenanceViolations(lines: string[], packet: Packet): ProvenanceViolation[] {\n  const violations = validateAuthorProvenance(lines, packet.provenanceFacts);\n  const finalLine = clean(lines.at(-1));\n  const authorized = packet.authorizedCreativeInstructions.some((instruction) => clean(instruction).toLowerCase() === finalLine.toLowerCase());\n  return authorized ? violations.filter((violation) => violation.line !== lines.length) : violations;\n}',
  ],
  [
    '  lines.forEach((line, index) => {\n    const count = words(line).length;',
    '  lines.forEach((line, index) => {\n    const count = words(line).length;\n    const isAuthorizedEndpoint = index === lines.length - 1 && packet.authorizedCreativeInstructions.some((instruction) => clean(instruction).toLowerCase() === clean(line).toLowerCase());',
  ],
  [
    '    if (META.test(line)) reasons.push(`line_${index + 1}:meta_language`);\n    if (STOCK.test(line)) reasons.push(`line_${index + 1}:stock_sentiment`);\n    if (GLUE.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);\n    if (DECORATION.test(line)) reasons.push(`line_${index + 1}:generic_decoration`);\n    if (PRONOUN.test(line)) reasons.push(`line_${index + 1}:unsupported_identity_reference`);\n    const violation = worldViolation(line, packet); if (violation) reasons.push(`line_${index + 1}:${violation}`);',
    '    if (META.test(line) && !isAuthorizedEndpoint) reasons.push(`line_${index + 1}:meta_language`);\n    if (STOCK.test(line) && !isAuthorizedEndpoint) reasons.push(`line_${index + 1}:stock_sentiment`);\n    if (GLUE.test(line) && !isAuthorizedEndpoint) reasons.push(`line_${index + 1}:explanatory_glue`);\n    if (DECORATION.test(line) && !isAuthorizedEndpoint) reasons.push(`line_${index + 1}:generic_decoration`);\n    if (PRONOUN.test(line) && !isAuthorizedEndpoint) reasons.push(`line_${index + 1}:unsupported_identity_reference`);\n    const violation = !isAuthorizedEndpoint ? worldViolation(line, packet) : undefined; if (violation) reasons.push(`line_${index + 1}:${violation}`);',
  ],
  [
    '  const packet: Packet = { subject, reality: source, ending, lineCount: lineTotal, maxWords, lock, path, thesis: selected.premise, movieCognition, provenanceFacts };',
    '  const authorizedCreativeInstructions = ending ? [ending] : [];\n  const packet: Packet = { subject, reality: source, ending, authorizedCreativeInstructions, lineCount: lineTotal, maxWords, lock, path, thesis: selected.premise, movieCognition, provenanceFacts };',
  ],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) {
    throw new Error(`Patch anchor not found: ${from.slice(0, 100)}`);
  }
  source = source.replace(from, to);
}

fs.writeFileSync(path, source);
console.log(`Patched ${path}: explicit endpoint authority enabled.`);
