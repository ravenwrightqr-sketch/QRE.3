export interface ConceptInput {

    name:string;

    domain:string;

    properties:string[];

}



export interface BridgeConnection {

    from:ConceptInput;

    to:ConceptInput;

    sharedPatterns:string[];

    bridgeStatement:string;

    novelty:number;

    confidence:number;

}