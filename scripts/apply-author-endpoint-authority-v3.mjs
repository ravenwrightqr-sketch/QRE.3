import fs from "node:fs";

const brainPath = "apps/api/src/services/authorBrainUniversal.ts";
const gatePath = "apps/api/src/services/authorProvenanceGate.ts";

let brain = fs.readFileSync(brainPath, "utf8");
let gate = fs.readFileSync(gatePath, "utf8");

const oldBuild = /function buildProvenanceFacts\(source: string\[], subject: string\): ProvenanceFact\[\] \{[\s\S]*?\n\}/;
const newBuild = `function buildProvenanceFacts(source: string[], subject: string, authorizedInstructions: string[] = []): ProvenanceFact[] {\n  const facts = source.map((text) => ({\n    text,\n    provenance: buildRealityProvenance(text, "memory", { subject }),\n  }));\n  for (const instruction of authorizedInstructions) {\n    const text = clean(instruction);\n    if (!text || facts.some((fact) => fact.text.toLowerCase() === text.toLowerCase())) continue;\n    facts.push({\n      text,\n      provenance: buildRealityProvenance(text, "prompt", { subject }),\n    });\n  }\n  return facts;\n}`;
if (brain.includes('buildRealityProvenance(text, "prompt"')) {
  console.log(`Already patched ${brainPath}`);
} else {
  if (!oldBuild.test(brain)) throw new Error(`Could not find buildProvenanceFacts in ${brainPath}`);
  brain = brain.replace(oldBuild, newBuild);
  const oldCall = 'const provenanceFacts = buildProvenanceFacts(source, subject);';
  const newCall = 'const provenanceFacts = buildProvenanceFacts(source, subject, ending ? [ending] : []);';
  if (!brain.includes(oldCall)) throw new Error(`Could not find provenanceFacts construction in ${brainPath}`);
  brain = brain.replace(oldCall, newCall);
  fs.writeFileSync(brainPath, brain);
  console.log(`Patched ${brainPath}: explicit endpoint becomes prompt-source evidence.`);
}

const oldPrivate = /if \(\n\s*PRIVATE\.test\(line\) &&\n\s*facts\.every\(\(fact\) => provenanceForbids\(fact\.provenance, "invent_private_fact"\)\)\n\s*\)/;
const newPrivate = `if (\n      PRIVATE.test(line) &&\n      !facts.some((fact) => fact.provenance.source === "prompt" && factSupportsLine(line, fact)) &&\n      facts.every((fact) => provenanceForbids(fact.provenance, "invent_private_fact"))\n    )`;
if (gate.includes('fact.provenance.source === "prompt" && factSupportsLine(line, fact)')) {
  console.log(`Already patched ${gatePath}`);
} else {
  if (!oldPrivate.test(gate)) throw new Error(`Could not find private-fact gate in ${gatePath}`);
  gate = gate.replace(oldPrivate, newPrivate);
  fs.writeFileSync(gatePath, gate);
  console.log(`Patched ${gatePath}: prompt-authorized exact endpoints bypass private-fact rejection.`);
}
