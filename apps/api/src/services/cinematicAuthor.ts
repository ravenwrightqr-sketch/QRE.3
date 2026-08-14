import { localModelGenerate } from "./localModelRuntime.js";

export type CinematicAuthorInput = {
  prompt: string; lens?: string; subject?: string; place?: string;
  sourceMoments: string[]; facts: string[]; memoryContext?: string[];
  creativeLearningContext?: string[]; trajectory?: string[];
};

export type AuthoredScene = {
  text: string; kind?: string; durationHintMs?: number;
  transitionHint?: "none" | "fade" | "slide" | "zoom" | "cinematic" | "flash";
  audioMood?: string; visualHint?: string;
};

type Intent = "memory"|"promotion"|"service"|"creator"|"social"|"artist"|"person"|"event"|"artifact"|"story"|"unknown";
type Direction = { intent: Intent; attentionGoal: string; emotionalEngine: string; strongestDetail: string; sequenceShape: string[]; endingMove: string; targetDensity: "compact"|"standard"|"deep"|"expansive"; avoid: string[]; selectedOperators: string[] };
type SceneDraft = { scenes: AuthoredScene[] };
type Critique = { score: number; problems: string[]; repeats: string[]; instructionLeaks: string[]; unsupportedDetails: string[]; weakScenes: number[]; genericLanguage?: string[]; weakTransitions?: string[] };

const OPERATORS = ["sensory_hook","physical_move","personification","understatement","contrast","micro_reveal","reversal","escalation","status_inversion","zoom_into_detail","callback","tender_turn","comic_turn","mystery_turn","transformation","afterglow","voice","signature"];
const clean = (v: unknown) => String(v ?? "").replace(/\s+/g," ").replace(/^[-*\d.\s]+/,"").trim();
const uniq = (v: unknown[], n: number) => [...new Set(v.map(clean).filter(Boolean))].slice(0,n);
const enabled = () => process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
function parse<T>(text: string): T|null { const s=String(text??"").replace(/^```(?:json)?/i,"").replace(/```$/i,"").trim(); try{return JSON.parse(s) as T;}catch{return null;} }
function blocked(text: string){ return /\b(ai|qre|prompt|compiler|cognition|metadata|model|writing process|instruction)\b/i.test(text) || /^(create|make|write|build|generate|turn|produce|show)\b/i.test(text); }
function genericHits(text: string){ return [/picture-perfect/i,/luxury grooming/i,/unforgettable experience/i,/beautiful transformation/i,/magical moment/i,/amazing transformation/i,/as we move/i,/a transformation begins/i,/the experience unfolds/i,/the final reveal/i,/level up/i].filter(p=>p.test(text)).length; }

