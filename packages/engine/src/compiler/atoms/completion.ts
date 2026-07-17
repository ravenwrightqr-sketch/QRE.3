import type { ExperienceAtom } from "./atomTypes.js";


export const completionAtom: ExperienceAtom = {

type:"completion",

component:"cta",

title:"Completion",

required:true,

payload:{
 completed:true
}

};