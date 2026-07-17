import type { ExperienceAtom } from "./atomTypes.js";


export const terpeneAtom: ExperienceAtom = {

  type:"terpene",

  component:"product",

  title:"Profile Data",

  description:
    "Product characteristics and details",

  required:false,

  payload:{
    profile:true
  }

};