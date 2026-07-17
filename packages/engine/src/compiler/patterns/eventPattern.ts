import type { ExperiencePattern } from "./patternTypes.js";


import {

arrivalAtom,
locationAtom,
activityAtom,
mediaAtom,
replayAtom,
shareAtom

}
from "../atoms/index.js";


export const eventPattern:ExperiencePattern={


type:"event",


description:
"Live event experience",


atoms:[

arrivalAtom,

locationAtom,

activityAtom,

mediaAtom,

replayAtom,

shareAtom

]


};