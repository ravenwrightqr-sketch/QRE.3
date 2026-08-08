import type {
  MemoryReveal
} from "@qre/contracts";


export function createMemoryReveal(

 input:{
  entity:string;
  emotion:string;
  meaning:string;
  transformation:string;
 }

):MemoryReveal {


const entity =
 input.entity || "human";


const emotion =
 input.emotion || "wonder";


return {

 type:"memory_reveal",


 title:
  entity === "dog"
   ?
   "The Life Before You"
   :
   "A Life Waiting To Be Discovered",


 description:
  entity === "dog"
   ?
   "A forgotten life waiting for a connection."
   :
   "A hidden history waiting to be revealed.",


 meaningAnchor:
  input.meaning,


 emotion,


 entity,


 transformation:
  input.transformation

};

}