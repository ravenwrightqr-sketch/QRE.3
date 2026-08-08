/**
 * =====================================================
 * QRE COMPILER CONTEXT
 * =====================================================
 *
 * Temporary intelligence state of the experience compiler.
 *  
 * This is the creative workspace.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO EXECUTION
 * DONT USE YET NOT IN MY PATH. 
 * =====================================================
 */


import type {

  ExperienceUnderstanding,
  ExperienceMeaning,
  ExperienceGenome

} from "@qre/contracts";



export interface CompilerContext {

  id:string;


  input:string;



  understanding?:
    ExperienceUnderstanding;



  meaning?:
    ExperienceMeaning;



  genome?:
    ExperienceGenome;



  concepts:string[];



  emotions:string[];



  patterns:string[];



  possibilities:string[];



  discoveries:string[];



  confidence:number;



  createdAt:number;


}



export function createCompilerContext(

 input:string

):CompilerContext {


 return {


  id:
    crypto.randomUUID(),



  input,



  concepts:[],


  emotions:[],


  patterns:[],


  possibilities:[],


  discoveries:[],



  confidence:.5,



  createdAt:
    Date.now()


 };


}