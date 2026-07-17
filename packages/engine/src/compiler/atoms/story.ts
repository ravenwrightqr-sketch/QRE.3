import type { ExperienceAtom } from "./atomTypes.js";


export const storyAtom: ExperienceAtom = {

type:"story",

component:"story",

title:"Story",

required:false,

payload:{
 prompt:
 "Tell the story behind this moment"
}

};