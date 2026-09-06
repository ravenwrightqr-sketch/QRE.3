import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type Case = {
  name: string; subject: string; prompt: string; facts: string[]; lens?: string; returning?: boolean; memoryContext?: string[];
};

const ARTIST_CHARTER = [
  "The subject is a factual referent, never a default narrator.",
  "Do not begin every cut with the subject name. Grammar may center an object, place, time, action, fragment, collision, or omission when supplied reality supports it.",
  "Do not write one sentence per fact. Make supplied details interact.",
  "Do not explain an interpretation. Make the relationship visible, then let the final cut feel it.",
  "Do not use generic cinematic filler or invented sensory detail.",
  "The film's form must be earned by this reality. Do not force the same opening, beat count, sentence shape, or ending shape across worlds.",
  "A tiny film may be 2 cuts. A richer reality may need more. Length is earned by the relationship, never by a template.",
  "Prefer compression over narration. Prefer concrete juxtaposition over commentary. Prefer a final image/phrase that changes the reading over a summary.",
  "Semantic truth is immutable; client wording is not. Transform the language without changing what happened.",
].join("\n");

const cases: Case[] = [
  { name:"COCO / GROOMING", subject:"Coco", prompt:"Make a tiny replayable film from what actually happened. Coco is framed here as fierce. Compare the supplied details and let an earned artistic interpretation land. Do not explain the meaning.", facts:["Coco came in for grooming","Coco hates the dryer","Coco stole an apple from the counter","Coco wore a blue bow home"] },
  { name:"MARIA / HOUSE RESET", subject:"Maria", prompt:"Make the house reset watchable. Find a relationship in the details and let the ending become a felt landing, not a checklist.", facts:["Maria started cleaning at 9:04 AM","Maria cleaned the kitchen","Maria cleaned bathroom one","Maria cleaned bathroom two","Maria finished at 11:47 AM"] },
  { name:"RESTAURANT / SERVICE", subject:"the restaurant", prompt:"Find the most interesting relationship in this shift and make it feel lived. The interruption should alter what the viewer notices.", facts:["The restaurant opened at 5 PM","The first table ordered oysters","The fryer stopped working","The fryer returned before dessert service","Dessert service became the busiest part of the night"] },
  { name:"PAUL / RADIOS", subject:"Paul", prompt:"Make a compact film about the supplied radio details. Let the relationship between the radios, repair work and the desk create an earned interpretation.", facts:["Paul restores old radios","Paul repaired 17 radios this year","The first radio belonged to his grandfather","Paul keeps that radio on his desk"] },
  { name:"OLD GAS STATION / RECONTEXT", subject:"the old gas station", prompt:"Use the supplied place transformation. Let the old sign change how the coffee shop is seen. Do not invent history.", facts:["The gas station was closed for twenty years","A coffee shop opened inside","The original gas station sign still hangs above the door"] },
  { name:"RAVE / INTERRUPTION", subject:"the event", prompt:"Make the interruption itself matter. Find the relationship between silence, waiting and the restart without inventing the crowd's psychology.", facts:["Doors opened at 9 PM","The bass system failed at 11:20 PM","The crowd waited","The bass system returned","The DJ restarted exactly where the track had stopped"] },
  { name:"TOOLBOX / GENERATIONS", subject:"the red toolbox", prompt:"Make the object feel accumulated rather than sentimental. Let the replaced handle and generational use change what the object is worth noticing for.", facts:["The red toolbox was bought in 1998","The toolbox was used by the user's father","The toolbox is now used by the user","The handle has been replaced twice"] },
  { name:"DOG GROOMER / GROWTH", subject:"the dog groomer", prompt:"Make the business growth visible through concrete details. Find the tension between expansion and continuity; do not invent employees or customers.", facts:["The dog groomer started with one table","There are now three tables","The same old metal scissors are still used from opening day"] },
  { name:"TRAVEL / RETURN", subject:"the overlook", prompt:"This is a return visit. Find what is newly meaningful without replaying the first visit. The old bench must matter differently this time.", returning:true, memoryContext:["The overlook was visited once before at sunset","The old bench was already there"], facts:["The overlook was reached in fog this time","The old bench was still there","A new trail marker stood beside the bench","The fog lifted after the bench was passed"] },
];

