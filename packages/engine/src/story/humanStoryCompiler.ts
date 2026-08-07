import type {
  ExperienceNarrative,
  ExperienceGenome,
  HumanExperienceStory,
  ExperienceWorld
} from "@qre/contracts";

import {
  resolveHumanStoryArchetype
} from "./humanStoryArchetypeResolver.js";

import {
  resolveHumanStoryArc
} from "./humanStoryArcResolver.js";

import {
  createHumanExpressions
} from "./humanStoryExpressionEngine.js";

import {
  resolveHumanMeaning
} from "./humanMeaning.js";


function resolveHumanEmotion(
  genome: ExperienceGenome
): string[] {

  return [
    ...genome.emotions,
    ...genome.tone,
    ...genome.themes
  ]
  .filter(Boolean)
  .filter(
    (value,index,array)=>
      array.indexOf(value) === index
  );

}



function createHumanTitle(
  entity:string
):string {

  return `${entity}'s Journey`;

}



function createDramaticOpening(
  entity:string,
  meaning:string
):string {

  return (
    `${entity} arrived expecting an ordinary moment, ` +
    `but something deeper was waiting to unfold. ` +
    `${meaning}.`
  );

}



function createDramaticClosing(
  entity:string,
  meaning:string
):string {

  return (
    `${entity} left with more than a memory. ` +
    `The moment became part of a story about ${meaning}.`
  );

}



export function compileHumanStory(

  narrative:ExperienceNarrative,

  genome:ExperienceGenome,

  world:ExperienceWorld

):HumanExperienceStory {


const storyContext =
resolveHumanStoryArchetype(
  genome
);



const meaning =
resolveHumanMeaning(
  genome,
  world
);



const storyArc =
resolveHumanStoryArc(
  storyContext
);



const entity =
storyContext.entity;



const emotion =
resolveHumanEmotion(
  genome
);



const moments =
createHumanExpressions(
  storyContext,
  storyArc
)
.map(
  moment => ({

    text:
      moment.text,

    emotion,

    meaning:
      meaning.hiddenMeaning,

    movement:
      meaning.emotionalMovement,

    truth:
      meaning.storyTruth

  })
);



return {


title:
  createHumanTitle(
    entity
  ),



opening:

  createDramaticOpening(
    entity,
    meaning.hiddenMeaning
  ),



moments,



};


}