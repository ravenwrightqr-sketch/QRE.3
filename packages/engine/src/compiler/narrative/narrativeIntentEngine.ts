/**
 * =====================================================
 * QRE NARRATIVE INTENT ENGINE
 * =====================================================
 *
 * Determines why an experience exists.
 *
 * Genome
 * +
 * World Intelligence
 * +
 * Blueprint
 *
 * ↓
 *
 * Narrative Intent
 *
 * The purpose of this layer is not to write prose.
 * It creates the dramatic forces that later narrative
 * systems transform into moments and cinematic scenes.
 *
 * =====================================================
 */


import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceBlueprint
} from "@qre/contracts";


export interface NarrativeIntent {

  destination:string;

  purpose:string;

  emotionalNeed:string;

  transformation:string;

  humanQuestion:string;

  narrativeGravity:number;


  // dramatic structure

  beforeState:string;

  catalyst:string;

  afterState:string;

  tension:string;

}




function detectIntentPattern(

  genome:ExperienceGenome,

  world:ExperienceWorld,

  blueprint:ExperienceBlueprint

):string {


  const text =
    JSON.stringify({
      genome,
      world,
      blueprint
    })
    .toLowerCase();



  if(
    world.domain === "memory_world" ||
    (
      world.domain === "journey_world" &&
      world.role === "preserve"
    )
  ){

    return "legacy";

  }



  if(

    world.domain === "identity_world" ||
    world.domain === "community_world" ||
    (
      world.domain === "commerce_world" &&
      text.includes("home")
    )

  ){

    return "belonging";

  }




  if(

    world.role === "connect" ||
    world.role === "guide" ||
    world.domain === "service_world" ||
    text.includes("pet") ||
    text.includes("care")

  ){

    return "connection";

  }





  if(

    world.domain === "discovery_world" ||
    world.role === "discover" ||
    text.includes("journey") ||
    text.includes("discover")

  ){

    return "wonder";

  }





  if(

    world.role === "transform" ||
    world.domain === "transformation_world"

  ){

    return "transformation";

  }




  return "meaning";

}






function calculateWorldGravity(

  world:ExperienceWorld

):number {


  let gravity = .65;



  gravity +=
    world.emotionalPhysics.length * .03;



  gravity +=
    world.worldLaws.length * .03;



  if(world.transformation){

    gravity += .12;

  }



  if(world.signature.semantic.length){

    gravity += .05;

  }



  return Math.min(
    1,
    gravity
  );

}







function calculateNarrativeGravity(

  base:number,

  world:number

):number {


  return Math.min(

    1,

    (base * .65) +
    (world * .35)

  );

}








function createNarrativePressure(

  pattern:string,

  world:ExperienceWorld

){



  switch(pattern){


    case "connection":

      return {

        beforeState:
          "Something meaningful exists but remains unseen.",


        tension:
          "Distance prevents a deeper connection from forming.",


        catalyst:
          `${world.worldIdentity.name} creates a moment where connection becomes possible.`,


        afterState:
          "The experience becomes a remembered bond."

      };





    case "legacy":

      return {

        beforeState:
          "A meaningful moment exists but could disappear with time.",


        tension:
          "The value of the moment risks being forgotten.",


        catalyst:
          "The experience is preserved and transformed into memory.",


        afterState:
          "A temporary moment becomes lasting legacy."

      };






    case "belonging":

      return {

        beforeState:
          "The subject searches for a place or feeling of belonging.",


        tension:
          "The world feels separate from personal identity.",


        catalyst:
          "A meaningful interaction turns space into connection.",


        afterState:
          "A place becomes part of the subject's story."

      };







    case "wonder":

      return {

        beforeState:
          "Something unknown waits beneath the surface.",


        tension:
          "Curiosity creates a need to discover meaning.",


        catalyst:
          "A hidden truth reveals itself through experience.",


        afterState:
          "Discovery changes understanding."

      };







    case "transformation":

      return {

        beforeState:
          "The subject begins in an existing state.",


        tension:
          "Something creates pressure for change.",


        catalyst:
          "A meaningful event triggers transformation.",


        afterState:
          "The subject emerges changed."

      };








    default:

      return {

        beforeState:
          "An ordinary moment begins.",


        tension:
          "The deeper meaning has not yet been discovered.",


        catalyst:
          "An unexpected moment creates significance.",


        afterState:
          "The moment becomes part of a larger story."

      };

  }

}









export function buildNarrativeIntent(

  genome:ExperienceGenome,

  world:ExperienceWorld,

  blueprint:ExperienceBlueprint

):NarrativeIntent {



  const pattern =
    detectIntentPattern(
      genome,
      world,
      blueprint
    );



  const worldGravity =
    calculateWorldGravity(
      world
    );



  const pressure =
    createNarrativePressure(
      pattern,
      world
    );






  switch(pattern){



    case "connection":

      return {

        destination:
          "belonging",


        purpose:
          `${world.worldIdentity.name} creates connection through ${world.role}.`,


        emotionalNeed:
          "To feel understood, valued, and connected.",


        transformation:
          "Distance becomes relationship.",


        humanQuestion:
          "Why does this connection matter?",


        narrativeGravity:
          calculateNarrativeGravity(
            .88,
            worldGravity
          ),


        ...pressure

      };







    case "belonging":

      return {

        destination:
          "home",


        purpose:
          `${world.worldIdentity.name} transforms space into personal meaning.`,


        emotionalNeed:
          "To find identity, safety, and belonging.",


        transformation:
          "Space becomes home.",


        humanQuestion:
          "Could this become part of my story?",


        narrativeGravity:
          calculateNarrativeGravity(
            .86,
            worldGravity
          ),


        ...pressure

      };







    case "legacy":

      return {

        destination:
          "remembrance",


        purpose:
          `${world.worldIdentity.name} preserves meaning beyond the present moment.`,


        emotionalNeed:
          "To keep important experiences alive.",


        transformation:
          "Memory becomes legacy.",


        humanQuestion:
          "What should never be forgotten?",


        narrativeGravity:
          calculateNarrativeGravity(
            .92,
            worldGravity
          ),


        ...pressure

      };








    case "wonder":

      return {

        destination:
          "discovery",


        purpose:
          `${world.worldIdentity.name} reveals hidden meaning through exploration.`,


        emotionalNeed:
          "To understand what was unknown.",


        transformation:
          "Curiosity becomes understanding.",


        humanQuestion:
          "What is waiting to be discovered?",


        narrativeGravity:
          calculateNarrativeGravity(
            .84,
            worldGravity
          ),


        ...pressure

      };









    case "transformation":

      return {

        destination:
          "change",


        purpose:
          `${world.worldIdentity.name} creates meaningful transformation.`,


        emotionalNeed:
          "To evolve beyond the current state.",


        transformation:
          "Experience becomes personal change.",


        humanQuestion:
          "How will this change me?",


        narrativeGravity:
          calculateNarrativeGravity(
            .86,
            worldGravity
          ),


        ...pressure

      };









    default:

      return {

        destination:
          "meaning",


        purpose:
          `${world.worldIdentity.name} transforms ordinary moments into meaningful experiences.`,


        emotionalNeed:
          "To discover significance.",


        transformation:
          "Moment becomes memory.",


        humanQuestion:
          "Why is this important?",


        narrativeGravity:
          worldGravity,


        ...pressure

      };


  }

}