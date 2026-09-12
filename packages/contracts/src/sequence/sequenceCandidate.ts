/** Grounded semantic candidates for the canonical QRE sequence. */
export type SequenceEvent = { id:string; order:number; fact:string; actor?:string; object?:string; place?:string; stateBefore?:string; stateAfter?:string; confidence:number };
export type SequenceTrajectoryStep = { order:number; operation:"establish"|"contrast"|"recur"|"reframe"|"escalate"|"converge"|"reveal"|"consequence"|"payoff"; eventIds:string[]; viewerChange:string; nextQuestion:string };
export type SequenceCandidate = {
 id:string; lens:string; anchorEventIds:string[]; supportingRelationKinds:string[]; trajectory:SequenceTrajectoryStep[]; payoff:string; unresolvedQuestion:string; evidence:string[]; hypothesis:string[];
 truthRisk:number; novelty:number; specificity:number; informationValue:number; uncertainty:number; attentionPotential:number; consequencePotential:number; callbackPotential:number; compressionPotential:number; repetitionRisk:number; distinctiveness:number; score:number;
};
