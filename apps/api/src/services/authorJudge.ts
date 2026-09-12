import type { AuthorCreativeProposition, AuthorJudgeResult, RealityGraph, SequencePlay } from "@qre/contracts";
const clean=(v:unknown)=>typeof v==="string"?v.replace(/\s+/g," ").trim():"";
export function judgeAuthorSequence(input:{graph:RealityGraph;proposition:AuthorCreativeProposition;sequence:SequencePlay}):AuthorJudgeResult {
  const eventIds=new Set(input.graph.events.map(e=>e.id));
  const cuts=input.sequence.cuts;
  const grounded=cuts.length?cuts.filter(c=>c.sourceIds.length&&c.sourceIds.every(id=>eventIds.has(id))).length/cuts.length:0;
  const grounding=grounded;
  const propositionFidelity=cuts.length?cuts.filter(c=>clean(c.attentionDelta).length>0).length/cuts.length:0;
  let moving=0;
  for(let i=1;i<cuts.length;i++) if(clean(cuts[i].informationGain)!==clean(cuts[i-1].informationGain)||clean(cuts[i].attentionDelta)!==clean(cuts[i-1].attentionDelta)) moving++;
  const movement=cuts.length>1?moving/(cuts.length-1):0;
  const specificity=Math.min(1,cuts.reduce((n,c)=>n+(c.sourceIds.length?1:0),0)/Math.max(1,cuts.length));
  const transformation=Math.min(1,(input.proposition.pattern.length>4?0.75:0.35)+(input.sequence.continuity?.length?0.2:0));
  const inventionRisk=1-grounded;
  const genericity=Math.max(0,1-specificity-transformation*0.25);
  const reasons:string[]=[];
  if(grounded<1) reasons.push("unsupported cut");
  if(movement<0.75) reasons.push("cuts do not consistently change the read");
  if(!clean(input.proposition.text)) reasons.push("missing proposition");
  if(input.proposition.sourceEventIds.some(id=>!eventIds.has(id))) reasons.push("proposition cites unsupported reality");
  if(cuts.length<3) reasons.push("sequence too short");
  return {status:reasons.length?"REJECT":"ACCEPT",grounding,specificity:Math.min(1,grounding*0.6+specificity*0.4),movement,propositionFidelity,transformation,inventionRisk,genericity,reasons};
}
