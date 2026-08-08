export interface BridgeInput {

 bridgeStatement:string;

 fromDomain:string;

 toDomain:string;

 novelty:number;

}



export interface EmergentConcept {

 emergentConcept:string;

 contributingDomains:string[];

 sourceBridges:string[];

 emergenceStrength:number;

}