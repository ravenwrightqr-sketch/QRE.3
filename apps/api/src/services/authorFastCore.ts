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
const PROVIDER_TERMS=/\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|tech|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const PROVIDER_SPOKEN=/\b(?:says?|asks?|replies?|answers?|sighs?|laughs?|smiles?|whispers?|shouts?|yells?|"|'|“|”)\b/i;
const clean=(v:unknown)=>String(v??"").replace(/\s+/g," ").trim();
const uniq=(xs:unknown[])=>[...new Set(xs.map(clean).filter(Boolean))];
function json<T>(text:string):T|null{const s=String(text??"").replace(/^```(?:json)?/i,"").replace(/```$/i,"").trim();try{return JSON.parse(s) as T}catch{return null}}
function debug(label:string,text:string){if(process.env.QRE_AUTHOR_DEBUG_RAW==="true")console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`)}
function unsupportedPronoun(text:string,input:Input){const source=[...input.facts,...input.sourceMoments,...(input.memoryContext??[])].join(" ");if(/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source))return false;return /\b(he|him|his|her|hers)\b/i.test(text)}
function invalid(text:string){return FORCED_CINEMA.test(text)||CHEESE.test(text)||GENERIC.some(p=>p.test(text))}
function weakFragment(text:string){const w=text.split(/\s+/).filter(Boolean);if(w.length>=4)return false;if(/[?!.]$/.test(text)&&w.length>=2)return false;return CHOPPED.test(text)}
function splitDraftText(text:string):Scene[]{
 const lines=String(text??"").split(/\n+/).map(line=>line.replace(/^\s*(?:\d+[.)-]|[-*•])\s*/,"").trim()).filter(Boolean);
 return lines.length>1?lines.map((line)=>({text:line,kind:"line"})):lines.length===1?[{text:lines[0],kind:"line"}]:[];
}
function extractScenes(raw:unknown):Scene[]{
 if(Array.isArray(raw))return raw as Scene[];
 if(raw&&typeof raw==="object"){
   const value=raw as {scenes?:unknown;text?:unknown;lines?:unknown[]};
   if(Array.isArray(value.scenes))return value.scenes as Scene[];
   if(Array.isArray(value.lines))return value.lines.map((line)=>({text:clean(line),kind:"line"}));
   if(typeof value.text==="string")return splitDraftText(value.text);
 }
 return [];
}

export async function authorFast(input:Input):Promise<{plan:Plan;scenes:Scene[]}>
{
 const serviceLike=/\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|tattoo|restaurant|client|customer)\b/i.test(`${input.prompt} ${input.lens??""}`);
 const source={prompt:input.prompt,lens:input.lens??"",subject:input.subject??"",facts:uniq(input.facts),sourceMoments:uniq(input.sourceMoments),memoryContext:uniq(input.memoryContext??[]),creativeLearningContext:uniq(input.creativeLearningContext??[]),trajectory:uniq(input.trajectory??[]),serviceLike};
 const fallbackAttention:AttentionState={currentWant:"know what happens next",currentExpectation:"the next line will complicate the situation",openLoop:"an unresolved character pressure",predictedNext:"the pressure sharpens",surpriseTarget:"an earned reframe",emotionalState:"curious",payoffProximity:"building",residue:"a small unresolved desire for another chapter"};
 const fallback:Plan={angle:"character-specific contradiction",tension:"the character meets the recurring situation on different terms",movement:"hook → pressure → character turn → consequence",payoff:"the character gets the last word",antiRepeat:"generic transformation language, mechanical name repetition, unsupported events, provider-as-protagonist",beatCount:input.prompt.toLowerCase().includes("living memory")||input.prompt.toLowerCase().includes("chapter")?4:5,beatJobs:[
  {job:"establish the charged subject situation",attention:"create immediate curiosity",grounding:"use only supplied reality; service provider stays background unless sourced",payoffLink:"plant final character consequence",viewerWant:"what happens now?",loopState:"open"},
  {job:"sharpen the subject's stance",attention:"make next cut necessary",grounding:"no invented provider action",payoffLink:"increase pressure",viewerWant:"how will the subject respond?",loopState:"transform"},
  {job:"change the terms through the subject's perspective",attention:"surprise or reframe",grounding:"transform supplied detail without fabricating events",payoffLink:"set up payoff",viewerWant:"what does this mean now?",loopState:"open"},
  {job:"land a subject-specific payoff",attention:"make ending satisfying",grounding:"earned from supplied world",payoffLink:"final consequence",viewerWant:"what does this reveal or leave me wanting?",loopState:"pay"},
 ],attention:fallbackAttention};
 const planResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's universal senior creative director, beat architect, and viewer-attention strategist.",
  "The subject is the temporary star. The input/domain is the stage and source of reality.",
  "SERVICE RULE: service providers are invisible infrastructure by default. Do NOT invent a groomer, cleaner, technician, owner, worker, staff member, dialogue, or provider action unless the source explicitly makes that person/event part of the story.",
  "Privately generate genuinely different movies, attack them, and choose one specific champion relationship/game/contradiction/ritual/status negotiation/obsession/escalation.",
  "Never settle for abstract themes such as transformation, affection, love, happiness, adventure, memory, fear, or connection.",
  "Model attention as state: current want, expectation, open loop, predicted next, surprise target, emotional state, payoff proximity, residue.",
  "Give every beat a concrete dramatic job, viewer want, grounding constraint, payoff link, and loop state.",
  "HARD REALITY: never infer gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, object placement, weather, or physical events absent from evidence.",
  "Return strict JSON with angle,tension,movement,payoff,antiRepeat,beatCount,beatJobs,attention.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("PLAN",planResult.text);
 const parsedPlan=json<Partial<Plan>>(planResult.text)??{};
 const jobs=Array.isArray(parsedPlan.beatJobs)?parsedPlan.beatJobs.map((j)=>({job:clean(j?.job),attention:clean(j?.attention),grounding:clean(j?.grounding),payoffLink:clean(j?.payoffLink),viewerWant:clean(j?.viewerWant),loopState:j?.loopState==="pay"||j?.loopState==="transform"?j.loopState:"open"})).filter(j=>j.job&&j.attention&&j.grounding&&j.payoffLink&&j.viewerWant):[];
 const parsedAttention=parsedPlan.attention&&typeof parsedPlan.attention==="object"?parsedPlan.attention as Partial<AttentionState>:{};
 const attention:AttentionState={...fallbackAttention,...Object.fromEntries(Object.entries(parsedAttention).map(([k,v])=>[k,clean(v)])) as Partial<AttentionState>};
 const plan:Plan={...fallback,...parsedPlan,angle:ABSTRACT_ANGLE.test(clean(parsedPlan.angle))?fallback.angle:clean(parsedPlan.angle||fallback.angle),beatJobs:jobs.length?jobs:fallback.beatJobs,attention};
 plan.beatCount=Math.max(4,Math.min(6,Number(plan.beatCount)||fallback.beatCount));
 plan.beatJobs=plan.beatJobs.slice(0,plan.beatCount); while(plan.beatJobs.length<plan.beatCount)plan.beatJobs.push(fallback.beatJobs[Math.min(plan.beatJobs.length,fallback.beatJobs.length-1)]);
 const draftResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's elite micro-beat mouth operating as an attention-control system. HARD MODE.",
  `Write EXACTLY ${plan.beatCount} viewer-facing lines as one coherent attention sequence.`,
  "SERVICE STORY MODE: the service is the invisible stage manager. The subject gets the spotlight. Never invent or foreground the provider as a character unless explicitly sourced.",
  "CORE LOOP: create wanting → partially satisfy → create stronger wanting → complicate → pay or transform → leave residue.",
  "Solve the planner's beat jobs in order. Do not invent a different movie.",
  "For each line, determine what the viewer wants NOW, then write the smallest natural expression that increases or pays that wanting. Length can vary; 2–4 words can be a killer hit, while another line may need 5–12+ words.",
  "A supplied fact can be transformed through the character's lens: object → threat, routine → game, ordinary work → personality, place → memory marker. Do not invent the physical event that would make the metaphor literal.",
  "Character is the movie. Avoid mechanical name repetition.",
  "HARD REALITY: no invented gender/pronouns, provider characters, dialogue, people, relationships, actions, object placement, locations, timestamps, outcomes, weather, or physical events absent from the source.",
  "NO CAMERA LANGUAGE. NO AI CHEESE. NO RECEIPT WRITING. NO THEME ANNOUNCEMENTS. NO GENERIC GOODBYE.",
  `CHAMPION ANGLE: ${plan.angle}`,
  `TENSION: ${plan.tension}`,
  `MOVEMENT: ${plan.movement}`,
  `PAYOFF: ${plan.payoff}`,
  `ATTENTION STATE: ${JSON.stringify(plan.attention)}`,
  `BEAT JOBS: ${JSON.stringify(plan.beatJobs)}`,
  "Return JSON only. Preferred shape: {scenes:[{text,kind}]}. Also accepted: {text:\"line 1\\nline 2\\nline 3\\nline 4\"}.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("DRAFT",draftResult.text);
 const parsedDraft=json<unknown>(draftResult.text);
 const rawScenes=extractScenes(parsedDraft);
 const scenes=rawScenes.map(s=>({text:clean(s.text),kind:clean(s.kind)||"line"})).filter(s=>s.text&&!META.test(s.text)&&!invalid(s.text)&&!unsupportedPronoun(s.text,input)).filter(s=>!weakFragment(s.text)).filter(s=>!PROVIDER_SPOKEN.test(s.text)&&!(serviceLike&&PROVIDER_TERMS.test(s.text))).filter((s,i,a)=>a.findIndex(x=>x.text.toLowerCase()===s.text.toLowerCase())===i).slice(0,6);
 return {plan,scenes};
}
