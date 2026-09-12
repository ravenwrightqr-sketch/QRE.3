import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const truth={prompt:"Coco, a poodle, loves walks and apples. She returned today after her last visit.",subject:"Coco",facts:["Coco is a poodle","Coco loves walks","Coco loves apples"],sourceMoments:["Coco chose the door as soon as the walk was mentioned"],memoryContext:["MEMORY EVENT: Coco returned for another visit","MEMORY FACT: preference: walks"],trajectory:["returning after an earlier visit"],creativeLearningContext:["LEARNED_PREFERENCE: concise surprising callbacks"],returning:true,visitNumber:2};
const result=await authorBrainCanonical(truth);
if(result.judgment.status!=="ACCEPT") throw new Error(result.judgment.reasons.join("; "));
if(result.sequence.cuts.length<3) throw new Error("Too few cuts");
if(!result.proposition.text) throw new Error("Missing proposition");
for(const cut of result.sequence.cuts){if(!cut.sourceIds.length)throw new Error(`Unanchored cut ${cut.id}`);}
console.log(JSON.stringify({status:"PASS",proposition:result.proposition,relations:result.metamorphic.relationCount,cuts:result.sequence.cuts.length,judgment:result.judgment},null,2));
