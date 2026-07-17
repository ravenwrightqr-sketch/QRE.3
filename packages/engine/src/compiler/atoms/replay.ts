import type { ExperienceAtom } from "./atomTypes.js";


export const replayAtom: ExperienceAtom = {

type:"replay",

component:"timeline",

title:"Replay",

required:false,

payload:{
 cinematic:true
}

};