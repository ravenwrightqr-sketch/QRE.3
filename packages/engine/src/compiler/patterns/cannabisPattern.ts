import type { ExperiencePattern } from "./patternTypes.js";


import {

productAtom,
storyAtom,
educationAtom,
terpeneAtom,
mediaAtom,
rewardAtom,
shareAtom

}
from "../atoms/index.js";


export const cannabisPattern: ExperiencePattern = {


type:"product",


description:
"Premium cannabis product passport experience",


atoms:[

 productAtom,

 storyAtom,

 educationAtom,

 terpeneAtom,

 mediaAtom,

 rewardAtom,

 shareAtom

]


};