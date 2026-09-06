import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type Case = { name: string; subject: string; prompt: string; facts: string[]; lens?: string; returning?: boolean; memoryContext?: string[] };

const ARTIST_CHARTER = [
  "The subject is a factual referent, never a default narrator.",
  "Do not begin every cut with the subject name. Grammar may center an object, place, time, action, fragment, collision, or omission when supplied reality supports it.",
  "Do not write one sentence per fact. Make supplied details interact.",
  "Do not explain an interpretation. Make the relationship felt.",
  "Do not use generic cinematic filler or pretend a metaphor literally happened.",
  "The film's form must be earned by this reality. Do not force the same opening, beat count, sentence shape, or ending shape across worlds.",
  "A tiny film may be 2 cuts. A richer reality may need many more. Length is earned by the creative idea and the amount of living material available.",
  "Prefer compression, surprise, humor, juxtaposition, implication, metaphor, callback, escalation or silence over narration when they make the piece better.",
  "Semantic truth is immutable; client wording is not. Transform the language without changing literal reality.",
  "CREATE SOMETHING WORTH WATCHING. Take creative risks. Make boring material entertaining when the supplied details support it.",
].join("\n");

const cases: Case[] = [
  { name:"COCO / GROOMING", subject:"Coco", prompt:"Make a tiny replayable film from what actually happened. Coco is framed here as fierce. Compare the supplied details and let an earned artistic interpretation land. Do not explain the meaning.", facts:["Coco arrived for a grooming appointment at 10 AM","Coco hates the dryer","The dryer had to be used after the bath","Coco stole an apple from the counter","The apple was taken before the groom was finished","Coco wore a blue bow home","Coco left after grooming was completed","The blue bow was still on when Coco left"] },
  { name:"MARIA / HOUSE RESET", subject:"Maria", prompt:"Make the house reset watchable. Treat the cleaning run like a small campaign when the reality earns it: stages, obstacles, territory, a boss room, a speedrun, a final hit, or a win can all be useful metaphors. The battleish energy should come from the actual sequence of work, not invented events. Do not turn it into a checklist.", facts:["Maria started cleaning at 9:04 AM","Maria cleared the kitchen counters","Maria cleaned the sink","Maria cleaned the stove","Maria cleaned bathroom one","Maria cleaned bathroom two","Maria changed the towels in both bathrooms","Maria emptied the kitchen trash","Maria vacuumed the main floor","Maria finished at 11:47 AM"] },
  { name:"RESTAURANT / SERVICE", subject:"the restaurant", prompt:"Find the most entertaining relationship in this shift. The interruption should alter what the viewer notices. The result can be funny, tense, absurd, elegant, or unexpectedly dramatic.", facts:["The restaurant opened at 5 PM","The first table ordered oysters","Two more tables arrived within ten minutes","The fryer stopped working","The kitchen switched to other dishes while the fryer was down","The fryer returned before dessert service","Dessert service began at 9 PM","Dessert service became the busiest part of the night"] },
  { name:"PAUL / RADIOS", subject:"Paul", prompt:"Make a compact film about the supplied radio details. Let the relationship between repair, inheritance, repetition and the desk create something worth remembering.", facts:["Paul restores old radios","Paul repaired 17 radios this year","The first radio belonged to his grandfather","The first radio still works","Paul keeps that radio on his desk","Paul repaired its tuning knob himself","The desk radio is the one radio Paul never sells","A newer radio sits beside it"] },
  { name:"OLD GAS STATION / RECONTEXT", subject:"the old gas station", prompt:"Use the supplied place transformation. Let the old sign change how the coffee shop is seen. Do not invent history.", facts:["The gas station was closed for twenty years","The pumps were removed","A coffee shop opened inside the old building","The original gas station sign still hangs above the door","The old concrete forecourt is still outside","Customers enter through the former service entrance","The coffee counter now occupies the former sales floor"] },
  { name:"RAVE / INTERRUPTION", subject:"the event", prompt:"Make the interruption itself matter. Find the relationship between silence, waiting and the restart without inventing crowd psychology. Humor, suspense, absurdity or weirdness are available.", facts:["Doors opened at 9 PM","The first set began at 10 PM","The bass system failed at 11:20 PM","The room went quiet","The crowd waited","The bass system returned at 11:34 PM","The DJ restarted exactly where the track had stopped","The next track began immediately after the restart"] },
  { name:"TOOLBOX / GENERATIONS", subject:"the red toolbox", prompt:"Make the object feel accumulated rather than sentimental. Let the replaced handle and generational use change what the object is worth noticing for.", facts:["The red toolbox was bought in 1998","The toolbox was used by the user's father","The toolbox is now used by the user","The handle has been replaced twice","The original latches are still attached","The toolbox is kept in the garage","A paint mark from the first owner is still on the lid","The toolbox is opened most Saturdays"] },
  { name:"DOG GROOMER / GROWTH", subject:"the dog groomer", prompt:"Make the business growth visible through concrete details. Find the tension between expansion and continuity. Do not invent employees or customers.", facts:["The dog groomer started with one table","The first table is still in the shop","There are now three tables","The shop moved into a larger space","The same old metal scissors are still used from opening day","A second dryer was added after the move","The original front sign was taken to the new space","The business still opens with the same first appointment ritual"] },
  { name:"TRAVEL / RETURN", subject:"the overlook", prompt:"This is a return visit. Find what is newly meaningful without replaying the first visit. The old bench must matter differently this time.", returning:true, memoryContext:["The overlook was visited once before at sunset","The old bench was already there","The old trail had no marker at the bench"], facts:["The overlook was reached in fog this time","The old bench was still there","A new trail marker stood beside the bench","The trail marker was not there on the earlier visit","The fog lifted after the bench was passed","The overlook appeared after the fog cleared","The bench remained visible from the overlook"] },
];

