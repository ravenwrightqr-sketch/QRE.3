import type { AuthorCreativeProposition, RealityGraph, SequenceCandidate, SequencePlay, SequenceCut, SequenceGainKind, ViewerAttentionRole, ViewerState } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

type CutDraft={text:string;sourceEventIds:string[]};
const clean=(v:unknown)=>typeof v==="string"?v.replace(/\s+/g," ").trim():"";
const validIds=(value:unknown,graph:RealityGraph)=>Array.isArray(value)?value.filter((v):v is string=>typeof v==="string"&&graph.events.some(e=>e.id===v)):[];
function fallback(input:{graph:RealityGraph;candidate:SequenceCandidate;proposition:AuthorCreativeProposition}):CutDraft[]{
  const ev=input.candidate.anchorEventIds.map(id=>input.graph.events.find(e=>e.id===id)).filter((e):e is NonNullable<typeof e>=>Boolean(e));
  if(!ev.length) return [];
  const out:CutDraft[]=[{text:input.proposition.text,sourceEventIds:[ev[0].id]}];
  for(const e of ev.slice(0,4)) out.push({text:e.label,sourceEventIds:[e.id]});
  out.push({text:input.candidate.payoff||ev.at(-1)!.label,sourceEventIds:[ev.at(-1)!.id]});
  return out;
}
export async function realizeAuthorSequence(input:{graph:RealityGraph;candidate:SequenceCandidate;proposition:AuthorCreativeProposition}):Promise<CutDraft[]> {
  const fallbackCuts=fallback(input);
  try {
    const result=await localModelGenerate([
      {role:"system",content:"You are QRE Mouth. Turn one Artist proposition into 4-8 terse text cuts. Every cut must be grounded in the supplied event IDs. Each cut must change the read of what came before. Use implication, compression, contrast, callback, escalation, or consequence. Do not add facts. Do not mention how it was produced. Return JSON only."},
      {role:"user",content:JSON.stringify({proposition:input.proposition,candidate:input.candidate,evidence:input.graph.events.map(e=>({id:e.id,label:e.label}))})},
    ],"json",{numPredict:1100,numCtx:8192,temperature:0.9,jsonSchema:{type:"object",properties:{cuts:{type:"array",items:{type:"object",properties:{text:{type:"string"},sourceEventIds:{type:"array",items:{type:"string"}}},required:["text","sourceEventIds"],additionalProperties:false}}},required:["cuts"],additionalProperties:false}});
    const parsed:unknown=JSON.parse(result.text);
    if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)){
      const raw=(parsed as {cuts?:unknown}).cuts;
      if(Array.isArray(raw)){
        const cuts:CutDraft[]=raw.map((item):CutDraft|null=>{if(!item||typeof item!=="object"||Array.isArray(item))return null;const o=item as {text?:unknown;sourceEventIds?:unknown};const text=clean(o.text);const ids=validIds(o.sourceEventIds,input.graph);return text&&ids.length?{text,sourceEventIds:ids}:null;}).filter((v):v is CutDraft=>Boolean(v)).slice(0,8);
        if(cuts.length>=3)return cuts;
      }
    }
  } catch {}
  return fallbackCuts;
}
export function buildSequencePlay(input:{subject:string;proposition:AuthorCreativeProposition;candidate:SequenceCandidate;cuts:CutDraft[]}):SequencePlay {
  const cuts:SequenceCut[]=input.cuts.map((cut,index)=>{
    const prior=input.cuts.slice(0,index).map(item=>item.text);
    const role:ViewerAttentionRole=index===0?"hook":index===input.cuts.length-1?"payoff":index===1?"question":"reframe";
    const gainKind:SequenceGainKind=index===0?"surprise":index===input.cuts.length-1?"payoff":index===1?"question":"reframe";
    const before:ViewerState={known:prior,expected:index===0?input.proposition.text:input.cuts[index-1]?.text,unresolved:index===0?input.candidate.unresolvedQuestion:undefined,currentWant:"understand the relationship",recentChange:prior.at(-1)};
    const after:ViewerState={known:[...prior,cut.text],expected:cut.text,unresolved:index===input.cuts.length-1?undefined:input.candidate.unresolvedQuestion,currentWant:index===input.cuts.length-1?undefined:"see what changes next",recentChange:cut.text};
    return {id:`cut-${index+1}`,order:index+1,role,gainKind,sourceIds:[...cut.sourceEventIds],informationGain:cut.text,attentionDelta:index===0?input.proposition.text:`${input.cuts[index-1]?.text??input.proposition.text} → ${cut.text}`,viewerBefore:before,viewerAfter:after,nextPromise:index<input.cuts.length-1?input.cuts[index+1]?.text:undefined,payoffConnection:index===input.cuts.length-1?input.proposition.text:undefined,noveltyScore:1-input.candidate.repetitionRisk,confidence:1-input.candidate.truthRisk};
  });
  return {subject:input.subject,premise:input.proposition.text,openingState:cuts[0]?.viewerBefore??{known:[]},baselineFacts:[],cuts,closingState:cuts.at(-1)?.viewerAfter,continuity:[input.proposition.pattern],antiCrutch:["No baseline fact is used as a cut unless it changes expectation."],continuation:input.candidate.unresolvedQuestion||"look for the next change"};
}
