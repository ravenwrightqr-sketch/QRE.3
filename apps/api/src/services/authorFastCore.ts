import { localModelGenerate } from "./localModelRuntime.js";

type Input={prompt:string;lens?:string;subject?:string;facts:string[];sourceMoments:string[];memoryContext?:string[];creativeLearningContext?:string[];trajectory?:string[]};
type BeatJob={job:string;attention:string;grounding:string;payoffLink:string;viewerWant:string;loopState:"open"|"pay"|"transform"};
type AttentionState={currentWant:string;currentExpectation:string;openLoop:string;predictedNext:string;surpriseTarget:string;emotionalState:string;payoffProximity:string;residue:string};
type Plan={angle:string;tension:string;movement:string;payoff:string;antiRepeat:string;beatCount:number;beatJobs:BeatJob[];attention:AttentionState};
type Scene={text:string;kind?:string};

const GENERIC=[/still here/i,/something changes/i,/then it shifts/i,/see you next time/i,/quick zoom/i,/camera pulls back/i,/final shot/i,/eyes? (?:widen|sparkle)/i,/the power of (?:affection|love|friendship)/i,/transformation and affection/i,/a symbol of (?:love|bravery|affection|friendship)/i,/new routine/i,/cherished memory/i,/in (?:her|his|their) world/i,/from fear to (?:joy|happiness)/i,/from scared to happy/i,/unexpected transformation/i,/fear and subsequent joy/i,/from fear to happiness/i];
const META=/\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const ABSTRACT=/^(transformation|affection|love|friendship|happiness|joy|adventure|memory|fun|fear|emotion|connection|journey|routine|trust|service|grooming)$/i;
const FORCED_CINEMA=/\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const CHEESE=/\b(?:tiny paws|heart softens|eyes sparkle|cherished|symbol of|power of|not so bad|suddenly,?|smiles? wide)\b/i;
const CHOPPED=/^(?:\w+[',!?]?[ ]*){1,3}$/;
const PROVIDER_TERMS=/\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|tech|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const PROVIDER_SPOKEN=/\b(?:says?|asks?|replies?|answers?|sighs?|laughs?|smiles?|whispers?|shouts?|yells?)\s+["“']/i;
const clean=(v:unknown)=>String(v??"").replace(/\s+/g," ").trim();
const uniq=(xs:unknown[])=>[...new Set(xs.map(clean).filter(Boolean))];
function json<T>(text:string):T|null{const s=String(text??"").replace(/^```(?:json)?/i,"").replace(/```$/i,"").trim();try{return JSON.parse(s) as T}catch{return null}}
function debug(label:string,text:string){if(process.env.QRE_AUTHOR_DEBUG_RAW==="true")console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`)}
function serviceLike(input:Input){return /\bservice|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|tattoo|restaurant|client|customer\b/i.test(`${input.prompt} ${input.lens??""}`)}
function sourceHasProvider(input:Input){return /\b(groomer|groomer'?s|cleaner|technician|barber|mechanic|owner|employee|provider|customer|client)\b/i.test([...input.facts,...input.sourceMoments,...(input.memoryContext??[])].join(" "))}
function unsupportedPronoun(text:string,input:Input){const source=[...input.facts,...input.sourceMoments,...(input.memoryContext??[])].join(" ");if(/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source))return false;return /\b(he|him|his|her|hers)\b/i.test(text)}
function invalid(text:string,input:Input){return META.test(text)||FORCED_CINEMA.test(text)||GENERIC.some(p=>p.test(text))||CHEESE.test(text)||unsupportedPronoun(text,input)||(!sourceHasProvider(input)&&PROVIDER_TERMS.test(text))}
function weakFragment(text:string){const w=text.split(/\s+/).filter(Boolean);if(w.length>=4)return false;if(/[?!.]$/.test(text)&&w.length>=2)return false;return CHOPPED.test(text)}
function splitDraftText(text:string):Scene[]{const lines=String(text??"").split(/\n+/).map(line=>line.replace(/^\s*(?:\d+[.)-]|[-*•])\s*/,"").trim()).filter(Boolean);return lines.length>1?lines.map(line=>({text:line,kind:"line"})):lines.length===1?[{text:lines[0],kind:"line"}]:[]}
function extractScenes(raw:unknown):Scene[]{if(Array.isArray(raw))return raw as Scene[];if(raw&&typeof raw==="object"){const value=raw as {scenes?:unknown;text?:unknown;lines?:unknown[]};if(Array.isArray(value.scenes))return value.scenes as Scene[];if(Array.isArray(value.lines))return value.lines.map(line=>({text:clean(line),kind:"line"}));if(typeof value.text==="string")return splitDraftText(value.text)}return[]}

export async function authorFast(input:Input):Promise<{plan:Plan;scenes:Scene[]}>
{
 const service=serviceLike(input);const providerExplicit=sourceHasProvider(input);
 const source={prompt:input.prompt,lens:input.lens??"",subject:input.subject??"",facts:uniq(input.facts),sourceMoments:uniq(input.sourceMoments),memoryContext:uniq(input.memoryContext??[]),creativeLearningContext:uniq(input.creativeLearningContext??[]),trajectory:uniq(input.trajectory??[]),serviceMode:service,providerExplicitlyPresent:providerExplicit};
 const living=input.prompt.toLowerCase().includes("living memory")||input.prompt.toLowerCase().includes("chapter");
 const fallbackAttention:AttentionState={currentWant:"know what happens next",currentExpectation:"the next line will complicate the situation",openLoop:"an unresolved character pressure",predictedNext:"the pressure sharpens",surpriseTarget:"an earned reframe",emotionalState:"curious",payoffProximity:"building",residue:"a small unresolved desire for another chapter"};
 const fallbackJobs:BeatJob[]=[
  {job:"establish a charged character cut",attention:"make the viewer ask a question immediately",grounding:"use one supplied detail; no invented event",payoffLink:"plant a loop that must be answered",viewerWant:"what happens now?",loopState:"open"},
  {job:"complicate the opening question",attention:"partially answer it while opening a stronger one",grounding:"stay inside supplied reality",payoffLink:"increase pressure",viewerWant:"how will the subject respond?",loopState:"transform"},
  {job:"change the terms through the character lens",attention:"deliver a reframe or surprise",grounding:"transform evidence; never fabricate a physical event",payoffLink:"set up payoff",viewerWant:"what does this mean now?",loopState:"open"},
  {job:"land the character-specific payoff",attention:"close the strongest loop and leave residue",grounding:"earned entirely from supplied reality",payoffLink:"make another chapter desirable",viewerWant:"what does this reveal or leave me wanting?",loopState:"pay"},
 ];
 const fallback:Plan={angle:"character-specific relationship or game",tension:"the subject meets the supplied situation on personal terms",movement:"hook → complicate → reframe → payoff",payoff:"a character-specific reversal, consequence, joke, victory, realization, callback, or image",antiRepeat:"themes, receipts, mechanical name repetition, invented provider actions, exhausted motifs",beatCount:living?4:5,beatJobs:fallbackJobs,attention:fallbackAttention};
 const planResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's universal senior creative director, attention architect, and beat editor.",
  "This is shared cognition for every domain. The subject is temporarily the star; the input/domain is the stage and factual world.",
  "SERVICE RULE: provider/business is invisible infrastructure by default. Do not invent a groomer, cleaner, technician, owner, worker, staff member, dialogue, or provider action unless the evidence explicitly contains it.",
  "Privately generate genuinely different movies. Attack each for genericness, predictability, repetition, unsupported invention, weak character agency, weak next-cut pressure, and weak payoff. Choose ONE specific champion.",
  "A champion is a relationship/game/contradiction/ritual/status negotiation/obsession/escalation. Themes like transformation, affection, happiness, fear, memory, trust, service, or grooming are not champion angles.",
  "ATTENTION IS STATE. Track currentWant, currentExpectation, openLoop, predictedNext, surpriseTarget, emotionalState, payoffProximity, and residue.",
  "Do not describe beat subjects such as 'grooming visit' or 'first treat' as jobs. Jobs must be viewer-facing dramatic actions: hook, complicate, reframe, escalate, reverse, reveal, callback, payoff.",
  "Each beat job must specify what it makes the viewer want next and how it connects to the final payoff.",
  "Hard reality: never infer gender/pronouns, people, relationships, locations, actions, object placement, outcomes, timestamps, weather, or physical events absent from evidence.",
  `For living-memory/chapter prompts, choose EXACTLY ${living?4:5} cuts unless the input contains an explicit reason to require another count.`,
  "Return strict JSON: angle,tension,movement,payoff,antiRepeat,beatCount,beatJobs,attention.",
  "beatJobs must contain objects with job,attention,grounding,payoffLink,viewerWant,loopState (open|transform|pay). attention must contain currentWant,currentExpectation,openLoop,predictedNext,surpriseTarget,emotionalState,payoffProximity,residue.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("PLAN",planResult.text);
 const raw=json<Partial<Plan>>(planResult.text)??{};
 const jobs=Array.isArray(raw.beatJobs)?raw.beatJobs.map((j:any)=>({job:clean(j?.job),attention:clean(j?.attention),grounding:clean(j?.grounding),payoffLink:clean(j?.payoffLink),viewerWant:clean(j?.viewerWant),loopState:j?.loopState==="pay"||j?.loopState==="transform"?j.loopState:"open"})).filter(j=>j.job&&j.attention&&j.grounding&&j.payoffLink&&j.viewerWant):[];
 const att=raw.attention&&typeof raw.attention==="object"?raw.attention as Partial<AttentionState>:{};
 const plan:Plan={...fallback,...raw,angle:ABSTRACT.test(clean(raw.angle))?fallback.angle:clean(raw.angle||fallback.angle),beatCount:living?4:Math.max(4,Math.min(6,Number(raw.beatCount)||fallback.beatCount)),beatJobs:jobs.length?jobs:fallbackJobs,attention:{...fallbackAttention,...Object.fromEntries(Object.entries(att).map(([k,v])=>[k,clean(v)])) as Partial<AttentionState>}};
 plan.beatJobs=plan.beatJobs.slice(0,plan.beatCount);while(plan.beatJobs.length<plan.beatCount)plan.beatJobs.push(fallbackJobs[Math.min(plan.beatJobs.length,fallbackJobs.length-1)]);
 const draftResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's universal micro-beat mouth. HARD MODE. You are splicing film, not writing sentences.",
  `Write EXACTLY ${plan.beatCount} CUTS. ONE CUT = ONE LINE = ONE camera-ready attention moment.`,
  "A line is not required to be grammatical. A fragment, question, declaration, image, or sentence is valid. The unit is the cut, not the sentence.",
  "RHYTHM: LINE → PULL → LINE → PULL → PAYOFF. Mix 2–4 word hits with fuller natural lines when needed. Never put several shots into one line.",
  "Each line must alter viewer wanting. Create, sharpen, partially satisfy, transform, or pay a loop. After every line there should be a reason to continue.",
  "A supplied detail can be transformed through the character lens: object → threat, routine → game, ordinary service → personality, place → memory marker, detail → metaphor. This is creative transformation, not factual invention.",
  "THE CHARACTER IS THE STAR. The service/event/job is the stage. Never make the provider the protagonist unless explicitly sourced.",
  "Do not repeat the subject's name mechanically. Use attitude, choices, resistance, consequence, history, implication, and callback.",
  "Do not list facts. Do not write chronological receipts. Do not write a paragraph chopped into lines.",
  "ONE MOVIE ONLY. Solve the selected beat jobs in order. Do not switch angles halfway through.",
  "HARD REALITY: no invented gender/pronouns, provider characters/dialogue, people, relationships, actions, object placement, locations, timestamps, outcomes, weather, or physical events absent from the source.",
  "NO CAMERA LANGUAGE. NO AI CHEESE. NO GENERIC THEME ANNOUNCEMENTS. NO GENERIC GOODBYE.",
  `CHAMPION ANGLE: ${plan.angle}`,
  `TENSION: ${plan.tension}`,
  `MOVEMENT: ${plan.movement}`,
  `PAYOFF: ${plan.payoff}`,
  `ATTENTION STATE: ${JSON.stringify(plan.attention)}`,
  `BEAT JOBS: ${JSON.stringify(plan.beatJobs)}`,
  "Return JSON as {scenes:[{text,kind}]} OR {text,kind} with newline-separated cuts. If using one text block, every newline is a distinct cut.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("DRAFT",draftResult.text);
 const parsed=json<unknown>(draftResult.text);const rawScenes=extractScenes(parsed);
 const scenes=rawScenes.map(s=>({text:clean(s.text),kind:clean(s.kind)||"line"})).filter(s=>s.text&&!META.test(s.text)&&!FORCED_CINEMA.test(s.text)&&!CHEESE.test(s.text)&&!GENERIC.some(p=>p.test(s.text))&&!unsupportedPronoun(s.text,input)).filter(s=>!weakFragment(s.text)).filter(s=>!(service&&!providerExplicit&&PROVIDER_TERMS.test(s.text))).filter(s=>!(service&&!providerExplicit&&PROVIDER_SPOKEN.test(s.text))).filter((s,i,a)=>a.findIndex(x=>x.text.toLowerCase()===s.text.toLowerCase())===i).slice(0,6);
 return {plan,scenes};
}
