import type {
 ExperienceGenome
} from "@qre/contracts";


import type {
 ExperienceScene
} from "./experienceTypes.js";



export function compileScenes(

 genome:ExperienceGenome

):ExperienceScene[] {


return [


{
 id:"arrival",

 type:"arrival",

 title:"The Beginning",

 atmosphere:
 genome.energy,

 emotionalIntent:
 genome.emotions[0] ?? "wonder",

 duration:30

},


{
 id:"discovery",

 type:"discovery",

 title:"The Discovery",

 atmosphere:

 genome.environments[0] ??
 "unknown",

 emotionalIntent:
 "curiosity",

 duration:60

},


{
 id:"reflection",

 type:"reflection",

 title:"The Memory",

 atmosphere:
 "reflection",

 emotionalIntent:
 "meaning",

 duration:45

}


];


}