const INTERNAL = /\b(?:cognition|planner|candidate|trajectory|viewer|audience|compiler|realizer|provenance|semantic turn|latent movie|creative opportunity|evidence id)\b/i;
const EXPLANATION = /\b(?:this means|which means|the point is|the meaning is|in other words|this shows|which shows|because this|the relationship between|changes what is worth noticing|let the supplied detail)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|worth noticing|it was meaningful|it was special)\.?$/i;
const SUBJECT_LEAD = (text:string, subject:string):boolean => { const escaped = subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"); return new RegExp(`^(?:the|a|an)?\\s*${escaped}(?:\\b|:)`, "i").test(text.trim()); };
const tokens=(text:string):Set<string>=>new Set((text.toLowerCase().match(/\b[\w’'-]+\b/g)??[]).filter(t=>t.length>2));
const overlap=(left:string,right:string):number=>{const a=tokens(left),b=tokens(right);if(!a.size||!b.size)return 0;let hits=0;for(const t of a)if(b.has(t))hits+=1;return hits/Math.max(1,a.size)};
function words(text:string):number{return (text.match(/\b[\w’'-]+\b/g)??[]).length}
function fail(message:string):never{throw new Error(`SUPERINTELLIGENCE LAB FAILED: ${message}`)}
function relationBridge(result:Awaited<ReturnType<typeof authorBrainCanonical>>):boolean{return result.scenes.some((scene)=>new Set(result.sequence.cuts.find(c=>c.order===result.scenes.indexOf(scene)+1)?.sourceIds??[]).size>=2)}
function earnedLanding(result:Awaited<ReturnType<typeof authorBrainCanonical>>,facts:string[]):boolean{const last=result.scenes.at(-1);if(!last||words(last.text)>7||EXPLANATION.test(last.text)||INTERNAL.test(last.text)||GENERIC.test(last.text))return false;if(result.scenes.length<2||result.world.events.length<2)return false;const finalIds=new Set(result.sequence.cuts.at(-1)?.sourceIds??[]);if(finalIds.size<2)return false;return overlap(last.text,facts.join(" "))<0.85}
function formVariation(result:Awaited<ReturnType<typeof authorBrainCanonical>>):number{const texts=result.scenes.map(s=>s.text.trim());if(texts.length<3)return 1;const starts=new Set(texts.map(t=>t.split(/\s+/)[0]?.toLowerCase()).filter(Boolean));const lengths=new Set(texts.map(t=>words(t)));const kinds=new Set(result.scenes.map(s=>s.kind));return (Math.min(1,starts.size/texts.length)+Math.min(1,lengths.size/texts.length)+Math.min(1,kinds.size/texts.length))/3}

const rendered:string[]=[];

for(const test of cases){
  const result=await authorBrainCanonical({prompt:`${ARTIST_CHARTER}\n\n${test.prompt}`,subject:test.subject,facts:test.facts,sourceMoments:test.facts,memoryContext:test.memoryContext??[],creativeLearningContext:[],returning:test.returning,lens:test.lens});
  const texts=result.scenes.map(scene=>scene.text);
  const filmJudge=result.diagnostics.realizedFilmJudge;

  console.log(`\n================ ${test.name} ================`);
  console.log("READOUT\n"+result.readout.text);
  console.log("\nWHAT QRE PICKED");
  console.log(`Movie: ${result.movie?.id??"NONE"}`);
  console.log(`Lens: ${result.movie?.lens??"NONE"}`);
  console.log(`Candidates: ${result.diagnostics.candidateSequences}`);
  console.log(`Accepted candidates: ${result.diagnostics.acceptedCandidates}`);
  console.log(`Movie score: ${result.diagnostics.experienceJudge?.score??0}`);
  console.log(`Visible-art score: ${filmJudge?.score??0}`);
  console.log(`Semantic gate: ${result.diagnostics.semanticGate?.accepted?"PASS":"FAIL"}`);
  console.log(`Movie Judge: ${result.diagnostics.experienceJudge?.accepted?"PASS":"FAIL"}`);
  console.log(`Visible-art Judge: ${filmJudge?.accepted?"PASS":"FAIL"}`);
  console.log(`Model: ${result.diagnostics.model}`);
  console.log(`Visible bridge: ${relationBridge(result)?"PASS":"FAIL"}`);
  console.log(`Earned artistic landing: ${earnedLanding(result,test.facts)?"PASS":"FAIL"}`);
  console.log(`Form variation: ${formVariation(result).toFixed(3)}`);
  if(filmJudge) console.log("VISIBLE-ART DIMENSIONS\n"+JSON.stringify(filmJudge.dimensions,null,2));
  console.log("\nMOVIE THESIS");
  console.log(result.movie?.hypothesis?.join("\n")??"NONE");
  console.log("\nFINAL FILM");
  if(!texts.length)console.log("<NO REALIZED FILM>");
  texts.forEach((text,index)=>console.log(`${index+1}. ${text}`));
  console.log("\nPROVENANCE");
  result.sequence.cuts.forEach(cut=>console.log(`${cut.order}: ${cut.sourceIds.join(", ")}`));
  console.log("\nREJECTED / ATTACKED");
  console.log(JSON.stringify(result.diagnostics.rejectedCandidates.slice(0,6),null,2));

  if(!result.movie)fail(`${test.name}: no Movie selected`);
  if(!result.diagnostics.complete||!result.diagnostics.renderable)fail(`${test.name}: not renderable`);
  if(!result.sequence.cuts.length)fail(`${test.name}: empty sequence`);
  if(result.sequence.cuts.some(cut=>cut.sourceIds.length===0))fail(`${test.name}: provenance lost`);
  if(result.diagnostics.model==="fallback")fail(`${test.name}: no local model realization available; lab refuses deterministic fallback as gold`);
  if(result.diagnostics.selectedScore<0.68)fail(`${test.name}: visible-art score below final gold floor (${result.diagnostics.selectedScore})`);
  if(!filmJudge?.accepted)fail(`${test.name}: visible-art judge rejected the rendered film`);
  if((filmJudge?.dimensions.artisticTransformation??0)<0.35)fail(`${test.name}: insufficient artistic transformation`);
  if((filmJudge?.dimensions.sourceCopyRisk??1)>=0.5)fail(`${test.name}: source-copy risk too high`);
  if(texts.some(text=>INTERNAL.test(text)||EXPLANATION.test(text)||GENERIC.test(text)))fail(`${test.name}: internal/explanatory/generic language leaked into visible creation`);
  if(texts.some(text=>words(text)>24))fail(`${test.name}: Mouth cut exceeded 24 words`);
  if(texts.length>=2&&texts.every(text=>SUBJECT_LEAD(text,test.subject)))fail(`${test.name}: subject-led author template collapse`);
  if(texts.length>=3&&texts.filter(text=>SUBJECT_LEAD(text,test.subject)).length/texts.length>0.5)fail(`${test.name}: subject dominates more than half the film`);
  if(texts.length>=3&&formVariation(result)<0.45)fail(`${test.name}: visible form collapsed into repetitive cut grammar`);
  if(test.facts.length>=2&&!relationBridge(result))fail(`${test.name}: no visible scene bridges multiple supplied facts`);
  if(test.facts.length>=2&&!earnedLanding(result,test.facts))fail(`${test.name}: final scene is not an earned interpretive landing`);

  rendered.push(texts.join(" "));
}

const normalized=rendered.map(text=>text.toLowerCase().replace(/\W+/g," ").trim());
const uniqueOutputs=new Set(normalized).size;
if(uniqueOutputs<Math.ceil(cases.length*0.8))fail(`cross-world collapse: ${uniqueOutputs}/${cases.length}`);
console.log("\n============================================================");
console.log(`SUPERINTELLIGENCE LAB: PASS (${cases.length} worlds, ${uniqueOutputs} materially unique outputs)`);
console.log("REALITY → READOUT → UNDERSTAND → NOTICE → COMPETE → ATTACK → JUDGE → MOVIE → MOUTH → VISIBLE-ART JUDGE → EXPERIENCE");
