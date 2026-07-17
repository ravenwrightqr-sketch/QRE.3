import type { ExperienceAtom } from "./atomTypes.js";


export const arrivalAtom: ExperienceAtom = {

type:"arrival",

component:"geo_memory",

title:"Arrival",

description:
"Capture presence and arrival",

required:true,

payload:{
 captureLocation:true,
 timestamp:true
}

};