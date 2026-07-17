import type { ExperienceAtom } from "./atomTypes.js";


export const mediaAtom: ExperienceAtom = {

type:"media",

component:"gallery",

title:"Media",

required:false,

payload:{
 photos:true,
 video:true
}

};