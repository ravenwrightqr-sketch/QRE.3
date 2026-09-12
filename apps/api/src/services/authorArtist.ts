import type { AuthorBrainTruth, AuthorCreativeProposition, AuthorDomainContext, RealityGraph, SequenceCandidate } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

export type AuthorTreatment = { primary: string; secondary?: string; reason: string };
const clean=(value:unknown):string=>typeof value==="string"?value.replace(/\s+/g," ").trim():"";
const unique=(values:readonly string[]):string[]=>[...new Set(values.map(clean).filter(Boolean))];
const risky=(value:string):boolean=>/\b(?:camera|shot|montage|soundtrack|screenplay|transition|voice[- ]?over|slogan|caption|genre|movie)\b/i.test(value);

function fallback(input:{candidate:SequenceCandidate;graph:RealityGraph;truth:AuthorBrainTruth}) {
  const ids=input.candidate.anchorEventIds.filter(id=>input.graph.events.some(event=>event.id===id)).slice(0,6);
  const subject=clean(input.truth.subject)||"this reality";
  const base=input.candidate.hypothesis[0]||input.candidate.payoff||input.candidate.lens;
  return { proposition:{text:base?`${subject} has a pattern: ${base}`:`${subject} makes one rule visible.`,pattern:input.candidate.lens||input.candidate.supportingRelationKinds[0]||"relationship",sourceEventIds:ids.length?ids:(input.graph.events[0]?[input.graph.events[0].id]:[])}, treatment:{primary:"comedy",reason:"fallback treatment; the supplied relationship remains the creative center"} as AuthorTreatment };
}

export async function chooseAuthorProposition(input:{truth:AuthorBrainTruth;candidate:SequenceCandidate;alternatives:SequenceCandidate[];graph:RealityGraph;domainContext?:AuthorDomainContext}):Promise<AuthorCreativeProposition&{treatment:AuthorTreatment}> {
  const fallbackValue=fallback(input);
  const field=unique(input.alternatives.map(c=>`${c.lens}: ${c.hypothesis.join("; ")} | ${c.payoff}`)).slice(0,6);
  try {
    const response=await localModelGenerate([
      {role:"system",content:[
        "You are QRE Artist.",
        "Choose ONE central creative proposition from the strongest semantic possibilities discovered by Cognition.",
        "Do not build a genre library. Choose a perceptual treatment from this tiny vocabulary: horror, romance, comedy, heist, game, fierce, noir, tenderness, documentary, chaos.",
        "You may combine two treatments: horror+romance, heist+comedy, game+fierce, noir+tenderness, documentary+chaos.",
        "Treatment changes perception of real relationships; it never invents the underlying reality.",
        "The proposition must expose a memorable rule or interpretation already supported by supplied reality.",
        "Prefer character + game + tension + surprise + payoff over noun lists.",
        "Return JSON only."].join(" ")},
      {role:"user",content:JSON.stringify({subject:input.truth.subject,prompt:input.truth.prompt,domain:input.truth.domainContext??input.domainContext??null,returning:input.truth.returning??false,visitNumber:input.truth.visitNumber??null,memory:input.truth.memoryContext?.slice(0,100)??[],learning:input.truth.creativeLearningContext?.slice(0,80)??[],reality:input.graph.events.slice(0,100).map(e=>({id:e.id,label:e.label,entities:e.entities,place:e.place,time:e.time,salient:e.salient})),relations:input.graph.relations.slice(0,100),candidates:field})},
    ],"json",{numPredict:900,numCtx:12288,temperature:0.84,jsonSchema:{type:"object",additionalProperties:false,required:["text","pattern","sourceEventIds","treatment"],properties:{text:{type:"string"},pattern:{type:"string"},sourceEventIds:{type:"array",minItems:1,maxItems:8,items:{type:"string"}},treatment:{type:"object",additionalProperties:false,required:["primary","reason"],properties:{primary:{type:"string"},secondary:{type:"string"},reason:{type:"string"}}}}}});
    const parsed:unknown=JSON.parse(response.text);
    if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)){
      const row=parsed as Record<string,unknown>;const text=clean(row.text);const pattern=clean(row.pattern);const ids=Array.isArray(row.sourceEventIds)?row.sourceEventIds.filter((v):v is string=>typeof v==="string"&&input.graph.events.some(e=>e.id===v)).slice(0,8):[];
      const t=row.treatment&&typeof row.treatment==="object"&&!Array.isArray(row.treatment)?row.treatment as Record<string,unknown>:{};const primary=clean(t.primary).toLowerCase();const secondary=clean(t.secondary).toLowerCase();const reason=clean(t.reason);
      const allowed=new Set(["horror","romance","comedy","heist","game","fierce","noir","tenderness","documentary","chaos"]);
      if(text&&pattern&&ids.length&&!risky(text)&&allowed.has(primary)&&(!secondary||allowed.has(secondary))){return {text,pattern,sourceEventIds:ids,treatment:{primary,secondary:secondary||undefined,reason:reason||"Treatment selected to change perception of the supplied relationship."}};}
    }
  }catch{}
  return {...fallbackValue.proposition,treatment:fallbackValue.treatment};
}
