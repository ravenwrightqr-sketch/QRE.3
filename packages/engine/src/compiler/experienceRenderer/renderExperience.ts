import type {
 ExperienceBlueprint
} from "@qre/contracts";


import type {
 ExperienceOutput
} from "./types.js";




export function renderExperience(

 blueprint:ExperienceBlueprint

):ExperienceOutput {


const moments =
 blueprint.moments ?? [];




const title =
 blueprint.title
 ??
 "Experience";



const renderedMoments =

 moments.map(

(moment,index)=>( {


order:
 index + 1,


title:
 moment.title,


description:
 moment.description
 ??
 "The experience continues.",


status:
 "created",


emotionalContext:

 blueprint.tone?.join(", ")
 ??
 "personal",


suggestedMedia:

[
 "photo",
 "video",
 "voice",
 "location"
]


})

);




return {


title,



opening:


`${title} begins.

Follow the journey as each moment unfolds.`,



moments:

 renderedMoments,



closing:


`${title} has become a recorded experience.

Future interactions can continue adding new moments.`,



shareMessage:


`A new experience was created:

${title}

Open the journey.`



};


}