function infer(input: CinematicAuthorInput): Direction {
  const s=`${input.prompt} ${input.lens??""}`.toLowerCase(); const has=(...r:RegExp[])=>r.some(x=>x.test(s));
  const service=has(/\bservice|client|customer|groom|grooming|clean|cleaning|repair|repaired|install|barber|salon|plumber|landscap|mechanic|tattoo|restaurant\b/);
  const promotion=has(/\bpromo|promotion|commercial|advert|marketing|sell|selling|business|brand\b/);
  const creator=has(/\bcreator|content creator|influencer|youtube|tiktok|reels|shorts|personal brand\b/);
  const social=has(/\bsocial|instagram|facebook|threads|post|caption|feed|followers\b/);
  const artist=has(/\bartist|artwork|painting|sculpture|musician|music|song|album|photographer|illustrator|designer|gallery|studio\b/);
  const person=has(/\babout me|about myself|my life|my story|my identity|portrait|bio\b/);
  const memory=has(/\bmemory|remember|years later|childhood|family|wedding|anniversary|memorial|vacation|trip\b/);
  const event=has(/\bevent|party|festival|ceremony|reunion|birthday|conference|opening|show\b/);
  const artifact=has(/\bartifact|object|piece|plaque|keychain|sticker|tag|installation|physical art|qr art\b/);
  const story=has(/\bstory|tale|scene|movie|film|fiction|horror|romance\b/);
  let intent:Intent="unknown";
  if(promotion) intent=service?"service":"promotion"; else if(service) intent="service"; else if(artist) intent="artist"; else if(creator) intent="creator"; else if(social) intent="social"; else if(memory) intent="memory"; else if(event) intent="event"; else if(person) intent="person"; else if(artifact) intent="artifact"; else if(story) intent="story";
  const selected=intent==="service"?["sensory_hook","personification","status_inversion","comic_turn","micro_reveal","transformation","afterglow"]:intent==="creator"||intent==="social"||intent==="artist"?["sensory_hook","voice","zoom_into_detail","micro_reveal","contrast","signature","afterglow"]:intent==="memory"||intent==="event"?["sensory_hook","zoom_into_detail","micro_reveal","callback","tender_turn","reversal","afterglow"]:intent==="artifact"?["sensory_hook","zoom_into_detail","personification","micro_reveal","mystery_turn","afterglow"]:["sensory_hook","physical_move","micro_reveal","contrast","reversal","transformation","afterglow"];
  return {intent,attentionGoal:intent==="service"?"make the ordinary service feel specific, human, and worth watching":"make the viewer stop, feel a point of view, and want the next moment",emotionalEngine:input.lens||(intent==="service"?"personality, contrast, transformation":"curiosity, personality, contrast"),strongestDetail:input.facts[0]||input.sourceMoments[0]||"the prompt's most distinctive idea",sequenceShape:intent==="memory"||intent==="event"?["arrival","detail","movement","realization","afterglow"]:["hook","movement","discovery","turn","payoff"],endingMove:"finish with an earned image, reveal, reversal, transformation, or after-image",targetDensity:intent==="memory"||intent==="person"?"deep":"compact",avoid:["generic ad copy","report-like prose","feature lists","artist statement","influencer language","fake concrete facts","explaining the joke"],selectedOperators:selected};
}

async function plan(input:CinematicAuthorInput,fallback:Direction):Promise<Direction>{
  if(!enabled()) return fallback;
  try{const r=await localModelGenerate([{role:"system",content:["You are QRE's senior creative director.","Plan; do not draft scenes.","Use the positive Whiskers grammar: sensory image → physical movement → small reveal → reframe/transformation → payoff.","Sparse creator/social/artist/person prompts are valid. Use aspiration, voice, desire, contradiction, tension, or point of view without inventing concrete life events.","Grounded mode permits language, metaphor, personification, framing and interpretation, not new concrete facts.","Return strict JSON: intent, attentionGoal, emotionalEngine, strongestDetail, sequenceShape, endingMove, targetDensity, avoid, selectedOperators.",`OPERATORS: ${OPERATORS.join(", ")}`].join(" ")},{role:"user",content:JSON.stringify({prompt:input.prompt,lens:input.lens??"",subject:input.subject??"",place:input.place??"",facts:uniq(input.facts,40),sourceMoments:uniq(input.sourceMoments,24),memoryContext:uniq(input.memoryContext??[],20),creativeLearningContext:uniq(input.creativeLearningContext??[],20),fallback})}],"json"); const p=parse<Direction>(r.text); if(!p?.sequenceShape?.length||!p.attentionGoal)return fallback; const ops=Array.isArray(p.selectedOperators)?p.selectedOperators.filter(x=>OPERATORS.includes(String(x))).slice(0,7):[]; return {...fallback,...p,selectedOperators:ops.length?ops:fallback.selectedOperators};}catch{return fallback;}
}

