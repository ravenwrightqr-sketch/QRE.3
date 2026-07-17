import type { ExperiencePattern } from "./patternTypes.js";


import {
 storyAtom,
 mediaAtom,
 locationAtom,
 replayAtom,
 shareAtom,
 followupAtom
}
from "../atoms/index.js";


export const memoryPattern:ExperiencePattern = {


type:"memory",


description:
"Memory preservation experience",


atoms:[

 storyAtom,

 mediaAtom,

 locationAtom,

 replayAtom,

 shareAtom,

 followupAtom

]


};