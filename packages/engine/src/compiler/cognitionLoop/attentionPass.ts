/**
 * =====================================================
 * QRE COGNITIVE ATTENTION PASS
 * =====================================================
 *
 * ROLE:
 *
 * Determines what deserves deeper reasoning.
 *
 *
 * Attention is the executive filter
 * before cognitive expansion.
 *
 *
 * Pipeline:
 *
 * Signals
 *    ↓
 * Attention Engine
 *    ↓
 * Cognitive Focus
 *
 * =====================================================
 */


import type {
 CompilerMind
} from "@qre/contracts";


import {
 attention
} from "../attention/attention.js";




export function runAttentionPass(

 mind:CompilerMind

):CompilerMind {



const signals:string[] = [


 ...(
  mind.cognitionLoop?.history
  ?? []
 )


];



const result =

 attention(
  signals
 );




return {


 ...mind,


 cognitionLoop:{


  ...mind.cognitionLoop!,


  attention:{
 
 focus:
  result.selected[0] ?? "none",

 priority:
  result.priority,

 reason:
  result.reason

},

  phase:"hypothesis",


  history:[


   ...(mind.cognitionLoop?.history ?? []),


   "Attention allocation completed"


  ],


  lastAction:

   "Selected cognitive focus"


 }



};



}