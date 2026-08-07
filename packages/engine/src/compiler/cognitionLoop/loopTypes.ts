export interface CognitiveHypothesis {

  statement:string;

  confidence:number;

  source:string;

}



export interface CognitivePrediction {

  outcome:string;

  probability:number;

  reason:string;

}



export interface IdentityEvolution {

  before:string;

  transition:string;

  after:string;

}



export interface EmotionalEnergyField {

  love:number;

  curiosity:number;

  trust:number;

  wonder:number;

  belonging:number;

  legacy:number;

}



export interface CognitiveEvolutionState {


  iteration:number;


  confidence:number;


  stability:number;


  novelty:number;


  hypotheses:CognitiveHypothesis[];


  predictions:CognitivePrediction[];


  identities:IdentityEvolution[];


  energy:EmotionalEnergyField;


  contradictions:string[];


  history:string[];

}