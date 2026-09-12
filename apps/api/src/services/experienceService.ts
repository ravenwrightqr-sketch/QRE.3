import type { AuthorBrainTruth, ExperienceBeat, ExperiencePresenceContext, MemoryContext, AuthorDomainContext } from "@qre/contracts";
import type { MemoryRepository } from "../repositories/memoryRepository.js";
import { authorBrainCanonical } from "./authorBrainCanonical.js";
import { buildExperienceMemoryBatch, memoryContextToCognitiveSummary } from "./memoryProjection.js";
import { extractExperienceStates } from "./experienceMemory.js";
import { buildExperienceState } from "./experienceState.js";
import { getCreativeLearningContext, learningContextLines } from "./creativeLearning.js";
import { buildPresenceContext } from "@qre/engine";
import { createPresenceRepository } from "../repositories/presenceRepository.js";

export type GeoAnchorInput={label?:string;city?:string;region?:string;country?:string;latitude?:number;longitude?:number;role?:"physical_site"|"experience_place"|"event_venue"|"memory_place"|"reference_place";source?:string;time?:string};
export type CompiledExperienceResult={
 title:string; blueprint:Record<string,unknown>; flowSteps:Array<Record<string,unknown>>; moments:Array<Record<string,unknown>>; cinematicScenes:Array<Record<string,unknown>>; beats:ExperienceBeat[]; estimatedDuration:number; momentCount:number; plan:unknown; world:Record<string,unknown>; discoveries:string[]; learningSignals:string[]; cognition:unknown; authorExperienceState:unknown; authorDiagnostics:unknown; memory:{entities:number;facts:number;relations:number;events:number}|null; geo:GeoAnchorInput|null; presence:ExperiencePresenceContext|null; warnings:string[];
};
const clean=(v:unknown)=>typeof v==="string"?v.replace(/\s+/g," ").trim():"";
const uniq=(xs:string[])=>[...new Set(xs.map(clean).filter(Boolean))];
const asRecord=(v:unknown)=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:undefined;
function strings(v:unknown):string[]{if(typeof v==="string")return v.split(/[,|]/).map(clean).filter(Boolean);return Array.isArray(v)?v.filter((x):x is string=>typeof x==="string").map(clean).filter(Boolean):[];}
function domain(asset:Record<string,unknown>|undefined):AuthorDomainContext|undefined{
 if(!asset)return undefined;const data=asRecord(asset.templateData);const account=asRecord(asset.account);const c:AuthorDomainContext={category:clean(asset.category??data?.category),businessType:clean(data?.businessType??account?.type),businessName:clean(data?.businessName??account?.name??asset.displayName),businessDescription:clean(data?.businessDescription??data?.description),serviceType:clean(data?.serviceType??data?.service_type),serviceName:clean(data?.serviceName??data?.service??data?.offering),subjectKind:clean(data?.subjectKind??data?.subject_kind),knownCapabilities:uniq([...strings(data?.services),...strings(data?.capabilities),...strings(data?.offerings)]).slice(0,24),contextualSignals:uniq([...strings(data?.contextualSignals),...strings(data?.signals)]).slice(0,24),creatorRole:clean(data?.creatorRole??data?.role),audience:strings(data?.audience??data?.targetAudience),objective:clean(data?.objective??data?.goal??data?.purpose),desiredAction:clean(data?.desiredAction??data?.cta),creativePreferences:strings(data?.creativePreferences??data?.creativeTaste)};return Object.values(c).some(v=>Array.isArray(v)?v.length>0:Boolean(v))?c:undefined;
}
function beats(texts:string[][]):ExperienceBeat[]{return texts.map(([text,...ids],i)=>({id:`author-beat-${i+1}`,text,kind:i===0?"jolt":i===texts.length-1?"payoff":"reveal",order:i+1,callback:i>1&&ids.length>1,meta:{sourceIds:ids,authoredBy:"qre-author"}}));}

