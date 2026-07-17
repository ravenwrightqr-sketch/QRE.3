import type { ExperiencePattern } from "./patternTypes.js";

import {
 arrivalAtom,
 identityAtom,
 locationAtom,
 activityAtom,
 proofAtom,
 completionAtom,
 rewardAtom,
 reviewAtom,
 followupAtom
} from "../atoms/index.js";


export const servicePattern: ExperiencePattern = {

type:"service",

description:
"Service journey from arrival to completion",


atoms:[

 arrivalAtom,

 identityAtom,

 locationAtom,

 activityAtom,

 proofAtom,

 completionAtom,

 rewardAtom,

 reviewAtom,

 followupAtom

]

};