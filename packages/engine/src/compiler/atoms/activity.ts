import type { ExperienceAtom } from "./atomTypes.js";


export const activityAtom: ExperienceAtom = {

type:"activity",

component:"timeline",

title:"Activity",

required:false,

payload:{
 timeline:true
}

};