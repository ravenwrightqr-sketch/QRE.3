/**
 * =====================================================
 * QRE WORLD MODEL CONTRACT
 * =====================================================
 *
 * Reality construction intelligence.
 *
 * ORION:
 * "Why does this experience exist?"
 *
 * WORLD MODEL:
 * "What reality should exist around that meaning?"
 *
 * Defines:
 *
 * - world identity
 * - entities
 * - rules
 * - atmosphere
 * - emotional laws
 * - interaction possibilities
 * - narrative environment
 *
 * NO DATABASE.
 * NO RUNTIME.
 *
 * =====================================================
 */



export interface WorldObservation {


    concept:string;


    domain:string;


    evidence:string[];


    confidence:number;


}








export interface WorldRule {


    principle:string;


    effect:string;


    reason:string;


}








export interface WorldEntity {


    name:string;


    category:
        | "person"
        | "place"
        | "object"
        | "creature"
        | "symbol"
        | "concept"
        | "memory"
        | "unknown";



    role:string;


}








export interface WorldAtmosphere {


    tone:string[];


    sensory:string[];


    emotional:string[];


}








export interface WorldInteraction {


    action:string;


    outcome:string;


    purpose:string;


}









export interface WorldModel {



    /**
     * Original perception layer
     */
    observations:
        WorldObservation[];





    /**
     * Discovered repeating meaning
     */
    knownPatterns:
        string[];





    /**
     * Unknown areas requiring discovery
     */
    uncertainty:
        string[];






    /**
     * Identity of the created reality
     */
    worldName:
        string;





    /**
     * What kind of world this is
     */
    worldType:
        string;





    /**
     * Things that exist inside the world
     */
    entities:
        WorldEntity[];





    /**
     * Laws that govern the experience
     */
    rules:
        WorldRule[];





    /**
     * Emotional and sensory design
     */
    atmosphere:
        WorldAtmosphere;





    /**
     * Ways participants can engage
     */
    interactions:
        WorldInteraction[];





    /**
     * Core reason this world exists
     */
    purpose:
        string;

}
