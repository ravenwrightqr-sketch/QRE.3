import type { AuthorMetamorphicRelation, AuthorMetamorphicRelationSet, SemanticMechanism } from "@qre/contracts";
import type { RealityGraph, RealityEvent, RealityRelation } from "@qre/contracts";
const clean=(v:unknown)=>typeof v==="string"?v.replace(/\s+/g," ").trim():"";
const words=(v:string)=>new Set(v.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2));
const overlap=(a:string,b:string)=>{const x=words(a),y=words(b);let n=0;x.forEach(w=>{if(y.has(w))n++});return n/Math.max(1,Math.min(x.size,y.size));};
const move=(m:SemanticMechanism):AuthorMetamorphicRelation["realizationMove"]=>m==="contrast"?"hold_contrast":m==="recurrence"?"recontextualize_callback":m==="consequence"?"land_consequence":"feel_state_transition";
const opportunity=(m:SemanticMechanism):AuthorMetamorphicRelation["creativeOpportunity"]=>m==="contrast"?"contrast_reframe":m==="recurrence"?"callback_recontextualization":m==="consequence"?"consequence":"status_turn";
function classify(a:RealityEvent,b:RealityEvent,r:RealityRelation|undefined):{type:AuthorMetamorphicRelation["type"];mechanism:SemanticMechanism}{
 if(r?.kind==="changes") return {type:"state_polarity_turn",mechanism:"state_change"};
 if(r?.kind==="converges") return {type:"convergence",mechanism:"convergence"};
 if(r?.kind==="after"||r?.kind==="before") return {type:"expectation_break",mechanism:"expectation_shift"};
 const shared=overlap(a.label,b.label); if(shared>=0.6) return {type:"recontextualization",mechanism:"recurrence"};
 if(shared>=0.25) return {type:"consequence_reframe",mechanism:"consequence"};
 return {type:"contrast_reversal",mechanism:"contrast"};
}
export function searchAuthorMetamorphicRelations(graph:RealityGraph):AuthorMetamorphicRelationSet{
 const events=graph.events.filter(e=>clean(e.label)); const relations:AuthorMetamorphicRelation[]=[];
 for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++){
  const a=events[i],b=events[j];const temporal=graph.relations.find(r=>(r.from===a.id&&r.to===b.id)||(r.from===b.id&&r.to===a.id));const shared=overlap(a.label,b.label);
  const score=Math.min(1,0.42+shared*0.38+(temporal?.strength??0)*0.2);if(score<0.45)continue;
  const c=classify(a,b,temporal);
  relations.push({id:`meta-${i+1}-${j+1}`,type:c.type,mechanism:c.mechanism,evidenceEventIds:[a.id,b.id],beforeEventIds:[a.id],afterEventIds:[b.id],before:a.label,after:b.label,relation:{kind:temporal?.kind??"semantic",fromEventId:a.id,toEventId:b.id},realizationMove:move(c.mechanism),creativeOpportunity:opportunity(c.mechanism),feltEffect:c.mechanism==="contrast"?"expectation tension":c.mechanism==="recurrence"?"recognition":"a change in meaning",viewerShift:c.mechanism==="contrast"?"reconsider the first event":"read the later event through the earlier one",languageAim:c.mechanism==="contrast"?"make the difference collide":"make the relationship land",confidence:0.65+0.3*score,score});
 }
 relations.sort((a,b)=>b.score-a.score);return {version:1,sourceEventIds:events.map(e=>e.id),relations:relations.slice(0,24),strongestRelationId:relations[0]?.id,relationCount:relations.length,evidenceClosed:true};
}
