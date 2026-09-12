import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root=process.cwd();
const required=["src/services/authorRealityGraph.ts","src/services/authorMetamorphicSearch.ts","src/services/authorCognition.ts","src/services/authorArtist.ts","src/services/authorMouth.ts","src/services/authorJudge.ts","src/services/authorBrainCanonical.ts"];
const forbidden=["authorCognitionUniversal","authorCognitionIntelligence","authorArtistChoice","authorCreativeRealizer","authorCreativeSpine","authorCreativeLens","authorRealizedFilmJudge","authorExperienceJudge","authorSatanicoRelationSearch"];
for(const file of required) if(!existsSync(resolve(root,"apps/api",file))) throw new Error(`Missing canonical Author file: ${file}`);
const canonical=readFileSync(resolve(root,"apps/api/src/services/authorBrainCanonical.ts"),"utf8");
for(const name of forbidden) if(canonical.includes(name)) throw new Error(`Canonical Author still depends on obsolete authority: ${name}`);
const banned=/\b(movie|film)\b/i;
for(const file of ["authorBrain.ts","sequenceCandidate.ts","metamorphic.ts","mouth.ts"]){const p=resolve(root,"packages/contracts/src",file.includes("author")?"author/authorBrain.ts":file.includes("sequence")?"sequence/sequenceCandidate.ts":file.includes("metamorphic")?"cognition/metamorphic.ts":"mouth/mouth.ts");if(banned.test(readFileSync(p,"utf8")))throw new Error(`Banned artifact terminology remains in ${p}`);}
console.log("AUTHOR FINAL ARCHITECTURE: PASS");
console.log("Reality -> Metamorphic -> Cognition -> Artist -> Mouth -> Judge -> SequencePlay");
