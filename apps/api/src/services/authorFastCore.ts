import { localModelGenerate } from "./localModelRuntime.js";

type Input={prompt:string;lens?:string;subject?:string;facts:string[];sourceMoments:string[];memoryContext?:string[];creativeLearningContext?:string[];trajectory?:string[]};
type Plan={angle:string;tension:string;movement:string;payoff:string;antiRepeat:string;beatCount:number};
type Scene={text:string;kind?:string};

const GENERIC=[/still here/i,/something changes/i,/then it shifts/i,/see you next time/i,/quick zoom/i,/camera pulls back/i,/final shot/i,/the power of (?:affection|love|friendship)/i,/transformation and affection/i,/a symbol of (?:love|bravery|affection|friendship)/i,/new routine/i,/cherished memory/i,/in (?:her|his|their) world/i];
const META=/\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const PROVIDER_TERMS=/\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|tech|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const PROVIDER_SPOKEN=/\b(?:says?|asks?|replies?|answers?|sighs?|laughs?|smiles?|whispers?|shouts?|yells?)\b|[“”]/i;
const FORCED_CINEMA=/\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const CHEESE=/\b(?:tiny paws|heart softens|eyes sparkle|cherished|symbol of|power of|not so bad|suddenly,?)\b/i;
const CHOPPED=/^(?:\w+[',!?]?[ ]*){1,3}$/;
const ABSTRACT=/\b(?:transformation|fear vs\.? affection|from (?:scared|fear) to (?:happy|joy)|first treat|new routine|building trust|journey with|emotional journey)\b/i;
const clean=(v:unknown)=>String(v??"").replace(/\s+/g," ").trim();
const uniq=(xs:unknown[])=>[...new Set(xs.map(clean).filter(Boolean))];
function json<T>(text:string):T|null{const s=String(text??"").replace(/^```(?:json)?/i,"").replace(/```$/i,"").trim();try{return JSON.parse(s) as T}catch{return null}}
function debug(label:string,text:string){if(process.env.QRE_AUTHOR_DEBUG_RAW==="true")console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`)}
function unsupportedPronoun(text:string,input:Input){const source=[...input.facts,...input.sourceMoments,...(input.memoryContext??[])].join(" ");if(/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source))return false;return /\b(he|him|his|her|hers)\b/i.test(text)}
function invalid(text:string){return FORCED_CINEMA.test(text)||CHEESE.test(text)||GENERIC.some(p=>p.test(text))}
function weakFragment(text:string){const w=text.split(/\s+/).filter(Boolean);if(w.length>=4)return false;if(/[?!.]$/.test(text)&&w.length>=2)return false;return CHOPPED.test(text)}
function splitDraftText(text:string):Scene[]{return String(text??"").split(/\n+/).map(line=>line.replace(/^\s*(?:\d+[.)-]|[-*•])\s*/,"").trim()).filter(Boolean).map(text=>({text,kind:"line"}))}
function extractScenes(raw:unknown):Scene[]{if(Array.isArray(raw))return raw as Scene[];if(raw&&typeof raw==="object"){const v=raw as {scenes?:unknown;text?:unknown;lines?:unknown[]};if(Array.isArray(v.scenes))return v.scenes as Scene[];if(Array.isArray(v.lines))return v.lines.map(line=>({text:clean(line),kind:"line"}));if(typeof v.text==="string")return splitDraftText(v.text)}return[]}
function validAngle(angle:string){const a=clean(angle);return !!a&&!ABSTRACT.test(a)}

export async function authorFast(input:Input):Promise<{plan:Plan;scenes:Scene[]}>{
 const serviceLike=/\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|tattoo|restaurant|client|customer)\b/i.test(`${input.prompt} ${input.lens??""}`);
 const source={prompt:input.prompt,lens:input.lens??"",subject:input.subject??"",facts:uniq(input.facts),sourceMoments:uniq(input.sourceMoments),memoryContext:uniq(input.memoryContext??[]),creativeLearningContext:uniq(input.creativeLearningContext??[]),trajectory:uniq(input.trajectory??[]),serviceLike};
 const fallback:Plan={angle:"a specific character relationship or game",tension:"something the character cannot ignore",movement:"discover → deepen → surprise → land",payoff:"a character-specific consequence",antiRepeat:"generic themes, recycled motifs, invented events, provider-as-protagonist",beatCount:/living memory|chapter/i.test(input.prompt)?4:5};

 const planResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's universal creative brain. Find the latent movie inside this reality before writing lines.",
  "DO NOT build a screenplay template. Do not assign formulaic beat names. Do not reduce the story to an emotional journey.",
  "Understand the subject, the supplied world, history, and intent. Then privately explore several genuinely different ways of seeing it. Kill the generic, obvious, repetitive, unsupported, or boring ones. Choose the strongest remaining movie.",
  "The subject is temporarily the star. In service experiences, the service is the stage, not automatically a character. Never invent a provider or provider action unless explicitly supplied.",
  "Look for the thing that is unexpectedly interesting: a contradiction, running game, status shift, tiny obsession, ritual, absurdity, tension, strange image, personality collision, callback, or meaning hiding inside ordinary material.",
  "A true fact is evidence, not automatically the story. A boring job is material, not the narrative. Find the human angle yourself.",
  "Attention is not a checklist. Privately ask: what will the viewer want to know, feel, predict, or see after each cut? What expectation can I bend? What should remain slightly unresolved so the next cut matters? Let the answers shape the sequence rather than exposing a rigid schema.",
  "The sequence must feel like ONE discovery, not a list of facts and not a collection of clever lines that belong to different movies.",
  "Hard reality: never invent gender/pronouns, people, relationships, locations, actions, object placement, timestamps, outcomes, weather, or physical events absent from evidence.",
  "Return a lightweight creative direction only: {angle,tension,movement,payoff,antiRepeat,beatCount}. Angle must describe a specific situation/relationship/game, never a generic theme such as transformation, fear-to-happiness, first treat, new routine, or journey.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("PLAN",planResult.text);
 const parsedPlan=json<Partial<Plan>>(planResult.text)??{};
 const plan:Plan={...fallback,...parsedPlan,angle:validAngle(String(parsedPlan.angle??""))?clean(String(parsedPlan.angle)):fallback.angle};
 plan.beatCount=Math.max(4,Math.min(6,Number(plan.beatCount)||fallback.beatCount));

 const draftResult=await localModelGenerate([{role:"system",content:[
  "You are QRE's elite creative mouth. You are the final cut-maker, not a novelist.",
  `Create EXACTLY ${plan.beatCount} viewer-facing lines that feel like spliced film cuts.`,
  "Do not obey a formula. Discover the sequence yourself from the chosen movie. The only hard creative requirement is that each cut makes the viewer want the next cut.",
  "Think privately: what is interesting here? what image or thought hits first? what does the viewer now expect? how can the next cut reward that expectation while making the next one stronger? what should echo or change before the payoff?",
  "Use attention as a living state, not a rigid field list. Curiosity, anticipation, recognition, surprise, humor, threat, tenderness, status, mystery, or emotional residue are all valid engines.",
  "One line is one attention moment. A line may be 2 words or 12 words. Short cuts are welcome, but do not compress away meaning. Longer cuts are welcome when they contain a genuinely interesting idea. Mix rhythm naturally.",
  "Compress GREAT IDEAS, not everything. If the supplied reality contains a striking metaphor or reframing, keep the insight and cut the explanation.",
  "Character-first does not mean repeating the subject's name. Let attitude, decisions, resistance, implication, history, callbacks, and consequences carry the character.",
  "A supplied object can become something bigger through the subject's perspective. Fact → character lens → surprising framing is encouraged. Do not invent the physical event behind the framing.",
  "Do not turn the source into a chronological receipt. Do not write 'then X happened, then Y happened' unless the sequence itself is the creative point.",
  "Do not switch movies halfway through. Once the sequence discovers its central game/relationship/idea, keep exploiting and evolving it until the payoff.",
  "The payoff should not merely summarize what happened. It should land the character: reversal, victory, joke, sting, realization, callback, memorable image, or a small unresolved residue that makes another chapter desirable.",
  "SERVICE RULE: the provider is invisible infrastructure unless explicitly sourced. Never invent provider characters, dialogue, or provider actions.",
  "REALITY RULE: never invent gender/pronouns, people, relationships, locations, actions, object placement, timestamps, outcomes, weather, or physical events absent from the source.",
  "Avoid generic AI cheese, camera directions, theme announcements, vague emotional labels, and generic goodbyes.",
  `CHOSEN MOVIE: ${plan.angle}`,
  `TENSION: ${plan.tension}`,
  `MOVEMENT: ${plan.movement}`,
  `PAYOFF: ${plan.payoff}`,
  `ANTI-REPEAT: ${plan.antiRepeat}`,
  "Return JSON only: {scenes:[{text,kind}]}. Also accepted: {text:\"line 1\\nline 2\\n...\"}.",
 ].join(" ")},{role:"user",content:JSON.stringify(source)}],"json");
 debug("DRAFT",draftResult.text);
 const parsedDraft=json<unknown>(draftResult.text);
 const rawScenes=extractScenes(parsedDraft);
 const scenes=rawScenes.map(s=>({text:clean(s.text),kind:clean(s.kind)||"line"})).filter(s=>s.text&&!META.test(s.text)&&!invalid(s.text)&&!unsupportedPronoun(s.text,input)).filter(s=>!weakFragment(s.text)).filter(s=>!PROVIDER_SPOKEN.test(s.text)&&!(serviceLike&&PROVIDER_TERMS.test(s.text))).filter((s,i,a)=>a.findIndex(x=>x.text.toLowerCase()===s.text.toLowerCase())===i).slice(0,6);
 return {plan,scenes};
}
