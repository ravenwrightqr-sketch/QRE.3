import type {
  ExperienceNarrative,
  ExperienceGenome,
  HumanExperienceStory,
  ExperienceWorld,
} from "@qre/contracts";

import {
  resolveHumanMeaning,
} from "./humanMeaning.js";


/**
 * =====================================================
 *
 * HUMAN STORY COMPILER
 *
 * Converts cognitive experience intelligence
 * into human narrative.
 *
 * This layer does not invent.
 * It reveals meaning already discovered
 * by the compiler.
 *
 * No templates.
 * No archetype selection.
 * No fixed journeys.
 *
 * =====================================================
 */


export function compileHumanStory(

  narrative: ExperienceNarrative,

  genome: ExperienceGenome,

  world: ExperienceWorld

): HumanExperienceStory {


  const meaning =
    resolveHumanMeaning(
      genome,
      world
    );



  const moments =
    createNarrativeMoments(
      meaning,
      narrative,
      genome
    );



  return {

    title:
      createTitle(
        meaning.subject
      ),


    opening:
      createOpening(
        meaning
      ),


    moments,


  };

}





function createTitle(

  subject:string

):string {


  return (

    `${subject}: A Story Still Becoming`

  );

}





function createOpening(

  meaning:ReturnType<typeof resolveHumanMeaning>

):string {


  return (

    `${meaning.subject} began inside ${meaning.ordinaryReality}. ` +

    `Beneath the surface was a deeper desire for ${meaning.hiddenDesire}. ` +

    `The experience revealed ${meaning.transformation}.`

  );

}





function createNarrativeMoments(

  meaning:ReturnType<typeof resolveHumanMeaning>,

  narrative:ExperienceNarrative,

  genome:ExperienceGenome

){


  const moments = [

    {

      phase:
        "Beginning",


      purpose:
        "establish reality",


      text:

        `${meaning.subject} started from ${meaning.ordinaryReality}, ` +

        `carrying the possibility of something more.`

    },


    {

      phase:
        "Discovery",


      purpose:
        "reveal meaning",


      text:

        `Through the experience, ${meaning.subject} encountered ` +

      meaning.emotionalTension

    },


    {

      phase:
        "Transformation",


      purpose:
        "show change",


      text:

        `What began as a simple moment became ${meaning.transformation}.`

    },


    {

      phase:
        "Memory",


      purpose:
        "create lasting meaning",


      text:

        `${meaning.memoryReason}.`

    }


  ];



  return moments.map(

    moment => ({

      text:
        moment.text,


      emotion:
        discoverEmotion(
          genome
        ),


      meaning:
        meaning.hiddenMeaning,


      movement:
        meaning.emotionalMovement,


      truth:
        meaning.storyTruth,


    })

  );

}





function discoverEmotion(

  genome:ExperienceGenome

):string[]{


  return [

    ...genome.emotions,

    ...genome.tone,

    ...genome.themes,

  ]

  .filter(Boolean)

  .filter(

    (value,index,array)=>

      array.indexOf(value)===index

  );

}