export interface AdaptationInput {

    previousConfidence:number;

    newEvidence:string[];

    contradictions:string[];

}



export interface AdaptationResult {

    previousState:string;

    updatedState:string;

    confidenceChange:number;

    adaptationReason:string;

}