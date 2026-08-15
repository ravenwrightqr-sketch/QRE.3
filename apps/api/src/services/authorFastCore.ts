import { localModelGenerate } from "./localModelRuntime.js";

type Input={prompt:string;lens?:string;subject?:string;facts:string[];sourceMoments:string[];memoryContext?:string[];creativeLearningContext?:string[];trajectory?:string[]};
type Plan={angle:string;tension:string;movement:string;payoff:string;antiRepeat:string;beatCount:number};
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
  "You are QRE's senior creative director. Find the latent movie inside supplied reality before writing prose.",
  "The character/subject is the center of gravity. The input is the world they experience. Make the character's personality, contradiction, attitude, relationship, choice, or consequence the creative engine.",
  "Privately generate genuinely different interpretations, then attack them for genericness, unsupported invention, repetition, weak dramatic movement, and predictable payoff. Choose ONE champion.",
  "The champion angle must be specific to this character/world. Never return an abstract one-word angle such as transformation, affection, love, happiness, adventure, memory, or connection.",
  "A strong angle identifies a relationship or game: rivalry, recurring friction, status negotiation, private ritual, contradiction, obsession, escalation, unexpected tenderness, or a character-specific rule.",
  "Do not confuse a theme with an angle. 'Transformation' is a theme. 'The bow keeps reopening a negotiation this character refuses to lose' is an angle-shaped problem.",
  "Hard reality: gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, and physical events are usable only when supplied. Never infer them.",
  "A boring job can become entertaining through the real person's perspective, attitude, rhythm, relationship, contrast, or meaning. Never invent events to improve it.",
  "Return JSON only: {angle,tension,movement,payoff,antiRepeat,beatCount}.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("PLAN",planResult.text);
 const fallback:Plan={angle:"character-specific contradiction",tension:"the character meets the recurring situation on different terms",movement:"hook → complication → character turn → consequence",payoff:"the character gets the last word",antiRepeat:"generic transformation language, mechanical name repetition, unsupported events",beatCount:input.prompt.toLowerCase().includes("living memory")||input.prompt.toLowerCase().includes("chapter")?4:5};
 const parsedPlan=json<Partial<Plan>>(planResult.text)??{};
 const plan:Plan={...fallback,...parsedPlan,angle:ABSTRACT_ANGLE.test(clean(parsedPlan.angle))?fallback.angle:clean(parsedPlan.angle||fallback.angle)};
 plan.beatCount=Math.max(4,Math.min(6,Number(plan.beatCount)||fallback.beatCount));
 const draftResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's elite micro-beat mouth. HARD MODE.",
  `Write EXACTLY ${plan.beatCount} beats as one coherent attention sequence.`,
  "This is a short-form living-memory experience. It is NOT a novel, essay, receipt, poem, or screenplay.",
  "Your job is to keep attention alive from line to line: LINE → PULL → LINE → PULL → PAYOFF.",
  "Think in individual lines, not sentences in a paragraph. Each line should either hook, sharpen, complicate, turn, or pay.",
  "LINE RHYTHM MATTERS. A killer short line can be 2–4 words. A fuller line can be 5–12+ words when it carries the idea better. Mix lengths intentionally. Do not compress everything into fragments and do not pad everything into prose.",
  "Examples of rhythm, not templates: 'The monster appeared.' / 'Pink bows everywhere.' Or 'Bows? Again?' followed by a fuller line that exploits the same question. The exact words must come from the supplied world.",
  "A short line succeeds because it creates pressure or curiosity. A fuller line succeeds because it delivers a meaningful development. Never use length as a quality metric by itself.",
  "EVERY CUT MUST DO SOMETHING: create a question, sharpen a conflict, expose attitude, change the terms, reveal a consequence, reverse expectations, deepen a relationship, trigger a callback, or pay something off.",
  "DO NOT WRITE A DESCRIPTION OF THE EVENT. Write the character's relationship to the event.",
  "DO NOT INVENT THE MISSING MOVIE. Use only supplied evidence. Attitude, implication, tension, metaphor, and meaning may be inferred; concrete people, actions, placements, relationships, gender/pronouns, locations, timestamps, and physical events may not.",
  "If the source says 'pink bow', the line may transform that supplied object through the character's perspective. It may NOT invent who placed it, where it was placed, or what physical action happened.",
  "CHARACTER GRAVITY WITHOUT NAME ABUSE: the character should dominate through attitude, choice, resistance, consequence, and history. Do not repeat the subject's name mechanically.",
  "ONE MOVIE ONLY. Every line must belong to the same champion angle. Do not switch from rivalry to tenderness to transformation simply because each sounds nice.",
  "NO CAMERA LANGUAGE. No camera, zoom, close-up, final shot, scene opens, cut to, screen directions, or decorative cinematography.",
  "NO AI CHEESE. No tiny paws, heart softens, eyes sparkle, cherished memory, symbol of love/bravery, power of affection, not so bad, sudden emotional resolution, or similar filler.",
  "NO RECEIPT WRITING. Never merely list timestamps, rooms, jobs, likes, dislikes, or steps.",
  "NO THEME ANNOUNCEMENT. Do not tell the viewer 'this is about transformation' or 'the dog tag is a cherished memory'. Make the sequence earn the meaning.",
  "THE PAYOFF MUST LAND. End on a character-specific consequence, reversal, victory, joke, sting, realization, callback, or memorable image earned by the champion angle. Never end with a generic observation or goodbye.",
  `CHAMPION ANGLE: ${plan.angle}`,
  `TENSION: ${plan.tension}`,
  `MOVEMENT: ${plan.movement}`,
  `PAYOFF: ${plan.payoff}`,
  `ANTI-REPEAT: ${plan.antiRepeat}`,
  "Return JSON only: {scenes:[{text,kind}]}.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("DRAFT",draftResult.text);
 const parsed=json<{scenes?:Scene[]}>(draftResult.text);
 return {plan,scenes:normalize(Array.isArray(parsed?.scenes)?parsed.scenes:[],input)};
}
