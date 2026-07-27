import type {
    Inquiry
} from "../inquiry/types.js";


export interface CognitiveState {

    id:string;

    input:string;

    focus:string[];

    observations:string[];

    thoughts:string[];

    questions:Inquiry[];

    hypotheses:string[];

    simulations:string[];

    beliefs:string[];

    memories:string[];

    discoveries:string[];

    goals:string[];

    history:string[];

    confidence:number;

    curiosity:number;

    energy:number;

    timestamp:number;

}