const INTERNAL = /\b(?:cognition|planner|candidate|trajectory|compiler|realizer|semantic turn|latent movie|creative opportunity|evidence id)\b/i;
const EXPLANATION = /\b(?:this means|which means|the point is|the meaning is|in other words|this shows|which shows|because this|changes what is worth noticing|let the supplied detail)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|worth noticing|it was meaningful|it was special)\.?$/i;
function words(text:string):number{return (text.match(/\b[\w’'-]+\b/g)??[]).length}
function fail(message:string):never{throw new Error(`SUPERINTELLIGENCE LAB FAILED: ${message}`)}

const rendered:string[]=[];

for(const test of cases){
  const result=await authorBrainCanonical({prompt:`${ARTIST_CHARTER}\n\n${test.prompt}`,subject:test.subject,facts:test.facts,sourceMoments:test.facts,memoryContext:test.memoryContext??[],creativeLearningContext:[],returning:test.returning,lens:test.lens});
  const texts=result.scenes.map(scene=>scene.text);
  const filmJudge=result.diagnostics.realizedFilmJudge;

  console.log(`\n================ ${test.name} ================`);
  console.log(`FACT PALETTE: ${test.facts.length} supplied facts`);
  console.log("READOUT\n"+result.readout.text);
  console.log("\nWHAT QRE PICKED");
  console.log(`Movie: ${result.movie?.id??"NONE"}`);
  console.log(`Lens: ${result.movie?.lens??"NONE"}`);
  console.log(`Candidates discovered: ${result.diagnostics.candidateSequences}`);
  console.log(`Artist received candidates: ${result.diagnostics.acceptedCandidates}`);
  console.log(`Artist-selected Movie score (diagnostic): ${result.movie?.score??0}`);
  console.log(`Artist artifact diagnostics: ${filmJudge?.score??0} (NON-BLOCKING)`);
  console.log(`Selection authority: ARTIST`);
  console.log(`Model: ${result.diagnostics.model}`);
  console.log("\nFINAL FILM — ARTIST'S CHOICE");
  if(!texts.length)console.log("<NO REALIZED FILM>");
  texts.forEach((text,index)=>console.log(`${index+1}. ${text}`));
  console.log("\nPROVENANCE");
  result.sequence.cuts.forEach(cut=>console.log(`${cut.order}: ${cut.sourceIds.join(", ")}`));
  console.log("\nCREATIVE TELEMETRY (OBSERVATION ONLY)");
  if(filmJudge) console.log(JSON.stringify(filmJudge.dimensions,null,2));
  console.log("\nCREATION NOTES");
  console.log(`Supplied facts: ${test.facts.length}`);
  console.log(`Produced cuts: ${texts.length}`);
  if(test.facts.length>=7 && texts.length<4) console.log("NOTE: rich reality produced a compact film; this is not a failure because length is artist-determined.");

  if(!result.movie)fail(`${test.name}: no Movie selected`);
  if(!result.diagnostics.complete||!result.diagnostics.renderable)fail(`${test.name}: not renderable`);
  if(!result.sequence.cuts.length)fail(`${test.name}: empty sequence`);
  if(result.sequence.cuts.some(cut=>cut.sourceIds.length===0))fail(`${test.name}: provenance lost`);
  if(result.diagnostics.model==="fallback")fail(`${test.name}: no local model realization available`);
  if(texts.some(text=>INTERNAL.test(text)||EXPLANATION.test(text)||GENERIC.test(text)))fail(`${test.name}: internal/explanatory/generic language leaked into visible creation`);
  if(texts.some(text=>words(text)>40))fail(`${test.name}: Mouth cut exceeded 40 words`);

  rendered.push(texts.join(" "));
}

const normalized=rendered.map(text=>text.toLowerCase().replace(/\W+/g," ").trim());
const uniqueOutputs=new Set(normalized).size;
if(uniqueOutputs<Math.ceil(cases.length*0.8))fail(`cross-world collapse: ${uniqueOutputs}/${cases.length}`);
console.log("\n============================================================");
console.log(`SUPERINTELLIGENCE LAB: PASS (${cases.length} worlds, ${uniqueOutputs} materially unique outputs)`);
console.log("REALITY → READOUT → UNDERSTAND → NOTICE → ARTIST EXPLORES → ARTIST CHOOSES → REALITY-INTEGRITY → EXPERIENCE");
