import type { ExperienceAtom } from "./atomTypes.js";


export const educationAtom: ExperienceAtom = {

  type:"education",

  component:"education",

  title:"Education",

  description:
    "Teach customers about the product",

  required:false,

  payload:{
    interactive:true
  }

};