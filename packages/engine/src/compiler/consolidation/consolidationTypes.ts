export interface MemoryCandidate {

    content:string;

    emotionalWeight:number;

    repetition:number;

    futureInfluence:number;

}



export interface ConsolidatedMemory {

    content:string;

    importance:number;

    reason:string;

    permanent:boolean;

}