import type {
  ExperienceGenome,
} from "@qre/contracts";


import type {
  CreationArchitecture,
} from "../creation/creationTypes.js";


import type {
  ExperienceBlueprint,
} from "./blueprintTypes.js";





export function compileBlueprint(

  genome: ExperienceGenome,

  creation: CreationArchitecture

): ExperienceBlueprint {


  return {


    title:
      "Generated Experience",



    intention:

      Array.isArray(
        creation.intention
      )

      ?

      creation.intention.join(", ")

      :

      creation.intention,



    moments:


      creation.structuralPhases.map(

        (phase,index)=>({


          id:
            `moment_${index}`,



          phase,



          purpose:

            creation.emotionalArc[index]

            ??

            "meaningful transition",



          emotionalState:

            Array.isArray(
              creation.emotionalArc
            )

            ?

            creation.emotionalArc

            :

            [
              creation.emotionalArc
            ],



          humanAction:

            creation.interactionPatterns[0]

            ??

            "participate",



          meaningAnchor:

            creation.symbolicElements[0]

            ??

            "memory"


        })

      )


  };


}



export const blueprintCompiler =
compileBlueprint;