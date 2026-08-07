import {
  compileExperienceGenome
} from "../../experience/genomeCompiler.js";

import {
  compileHumanStory
} from "../../story/humanStoryCompiler.js";

import {
  renderExperience
} from "../experienceRenderer/renderExperience.js";


export function generateCompilerPreview(
  prompt: string
) {

  const compiled =
    compileExperienceGenome(
      prompt
    );


  console.log(
    "GENOME ENTITIES",
    JSON.stringify(
      compiled.genome.entities,
      null,
      2
    )
  );


  const experience =
    renderExperience(
      compiled.blueprint
    );


  const humanStory =
    compileHumanStory(
      compiled.narrative,
      compiled.genome,
      compiled.world
    );


  return {

    input:
      prompt,


    genome:
      compiled.genome,


    blueprint:
      compiled.blueprint,


    world:
      compiled.world,


    narrative:
      compiled.narrative,


    experience,


    humanStory

  };

}