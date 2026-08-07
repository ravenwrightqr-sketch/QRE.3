import type {
  OriginCognitiveState,
  Inquiry
} from "@qre/contracts";

import {
  createInquiry
} from "../inquiry/inquiry.js";


function semanticComplexity(
  input:string
):number {

  const words =
    input
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  return Math.min(
    1,
    words.length / 40
  );

}


function initialCuriosity(
  complexity:number
):number {

  return Math.min(
    1,
    0.35 + complexity * 0.5
  );

}


function initialConfidence(
  complexity:number
):number {

  return Math.max(
    0.2,
    0.8 - complexity * 0.35
  );

}


function extractFocus(
  input:string
):string[] {

  return input
    .split(/\s+/)
    .map(word =>
      word
        .replace(/[^\w']/g,"")
        .trim()
    )
    .filter(word =>
      word.length > 3
    )
    .slice(0,5);

}


function generateInitialQuestions(
  input:string,
  focus:string[]
):Inquiry[] {


  const subject =
    focus.join(" ");


  return [

    createInquiry(
      `What makes ${subject} meaningful?`
    ),

    createInquiry(
      `What transformation could happen through ${subject}?`
    ),

    createInquiry(
      `What memory, relationship, or emotion is hidden inside ${subject}?`
    )

  ];

}


export function createState(
  input:string
):OriginCognitiveState {


  if(!input.trim()){

    throw new Error(
      "Cannot initialize cognition without input."
    );

  }


  const complexity =
    semanticComplexity(input);


  const focus =
    extractFocus(input);


  return {

    id:
      crypto.randomUUID(),

    input,


    focus,


    observations:[],

    thoughts:[],


    questions:
      generateInitialQuestions(
        input,
        focus
      ),


    hypotheses:[],


    simulations:[],


    beliefs:[],


    memories:[],


    discoveries:[],


    goals:[],


    history:[

      `cognition initialized (${input.length} characters)`,

      `semantic complexity ${complexity.toFixed(2)}`,

      `focus extracted: ${focus.join(", ")}`,

      "initial inquiries generated"

    ],


    confidence:
      initialConfidence(
        complexity
      ),


    curiosity:
      initialCuriosity(
        complexity
      ),


    energy:1,


    timestamp:
      Date.now()

  };

}