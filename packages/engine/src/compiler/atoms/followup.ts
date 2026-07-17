import type { ExperienceAtom } from "./atomTypes.js";


export const followupAtom: ExperienceAtom = {

type:"followup",

component:"cta",

title:"Follow Up",

required:false,

payload:{
 reminder:true
}

};