export interface WorldObservation {

    concept:string;

    domain:string;

    evidence:string[];

    confidence:number;

}



export interface WorldModel {

    observations:WorldObservation[];

    knownPatterns:string[];

    uncertainty:string[];

}