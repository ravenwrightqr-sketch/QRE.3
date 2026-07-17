import type { ExperiencePattern } from "./patternTypes.js";


import {

identityAtom,
storyAtom,
rewardAtom,
reviewAtom,
shareAtom,
followupAtom

}
from "../atoms/index.js";


export const businessPattern:ExperiencePattern={


type:"business",


description:
"Customer engagement experience",


atoms:[

identityAtom,

storyAtom,

rewardAtom,

reviewAtom,

shareAtom,

followupAtom

]


};