import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const read = (name) => fs.readFileSync(file(name), "utf8");
const write = (name, content) => fs.writeFileSync(file(name), content, "utf8");

function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`AUTHOR MOUTH SEQUENCE UPGRADE · missing anchor: ${label}`);
  return text.replace(from, to);
}

function patchMouth() {
  const name = "apps/api/src/services/authorMouthCandidateSearch.ts";
  let text = read(name);

  const helper = `
function buildSequenceCreativeContext(beats: readonly MouthCandidateBeat[]): string {
  return beats
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((beat) => {
      const realization = beat.creativeRealization;
      return [
        \`BEAT \\${beat.order}\`,
        \`role=\\${clean(beat.role)}\`,
        \`attention=\\${clean(beat.attentionFunction)}\`,
        \`move=\\${clean(beat.creativeMove)}\`,
        \`strategy=\\${clean(realization?.strategy)}\`,
        \`meaning=\\${clean(realization?.creativeOpportunity)}\`,
        \`intent=\\${clean(realization?.realizationIntent)}\`,
        \`effect=\\${clean(realization?.viewerEffect)}\`,
        \`trajectory=\\${(realization?.creativeTrajectory ?? []).join(" → ") }\`,
        \`escalation=\\${clean(realization?.escalationMove)}\`,
        \`next=\\${clean(beat.next || beat.frontier)}\`,
        \`endpoint=\\${clean(beat.paysOff?.[0])}\`,
      ].join(" | ");
    })
    .join("\\n");
}
`;

  if (!text.includes("function buildSequenceCreativeContext(")) {
    text = text.replace("function isPayoffBeat(", helper + "\nfunction isPayoffBeat(");
  }

  const currentSystemMarker = '    "The source sentence may be correct and still be a terrible realization.",\n';
  const sequenceRules = `    "The sequence is ONE creative experience, not independent captions.",\n    "Every beat must change the meaning, attitude, pressure, implication, or expectation created by the previous beat.",\n    "Do not summarize what happened before. Recontextualize it.",\n    "A later beat may reuse a supplied fact only when its significance changes.",\n    "Do not make every beat name the subject, trait, or object again.",\n`;
  if (!text.includes('"The sequence is ONE creative experience, not independent captions."')) {
    text = replaceOnce(text, currentSystemMarker, currentSystemMarker + sequenceRules, "sequence creative rules");
  }

  const userEnd = '    beat: {\n';
  const contextLine = '    sequenceCreativeContext: buildSequenceCreativeContext(input.beats),\n\n';
  if (!text.includes("sequenceCreativeContext: buildSequenceCreativeContext(input.beats)")) {
    text = replaceOnce(text, userEnd, contextLine + userEnd, "sequence context payload");
  }

  const targetBeat = '      order:\n        beat.order,\n';
  const targetInstruction = '      targetInstruction:\n        "Write ONLY this beat. It must work as part of the complete sequence above, not as a standalone caption.",\n';
  if (!text.includes("targetInstruction:")) {
    text = replaceOnce(text, targetBeat, targetBeat + targetInstruction, "target beat instruction");
  }

  const generationCall = `    const result = await localModelGenerate(messages, "json", {\n      numPredict: 1536,\n      temperature: input.risk === "safe" ? 0.55 : 0.72,\n    });`;
  const hotterCall = `    const result = await localModelGenerate(messages, "json", {\n      numPredict: 1536,\n      temperature: input.risk === "safe" ? 0.68 : 0.84,\n    });`;
  if (text.includes(generationCall)) {
    text = replaceOnce(text, generationCall, hotterCall, "creative generation temperature");
  }

  write(name, text);
}

function patchAcceptance() {
  const name = "apps/api/author-canonical-acceptance.ts";
  let text = read(name);
  const marker = 'console.log("--- REALIZATION TEXTS ---");';
  if (text.includes("REALIZATION STRATEGIES")) return;
  const addition = `console.log("--- REALIZATION STRATEGIES ---");\nif (result?.mouth?.beats) {\n  for (const beat of result.mouth.beats) {\n    const realization = beat?.creativeRealization;\n    console.log(\`[\\${beat.order}] STRATEGY: \\${realization?.strategy ?? "none"} · INTENT: \\${realization?.realizationIntent ?? ""}\`);\n  }\n}\n`;
  if (text.includes(marker)) text = text.replace(marker, marker + "\n" + addition);
  write(name, text);
}

patchMouth();
patchAcceptance();
console.log("AUTHOR MOUTH SEQUENCE CONTEXT UPGRADE APPLIED");
