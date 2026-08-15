import { localModelGenerate } from "./localModelRuntime.js";

type Input={prompt:string;lens?:string;subject?:string;facts:string[];sourceMoments:string[];memoryContext?:string[];creativeLearningContext?:string[];trajectory?:string[]};
type BeatJob={job:string;attention:string;grounding:string;payoffLink:string};
type Plan={angle:string;tension:string;movement:string;payoff:string;antiRepeat:string;beatCount:number;beatJobs:BeatJob[]};
type Scene={text:string;kind?:string};

const GENERIC=[/still here/i,/something changes/i,/then it shifts/i,/see you next time/i,/quick zoom/i,/camera pulls back/i,/final shot/i,/eyes? (?:widen|sparkle)/i,/the power of (?:affection|love|friendship)/i,/transformation and affection/i,/a symbol of (?:love|bravery|affection|friendship)/i,/new routine/i,/cherished memory/i,/in (?:her|his|their) world/i];
const META=/\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const ABSTRACT_ANGLE=/^(transformation|affection|love|friendship|happiness|joy|adventure|memory|fun|fear|emotion|connection|journey)$/i;
const FORCED_CINEMA=/\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const CHEESE=/\b(?:tiny paws|heart softens|eyes sparkle|cherished|symbol of|power of|not so bad|suddenly,?)\b/i;
const CHOPPED=/^(?:\w+[',!?]?[ ]*){1,3}$/;
const clean=(v:unknown)=>String(v??"").replace(/\s+/g," ").trim();
const uniq=(xs:unknown[])=>[...new Set(xs.map(clean).filter(Boolean))];
function json<T>(text:string):T|null{const s=String(text??"").replace(/^```(?:json)?/i,"").replace(/```$/i,"").trim();try{return JSON.parse(s) as T}catch{return null}}
function debug(label:string,text:string){if(process.env.QRE_AUTHOR_DEBUG_RAW==="true")console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`)}
function unsupportedPronoun(text:string,input:Input){const source=[...input.facts,...input.sourceMoments,...(input.memoryContext??[])].join(" ");if(/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source))return false;return /\b(he|him|his|her|hers)\b/i.test(text)}
function invalid(text:string){return FORCED_CINEMA.test(text)||CHEESE.test(text)||GENERIC.some(p=>p.test(text))}
function weakFragment(text:string){const w=text.split(/\s+/).filter(Boolean);if(w.length>=4)return false;if(/[?!.]$/.test(text)&&w.length>=2)return false;return CHOPPED.test(text)}
function normalize(scenes:Scene[],input:Input){return scenes.map(s=>({text:clean(s.text),kind:clean(s.kind)||"movement"})).filter(s=>s.text&&!META.test(s.text)&&!invalid(s.text)&&!unsupportedPronoun(s.text,input)).filter(s=>!weakFragment(s.text)).filter((s,i,a)=>a.findIndex(x=>x.text.toLowerCase()===s.text.toLowerCase())===i).slice(0,6)}

export async function authorFast(input:Input):Promise<{plan:Plan;scenes:Scene[]}>{
 const source={prompt:input.prompt,lens:input.lens??"",subject:input.subject??"",facts:uniq(input.facts),sourceMoments:uniq(input.sourceMoments),memoryContext:uniq(input.memoryContext??[]),creativeLearningContext:uniq(input.creativeLearningContext??[]),trajectory:uniq(input.trajectory??[])};
 const planResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's senior creative director and beat architect. Find the latent movie inside supplied reality before prose.",
  "The character/subject is the center of gravity. The input is the world they experience. Make personality, contradiction, attitude, relationship, choice, consequence, or recurring history the creative engine.",
  "Privately generate genuinely different interpretations, attack them for genericness, unsupported invention, repetition, weak movement, and predictable payoff, then choose ONE champion.",
  "The champion angle must be specific to this character/world. Never use a one-word theme such as transformation, affection, love, happiness, adventure, memory, or connection.",
  "Think in relationship/game terms: recurring rivalry, friction, status negotiation, private ritual, contradiction, obsession, escalation, unexpected tenderness, or a character-specific rule.",
  "Then architect the sequence beat-by-beat. Each beat must have a distinct DRAMATIC JOB and a reason the viewer wants the next cut.",
  "Beat jobs should be concrete, such as: establish the charged situation, raise the question, sharpen the character's stance, change the terms, reverse the power, exploit a supplied detail, trigger the payoff, land the character consequence.",
  "Do NOT write candidate prose in the plan. Define the jobs the mouth must solve.",
  "Hard reality: gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, and physical events are usable only when supplied. Never infer them.",
  "Return JSON only with angle,tension,movement,payoff,antiRepeat,beatCount,beatJobs. beatJobs is an array with exactly beatCount objects: {job,attention,grounding,payoffLink}.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("PLAN",planResult.text);
 const fallback:Plan={angle:"character-specific contradiction",tension:"the character meets the recurring situation on different terms",movement:"hook → pressure → character turn → consequence",payoff:"the character gets the last word",antiRepeat:"generic transformation language, mechanical name repetition, unsupported events",beatCount:input.prompt.toLowerCase().includes("living memory")||input.prompt.toLowerCase().includes("chapter")?4:5,beatJobs:[
  {job:"establish the charged character situation",attention:"create immediate curiosity",grounding:"use only supplied reality",payoffLink:"plant the final consequence"},
  {job:"sharpen the conflict or question",attention:"make the next cut necessary",grounding:"do not invent an event",payoffLink:"increase pressure"},
  {job:"change the terms",attention:"deliver surprise or character turn",grounding:"transform supplied material, do not fabricate it",payoffLink:"set up payoff"},
  {job:"land the character-specific payoff",attention:"make the ending satisfying",grounding:"earned from the supplied world",payoffLink:"final consequence"},
 ]};
 const parsedPlan=json<Partial<Plan>>(planResult.text)??{};
 const jobs=Array.isArray(parsedPlan.beatJobs)?parsedPlan.beatJobs.map((j)=>({job:clean(j?.job),attention:clean(j?.attention),grounding:clean(j?.grounding),payoffLink:clean(j?.payoffLink)})).filter(j=>j.job&&j.attention&&j.grounding&&j.payoffLink):[];
 const plan:Plan={...fallback,...parsedPlan,angle:ABSTRACT_ANGLE.test(clean(parsedPlan.angle))?fallback.angle:clean(parsedPlan.angle||fallback.angle),beatJobs:jobs.length?jobs:fallback.beatJobs};
 plan.beatCount=Math.max(4,Math.min(6,Number(plan.beatCount)||fallback.beatCount));
 plan.beatJobs=plan.beatJobs.slice(0,plan.beatCount);
 while(plan.beatJobs.length<plan.beatCount)plan.beatJobs.push(fallback.beatJobs[Math.min(plan.beatJobs.length,fallback.beatJobs.length-1)]);
 const draftResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's elite micro-beat mouth. HARD MODE.",
  `Write EXACTLY ${plan.beatCount} lines as one coherent attention sequence.`,
  "This is a short-form living-memory experience. It is NOT a novel, essay, receipt, poem, or screenplay.",
  "Your job is LINE → PULL → LINE → PULL → PAYOFF. The viewer should feel an unanswered question or pressure after nearly every cut.",
  "CRITICAL: the planner already selected the movie and assigned a job to each beat. Do NOT invent a new angle. Solve the supplied beat jobs in order.",
  "Each line must perform its assigned dramatic job. Do not merely mention the nouns involved in the job.",
  "LANGUAGE RHYTHM: a killer short line may be 2–4 words. A fuller line may be 5–12+ words when it carries the dramatic job. Mix lengths intentionally. The rhythm should feel authored, not mechanically compressed.",
  "A good line can transform a supplied detail through the character's lens: fact → attitude, object → threat, routine → game, place → memory marker, ordinary work → personality. Do not invent a concrete event while doing this.",
  "The character is the center of gravity. Keep them present through attitude, resistance, choices, consequences, and history. Do not mechanically repeat the subject name.",
  "A hook like 'Bows? Again?' is only useful if the next line answers, complicates, escalates, or reframes that exact question. Do not abandon the hook.",
  "Do not turn the input into a chronological receipt. Do not list facts as beats.",
  "HARD REALITY: never invent gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, weather, object placement, or physical events absent from the source.",
  "NO CAMERA LANGUAGE. No camera, zoom, close-up, final shot, scene opens, screen directions, or decorative cinematography.",
  "NO AI CHEESE. No tiny paws, heart softens, eyes sparkle, cherished memory, symbol of love/bravery, power of affection, not so bad, sudden emotional resolution, or vague theme announcements.",
  "NO GENERIC ENDING. The payoff must be a consequence, reversal, joke, sting, victory, realization, callback, or memorable image earned by the champion angle.",
  `CHAMPION ANGLE: ${plan.angle}`,
  `TENSION: ${plan.tension}`,
  `MOVEMENT: ${plan.movement}`,
  `PAYOFF: ${plan.payoff}`,
  `ANTI-REPEAT: ${plan.antiRepeat}`,
  `BEAT JOBS: ${JSON.stringify(plan.beatJobs)}`,
  "Return JSON only: {scenes:[{text,kind}]}.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("DRAFT",draftResult.text);
 const parsed=json<{scenes?:Scene[]}>(draftResult.text);
 return {plan,scenes:normalize(Array.isArray(parsed?.scenes)?parsed.scenes:[],input)};
}
