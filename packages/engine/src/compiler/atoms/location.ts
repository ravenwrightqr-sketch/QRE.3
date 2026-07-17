import type { ExperienceAtom } from "./atomTypes.js";


export const locationAtom: ExperienceAtom = {

type:"location",

component:"geo_memory",

title:"Location Memory",

required:false,

payload:{
 geoMemory:true,
 snapshot:true,
 timeline:true
}

};