import type { ExperienceAtom } from "./atomTypes.js";


export const rewardAtom: ExperienceAtom = {

type:"reward",

component:"reward",

title:"Reward",

required:false,

payload:{
 tips:true,
 loyalty:true
}

};