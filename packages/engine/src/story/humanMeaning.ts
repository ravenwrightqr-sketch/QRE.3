import type {
  ExperienceGenome,
  ExperienceWorld
} from "@qre/contracts";


export interface HumanMeaning {

  subject:string;

  ordinaryMoment:string;

  hiddenMeaning:string;

  emotionalMovement:string;

  storyTruth:string;

}



export function resolveHumanMeaning(

  genome:ExperienceGenome,

  world:ExperienceWorld

):HumanMeaning {


const subject =

  genome.entities.creatures?.[0]

  ??

  genome.entities.people?.[0]

  ??

  genome.entities.objects?.[0]

  ??

  "Someone";



const ordinaryMoment =

resolveMoment(
  genome
);



const hiddenMeaning =

resolveMeaning(
  genome,
  world
);



const emotionalMovement =

resolveEmotionalMovement(
  genome,
  world
);



const storyTruth =

resolveStoryTruth(
  subject,
  hiddenMeaning
);



return {

subject,

ordinaryMoment,

hiddenMeaning,

emotionalMovement,

storyTruth

};

}




function resolveMoment(

genome:ExperienceGenome

):string {


if(
genome.entities.creatures?.length
){

return (
"a companion entering a moment of care, trust, and connection"
);

}



if(
genome.entities.people?.length
){

return (
"a human moment shaped by emotion and relationship"
);

}



if(
genome.entities.objects?.length
){

return (
"an object carrying personal history and meaning"
);

}



return (
"an ordinary moment waiting to reveal its meaning"
);

}





function resolveMeaning(

genome:ExperienceGenome,

world:ExperienceWorld

):string {


/*
 Priority:
 
 Entity meaning
      ↓
 Emotional context
      ↓
 World purpose

*/


// Companion intelligence

if(

genome.entities.creatures?.length

&&

(
genome.themes.includes("care")
||
genome.themes.includes("grooming")
||
genome.interaction >= .4
)

){

return (
"the bond between a companion and those who care for them"
);

}



// Memory meaning

if(

genome.memory >= .6

){

return (
"preserving a moment that deserves to be remembered"
);

}



// Human relationship

if(

genome.entities.people?.length

&&

genome.relationships.length

){

return (
"the connection between people"
);

}



// Participation

if(

genome.interaction >= .6

){

return (
"trust built through shared experience"
);

}



return (

world.purpose

??

"discovering meaning inside an ordinary moment"

);

}





function resolveEmotionalMovement(

genome:ExperienceGenome,

world:ExperienceWorld

):string {


const movement:string[] = [];


movement.push(
"arrival"
);



if(

genome.entities.creatures?.length

){

movement.push(
"trust"
);

movement.push(
"companionship"
);

}

else if(

genome.relationships.length

){

movement.push(
"connection"
);

}



if(

genome.memory >= .5

||
genome.replay >= .5

){

movement.push(
"memory"
);

}



movement.push(
"meaning"
);



return movement.join(", ");

}





function resolveStoryTruth(

subject:string,

meaning:string

):string {


return (

`${subject}'s moment became a story about ${meaning}.`

);

}