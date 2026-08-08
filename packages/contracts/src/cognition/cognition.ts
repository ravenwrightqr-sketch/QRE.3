/**
 * =====================================================
 * QRE COGNITION TYPES
 * =====================================================
 *
 * The cognitive cycle output.
 *
 * =====================================================
 */
/**
 * =====================================================
 * QRE COGNITION TYPES
 * =====================================================
 *
 * The cognitive cycle output.
 *
 * =====================================================
 */
import type {
    Attention
} from "./attention.js";


export interface Cognition {


    /**
     * Original input.
     */
    input:string;

    attention: Attention;

    /**
     * Current attention focus.
     */
    focus:string;



    /**
     * Initial generated thought.
     */
    thought:string;



    /**
     * Raw observations.
     */
    observations:string[];



    /**
     * Connected patterns discovered.
     */
    connections:string[];



    /**
     * Generated future possibilities.
     */
    simulations:string[];



    /**
     * Next inquiry generated.
     */
    question:string;



    /**
     * Self criticism.
     */
    critique:string;



    /**
     * Reasoning reflection.
     */
    reflection:string;



    /**
     * Learning adjustment.
     */
    adaptation:string;
     cycle:string;

   stage:string[];
    

    /**
     * Confidence score.
     */
    confidence:number;


}