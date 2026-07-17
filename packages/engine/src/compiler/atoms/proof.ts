import type { ExperienceAtom } from "./atomTypes.js";


export const proofAtom: ExperienceAtom = {

type:"proof",

component:"gallery",

title:"Proof",

required:false,

payload:{
 beforeAfter:true,
 evidence:true
}

};