function finalize(raw:AuthoredScene[]):AuthoredScene[]{const out:AuthoredScene[]=[]; for(const scene of raw){const t=clean(scene.text); if(!t||blocked(t))continue; for(const p of t.split(/(?<=[.!?])\s+(?=[A-Z0-9'"“])/).map(clean).filter(Boolean)){const words=p.split(/\s+/); out.push({...scene,text:words.length<=18?p:words.slice(0,18).join(" ").replace(/[,:;—-]+$,","")});}} return out.slice(0,20).map((s,i,all)=>({...s,kind:s.kind||["hook","movement","discovery","turn","payoff"][Math.min(i,4)],durationHintMs:s.durationHintMs??Math.max(1500,Math.min(5000,1100+s.text.split(/\s+/).length*150)),transitionHint:s.transitionHint??(i===0?"none":i===all.length-1?"cinematic":"fade")}));}

async function draft(input:CinematicAuthorInput,d:Direction,sparse=false):Promise<AuthoredScene[]>{
  const max=d.intent==="creator"||d.intent==="social"||d.intent==="artist"||d.intent==="person"?5:d.targetDensity==="deep"?8:6;
  const rules=sparse?["You are QRE's sparse-brief rescue author.","Write 3–5 short cinematic scenes from aspiration, voice, desire, contradiction, tension or point of view.","Do not invent concrete biographical events, achievements, customers, locations, dates, products, reviews or other facts.","Creator = character and point of view. Social = stop-scroll micro-story. Artist = enter the artist's world. Person = human contradiction."]:["You are QRE's elite cinematic sequence author.",`Write 3–${max} separate viewer-facing scenes like a miniature film.`,"ONE SCENE = ONE SHORT THOUGHT = ONE PERCEIVABLE MOMENT.","Use the Whiskers grammar: sensory image → movement → reveal → reframe → payoff.","Prefer 4–14 words per scene; 15–18 only when earned.","Do not explain what the movie is doing. Make the line be the moment.","Every adjacent pair must create a new image, physical move, expectation, reveal, reversal, escalation, or emotional shift."];
  const r=await localModelGenerate([{role:"system",content:[...rules,"Do not mention QRE, AI, prompts, compilers, cognition, models, metadata or the writing process.","Avoid generic filler: beautiful, magical, unforgettable, amazing, cinematic, epic, picture-perfect, luxury, masterpiece, a transformation begins, the final reveal, as we move.",`SEQUENCE: ${d.sequenceShape.join(" → ")}`,`OPERATORS: ${d.selectedOperators.join(", ")}`,`ENDING: ${d.endingMove}`,"Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|movement|discovery|turn|payoff|afterglow\"}]}"].join(" ")},{role:"user",content:JSON.stringify({prompt:input.prompt,lens:input.lens??"",subject:input.subject??"",place:input.place??"",facts:uniq(input.facts,40),sourceMoments:uniq(input.sourceMoments,24),memoryContext:uniq(input.memoryContext??[],20),creativeLearningContext:uniq(input.creativeLearningContext??[],20)})}],"json"); const p=parse<SceneDraft>(r.text); return finalize(Array.isArray(p?.scenes)?p.scenes:[]).slice(0,max);
}

async function critique(input:CinematicAuthorInput,d:Direction,scenes:AuthoredScene[]):Promise<Critique|null>{try{const r=await localModelGenerate([{role:"system",content:"You are QRE's ruthless cinematic editor. Diagnose, do not rewrite. Judge visuality, movement, specificity, forward pull, novelty, grounding, transitions, generic language and payoff. Return strict JSON: score, problems, repeats, instructionLeaks, unsupportedDetails, weakScenes, genericLanguage, weakTransitions."},{role:"user",content:JSON.stringify({prompt:input.prompt,direction:d,facts:uniq(input.facts,40),scenes})}],"json"); return parse<Critique>(r.text);}catch{return null;}}

export async function authorCinematicSequence(input:CinematicAuthorInput):Promise<AuthoredScene[]>{
  if(!enabled()) return [];
  const direction=await plan(input,infer(input)); let scenes=await draft(input,direction,false);
  if(scenes.length<3&&["creator","social","artist","person","unknown"].includes(direction.intent)) scenes=await draft(input,direction,true);
  if(scenes.length<3) return [];
  const c=await critique(input,direction,scenes);
  if(c&&(c.score<8||c.problems?.length||c.repeats?.length||c.instructionLeaks?.length||c.unsupportedDetails?.length||c.weakScenes?.length||c.genericLanguage?.length||c.weakTransitions?.length)){const repaired=await draft(input,direction,false); if(repaired.length>=3)scenes=repaired;}
  if(scenes.some(s=>genericHits(s.text)>0)){const repaired=await draft(input,direction,true); if(repaired.length>=3)scenes=repaired;}
  return scenes;
}
