import type { AuthorCreativeProposition, SequenceCandidate, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const clean=(v:unknown)=>typeof v==="string"?v.replace(/\s+/g," ").trim():"";
function fallback(candidate:SequenceCandidate, graph:RealityGraph):AuthorCreativeProposition {
  const ids=candidate.anchorEventIds;
  const facts=ids.map(id=>graph.events.find(e=>e.id===id)?.label).filter((v):v is string=>Boolean(v));
  return {text:candidate.payoff || candidate.lens,pattern:candidate.lens,sourceEventIds:ids.length?ids:facts.length?[graph.events[0]?.id].filter((v):v is string=>Boolean(v)):[]};
}
export async function chooseAuthorProposition(input:{truth:{subject?:string;domainContext?:{businessName?:string;serviceName?:string}};candidate:SequenceCandidate;graph:RealityGraph}):Promise<AuthorCreativeProposition>{
  const fallbackValue=fallback(input.candidate,input.graph);
  try {
    const result=await localModelGenerate([
      {role:"system",content:"You are the QRE Artist. Choose ONE central creative proposition from supplied evidence. Do not invent facts. Do not explain production. The proposition should expose a surprising semantic relationship already present. Return JSON only."},
      {role:"user",content:JSON.stringify({subject:input.truth.subject,business:input.truth.domainContext, candidate:input.candidate, evidence:input.graph.events.map(e=>({id:e.id,label:e.label}))})},
    ],"json",{numPredict:700,numCtx:8192,temperature:0.8,jsonSchema:{type:"object",properties:{text:{type:"string"},pattern:{type:"string"},sourceEventIds:{type:"array",items:{type:"string"}}},required:["text","pattern","sourceEventIds"],additionalProperties:false}});
    const parsed:unknown=JSON.parse(result.text);
    if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)){
      const obj=parsed as {text?:unknown;pattern?:unknown;sourceEventIds?:unknown};
      const text=clean(obj.text); const pattern=clean(obj.pattern); const ids=Array.isArray(obj.sourceEventIds)?obj.sourceEventIds.filter((v):v is string=>typeof v==="string"&&input.graph.events.some(e=>e.id===v)):[...fallbackValue.sourceEventIds];
      if(text&&pattern&&ids.length) return {text,pattern,sourceEventIds:ids};
    }
  } catch {}
  return fallbackValue;
}
