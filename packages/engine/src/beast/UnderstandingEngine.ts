/**
 * =====================================================
 * QRE BEAST UNDERSTANDING ENGINE
 * =====================================================
 *
 * Awareness
 *      ↓
 * Understanding
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


export type BeastAwareness = {

 hasPrompt:boolean;

 hasIndustry:boolean;

 hasGoal:boolean;

 hasUser:boolean;

 hasAsset:boolean;

 hasLocation:boolean;

};



export type BeastUnderstanding = {

 confidence:number;

 completeness:number;

 missing:string[];

};



export function understand(

 awareness:BeastAwareness

):BeastUnderstanding {


const missing:string[]=[];


if(!awareness.hasIndustry)
 missing.push("industry");


if(!awareness.hasGoal)
 missing.push("goal");


if(!awareness.hasPrompt)
 missing.push("prompt");



const known =
6 - missing.length;



return {

 confidence:
  known / 6,

 completeness:
  known / 6,

 missing,

};


}