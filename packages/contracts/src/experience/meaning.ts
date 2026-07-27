/**
 * =====================================================
 * QRE EXPERIENCE MEANING CONTRACT
 * =====================================================
 *
 * Semantic purpose layer.
 *
 * Human Prompt
 *      ↓
 * Understanding
 *      ↓
 * Meaning
 *      ↓
 * Genome
 *
 * NO DATABASE
 * NO RUNTIME
 * NO INDUSTRY LOGIC
 *
 * =====================================================
 */


export type ExperienceRelationshipMeaning = {

  subject:string;

  object:string;

  type:string;

};
export type ExperienceMeaning = {

why:string[];

relationship?:{

subject:string;

object:string;

type:string;

};


emotions:string[];


memories:string[];


desiredFeeling:string[];


transformation:string[];


};