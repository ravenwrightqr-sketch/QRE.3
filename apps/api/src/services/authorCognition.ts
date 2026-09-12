import type { AuthorBrainTruth, AuthorCognitionResult, SequenceCandidate, SequenceTrajectoryStep, RealityGraph } from "@qre/contracts";
import { searchAuthorMetamorphicRelations } from "./authorMetamorphicSearch.js";

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function authorCognition(input:{truth:AuthorBrainTruth; reality:RealityGraph}): AuthorCognitionResult {
  const meta=searchAuthorMetamorphicRelations(input.reality);
  const events=input.reality.events;
  const candidates:SequenceCandidate[]=[];
  for(const relation of meta.relations.slice(0,8)) {
    const before=events.find(e=>e.id===relation.beforeEventIds[0]);
    const after=events.find(e=>e.id===relation.afterEventIds[0]);
    if(!before||!after) continue;
    const trajectory:SequenceTrajectoryStep[]=[
      {order:1,operation:"establish",eventIds:[before.id],viewerChange:"know the first concrete condition",nextQuestion:"what changes this?"},
      {order:2,operation:relation.mechanism==="contrast"?"contrast":"reframe",eventIds:[after.id],viewerChange:relation.viewerShift,nextQuestion:relation.after},
      {order:3,operation:"payoff",eventIds:[after.id],viewerChange:"see the relationship rather than isolated facts",nextQuestion:"what does this reveal?"},
    ];
    const candidate:SequenceCandidate={
      id:`candidate-${relation.id}`, lens:relation.creativeOpportunity, anchorEventIds:relation.evidenceEventIds, supportingRelationKinds:[relation.type], trajectory,
      payoff:relation.after, unresolvedQuestion:relation.viewerShift, evidence:[relation.before,relation.after], hypothesis:[relation.feltEffect],
      truthRisk:1-relation.confidence, novelty:clamp(relation.score), specificity:clamp(relation.score), informationValue:clamp(relation.score), uncertainty:1-relation.confidence,
      attentionPotential:clamp((relation.score+relation.confidence)/2), consequencePotential:clamp(relation.score), callbackPotential:relation.mechanism==="recurrence"?0.9:0.35, compressionPotential:0.7,
      repetitionRisk:0.15, distinctiveness:clamp(relation.score), score:clamp(0.25*relation.score+0.25*relation.confidence+0.25*(relation.mechanism==="contrast"?1:0.65)+0.25*(input.truth.returning?0.9:0.7)),
    };
    candidates.push(candidate);
  }
  if(!candidates.length && events.length) {
    const e=events[0];
    candidates.push({id:"candidate-grounding",lens:"specificity",anchorEventIds:[e.id],supportingRelationKinds:[],trajectory:[{order:1,operation:"establish",eventIds:[e.id],viewerChange:"recognize the supplied reality",nextQuestion:"what is distinctive here?"}],payoff:e.label,unresolvedQuestion:"what is distinctive here?",evidence:[e.label],hypothesis:[],truthRisk:0,novelty:0.4,specificity:0.8,informationValue:0.8,uncertainty:0.2,attentionPotential:0.5,consequencePotential:0.2,callbackPotential:0,compressionPotential:0.8,repetitionRisk:0.2,distinctiveness:0.7,score:0.62});
  }
  candidates.sort((a,b)=>b.score-a.score);
  return {candidates:candidates.slice(0,6),relations:meta,readout:events.slice(0,16).map(e=>e.label)};
}
