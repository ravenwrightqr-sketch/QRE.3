#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
const root=resolve(process.cwd()), failures=[];
const exists=p=>existsSync(join(root,p));
const read=p=>readFileSync(join(root,p),"utf8");
const required=["apps/api/src/services/authorBrainCanonical.ts","apps/api/src/services/authorCognition.ts","apps/api/src/services/authorUniversalMovieSearch.ts","apps/api/src/services/authorRealityGraph.ts","apps/api/src/services/authorRealityEnvelope.ts","apps/api/src/services/authorMouth.ts","apps/api/src/services/authorCharacterLensEngine.ts","apps/api/src/services/authorViewerStateCut.ts","apps/api/src/services/authorRealizationMode.ts","apps/api/author-acceptance.ts","apps/api/author-mouth-universal-acceptance.ts"];
const retired=["apps/api/src/services/authorMouthCraft.ts","apps/api/src/services/authorMouthCritic.ts","apps/api/src/services/authorMouthInterpretation.ts","apps/api/src/services/authorMouthSequenceCritic.ts"];
for(const p of required)if(!exists(p))failures.push(`missing:${p}`);
for(const p of retired)if(exists(p))failures.push(`retired Mouth file exists:${p}`);
const brain=exists(required[0])?read(required[0]):"", mouth=exists(required[5])?read(required[5]):"";
for(const [re,label] of [[/buildAuthorCognitivePlan\s*\(/,"brain->cognition"],[/buildAuthorRealityGraph\s*\(/,"brain->reality-graph"],[/buildAuthorRealityEnvelope\s*\(/,"brain->reality-envelope"],[/buildMouthCandidateMessages\s*\(/,"brain->mouth-generation"],[/scoreMouthCandidate\s*\(/,"brain->mouth-scoring"],[/selectBestMouthSequence\s*\(/,"brain->mouth-selection"]])if(!re.test(brain))failures.push(`missing wiring:${label}`);
for(const re of [/Reality freedom is LOW\. Framing freedom is HIGH\./,/Grounding is not authorization\./,/approved-semantic-realization/,/literal-source-restatement/,/classifyLens/])if(!re.test(mouth))failures.push(`canonical Mouth law missing:${re}`);
const files=[];function walk(dir){if(!existsSync(dir))return;for(const e of readdirSync(dir,{withFileTypes:true})){if(["node_modules",".git","dist","build",".next"].includes(e.name))continue;const a=join(dir,e.name);e.isDirectory()?walk(a):e.isFile()&&/\.(ts|tsx|js|mjs)$/.test(e.name)&&files.push(a)}}walk(join(root,"apps/api/src"));
for(const file of files){const body=readFileSync(file,"utf8"),rel=relative(root,file).replaceAll("\\","/");for(const oldName of ["authorMouthCraft","authorMouthCritic","authorMouthInterpretation","authorMouthSequenceCritic"])if(new RegExp(`from\\s+[\"'][^\"']*${oldName}\\.js[\"']`).test(body))failures.push(`retired import:${rel}->${oldName}`)}
console.log("=== QRE AUTHOR / ONE MOUTH WIRING GUARD ===");
for(const f of failures)console.error(`FAIL: ${f}`);
if(failures.length){console.error(`ONE MOUTH WIRING GUARD FAILED · ${failures.length} violation(s)`);process.exit(1)}
console.log("ONE MOUTH WIRING GUARD GREEN · ONE AUTHOR · ONE COGNITION · ONE MOUTH · ONE SEQUENCE");