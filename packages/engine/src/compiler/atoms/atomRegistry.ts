import type { ExperienceAtom } from "./atomTypes.js";


export const atomRegistry: Record<string, ExperienceAtom> = {


arrival: {

type:"arrival",

component:"geo_memory",

title:"Arrival",

description:
"Capture presence, time, and location",

required:true,

payload:{
 captureLocation:true,
 timestamp:true
}

},



identity: {

type:"identity",

component:"profile",

title:"Identity",

description:
"Who or what this experience is about",

required:true,

payload:{
 editable:true
}

},



location: {

type:"location",

component:"geo_memory",

title:"Location",

description:
"Create a place memory",

required:false,

payload:{
 snapshot:true,
 timeline:true
}

},



story: {

type:"story",

component:"story",

title:"Story",

description:
"Capture the story behind the moment",

required:false,

payload:{
 prompt:
 "Tell the story behind this moment",
 media:true
}

},



media: {

type:"media",

component:"gallery",

title:"Media",

description:
"Photos, videos, memories",

required:false,

payload:{
 upload:true
}

},



activity: {

type:"activity",

component:"timeline",

title:"Activity",

description:
"What happened",

required:false,

payload:{
 timeline:true
}

},



proof: {

type:"proof",

component:"gallery",

title:"Proof",

description:
"Evidence of completion",

required:false,

payload:{
 upload:true
}

},



completion: {

type:"completion",

component:"cta",

title:"Completed",

description:
"Experience finished",

required:true,

payload:{
 complete:true
}

},



reward: {

type:"reward",

component:"reward",

title:"Reward",

description:
"Tip, reward, loyalty",

required:false,

payload:{
 action:"reward"
}

},



review: {

type:"review",

component:"review",

title:"Review",

description:
"Customer feedback",

required:false,

payload:{
 rating:true
}

},



share: {

type:"share",

component:"social",

title:"Share",

description:
"Social sharing",

required:false,

payload:{
 share:true
}

},



replay: {

type:"replay",

component:"timeline",

title:"Replay",

description:
"Relive the experience",

required:false,

payload:{
 replay:true
}

},



followup: {

type:"followup",

component:"cta",

title:"Follow Up",

description:
"Future engagement",

required:false,

payload:{
 action:"followup"
}

}


};