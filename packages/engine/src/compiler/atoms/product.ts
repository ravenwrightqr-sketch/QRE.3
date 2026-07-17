import type { ExperienceAtom } from "./atomTypes.js";


export const productAtom: ExperienceAtom = {

  type:"product",

  component:"product",

  title:"Product Identity",

  description:
    "Product ownership and identity",

  required:true,

  payload:{
    passport:true,
    metadata:true
  }

};