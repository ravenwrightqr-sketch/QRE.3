import type {
 ExperienceGenome
} from "@qre/contracts";


import {
 compileScenes
} from "./sceneCompiler.js";


import type {
 ExperienceBlueprint
} from "./experienceTypes.js";




export function compileExperience(

 genome:ExperienceGenome

):ExperienceBlueprint {



return {



  title:
    genome.meaning.why,

  world:
    genome.environments[0] ??
    "unknown",

  dna:
    genome.dna,

  emotions:
    genome.emotions,

  pacing:
    genome.pacing,

  scenes:
    compileScenes(
      genome
    )

}

}
