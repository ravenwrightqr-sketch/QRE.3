import fs from "node:fs";

const path = "apps/api/src/services/authorMouthCandidateSearch.ts";
let text = fs.readFileSync(path, "utf8");

const replacements = [
  [
    "const phraseSupported = (candidateText, label) => {",
    "const phraseSupported = (candidateText: string, label: string): boolean => {",
  ],
  [
    "const eventSupported = (event) => {",
    "const eventSupported = (event: RealityEnvelope[\"events\"][number]): boolean => {",
  ],
];

for (const [from, to] of replacements) {
  if (!text.includes(from)) {
    throw new Error(`PATCH FAILED: ${from}`);
  }
  text = text.replace(from, to);
}

fs.writeFileSync(path, text, "utf8");
console.log("PATCHED: authorMouthCandidateSearch.ts · explicit grounding helper types");
console.log("AUTHOR MOUTH GROUNDING V5 COMPLETE");
