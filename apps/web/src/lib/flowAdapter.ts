import type {
 ExperienceBlock
} from "../components/experience/ExperienceBlueprint";


export function flowStepsToBlocks(
 steps:any[]
):ExperienceBlock[] {


return steps.map(
(step,index)=>({

id:
step.id ??
crypto.randomUUID(),


type:
step.type ?? "message",


title:
step.payload?.title ??
`Scene ${index+1}`,


text:
step.payload?.text ??
"",


timer:
step.payload?.timer ??
5,


config:{
 ...step.payload
}

})

);


}