export async function compileExperience(input:{prompt:string;subject?:string;facts?:string[];sourceMoments?:string[];assetId?:string;userId?:string;sessionId?:string;operationId?:string;memoryRepository?:MemoryRepository;geo?:GeoAnchorInput;movieMode?:boolean;lens?:string}):Promise<CompiledExperienceResult>{
 const warnings:string[]=[];const prompt=clean(input.prompt);if(!prompt)throw new Error("Experience prompt required");
 let memoryContext:MemoryContext|undefined;let presence:ExperiencePresenceContext|null=null;let domainContext:AuthorDomainContext|undefined;
 if(input.assetId&&input.memoryRepository){try{memoryContext=await input.memoryRepository.loadContext({assetId:input.assetId,userId:input.userId});}catch{warnings.push("memory_context_unavailable");}}
 if(input.assetId){try{presence=await buildPresenceContext(input.assetId,createPresenceRepository(),input.sessionId);}catch{warnings.push("presence_context_unavailable");}}
 if(input.assetId){try{const {db}=await import("@qre/db");const asset=await db.asset.findUnique({where:{id:input.assetId},select:{displayName:true,category:true,templateData:true,account:{select:{name:true,type:true}}}});domainContext=domain(asset as unknown as Record<string,unknown>);}catch{warnings.push("domain_context_unavailable");}}
 let learningLines:string[]=[];
 if(input.assetId){try{learningLines=learningContextLines(await getCreativeLearningContext({assetId:input.assetId,userId:input.userId,limit:80}));}catch{warnings.push("learning_context_unavailable");}}
 const memorySummary=memoryContext?memoryContextToCognitiveSummary(memoryContext):[];
 const truth:AuthorBrainTruth={prompt,subject:clean(input.subject)||undefined,place:clean(input.geo?.label)||undefined,lens:clean(input.lens)||undefined,returning:presence?.isReturning,visitNumber:presence?.visitNumber,facts:uniq(input.facts??[]).slice(0,100),sourceMoments:uniq(input.sourceMoments??[]).slice(0,100),memoryContext:memorySummary.slice(0,120),trajectory:uniq(presence?.summary??[]).slice(0,40),creativeLearningContext:learningLines.slice(0,100),domainContext};
 const authored=await authorBrainCanonical(truth);
 let state:CompiledExperienceResult["authorExperienceState"]=undefined;let memoryCounts:null|CompiledExperienceResult["memory"]=null;
 if(input.assetId&&input.memoryRepository){try{const batch=buildExperienceMemoryBatch({operationId:input.operationId??input.sessionId??`author:${input.assetId}:${prompt}`,assetId:input.assetId,userId:input.userId,graph:authored.reality,sessionId:input.sessionId,source:"prompt"});await input.memoryRepository.writeBatch(batch);memoryCounts={entities:batch.entities.length,facts:batch.facts.length,relations:batch.relations.length,events:batch.events.length};const previous=extractExperienceStates(memoryContext??{entities:[],facts:[],relations:[],events:[]});state=buildExperienceState({graph:authored.reality,candidate:authored.cognition.candidates[0],lens:authored.proposition.pattern,memoryContext:learningLines,priorExperienceStates:previous,round:(presence?.visitNumber??1)});}catch{warnings.push("memory_persistence_failed");}}
 const sourceByCut=authored.sequence.cuts.map(c=>[...c.sourceIds]);
 const moments=authored.sequence.cuts.map((cut,i)=>({type:"message",editable:false,demo:false,order:i,payload:{text:cut.informationGain,sourceIds:cut.sourceIds,role:cut.role}}));
 const presentation=authored.sequence.cuts.map((cut,i)=>({id:`scene-${i+1}`,order:i,type:"message",duration:1800,moment:{type:"message",payload:{text:cut.informationGain,sourceIds:cut.sourceIds}}}));
 const b=beats(authored.sequence.cuts.map(c=>[c.informationGain,...c.sourceIds]));
 return {title:authored.proposition.text,blueprint:{premise:authored.proposition.text,pattern:authored.proposition.pattern,sourceEventIds:authored.proposition.sourceEventIds,sequenceId:authored.cognition.candidates[0]?.id??""},flowSteps:authored.sequence.cuts.map((c,i)=>({order:i+1,role:c.role,sourceIds:c.sourceIds,nextPromise:c.nextPromise})),moments,cinematicScenes:presentation,beats:b,estimatedDuration:presentation.reduce((n)=>n+1800,0),momentCount:moments.length,plan:authored.cognition,world:{subject:authored.sequence.subject,proposition:authored.proposition.text,returning:presence?.isReturning??false,visitNumber:presence?.visitNumber??1},discoveries:authored.cognition.candidates.flatMap(c=>c.evidence).slice(0,20),learningSignals:learningLines.slice(0,30),cognition:authored.cognition,authorExperienceState:state,authorDiagnostics:authored.judgment,memory:memoryCounts,geo:input.geo??null,presence,warnings};
}
