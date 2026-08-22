import fs from "node:fs";

const path = "apps/api/src/services/authorBrainUniversal.ts";
let source = fs.readFileSync(path, "utf8");

if (source.includes("authorizedCreativeInstructions: string[]") && source.includes("isAuthorizedEndpoint")) {
  console.log(`Already patched ${path}: explicit endpoint authority enabled.`);
  process.exit(0);
}

const packetPattern = /type Packet = \{([\s\S]*?)\};/;
const packetMatch = source.match(packetPattern);
if (!packetMatch) throw new Error("Packet type not found");
const packetBody = packetMatch[1];
const nextPacketBody = packetBody.replace(/ending: string;\s*/, "ending: string; authorizedCreativeInstructions: string[]; ");
if (nextPacketBody === packetBody) throw new Error("Packet ending field not found");
source = source.replace(packetPattern, `type Packet = {${nextPacketBody}};`);

const provenancePattern = /function provenanceViolations\(lines: string\[\], packet: Packet\): ProvenanceViolation\[\] \{[\s\S]*?\n\}/;
if (!provenancePattern.test(source)) throw new Error("provenanceViolations function not found");
source = source.replace(provenancePattern, `function provenanceViolations(lines: string[], packet: Packet): ProvenanceViolation[] {
  const violations = validateAuthorProvenance(lines, packet.provenanceFacts);
  const finalLine = clean(lines.at(-1));
  const authorized = packet.authorizedCreativeInstructions.some((instruction) => clean(instruction).toLowerCase() === finalLine.toLowerCase());
  return authorized ? violations.filter((violation) => violation.line !== lines.length) : violations;
}`);

const validatePattern = /function validate\(lines: string\[\], path: Path, packet: Packet\): Validation \{[\s\S]*?\n\}/;
const validateBlock = source.match(validatePattern)?.[0];
if (!validateBlock) throw new Error("validate function not found");
let nextValidate = validateBlock;
if (!nextValidate.includes("isAuthorizedEndpoint")) {
  const loopPattern = /lines\.forEach\(\(line, index\) => \{\n\s*const count = words\(line\)\.length;\n/;
  nextValidate = nextValidate.replace(loopPattern, `lines.forEach((line, index) => {
    const count = words(line).length;
    const isAuthorizedEndpoint = index === lines.length - 1 && packet.authorizedCreativeInstructions.some((instruction) => clean(instruction).toLowerCase() === clean(line).toLowerCase());
`);
  if (!nextValidate.includes("isAuthorizedEndpoint")) throw new Error("validate endpoint hook could not be applied");
  nextValidate = nextValidate.replace(/if \(META\.test\(line\)\)/, "if (META.test(line) && !isAuthorizedEndpoint)");
  nextValidate = nextValidate.replace(/if \(STOCK\.test\(line\)\)/, "if (STOCK.test(line) && !isAuthorizedEndpoint)");
  nextValidate = nextValidate.replace(/if \(GLUE\.test\(line\)\)/, "if (GLUE.test(line) && !isAuthorizedEndpoint)");
  nextValidate = nextValidate.replace(/if \(DECORATION\.test\(line\)\)/, "if (DECORATION.test(line) && !isAuthorizedEndpoint)");
  nextValidate = nextValidate.replace(/if \(PRONOUN\.test\(line\)\)/, "if (PRONOUN.test(line) && !isAuthorizedEndpoint)");
  nextValidate = nextValidate.replace(/const violation = worldViolation\(line, packet\); if \(violation\)/, "const violation = isAuthorizedEndpoint ? undefined : worldViolation(line, packet); if (violation)");
  source = source.replace(validatePattern, nextValidate);
}

const packetCreatePattern = /const packet: Packet = \{([\s\S]*?)\};/;
const packetCreateMatch = source.match(packetCreatePattern);
if (!packetCreateMatch) throw new Error("Packet construction not found");
const packetCreateBody = packetCreateMatch[1];
const nextPacketCreateBody = packetCreateBody.replace(/ending,\s*/, "ending, authorizedCreativeInstructions: ending ? [ending] : [], ");
if (nextPacketCreateBody === packetCreateBody) throw new Error("Packet construction ending field not found");
source = source.replace(packetCreatePattern, `const packet: Packet = {${nextPacketCreateBody}};`);

fs.writeFileSync(path, source);
console.log(`Patched ${path}: explicit endpoint authority enabled.`);
