export interface CognitiveEvent {

    process:string;

    outcome:string;

    confidence:number;

    success:boolean;

}



export interface MetaState {

    strategies:string[];

    successfulPatterns:string[];

    failedPatterns:string[];

    cognitiveScore:number;

}