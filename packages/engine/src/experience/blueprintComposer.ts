/**
 * =====================================================
 * QRE EXPERIENCE BLUEPRINT COMPOSER
 * =====================================================
 *
 * Experience Genome
 *        ↓
 * Object Moments
 *        ↓
 * Experience Blueprint
 *
 * Pure composition layer.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {

  ExperienceBlueprint,

  ExperienceGenome,

  ExperienceMoment,

  ExperienceComponent,

  ExperienceTone,

  ExperienceGoal,

  ExperienceType,

  ExperienceIndustry,

  ExperienceMomentType,

  ObjectMoment,

} from "@qre/contracts";







/**
 * =====================================================
 * MOMENT → COMPONENT
 * =====================================================
 */


function resolveComponent(

  type: ExperienceMomentType

): ExperienceComponent {



  const components:

  Partial<

    Record<

      ExperienceMomentType,

      ExperienceComponent

    >

  > = {


    welcome:
      "hero",


    introduction:
      "hero",


    story:
      "story",


    memory:
      "memory",


    timeline:
      "timeline",


    photos:
      "gallery",


    video:
      "video",


    soundtrack:
      "video",


    location:
      "geo_memory",


    venue:
      "geo_memory",


    product:
      "product",


    reward:
      "reward",


    share:
      "social",


    social:
      "social",


    profile:
      "profile",


    cta:
      "cta",


    care_instructions:
      "education",


    education:
      "education",


    reveal:
      "story",


    legacy:
      "timeline",


    future:
      "story",


  };



  return (

    components[type]

    ??

    "story"

  ) as ExperienceComponent;


}



/**
 * =====================================================
 * EXPERIENCE TYPE
 * =====================================================
 */


function resolveType(

 genome: ExperienceGenome

):ExperienceType {



  if(

    genome.memory >= .7

  ){

    return "story";

  }

  if(

    genome.discovery >= .7

  ){

    return "journey";

  }



  if(

    genome.commerce >= .7

  ){

    return "business";

  }



  return "journey";


}









/**
 * =====================================================
 * TITLE ENGINE
 * =====================================================
 */


function createTitle(

 genome:ExperienceGenome

):string {



  if(

    genome.meaning.memories.length

  ){

    return genome.meaning.memories[0];

  }



  if(

    genome.entities.people.length

  ){

    return `${genome.entities.people[0]} Story`;

  }



  if(

    genome.entities.places.length

  ){

    return `${genome.entities.places[0]} Experience`;

  }



  if(

    genome.meaning.desiredFeeling.length

  ){

    return `${genome.meaning.desiredFeeling[0]} Experience`;

  }



  return "QRE Experience";


}









/**
 * =====================================================
 *
 * OBJECT MOMENT COMPILER
 *
 * Object Genome → Experience Moment
 *
 * =====================================================
 */


function buildMoment(

  objectMoment:ObjectMoment,

  index:number,

  genome:ExperienceGenome

):ExperienceMoment {



  const typeMap:

  Record<string,ExperienceMomentType> = {


    Origin:
      "introduction",


    "First Encounter":
      "story",


    "Memory Capture":
      "memory",


    Relationship:
      "story",


    "Place Experience":
      "location",


    Legacy:
      "legacy",


    Future:
      "future",


  };





  const type:

  ExperienceMomentType =

    typeMap[objectMoment.title]

    ??

    "story";







  return {


    type,



    component:

      resolveComponent(type),



    title:

      objectMoment.title,



    subtitle:

      objectMoment.description,



    description:

      objectMoment.description,



    order:

      index,



    editable:

      true,



    demo:

      false,



    payload:{


      text:

        objectMoment.description,



      data:{


        objectMoment,


        meaning:

          genome.meaning,


        entities:

          genome.entities,


        relationships:

          genome.relationships,


        semanticDNA:

          genome.dna,


        symbols:

          genome.symbols,


      }


    }


  };


}









/**
 * =====================================================
 *
 * MOMENT PIPELINE
 *
 * =====================================================
 */


function compileMoments(

 genome:ExperienceGenome

):ExperienceMoment[] {



  const moments:

  ObjectMoment[] =

    genome.object?.moments

    ??

    [];





  return moments.map(

    (moment,index)=>

      buildMoment(

        moment,

        index,

        genome

      )

  );


}









/**
 * =====================================================
 *
 * PUBLIC BLUEPRINT COMPOSER
 *
 * Genome → Blueprint
 *
 * =====================================================
 */


export function composeBlueprint(

 genome:ExperienceGenome

):ExperienceBlueprint {



  if(!genome){

    throw new Error(

      "Cannot compose blueprint without genome"

    );

  }






  const moments =

    compileMoments(genome);







  const tone:

  ExperienceTone[] =

  [

    genome.energy,

    ...genome.emotions,

    ...genome.tone

  ]

  .filter(

    (value):value is ExperienceTone =>

      typeof value === "string"

  );









  return {


    title:

      createTitle(genome),



    type:

      resolveType(genome),



    tone:

      [

        ...new Set(tone)

      ],



    meaning:

      genome.meaning,



    moments,



    entities:

      genome.entities,

   metadata:{


  archetypes:

    genome.archetypes,


  themes:

    genome.themes,


  dna:

    genome.dna,


}


  };


}






export const blueprintComposer =

composeBlueprint;