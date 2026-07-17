import type { ExperienceAtom } from "./atomTypes.js";


export const shareAtom: ExperienceAtom = {

type:"share",

component:"social",

title:"Share",

required:false,

payload:{
 social:true
}

};