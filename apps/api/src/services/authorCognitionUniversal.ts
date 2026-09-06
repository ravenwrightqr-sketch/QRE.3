import type { AuthorDomainContext, CreativeFrameSelection, LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { buildAuthorCognitionIntelligence } from "./authorCognitionIntelligence.js";

export type AuthorCognitionInput = {
  prompt: string;
  subject?: string;
  place?: string;
  domain: AuthorDomainContext;
  realityGraph: RealityGraph;
  explicitFrame?: CreativeFrameSelection;
  movieMode?: boolean;
  returning?: boolean;
  memoryContext?: unknown[];
  creativeLearningContext?: string[];
};
export type AuthorCreativeInterpretation = { id: string; thesis: string; creativeOpportunity: string; rationale: string; evidenceEventIds: string[]; confidence: number };
export type AuthorAdaptiveQuestion = { kind: "who" | "where" | "when" | "event" | "detail"; question: string; reason: string };
export type AuthorCognitionPlan = { selectedLens: string; frame: CreativeFrameSelection; interpretations: AuthorCreativeInterpretation[]; latentMovieCandidates: LatentMovieCandidate[]; selectedMovie?: LatentMovieCandidate; adaptiveQuestions: AuthorAdaptiveQuestion[]; attentionStrategy: string; reasoningSummary: string[]; model: string; modelCalls: number };
const CLEAN=/\b(cognition|candidate|trajectory|viewer state|evidence ids?|planner|semantic turn|internal|json)\b/i;
const PSYCH=/\b(happy|sad|angry|feels?|emotion|motive|intention|wants?|likes?|loves?|hates?)\b/i;
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const clamp=(v:unknown,f=.5)=>typeof v==="number"&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):f;
const unique=<T>(xs:T[])=>Array.from(new Set(xs));
function ids(graph:RealityGraph){return new Set(graph.events.map(e=>e.id));}
function validIds(value:unknown,graph:RealityGraph){const set=ids(graph);return Array.isArray(value)?value.filter((v):v is string=>typeof v==="string"&&set.has(v)):[];}
function frame(parsed:Record<string,unknown>|undefined,explicit:CreativeFrameSelection|undefined,graph:RealityGraph):CreativeFrameSelection{if(explicit)return explicit;const raw=clean(parsed?.frame);if(raw&&raw!=="NONE")return {mode:"frame",frame:raw};const interesting=graph.events.find(e=>e.salient)||graph.events[0];return interesting?{mode:"event",eventId:interesting.id}:{mode:"none"};}
function step(eventId:string,kind:string,reason:string):LatentMovieTrajectoryStep{return {eventId,kind,reason};}
function pairCandidates(graph:RealityGraph,subject:string,returning:boolean):LatentMovieCandidate[]{
  const events=graph.events.filter(e=>e.id).slice(0,12); const out:LatentMovieCandidate[]=[];
  const seen=new Set<string>();
  const push=(id:string,hypothesis:string,mechanism:string,steps:LatentMovieTrajectoryStep[],score:number)=>{const sig=steps.map(s=>s.eventId+":"+s.kind).join("|");if(seen.has(sig))return;seen.add(sig);out.push({id,hypothesis,mechanism,anchorEventIds:unique(steps.map(s=>s.eventId)),trajectory:steps,score:clamp(score,.25),whyItWins:`${mechanism} grounded in supplied reality for ${subject}${returning?" across a return context":""}`});};
  for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++){
    const a=events[i],b=events[j]; const shared=(a.label+" "+(a.place??"")+" "+(a.time??"")).toLowerCase().split(/\W+/).filter(Boolean).filter(t=>(b.label+" "+(b.place??"")+" "+(b.time??"")).toLowerCase().includes(t));
    const kind=shared.length?"recontextualization":a.time&&b.time?"convergence":"contrast";
    push(`movie-pair-${i}-${j}`,`${shared.length?`The detail that appears twice changes how the other detail reads.`:`The two supplied details create a meaningful difference worth examining.`}`,kind,[step(a.id,"setup","establish the first supplied condition"),step(b.id,"turn","let the second supplied condition change the reading")],.72+(shared.length?.08:0));
    if(out.length>=6)break;
  }
  const salient=events.filter(e=>e.salient);
  for(const e of salient.slice(0,4))push(`movie-observation-${e.id}`,`The strongest specific detail is allowed to carry the experience without adding invented events.` ,"distinctive observation",[step(e.id,"anchor","stay with the supplied detail")],.64);
  return out.slice(0,8);
}
function normalizeModel(parsed:Record<string,unknown>|undefined,graph:RealityGraph,returning:boolean){
  if(!Array.isArray(parsed?.movies))return [] as LatentMovieCandidate[];
  const set=ids(graph); const out:LatentMovieCandidate[]=[];
  for(const [i,x] of parsed.movies.slice(0,6).entries()){
    if(!x||typeof x!=="object")continue; const r=x as Record<string,unknown>; const traj=Array.isArray(r.trajectory)?r.trajectory.flatMap((s)=>{if(!s||typeof s!=="object")return[];const z=s as Record<string,unknown>;const eventId=clean(z.eventId);const kind=clean(z.kind);const reason=clean(z.reason);return set.has(eventId)&&kind&&reason&&!CLEAN.test(reason)?[{eventId,kind,reason}]:[];}):[];
    const h=clean(r.hypothesis),m=clean(r.mechanism),why=clean(r.whyItWins);
    if(!h||!m||traj.length<1||CLEAN.test(`${h} ${m} ${why}`)||PSYCH.test(h))continue;
    out.push({id:clean(r.id)||`movie-model-${i+1}`,hypothesis:h,mechanism:m,anchorEventIds:unique(traj.map(s=>s.eventId)),trajectory:traj,score:clamp(r.score,.65),whyItWins:why||`grounded competition${returning?" on return":""}`});
  }
  return out;
}
function questions(input:AuthorCognitionInput):AuthorAdaptiveQuestion[]{const qs:AuthorAdaptiveQuestion[]=[];const events=input.realityGraph.events;if(!events.length)qs.push({kind:"event",question:"What actually happened?",reason:"There is not enough concrete reality yet."});else if(events.some(e=>!e.time))qs.push({kind:"when",question:"When did the important thing happen?",reason:"Timing may distinguish the supplied events."});else if(events.some(e=>!e.place))qs.push({kind:"where",question:"Where did it happen?",reason:"Place can anchor the experience."});return qs;}
export async function buildAuthorCognitivePlan(input:AuthorCognitionInput):Promise<AuthorCognitionPlan>{
  const intelligence=buildAuthorCognitionIntelligence(input.realityGraph,input.returning??false,input.creativeLearningContext??[]); const explicit=input.explicitFrame; const compact={subject:clean(input.subject)||"unknown",place:clean(input.place)||"unknown",prompt:clean(input.prompt),returning:input.returning??false,memory:(input.memoryContext??[]).slice(0,20),learning:(input.creativeLearningContext??[]).slice(0,20),events:input.realityGraph.events.slice(0,10).map(e=>({id:e.id,label:e.label,salient:Boolean(e.salient),place:e.place,time:e.time})),relations:input.realityGraph.relations.slice(0,20).map(r=>({from:r.from,to:r.to,kind:r.kind,strength:r.strength})),patterns:(input.realityGraph.patterns??[]).slice(0,12),tensions:(input.realityGraph.unresolvedTensions??[]).slice(0,8),sensory:(input.realityGraph.sensorySignals??[]).slice(0,12)};
  let parsed:Record<string,unknown>|undefined; let model="deterministic"; let modelCalls=0;
  if(input.movieMode!==false){try{const r=await localModelGenerate([{role:"system",content:["You are QRE universal cognition, not a writer.","Reality is immutable. Never invent people, places, actions, outcomes, chronology, motives or emotions.","Find what is actually interesting. Search for 4-6 materially different grounded semantic hypotheses when the evidence supports them.","Do not make one hypothesis per event. A hypothesis must explain why a combination or relationship deserves attention.","Mechanisms include contrast, state change, recurrence, convergence, consequence, recontextualization, continuation, or distinctive observation.","Attack genericity, caption-reel structure, psychological fill-in, fake escalation, metadata narration, template dependence, weak grounding and repetition.","Every concrete trajectory step cites existing event IDs. Use no invented IDs.","Return JSON only: selectedLens, frame, interpretations, movies, selectedMovieId, adaptiveQuestions, attentionStrategy, reasoningSummary.","Keep hypotheses diagnostic, concrete and compact; do not write customer-facing prose."].join("\n")},{role:"user",content:JSON.stringify({reality:compact,intelligence:{signals:intelligence.semanticSignals,moves:intelligence.candidateMoves,rules:intelligence.decisionRules,competition:intelligence.competitionProtocol}})}],"json",{numPredict:1100,temperature:.86}); parsed=JSON.parse(r.text); model=r.model; modelCalls=1;}catch{} }
  const fr=frame(parsed,explicit,input.realityGraph),selectedLens=fr.mode==="frame"?fr.frame:"NONE",modelCs=normalizeModel(parsed,input.realityGraph,input.returning??false),deterministic=pairCandidates(input.realityGraph,clean(input.subject)||"the subject",input.returning??false),candidates=unique([...modelCs,...deterministic].map(x=>x.id)).map(id=>[...modelCs,...deterministic].find(x=>x.id===id)!).sort((a,b)=>b.score-a.score).slice(0,10);
  const chosenId=clean(parsed?.selectedMovieId),selectedMovie=candidates.find(c=>c.id===chosenId)||candidates[0];
  const ints=Array.isArray(parsed?.interpretations)?parsed.interpretations.slice(0,6).flatMap((x,i)=>{if(!x||typeof x!=="object")return[];const r=x as Record<string,unknown>;return [{id:clean(r.id)||`interpretation-${i+1}`,thesis:clean(r.thesis)||selectedMovie?.hypothesis||"Find the strongest grounded reading.",creativeOpportunity:clean(r.creativeOpportunity)||"semantic progression",rationale:clean(r.rationale)||"grounded in supplied evidence",evidenceEventIds:validIds(r.evidenceEventIds,input.realityGraph),confidence:clamp(r.confidence,.6)}];}):[];
  const qs=Array.isArray(parsed?.adaptiveQuestions)?parsed.adaptiveQuestions.filter((x):x is Record<string,unknown>=>Boolean(x&&typeof x==="object")).map(x=>({kind:clean(x.kind) as AuthorAdaptiveQuestion["kind"],question:clean(x.question),reason:clean(x.reason)})).filter(x=>x.question&&["who","where","when","event","detail"].includes(x.kind)&&!PSYCH.test(x.question)).slice(0,3):[];
  return {selectedLens,frame:fr,interpretations:ints.length?ints:[{id:"interpretation-grounded",thesis:selectedMovie?.hypothesis||"Find the strongest grounded reading.",creativeOpportunity:"semantic progression",rationale:"derived from supplied reality",evidenceEventIds:selectedMovie?.anchorEventIds??[],confidence:selectedMovie?.score??.2}],latentMovieCandidates:candidates,selectedMovie,adaptiveQuestions:unique([...qs,...questions(input)].map(x=>JSON.stringify(x))).map(x=>JSON.parse(x) as AuthorAdaptiveQuestion).slice(0,4),attentionStrategy:clean(parsed?.attentionStrategy)||"notice what changes the meaning of another supplied detail",reasoningSummary:Array.isArray(parsed?.reasoningSummary)?parsed.reasoningSummary.filter((x):x is string=>typeof x==="string").map(clean).filter(Boolean).slice(0,10):[...intelligence.semanticSignals.slice(0,3),...intelligence.competitionProtocol.slice(0,4)],model,modelCalls};
}
