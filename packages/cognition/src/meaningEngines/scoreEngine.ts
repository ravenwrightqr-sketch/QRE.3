/**
 * =====================================================
 * QRE UNDERSTANDING SCORE ENGINE
 * =====================================================
 *
 * Measures confidence of understanding layers.
 *
 * This does NOT discover meaning.
 *
 * It evaluates:
 *
 * Intent
 * Entities
 * Emotion
 * Memory
 * Audience
 * World
 * DNA
 *
 * Future:
 * adaptive learning weights
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


export type UnderstandingScoreInput = {

 intent: unknown[];

 entities: unknown;

 relationships: unknown[];

 emotions: unknown;

 memory: unknown;

 audience: unknown;

 world: unknown;

 dna: unknown;

};





export type CalculatedUnderstandingScores = {

 semantic:number;

 entity:number;

 relationship:number;

 emotional:number;

 memory:number;

 world:number;

 dna:number;

 overall:number;

};






function signalScore(
 value:unknown
):number {


if(!value){
 return 0;
}



if(
Array.isArray(value)
){

 return Math.min(
 1,
 value.length / 5
 );

}



return .8;

}








export function calculateUnderstandingScores(

input:UnderstandingScoreInput

):CalculatedUnderstandingScores {



const semantic =
 signalScore(input.intent);



const entity =
 signalScore(input.entities);



const relationship =
 signalScore(input.relationships);



const emotional =
 signalScore(input.emotions);



const memory =
 signalScore(input.memory);



const world =
 signalScore(input.world);



const dna =
 signalScore(input.dna);





const overall =
(
 semantic +
 entity +
 relationship +
 emotional +
 memory +
 world +
 dna
)
/7;






return {

 semantic,

 entity,

 relationship,

 emotional,

 memory,

 world,

 dna,

 overall

};



}