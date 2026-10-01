import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { buildAuthorBehaviorProfile } from "./dist/services/authorBehaviorProfile.js";

const signals = ["LEARNED_PREFERENCE: short punchy surprise", "LEARNED_AVOIDANCE: wordy explanation"];
const profile = buildAuthorBehaviorProfile(signals);
const legacy = buildAuthorBehaviorProfile(["accepted: short punchy surprise", "rejected: wordy explanation"]);
assert.deepEqual(profile, legacy, "Stored learning labels must behave like legacy feedback labels");
assert.ok(profile.confidence > 0 && profile.explanationAversion > 0);
assert.ok(buildAuthorBehaviorProfile(["LEARNED_AVOIDANCE: flowery poetry"]).learnedSignals.includes("PREFER DIRECT SPOKEN LANGUAGE AND POINTED OBSERVATIONS"));
assert.equal(buildAuthorBehaviorProfile(["LEARNED_PREFERENCE: lyrical poetry"]).learnedSignals.includes("PREFER DIRECT SPOKEN LANGUAGE AND POINTED OBSERVATIONS"), false);
assert.equal(buildAuthorBehaviorProfile(["Coco won a trophy."]).confidence, 0, "Unmarked facts are not preference feedback");

const source = readFileSync(new URL("./src/services/authorBrainCanonical.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(`${source}\nexports.readoutForTest = makeReadout;`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const exports = {};
const stop = new Error("Captured canonical writer input");
let writingInput;
let discoveryInput;
vm.runInNewContext(outputText, { exports, require(specifier) {
  if (specifier === "./authorBehaviorProfile.js") return { buildAuthorBehaviorProfile };
  if (specifier === "./authorCreativeDiscovery.js") return { discoverAuthorCreativeDirection: async (input) => {
    discoveryInput = input;
    return { model: "offline", modelCalls: 0, discovery: { selected: { evidenceEventIds: ["e1"], perception: "Contested adornment.", relationship: "" } } };
  } };
  if (specifier === "./authorCreative.js") return { createAuthorExperience: async (input) => { writingInput = input; throw stop; } };
  if (["./authorRealityGraph.js", "./authorRealityExtractor.js", "./authorCreativeGroundingVerifier.js"].includes(specifier)) return {};
  throw new Error(`Unexpected dependency: ${specifier}`);
} });
const graph = { subject: "Coco", events: [{ id: "e1", label: "Coco tried to remove a bow." }], relations: [] };
await assert.rejects(exports.authorBrainCanonical({ prompt: "Create an experience.", subject: "Coco", facts: [], sourceMoments: [], realityGraph: graph, creativeLearningContext: signals }), (error) => error === stop);
assert.deepEqual(writingInput.writingProfile, profile);
assert.deepEqual(JSON.parse(JSON.stringify(writingInput.suppliedReality)), [{ id: "e1", text: "Coco tried to remove a bow." }]);
assert.equal("creativeLearningContext" in discoveryInput, false, "Style feedback must not be supplied as factual discovery evidence");
assert.deepEqual(exports.readoutForTest({ subject: "Coco", events: [], scenes: [], learnedProfile: profile }).learnedProfile, profile);
console.log("AUTHOR WRITING PREFERENCE GREEN - STORED LABELS - CANONICAL HANDOFF - FACTS UNCHANGED - HONEST READOUT");
