import { localModelGenerate } from "./localModelRuntime.js";

type Input={prompt:string;lens?:string;subject?:string;facts:string[];sourceMoments:string[];memoryContext?:string[];creativeLearningContext?:string[];trajectory?:string[]};
type BeatJob={job:string;attention:string;grounding:string;payoffLink:string;viewerWant:string;loopState:"open"|"pay"|"transform"};
type AttentionState={currentWant:string;currentExpectation:string;openLoop:string;predictedNext:string;surpriseTarget:string;emotionalState:string;payoffProximity:string;residue:string};
type Plan={angle:string;tension:string;movement:string;payoff:string;antiRepeat:string;beatCount:number;beatJobs:BeatJob[];attention:AttentionState};
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

export async function authorFast(input:Input):Promise<{plan:Plan;scenes:Scene[]}>{
 const serviceLike=/\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|tattoo|restaurant|client|customer)\b/i.test(`${input.prompt} ${input.lens??""}`);
 const source={prompt:input.prompt,lens:input.lens??"",subject:input.subject??"",facts:uniq(input.facts),sourceMoments:uniq(input.sourceMoments),memoryContext:uniq(input.memoryContext??[]),creativeLearningContext:uniq(input.creativeLearningContext??[]),trajectory:uniq(input.trajectory??[]),serviceLike};
 const planResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's senior creative director, beat architect, and viewer-attention strategist. Find the latent movie inside supplied reality before prose.",
  "The character/subject is the center of gravity. The input is the world they experience. Make personality, contradiction, attitude, relationship, choice, consequence, or recurring history the creative engine.",
  "When this is a service experience, the service is the enabling stage, not automatically a character. Temporarily make the subject the star; keep provider/customer actions invisible unless explicitly sourced.",
  "Privately generate genuinely different interpretations, attack them for genericness, unsupported invention, repetition, weak movement, and predictable payoff, then choose ONE champion.",
  "The champion angle must be specific to this character/world. Never use a one-word theme such as transformation, affection, love, happiness, adventure, memory, or connection.",
  "Then model viewer attention as a state, not a slogan. Identify: what the viewer wants NOW, what they expect next, what loop is open, what they predict, what surprise would be satisfying, what emotional state is active, how close the payoff is, and what residue should remain afterward.",
  "Every beat must deliberately change that attention state. A beat should close, deepen, twist, or open a loop. Never leave the viewer with nothing to want.",
  "Build beat jobs concrete enough for a mouth to solve: job, attention, grounding, payoff link, viewerWant, and loopState.",
  "Use attention types such as curiosity, anticipation, laugh, threat, recognition, empathy, surprise, status question, emotional payoff, or discovery where appropriate.",
  "Hard reality: gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, and physical events are usable only when supplied. Never infer them.",
  "Return JSON only: {angle,tension,movement,payoff,antiRepeat,beatCount,beatJobs,attention}. beatJobs must contain exactly beatCount objects. attention must contain currentWant,currentExpectation,openLoop,predictedNext,surpriseTarget,emotionalState,payoffProximity,residue.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("PLAN",planResult.text);
 const fallbackAttention:AttentionState={currentWant:"know what happens next",currentExpectation:"the next line will complicate the situation",openLoop:"an unresolved character pressure",predictedNext:"the pressure sharpens",surpriseTarget:"an earned reframe",emotionalState:"curious",payoffProximity:"building",residue:"a small unresolved desire for another chapter"};
 const fallback:Plan={angle:"character-specific contradiction",tension:"the character meets the recurring situation on different terms",movement:"hook → pressure → character turn → consequence",payoff:"the character gets the last word",antiRepeat:"generic transformation language, mechanical name repetition, unsupported events, provider-as-protagonist",beatCount:input.prompt.toLowerCase().includes("living memory")||input.prompt.toLowerCase().includes("chapter")?4:5,beatJobs:[
  {job:"establish the charged subject situation",attention:"create immediate curiosity",grounding:"use only supplied reality; service provider stays background unless sourced",payoffLink:"plant final character consequence",viewerWant:"what happens now?",loopState:"open"},
  {job:"sharpen the subject's stance",attention:"make next cut necessary",grounding:"no invented provider action",payoffLink:"increase pressure",viewerWant:"how will the subject respond?",loopState:"transform"},
  {job:"change the terms through the subject's perspective",attention:"surprise or reframe",grounding:"transform supplied detail without fabricating events",payoffLink:"set up payoff",viewerWant:"what does this mean now?",loopState:"open"},
  {job:"land a subject-specific payoff",attention:"make ending satisfying",grounding:"earned from supplied world",payoffLink:"final consequence",viewerWant:"what does this reveal or leave me wanting?",loopState:"pay"},
 ],attention:fallbackAttention};
 const parsedPlan=json<Partial<Plan>>(planResult.text)??{};
 const jobs=Array.isArray(parsedPlan.beatJobs)?parsedPlan.beatJobs.map((j)=>({job:clean(j?.job),attention:clean(j?.attention),grounding:clean(j?.grounding),payoffLink:clean(j?.payoffLink),viewerWant:clean(j?.viewerWant),loopState:j?.loopState==="pay"||j?.loopState==="transform"?j.loopState:"open"})).filter(j=>j.job&&j.attention&&j.grounding&&j.payoffLink&&j.viewerWant):[];
 const parsedAttention=parsedPlan.attention&&typeof parsedPlan.attention==="object"?parsedPlan.attention as Partial<AttentionState>:{};
 const attention:AttentionState={...fallbackAttention,...Object.fromEntries(Object.entries(parsedAttention).map(([k,v])=>[k,clean(v)])) as Partial<AttentionState>};
 const plan:Plan={...fallback,...parsedPlan,angle:ABSTRACT_ANGLE.test(clean(parsedPlan.angle))?fallback.angle:clean(parsedPlan.angle||fallback.angle),beatJobs:jobs.length?jobs:fallback.beatJobs,attention};
 plan.beatCount=Math.max(4,Math.min(6,Number(plan.beatCount)||fallback.beatCount));
 plan.beatJobs=plan.beatJobs.slice(0,plan.beatCount);
 while(plan.beatJobs.length<plan.beatCount)plan.beatJobs.push(fallback.beatJobs[Math.min(plan.beatJobs.length,fallback.beatJobs.length-1)]);
 const draftResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's elite micro-beat mouth operating as an attention-control system. HARD MODE.",
  `Write EXACTLY ${plan.beatCount} lines as one coherent attention sequence.`,
  "This is not a novel, essay, receipt, poem, or screenplay. The goal is a renewable attention loop.",
  "CORE LOOP: create wanting → partially satisfy it → create a stronger want → complicate → pay/reframe → leave residue that makes another beat/chapter desirable.",
  "The planner already selected the movie and assigned every beat job. Solve those jobs; do not invent a different angle.",
  "For each line, mentally answer: WHAT DOES THE VIEWER WANT NOW? Then write the minimum natural language that increases that wanting or pays the right loop.",
  "LOOP STATES: OPEN a question/want; TRANSFORM it into a better question/want; PAY it with consequence, surprise, recognition, laughter, awe, or a character-specific payoff. Do not close every loop immediately.",
  "PREDICTION MATTERS: the strongest surprise is 'I did not expect that, but of course.' Build from supplied evidence so the surprise feels earned.",
  "RECOGNITION MATTERS: callbacks should reward memory, then evolve the expectation instead of replaying it unchanged.",
  "RHYTHM MATTERS: a killer short line can be 2–4 words; another line can be 5–12+ words. Vary length and density so attention gets spikes and breathing room. Never make every line tiny.",
  "CHARACTER IS THE MOVIE. The service/event/place is the stage. Character presence comes through attitude, choices, resistance, consequences, history, and perspective—not name repetition.",
  "A supplied detail may be transformed through the character's lens: object → threat, routine → game, ordinary work → personality, place → memory marker. Do not invent a concrete event while doing this.",
  "HARD REALITY: never invent gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, weather, object placement, provider actions, or physical events absent from the source.",
  "NO CAMERA LANGUAGE and NO AI CHEESE.",
  "NO RECEIPT WRITING. NO THEME ANNOUNCEMENTS. NO GENERIC GOODBYE.",
  "The final line should both pay the current sequence and leave a residue: a callback, unresolved possibility, new status, emotional after-image, or curiosity for another chapter.",
  `CHAMPION ANGLE: ${plan.angle}`,
  `TENSION: ${plan.tension}`,
  `MOVEMENT: ${plan.movement}`,
  `PAYOFF: ${plan.payoff}`,
  `ANTI-REPEAT: ${plan.antiRepeat}`,
  `ATTENTION STATE: ${JSON.stringify(plan.attention)}`,
  `BEAT JOBS: ${JSON.stringify(plan.beatJobs)}`,
  "Return JSON only: {scenes:[{text,kind}]}.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("DRAFT",draftResult.text);
 const parsed=json<{scenes?:Scene[]}>(draftResult.text);
 const scenes=Array.isArray(parsed?.scenes)?parsed.scenes:[];
 return {plan,scenes:scenes.map(s=>({text:clean(s.text),kind:clean(s.kind)||"line"})).filter(s=>s.text&&!META.test(s.text)&&!invalid(s.text)&&!unsupportedPronoun(s.text,input)).filter((s,i,a)=>a.findIndex(x=>x.text.toLowerCase()===s.text.toLowerCase())===i).slice(0,6)};
}
