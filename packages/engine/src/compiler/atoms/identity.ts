import type { ExperienceAtom } from "./atomTypes.js";


export const identityAtom: ExperienceAtom = {

type:"identity",

component:"profile",

title:"Identity",

description:
"Who or what is part of this experience",

required:true,

payload:{
 profile:true
}

};