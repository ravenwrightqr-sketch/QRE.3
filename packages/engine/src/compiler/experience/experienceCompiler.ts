/**
 * =====================================================
 * QRE EXPERIENCE COMPILER
 * =====================================================
 *
 * Experience Genome
 *        ↓
 * Experience Blueprint
 *
 * Converts creative DNA into composed experience structure.
 *
 * NO DATABASE
 * NO EXECUTION
 * NO PLAYER LOGIC
 *
 * =====================================================
 */


import type {

  ExperienceGenome,
  ExperienceBlueprint,
  ExperienceMoment,
  ExperienceType,
  ExperienceTone,
  ExperienceComponent,

} from "@qre/contracts";





/**
 * =====================================================
 * EXPERIENCE TYPE RESOLUTION
 * =====================================================
 */


function resolveType(
 genome:ExperienceGenome
):ExperienceType {


if(
 genome.commerce >= .7
){

return "business" as ExperienceType;

}



if(
 genome.memory >= .7 ||
 genome.replay >= .7
){

return "story" as ExperienceType;

}



if(
 genome.discovery >= .7 ||
 genome.journey.length > 0
){

return "journey" as ExperienceType;

}



return "story" as ExperienceType;


}






/**
 * =====================================================
 * TONE RESOLUTION
 * =====================================================
 */


function resolveTone(

 genome:ExperienceGenome

):readonly ExperienceTone[] {


return [

...new Set(

[

...genome.emotions,

...genome.tone

]

.filter(Boolean)

.map(
 emotion =>
 emotion as ExperienceTone
)

)

];


}






/**
 * =====================================================
 * COMPONENT RESOLUTION
 * =====================================================
 */


function resolveComponent(

 type:string

):ExperienceComponent {


switch(type){


case "memory":

return "memory" as ExperienceComponent;



case "social":

return "social" as ExperienceComponent;



case "location":

return "geo_memory" as ExperienceComponent;



case "discovery":

return "story" as ExperienceComponent;



case "reward":

return "reward" as ExperienceComponent;



default:

return "story" as ExperienceComponent;


}



}








/**
 * =====================================================
 * MOMENT TYPE INTELLIGENCE
 * =====================================================
 */


function resolveMomentType(

 moment:any,

 genome:ExperienceGenome

):string {


const title =

(moment.title ?? "")
.toLowerCase();



const emotions =

moment.emotions ?? [];





if(
 emotions.includes(
  "nostalgia"
 )
 ||
 emotions.includes(
  "memory"
 )
){

return "memory";

}




if(
 emotions.includes(
  "connection"
 )
 ||
 title.includes(
  "encounter"
 )
){

return "social";

}





if(
 title.includes(
  "adventure"
 )
 ||
 genome.discovery >= .7
 &&
 title.includes(
  "discover"
 )
){

return "discovery";

}





if(
 title.includes(
  "origin"
 )
){

return "arrival";

}





if(
 title.includes(
  "legacy"
 )
){

return "legacy";

}





return "story";


}









/**
 * =====================================================
 * MOMENT COMPILER
 * =====================================================
 */
 function compileMoments(

  genome:ExperienceGenome

):ExperienceMoment[] {


const moments =

  genome.object?.moments

  ??

  [];





return moments.map(

(moment,index)=>{


const type =

resolveMomentType(

  moment,

  genome

);





return {


type:

  type as ExperienceMoment["type"],





component:

resolveComponent(

  type

),



title:

  moment.title,

subtitle:

  undefined,


description:

  moment.description,

editable:

  true,


demo:

  false,


order:

  index,


payload:{


  text:

    moment.description,


  data:{


    /**
     * Compiler intelligence.
     *
     * Not runtime.
     * Not player-facing.
     *
     * Stored for future AI learning.
     */

    objectMoment:

      moment,



    emotions:

      moment.emotions ?? [],



    significance:

      moment.significance ?? .5,



    genomeSignals:{


      themes:

        genome.themes ?? [],



      dna:

        genome.dna ?? [],



      environment:

        genome.environments ?? []


    }


  }


}


};


}


);


}


/**
 * =====================================================
 * TITLE GENERATOR
 * =====================================================
 */


function createTitle(

genome:ExperienceGenome

):string {


if(

genome.meaning?.why?.length

){

return genome.meaning.why.join(
" • "
);

}



if(

genome.themes?.length

){

return genome.themes.join(
" • "
);

}



return "QRE Experience";


}








/**
 * =====================================================
 * PUBLIC COMPILER
 *
 * Genome → Blueprint
 *
 * =====================================================
 */


export function compileExperience(

 genome:ExperienceGenome

):ExperienceBlueprint {



if(
!genome
){

throw new Error(

"Cannot compile experience without genome"

);

}






return {


title:

createTitle(
 genome
),





type:

resolveType(
 genome
),





tone:

resolveTone(
 genome
),





meaning:

genome.meaning,





moments:

compileMoments(
 genome
),





entities:

genome.entities,





metadata:{



archetypes:

genome.archetypes ?? [],



themes:

genome.themes ?? [],



dna:

genome.dna ?? []

}


};


}






export const experienceCompiler =

compileExperience;