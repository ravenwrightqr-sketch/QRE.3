import type { ExperiencePattern } from "./patternTypes.js";


import {

identityAtom,
storyAtom,
mediaAtom,
rewardAtom,
reviewAtom,
shareAtom

}
from "../atoms/index.js";


export const productPattern: ExperiencePattern = {


type:"product",


description:
"Product discovery and ownership experience",


atoms:[

identityAtom,

storyAtom,

mediaAtom,

rewardAtom,

reviewAtom,

shareAtom

]


};